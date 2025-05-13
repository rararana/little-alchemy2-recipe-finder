package search

import (
	"backend/scraping"
	"fmt"
	"slices"
)

// Represents a node in the recipe graph
// An element is created by combining two elements or nothing (primordial elements)
// An element can be used to create other elements
type ElementNode struct {
	ID       int              // Unique ID 0-720
	Name     string           // Name of the element
	Tier     int              // Tier 1-15. Base elements is tier 0
	Children []*ElementNode   // List of elements that can be created from this element
	Recipes  [][]*ElementNode // Parents. List of pairs of elements that can be combined to create this element
}

// Set of all elements
// The graph is a directed graph
type RecipeGraph struct {
	Elements     []*ElementNode
	BaseElements []*ElementNode // Air, Earth, Fire, Water
}

func GetRoot(graph *RecipeGraph) *ElementNode          { return graph.Elements[0] }
func GetChildren(element *ElementNode) []*ElementNode  { return element.Children }
func GetRecipes(element *ElementNode) [][]*ElementNode { return element.Recipes }
func GetName(element *ElementNode) string              { return element.Name }
func GetID(element *ElementNode) int                   { return element.ID }

func ConstructRecipeGraph(recipesJSON scraping.RecipeEntry, graph *RecipeGraph) error {
	// Create a map to store the elements by name
	elementMap := make(map[string]*ElementNode)

	graph.Elements = make([]*ElementNode, 1+len(recipesJSON.Element))

	// Sentinel element for primordial elements
	sentinelElement := ElementNode{
		ID:       0,
		Name:     "",
		Children: make([]*ElementNode, 0),
		Recipes:  make([][]*ElementNode, 0),
	}
	graph.Elements[0] = &sentinelElement
	elementMap[""] = GetRoot(graph)

	// Create nodes for each element and add them to the graph
	for i, elementName := range recipesJSON.Element {
		node := ElementNode{
			ID:       int(i + 1),
			Name:     elementName,
			Children: make([]*ElementNode, 0),
			Recipes:  make([][]*ElementNode, 0),
		}
		if tier, ok := recipesJSON.Tiering[elementName]; ok {
			node.Tier = tier
		} else {
			node.Tier = 0 // Default tier for elements without a specified tier
		}
		graph.Elements[i+1] = &node
		elementMap[elementName] = &node
	}

	// Construct edges
	for _, elementName := range recipesJSON.Element {
		node := elementMap[elementName]
		for _, recipe := range recipesJSON.Recipe[elementName] {
			parent1, ok1 := elementMap[recipe[0]]
			parent2, ok2 := elementMap[recipe[1]]
			if !ok1 || !ok2 {
				fmt.Printf("Skipping recipe for element %s: missing parent(s) %v\n", elementName, recipe)
				continue
			}
			node.Recipes = append(node.Recipes, []*ElementNode{parent1, parent2})
			if !slices.Contains(parent1.Children, node) {
				parent1.Children = append(parent1.Children, node)
			}
			if !slices.Contains(parent2.Children, node) {
				parent2.Children = append(parent2.Children, node)
			}
		}
	}

	// Set the base elements
	graph.BaseElements = make([]*ElementNode, 4)
	graph.BaseElements[0] = elementMap["Air"]
	graph.BaseElements[1] = elementMap["Earth"]
	graph.BaseElements[2] = elementMap["Fire"]
	graph.BaseElements[3] = elementMap["Water"]

	return nil
}

func GetElementByID(graph *RecipeGraph, id int32) (*ElementNode, error) {
	// Return the element with the given ID
	if id < 0 || int(id) >= len(graph.Elements) {
		return nil, fmt.Errorf("element with ID %d not found", id)
	}
	return graph.Elements[id], nil
}

func GetElementByName(graph *RecipeGraph, name string) (*ElementNode, error) {
	// Return the element with the given name
	for _, element := range graph.Elements {
		if element.Name == name {
			return element, nil
		}
	}
	return nil, fmt.Errorf("element with name %s not found", name)
}
