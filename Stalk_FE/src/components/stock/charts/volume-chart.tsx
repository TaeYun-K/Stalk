/**
 * Volume chart component for displaying trading volume
 */

import React, { forwardRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { getVolumeChartOptions } from '../utils/chart-options';

interface VolumeChartProps {
  data: any;
  darkMode: boolean;
}

const VolumeChart = forwardRef<any, VolumeChartProps>(({
  data,
  darkMode
}, ref) => {
  const chartOptions = getVolumeChartOptions(darkMode);

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

VolumeChart.displayName = 'VolumeChart';

export default VolumeChart;