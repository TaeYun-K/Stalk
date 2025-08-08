/**
 * RSI (Relative Strength Index) chart component
 */

import React, { forwardRef } from 'react';
import { Line } from 'react-chartjs-2';
import { getRsiChartOptions } from '../utils/chart-options';

interface RsiChartProps {
  data: any;
  darkMode: boolean;
}

const RsiChart = forwardRef<any, RsiChartProps>(({
  data,
  darkMode
}, ref) => {
  const chartOptions = getRsiChartOptions(darkMode);

  if (!data) {
    return null;
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 shadow-inner`}>
      <div style={{ height: '150px' }}>
        <Line data={data} options={chartOptions} ref={ref} />
      </div>
    </div>
  );
});

RsiChart.displayName = 'RsiChart';

export default RsiChart;