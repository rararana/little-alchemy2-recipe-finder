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
  elapsed?: string; 
  visitedNodes?: number;
};

interface DFSRecipeResultProps {
  graph: DFSGraphData;
}

const DFSRecipeResult: React.FC<{ graph: DFSGraphData }> = ({ graph }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [recipes, setRecipes] = useState<{ingredients: string[], result: string, step: number}[]>([]);

  const convertDFSToRecipes = (dfsData: { [key: string]: DFSNode }) => {
    const recipeList: {ingredients: string[], result: string, step: number}[] = [];
    
    Object.entries(dfsData).forEach(([nodeId, node]) => {
      if (node.recipe.length === 0) return;
      
      const ingredients = node.recipe.map(id => dfsData[id]?.element || id);
      
      recipeList.push({
        ingredients,
        result: node.element,
        step: parseInt(nodeId) 
      });
    });
    
    return recipeList.sort((a, b) => a.step - b.step);
  };

  function buildTree(targetId: string, dfsData: { [key: string]: DFSNode }): any {
    const node = dfsData[targetId];
    if (!node) return null;
    
    if (node.recipe.length === 0) {
      return { name: node.element };
    }
    
    return {
      name: node.element,
      children: node.recipe.map(ingredientId => buildTree(ingredientId, dfsData))
    };
  }

  const getUniqueElements = (dfsData: { [key: string]: DFSNode }): string[] => {
    const elements = new Set<string>();
  
    Object.values(dfsData).forEach(node => {
      elements.add(node.element);
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
    if (!node || !node.children || node.children.length === 0) {
      return 1;
    }

    return node.children.reduce((sum: number, child: any) => 
      sum + countLeafNodes(child), 0
    );
  };

  const findTargetId = (dfsData: { [key: string]: DFSNode }): string => {
    const keys = Object.keys(dfsData).map(Number);
    return String(Math.max(...keys));
  };

  useEffect(() => {
    console.log("graph di dalam DFSRecipeResult:", graph);

    if (!graph || !graph.nodes) {
      console.log("Graph or Graph.nodes masih kosong", graph);
      return;
    }
    
    if (Object.keys(graph).length === 0) {
      console.log("Graph.nodes kosong", graph.nodes);
      return;
    }
  
    console.log("Graph data siap:", graph);
    
    const convertedRecipes = convertDFSToRecipes(graph.nodes);
    setRecipes(convertedRecipes);
    
    const unique = getUniqueElements(graph.nodes);
    
    const targetId = findTargetId(graph.nodes);

    const rootData = buildTree(targetId, graph.nodes);    
    const maxDepth = calculateMaxDepth(rootData);
    const leafCount = countLeafNodes(rootData);
    
    const baseWidth = Math.max(1800, leafCount * 100);
    const baseHeight = Math.max(1400, maxDepth * 200);
    
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
      .selectAll("*").remove();
      
    const container = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`);
    
    const margin = { top: 150, right: 300, bottom: 350, left: 300 };
    
    const g = container.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    const root = d3.hierarchy(rootData);
    
    const treeLayout = d3.tree<any>()
      .size([baseWidth - margin.left - margin.right, baseHeight - margin.top - margin.bottom - 200])
      .separation((a, b) => {
        const baseMultiplier = 15; 
        const depthFactor = Math.pow(2, Math.max(0, a.depth) * 0.5);
        const sameParent = a.parent === b.parent ? 1 : 2;
        const siblingCount = a.parent && a.parent.children ? a.parent.children.length : 1;
        const siblingFactor = Math.max(1, Math.log2(siblingCount));
        
        return baseMultiplier * sameParent * depthFactor * siblingFactor;
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
        const elementName = d.data.name;
        return `<img src="/icons/${elementName}.webp" alt="${elementName}" style="width:100%; height:100%; object-fit:contain;"/>`;
      });
      
    node.append("text")
      .attr("dy", circleRadius + 20)
      .attr("text-anchor", "middle")
      .text(d => d.data.name)
      .style("font-size", "14px")
      .attr("fill", "white")
      .style("filter", "drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.8))");
      
    const legendG = container.append("g")
      .attr("transform", `translate(${margin.left}, ${baseHeight - margin.bottom + 50})`);
    
    legendG.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .text("Icon Legend")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .attr("fill", "white");
      
    const iconsPerRow = 8;
    const iconSize = 40;
    const iconMargin = 10;
    const rowHeight = 80;
    
    const uniqueItems = Array.from(new Set(unique));
    
    uniqueItems.forEach((item, i) => {
      const row = Math.floor(i / iconsPerRow);
      const col = i % iconsPerRow;
      const x = col * (iconSize + 60);
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
        .html(`<img src="/icons/${item}.webp" alt="${item}" style="width:100%; height:100%; object-fit:contain;"/>`);
        
      legendG.append("text")
        .attr("x", x + iconSize/2)
        .attr("y", y + iconSize + 15)
        .text(item)
        .style("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("filter", "drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.8))");
    });
    
  }, [graph, scale]);
  
  return (
    <div className="flex flex-col gap-4">
      <div className="border rounded p-4 w-full">
        <h3 className="font-semibold mb-2 text-white">Recipe steps</h3>
        <ul className="text-sm list-disc pl-5 space-y-1">
          {recipes.map((r, i) => (
            <li key={i}>
              <span className="text-[#D6BD98]">{r.ingredients.join(" + ")}</span>{" "}
              ➜ <span className="font-medium text-white">{r.result}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border rounded p-4 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Recipe Tree</h3>
        </div>
        <div className="w-full overflow-auto max-h-screen">
          <svg ref={svgRef} style={{ width: "100%", height: "1400px" }}></svg>
        </div>
      </div>
    </div>
  );
};

export default DFSRecipeResult;