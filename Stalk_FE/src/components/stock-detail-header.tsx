import React from 'react';

interface StockDetailHeaderProps {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  onFavoriteToggle?: () => void;
  isFavorite?: boolean;
  high?: number;
  low?: number;
  open?: number;
  prevClose?: number;
  volume?: string;
}

const StockDetailHeader: React.FC<StockDetailHeaderProps> = ({
  ticker,
  name,
  price,
  change,
  changeRate,
  onFavoriteToggle,
  isFavorite = false,
  high,
  low,
  open,
  prevClose,
  volume
}) => {
  // Debug logging
  console.log("StockDetailHeader props:", { ticker, name, price, change, changeRate });
  
  const isNegative = changeRate < 0;
  const changeColor = isNegative ? 'text-blue-600' : 'text-red-600';
  const changeIcon = isNegative ? '▼' : changeRate > 0 ? '▲' : '';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {name} <span className="text-gray-500">{ticker}</span>
          </h1>
          <div className="flex items-baseline mt-2">
            <span className="text-3xl font-bold text-gray-900">
              {price > 0 ? price.toLocaleString() : '0'}원
            </span>
            <span className={`ml-3 text-lg ${changeColor}`}>
              {changeIcon} {Math.abs(change || 0).toLocaleString()}원 ({Math.abs(changeRate || 0).toFixed(2)}%)
            </span>
          </div>
        </div>
        <button 
          onClick={onFavoriteToggle}
          className={`text-gray-400 hover:text-yellow-500 transition-colors ${
            isFavorite ? 'text-yellow-500' : ''
          }`}
        >
          <svg 
            className="w-6 h-6" 
            fill={isFavorite ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
            />
          </svg>
        </button>
      </div>

      {/* Additional Stock Info */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-xs text-gray-600">전일종가</div>
          <div className="text-sm font-medium">{(prevClose || (price - change)).toLocaleString()}원</div>
        </div>
        <div>
          <div className="text-xs text-gray-600">시가</div>
          <div className="text-sm font-medium">{(open || price).toLocaleString()}원</div>
        </div>
        <div>
          <div className="text-xs text-gray-600">고가</div>
          <div className="text-sm font-medium text-red-600">
            {(high || (price * 1.02)).toLocaleString()}원
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600">저가</div>
          <div className="text-sm font-medium text-blue-600">
            {(low || (price * 0.98)).toLocaleString()}원
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600">거래량</div>
          <div className="text-sm font-medium">{volume || '0'}</div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailHeader;