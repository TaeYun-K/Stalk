import React from 'react';
import StockSearchDropdown from './stock-search-dropdown';

interface RankingStock {
  rank: number;
  ticker: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  marketCap: string;
  volume?: string;
  tradeValue?: string;
  description?: string;
}

interface StockRankingTableProps {
  stocks: RankingStock[];
  onStockClick?: (stock: RankingStock) => void;
  title?: string;
  rankingType?: 'volume' | 'rising' | 'falling';
  onRankingTypeChange?: (type: 'volume' | 'rising' | 'falling') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  marketType?: '전체' | 'kospi' | 'kosdaq';
  onMarketTypeChange?: (type: '전체' | 'kospi' | 'kosdaq') => void;
}

const StockRankingTable: React.FC<StockRankingTableProps> = ({
  stocks,
  onStockClick,
  title = '실시간 차트',
  rankingType = 'volume',
  onRankingTypeChange,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit: _onSearchSubmit,
  marketType = '전체',
  onMarketTypeChange
}) => {
  // Get current time for subtitle
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `오늘 ${hours}:${minutes}:${seconds} 기준`;
  };

  const [subtitle, setSubtitle] = React.useState(getCurrentTime());

  // Update time every second for real-time display
  React.useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      setSubtitle(getCurrentTime());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'bg-orange-500';
    if (rank <= 6) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  // Format volume/value numbers to Korean units (만, 억)
  const formatKoreanNumber = (value: string | number): string => {
    if (!value) return '0';
    
    // Convert to number if it's a string with M, K, B suffixes
    let numValue: number;
    if (typeof value === 'string') {
      const numStr = value.replace(/,/g, '');
      if (numStr.includes('M') || numStr.includes('m')) {
        numValue = parseFloat(numStr.replace(/[Mm]/g, '')) * 1000000;
      } else if (numStr.includes('K') || numStr.includes('k')) {
        numValue = parseFloat(numStr.replace(/[Kk]/g, '')) * 1000;
      } else if (numStr.includes('B') || numStr.includes('b')) {
        numValue = parseFloat(numStr.replace(/[Bb]/g, '')) * 1000000000;
      } else {
        numValue = parseFloat(numStr) || 0;
      }
    } else {
      numValue = value;
    }

    // Format in Korean units
    if (numValue >= 100000000) {
      // 억 단위 (100 million)
      return `${(numValue / 100000000).toFixed(1)}억`;
    } else if (numValue >= 10000) {
      // 만 단위 (10 thousand)
      return `${(numValue / 10000).toFixed(1)}만`;
    } else {
      return numValue.toLocaleString();
    }
  };


  const rankingCategories = [
    { id: 'volume' as const, name: '거래량' },
    { id: 'rising' as const, name: '급상승' },
    { id: 'falling' as const, name: '급하락' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          {title} <span className="text-sm font-normal text-gray-500">{subtitle}</span>
        </h2>
        
        {/* Market Filter */}
        {onMarketTypeChange && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">마켓:</span>
            <button
              onClick={() => onMarketTypeChange('전체')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                marketType === '전체'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => onMarketTypeChange('kospi')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                marketType === 'kospi'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              KOSPI
            </button>
            <button
              onClick={() => onMarketTypeChange('kosdaq')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                marketType === 'kosdaq'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              KOSDAQ
            </button>
          </div>
        )}
      </div>

      {/* Ranking Category Tabs and Search Bar */}
      <div className="flex items-end justify-between mb-6 border-b">
        <div className="flex space-x-6">
          {rankingCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onRankingTypeChange?.(category.id)}
              className={`pb-2 font-medium ${
                rankingType === category.id
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Search Bar with Dropdown */}
        <StockSearchDropdown
          value={searchQuery}
          onChange={onSearchChange || (() => {})}
          onSelect={(stock) => {
            if (onStockClick) {
              onStockClick({
                rank: 0,
                ticker: stock.ticker,
                name: stock.name,
                price: 0,
                change: 0,
                changeRate: 0,
                marketCap: '0'
              });
            }
          }}
          className="w-64"
        />
      </div>

      {/* Stock Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-600 border-b">
              <th className="pb-3 w-16">종목</th>
              <th className="pb-3"></th>
              <th className="pb-3 text-right pr-2">현재가</th>
              <th className="pb-3 text-right pr-2">등락률</th>
              <th className="pb-3 text-right pr-2">
                {rankingType === 'volume' ? '거래량' : 
                 rankingType === 'rising' || rankingType === 'falling' ? '거래량' : '거래량'}
              </th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr 
                key={stock.ticker} 
                className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onStockClick?.(stock)}
              >
                <td className="py-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
                    {stock.rank}
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full ${getRankColor(stock.rank)} flex items-center justify-center mr-3`}>
                      <span className="text-white font-bold text-sm">
                        {stock.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{stock.name}</div>
                      {stock.description && (
                        <div className="text-xs text-red-500 mt-1">{stock.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 text-right font-medium pr-2">
                  {stock.price.toLocaleString()}원
                </td>
                <td className={`py-4 text-right font-medium pr-2 ${
                  stock.changeRate < 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {stock.changeRate > 0 ? '+' : ''}{stock.changeRate.toFixed(2)}%
                </td>
                <td className="py-4 text-right text-gray-600 pr-2">
                  {formatKoreanNumber(stock.volume || '0')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default StockRankingTable;