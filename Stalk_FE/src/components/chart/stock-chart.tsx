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
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Canvas, Line as FabricLine, Rect, Circle, IText } from 'fabric';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
}

type ChartType = 'line' | 'area' | 'candlestick';
type DrawingTool = 'pen' | 'select';

const REAL_TIME_UPDATE_INTERVAL_MS = 10000;
const CANVAS_INIT_DELAY_MS = 1000;

const StockChart: React.FC<StockChartProps> = ({ 
  selectedStock, 
  darkMode = false, 
  realTimeUpdates = false // Disabled by default to prevent excessive API calls
}) => {
  console.log("StockChart - Component rendered with selectedStock:", selectedStock);
  
  const [chartData, setChartData] = useState<any>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [period, setPeriod] = useState<string>('30');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#ff0000');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    console.log("StockChart - selectedStock changed:", selectedStock);
    if (selectedStock?.ticker) {
      console.log("StockChart - Fetching data for ticker:", selectedStock.ticker);
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
          
          console.log('Fabric canvas initialized successfully');
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
          console.log('Enabling drawing mode with tool:', drawingTool);
          canvasElement.style.pointerEvents = 'auto';
          canvasElement.style.zIndex = '10';
          
          canvas.isDrawingMode = drawingTool === 'pen';
          canvas.selection = drawingTool !== 'pen';
          
          if (drawingTool === 'pen' && canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = strokeColor;
            canvas.freeDrawingBrush.width = strokeWidth;
          }
        } else {
          console.log('Disabling drawing mode');
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
      console.log('Already loading data, skipping duplicate request');
      return;
    }
    
    // Don't show loading state for updates to prevent flicker
    if (!isUpdate) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      console.log("StockChart - Making request to:", `http://localhost:5000/api/stalk/daily/${selectedStock?.ticker}?period=${period}`);
      const response = await axios.get(
        `http://localhost:5000/api/stalk/daily/${selectedStock?.ticker}?period=${period}`
      );
      
      console.log("StockChart - Response received:", response.data);
      
      if (response.data.success) {
        const data: ChartDataPoint[] = response.data.data;
        console.log("StockChart - Raw data points:", data);
        
        if (!data || data.length === 0) {
          console.error("StockChart - No data points in response");
          setError("차트 데이터가 없습니다.");
          return;
        }
        
        // Sort by date in ascending order (oldest first)
        const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
        console.log("StockChart - Sorted data:", sortedData);
        
        const labels = sortedData.map(item => {
          const date = item.date;
          const year = date.substring(0, 4);
          const month = date.substring(4, 6);
          const day = date.substring(6, 8);
          return `${month}/${day}`;
        });
        
        const prices = sortedData.map(item => item.close);
        const volumes = sortedData.map(item => item.volume);
        
        console.log("StockChart - Labels:", labels);
        console.log("StockChart - Prices:", prices);
        console.log("StockChart - Volumes:", volumes);

        // If we're updating and have an existing chart, update it smoothly
        if (isUpdate && chartRef.current && chartData) {
          const chart = chartRef.current;
          
          // Update the data arrays directly
          chart.data.labels = labels;
          chart.data.datasets[0].data = prices;
          
          if (chartType === 'candlestick' && chart.data.datasets[1]) {
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
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: chartType === 'area',
              },
              ...(chartType === 'candlestick' ? [{
                label: '거래량',
                data: volumes,
                type: 'bar' as const,
                backgroundColor: 'rgba(153, 102, 255, 0.3)',
                borderColor: 'rgba(153, 102, 255, 1)',
                yAxisID: 'y1',
              }] : []),
            ],
          };
          
          console.log("StockChart - Setting chart data:", newChartData);
          setChartData(newChartData);
        }
        console.log("StockChart - Chart data state updated, loading:", isLoading);
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
      console.log('Canvas not initialized yet, please wait...');
      return;
    }
    console.log('Toggling drawing mode:', !isDrawingMode);
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
      ...(chartType === 'candlestick' ? {
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
      } : {}),
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (!selectedStock) {
    console.log("StockChart - No selectedStock, showing placeholder");
    return (
      <div className={`h-full ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
        <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-base py-16`}>
          주식을 선택하면 차트가 표시됩니다.
        </div>
      </div>
    );
  }
  
  console.log("StockChart - Rendering chart for stock:", selectedStock.ticker);

  return (
    <div className={`h-full ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-6 shadow-lg flex flex-col overflow-hidden`}>
      <div className="flex flex-wrap justify-between items-center mb-5 pb-4 border-b border-gray-200 gap-4">
        <div className="flex items-center gap-2">
          <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-nowrap`}>
            기간:
          </label>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)} 
            className={`px-3 py-1.5 border ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white'} rounded-md text-sm min-w-20 focus:outline-none focus:border-blue-500`}
          >
            <option value="7">7일</option>
            <option value="30">30일</option>
            <option value="60">60일</option>
            <option value="90">90일</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-nowrap`}>
            차트 유형:
          </label>
          <select 
            value={chartType} 
            onChange={(e) => setChartType(e.target.value as ChartType)} 
            className={`px-3 py-1.5 border ${darkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white'} rounded-md text-sm min-w-20 focus:outline-none focus:border-blue-500`}
          >
            <option value="line">선 차트</option>
            <option value="area">영역 차트</option>
            <option value="candlestick">캔들스틱</option>
          </select>
        </div>
        
        <button
          onClick={() => fetchChartData(true)}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            darkMode 
              ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 disabled:bg-gray-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          새로고침
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <button
          onClick={toggleDrawingMode}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isDrawingMode 
              ? 'bg-blue-600 text-white' 
              : darkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isDrawingMode ? '그리기 종료' : '그리기 모드'}
        </button>

        {isDrawingMode && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">도구:</label>
              <select 
                value={drawingTool} 
                onChange={(e) => setDrawingTool(e.target.value as DrawingTool)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="pen">펜</option>
                <option value="select">선택</option>
              </select>
            </div>

            <button onClick={addLine} className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
              직선
            </button>
            <button onClick={addRectangle} className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
              사각형
            </button>
            <button onClick={addCircle} className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
              원
            </button>
            <button onClick={addText} className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
              텍스트
            </button>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">색상:</label>
              <input 
                type="color" 
                value={strokeColor} 
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">굵기:</label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="w-16"
              />
              <span className="text-sm text-gray-600">{strokeWidth}px</span>
            </div>

            <button onClick={deleteSelected} className="px-2 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded">
              선택 삭제
            </button>
            <button onClick={clearDrawings} className="px-2 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded">
              전체 삭제
            </button>
          </>
        )}
      </div>

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
            {chartType === 'candlestick' ? 
            <Bar data={chartData} options={chartOptions} ref={chartRef} /> :
            <Line data={chartData} options={chartOptions} ref={chartRef} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockChart;