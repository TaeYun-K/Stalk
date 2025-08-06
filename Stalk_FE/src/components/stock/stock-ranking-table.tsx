import React, { useState, useEffect } from 'react';

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
  onStockSelect?: (stock: { ticker: string; name: string }) => void;
  darkMode?: boolean;
}

const StockRankingTable: React.FC<StockRankingTableProps> = ({
  onStockSelect,
  darkMode = false
}) => {
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'volume'>('gainers');
  const [stocks, setStocks] = useState<RankingStock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRankingData();
  }, [activeTab]);

  const fetchRankingData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'gainers':
          endpoint = '/api/public/krx/ranking/gainers';
          break;
        case 'losers':
          endpoint = '/api/public/krx/ranking/losers';
          break;
        case 'volume':
          endpoint = '/api/public/krx/ranking/volume';
          break;
      }

      console.log(`주식 랭킹 데이터 요청: ${endpoint}`);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '랭킹 데이터 로드 실패');
      }

      const responseData = await response.json();
      console.log('랭킹 데이터 응답:', responseData);

      if (responseData.success && responseData.data) {
        const rankingData = responseData.data.map((item: any, index: number) => ({
          rank: index + 1,
          ticker: item.ticker || item.code,
          name: item.name,
          price: item.price || item.close || 0,
          change: item.change || 0,
          changeRate: item.changeRate || item.change_rate || 0,
          volume: item.volume || 0,
          marketCap: item.marketCap
        }));
        
        setStocks(rankingData.slice(0, 20)); // 상위 20개만 표시
      } else {
        setStocks([]);
      }
    } catch (err) {
      console.error('랭킹 데이터 로드 오류:', err);
      setError('랭킹 데이터를 불러올 수 없습니다.');
      setStocks([]);
    } finally {
      setIsLoading(false);
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

  const handleStockClick = (stock: RankingStock) => {
    if (onStockSelect) {
      onStockSelect({ ticker: stock.ticker, name: stock.name });
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
      <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('gainers')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'gainers'
              ? darkMode 
                ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400' 
                : 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          상승률 TOP
        </button>
        <button
          onClick={() => setActiveTab('losers')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'losers'
              ? darkMode 
                ? 'bg-gray-700 text-red-400 border-b-2 border-red-400' 
                : 'bg-red-50 text-red-600 border-b-2 border-red-600'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          하락률 TOP
        </button>
        <button
          onClick={() => setActiveTab('volume')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'volume'
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

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              데이터를 불러오는 중...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={fetchRankingData}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              다시 시도
            </button>
          </div>
        ) : stocks.length === 0 ? (
          <div className="p-8 text-center">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              표시할 데이터가 없습니다.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-2 text-left text-xs font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                } uppercase tracking-wider`}>
                  순위
                </th>
                <th className={`px-4 py-2 text-left text-xs font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                } uppercase tracking-wider`}>
                  종목명
                </th>
                <th className={`px-4 py-2 text-right text-xs font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                } uppercase tracking-wider`}>
                  현재가
                </th>
                <th className={`px-4 py-2 text-right text-xs font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                } uppercase tracking-wider`}>
                  전일비
                </th>
                <th className={`px-4 py-2 text-right text-xs font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                } uppercase tracking-wider`}>
                  등락률
                </th>
                <th className={`px-4 py-2 text-right text-xs font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                } uppercase tracking-wider`}>
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
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${
                        darkMode ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {stock.name}
                      </div>
                      <div className={`text-xs ${
                        darkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {stock.ticker}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right text-sm ${
                      darkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {stock.price.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm ${changeColor}`}>
                      {changeIcon} {Math.abs(stock.change).toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-medium ${changeColor}`}>
                      {stock.changeRate > 0 ? '+' : ''}{stock.changeRate.toFixed(2)}%
                    </td>
                    <td className={`px-4 py-3 text-right text-sm ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {formatNumber(stock.volume)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StockRankingTable;