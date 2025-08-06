import { useState, useEffect, useCallback } from 'react';

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
      const marketType = ticker.startsWith('900') || ticker.startsWith('300') ? 'KOSDAQ' : 'KOSPI';
      const response = await fetch(
        `/api/krx/stock/${ticker}?market=${marketType}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '주식 데이터 로드 실패');
      }

      const responseData = await response.json();
      
      // Handle both wrapped {success, data} format and direct object format
      let stockInfo;
      if (responseData.success !== undefined) {
        // Wrapped format
        if (!responseData.success) {
          throw new Error(responseData.message || '주식 데이터 로드 실패');
        }
        stockInfo = responseData.data;
      } else if (responseData.ISU_SRT_CD || responseData.ticker) {
        // Direct KrxStockInfo object format
        stockInfo = responseData;
      }
      
      if (stockInfo) {
        // Handle both field naming conventions
        const closePrice = stockInfo.closePrice || stockInfo.TDD_CLSPRC || stockInfo.ISU_CLSPRC || '0';
        const priceChange = stockInfo.priceChange || stockInfo.CMPPREVDD_PRC || '0';
        const changeRateStr = stockInfo.changeRate || stockInfo.FLUC_RT || '0';
        const volumeStr = stockInfo.volume || stockInfo.ACC_TRDVOL || '0';
        const marketCapStr = stockInfo.marketCap || stockInfo.MKTCAP || '0';
        const stockName = stockInfo.name || stockInfo.ISU_ABBRV || '';
        const stockTicker = stockInfo.ticker || stockInfo.ISU_SRT_CD || ticker;
        
        const price = parseFloat(closePrice.toString().replace(/,/g, '')) || 0;
        const change = parseFloat(priceChange.toString().replace(/,/g, '')) || 0;
        const changeRate = parseFloat(changeRateStr.toString().replace(/,/g, '')) || 0;

        setData({
          ticker: stockTicker,
          name: stockName,
          marketType: ticker.startsWith('900') || ticker.startsWith('300') ? 'KOSDAQ' : 'KOSPI',
          price: price,
          change: change,
          changeRate: changeRate,
          volume: volumeStr,
          marketCap: marketCapStr,
          high: price + Math.abs(change),
          low: price - Math.abs(change),
          open: price - change,
          prevClose: price - change,
          lastUpdated: new Date()
        });
      } else {
        throw new Error('주식 데이터를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError(err instanceof Error ? err.message : '주식 데이터를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    if (ticker) {
      fetchStockData();
    }
  }, [ticker]);

  useEffect(() => {
    if (!autoRefresh || !ticker) return;

    const interval = setInterval(fetchStockData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, ticker, fetchStockData]);

  const refresh = useCallback(() => {
    return fetchStockData();
  }, [fetchStockData]);

  return {
    data,
    isLoading,
    error,
    refresh
  };
};

export const useStockList = (category?: 'gainers' | 'losers' | 'volume', marketType?: string) => {
  const [stocks, setStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let allStocks: any[] = [];

      if (category === 'volume') {
        // Use the combined volume endpoint
        const response = await fetch('/api/krx/ranking/volume');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || '거래량 순위 로드 실패');
        }

        const responseData = await response.json();
        if (responseData.success && responseData.data) {
          allStocks = responseData.data;
        }
      } else {
        // For gainers and losers, fetch from both KOSPI and KOSDAQ
        const kospiEndpoint = category === 'gainers' 
          ? '/api/krx/kospi/price-increase-ranking'
          : '/api/krx/kospi/price-decrease-ranking';
        
        const kosdaqEndpoint = category === 'gainers'
          ? '/api/krx/kosdaq/price-increase-ranking' 
          : '/api/krx/kosdaq/price-decrease-ranking';

        // Fetch both markets concurrently
        const [kospiResponse, kosdaqResponse] = await Promise.all([
          fetch(kospiEndpoint),
          fetch(kosdaqEndpoint)
        ]);

        if (!kospiResponse.ok || !kosdaqResponse.ok) {
          throw new Error('상승/하락률 순위 로드 실패');
        }

        const [kospiData, kosdaqData] = await Promise.all([
          kospiResponse.json(),
          kosdaqResponse.json()
        ]);

        // Combine both arrays
        allStocks = [...kospiData, ...kosdaqData];

        // Sort by change rate and re-rank
        allStocks.sort((a, b) => {
          const aRate = Math.abs(parseFloat(a.changeRate) || 0);
          const bRate = Math.abs(parseFloat(b.changeRate) || 0);
          return bRate - aRate;
        });

        // Update rankings and limit to top 50
        allStocks = allStocks.slice(0, 50).map((stock, index) => ({
          ...stock,
          rank: index + 1
        }));
      }
      
      // Apply market filtering if specified
      if (marketType && marketType !== '전체') {
        allStocks = allStocks.filter((stock: any) => {
          const ticker = stock.ticker || '';
          
          if (marketType === 'kospi') {
            // KOSPI stocks: regular 6-digit codes, typically 0-3 prefix
            return !ticker.startsWith('9') && !ticker.startsWith('3');
          } else if (marketType === 'kosdaq') {
            // KOSDAQ stocks: typically start with 9 or 3
            return ticker.startsWith('9') || ticker.startsWith('3');
          }
          return true;
        });

        // Re-rank after filtering
        allStocks = allStocks.map((stock, index) => ({
          ...stock,
          rank: index + 1
        }));
      }
      
      setStocks(allStocks);
    } catch (err) {
      console.error('Error fetching stock list:', err);
      setError(err instanceof Error ? err.message : '주식 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [category, marketType]);

  useEffect(() => {
    fetchStocks();
  }, [category, marketType]);

  return {
    stocks,
    isLoading,
    error,
    refresh: fetchStocks
  };
};

export const useMarketIndices = () => {
  const [indices, setIndices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/krx/indices');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '지수 데이터 로드 실패');
      }

      const responseData = await response.json();
      
      if (responseData.success && responseData.data) {
        setIndices(responseData.data);
      }
    } catch (err) {
      console.error('Error fetching market indices:', err);
      setError(err instanceof Error ? err.message : '지수 데이터를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndices();
  }, []);

  return {
    indices,
    isLoading,
    error,
    refresh: fetchIndices
  };
};

export const useStockBasicInfo = (ticker: string | null) => {
  const [info, setInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async () => {
    if (!ticker) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stalk/info/${ticker}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '종목 정보 로드 실패');
      }

      const responseData = await response.json();
      
      if (responseData.success && responseData.data) {
        setInfo(responseData.data);
      }
    } catch (err) {
      console.error('Error fetching stock info:', err);
      setError(err instanceof Error ? err.message : '종목 정보를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    if (ticker) {
      fetchInfo();
    }
  }, [ticker]);

  return {
    info,
    isLoading,
    error,
    refresh: fetchInfo
  };
};