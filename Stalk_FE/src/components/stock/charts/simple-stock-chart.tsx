import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SimpleStockChartProps {
  selectedStock?: {
    ticker: string;
    name: string;
  } | null;
  period?: number;
}

const SimpleStockChart: React.FC<SimpleStockChartProps> = ({
  selectedStock,
  period = 7,
}) => {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const periodButtons = [
    { value: 7, label: '1주' },
    { value: 30, label: '1개월' },
    { value: 100, label: '100일' },
  ];

  const [currentPeriod, setCurrentPeriod] = useState(period);

  useEffect(() => {
    setCurrentPeriod(period);
  }, [period]);

  useEffect(() => {
    if (!selectedStock?.ticker) return;

    fetchHistoricalData();
  }, [selectedStock, currentPeriod]);

  const fetchHistoricalData = async () => {
    if (!selectedStock?.ticker) return;

    console.log(`Fetching historical data for ${selectedStock.ticker} with period ${currentPeriod}`);
    
    setIsLoading(true);
    setError(null);

    try {
      const marketType = selectedStock.ticker.startsWith('9') || selectedStock.ticker.startsWith('3') ? 'KOSDAQ' : 'KOSPI';
      
      // Get historical data from KRX API
      const url = `${import.meta.env.VITE_API_URL}/api/krx/stock/${selectedStock.ticker}?market=${marketType}&period=${currentPeriod}`;
      console.log(`Calling API: ${url}`);
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Check if we got historical data array
      if (Array.isArray(data) && data.length > 0) {
        console.log(`Received ${data.length} historical data points`);
        // Format historical data for chart
        const chartConfig = {
          labels: data.map((item: any) => {
            // Format date from YYYYMMDD to MM/DD - check multiple possible field names
            const dateStr = item.tradeDate || item.TRD_DD || item.BAS_DD || item.date || '';
            if (dateStr.length === 8) {
              return `${dateStr.substring(4,6)}/${dateStr.substring(6,8)}`;
            }
            return dateStr;
          }),
          datasets: [
            {
              label: `${selectedStock.name} (${selectedStock.ticker})`,
              data: data.map((item: any) => {
                const price = item.closePrice || item.TDD_CLSPRC || '0';
                return parseFloat(price.replace(/,/g, ''));
              }),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.1,
              fill: true,
            },
          ],
        };

        setChartData(chartConfig);
      } else if (data.TDD_CLSPRC || data.closePrice) {
        // Single data point - show current price only
        const currentPrice = parseFloat((data.TDD_CLSPRC || data.closePrice).replace(/,/g, ''));
        const today = new Date();
        
        const chartConfig = {
          labels: [`${today.getMonth() + 1}/${today.getDate()}`],
          datasets: [
            {
              label: `${selectedStock.name} (${selectedStock.ticker})`,
              data: [currentPrice],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.1,
              fill: true,
            },
          ],
        };

        setChartData(chartConfig);
        // Don't show error for single data point - this is expected
      } else {
        setError('가격 정보를 가져올 수 없습니다.');
      }
    } catch (err) {
      console.error('Chart data fetch error:', err);
      setError('차트 데이터 로딩 실패');
    } finally {
      setIsLoading(false);
    }
  };


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${selectedStock?.name || ''} 가격 추이 (${currentPeriod}일)`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString() + '원';
          },
        },
      },
    },
  };

  if (!selectedStock) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        종목을 선택해주세요
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Period buttons - now enabled with real historical data */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {periodButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setCurrentPeriod(btn.value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentPeriod === btn.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="p-4" style={{ height: '400px' }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500">차트 로딩 중...</div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        ) : chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            데이터를 불러오는 중...
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="border-t border-gray-200 p-3 text-xs text-gray-500">
        * KRX 공식 API를 통해 실제 과거 데이터를 제공합니다
      </div>
    </div>
  );
};

export default SimpleStockChart;