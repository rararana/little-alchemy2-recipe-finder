package algorithm


func ExpandPaths(big GraphJSONWithRecipes, target string, maxPaths int) []GraphJSONWithRecipes {
	byResult := make(map[string][]JSONRecipe)
	for _, r := range big.Recipes {
		byResult[r.Result] = append(byResult[r.Result], r)
	}
	nodeByName := make(map[string]JSONNode)
	for _, n := range big.Nodes {
		nodeByName[n.Name] = n
	}

	type recipePath = []JSONRecipe
	mem := make(map[string][]recipePath)
	var out []recipePath

	var dfs func(string) []recipePath
	dfs = func(elem string) []recipePath {
    recs := byResult[elem]
    if len(recs) == 0 {
        return []recipePath{{}}
    }
    if cached, ok := mem[elem]; ok {
        return cached
    }

    var paths []recipePath
    for _, r := range recs {
        prod := []recipePath{{}}
        for _, ing := range r.Ingredients {
            ingPaths := dfs(ing)
            if maxPaths > 0 && len(out)+len(paths) >= maxPaths {
                break
            }
            var next []recipePath
            for _, base := range prod {
                for _, add := range ingPaths {
                    joined := append(append(recipePath{}, base...), add...)
                    next = append(next, joined)
                }
            }
            prod = next
        }
        for _, p := range prod {
            paths = append(paths, append(append(recipePath{}, p...), r))
            if maxPaths > 0 && len(out)+len(paths) >= maxPaths {
                break
            }
        }
        if maxPaths > 0 && len(out)+len(paths) >= maxPaths {
            break
        }
    }
    mem[elem] = paths
    return paths
	}


	out = dfs(target)
	if maxPaths > 0 && len(out) > maxPaths {
		out = out[:maxPaths]
	}

	results := make([]GraphJSONWithRecipes, 0, len(out))
	for _, recs := range out {
		seen := map[string]struct{}{target: {}}
		for _, r := range recs {
			seen[r.Result] = struct{}{}
			for _, ing := range r.Ingredients {
				seen[ing] = struct{}{}
			}
		}
		nodes := make([]JSONNode, 0, len(seen))
		for name := range seen {
			if n, ok := nodeByName[name]; ok {
				nodes = append(nodes, n)
			}
		}
		results = append(results, GraphJSONWithRecipes{
			Nodes:   nodes,
			Recipes: recs,
		})
	}
	return results
}
