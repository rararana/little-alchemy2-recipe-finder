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

const SingleRecipePage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlgo, setSelectedAlgo] = useState(1); // 0 = none, 1 = BFS, 2 = DFS
  const [errorMessage, setErrorMessage] = useState('');
  const [mode, setMode] = useState(1);
  // Mock data for element grid
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
    console.log(`Searching for: ${searchQuery} using ${selectedAlgo === 1 ? 'BFS' : 'DFS'}`);
    const algo = selectedAlgo === 1 ? 'BFS' : 'DFS';
    try {
      const response = await fetch(`${config.API_URL}/api/recipe?element=${encodeURIComponent(searchQuery.trim())}&algo=${algo}`);
      const data = await response.json();
      console.log(data);

      if (data.error) {
        setErrorMessage(data.message || `Error: ${data.type}`);
        return;
      }

      router.push(
      `/single-recipe/result?element=${encodeURIComponent(searchQuery.trim())}` +
      `&algo=${algo}`
      );
    } catch (error) {
      console.error("Error fetching recipe:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setErrorMessage('');
  };
  

return (
  <div className="max-h-screen flex flex-col bg-[var(--background)]">
    <Navbar variant="single" currentRecipeMode={mode} setRecipeMode={setMode} />
    <div className="p-8">
      {/* Title */}
      <div className="mt-4 text-center items-center">
        <h1 className={`text-6xl font-bold text-white ${josefinSans.className}`}>
          Little <span className="bg-gradient-to-br from-purple-[#798772] to-[#D6BD98] bg-clip-text text-transparent">Alchemy</span> Recipe
        </h1>
      </div>
      <div className="mt-10 flex flex-col items-center mb-10">
        <div className="flex justify-center h-10 space-x-3 mb-1">
          <div className="flex items-center">
            <select 
              value={selectedAlgo}
              onChange={(e) => setSelectedAlgo(Number(e.target.value))}
              className="select-box flex h-full align-middle bg-[#D6BD98] text-[#1E1E1E] text-center items-center rounded-lg px-2">
              <option value="1">BFS</option>
              <option value="2">DFS</option>
            </select>
          </div>
          <div className="flex bg-[#40534C] h-full w-96 align-middle text-center text-white items-center rounded-lg">
            <input
              type="text"
              placeholder="Which element recipe are you looking for?"
              value={searchQuery}
              onChange={handleInputChange}
              className="w-full h-full bg-transparent text-white text-center placeholder-[#B3B3B3] active:outline-none focus:outline-none focus:ring-2 focus:ring-[#D6BD98] focus:ring-opacity-30 rounded-lg"
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className={`rounded-lg w-20 text-center ${
              !searchQuery.trim() 
                ? 'bg-[#d6bd9877] text-[#1E1E1E] cursor-not-allowed' 
                : 'bg-[#D6BD98] text-[#1E1E1E] hover:text-[#40534C] hover:bg-[#E3B879]'
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
      <ScrollingElements />
    </div>
  </div>
  );
} 

export default SingleRecipePage;