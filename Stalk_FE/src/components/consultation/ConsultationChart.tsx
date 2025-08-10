import React, { useEffect, useRef, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
  ChartOptions,
} from 'chart.js';
import { useStockData } from '@/hooks/use-stock-data';
import { formatPrice, formatVolume, calculateChangeRate } from '../stock/utils/calculations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ConsultationChartProps {
  ticker: string;
  name: string;
  darkMode?: boolean;
  onClose?: () => void;
  compact?: boolean;
}

const ConsultationChart: React.FC<ConsultationChartProps> = ({
  ticker,
  name,
  darkMode = true,
  onClose,
  compact = false
}) => {
  const [period, setPeriod] = useState<string>('30');
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const chartRef = useRef<any>(null);
  
  // Reuse the existing stock data hook
  const { stockData, isLoading, error } = useStockData(ticker);

  // Fetch chart data based on period
  const [chartData, setChartData] = useState<any>(null);
  const [volumeData, setVolumeData] = useState<any>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!ticker) return;
      
      try {
        // Determine market type
        let marketType = 'KOSPI';
        if (ticker.startsWith('9') || ticker.startsWith('3')) {
          marketType = 'KOSDAQ';
        } else if (ticker.startsWith('1')) {
          marketType = 'KOSDAQ';
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/krx/stock/${ticker}?market=${marketType}&period=${period}`
        );

        if (!response.ok) throw new Error('Failed to fetch chart data');

        const data = await response.json();
        
        if (data.success && data.data) {
          const prices = data.data.map((d: any) => d.close);
          const volumes = data.data.map((d: any) => d.volume);
          const labels = data.data.map((d: any) => {
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          });

          // Price chart data
          setChartData({
            labels,
            datasets: [{
              label: name,
              data: prices,
              borderColor: darkMode ? '#60a5fa' : '#3b82f6',
              backgroundColor: darkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              fill: true,
            }]
          });

          // Volume chart data
          setVolumeData({
            labels,
            datasets: [{
              label: '거래량',
              data: volumes,
              backgroundColor: darkMode ? 'rgba(96, 165, 250, 0.6)' : 'rgba(59, 130, 246, 0.6)',
              borderColor: darkMode ? '#60a5fa' : '#3b82f6',
              borderWidth: 1,
            }]
          });
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();
  }, [ticker, name, period, darkMode]);

  const chartOptions: ChartOptions<'line'> = {
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
      tooltip: {
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#e5e7eb' : '#111827',
        bodyColor: darkMode ? '#d1d5db' : '#374151',
        borderColor: darkMode ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            return `₩${formatPrice(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: compact ? 10 : 11,
          },
          maxRotation: 0,
          maxTicksLimit: compact ? 6 : 10,
        }
      },
      y: {
        position: 'right' as const,
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: compact ? 10 : 11,
          },
          callback: (value: any) => `₩${formatPrice(value)}`,
        }
      }
    }
  };

  const volumeOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#e5e7eb' : '#111827',
        bodyColor: darkMode ? '#d1d5db' : '#374151',
        borderColor: darkMode ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            return `거래량: ${formatVolume(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        position: 'right' as const,
        grid: {
          display: false,
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
          callback: (value: any) => formatVolume(value),
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>차트를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg ${compact ? 'p-3' : 'p-4'} h-full flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div>
            <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'} ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`${compact ? 'text-xs' : 'text-sm'} ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {ticker}
              </span>
              {stockData && (
                <>
                  <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    ₩{formatPrice(stockData.price)}
                  </span>
                  <span className={`${compact ? 'text-xs' : 'text-sm'} ${stockData.changeRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {stockData.changeRate >= 0 ? '+' : ''}{stockData.changeRate.toFixed(2)}%
                  </span>
                </>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1 rounded hover:bg-gray-700 transition-colors`}
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1 mb-3">
        {['7', '30', '90', '365'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              period === p
                ? 'bg-blue-600 text-white'
                : darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p === '7' ? '1주' : p === '30' ? '1개월' : p === '90' ? '3개월' : '1년'}
          </button>
        ))}
      </div>

      {/* Main Chart */}
      <div className="flex-1 min-h-0">
        {chartData && (
          <div style={{ height: showVolume ? '70%' : '100%' }}>
            <Line data={chartData} options={chartOptions} ref={chartRef} />
          </div>
        )}
        
        {/* Volume Chart */}
        {showVolume && volumeData && (
          <div style={{ height: '25%', marginTop: '8px' }}>
            <Bar data={volumeData} options={volumeOptions} />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
        <button
          onClick={() => setShowVolume(!showVolume)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            showVolume 
              ? 'bg-blue-600/20 text-blue-400'
              : darkMode
                ? 'bg-gray-700 text-gray-400'
                : 'bg-gray-100 text-gray-600'
          }`}
        >
          거래량
        </button>
        <button
          className={`px-2 py-1 text-xs rounded transition-colors ${
            darkMode
              ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          지표 추가
        </button>
      </div>
    </div>
  );
};

export default ConsultationChart;