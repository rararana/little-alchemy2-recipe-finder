package scraping

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

var scrapingResultPath string = "scraping/recipes.json"

type RecipeEntry struct {
	Element []string              `json:"element"`
	Recipe  map[string][][]string `json:"recipe"`
	Tiering map[string]int        `json:"tiering"`
	Icon    map[string]string     `json:"icon"`
}

func ScrapeRecipes(scrapeIcon bool) error {
	url := "https://little-alchemy.fandom.com/wiki/Elements_(Little_Alchemy_2)"
	icons_path := "scraping/icons/"
	startTime := time.Now()

	// Scrape page
	doc, err := getHTMLDocument(url)
	if err != nil {
		fmt.Println("Error:", err)
	}

	// JSON object to store the recipes
	// recipes["elements"] : a list of all elements
	// recipes["recipes"] : a map of elements (in string) to recipes
	recipesJSON := RecipeEntry{
		Element: make([]string, 0),
		Recipe:  make(map[string][][]string),
		Tiering: make(map[string]int),
		Icon:    make(map[string]string),
	}

	// Scraping
	// First column is the element
	recipe_tables := doc.Find("table")
	for i := range recipe_tables.Length() {
		if i == 0 {
			continue // this annoying table
		}

		recipe_tables.Eq(i).Find("tr").Each(func(index int, row *goquery.Selection) {
			// Not the expected table. Only read the table on which the first row, first column is "Element"
			// and the second column is "Recipes"
			if index == 0 {
				if row.Find("td").Eq(0).Text() != "Element" || row.Find("td").Eq(1).Text() != "Recipes" {
					return
				}
			}

			columns := row.Find("td")
			element := columns.Eq(0).Text()
			if element != "" {
				element = strings.TrimSpace(element)
				if element == "Time" {
					return // Hard skip this element, and then all their descendant recipes
				}

				recipesJSON.Element = append(recipesJSON.Element, element)
				recipesJSON.Recipe[element] = make([][]string, 0)

				// Get icon
				// Find image tag inside td tag
				// Get the src attribute of the image tag
				if scrapeIcon {
					icon := columns.Eq(0).Find("img").AttrOr("data-src", "")
					if icon != "" {
						filename := icons_path + element + ".webp"
						errIcom := downloadImage(icon, filename)
						if errIcom != nil {
							fmt.Println("Error downloading image:", icon)
						} else {
							recipesJSON.Icon[element] = filename
						}
					}
				}

			}

		})
	}
	// Second column is the recipe
	for i := range recipe_tables.Length() {
		if i == 0 {
			continue // this annoying table
		}

		recipe_tables.Eq(i).Find("tr").Each(func(index int, row *goquery.Selection) {
			if index == 0 {
				if row.Find("td").Eq(0).Text() != "Element" || row.Find("td").Eq(1).Text() != "Recipes" {
					return
				}
			}

			columns := row.Find("td")
			element := strings.TrimSpace(columns.Eq(0).Text())
			recipes := columns.Eq(1).Find("li")
			recipes.Each(func(index int, recipe *goquery.Selection) {
				recipe_text := strings.Split(recipe.Text(), "+")
				recipe_text[0] = strings.TrimSpace(recipe_text[0])
				recipe_text[1] = strings.TrimSpace(recipe_text[1])
				_, ok1 := recipesJSON.Recipe[recipe_text[0]]
				_, ok2 := recipesJSON.Recipe[recipe_text[1]]
				if len(recipe_text) > 1 && ok1 && ok2 { // Also check if the recipe contains invalid parts
					recipesJSON.Recipe[element] = append(recipesJSON.Recipe[element], []string{recipe_text[0], recipe_text[1]})
				}
			})

			// Primordial elements
			if strings.Contains(columns.Eq(1).Text(), "Available from the start") {
				recipesJSON.Recipe[element] = append(recipesJSON.Recipe[element], []string{"", ""})
			}

			// If no valid recipe exists, delete the element from the list
			if len(recipesJSON.Recipe[element]) == 0 {
				delete(recipesJSON.Icon, element)
				delete(recipesJSON.Recipe, element)
				fmt.Println("No valid recipe for element: ", element)
			}

		})
	}

	// Tiering info
	tier_headings := doc.Find("h3")
	tier_headings.Each(func(index int, heading *goquery.Selection) {
		// The first span tag inside
		spanText := heading.Find("span").Eq(0).Text()

		if !strings.Contains(spanText, "Tier") {
			return
		}
		parts := strings.Fields(spanText)
		if len(parts) < 2 {
			return
		}
		tier, err := strconv.Atoi(parts[1])
		if err != nil {
			return
		}

		table := heading.Next()
		table = table.Next()
		table.Eq(0).Find("tr").Each(func(index int, row *goquery.Selection) {
			if index == 0 {
				if row.Find("td").Eq(0).Text() != "Element" || row.Find("td").Eq(1).Text() != "Recipes" {
					return
				}
			}
			columns := row.Find("td")
			element := columns.Eq(0).Text()
			if element != "" {
				element = strings.TrimSpace(element)
				recipesJSON.Tiering[element] = tier
			}
		})
	})

	// Export the recipes to JSON file
	filename, err := exportJSON(recipesJSON)
	if err != nil {
		fmt.Println("Error:", err)
		return err
	}

	endTime := time.Now()
	elapsedTime := endTime.Sub(startTime)
	total_recipes := 0
	for _, recipes := range recipesJSON.Recipe {
		total_recipes += len(recipes)
	}
	total_tiers := 0
	tier_map := make(map[string]int)
	for _, tier := range recipesJSON.Tiering {
		if _, ok := tier_map[strconv.Itoa(tier)]; !ok {
			tier_map[strconv.Itoa(tier)] = 1
			total_tiers++
		}
	}
	fmt.Println("Scraping completed. Recipes exported to ", filename)
	fmt.Println("Number of elements:", len(recipesJSON.Element))
	fmt.Println("Number of tiers:", total_tiers)
	fmt.Println("Number of loaded tier of elements:", len(recipesJSON.Tiering))
	fmt.Println("Number of icons downloaded:", len(recipesJSON.Icon))
	fmt.Println("Number of recipes loaded:", len(recipesJSON.Recipe))
	fmt.Println("Total number of recipes:", total_recipes)
	fmt.Println("Elapsed time:", elapsedTime.Milliseconds(), "ms")

	return nil
}

