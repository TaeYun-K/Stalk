/**
 * MACD (Moving Average Convergence Divergence) chart component
 */

import React, { forwardRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { getMacdChartOptions } from '../utils/chart-options';

interface MacdChartProps {
  data: any;
  darkMode: boolean;
}

const MacdChart = forwardRef<any, MacdChartProps>(({
  data,
  darkMode
}, ref) => {
  const chartOptions = getMacdChartOptions(darkMode);

  if (!data) {
    return null;
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 shadow-inner`}>
      <div style={{ height: '150px' }}>
        <Bar data={data} options={chartOptions} ref={ref} />
      </div>
    </div>
  );
});

MacdChart.displayName = 'MacdChart';

export default MacdChart;