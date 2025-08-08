/**
 * Candlestick chart component for professional stock trading visualization
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial';
import { ko } from 'date-fns/locale';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
);

interface CandlestickData {
  x: Date | string;
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
}

interface CandlestickChartProps {
  data: any[];
  darkMode?: boolean;
  height?: number;
  showVolume?: boolean;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  darkMode = false,
  height = 400,
  showVolume = true,
}) => {
  const chartRef = useRef<ChartJS>(null);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Transform data to candlestick format
    const candlestickData: CandlestickData[] = data.map(item => {
      // Parse date - handle YYYYMMDD format
      let dateObj: Date;
      if (typeof item.date === 'string' && item.date.length === 8) {
        const year = item.date.substring(0, 4);
        const month = item.date.substring(4, 6);
        const day = item.date.substring(6, 8);
        dateObj = new Date(`${year}-${month}-${day}`);
      } else {
        dateObj = new Date(item.date);
      }

      return {
        x: dateObj,
        o: item.open || item.close,
        h: item.high || item.close,
        l: item.low || item.close,
        c: item.close,
      };
    });

    // Prepare chart data
    const datasets = [
      {
        type: 'candlestick' as const,
        label: '주가',
        data: candlestickData,
        borderColor: (ctx: any) => {
          const value = ctx.raw;
          return value && value.c >= value.o ? '#10b981' : '#ef4444'; // Green for up, red for down
        },
        backgroundColor: (ctx: any) => {
          const value = ctx.raw;
          return value && value.c >= value.o 
            ? 'rgba(16, 185, 129, 0.5)' 
            : 'rgba(239, 68, 68, 0.5)';
        },
        borderWidth: 1,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      },
    ];

    setChartData({
      datasets,
    });
  }, [data]);

  const options: ChartOptions<'candlestick'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '캔들스틱 차트',
        color: darkMode ? '#e5e7eb' : '#111827',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        position: 'nearest',
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#f3f4f6' : '#111827',
        bodyColor: darkMode ? '#d1d5db' : '#4b5563',
        borderColor: darkMode ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (tooltipItems: any) => {
            if (tooltipItems[0]) {
              const date = new Date(tooltipItems[0].raw.x);
              return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
            }
            return '';
          },
          label: (context: any) => {
            const data = context.raw;
            if (!data) return '';
            
            const change = ((data.c - data.o) / data.o * 100).toFixed(2);
            const isUp = data.c >= data.o;
            const changeSymbol = isUp ? '▲' : '▼';
            const changeColor = isUp ? '🟢' : '🔴';
            
            return [
              `${changeColor} 시가: ${data.o.toLocaleString()}원`,
              `   고가: ${data.h.toLocaleString()}원`,
              `   저가: ${data.l.toLocaleString()}원`,
              `   종가: ${data.c.toLocaleString()}원`,
              `   ${changeSymbol} 변동: ${change}%`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MM/dd',
            week: 'MM/dd',
            month: 'yyyy/MM',
          },
        },
        adapters: {
          date: {
            locale: ko,
          },
        },
        title: {
          display: false,
        },
        grid: {
          display: true,
          color: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        offset: false,
        bounds: 'data',
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: '가격 (원)',
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          display: true,
          color: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
          callback: function(value: any) {
            return value.toLocaleString() + '원';
          },
        },
      },
    },
  } as any;

  if (!chartData) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          차트 데이터를 준비 중입니다...
        </p>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`} style={{ height: `${height}px` }}>
      <Chart 
        ref={chartRef}
        type='candlestick' 
        data={chartData} 
        options={options} 
      />
    </div>
  );
};

export default CandlestickChart;