func GetScrapedRecipesJSON() (RecipeEntry, error) {
	// Read the JSON file
	filename := scrapingResultPath
	file, err := os.Open(filename)
	if err != nil {
		fmt.Println("Error:", err)
		return RecipeEntry{}, err
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	recipesJSON := RecipeEntry{}
	err = decoder.Decode(&recipesJSON)
	if err != nil {
		fmt.Println("Error:", err)
		return RecipeEntry{}, err
	}

	return recipesJSON, nil
}

func exportJSON(recipesJSON RecipeEntry) (string, error) {
	// Create the JSON file
	filename := scrapingResultPath
	file, err := os.Create(filename)
	if err != nil {
		fmt.Println("Error:", err)
		return "", err
	}
	defer file.Close()

	// Write the JSON to the file
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	err = encoder.Encode(recipesJSON)
	if err != nil {
		fmt.Println("Error:", err)
		return "", err
	}

	return filename, nil
}

func getHTMLDocument(url string) (*goquery.Document, error) {
	res, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("status code: %d", res.StatusCode)
	}
	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return nil, err
	}
	return doc, nil
}

func downloadImage(url string, filename string) error {
	res, err := http.Get(url)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download image: %s", res.Status)
	}

	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer file.Close()

	_, err = io.Copy(file, res.Body)
	if err != nil {
		return fmt.Errorf("failed to save image: %v", err)
	}

	return nil
}
