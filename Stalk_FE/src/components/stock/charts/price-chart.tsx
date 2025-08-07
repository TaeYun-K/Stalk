/**
 * Price chart component for displaying stock price data
 */

import React, { forwardRef } from 'react';
import { Line } from 'react-chartjs-2';
import { getMainChartOptions } from '../utils/chart-options';

interface PriceChartProps {
  data: any;
  darkMode: boolean;
  period: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const PriceChart = forwardRef<any, PriceChartProps>(({
  data,
  darkMode,
  period,
  isLoading,
  error,
  onRetry
}, ref) => {
  const chartOptions = getMainChartOptions(darkMode, period);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-200 dark:border-gray-700 border-t-blue-500"></div>
        <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">차트 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col justify-center items-center">
        <div className="text-red-500 dark:text-red-400 text-center">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return <Line data={data} options={chartOptions} ref={ref} />;
});

PriceChart.displayName = 'PriceChart';

export default PriceChart;