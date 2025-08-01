import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface StockInfo {
  ticker: string;
  name: string;
  marketType?: string;
}

interface StockPrice {
  price: number;
  change: number;
  changeRate: number;
  volume: string;
  marketCap: string;
  high?: number;
  low?: number;
  open?: number;
  prevClose?: number;
}

interface StockData extends StockInfo, StockPrice {
  lastUpdated?: Date;
}

interface UseStockDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const API_BASE_URL = 'http://localhost:8081/api';

export const useStockData = (
  ticker: string | null,
  options: UseStockDataOptions = {}
) => {
  const { autoRefresh = false, refreshInterval = 10000 } = options;
  
  const [data, setData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = useCallback(async () => {
    if (!ticker) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to get data from KRX API first (more comprehensive)
      try {
        // Determine market type - default to STK for KOSPI, can be enhanced with lookup
        const marketType = ticker.startsWith('900') || ticker.startsWith('300') ? 'KSQ' : 'STK';
        const response = await axios.get(`${API_BASE_URL}/krx/stock/${ticker}?market=${marketType}`);
        
        if (response.data) {
          const stockInfo = response.data;
          const price = parseFloat(stockInfo.closePrice) || 0;
          const change = parseFloat(stockInfo.priceChange) || 0;
          const changeRate = parseFloat(stockInfo.changeRate) || 0;
          
          setData({
            ticker: stockInfo.ticker,
            name: stockInfo.name,
            marketType: marketType === 'STK' ? 'KOSPI' : 'KOSDAQ',
            price: price,
            change: change,
            changeRate: changeRate,
            volume: stockInfo.volume || '0',
            marketCap: stockInfo.marketCap || '0',
            high: price + Math.abs(change), // Estimate
            low: price - Math.abs(change),  // Estimate
            open: price - change,
            prevClose: price - change,
            lastUpdated: new Date()
          });
          return;
        }
      } catch (krxErr) {
        console.warn('KRX API not available, falling back to basic search:', krxErr);
      }

      // Fallback to basic search if KRX API fails
      const searchResponse = await axios.get(`${API_BASE_URL}/stock/search/${ticker}`);
      
      if (searchResponse.data.success && searchResponse.data.data.length > 0) {
        const stockInfo = searchResponse.data.data[0];
        
        // Try to get daily chart data for recent prices
        try {
          const chartResponse = await axios.get(`${API_BASE_URL}/stock/daily/${ticker}?period=1`);
          if (chartResponse.data.success && chartResponse.data.data.length > 0) {
            const latestData = chartResponse.data.data[0];
            const prevData = chartResponse.data.data[1] || latestData;
            
            const price = latestData.close;
            const prevClose = prevData.close;
            const change = price - prevClose;
            const changeRate = ((change / prevClose) * 100);
            
            setData({
              ticker: stockInfo.ticker,
              name: stockInfo.name,
              marketType: stockInfo.marketType || 'KOSPI',
              price: price,
              change: change,
              changeRate: changeRate,
              volume: `${(latestData.volume / 1000000).toFixed(1)}M`,
              marketCap: stockInfo.marketCap || '0',
              high: price * 1.02, // Estimate
              low: price * 0.98,  // Estimate
              open: price,
              prevClose: prevClose,
              lastUpdated: new Date()
            });
          } else {
            // Fallback with basic info only
            setData({
              ticker: stockInfo.ticker,
              name: stockInfo.name,
              marketType: stockInfo.marketType || 'KOSPI',
              price: 0,
              change: 0,
              changeRate: 0,
              volume: '0',
              marketCap: '0',
              lastUpdated: new Date()
            });
          }
        } catch (priceErr) {
          console.warn('Price data not available:', priceErr);
          setData({
            ticker: stockInfo.ticker,
            name: stockInfo.name,
            marketType: stockInfo.marketType || 'KOSPI',
            price: 0,
            change: 0,
            changeRate: 0,
            volume: '0',
            marketCap: '0',
            lastUpdated: new Date()
          });
        }
      } else {
        setError('주식 정보를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    if (ticker) {
      fetchStockData();
    }
  }, [ticker, fetchStockData]);

  useEffect(() => {
    if (!autoRefresh || !ticker) return;

    const interval = setInterval(fetchStockData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, ticker, fetchStockData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStockData
  };
};

// Simple cache for stock data
const stockDataCache: { [key: string]: { data: StockData[], timestamp: number } } = {};
const CACHE_DURATION = 30000; // 30 seconds cache

export const useStockList = (
  rankingType: 'volume' | 'rising' | 'falling' = 'volume',
  marketType: '전체' | 'kospi' | 'kosdaq' = '전체'
) => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockList = useCallback(async () => {
    const cacheKey = `${marketType}-${rankingType}`;
    const cached = stockDataCache[cacheKey];
    
    // If we have cached data, show it immediately while loading new data
    if (cached) {
      setStocks(cached.data);
      
      // If cache is still fresh, don't fetch new data
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      let combinedData: any[] = [];
      
      if (marketType === '전체') {
        // For 전체 mode behavior:
        // - Volume/Value rankings: Show KOSPI only (like TossInvest major market focus)
        // - Rising/Falling rankings: Combine KOSPI+KOSDAQ (like TossInvest percentage rankings)
        
        if (rankingType === 'rising' || rankingType === 'falling') {
          // For percentage-based rankings, combine both markets like TossInvest
          const kospiEndpoint = getStockEndpoint('kospi', rankingType);
          const kosdaqEndpoint = getStockEndpoint('kosdaq', rankingType);
          const etfEndpoint = `${API_BASE_URL}/krx/etf/daily-trading`;
          
          const [kospiResponse, kosdaqResponse, etfResponse] = await Promise.allSettled([
            axios.get(`${kospiEndpoint}?limit=50`),
            axios.get(`${kosdaqEndpoint}?limit=50`),
            axios.get(etfEndpoint)
          ]);
          
          console.log('ETF API Response:', etfResponse);
          
          // Combine KOSPI and KOSDAQ data
          if (kospiResponse.status === 'fulfilled' && kospiResponse.value.data && Array.isArray(kospiResponse.value.data)) {
            const kospiStocks = kospiResponse.value.data.map((stock: any) => ({
              ticker: stock.ticker,
              name: stock.name,
              price: stock.price,
              change: stock.change,
              changeRate: stock.changeRate,
              volume: stock.volume,
              tradeValue: stock.tradeValue,
              marketCap: stock.marketCap,
              type: 'stock',
              market: 'KOSPI'
            }));
            combinedData = [...combinedData, ...kospiStocks];
          }
          
          if (kosdaqResponse.status === 'fulfilled' && kosdaqResponse.value.data && Array.isArray(kosdaqResponse.value.data)) {
            const kosdaqStocks = kosdaqResponse.value.data.map((stock: any) => ({
              ticker: stock.ticker,
              name: stock.name,
              price: stock.price,
              change: stock.change,
              changeRate: stock.changeRate,
              volume: stock.volume,
              tradeValue: stock.tradeValue,
              marketCap: stock.marketCap,
              type: 'stock',
              market: 'KOSDAQ'
            }));
            combinedData = [...combinedData, ...kosdaqStocks];
          }
          
          // Add ETF data for rising/falling rankings
          console.log('ETF Response status:', etfResponse.status);
          console.log('ETF Response data:', etfResponse.status === 'fulfilled' ? etfResponse.value.data : 'No data');
          
          if (etfResponse.status === 'fulfilled' && etfResponse.value.data && Array.isArray(etfResponse.value.data) && etfResponse.value.data.length > 0) {
            console.log('Processing', etfResponse.value.data.length, 'ETFs');
            const etfData = etfResponse.value.data.map((etf: any) => ({
              ticker: etf.ticker,
              name: `${etf.name} (ETF)`,
              price: etf.price,
              change: etf.change,
              changeRate: etf.changeRate,
              volume: etf.volume,
              tradeValue: etf.tradeValue,
              marketCap: etf.marketCap,
              type: 'etf',
              market: 'ETF'
            }));
            combinedData = [...combinedData, ...etfData];
            console.log('Added', etfData.length, 'ETFs to combined data');
          } else {
            console.log('No ETF data to add - check failed:', {
              status: etfResponse.status,
              hasData: etfResponse.status === 'fulfilled' ? !!etfResponse.value.data : false,
              isArray: etfResponse.status === 'fulfilled' && etfResponse.value.data ? Array.isArray(etfResponse.value.data) : false,
              length: etfResponse.status === 'fulfilled' && etfResponse.value.data && Array.isArray(etfResponse.value.data) ? etfResponse.value.data.length : 0
            });
          }
          
          // Re-sort combined data for percentage rankings
          combinedData = sortCombinedData(combinedData, rankingType);
          
        } else {
          // For volume/value rankings, show KOSPI only with ETF integration
          const kospiEndpoint = getStockEndpoint('kospi', rankingType);
          const etfEndpoint = `${API_BASE_URL}/krx/etf/daily-trading`;
          
          const [kospiResponse, etfResponse] = await Promise.allSettled([
            axios.get(`${kospiEndpoint}?limit=40`),
            axios.get(etfEndpoint)
          ]);
          
          console.log('Volume ranking - ETF API Response:', etfResponse);
          
          // Process KOSPI data with preserved ranking
          if (kospiResponse.status === 'fulfilled' && kospiResponse.value.data && Array.isArray(kospiResponse.value.data)) {
            const kospiStocks = kospiResponse.value.data.map((stock: any, index: number) => ({
              rank: index + 1,
              ticker: stock.ticker,
              name: stock.name,
              price: stock.price,
              change: stock.change,
              changeRate: stock.changeRate,
              volume: stock.volume,
              tradeValue: stock.tradeValue,
              marketCap: stock.marketCap,
              type: 'stock',
              market: 'KOSPI'
            }));
            combinedData = [...kospiStocks];
          }
          
          // Process ETF data and integrate with KOSPI rankings
          console.log('Volume - ETF Response status:', etfResponse.status);
          console.log('Volume - ETF Response data:', etfResponse.status === 'fulfilled' ? etfResponse.value.data : 'No data');
          
          if (etfResponse.status === 'fulfilled' && etfResponse.value.data && Array.isArray(etfResponse.value.data) && etfResponse.value.data.length > 0) {
            console.log('Volume - Processing', etfResponse.value.data.length, 'ETFs');
            const etfData = etfResponse.value.data.map((etf: any) => ({
              ticker: etf.ticker,
              name: `${etf.name} (ETF)`,
              price: etf.price,
              change: etf.change,
              changeRate: etf.changeRate,
              volume: etf.volume,
              tradeValue: etf.tradeValue,
              marketCap: etf.marketCap,
              type: 'etf',
              market: 'ETF'
            }));
            
            // Integrate ETFs by their actual ranking value
            etfData.forEach(etf => {
              const etfValue = parseVolumeValue(etf[getRankingField(rankingType)]);
              let insertIndex = combinedData.findIndex(stock => {
                const stockValue = parseVolumeValue(stock[getRankingField(rankingType)]);
                return rankingType === 'falling' ? etfValue < stockValue : etfValue > stockValue;
              });
              
              if (insertIndex === -1) insertIndex = combinedData.length;
              combinedData.splice(insertIndex, 0, etf);
            });
          } else {
            console.log('ETF API integration pending - showing KOSPI rankings only');
          }
        }
        
      } else {
        // Fetch single market data (KOSPI or KOSDAQ)
        const stockEndpoint = getStockEndpoint(marketType, rankingType);
        const etfEndpoint = `${API_BASE_URL}/krx/etf/daily-trading`;
        
        const [stockResponse, etfResponse] = await Promise.allSettled([
          axios.get(`${stockEndpoint}?limit=40`),
          axios.get(etfEndpoint)
        ]);
        
        // Process single market stock data
        if (stockResponse.status === 'fulfilled' && stockResponse.value.data && Array.isArray(stockResponse.value.data)) {
          const rankedStocks = stockResponse.value.data.map((stock: any, index: number) => ({
            rank: index + 1,
            ticker: stock.ticker,
            name: stock.name,
            price: stock.price,
            change: stock.change,
            changeRate: stock.changeRate,
            volume: stock.volume,
            tradeValue: stock.tradeValue,
            marketCap: stock.marketCap,
            type: 'stock',
            market: marketType.toUpperCase()
          }));
          combinedData = [...rankedStocks];
        }
        
        // Process ETF data for single market view
        if (etfResponse.status === 'fulfilled' && etfResponse.value.data && Array.isArray(etfResponse.value.data) && etfResponse.value.data.length > 0) {
          const etfData = etfResponse.value.data.map((etf: any) => ({
            ticker: etf.ticker,
            name: `${etf.name} (ETF)`,
            price: etf.price,
            change: etf.change,
            changeRate: etf.changeRate,
            volume: etf.volume,
            tradeValue: etf.tradeValue,
            marketCap: etf.marketCap,
            type: 'etf',
            market: 'ETF'
          }));
          
          combinedData = [...combinedData, ...etfData];
        } else {
          console.log('ETF API integration pending - showing stocks only');
        }
      }
      
      // Assign final rankings based on mode and ranking type
      const finalData = combinedData.slice(0, 20).map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      console.log('Final data:', finalData);
      console.log('ETFs in final data:', finalData.filter(item => item.type === 'etf').length);
      
      setStocks(finalData);
      
      // Update cache
      const cacheKey = `${marketType}-${rankingType}`;
      stockDataCache[cacheKey] = { data: finalData, timestamp: Date.now() };
      
    } catch (err: any) {
      console.error('Error fetching combined stock and ETF data:', err);
      if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        setError('순위 데이터를 가져올 수 없습니다.');
      }
      setStocks([]);
    } finally {
      setIsLoading(false);
    }
  }, [rankingType, marketType]);

  useEffect(() => {
    fetchStockList();
  }, [fetchStockList]);

  return {
    stocks,
    isLoading,
    error,
    refetch: fetchStockList
  };
};

// Helper function to get stock endpoint
function getStockEndpoint(marketType: string, rankingType: string): string {
  const baseUrl = API_BASE_URL;
  
  if (marketType === 'kosdaq') {
    switch (rankingType) {
      case 'volume':
        return `${baseUrl}/krx/kosdaq/volume-ranking`;
      case 'rising':
        return `${baseUrl}/krx/kosdaq/price-increase-ranking`;
      case 'falling':
        return `${baseUrl}/krx/kosdaq/price-decrease-ranking`;
      default:
        return `${baseUrl}/krx/kosdaq/volume-ranking`;
    }
  } else if (marketType === 'kospi') {
    switch (rankingType) {
      case 'volume':
        return `${baseUrl}/krx/kospi/volume-ranking`;
      case 'rising':
        return `${baseUrl}/krx/kospi/price-increase-ranking`;
      case 'falling':
        return `${baseUrl}/krx/kospi/price-decrease-ranking`;
      default:
        return `${baseUrl}/krx/kospi/volume-ranking`;
    }
  } else {
    // Default to KOSPI for 전체 or other cases
    switch (rankingType) {
      case 'volume':
        return `${baseUrl}/krx/kospi/volume-ranking`;
      case 'rising':
        return `${baseUrl}/krx/kospi/price-increase-ranking`;
      case 'falling':
        return `${baseUrl}/krx/kospi/price-decrease-ranking`;
      default:
        return `${baseUrl}/krx/kospi/volume-ranking`;
    }
  }
}

// Helper function to sort combined data
function sortCombinedData(data: any[], rankingType: string): any[] {
  switch (rankingType) {
    case 'volume':
      return data.sort((a, b) => parseVolumeValue(b.volume) - parseVolumeValue(a.volume));
    case 'rising':
      return data.sort((a, b) => (b.changeRate || 0) - (a.changeRate || 0));
    case 'falling':
      return data.sort((a, b) => (a.changeRate || 0) - (b.changeRate || 0));
    default:
      return data;
  }
}

// Helper function to parse volume values (handles M, K suffixes)
function parseVolumeValue(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || typeof value !== 'string') return 0;
  
  const numStr = value.replace(/,/g, '');
  if (numStr.includes('M') || numStr.includes('m')) {
    return parseFloat(numStr.replace(/[Mm]/g, '')) * 1000000;
  }
  if (numStr.includes('K') || numStr.includes('k')) {
    return parseFloat(numStr.replace(/[Kk]/g, '')) * 1000;
  }
  if (numStr.includes('B') || numStr.includes('b')) {
    return parseFloat(numStr.replace(/[Bb]/g, '')) * 1000000000;
  }
  return parseFloat(numStr) || 0;
}

// Helper function to get the field name for ranking comparison
function getRankingField(rankingType: string): string {
  switch (rankingType) {
    case 'volume':
      return 'volume';
    case 'rising':
    case 'falling':
      return 'changeRate';
    default:
      return 'volume';
  }
}


export const useMarketIndices = () => {
  const [indices, setIndices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketIndices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement real market indices API call
      // For now, return empty array until real API is implemented
      setIndices([]);
      setError('시장 지수 API가 아직 구현되지 않았습니다.');
    } catch (err) {
      console.error('Error fetching market indices:', err);
      setError('시장 지수를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketIndices();
  }, [fetchMarketIndices]);

  return {
    indices,
    isLoading,
    error,
    refetch: fetchMarketIndices
  };
};

export const useInvestorTrends = (ticker: string | null) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestorTrends = useCallback(async () => {
    if (!ticker) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/stock/investor-trends/${ticker}`);
      
      if (response.data.success && response.data.data) {
        setData(response.data.data);
      } else {
        setError('투자자 동향 데이터를 찾을 수 없습니다.');
        setData(null);
      }
    } catch (err) {
      console.error('Error fetching investor trends:', err);
      setError('투자자 동향 데이터를 불러오는 중 오류가 발생했습니다.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    if (ticker) {
      fetchInvestorTrends();
    }
  }, [ticker, fetchInvestorTrends]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchInvestorTrends
  };
};


// Hook for comprehensive stock basic info using your granted APIs
export const useStockBasicInfo = (ticker: string | null, marketType: 'STK' | 'KSQ' = 'STK') => {
  const [basicInfo, setBasicInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBasicInfo = useCallback(async () => {
    if (!ticker) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Use your granted "유가증권 종목기본정보" or "코스닥 종목기본정보" APIs
      const endpoint = marketType === 'STK' 
        ? `${API_BASE_URL}/krx/securities/basic-info/${ticker}`
        : `${API_BASE_URL}/krx/kosdaq/basic-info/${ticker}`;
        
      const response = await axios.get(endpoint);
      
      if (response.data) {
        setBasicInfo(response.data);
      } else {
        setError('종목 기본정보를 가져올 수 없습니다.');
      }
    } catch (err) {
      console.error('Error fetching basic stock info:', err);
      setError('종목 기본정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [ticker, marketType]);

  useEffect(() => {
    if (ticker) {
      fetchBasicInfo();
    }
  }, [ticker, fetchBasicInfo]);

  return {
    basicInfo,
    isLoading,
    error,
    refetch: fetchBasicInfo
  };
};