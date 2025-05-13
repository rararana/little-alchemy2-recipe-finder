"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Josefin_Sans } from 'next/font/google';
import ScrollingElements from '../_components/ScrollingElements';
import Navbar from '../_components/Navbar';
import config from '@/config';

const josefinSans = Josefin_Sans({
  subsets: ['latin'],
  weight: ['700'],
});

const MultipleRecipePage = () => {
const router = useRouter();
const [searchQuery, setSearchQuery] = useState('');
const [selectedAlgo, setSelectedAlgo] = useState(1); // 0 = none, 1 = BFS, 2 = DFS
const [selectedNumR, setSelectedNumR] = useState(5); //num of recipes
const [errorMessage, setErrorMessage] = useState('');
const [mode, setMode] = useState(2);

const elements = Array(16).fill(null);

const handleSearch = async () => {
  if (!searchQuery.trim()) {
    return;
  }

  if (searchQuery === 'Fire' || searchQuery === 'Water' || searchQuery === 'Earth' || searchQuery === 'Air') {
    setErrorMessage(searchQuery + ' is a base element.');
    setSearchQuery('');
    return;
  }
  setErrorMessage('');
  const algo = selectedAlgo === 1 ? "bfs" : "dfs";
  console.log(`Searching for: ${searchQuery} using ${selectedAlgo === 1 ? 'BFS' : 'DFS'}`);
  

  try {
      const response = await fetch(`${config.API_URL}/api/recipes?element=${encodeURIComponent(searchQuery.trim())}&algo=${algo}&max=${selectedNumR}`);
      const data = await response.json();
      
      if (data.error) {
        setErrorMessage(data.message || `Error: ${data.type}`);
        // console.error("API Error:", data);
        return;
      }
      
      console.log(`Searching for: ${searchQuery} using ${algo.toUpperCase()}`);
      router.push(
        `/multiple-recipe/result` +
        `?element=${encodeURIComponent(searchQuery.trim())}` +
        `&algo=${algo}` +
        `&max=${selectedNumR}`
      );
    } catch (error) {
      // console.error("Error checking recipe:", error);
      setErrorMessage("Failed to connect to the server. Please try again later.");
    }
};

const handleInputQuery = (e) => {
  setSearchQuery(e.target.value);
  if(selectedNumR <=0 || isNaN(selectedNumR)) {
    return;
  }
  setErrorMessage('');
};

const handleInputNumR = (e) => {
  const value = Number(e.target.value);
  setSelectedNumR(value);
  if (isNaN(value) || value <= 0) {
    setErrorMessage("Invalid number of recipes");
    return;
  }
  setErrorMessage('');
};

return (
  <div className="max-h-screen flex flex-col bg-[var(--background)]">
    <Navbar variant="multiple" currentRecipeMode={mode} setRecipeMode={setMode} />
    <div className="text-white p-8">
      {/* Title */}
      <div className="mt-4 text-center items-center">
        <h1 className={`text-6xl font-bold text-white ${josefinSans.className}`}>
          Little <span className="bg-gradient-to-br from-purple-[#798772] to-[#D6BD98] bg-clip-text text-transparent">Alchemy</span> Recipe
        </h1>
      </div>
      <div className="mt-3 flex flex-col items-center h-10">
        <div className="flex justify-center">
          <div className="text-[#F3F3F3] text-sm">
            Enter maximum number of recipes to show:
          </div>
          <input
              type="text"
              value={selectedNumR}
              onChange={handleInputNumR}
              className="ml-3 w-10 h-4.5 bg-[#40534C] rounded text-white text-center"
          />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex justify-center h-10 space-x-3 mb-1">
          <div className="flex items-center">
            <select 
              value={selectedAlgo}
              onChange={(e) => setSelectedAlgo(Number(e.target.value))}
              className="select-box flex h-full align-middle bg-[#D6BD98] text-[#1E1E1E] text-center items-center rounded-lg px-3 py-1">
              <option value="1">BFS</option>
              <option value="2">DFS</option>
            </select>
          </div>
          <div className="flex bg-[#40534C] h-full w-96 align-middle text-center text-white items-center rounded-lg">
            <input
              type="text"
              placeholder="Which element recipe are you looking for?"
              value={searchQuery}
              onChange={handleInputQuery}
              className="w-full h-full bg-transparent text-center text-white placeholder-[#B3B3B3] active:outline-none focus:outline-none focus:ring-2 focus:ring-[#D6BD98] focus:ring-opacity-30 rounded-lg"
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isNaN(selectedNumR) || selectedNumR <= 0}
            className={`rounded-lg w-20 text-center items-center ${
              !searchQuery.trim() || isNaN(selectedNumR) || selectedNumR <= 0 
                ? 'bg-[#d6bd9877] text-[#1E1E1E] cursor-not-allowed'
                : 'bg-[#D6BD98] text-[#1E1E1E] hover:bg-[#E3B879]'
            }`}
          >
            Search
          </button>
        </div>
        <div className='h-2 mb-1'>
          {errorMessage && (
            <div className="bg-opacity-20 rounded-md text-sm text-center max-w-md">
              <p className="text-gray-100/20">{errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
    <ScrollingElements />
  </div>
  );
} 

export default MultipleRecipePage;