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
      // More comprehensive market type detection
      // KOSDAQ: A000000-A999999 format (6 digits starting with A prefix removed, so 0-9 range)
      // Common KOSDAQ patterns: 000xxx-099xxx, 100xxx-199xxx, 200xxx-299xxx, 300xxx-399xxx, 900xxx-999xxx
      // KOSPI: 000000-099999, 100000-199999 (but many exceptions)
      // Dev Sisters (194480) is KOSDAQ despite starting with 1
      
      // For now, let's use a more accurate detection or default to trying both
      // First, try the original logic but with better KOSDAQ detection
      let marketType: string;
      
      if (ticker.startsWith('9') || ticker.startsWith('3')) {
        marketType = 'KOSDAQ';
      } else if (ticker.startsWith('00')) {
        marketType = 'KOSPI'; 
      } else {
        // For ambiguous cases like 194480, we need a different approach
        // Let's default to KOSDAQ for 1xxxxx range as many tech companies are there
        marketType = ticker.startsWith('1') ? 'KOSDAQ' : 'KOSPI';
      }
      let response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/krx/stock/${ticker}?market=${marketType}`
      );

      // 404인 경우 다른 마켓 시도
      if (response.status === 404) {
        const alternateMarket = marketType === 'KOSPI' ? 'KOSDAQ' : 'KOSPI';
        response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/krx/stock/${ticker}?market=${alternateMarket}`
        );
        if (response.ok) {
          marketType = alternateMarket; // 성공한 마켓으로 업데이트
        }
      }

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
          marketType: marketType, // Use the computed marketType from above
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
      // 실제 오류만 로그 (404는 예상된 동작이므로 제외)
      if (err instanceof Error && !err.message.includes('404')) {
        console.error('Error fetching stock data:', err);
      }
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

// Simple cache for ranking data (5 minute TTL)
const rankingCache = new Map<string, {data: any[], timestamp: number}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useStockList = (category?: 'gainers' | 'losers' | 'volume' | 'marketCap' | 'tradeValue', marketType?: string) => {
  const [stocks, setStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    // Check cache first
    const cacheKey = `${category}-${marketType || 'all'}`;
    const cached = rankingCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log(`💰 Using cached data for ${cacheKey}`);
      setStocks(cached.data);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let allStocks: any[] = [];

      // PERFORMANCE OPTIMIZATION: Try to use combined endpoints first (if available)
      // If not available, fall back to the current multi-call approach
      
      // First, try the optimized single-call approach
      const categoryMap = {
        'volume': 'volume-ranking',
        'gainers': 'price-increase-ranking', 
        'losers': 'price-decrease-ranking',
        'marketCap': 'market-cap-ranking',
        'tradeValue': 'trade-value-ranking'
      };
      
      const endpoint = categoryMap[category || 'volume'];
      const marketFilter = marketType && marketType !== '전체' ? `&market=${marketType.toLowerCase()}` : '';
      const optimizedUrl = `${import.meta.env.VITE_API_URL}/api/krx/ranking/${endpoint}?limit=50${marketFilter}`;
      
      try {
        // Try the optimized combined endpoint
        const optimizedResponse = await fetch(optimizedUrl);
        
        if (optimizedResponse.ok) {
          const responseData = await optimizedResponse.json();
          if (responseData.success && responseData.data) {
            allStocks = responseData.data;
            console.log(`✅ Used optimized endpoint: ${optimizedUrl}`);
          }
        } else if (optimizedResponse.status !== 404) {
          // If it's not a 404 (endpoint doesn't exist), log the error
          console.warn(`Optimized endpoint failed with status ${optimizedResponse.status}, falling back to legacy approach`);
        }
      } catch (optimizedError) {
        console.warn('Optimized endpoint failed, using legacy multi-call approach:', optimizedError);
      }
      
      // If optimized endpoint didn't work, use the legacy multi-call approach
      if (allStocks.length === 0) {
        console.log('📡 Using legacy multi-call approach...');
        
        if (category === 'volume') {
          // Fetch volume rankings from both KOSPI and KOSDAQ
          const [kospiResponse, kosdaqResponse] = await Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/api/krx/kospi/volume-ranking?limit=25`),
            fetch(`${import.meta.env.VITE_API_URL}/api/krx/kosdaq/volume-ranking?limit=25`)
          ]);
          
          if (!kospiResponse.ok || !kosdaqResponse.ok) {
            throw new Error('거래량 순위 로드 실패');
          }

          const [kospiData, kosdaqData] = await Promise.all([
            kospiResponse.json(),
            kosdaqResponse.json()
          ]);

          // Combine both arrays
          allStocks = [...kospiData, ...kosdaqData];
          
          // Sort by volume and re-rank
          allStocks.sort((a, b) => {
            const volA = parseInt((a.volume || '0').toString().replace(/,/g, ''));
            const volB = parseInt((b.volume || '0').toString().replace(/,/g, ''));
            return volB - volA;
          });
          
          // Update rankings and limit to top 50
          allStocks = allStocks.slice(0, 50).map((stock, index) => ({
            ...stock,
            rank: index + 1
          }));
        } else {
          // For gainers and losers, fetch from both KOSPI and KOSDAQ
          const kospiEndpoint = category === 'gainers' 
            ? `${import.meta.env.VITE_API_URL}/api/krx/kospi/price-increase-ranking`
            : `${import.meta.env.VITE_API_URL}/api/krx/kospi/price-decrease-ranking`;
          
          const kosdaqEndpoint = category === 'gainers'
            ? `${import.meta.env.VITE_API_URL}/api/krx/kosdaq/price-increase-ranking` 
            : `${import.meta.env.VITE_API_URL}/api/krx/kosdaq/price-decrease-ranking`;

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
        
        // Apply market filtering if specified (only for legacy approach)
        if (marketType && marketType !== '전체') {
          allStocks = allStocks.filter((stock: any) => {
            const ticker = stock.ticker || '';
            
            // Use the same improved logic as other places
            if (marketType === 'kospi') {
              // KOSPI logic - more accurate detection
              if (ticker.startsWith('00') || (!ticker.startsWith('9') && !ticker.startsWith('3') && !ticker.startsWith('1'))) {
                return true;
              }
              return false;
            } else if (marketType === 'kosdaq') {
              // KOSDAQ logic - include tickers starting with 1, 3, 9
              return ticker.startsWith('9') || ticker.startsWith('3') || ticker.startsWith('1');
            }
            return true;
          });

          // Re-rank after filtering
          allStocks = allStocks.map((stock, index) => ({
            ...stock,
            rank: index + 1
          }));
        }
      }
      
      // Cache the results
      rankingCache.set(cacheKey, {
        data: allStocks,
        timestamp: now
      });
      
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/krx/indices`);

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