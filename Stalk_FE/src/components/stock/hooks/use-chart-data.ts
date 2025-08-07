/**
 * Custom hook for fetching and managing chart data
 */

import { useState, useEffect } from 'react';
import { StockData, ChartDataPoint, ApiResponse } from '../utils/chart-types';
import { 
  processChartData, 
  processSingleDataPoint, 
  filterValidData, 
  sortByDate 
} from '../utils/data-processing';

interface UseChartDataOptions {
  selectedStock: StockData | null;
  period: number;
  realTimeUpdates?: boolean;
}

interface UseChartDataReturn {
  data: ChartDataPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const REAL_TIME_UPDATE_INTERVAL_MS = 10000;

export const useChartData = ({
  selectedStock,
  period,
  realTimeUpdates = false
}: UseChartDataOptions): UseChartDataReturn => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = async (isUpdate = false) => {
    if (isLoading || !selectedStock?.ticker) {
      console.log('Skipping fetch: loading or no ticker');
      return;
    }

    if (!isUpdate) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const marketType = selectedStock.ticker.startsWith('9') || 
                        selectedStock.ticker.startsWith('3') ? 'KOSDAQ' : 'KOSPI';
      const ticker = selectedStock.ticker;
      
      console.log(`Fetching chart data: ticker=${ticker}, market=${marketType}, period=${period}`);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/krx/stock/${ticker}?market=${marketType}&period=${period}&t=${Date.now()}`,
        {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '차트 데이터를 불러오는데 실패했습니다.');
      }

      const responseData = await response.json();
      console.log('API Response:', {
        isArray: Array.isArray(responseData),
        length: Array.isArray(responseData) ? responseData.length : 'N/A'
      });

      // Handle both wrapped {success, data} format and direct object/array format
      let stockInfo;
      if (responseData.success !== undefined) {
        if (!responseData.success) {
          throw new Error(responseData.message || responseData.error || '차트 데이터를 불러오는데 실패했습니다.');
        }
        stockInfo = responseData.data;
      } else {
        stockInfo = responseData;
      }

      if (!stockInfo) {
        throw new Error('차트 데이터가 없습니다.');
      }

      // Process the data
      let processedData: ChartDataPoint[];
      if (Array.isArray(stockInfo)) {
        console.log(`Processing ${stockInfo.length} data points from backend`);
        processedData = processChartData(stockInfo);
      } else {
        console.warn('Received single data point instead of array for period:', period);
        processedData = [processSingleDataPoint(stockInfo)];
      }

      // Filter, sort and set the data
      const validData = filterValidData(processedData);
      const sortedData = sortByDate(validData);
      
      console.log(`Final data: ${sortedData.length} valid points from ${processedData.length} total`);
      setData(sortedData);

    } catch (err) {
      console.error('Chart data fetch error:', err);
      setError(err instanceof Error ? err.message : '차트 데이터를 불러오는데 실패했습니다.');
    } finally {
      if (!isUpdate) {
        setIsLoading(false);
      }
    }
  };

  // Initial fetch and period change
  useEffect(() => {
    if (selectedStock?.ticker) {
      fetchChartData();
    }
  }, [selectedStock?.ticker, period]);

  // Real-time updates
  useEffect(() => {
    if (!selectedStock?.ticker || !realTimeUpdates) return;

    const interval = setInterval(() => {
      fetchChartData(true);
    }, REAL_TIME_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [selectedStock?.ticker, period, realTimeUpdates]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchChartData()
  };
};