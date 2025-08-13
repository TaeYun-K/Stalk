import React from 'react';
import { useWatchlist } from '@/context/WatchlistContext';

interface RankingStock {
  rank: number;
  ticker: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  volume: string;
  marketCap?: string;
  tradeValue?: string;
}

interface StockRankingTableProps {
  stocks: RankingStock[];
  onStockClick: (stock: RankingStock) => void;
  rankingType: 'volume' | 'gainers' | 'losers' | 'marketCap' | 'tradeValue';
  onRankingTypeChange: (type: 'volume' | 'gainers' | 'losers' | 'marketCap' | 'tradeValue') => void;
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
  title,
  marketType,
  onMarketTypeChange,
  onStockSelect,
  darkMode = false
}) => {
  const { isInWatchlist } = useWatchlist();

  const handleStockClick = (stock: RankingStock) => {
    if (onStockClick) {
      onStockClick(stock);
    }
    if (onStockSelect) {
      onStockSelect({ ticker: stock.ticker, name: stock.name });
    }
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
        <button
          onClick={() => onRankingTypeChange('marketCap')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            rankingType === 'marketCap'
              ? darkMode
                ? 'bg-gray-700 text-purple-400 border-b-2 border-purple-400'
                : 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          시가총액 TOP
        </button>
        <button
          onClick={() => onRankingTypeChange('tradeValue')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            rankingType === 'tradeValue'
              ? darkMode
                ? 'bg-gray-700 text-yellow-400 border-b-2 border-yellow-400'
                : 'bg-yellow-50 text-yellow-600 border-b-2 border-yellow-600'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          거래대금 TOP
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}`}>
            <tr>
              <th className={`w-[40px] pr-4 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>

              </th>
              <th className={`w-[50px] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                순위
              </th>
              <th className={`min-w-[200px] px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                종목명
              </th>
              <th className={`w-[300px] px-0 py-4`}>
                <div className="flex justify-end pr-8">
                  <span className={`w-[90px] text-right text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>현재가</span>
                  <span className={`w-[80px] ml-12 text-right text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>등락률</span>
                  <span className={`w-[110px] ml-12 text-right text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{rankingType === 'marketCap' ? '시가총액' : rankingType === 'tradeValue' ? '거래대금' : '거래량'}</span>
                </div>
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
                  <td className={`w-[40px] pr-4 py-4 text-center`}>
                    {isInWatchlist(stock.ticker) && (
                      <span className="text-red-500">
                        <svg
                          className="w-4 h-4 inline-block"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </span>
                    )}
                  </td>
                  <td className={`w-[50px] px-2 py-4 text-center text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    {stock.rank}
                  </td>
                  <td className={`min-w-[200px] px-3 py-4 text-left ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    <div>
                      <div className="text-sm font-medium">{stock.name}</div>
                      <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {stock.ticker}
                      </div>
                    </div>
                  </td>
                  <td className={`w-[400px] px-0 py-4`}>
                    <div className="flex justify-end pr-8">
                      <div className={`text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-900'
                      } w-[90px] text-right`}>
                        {stock.price.toLocaleString()}원
                      </div>
                      <div className={`text-sm font-medium ${changeColor} w-[80px] ml-12 text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs">{changeIcon}</span>
                          <span>{Math.abs(stock.changeRate).toFixed(2)}%</span>
                        </div>
                      </div>
                      <div className={`text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-900'
                      } w-[110px] ml-12 text-right truncate`}>
                        {rankingType === 'marketCap' ? (stock.marketCap || '0') : rankingType === 'tradeValue' ? (stock.tradeValue || '0') : (stock.volume || '0')}
                      </div>
                    </div>
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
