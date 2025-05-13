package main

import (
	"backend/algorithm"
	"backend/scraping"
	"backend/search"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	if err := scraping.ScrapeRecipes(false); err != nil {
		panic(err)
	}

	recipes, err := scraping.GetScrapedRecipesJSON()
	if err != nil {
		panic(err)
	}

	var graph search.RecipeGraph
	if err := search.ConstructRecipeGraph(recipes, &graph); err != nil {
		panic(err)
	}

	r := gin.Default()
	r.SetTrustedProxies([]string{"127.0.0.1"})
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{"GET"},
		AllowHeaders: []string{"Content-Type"},
	}))

	// http://localhost:8080/api/recipe?element=Acid%20Rain&algo=bfs|dfs
	r.GET("/api/recipe", func(c *gin.Context) {
		algorithm.ResetCaches()
		element := c.Query("element")
		algo := strings.ToLower(c.DefaultQuery("algo", "bfs"))

		if element == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   true,
				"type":    "missing_parameter",
				"message": "Element parameter is required",
			})
			return
		}

		// find the node
		node, err := search.GetElementByName(&graph, element)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   true,
				"type":    "element_not_found",
				"message": fmt.Sprintf("Element '%s' not found", element),
			})
			return
		}

		switch algo {
		case "bfs":
			big, visitedCount := algorithm.ReverseBFS(node, 1)
			paths := algorithm.ExpandPaths(*big, element, 1)

			c.JSON(http.StatusOK, gin.H{
				"error": false,
				"data": gin.H{
					"algo":         "bfs",
					"element":      element,
					"paths":        paths,          // ← what your frontend expects
					"visitedNodes": visitedCount,
				},
			})
		case "dfs":
			var nodeVisited int
			result := algorithm.DFS(node, &graph, 1, &nodeVisited)
			log.Printf("Jumlah node yang dikunjungi: %d\n", nodeVisited)

			if len(result) > 0 {
				c.JSON(http.StatusOK, gin.H{
					"error": false,
					"data": gin.H{
						"nodes":        result[0],
						"visitedNodes": nodeVisited,
					},
				})
			}
		default:
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   true,
				"type":    "invalid_algorithm",
				"message": "Algorithm must be 'bfs' or 'dfs'",
			})
		}
	})

	r.GET("/api/recipes", func(c *gin.Context) {
		element := c.Query("element")
		algo := strings.ToLower(c.DefaultQuery("algo", "bfs"))

		if element == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   true,
				"type":    "missing_parameter",
				"message": "Element parameter is required",
			})
			return
		}

		max, _ := strconv.Atoi(c.DefaultQuery("max", "5"))
		if max <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   true,
				"type":    "invalid_parameter",
				"message": "Max parameter must be greater than 0",
			})
			return
		}

		node, err := search.GetElementByName(&graph, element)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   true,
				"type":    "element_not_found",
				"message": fmt.Sprintf("Element '%s' not found", element),
			})
			return
		}

		algorithm.ResetCaches()
		
		switch algo {
		case "bfs":
			big, visited := algorithm.ReverseBFS(node, 1)
			//print big in terminal

			log.Printf("%+v", big)
			p := algorithm.ExpandPaths(*big, element, max)

			if len(p) > max {
				p = p[:max]
			}

			c.JSON(http.StatusOK, gin.H{
				"error": false,
				"data": gin.H{
					"algo":         "bfs",
					"element":      element,
					"paths":        p,
					"visitedNodes": visited,
				},
			})
		case "dfs":
			var nodeVisited int
			results := algorithm.DFS(node, &graph, max, &nodeVisited)

			c.JSON(http.StatusOK, gin.H{
				"error": false,
				"data": gin.H{
					"element":      element,
					"algo":         algo,
					"paths":        results,
					"visitedNodes": nodeVisited,
				},
			})
		default:
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   true,
				"type":    "invalid_algorithm",
				"message": "Algorithm must be 'bfs' or 'dfs'",
			})
			return
		}
	})

	r.Run(":8080")
}
