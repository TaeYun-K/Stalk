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
      const marketType = ticker.startsWith('900') || ticker.startsWith('300') ? 'KSQ' : 'STK';
      const response = await fetch(
        `/api/public/krx/stock/${ticker}?market=${marketType}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '주식 데이터 로드 실패');
      }

      const responseData = await response.json();
      
      if (responseData.success && responseData.data) {
        const stockInfo = responseData.data;
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
          high: price + Math.abs(change),
          low: price - Math.abs(change),
          open: price - change,
          prevClose: price - change,
          lastUpdated: new Date()
        });
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

export const useStockList = (category?: 'gainers' | 'losers' | 'volume') => {
  const [stocks, setStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let endpoint = '/api/public/krx/ranking/';
      if (category === 'gainers') endpoint += 'gainers';
      else if (category === 'losers') endpoint += 'losers';
      else endpoint += 'volume';

      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '주식 목록 로드 실패');
      }

      const responseData = await response.json();
      
      if (responseData.success && responseData.data) {
        setStocks(responseData.data);
      }
    } catch (err) {
      console.error('Error fetching stock list:', err);
      setError(err instanceof Error ? err.message : '주식 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchStocks();
  }, [category]);

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
      const response = await fetch('/api/public/krx/indices');

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
      const response = await AuthService.authenticatedRequest(`/api/stalk/info/${ticker}`);

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