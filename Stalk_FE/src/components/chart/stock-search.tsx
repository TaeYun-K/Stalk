import React, { useState } from 'react';
import axios from 'axios';

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

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8081/api/stalk/search/${query}`
      );
      if (response.data.success) {
        setSearchResults(response.data.data);
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleStockClick = (stock: StockData) => {
    onStockSelect(stock);
    setSearchQuery(stock.name);
    setSearchResults([]);
  };

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
        } border border-t-0 rounded-b-lg max-h-52 overflow-y-auto z-50 shadow-md`}>
          {searchResults.map((stock) => (
            <div 
              key={stock.ticker} 
              className={`px-4 py-3 cursor-pointer border-b ${
                darkMode 
                  ? 'border-gray-700 hover:bg-gray-700' 
                  : 'border-gray-100 hover:bg-gray-50'
              } flex justify-between items-center transition-colors last:border-b-0`}
              onClick={() => handleStockClick(stock)}
            >
              <span className={`font-medium ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {stock.name}
              </span>
              <span className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              } font-mono`}>
                {stock.ticker}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockSearch;