import React, { useState, useRef, useEffect } from 'react';

interface StockData {
  ticker: string;
  name: string;
}

interface ConsultationStockSearchProps {
  onStockSelect: (stock: StockData) => void;
  darkMode?: boolean;
  compact?: boolean;
}

// Fallback stock list for demo/testing
const POPULAR_STOCKS: StockData[] = [
  { ticker: '005930', name: '삼성전자' },
  { ticker: '000660', name: 'SK하이닉스' },
  { ticker: '035720', name: '카카오' },
  { ticker: '035420', name: 'NAVER' },
  { ticker: '051910', name: 'LG화학' },
  { ticker: '006400', name: '삼성SDI' },
  { ticker: '005380', name: '현대자동차' },
  { ticker: '000270', name: '기아' },
  { ticker: '068270', name: '셀트리온' },
  { ticker: '105560', name: 'KB금융' },
];

const ConsultationStockSearch: React.FC<ConsultationStockSearchProps> = ({ 
  onStockSelect, 
  darkMode = true,
  compact = false 
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<StockData[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    // For now, use local search through popular stocks
    // This can be replaced with API call when backend is fixed
    const filtered = POPULAR_STOCKS.filter(stock => 
      stock.name.toLowerCase().includes(query.toLowerCase()) ||
      stock.ticker.includes(query)
    );
    
    setSearchResults(filtered);
    setIsOpen(filtered.length > 0);
  };

  const handleStockClick = (stock: StockData) => {
    setSelectedStock(stock);
    setSearchQuery(stock.name);
    setIsOpen(false);
    onStockSelect(stock);
  };

  const handleQuickSelect = (stock: StockData) => {
    setSelectedStock(stock);
    onStockSelect(stock);
  };

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-3'}`}>
      {/* Search Input */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <input
            type="text"
            placeholder="종목명 또는 코드 검색"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setIsOpen(true)}
            className={`w-full ${compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} ${
              darkMode 
                ? 'bg-gray-700 text-gray-200 placeholder-gray-400 border-gray-600' 
                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
            } border rounded-lg outline-none transition-colors focus:border-blue-500`}
          />
          <svg 
            className={`absolute right-3 ${compact ? 'top-1.5' : 'top-2.5'} w-4 h-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Search Results Dropdown */}
        {isOpen && searchResults.length > 0 && (
          <div className={`absolute top-full left-0 right-0 mt-1 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          } border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto`}>
            {searchResults.map((stock) => (
              <button
                key={stock.ticker}
                onClick={() => handleStockClick(stock)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                  darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium">{stock.name}</span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stock.ticker}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access Stocks */}
      <div>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
          인기 종목
        </p>
        <div className="flex flex-wrap gap-1">
          {POPULAR_STOCKS.slice(0, 6).map((stock) => (
            <button
              key={stock.ticker}
              onClick={() => handleQuickSelect(stock)}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                selectedStock?.ticker === stock.ticker
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {stock.name}
            </button>
          ))}
        </div>
      </div>

      {/* Currently Selected Stock */}
      {selectedStock && (
        <div className={`flex items-center justify-between p-2 rounded-lg ${
          darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              {selectedStock.name}
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedStock.ticker}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationStockSearch;