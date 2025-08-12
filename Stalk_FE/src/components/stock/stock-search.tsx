import React, { useState, useRef, useEffect } from 'react';
import AuthService from '../../services/authService';

interface StockData {
  ticker: string;
  name: string;
}

interface StockSearchProps {
  onStockSelect: (stock: StockData) => void;
  darkMode?: boolean;
}

const StockSearch: React.FC<StockSearchProps> = ({
  onStockSelect,
  darkMode = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/krx/search?query=${encodeURIComponent(query.trim())}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Search results:', responseData);

        if (responseData.isSuccess && responseData.result) {
          setSearchResults(responseData.result.slice(0, 10));
        } else {
          setSearchResults([]);
        }
      } else {
        console.error('Search failed with status:', response.status);
        setSearchResults([]);
      }

    } catch (error) {
      console.error('Stock search error:', error);
      // Show a message that search is temporarily unavailable
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    if (query.trim()) {
      setIsLoading(true);
      debounceTimer.current = setTimeout(() => {
        handleSearch(query);
      }, 300); // 300ms debounce
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }
  };

  const handleStockClick = (stock: StockData) => {
    onStockSelect(stock);
    setSearchQuery(stock.name);
    setSearchResults([]);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="mb-5 relative">
      <div className="relative">
        <input
          type="text"
          placeholder="주식 검색"
          value={searchQuery}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 text-base border-2 ${
            darkMode
              ? 'border-gray-600 bg-gray-800 text-gray-200 placeholder-gray-400'
              : 'border-gray-300 bg-white'
          } rounded-lg outline-none transition-colors focus:border-blue-500`}
        />
        {isLoading && (
          <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          } text-xs`}>
            검색중...
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className={`absolute top-full left-0 right-0 ${
          darkMode
            ? 'bg-gray-800 border-gray-600'
            : 'bg-white border-gray-300'
        } border border-t-0 rounded-b-lg max-h-60 overflow-y-auto z-50 shadow-lg`}>
          {searchResults.map((stock) => (
            <div
              key={stock.ticker}
              className={`px-4 py-3 cursor-pointer border-b ${
                darkMode
                  ? 'border-gray-700 hover:bg-gray-700 text-gray-200'
                  : 'border-gray-200 hover:bg-gray-50'
              } last:border-b-0 transition-colors`}
              onClick={() => handleStockClick(stock)}
            >
              <div className="flex justify-between items-center gap-2">
                <span className="font-medium text-xs truncate flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">{stock.name}</span>
                <span className={`text-xs flex-shrink-0 whitespace-nowrap ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {stock.ticker}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default StockSearch;
