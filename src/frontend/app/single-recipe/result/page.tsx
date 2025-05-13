"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import RecipeResult from "../../_components/RecipeResult";
import DFSRecipeResult from "../../_components/DFSRecipeResult";
import Navbar from "../../_components/Navbar";
import config from "@/config";

type ErrorResponse = {
  error: true;
  type: string;
  message: string;
};

type BFSGraphData = {
  nodes: any[];
  recipes: any[];
  elapsed?: string;
  visitedNodes?: number;
};

type DFSGraphData = {
  nodes: {
    [key: string]: {
      element: string;
      recipe: string[];
    }
  };
  elapsed?: string;
  visitedNodes?: number;
};

type SuccessResponse = {
  error: false;
  data: BFSGraphData | DFSGraphData;
};

type ApiResponse = ErrorResponse | SuccessResponse;

const Result = () => {
  const params = useSearchParams();
  const router = useRouter();
  const element = params.get("element") || "";
  const algo = params.get("algo")?.toLowerCase() || "bfs";
 
  const [mode, setMode] = useState(1);
  const [data, setData] = useState<BFSGraphData | DFSGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsed, setElapsed] = useState<string>("0");
  const [visitedNodes, setVisitedNodes] = useState<number | undefined>(0);
  const [hasNoRecipe, setHasNoRecipe] = useState(false);

  useEffect(() => {
    if (!element) {
      setError("No element specified");
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        setIsLoading(true);
        const t0 = performance.now();
        const res = await fetch(
          `${config.API_URL}/api/recipe?element=${encodeURIComponent(element)}&algo=${algo}`
        );
        const json = await res.json() as ApiResponse;
        console.log("API Response:", json);
        if (json.error) {
          const errorResponse = json as ErrorResponse;
          throw new Error(errorResponse.message || `Error: ${errorResponse.type}`);
        }
        const successResponse = json as SuccessResponse;
        let graphData = successResponse.data;
        const elapsedTime = (performance.now() - t0).toFixed(2);
        
        graphData.elapsed = graphData.elapsed || elapsedTime;
        
        setElapsed(graphData.elapsed);
        
        // Set visited nodes based on algorithm
        if (algo === "bfs" && "paths" in graphData) {
          const firstPath = (graphData as any).paths?.[0] ?? { nodes: [], recipes: [] };
          graphData = {
            nodes:        firstPath.nodes,
            recipes:      firstPath.recipes,
            elapsed:      graphData.elapsed,
            visitedNodes: graphData.visitedNodes,
          } as BFSGraphData;
        }
        if (algo === "bfs"){
          const bfsData = graphData as BFSGraphData;
          setHasNoRecipe(!bfsData.recipes || bfsData.recipes.length === 0);
          setVisitedNodes(bfsData.visitedNodes);
        } else {
          const dfsData = graphData as DFSGraphData;
          setHasNoRecipe(Object.keys(dfsData.nodes).length === 0);
          setVisitedNodes(dfsData.visitedNodes);
        }
        
        console.log('Graph Data to be set:', graphData);
        setData(graphData);
        setError(null);
      } catch (e: any) {
        console.error("Error fetching recipe:", e);
        setError(e.message || "An unknown error occurred");
        setData(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [element, algo]);
  

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D6BD98]"></div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="max-h-screen flex flex-col bg-[var(--background)]">
        <Navbar variant="single" currentRecipeMode={mode} setRecipeMode={setMode} />
        <div className="flex flex-col items-center p-[2%]">
          <div className="rounded-md mt-10 max-w-md w-full mb-4">
            <p className="text-white text-center">{error}</p>
          </div>
         
          <button
            className="p-[10px] w-20 h-[44px] border
                      border-[#d6bd98] rounded-md bg-[#d6bd98] text-[#1E1E1E]"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (hasNoRecipe) {
    return (
      <div className="max-h-screen flex flex-col bg-[var(--background)]">
        <Navbar variant="single" currentRecipeMode={mode} setRecipeMode={setMode} />
        <div className="text-white p-8 flex flex-col items-center">
          <h2 className="text-3xl font-semibold mb-4">
            No recipes found for <span className="text-[#d6bd98]">{element}</span>
          </h2>
          <p className="text-gray-400 mb-6">Try a different element or algorithm.</p>
          <button className="px-6 py-2 bg-[#d6bd98] rounded text-[#1e1e1e] transition duration-200 hover:scale-105"
                  onClick={() => router.back()}>
            Back
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="max-h-screen flex flex-col bg-[var(--background)]">
      <Navbar variant="single" currentRecipeMode={mode} setRecipeMode={setMode} />
      <div className="flex flex-col items-center p-[2%]">
        <p className="w-[510px] h-[58px] m-[5px] p-4 border
                    border-[var(--foreground)] bg-[var(--foreground)]
                    rounded-[12px] text-white text-center">
          {element}
        </p>
        <div className="flex justify-between w-[510px] text-[#b3b3b3] m-[5px]">
          <p>Execution time: {elapsed} ms</p>
          <p>Visited nodes: {visitedNodes}</p>
        </div>
        
        {algo === "bfs" ? (
          <>
            {console.log("Data yang dikirim ke RecipeResult:", data)}
            <RecipeResult graph={data as BFSGraphData} />
          </>
        ) : (
          <>
            {console.log("Data yang dikirim ke DFSRecipeResult:", data)}
            <DFSRecipeResult graph={data as DFSGraphData} />
          </>
        )}
        
        <button
          className="m-[10px] p-[10px] w-[199px] h-[44px] border
                    border-[#d6bd98] rounded-[12px] bg-[#d6bd98] text-[#1E1E1E]"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default Result;