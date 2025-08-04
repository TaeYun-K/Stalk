
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
import { Line, Bar } from 'react-chartjs-2';
import { Canvas, Line as FabricLine, Rect, Circle, IText } from 'fabric';
import axios from 'axios';


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
  BarElement
);

interface StockData {
  ticker: string;
  name: string;
}

interface ChartDataPoint {
  date: string;
  close: number;
  volume: number;
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
type DrawingTool = 'pen' | 'select';

const REAL_TIME_UPDATE_INTERVAL_MS = 10000;
const CANVAS_INIT_DELAY_MS = 1000;

const StockChart: React.FC<StockChartProps> = ({
  selectedStock,
  darkMode = false,
  realTimeUpdates = false, // Disabled by default to prevent excessive API calls
  chartType: propChartType = 'candlestick',
  period: propPeriod = 30,
  drawingMode: propDrawingMode = false
}) => {
  

  const [chartData, setChartData] = useState<any>(null);
  const [chartType, setChartType] = useState<ChartType>(propChartType);
  const [period, setPeriod] = useState<string>(propPeriod.toString());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Update internal state when props change
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

  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(propDrawingMode);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#ff0000');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {

    if (selectedStock?.ticker) {
      
      fetchChartData();
    }
  }, [selectedStock?.ticker, period]); // Only re-fetch when ticker or period changes, not the entire selectedStock object

  useEffect(() => {
    if (!selectedStock?.ticker || !realTimeUpdates) return;

    const interval = setInterval(() => {
      fetchChartData(true); // Pass true for smooth updates
    }, REAL_TIME_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [selectedStock?.ticker, period, realTimeUpdates]);

  useEffect(() => {
    const initCanvas = () => {
      if (chartContainerRef.current && !fabricCanvasRef.current && isDrawingMode) {
        try {
          const existingCanvas = chartContainerRef.current.querySelector('#drawing-canvas');
          if (existingCanvas) {
            existingCanvas.remove();
          }

          const canvasElement = document.createElement('canvas');
          canvasElement.id = 'drawing-canvas';
          canvasElement.style.position = 'absolute';
          canvasElement.style.top = '0';
          canvasElement.style.left = '0';
          canvasElement.style.pointerEvents = 'none';
          canvasElement.style.zIndex = '1';
          canvasElement.style.background = 'transparent';

          chartContainerRef.current.appendChild(canvasElement);

          const containerWidth = chartContainerRef.current.offsetWidth || 800;
          const containerHeight = chartContainerRef.current.offsetHeight || 400;

          canvasElement.width = containerWidth;
          canvasElement.height = containerHeight;

          fabricCanvasRef.current = new Canvas(canvasElement, {
            isDrawingMode: false,
            width: containerWidth,
            height: containerHeight,
            selection: false,
            renderOnAddRemove: true,
            enableRetinaScaling: false,
          });

          if (fabricCanvasRef.current.freeDrawingBrush) {
            fabricCanvasRef.current.freeDrawingBrush.color = strokeColor;
            fabricCanvasRef.current.freeDrawingBrush.width = strokeWidth;
          }

    
        } catch (error) {
          console.error('Error initializing Fabric.js canvas:', error);
        }
      }
    };

    const timer = setTimeout(initCanvas, CANVAS_INIT_DELAY_MS);

    return () => {
      clearTimeout(timer);
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
        } catch (error) {
          console.error('Error disposing Fabric.js canvas:', error);
        }
        fabricCanvasRef.current = null;
      }
    };
  }, [isDrawingMode]);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      try {
        const canvas = fabricCanvasRef.current;
        const canvasElement = canvas.getElement();

        if (isDrawingMode) {
  
          canvasElement.style.pointerEvents = 'auto';
          canvasElement.style.zIndex = '10';

          canvas.isDrawingMode = drawingTool === 'pen';
          canvas.selection = drawingTool !== 'pen';

          if (drawingTool === 'pen' && canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = strokeColor;
            canvas.freeDrawingBrush.width = strokeWidth;
          }
        } else {
  
          canvasElement.style.pointerEvents = 'none';
          canvasElement.style.zIndex = '1';
          canvas.isDrawingMode = false;
          canvas.selection = false;
        }

        canvas.renderAll();
      } catch (error) {
        console.error('Error updating drawing mode:', error);
      }
    }
  }, [isDrawingMode, drawingTool, strokeColor, strokeWidth]);

  useEffect(() => {
    if (fabricCanvasRef.current && fabricCanvasRef.current.freeDrawingBrush) {
      try {
        fabricCanvasRef.current.freeDrawingBrush.color = strokeColor;
        fabricCanvasRef.current.freeDrawingBrush.width = strokeWidth;
      } catch (error) {
        console.error('Error updating brush properties:', error);
      }
    }
  }, [strokeColor, strokeWidth]);

  const fetchChartData = async (isUpdate = false) => {
    // Prevent duplicate requests
    if (isLoading) {
      
      return;
    }

    // Don't show loading state for updates to prevent flicker
    if (!isUpdate) {
      setIsLoading(true);
    }
    setError(null);

    try {
      
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/stalk/daily/${selectedStock?.ticker}?period=${period}`
        );

      

      if (response.data.success) {
        const data: ChartDataPoint[] = response.data.data;
        const aggregationType = response.data.aggregationType || 'daily';
        

        if (!data || data.length === 0) {
          console.error("StockChart - No data points in response");
          setError("차트 데이터가 없습니다.");
          return;
        }

        // Sort by date in ascending order (oldest first)
        const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
        

        const labels = sortedData.map(item => {
          const date = item.date;
          const year = date.substring(0, 4);
          const month = date.substring(4, 6);
          const day = date.substring(6, 8);

          // Format labels based on aggregation type
          switch (aggregationType) {
            case 'weekly':
              return `${month}/${day}`;  // Weekly: show month/day (e.g., "7/25")
            case 'monthly':
              return `${year.substring(2)}/${month}`;  // Monthly: show year/month (e.g., "24/07")
            default: // daily
              return `${month}/${day}`;  // Daily: show month/day (e.g., "7/31")
          }
        });

        const prices = sortedData.map(item => item.close);
        const volumes = sortedData.map(item => item.volume);

        

        // If we're updating and have an existing chart, update it smoothly
        if (isUpdate && chartRef.current && chartData) {
          const chart = chartRef.current;

          // Update the data arrays directly
          chart.data.labels = labels;
          chart.data.datasets[0].data = prices;

          // Always update volume data (second dataset)
          if (chart.data.datasets[1]) {
            chart.data.datasets[1].data = volumes;
          }

          // Update the chart with animation
          chart.update('active');
        } else {
          // Initial load or structure change - create new data object
          const newChartData = {
            labels,
            datasets: [
              {
                label: '종가',
                data: prices,
                type: 'line' as const,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: chartType === 'area',
                yAxisID: 'y',
                pointRadius: 2,
                pointHoverRadius: 4,
              },
              {
                label: '거래량',
                data: volumes,
                type: 'bar' as const,
                backgroundColor: 'rgba(153, 102, 255, 0.3)',
                borderColor: 'rgba(153, 102, 255, 1)',
                yAxisID: 'y1',
              },
            ],
          };


          setChartData(newChartData);
        }
        
      } else {
        console.error("StockChart - Response not successful:", response.data);
        setError(response.data.error || '차트 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      if (axios.isAxiosError(err)) {
        console.error('Axios error details:', err.response?.data);
      }
      setError('차트 데이터를 불러오는데 실패했습니다.');
    } finally {
      if (!isUpdate) {
        setIsLoading(false);
      }
    }
  };

  const toggleDrawingMode = () => {
    if (!fabricCanvasRef.current) {
      
      return;
    }
    
    setIsDrawingMode(!isDrawingMode);
  };

  const addLine = () => {
    if (fabricCanvasRef.current) {
      try {
        const line = new FabricLine([50, 100, 200, 200], {
          left: 100,
          top: 100,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          selectable: true,
          evented: true,
        });
        fabricCanvasRef.current.add(line);
        fabricCanvasRef.current.renderAll();
      } catch (error) {
        console.error('Error adding line:', error);
      }
    }
  };

  const addRectangle = () => {
    if (fabricCanvasRef.current) {
      try {
        const rect = new Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 60,
          fill: 'transparent',
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          selectable: true,
          evented: true,
        });
        fabricCanvasRef.current.add(rect);
        fabricCanvasRef.current.renderAll();
      } catch (error) {
        console.error('Error adding rectangle:', error);
      }
    }
  };

  const addCircle = () => {
    if (fabricCanvasRef.current) {
      try {
        const circle = new Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: 'transparent',
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          selectable: true,
          evented: true,
        });
        fabricCanvasRef.current.add(circle);
        fabricCanvasRef.current.renderAll();
      } catch (error) {
        console.error('Error adding circle:', error);
      }
    }
  };

  const addText = () => {
    if (fabricCanvasRef.current) {
      try {
        const text = new IText('텍스트', {
          left: 100,
          top: 100,
          fontFamily: 'Arial',
          fontSize: 20,
          fill: strokeColor,
          selectable: true,
          evented: true,
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.renderAll();
      } catch (error) {
        console.error('Error adding text:', error);
      }
    }
  };

  const clearDrawings = () => {
    if (fabricCanvasRef.current) {
      try {
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.renderAll();
      } catch (error) {
        console.error('Error clearing drawings:', error);
      }
    }
  };

  const deleteSelected = () => {
    if (fabricCanvasRef.current) {
      try {
        const activeObjects = fabricCanvasRef.current.getActiveObjects();
        if (activeObjects.length) {
          activeObjects.forEach((object) => {
            fabricCanvasRef.current?.remove(object);
          });
          fabricCanvasRef.current.discardActiveObject().renderAll();
        }
      } catch (error) {
        console.error('Error deleting selected objects:', error);
      }
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
    transitions: {
      active: {
        animation: {
          duration: 400
        }
      }
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
            } else if (context.dataset.label === '거래량') {
              return `거래량: ${context.parsed.y.toLocaleString()}주`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
          },
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
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '거래량 (주)',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString() + '주';
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
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


      <div className="relative mt-5" ref={chartContainerRef} style={{ height: '400px', width: '100%' }}>
        {isLoading && (
          <>
            {/* Skeleton loader background */}
            <div className="absolute inset-0 p-6">
              <div className="h-full w-full">
                {/* Y-axis skeleton */}
                <div className="absolute left-0 top-0 bottom-10 w-12 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ))}
                </div>
                {/* Chart area skeleton */}
                <div className="ml-14 h-full pb-10 relative">
                  <div className="absolute inset-0 flex items-end justify-around">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-8 bg-gray-200 dark:bg-gray-700 rounded-t animate-pulse"
                        style={{ height: `${Math.random() * 60 + 20}%`, animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
                  </div>
                </div>
                {/* X-axis skeleton */}
                <div className="absolute bottom-0 left-14 right-0 h-8 flex justify-around items-center">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading overlay */}
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className={`mt-4 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <p className="text-base font-medium">차트 데이터를 불러오는 중...</p>
                <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                  {selectedStock?.name} ({selectedStock?.ticker})
                </p>
                {realTimeUpdates && (
                  <p className="text-xs mt-2 text-blue-600 dark:text-blue-400">실시간 업데이트 활성화</p>
                )}
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="flex flex-col justify-center items-center h-full text-red-600 text-base gap-4">
            {error}
            <button
              onClick={fetchChartData}
              className="px-4 py-2 bg-blue-600 text-white border-none rounded-md cursor-pointer text-sm transition-colors hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        )}

        {chartData && !isLoading && !error && (
          <div className="w-full h-full">
            <Bar data={chartData} options={chartOptions} ref={chartRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StockChart;
