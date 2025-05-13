"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export type GraphNode   = { id: number; name: string };
export type GraphRecipe = { ingredients: string[]; result: string; step: number };
type GraphData = {
  nodes: any[];
  recipes: GraphRecipe[];
  elapsed?: string;
  visitedNodes?: number;
};

interface Props {
  graph: GraphData;
}

  const RecipeResult: React.FC<Props> = ({ graph }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const orderedRecipes = React.useMemo(
    () => [...(graph.recipes ?? [])].sort((a, b) => a.step - b.step),
    [graph.recipes]
  );

  function buildTree(
    target: string,
    recipes: GraphRecipe[],
    usage: Record<string, number> = {}
  ): any {
    const alts = recipes.filter(r => r.result === target);
    if (alts.length === 0) return { name: target };

    const pick = usage[target] ?? 0;
    const recipe = alts[pick % alts.length];
    usage[target] = pick + 1;

    return {
      name: target,
      children: recipe.ingredients.map(ing => buildTree(ing, recipes, usage))
    };
  }

  const getUniqueElements = (rcps: GraphRecipe[]) => {
    const set = new Set<string>();
    rcps.forEach(r => {
      set.add(r.result);
      r.ingredients.forEach(ing => set.add(ing));
    });
    return Array.from(set);
  };

  const maxDepth = (node: any, d = 0): number =>
    !node.children ? d : Math.max(...node.children.map((c: any) => maxDepth(c, d + 1)));

  const leafCount = (node: any): number =>
    !node.children ? 1 : node.children.reduce((s: number, c: any) => s + leafCount(c), 0);

  useEffect(() => {
    if (!orderedRecipes.length) return;
    
    const uniqueElements = getUniqueElements(orderedRecipes);

    const rootResult =
      orderedRecipes.find(r => r.step === 0)?.result ??
      orderedRecipes.reduce((b, c) => (c.step < b.step ? c : b)).result;

    const rootData = buildTree(rootResult, orderedRecipes);
    const depth = maxDepth(rootData);
    const leaves = leafCount(rootData);

    const baseW = Math.max(1800, leaves * 100);
    const baseH = Math.max(1400, depth  * 200);

    if (!svgRef.current) return;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${baseW} ${baseH}`)
      .selectAll("*")
      .remove();

    const container = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${baseW} ${baseH}`);

    const margin = { top: 150, right: 300, bottom: 350, left: 300 };
    const g      = container
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const hierarchy = d3.hierarchy(rootData);

    const tree = d3
      .tree<any>()
      .size([
        baseW - margin.left - margin.right,
        baseH - margin.top - margin.bottom - 200
      ])
      .separation((a, b) => {
        const base = 15;
        const depth = Math.pow(2, a.depth * 0.5);
        const same = a.parent === b.parent ? 1 : 2;
        const sibs = Math.max(1, Math.log2(a.parent?.children?.length ?? 1));
        return base * depth * same * sibs;
      });

    tree(hierarchy);

    const link = d3
      .linkVertical<any, any>()
      .x((d: any) => d.x)
      .y((d: any) => d.y);

    g.append("g")
      .selectAll("path")
      .data(hierarchy.links())
      .join("path")
      .attr("d", link)
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", 2);

    const node = g
      .append("g")
      .selectAll("g")
      .data(hierarchy.descendants())
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    const R = 40;

    node
      .append("circle")
      .attr("r", R)
      .attr("fill", "#677D6A")
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    node
      .append("foreignObject")
      .attr("x", -R * 0.7)
      .attr("y", -R * 0.7)
      .attr("width", R * 1.4)
      .attr("height", R * 1.4)
      .append("xhtml:div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("width", "100%")
      .style("height", "100%")
      .html(d => {
        const e = d.data.name;
        return `<img src="/icons/${e}.webp" alt="${e}" style="width:100%;height:100%;object-fit:contain"/>`;
      });

    node
      .append("text")
      .attr("dy", R + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .style("font-size", "14px")
      .style("filter", "drop-shadow(1px 1px 1px rgba(0,0,0,.8))")
      .text(d => d.data.name);

    const legend = container
      .append("g")
      .attr("transform", `translate(${margin.left}, ${baseH - margin.bottom + 50})`);

    legend
      .append("text")
      .text("Icon Legend")
      .attr("fill", "white")
      .style("font-size", "18px")
      .style("font-weight", "bold");

    const iconSize  = 40;
    const perRow    = 8;
    const rowHeight = 80;

    uniqueElements.forEach((item, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x   = col * (iconSize + 60);
      const y   = row * rowHeight + 30;

      legend
        .append("circle")
        .attr("cx", x + iconSize / 2)
        .attr("cy", y + iconSize / 2)
        .attr("r", iconSize / 2)
        .attr("fill", "#677D6A")
        .attr("stroke", "white");

      legend
        .append("foreignObject")
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
        .html(
          `<img src="/icons/${item}.webp" alt="${item}" style="width:100%;height:100%;object-fit:contain"/>`
        );

      legend
        .append("text")
        .attr("x", x + iconSize / 2)
        .attr("y", y + iconSize + 15)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("font-size", "12px")
        .style("filter", "drop-shadow(1px 1px 1px rgba(0,0,0,.8))")
        .text(item);
    });
  }, [orderedRecipes]);

  return (
    <div className="flex flex-col gap-4">
      <div className="border rounded p-4 w-full">
        <h3 className="font-semibold mb-2 text-white">Recipe steps</h3>
        <ul className="text-sm list-disc pl-5 space-y-1">
          {orderedRecipes.map((r, i) => (
            <li key={i}>
              <span className="text-[#D6BD98]">{r.ingredients.join(" + ")}</span>{" "}
              ➜ <span className="font-medium text-white">{r.result}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border rounded p-4 relative">
        <h3 className="font-semibold text-white mb-4">Recipe Tree</h3>
        <div className="w-full overflow-auto max-h-screen">
          <svg ref={svgRef} style={{ width: "100%", height: "1400px" }} />
        </div>
      </div>
    </div>
  );
};

export default RecipeResult;