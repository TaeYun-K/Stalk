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
      // Try the backend search first
      const response = await AuthService.authenticatedRequest(
        `${import.meta.env.VITE_API_URL}/api/krx/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: query.trim() })
        }
      );
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Search results:', responseData);
        
        if (responseData.isSuccess && responseData.result) {
          setSearchResults(responseData.result.slice(0, 10));
          return;
        }
      }
      
      // If backend search fails, show fallback message
      throw new Error('Backend search unavailable');
      
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
          placeholder="주식 검색 (예: 삼성전자, 005930)"
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
          } text-sm`}>
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
              <div className="flex justify-between items-center">
                <span className="font-medium">{stock.name}</span>
                <span className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {stock.ticker}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {searchQuery.trim() && !isLoading && searchResults.length === 0 && (
        <div className={`absolute top-full left-0 right-0 ${
          darkMode 
            ? 'bg-gray-800 border-gray-600 text-gray-400' 
            : 'bg-white border-gray-300 text-gray-500'
        } border border-t-0 rounded-b-lg p-4 shadow-md`}>
          <div className="text-center">
            <div>검색 서비스 일시 중단</div>
            <div className="text-xs mt-1">주식 코드를 직접 입력해보세요 (예: 005930)</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockSearch;