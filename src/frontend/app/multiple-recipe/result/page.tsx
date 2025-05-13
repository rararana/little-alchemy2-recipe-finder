"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../_components/Navbar";
import RecipeResult from "../../_components/RecipeResult";
import DFSRecipeResultMR from "../../_components/DFSRecipeResultMR";
import config from "@/config";

// Response types
type ErrorResponse = {
  error: true;
  type: string;
  message: string;
};

// BFS types
type GraphNode = { id: number; name: string };
type GraphRecipe = { ingredients: string[]; result: string; step: number };
type BFSGraphData = { nodes: GraphNode[]; recipes: GraphRecipe[] };

// DFS types
type DFSNode = {
  element: string;
  recipe: string[];
};

type DFSGraphData = {
  nodes: {
    [key: string]: DFSNode;
  };
};

// Success response types
type SuccessResponseBFS = {
  error: false;
  data: {
    element: string;
    algo: string;
    paths: BFSGraphData[];
    visitedNodes: number;
  };
};

type SuccessResponseDFS = {
  error: false;
  data: {
    element: string;
    algo: string;
    paths: DFSGraphData[];
    visitedNodes: number;
  };
};

type ApiResponse = ErrorResponse | SuccessResponseBFS | SuccessResponseDFS;

const MultiResult = () => {
  const params = useSearchParams();
  const router = useRouter();

  const element = params.get("element") || "";
  const algo = params.get("algo")?.toLowerCase() || "bfs";
  const max = params.get("max") || "5";
  const [mode, setMode] = useState(2);

  const [paths, setPaths] = useState<(BFSGraphData | DFSGraphData)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [visited, setVisited] = useState<number | null>(null);
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    if (!element) {
      setError("No element specified");
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        console.log("Fetching recipe data...");
        const t0 = performance.now();
        const url = `${config.API_URL}/api/recipes?element=${encodeURIComponent(element)}&algo=${algo}&max=${max}`;
        console.log("Fetching from URL:", url);
        
        const res = await fetch(url);
        const t1 = performance.now();

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        let json: ApiResponse;
        try {
          json = await res.json();
        } catch (e) {
          console.error("Failed to parse JSON response:", e);
          throw new Error("Invalid response format from server");
        }
        
        // console.log("API response:", JSON.stringify(json, null, 2));
        setDebugData(json);

        if (json.error) {
          const { message, type } = json as ErrorResponse;
          throw new Error(message || `Error: ${type}`);
        }

        const { paths, visitedNodes } = json.data;
        
        // Log detailed information about the paths
        console.log("Received paths count:", paths?.length);
        
        // Process paths based on algorithm
        const processedPaths = processPaths(paths, algo);
        
        setPaths(processedPaths);
        setElapsed(Math.round(t1 - t0));
        setVisited(visitedNodes);
        setError(null);
      } catch (e: any) {
        console.error("Error fetching recipe data:", e);
        setError(e.message || "An error occurred while fetching data");
        setPaths([]);
        setElapsed(null);
        setVisited(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [element, algo, max]);

  // Process the paths based on algorithm to handle backend response format differences
  const processPaths = (paths: any[], algoType: string): any[] => {
    if (!paths || !Array.isArray(paths)) {
      console.error("Invalid paths data:", paths);
      return [];
    }

    // For DFS algorithm, make sure each path has a nodes object
    if (algoType === "dfs") {
      return paths.map((path, index) => {
        // Handle if path is just a nodes object directly
        if (path && typeof path === 'object' && !path.nodes) {
          return { nodes: path };
        }
        return path;
      }).filter(Boolean);
    }
    
    return paths;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D6BD98]" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-h-screen flex flex-col bg-[var(--background)]">
        <Navbar variant="multiple" currentRecipeMode={mode} setRecipeMode={setMode} />
        <div className="flex flex-col items-center p-[2%]">
          <p className="text-white mt-10 text-center mb-6">{error}</p>
          <button className="px-6 py-2 bg-[#d6bd98] rounded-md text-[#1e1e1e]"
                  onClick={() => router.back()}>
            Back
          </button>
        </div>
      </div>
    );
  }
  
  if (paths.length === 0) {
    return (
      <div className="max-h-screen flex flex-col bg-[var(--background)]">
        <Navbar variant="multiple" currentRecipeMode={mode} setRecipeMode={setMode} />
        <div className="text-white p-8 flex flex-col items-center">
          <h2 className="text-3xl font-semibold mb-4">
            No recipes found for <span className="text-[#d6bd98]">{element}</span>
          </h2>
          <p className="text-gray-400 mb-6">Try a different element or algorithm.</p>
          <button className="px-6 py-2 bg-[#d6bd98] rounded text-[#1e1e1e] transition duration-200 hover:scale-105"
                  onClick={() => router.back()}>
            Back
          </button>
          
          {debugData && (
            <div className="mt-8 w-full max-w-3xl">
              <h3 className="text-xl mb-2">Debug Data:</h3>
              <pre className="bg-gray-800 p-4 rounded overflow-auto text-xs text-gray-300">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-screen flex flex-col bg-[var(--background)]">
      <Navbar variant="multiple" currentRecipeMode={mode} setRecipeMode={setMode} />
      <div className="flex flex-col items-center p-[2%]">
        <p className="text-white mt-3 text-center mb-2">
          Found {paths.length} recipes for {element}
        </p>
        <p className="w-[510px] h-[58px] m-[5px] p-4 border
                    border-[var(--foreground)] bg-[var(--foreground)]
                    rounded-[12px] text-white text-center">
          {element}
        </p>

        <div className="flex justify-between w-[510px] text-[#b3b3b3] m-[5px]">
          <p>Execution time:&nbsp;{elapsed ?? "--"}&nbsp;ms</p>
          <p>Visited nodes:&nbsp;{visited ?? "--"}</p>
        </div>

        {paths.map((path, index) => {
          // Add debug output for investigating this specific path
          console.log(`Path #${index + 1}:`, path);
          const hasBFSData = path.nodes && Array.isArray(path.nodes);
          const hasDFSData = path.nodes && typeof path.nodes === 'object' && !Array.isArray(path.nodes);
          
          return (
            <div key={index} className="mb-10 w-full max-w-4xl">
              <h3 className="text-xl text-white mb-4">Path #{index + 1}</h3>
              
              {hasBFSData && algo === "bfs" ? (
                <RecipeResult graph={path as BFSGraphData} />
              ) : hasDFSData || algo === "dfs" ? (
                <DFSRecipeResultMR graph={path as DFSGraphData} />
              ) : (
                <div className="p-4 bg-red-900/30 rounded border border-red-500/50">
                  <p className="text-white">Invalid graph data format for path #{index + 1}</p>
                  <pre className="mt-2 text-xs text-gray-300 overflow-auto">{JSON.stringify(path, null, 2)}</pre>
                </div>
              )}
              
              <div className="border-b border-gray-700 my-8"></div>
            </div>
          );
        })}

        <button className="mt-6 px-6 py-2 bg-[#d6bd98] rounded text-[#1e1e1e]"
                onClick={() => router.back()}>
          Back
        </button>
      </div>
    </div>
  );
};

export default MultiResult;