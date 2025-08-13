import React, { useEffect, useState } from 'react';
import AuthService from '../../services/authService';

interface StockDetailHeaderProps {
  ticker: string;
  name: string;
  price?: number;
  change?: number;
  changeRate?: number;
  high?: number;
  low?: number;
  open?: number;
  prevClose?: number;
  volume?: string;
  onFavoriteToggle?: () => void;
  isFavorite?: boolean;
  darkMode?: boolean;
}

interface StockDetailData {
  price: number;
  change: number;
  changeRate: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: string;
}

const StockDetailHeader: React.FC<StockDetailHeaderProps> = ({
  ticker,
  name,
  price,
  change,
  changeRate,
  high,
  low,
  open,
  prevClose,
  volume,
  onFavoriteToggle,
  isFavorite = false,
  darkMode = false
}) => {
  const [stockData, setStockData] = useState<StockDetailData>({
    price: price || 0,
    change: change || 0,
    changeRate: changeRate || 0,
    high: high || 0,
    low: low || 0,
    open: open || 0,
    prevClose: prevClose || 0,
    volume: volume || '0'
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update stock data when props change
  useEffect(() => {
    if (price !== undefined) {
      setStockData(prev => ({
        ...prev,
        price: price || 0,
        change: change || 0,
        changeRate: changeRate || 0,
        high: high || prev.price,
        low: low || prev.price,
        open: open || prev.price,
        prevClose: prevClose || prev.price,
        volume: volume || '0'
      }));
    } else if (ticker) {
      fetchStockDetail();
    }
  }, [ticker, price, change, changeRate, high, low, open, prevClose, volume]);

  const fetchStockDetail = async () => {
    setIsLoading(true);
    try {
      const marketType = ticker.startsWith('900') || ticker.startsWith('300') ? 'KOSDAQ' : 'KOSPI';
      const cleanTicker = ticker;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/krx/stock/${cleanTicker}?market=${marketType}`
      );

      if (!response.ok) {
        console.error(`API failed with status: ${response.status}`);
        // Set default values when API fails
        setStockData({
          price: 0,
          change: 0,
          changeRate: 0,
          high: 0,
          low: 0,
          open: 0,
          prevClose: 0,
          volume: '0'
        });
        return;
      }

      const responseData = await response.json();
      console.log('주식 상세 정보:', responseData);

      // Handle both wrapped {success, data} format and direct object format
      let stockInfo;
      if (responseData.success !== undefined) {
        // Wrapped format
        if (!responseData.success) {
          throw new Error(responseData.message || '주식 정보 로드 실패');
        }
        stockInfo = responseData.data;
      } else if (responseData.ISU_SRT_CD || responseData.ticker) {
        // Direct KrxStockInfo object format
        stockInfo = responseData;
      }

      if (stockInfo) {
        // Handle single stock info response (not array)
        const currentPrice = parseFloat(stockInfo.TDD_CLSPRC?.replace(/,/g, '') || stockInfo.closePrice?.replace(/,/g, '') || '0');
        const priceChange = parseFloat(stockInfo.CMPPREVDD_PRC?.replace(/,/g, '') || stockInfo.priceChange?.replace(/,/g, '') || '0');
        const changePct = parseFloat(stockInfo.FLUC_RT?.replace(/,/g, '') || stockInfo.changeRate?.replace(/,/g, '') || '0');
        const openPrice = parseFloat(stockInfo.TDD_OPNPRC?.replace(/,/g, '') || stockInfo.openPrice?.replace(/,/g, '') || '0');
        const highPrice = parseFloat(stockInfo.TDD_HGPRC?.replace(/,/g, '') || stockInfo.highPrice?.replace(/,/g, '') || '0');
        const lowPrice = parseFloat(stockInfo.TDD_LWPRC?.replace(/,/g, '') || stockInfo.lowPrice?.replace(/,/g, '') || '0');

        setStockData({
          price: currentPrice,
          change: priceChange,
          changeRate: changePct,
          high: highPrice || currentPrice, // Fallback to current price only if no high price
          low: lowPrice || currentPrice,   // Fallback to current price only if no low price
          open: openPrice || currentPrice, // Fallback to current price only if no open price
          prevClose: currentPrice - priceChange,
          volume: formatVolume(parseInt(stockInfo.ACC_TRDVOL?.replace(/,/g, '') || stockInfo.volume?.replace(/,/g, '') || '0'))
        });

        // Debug logging
        console.log(`📊 Stock data for ${ticker}:`, {
          raw: stockInfo,
          parsed: {
            price: currentPrice,
            open: openPrice,
            high: highPrice,
            low: lowPrice,
            change: priceChange,
            changeRate: changePct,
            prevClose: currentPrice - priceChange
          }
        });
      }
    } catch (error) {
      console.error('주식 상세 정보 로드 오류:', error);
      // Set default values when error occurs
      setStockData({
        price: 0,
        change: 0,
        changeRate: 0,
        high: 0,
        low: 0,
        open: 0,
        prevClose: 0,
        volume: '0'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}억주`;
    } else if (volume >= 100000000) {
      return `${(volume / 100000000).toFixed(2)}억주`;
    } else if (volume >= 10000) {
      return `${(volume / 10000).toFixed(1)}만주`;
    }
    return `${volume.toLocaleString()}주`;
  };

  const isNegative = stockData.changeRate < 0;
  // Korean market convention: Red for up, Blue for down
  const changeColor = isNegative ? 'text-blue-600' : 'text-red-600';
  const changeIcon = isNegative ? '▼' : stockData.changeRate > 0 ? '▲' : '';

  if (isLoading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 animate-pulse`}>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
      <div className="mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {name} <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{ticker}</span>
            </h1>
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
          <div className="flex items-baseline mt-2">
            <span className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {stockData.price > 0 ? stockData.price.toLocaleString() : '0'}원
            </span>
            <span className={`ml-3 text-lg ${changeColor}`}>
              {changeIcon} {Math.abs(stockData.change || 0).toLocaleString()}원 ({Math.abs(stockData.changeRate || 0).toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>전일종가</div>
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            {stockData.prevClose.toLocaleString()}원
          </div>
        </div>
        <div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>시가</div>
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            {stockData.open.toLocaleString()}원
          </div>
        </div>
        <div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>고가</div>
          <div className="text-sm font-medium text-red-600">
            {stockData.high.toLocaleString()}원
          </div>
        </div>
        <div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>저가</div>
          <div className="text-sm font-medium text-blue-600">
            {stockData.low.toLocaleString()}원
          </div>
        </div>
        <div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>거래량</div>
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            {stockData.volume}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailHeader;
