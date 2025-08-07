import React from 'react';

interface RankingStock {
  rank: number;
  ticker: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  volume: number;
  marketCap?: number;
}

interface StockRankingTableProps {
  stocks: RankingStock[];
  onStockClick: (stock: RankingStock) => void;
  rankingType: 'volume' | 'gainers' | 'losers';
  onRankingTypeChange: (type: 'volume' | 'gainers' | 'losers') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  title: string;
  marketType: '전체' | 'kospi' | 'kosdaq';
  onMarketTypeChange: (market: '전체' | 'kospi' | 'kosdaq') => void;
  onStockSelect?: (stock: { ticker: string; name: string }) => void;
  darkMode?: boolean;
}

const StockRankingTable: React.FC<StockRankingTableProps> = ({
  stocks,
  onStockClick,
  rankingType,
  onRankingTypeChange,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  title,
  marketType,
  onMarketTypeChange,
  onStockSelect,
  darkMode = false
}) => {

  const handleStockClick = (stock: RankingStock) => {
    if (onStockClick) {
      onStockClick(stock);
    }
    if (onStockSelect) {
      onStockSelect({ ticker: stock.ticker, name: stock.name });
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1)}억`;
    } else if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}만`;
    }
    return num.toLocaleString();
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
      {/* Header with Title and Market Filter */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h2>
          
          {/* Market Type Filter */}
          <div className="flex space-x-2">
            {(['전체', 'kospi', 'kosdaq'] as const).map((market) => (
              <button
                key={market}
                onClick={() => onMarketTypeChange(market)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  marketType === market
                    ? 'bg-blue-600 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {market.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={onSearchSubmit} className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="종목명 또는 종목코드 검색..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              🔍
            </button>
          </div>
        </form>
      </div>

      {/* Ranking Type Tabs */}
      <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={() => onRankingTypeChange('gainers')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            rankingType === 'gainers'
              ? darkMode 
                ? 'bg-gray-700 text-red-400 border-b-2 border-red-400' 
                : 'bg-red-50 text-red-600 border-b-2 border-red-600'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          상승률 TOP
        </button>
        <button
          onClick={() => onRankingTypeChange('losers')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            rankingType === 'losers'
              ? darkMode 
                ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400' 
                : 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          하락률 TOP
        </button>
        <button
          onClick={() => onRankingTypeChange('volume')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            rankingType === 'volume'
              ? darkMode 
                ? 'bg-gray-700 text-green-400 border-b-2 border-green-400' 
                : 'bg-green-50 text-green-600 border-b-2 border-green-600'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          거래량 TOP
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                순위
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                종목명
              </th>
              <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                현재가
              </th>
              <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                등락률
              </th>
              <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                거래량
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {stocks.map((stock) => {
              const isNegative = stock.changeRate < 0;
              const changeColor = isNegative ? 'text-blue-600' : 'text-red-600';
              const changeIcon = isNegative ? '▼' : stock.changeRate > 0 ? '▲' : '';
              
              return (
                <tr
                  key={stock.ticker}
                  onClick={() => handleStockClick(stock)}
                  className={`cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className={`px-4 py-3 text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    {stock.rank}
                  </td>
                  <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    <div>
                      <div className="text-sm font-medium">{stock.name}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {stock.ticker}
                      </div>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    {stock.price.toLocaleString()}원
                  </td>
                  <td className={`px-4 py-3 text-right text-sm ${changeColor}`}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>{changeIcon}</span>
                      <span>{Math.abs(stock.changeRate).toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    {formatNumber(stock.volume)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {stocks.length === 0 && (
        <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          표시할 주식 데이터가 없습니다.
        </div>
      )}
    </div>
  );
};

export default StockRankingTable;