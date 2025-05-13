package algorithm

import (
	"backend/search"
	"fmt"
	"sort"
	"sync"
)

var usedElemCombMutex = sync.Mutex{}
var usedElemComb = make(map[string]map[string]bool)

type AncestryChain struct {
	Element string
	Parents *AncestryChain
}

func getAncSignature(chain *AncestryChain) string {
	if chain == nil {
		return ""
	}

	if chain.Parents == nil {
		return chain.Element
	}

	return fmt.Sprintf("%s<-%s", chain.Element, getAncSignature(chain.Parents))
}

func isElemCombUsed(result string, elem1ID, elem2ID int, ancestryChain *AncestryChain) bool {
	ids := []int{elem1ID, elem2ID}
	sort.Ints(ids)
	combKey := fmt.Sprintf("%d+%d", ids[0], ids[1])
	ancSignature := getAncSignature(ancestryChain)
	combMapKey := fmt.Sprintf("%s:%s", result, ancSignature)

	if _, exists := usedElemComb[combMapKey]; !exists {
		usedElemComb[combMapKey] = make(map[string]bool)
		return false
	}

	return usedElemComb[combMapKey][combKey]
}

func markElemCombUsed(result string, elem1ID, elem2ID int, ancestryChain *AncestryChain) {
	ids := []int{elem1ID, elem2ID}
	sort.Ints(ids)
	combKey := fmt.Sprintf("%d+%d", ids[0], ids[1])
	ancSignature := getAncSignature(ancestryChain)
	combMapKey := fmt.Sprintf("%s:%s", result, ancSignature)

	if _, exists := usedElemComb[combMapKey]; !exists {
		usedElemComb[combMapKey] = make(map[string]bool)
	}

	usedElemComb[combMapKey][combKey] = true
}

type JSONNode struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type BFSState struct {
	Node          *search.ElementNode
	Parent        *BFSState
	Depth         int
	AncestryChain *AncestryChain
}

type JSONEdge struct {
	From int `json:"from"`
	To   int `json:"to"`
}

type GraphJSON struct {
	Nodes []JSONNode `json:"nodes"`
	Edges []JSONEdge `json:"edges"`
}

func isNoRecipe(node *search.ElementNode) bool {
	for _, recipe := range node.Recipes {
		if len(recipe) == 2 && recipe[0].Name == "" && recipe[1].Name == "" {
			return true
		}
	}
	return false
}

func isBaseElement(node *search.ElementNode) bool {
	if node.Name == "Air" || node.Name == "Earth" || node.Name == "Fire" || node.Name == "Water" {
		return true
	}
	return false
}

type JSONRecipe struct {
	Ingredients []string `json:"ingredients"`
	Result      string   `json:"result"`
	Step        int      `json:"step"`
}

type GraphJSONWithRecipes struct {
	Nodes   []JSONNode   `json:"nodes"`
	Recipes []JSONRecipe `json:"recipes"`
}

type QueueItem struct {
	Node          *search.ElementNode
	AncestryChain *AncestryChain
	Depth         int
}

type BFSProgressResult struct {
	recipes      []JSONRecipe
	nodes        []JSONNode
	visitedNodes int
	iteration    int
}

