import React, { useState, useEffect, useRef } from 'react';
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
  LineController,
  BarController,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line, Bar } from 'react-chartjs-2';
import Konva from 'konva';
import AuthService from '../../../services/authService';
import DrawingToolbar from './drawing-toolbar';
import ChartControls from './chart-controls';
import TechnicalIndicators from './technical-indicators';
import { useDrawingCanvas } from './hooks/use-drawing-canvas';
import { 
  calculateMA, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands 
} from '../utils/calculations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  BarElement,
  zoomPlugin
);

interface StockData {
  ticker: string;
  name: string;
}

interface ChartDataPoint {
  date: string;
  close: number;
  volume: number;
  open?: number;
  high?: number;
  low?: number;
}

interface StockChartProps {
  selectedStock?: StockData | null;
  darkMode?: boolean;
  realTimeUpdates?: boolean;
  chartType?: ChartType;
  period?: number;
  drawingMode?: boolean;
}

type ChartType = 'line' | 'area' | 'candlestick';

const REAL_TIME_UPDATE_INTERVAL_MS = 10000;

const StockChart: React.FC<StockChartProps> = ({
  selectedStock,
  darkMode = false,
  realTimeUpdates = false,
  chartType: propChartType = 'candlestick',
  period: propPeriod = 30,
  drawingMode: propDrawingMode = false
}) => {
  console.log("StockChart - 컴포넌트 렌더링됨:", selectedStock);

  const [chartData, setChartData] = useState<any>(null);
  const [volumeChartData, setVolumeChartData] = useState<any>(null);
  const [rsiChartData, setRsiChartData] = useState<any>(null);
  const [macdChartData, setMacdChartData] = useState<any>(null);
  const [chartType, setChartType] = useState<ChartType>(propChartType);
  const [period, setPeriod] = useState<string>(propPeriod.toString());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(propDrawingMode);
  
  // Technical indicators states
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showMA20, setShowMA20] = useState<boolean>(false);
  const [showEMA12, setShowEMA12] = useState<boolean>(false);
  const [showBollingerBands, setShowBollingerBands] = useState<boolean>(false);
  const [showRSI, setShowRSI] = useState<boolean>(false);
  const [showMACD, setShowMACD] = useState<boolean>(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const volumeChartRef = useRef<any>(null);
  const rsiChartRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const konvaStage = useRef<Konva.Stage | null>(null);
  
  const {
    initializeCanvas,
    enableDrawing,
    disableDrawing,
    clearCanvas,
    deleteSelected,
    addShape,
    setDrawingTool,
    setStrokeColor,
    setStrokeWidth
  } = useDrawingCanvas(chartContainerRef);

  useEffect(() => {
    if (propChartType !== chartType) {
      setChartType(propChartType);
    }
    const newPeriod = propPeriod.toString();
    if (newPeriod !== period) {
      setPeriod(newPeriod);
    }
    if (propDrawingMode !== isDrawingMode) {
      setIsDrawingMode(propDrawingMode);
    }
  }, [propChartType, propPeriod, propDrawingMode]);

  useEffect(() => {
    if (selectedStock?.ticker) {
      console.log("StockChart - 데이터 가져오기 시작:", selectedStock.ticker);
      fetchChartData();
    }
  }, [selectedStock?.ticker, period]);

  useEffect(() => {
    if (!selectedStock?.ticker || !realTimeUpdates) return;

    const interval = setInterval(() => {
      fetchChartData(true);
    }, REAL_TIME_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [selectedStock?.ticker, period, realTimeUpdates]);

  useEffect(() => {
    if (chartContainerRef.current && chartData) {
      console.log('Konva 캔버스 초기화 시작');
      const stage = initializeCanvas();
      if (stage) {
        konvaStage.current = stage;
        console.log('Konva 캔버스 초기화 성공');
        
        if (isDrawingMode) {
          enableDrawing();
        }
      }
    }
    
    return () => {
      if (konvaStage.current) {
        konvaStage.current.destroy();
        konvaStage.current = null;
      }
    };
  }, [chartData]);

  useEffect(() => {
    if (konvaStage.current) {
      if (isDrawingMode) {
        console.log('그리기 모드 활성화');
        enableDrawing();
      } else {
        console.log('그리기 모드 비활성화');
        disableDrawing();
      }
    }
  }, [isDrawingMode]);

  // Update charts when indicators change
  useEffect(() => {
    if (chartData && chartRef.current) {
      updateChartsWithIndicators();
    }
  }, [showMA20, showEMA12, showBollingerBands, showRSI, showMACD, chartData]);

  const fetchChartData = async (isUpdate = false) => {
    if (isLoading) {
      console.log("StockChart - 이미 로딩 중, 요청 건너뜀");
      return;
    }

    if (!isUpdate) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const marketType = selectedStock?.ticker?.startsWith('9') || selectedStock?.ticker?.startsWith('3') ? 'KOSDAQ' : 'KOSPI';
      const ticker = selectedStock?.ticker || '';
      
      console.log(`StockChart - API 요청: /api/public/krx/stock/${ticker}?market=${marketType}&period=${period}`);
      
      const response = await fetch(
        `/api/public/krx/stock/${ticker}?market=${marketType}&period=${period}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '차트 데이터를 불러오는데 실패했습니다.');
      }

      const responseData = await response.json();
      console.log('StockChart - 차트 데이터 응답:', responseData);

      if (responseData.success && responseData.data) {
        // Handle both single data point and array
        let data: ChartDataPoint[];
        if (Array.isArray(responseData.data)) {
          data = responseData.data;
        } else {
          // Convert single stock info to chart data point
          const stockInfo = responseData.data;
          data = [{
            date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
            open: parseFloat((stockInfo.closePrice || stockInfo.TDD_CLSPRC || '0').toString().replace(/,/g, '')),
            high: parseFloat((stockInfo.closePrice || stockInfo.TDD_CLSPRC || '0').toString().replace(/,/g, '')),
            low: parseFloat((stockInfo.closePrice || stockInfo.TDD_CLSPRC || '0').toString().replace(/,/g, '')),
            close: parseFloat((stockInfo.closePrice || stockInfo.TDD_CLSPRC || '0').toString().replace(/,/g, '')),
            volume: parseInt((stockInfo.volume || stockInfo.ACC_TRDVOL || '0').toString().replace(/,/g, ''))
          }];
        }
        
        if (!data || data.length === 0) {
          console.error("StockChart - 데이터 포인트가 없음");
          setError("차트 데이터가 없습니다.");
          return;
        }

        const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
        
        const labels = sortedData.map(item => {
          const date = item.date;
          const month = date.substring(4, 6);
          const day = date.substring(6, 8);
          return `${month}/${day}`;
        });

        const prices = sortedData.map(item => item.close);
        const volumes = sortedData.map(item => item.volume);

        // Create main chart data
        const newChartData = {
          labels,
          datasets: [{
            label: '종가',
            data: prices,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            fill: chartType === 'area',
            pointRadius: 1,
            pointHoverRadius: 3,
          }],
        };

        // Create volume chart data
        const newVolumeData = {
          labels,
          datasets: [{
            label: '거래량',
            data: volumes,
            backgroundColor: volumes.map((_, index) => {
              if (index === 0) return 'rgba(34, 197, 94, 0.6)';
              return prices[index] >= prices[index - 1] 
                ? 'rgba(34, 197, 94, 0.6)'  // Green for up
                : 'rgba(239, 68, 68, 0.6)'; // Red for down
            }),
            borderColor: volumes.map((_, index) => {
              if (index === 0) return 'rgba(34, 197, 94, 1)';
              return prices[index] >= prices[index - 1]
                ? 'rgba(34, 197, 94, 1)'
                : 'rgba(239, 68, 68, 1)';
            }),
            borderWidth: 1,
          }],
        };

        // Create RSI data if enabled
        if (showRSI) {
          const rsiValues = calculateRSI(prices, 14);
          const newRsiData = {
            labels,
            datasets: [{
              label: 'RSI',
              data: rsiValues,
              borderColor: 'rgb(153, 102, 255)',
              backgroundColor: 'transparent',
              tension: 0.1,
              pointRadius: 0,
            }],
          };
          setRsiChartData(newRsiData);
        }

        // Create MACD data if enabled
        if (showMACD) {
          const macdResult = calculateMACD(prices);
          const newMacdData = {
            labels,
            datasets: [
              {
                label: 'MACD',
                data: macdResult.macdLine,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'transparent',
                tension: 0.1,
                pointRadius: 0,
              },
              {
                label: 'Signal',
                data: macdResult.signalLine,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'transparent',
                tension: 0.1,
                pointRadius: 0,
              },
              {
                label: 'Histogram',
                data: macdResult.histogram,
                type: 'bar' as const,
                backgroundColor: macdResult.histogram.map((val: number | null) => 
                  val && val > 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'
                ),
              },
            ],
          };
          setMacdChartData(newMacdData);
        }

        setChartData(newChartData);
        setVolumeChartData(newVolumeData);
        
        console.log("StockChart - 차트 데이터 설정 완료");
      } else {
        console.error("StockChart - 응답 성공하지 않음:", responseData);
        setError(responseData.message || responseData.error || '차트 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('StockChart - 차트 데이터 로드 오류:', err);
      setError('차트 데이터를 불러오는데 실패했습니다.');
    } finally {
      if (!isUpdate) {
        setIsLoading(false);
      }
    }
  };

  const updateChartsWithIndicators = () => {
    if (!chartData || !chartRef.current) return;

    const prices = chartData.datasets[0].data;
    
    let priceDatasets = [{
      label: '종가',
      data: prices,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
      fill: chartType === 'area',
      pointRadius: 1,
      pointHoverRadius: 3,
    }];
    
    // Add MA20 if enabled
    if (showMA20) {
      const ma20Values = calculateMA(prices, 20);
      priceDatasets.push({
        label: '이동평균선(20)',
        data: ma20Values,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'transparent',
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
      } as any);
    }

    // Add EMA12 if enabled
    if (showEMA12) {
      const ema12Values = calculateEMA(prices, 12);
      priceDatasets.push({
        label: '지수이동평균(12)',
        data: ema12Values,
        borderColor: 'rgb(139, 69, 19)',
        backgroundColor: 'transparent',
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
      } as any);
    }

    // Add Bollinger Bands if enabled
    if (showBollingerBands) {
      const bands = calculateBollingerBands(prices, 20);
      priceDatasets.push(
        {
          label: '볼린저 상단',
          data: bands.upperBand,
          borderColor: 'rgba(255, 159, 64, 0.6)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [5, 5],
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
        } as any,
        {
          label: '볼린저 중간',
          data: bands.middleBand,
          borderColor: 'rgba(255, 159, 64, 0.4)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
        } as any,
        {
          label: '볼린저 하단',
          data: bands.lowerBand,
          borderColor: 'rgba(255, 159, 64, 0.6)',
          backgroundColor: 'rgba(255, 159, 64, 0.1)',
          borderWidth: 1,
          borderDash: [5, 5],
          tension: 0,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        } as any
      );
    }

    // Update the chart
    const chart = chartRef.current;
    chart.data.datasets = priceDatasets;
    chart.update('active');
  };

  const toggleDrawingMode = () => {
    console.log('그리기 모드 토글:', !isDrawingMode);
    setIsDrawingMode(!isDrawingMode);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const handleChartTypeChange = (newType: ChartType) => {
    setChartType(newType);
  };

  const handleIndicatorChange = (indicator: string, value: boolean) => {
    switch(indicator) {
      case 'ma': setShowMA20(value); break;
      case 'ema': setShowEMA12(value); break;
      case 'rsi': setShowRSI(value); break;
      case 'macd': setShowMACD(value); break;
      case 'bollinger': setShowBollingerBands(value); break;
      case 'volume': setShowVolume(value); break;
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
        },
      },
      title: {
        display: true,
        text: selectedStock ? `${selectedStock.name} (${selectedStock.ticker}) - ${period}일 차트` : '주식 차트',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            if (context.dataset.label === '종가') {
              return `종가: ${context.parsed.y.toLocaleString()}원`;
            }
            return `${context.dataset.label}: ${context.parsed.y?.toFixed(2) || 'N/A'}`;
          },
        },
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x' as const,
        },
        pan: {
          enabled: true,
          mode: 'x' as const,
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '날짜',
          color: darkMode ? '#e5e7eb' : '#374151',
        },
        ticks: {
          maxTicksLimit: 10,
          maxRotation: 45,
          minRotation: 0,
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '주가 (원)',
          color: darkMode ? '#e5e7eb' : '#374151',
        },
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString() + '원';
          },
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const volumeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '거래량',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        position: 'right' as const,
        ticks: {
          callback: function(value: any) {
            return formatVolume(value);
          },
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
  };

  const rsiChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'RSI',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        min: 0,
        max: 100,
        position: 'right' as const,
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
  };

  const macdChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
        },
      },
      title: {
        display: true,
        text: 'MACD',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        position: 'right' as const,
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
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

  if (!selectedStock) {
    return (
      <div className={`h-full ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
        <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-base py-16`}>
          주식을 선택하면 차트가 표시됩니다.
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full ${darkMode ? 'bg-gray-700' : 'bg-white'} flex flex-col overflow-hidden`}>
      <ChartControls
        period={period}
        chartType={chartType}
        onPeriodChange={handlePeriodChange}
        onChartTypeChange={handleChartTypeChange}
        darkMode={darkMode}
      />
      
      {isDrawingMode && (
        <DrawingToolbar
          onToolChange={setDrawingTool}
          onColorChange={setStrokeColor}
          onWidthChange={setStrokeWidth}
          onAddShape={addShape}
          onClear={clearCanvas}
          onDelete={deleteSelected}
          darkMode={darkMode}
        />
      )}
      
      <div className="flex items-center justify-between p-4">
        <button
          onClick={toggleDrawingMode}
          className={`px-4 py-2 rounded-md transition-colors ${
            isDrawingMode 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isDrawingMode ? '그리기 모드 끄기' : '그리기 모드 켜기'}
        </button>
      </div>
      
      <TechnicalIndicators
        indicators={{
          ma: showMA20,
          ema: showEMA12,
          rsi: showRSI,
          macd: showMACD,
          bollinger: showBollingerBands,
          volume: showVolume,
        }}
        onIndicatorChange={handleIndicatorChange}
        darkMode={darkMode}
      />

      <div className="flex-1 p-4">
        {/* Main Chart */}
        <div className="relative h-3/5" ref={chartContainerRef}>
          {isLoading && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400"></div>
              <p className="mt-4 text-base font-medium">차트 데이터를 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col justify-center items-center h-full text-red-600 text-base gap-4">
              {error}
              <button
                onClick={() => fetchChartData()}
                className="px-4 py-2 bg-blue-600 text-white border-none rounded-md cursor-pointer text-sm transition-colors hover:bg-blue-700"
              >
                다시 시도
              </button>
            </div>
          )}

          {chartData && !isLoading && !error && (
            <div className="w-full h-full">
              <Line data={chartData} options={chartOptions} ref={chartRef} />
              <div id="drawing-canvas" className="absolute inset-0 pointer-events-none"></div>
            </div>
          )}
        </div>

        {/* Volume Chart */}
        {showVolume && volumeChartData && (
          <div className="h-1/5 mt-2">
            <Bar data={volumeChartData} options={volumeChartOptions} ref={volumeChartRef} />
          </div>
        )}

        {/* RSI Chart */}
        {showRSI && rsiChartData && (
          <div className="h-1/5 mt-2">
            <Line data={rsiChartData} options={rsiChartOptions} ref={rsiChartRef} />
          </div>
        )}

        {/* MACD Chart */}
        {showMACD && macdChartData && (
          <div className="h-1/5 mt-2">
            <Bar data={macdChartData} options={macdChartOptions} ref={macdChartRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StockChart;