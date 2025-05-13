"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export type DFSNode = { 
  element: string; 
  recipe: string[];
};

export type DFSGraphData = { 
  nodes: {
    [key: string]: {
      element: string;
      recipe: string[];
    }
  };
};

const DFSRecipeResultMR: React.FC<{ graph: DFSGraphData }> = ({ graph }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [recipes, setRecipes] = useState<{ingredients: string[], result: string, step: number}[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Debug function
  const getGraphStructure = (g: any) => {
    if (!g) return "Graph is undefined";
    if (!g.nodes) return "Graph nodes is undefined";
    
    let structure = `Graph has ${Object.keys(g.nodes || {}).length} nodes.`;
    
    if (Object.keys(g.nodes || {}).length > 0) {
      const sampleNodeKey = Object.keys(g.nodes)[0];
      structure += `\nSample node (${sampleNodeKey}): ${JSON.stringify(g.nodes[sampleNodeKey])}`;
    }
    
    return structure;
  };

  const convertDFSToRecipes = (dfsData: { [key: string]: DFSNode }) => {
    if (!dfsData || Object.keys(dfsData).length === 0) {
      return [];
    }
    
    const recipeList: {ingredients: string[], result: string, step: number}[] = [];
    
    Object.entries(dfsData).forEach(([nodeId, node]) => {
      if (!node) return;
      
      if (!node.recipe || node.recipe.length === 0) return;
      
      try {
        const ingredients = node.recipe.map(id => {
          const ingredient = dfsData[id];
          return ingredient ? ingredient.element : id;
        }).filter(Boolean); // Filter out any undefined values
        
        if (ingredients.length > 0) {
          recipeList.push({
            ingredients,
            result: node.element,
            step: parseInt(nodeId) || 0 
          });
        }
      } catch (e) {
        console.error(`Error processing node ${nodeId}:`, e);
      }
    });
    
    return recipeList.sort((a, b) => a.step - b.step);
  };

  function buildTree(targetId: string, dfsData: { [key: string]: DFSNode }): any {
    if (!dfsData || !targetId) {
      return { name: "Unknown" };
    }
    
    const node = dfsData[targetId];
    if (!node) {
      return { name: targetId }; 
    }
    
    if (!node.recipe || node.recipe.length === 0) {
      return { name: node.element };
    }
    
    return {
      name: node.element,
      children: node.recipe.map(ingredientId => buildTree(ingredientId, dfsData))
    };
  }

  const getUniqueElements = (dfsData: { [key: string]: DFSNode }): string[] => {
    if (!dfsData) return [];
    
    const elements = new Set<string>();
  
    Object.values(dfsData).forEach(node => {
      if (node && node.element) {
        elements.add(node.element);
      }
    });
    
    return Array.from(elements);
  };
  
  const calculateMaxDepth = (node: any, currentDepth = 0): number => {
    if (!node || !node.children || node.children.length === 0) {
      return currentDepth;
    }
    
    return Math.max(...node.children.map((child: any) => 
      calculateMaxDepth(child, currentDepth + 1)
    ));
  };

  const countLeafNodes = (node: any): number => {
    if (!node) return 0;
    if (!node.children || node.children.length === 0) {
      return 1;
    }

    return node.children.reduce((sum: number, child: any) => 
      sum + countLeafNodes(child), 0
    );
  };

  const findTargetId = (dfsData: { [key: string]: DFSNode }): string => {
    if (!dfsData || Object.keys(dfsData).length === 0) {
      return "0";
    }
    
    const nodeIds = new Set(Object.keys(dfsData));
    const parentIds = new Set<string>();
    
    Object.values(dfsData).forEach(node => {
      if (node.recipe) {
        node.recipe.forEach(id => parentIds.add(id));
      }
    });
    
    const targetIds = Array.from(nodeIds).filter(id => !parentIds.has(id));
    
    if (targetIds.length > 0) {
      return targetIds[0];
    }
    
    const numericKeys = Object.keys(dfsData)
      .map(Number)
      .filter(k => !isNaN(k));
      
    if (numericKeys.length > 0) {
      return String(Math.max(...numericKeys));
    }
    
    return Object.keys(dfsData)[0];
  };

  useEffect(() => {
    if (!graph) {
      setDebugInfo("Graph is undefined");
      return;
    }
    
    if (!graph.nodes) {
      setDebugInfo("Graph.nodes is undefined");
      return;
    }
    
    const nodeCount = Object.keys(graph.nodes).length;
    setDebugInfo(getGraphStructure(graph));
    
    if (nodeCount === 0) {
      setDebugInfo("Graph.nodes is empty (length: 0)");
      return;
    }
  
    try {
      const convertedRecipes = convertDFSToRecipes(graph.nodes);
      setRecipes(convertedRecipes);
      
      const unique = getUniqueElements(graph.nodes);

      const targetId = findTargetId(graph.nodes);
      const rootData = buildTree(targetId, graph.nodes);
      
      const maxDepth = calculateMaxDepth(rootData);
      const leafCount = countLeafNodes(rootData);
      
      const baseWidth = Math.max(1200, leafCount * 100);
      const baseHeight = Math.max(800, maxDepth * 150);
      
      if (!svgRef.current) {
        setDebugInfo(debugInfo + "\nSVG ref is not available");
        return;
      }
      
      d3.select(svgRef.current).selectAll("*").remove();
        
      const container = d3.select(svgRef.current)
        .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`);
      
      const margin = { top: 100, right: 200, bottom: 200, left: 200 };
      
      const g = container.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
      
      const root = d3.hierarchy(rootData);
      
      const treeLayout = d3.tree<any>()
        .size([baseWidth - margin.left - margin.right, baseHeight - margin.top - margin.bottom - 100])
        .separation((a, b) => {
          return (a.parent === b.parent ? 1 : 2) * 4;
        });
      
      treeLayout(root);
      
      const linkGenerator = d3.linkVertical<any, any>()
        .x((d: any) => d.x)
        .y((d: any) => d.y);
      
      g.append("g")
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", 2)
        .attr("d", d => linkGenerator(d));
      
      const node = g.append("g")
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);
      
      const circleRadius = 40;
      
      node.append("circle")
        .attr("r", circleRadius)
        .attr("fill", "#677D6A")
        .attr("stroke", "white")
        .attr("stroke-width", 2);
      
      node.append("foreignObject")
        .attr("x", -circleRadius * 0.7)
        .attr("y", -circleRadius * 0.7)
        .attr("width", circleRadius * 1.4)
        .attr("height", circleRadius * 1.4)
        .append("xhtml:div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("width", "100%")
        .style("height", "100%")
        .html(d => {
          if (!d || !d.data) return "";
          const elementName = d.data.name;
          return `<img src="/icons/${elementName}.webp" alt="${elementName}" 
                  style="width:100%; height:100%; object-fit:contain;"
                  onerror="this.onerror=null; this.src='/icons/unknown.webp'"/>`;
        });
        
      node.append("text")
        .attr("dy", circleRadius + 20)
        .attr("text-anchor", "middle")
        .text(d => d.data.name)
        .style("font-size", "14px")
        .attr("fill", "white")
        .style("filter", "drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.8))");
        
      const legendG = container.append("g")
        .attr("class", "legend-group")
        .attr("transform", `translate(${margin.left}, ${baseHeight - margin.bottom + 50})`);
      
      legendG.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Icon Legend")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .attr("fill", "white");
        
      const iconsPerRow = 6;
      const iconSize = 30;
      const rowHeight = 60;

      if (unique.length > 0) {
        unique.forEach((item, i) => {
          if (!item) return; 
          
          const row = Math.floor(i / iconsPerRow);
          const col = i % iconsPerRow;
          const x = col * (iconSize + 40);
          const y = row * rowHeight + 30;
          
          legendG.append("circle")
            .attr("cx", x + iconSize/2)
            .attr("cy", y + iconSize/2)
            .attr("r", iconSize/2)
            .attr("fill", "#677D6A")
            .attr("stroke", "white")
            .attr("stroke-width", 1);
            
          legendG.append("foreignObject")
            .attr("x", x)
            .attr("y", y)
            .attr("width", iconSize)
            .attr("height", iconSize)
            .append("xhtml:div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("width", "100%")
            .style("height", "100%")
            .html(`<img src="/icons/${item}.webp" alt="${item}" 
                  style="width:100%; height:100%; object-fit:contain;"
                  onerror="this.onerror=null; this.src='/icons/unknown.webp'"/>`);
            
          legendG.append("text")
            .attr("x", x + iconSize/2)
            .attr("y", y + iconSize + 15)
            .text(item)
            .style("font-size", "12px")
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .style("filter", "drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.8))");
        });
      }
    } catch (error) {
      console.error("Error rendering graph:", error);
      setDebugInfo(`Error rendering graph: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [graph]);
  
  return (
    <div className="flex flex-col gap-4">
      <div className="border rounded p-4 w-full">
        <h3 className="font-semibold mb-2 text-white">Recipe steps</h3>
        {recipes.length > 0 ? (
          <ul className="text-sm list-disc pl-5 space-y-1">
            {recipes.map((r, i) => (
              <li key={i}>
                <span className="text-[#D6BD98]">{r.ingredients.join(" + ")}</span>{" "}
                ➜ <span className="font-medium text-white">{r.result}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No recipe steps available. {debugInfo}</p>
        )}
      </div>

      <div className="border rounded p-4 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Recipe Tree</h3>
        </div>
        <div className="w-full overflow-auto max-h-screen">
          <svg ref={svgRef} style={{ width: "100%", height: "800px" }}></svg>
        </div>
      </div>
    </div>
  );
};

export default DFSRecipeResultMR;