func ReverseBFS(target *search.ElementNode, pathNumber int) (*GraphJSONWithRecipes, int) {
	if isBaseElement(target) {
		return nil, 0
	}

	// End result of the search
	var nodes []JSONNode
	var recipes []JSONRecipe

	// Start with target node and empty ancestry
	queue := []QueueItem{
		{
			Node: target,
			AncestryChain: &AncestryChain{
				Element: target.Name,
				Parents: nil,
			},
			Depth: 0,
		},
	}

	// Add target to results
	nodesToInclude := make(map[int]bool)
	nodesToInclude[target.ID] = true
	nodes = append(nodes, JSONNode{
		ID:   target.ID,
		Name: target.Name,
	})
	// Recipe map to prevent duplicate JSONRecipe
	addedRecipe := make(map[string]bool)

	maxIterations := 1000
	iteration := 0
	visitedNodes := 0

	nthreads := 4
	for len(queue) > 0 && iteration < maxIterations {
		nextFrontier := make([]QueueItem, 0)
		taskChannel := make(chan QueueItem)
		nextFrontierChannel := make(chan QueueItem)

		var wg sync.WaitGroup
		wg.Add(nthreads)
		progresses := make([]BFSProgressResult, nthreads)
		for i := range nthreads {
			progresses[i] = BFSProgressResult{
				recipes:      make([]JSONRecipe, 0),
				nodes:        make([]JSONNode, 0),
				visitedNodes: 0,
				iteration:    0,
			}
			go ProcessQueue(taskChannel, nextFrontierChannel, &progresses[i], &wg)
		}

		// Receive results from routines
		go func() {
			for {
				item, ok := <-nextFrontierChannel
				if !ok {
					return
				}
				nextFrontier = append(nextFrontier, item)
			}
		}()
		// Send tasks to routines
		for _, task := range queue {
			taskChannel <- task
		}
		close(taskChannel)

		// All routine done processing this level
		wg.Wait()
		close(nextFrontierChannel)
		// Merge the results of each routines
		for _, progress := range progresses {
			visitedNodes += progress.visitedNodes
			iteration += progress.iteration

			// Merge recipes uniquely
			for _, recipe := range progress.recipes {
				recipeSignature := fmt.Sprintf("%s=%s+%s@%d", recipe.Result, recipe.Ingredients[0], recipe.Ingredients[1], recipe.Step)
				if _, exists := addedRecipe[recipeSignature]; !exists {
					addedRecipe[recipeSignature] = true
					recipes = append(recipes, recipe)
				}
			}
			// Merge all used nodes in recipes
			for _, node := range progress.nodes {
				if !nodesToInclude[node.ID] {
					nodesToInclude[node.ID] = true
					nodes = append(nodes, node)
				}
			}
		}

		queue = nextFrontier
	}

	if iteration >= maxIterations {
		fmt.Printf("Warning: Reached max iterations (%d) for path %d\n", maxIterations, pathNumber)
	}

	return &GraphJSONWithRecipes{
		Nodes:   nodes,
		Recipes: recipes,
	}, visitedNodes
}

func ResetCaches() {
	usedElemComb = make(map[string]map[string]bool)
}

func ProcessQueue(task chan QueueItem, next chan QueueItem, result *BFSProgressResult, wg *sync.WaitGroup) {
	defer func() {
		wg.Done()
		// fmt.Println("Routine finished")
	}()

	for {
		item, ok := <-task
		if !ok {
			break
		}

		// fmt.Println("Processing item:", item.Node.Name, "Depth:", item.Depth)

		result.iteration++
		result.visitedNodes++

		if isBaseElement(item.Node) {
			continue
		}
		if isNoRecipe(item.Node) {
			continue
		}

		for _, recipe := range item.Node.Recipes {
			if len(recipe) != 2 || recipe[0] == nil || recipe[1] == nil {
				continue
			}

			if (isNoRecipe(recipe[0]) && !isBaseElement(recipe[0])) || (isNoRecipe(recipe[1]) && !isBaseElement(recipe[1])) {
				continue
			}
			if recipe[0].Tier >= item.Node.Tier || recipe[1].Tier >= item.Node.Tier {
				continue
			}

			usedElemCombMutex.Lock()
			if isElemCombUsed(item.Node.Name, recipe[0].ID, recipe[1].ID, item.AncestryChain) {
				usedElemCombMutex.Unlock()
				continue
			}
			markElemCombUsed(item.Node.Name, recipe[0].ID, recipe[1].ID, item.AncestryChain)
			usedElemCombMutex.Unlock()

			result.recipes = append(result.recipes, JSONRecipe{
				Ingredients: []string{recipe[0].Name, recipe[1].Name},
				Result:      item.Node.Name,
				Step:        item.Depth,
			})

			for _, ingredient := range recipe {
				if ingredient == nil {
					continue
				}

				result.nodes = append(result.nodes, JSONNode{
					ID:   ingredient.ID,
					Name: ingredient.Name,
				})

				newAncestry := &AncestryChain{
					Element: ingredient.Name,
					Parents: item.AncestryChain,
				}

				if !isBaseElement(ingredient) {
					next <- QueueItem{
						Node:          ingredient,
						AncestryChain: newAncestry,
						Depth:         item.Depth + 1,
					}
				} else {
					result.visitedNodes++
				}

			}

		}
	}
}
