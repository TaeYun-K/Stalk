/**
 * Enhanced volume chart with color-coded bars based on price movement
 */

import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface EnhancedVolumeChartProps {
  data: any[];
  darkMode?: boolean;
  height?: number;
}

const EnhancedVolumeChart: React.FC<EnhancedVolumeChartProps> = ({
  data,
  darkMode = false,
  height = 150,
}) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const labels = data.map(item => {
      if (typeof item.date === 'string' && item.date.length === 8) {
        const month = item.date.substring(4, 6);
        const day = item.date.substring(6, 8);
        return `${month}/${day}`;
      }
      return item.date;
    });

    const volumes = data.map(item => item.volume);
    const prices = data.map(item => item.close);
    
    // Calculate average volume for reference line
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    // Color based on price change and volume
    const colors = volumes.map((volume, index) => {
      if (index === 0) return 'rgba(34, 197, 94, 0.6)';
      
      const priceUp = prices[index] >= prices[index - 1];
      const highVolume = volume > avgVolume * 1.5;
      
      if (priceUp) {
        return highVolume 
          ? 'rgba(16, 185, 129, 0.9)' // Strong green for high volume up
          : 'rgba(34, 197, 94, 0.6)';  // Normal green
      } else {
        return highVolume
          ? 'rgba(220, 38, 38, 0.9)'   // Strong red for high volume down
          : 'rgba(239, 68, 68, 0.6)';  // Normal red
      }
    });

    setChartData({
      labels,
      datasets: [
        {
          label: '거래량',
          data: volumes,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.6', '1').replace('0.9', '1')),
          borderWidth: 1,
        },
        {
          label: '평균 거래량',
          data: new Array(volumes.length).fill(avgVolume),
          type: 'line',
          borderColor: darkMode ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)',
          borderDash: [5, 5],
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    });
  }, [data, darkMode]);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
          padding: 10,
          font: { size: 10 },
          usePointStyle: true,
          pointStyle: 'line',
        },
      },
      title: {
        display: true,
        text: '거래량 분석',
        color: darkMode ? '#e5e7eb' : '#111827',
        font: { size: 14, weight: 'bold' },
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#f3f4f6' : '#111827',
        bodyColor: darkMode ? '#d1d5db' : '#4b5563',
        borderColor: darkMode ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (label === '거래량') {
              const avgVolume = context.chart.data.datasets[1].data[0];
              const ratio = ((value / avgVolume - 1) * 100).toFixed(1);
              const volumeStr = formatVolume(value);
              return [
                `${label}: ${volumeStr}`,
                `평균 대비: ${ratio > 0 ? '+' : ''}${ratio}%`
              ];
            } else {
              return `${label}: ${formatVolume(value)}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: { size: 9 },
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 20,
        },
      },
      y: {
        display: true,
        position: 'right',
        title: {
          display: true,
          text: '거래량',
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: { size: 10 },
          callback: function(value: any) {
            return formatVolume(value);
          },
        },
      },
    },
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  if (!chartData) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          거래량 데이터를 준비 중입니다...
        </p>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 shadow-inner`}>
      <div style={{ height: `${height}px` }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default EnhancedVolumeChart;