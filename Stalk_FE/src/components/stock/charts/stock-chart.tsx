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
import DrawingToolbar from '../chart-controls/drawing-toolbar';
import ChartControls from '../chart-controls/chart-controls';
import TechnicalIndicators from '../chart-controls/technical-indicators';
import { useDrawingCanvas } from '../hooks/use-drawing-canvas';
import { 
  calculateMA, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands,
  calculateStochastic,
  calculateVWAP,
  calculateHeikinAshi,
  calculateIchimoku
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
  change?: number;
  changeRate?: number;
}

interface StockChartProps {
  selectedStock?: StockData | null;
  darkMode?: boolean;
  realTimeUpdates?: boolean;
  chartType?: ChartType;
  period?: number;
  drawingMode?: boolean;
}

type ChartType = 'line';

const REAL_TIME_UPDATE_INTERVAL_MS = 10000;

const StockChart: React.FC<StockChartProps> = ({
  selectedStock,
  darkMode = false,
  realTimeUpdates = false,
  chartType: propChartType = 'line',
  period: propPeriod = 7,
  drawingMode: propDrawingMode = false
}) => {
  console.log("StockChart - 컴포넌트 렌더링됨:", selectedStock);

  const [chartData, setChartData] = useState<any>(null);
  const [volumeChartData, setVolumeChartData] = useState<any>(null);
  const [rsiChartData, setRsiChartData] = useState<any>(null);
  const [macdChartData, setMacdChartData] = useState<any>(null);
  const [stochChartData, setStochChartData] = useState<any>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [period, setPeriod] = useState<string>(propPeriod.toString());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(propDrawingMode);
  const [rawData, setRawData] = useState<ChartDataPoint[]>([]);
  
  // Technical indicators states
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showMA20, setShowMA20] = useState<boolean>(false);
  const [showMA50, setShowMA50] = useState<boolean>(false);
  const [showEMA12, setShowEMA12] = useState<boolean>(false);
  const [showEMA26, setShowEMA26] = useState<boolean>(false);
  const [showRSI, setShowRSI] = useState<boolean>(false);
  const [showMACD, setShowMACD] = useState<boolean>(false);
  const [showBollingerBands, setShowBollingerBands] = useState<boolean>(false);
  const [showStochastic, setShowStochastic] = useState<boolean>(false);
  const [showVWAP, setShowVWAP] = useState<boolean>(false);
  const [showIchimoku, setShowIchimoku] = useState<boolean>(false);

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
    undoLastShape,
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

  // Update internal period state when prop changes
  useEffect(() => {
    console.log("StockChart - propPeriod changed to:", propPeriod);
    setPeriod(propPeriod.toString());
  }, [propPeriod]);

  useEffect(() => {
    console.log('=== useEffect Triggered ===');
    console.log('Ticker:', selectedStock?.ticker);
    console.log('Period:', period);
    if (selectedStock?.ticker) {
      console.log("StockChart - 데이터 가져오기 시작:", selectedStock.ticker, "Period:", period);
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

  // Update charts when indicators change - with safety delay
  useEffect(() => {
    if (chartData && chartRef.current && rawData && rawData.length > 0) {
      // Small delay to ensure chart is fully rendered
      const timer = setTimeout(() => {
        updateChartsWithIndicators();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chartData, rawData, showMA20, showMA50, showEMA12, showEMA26, showBollingerBands, showVWAP, showIchimoku, showRSI, showMACD, showStochastic]);

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
      
      // Ensure period is a number
      const periodNum = parseInt(period);
      console.log(`StockChart - API 요청: /api/krx/stock/${ticker}?market=${marketType}&period=${periodNum}`);
      console.log(`Period type: ${typeof period}, Period value: ${period}, Parsed: ${periodNum}`);
      
      const response = await fetch(
        `/api/krx/stock/${ticker}?market=${marketType}&period=${periodNum}&t=${Date.now()}`,
        {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '차트 데이터를 불러오는데 실패했습니다.');
      }

      const responseData = await response.json();

      // Handle both wrapped {success, data} format and direct object format
      let stockInfo;
      if (responseData.success !== undefined) {
        // Wrapped format
        if (!responseData.success) {
          console.error("StockChart - 응답 성공하지 않음:", responseData);
          setError(responseData.message || responseData.error || '차트 데이터를 불러오는데 실패했습니다.');
          return;
        }
        stockInfo = responseData.data;
      } else {
        // Direct object format (KrxStockInfo)
        stockInfo = responseData;
      }

      
      if (stockInfo) {
        // With backend fix, we should always receive an array when period is specified
        let data: ChartDataPoint[];
        if (Array.isArray(stockInfo)) {
          // Historical data from backend
          
          try {
            data = stockInfo.map(item => ({
              date: item.tradeDate || item.TRD_DD || new Date().toISOString().slice(0, 10).replace(/-/g, ''),
              open: parseFloat((item.openPrice || item.TDD_OPNPRC || item.closePrice || '0').toString().replace(/,/g, '')),
              high: parseFloat((item.highPrice || item.TDD_HGPRC || item.closePrice || '0').toString().replace(/,/g, '')),
              low: parseFloat((item.lowPrice || item.TDD_LWPRC || item.closePrice || '0').toString().replace(/,/g, '')),
              close: parseFloat((item.closePrice || item.TDD_CLSPRC || '0').toString().replace(/,/g, '')),
              volume: parseInt((item.volume || item.ACC_TRDVOL || '0').toString().replace(/,/g, '')),
              change: parseFloat((item.priceChange || item.CMPPREVDD_PRC || '0').toString().replace(/,/g, '')),
              changeRate: parseFloat((item.changeRate || item.FLUC_RT || '0').toString().replace(/,/g, ''))
            }));
          } catch (mapError) {
            console.error('Error mapping stock data:', mapError);
            throw new Error('데이터 처리 중 오류가 발생했습니다.');
          }
        } else {
          // This should not happen with period specified after backend fix
          console.warn('Received non-array response with period specified. This indicates a backend issue.');
          const closePrice = stockInfo.closePrice || stockInfo.TDD_CLSPRC || stockInfo.ISU_CLSPRC || '0';
          const volumeStr = stockInfo.volume || stockInfo.ACC_TRDVOL || '0';
          const openPrice = stockInfo.openPrice || stockInfo.TDD_OPNPRC || closePrice;
          const highPrice = stockInfo.highPrice || stockInfo.TDD_HGPRC || closePrice;
          const lowPrice = stockInfo.lowPrice || stockInfo.TDD_LWPRC || closePrice;
          const priceChange = stockInfo.priceChange || stockInfo.CMPPREVDD_PRC || '0';
          const changeRate = stockInfo.changeRate || stockInfo.FLUC_RT || '0';
          
          // Single data point for current price
          data = [{
            date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
            open: parseFloat(openPrice.toString().replace(/,/g, '')),
            high: parseFloat(highPrice.toString().replace(/,/g, '')),
            low: parseFloat(lowPrice.toString().replace(/,/g, '')),
            close: parseFloat(closePrice.toString().replace(/,/g, '')),
            volume: parseInt(volumeStr.toString().replace(/,/g, '')),
            change: parseFloat(priceChange.toString().replace(/,/g, '')),
            changeRate: parseFloat(changeRate.toString().replace(/,/g, ''))
          }];
          
          console.error('Backend returned single object instead of array for period:', period);
        }
        
        if (!data || data.length === 0) {
          console.error("StockChart - 데이터 포인트가 없음");
          console.error("Data:", data);
          console.error("stockInfo was:", stockInfo);
          setError("차트 데이터가 없습니다.");
          return;
        }
        
        // Log data status
        if (data.length === 1) {
          console.warn("Only received 1 data point. Check if backend is returning historical data properly.");
        } else {
          console.log(`Received ${data.length} historical data points for ${period} day period`);
        }

        // Filter out any invalid data points and sort
        const validData = data.filter(item => 
          item.close > 0 && 
          item.date && 
          !isNaN(item.close)
        );
        
        
        const sortedData = [...validData].sort((a, b) => a.date.localeCompare(b.date));
        setRawData(sortedData); // Store raw data for indicator calculations
        
        
        const labels = sortedData.map(item => {
          const date = item.date;
          // Check if it's time format (HH:MM) for intraday
          if (date && date.includes(':')) {
            return date; // Return time as-is for intraday
          }
          // For dates in YYYYMMDD format
          if (date && date.length === 8) {
            const month = date.substring(4, 6);
            const day = date.substring(6, 8);
            return `${month}/${day}`;
          }
          // Fallback
          return date || '';
        });

        const prices = sortedData.map(item => item.close);
        const volumes = sortedData.map(item => item.volume);
        const opens = sortedData.map(item => item.open || item.close);
        const highs = sortedData.map(item => item.high || item.close);
        const lows = sortedData.map(item => item.low || item.close);

        // Debug: Log the data we're trying to chart
        console.log('Chart data debug:', {
          labelsLength: labels.length,
          pricesLength: prices.length,
          firstPrice: prices[0],
          lastPrice: prices[prices.length - 1],
          hasNullPrices: prices.some(p => p == null || isNaN(p)),
          priceRange: [Math.min(...prices), Math.max(...prices)]
        });

        // Simplified line chart configuration
        const mainDataset = {
          label: '종가',
          data: prices,
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          pointRadius: 1,
          tension: 0.1,
        };
        
        const newChartData = {
          labels,
          datasets: [mainDataset],
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


        setChartData(newChartData);
        setVolumeChartData(newVolumeData);
        
        console.log("StockChart - 차트 데이터 설정 완료", {
          labels: newChartData.labels.length,
          firstLabel: newChartData.labels[0],
          lastLabel: newChartData.labels[newChartData.labels.length - 1],
          datasets: newChartData.datasets.length
        });
      } else {
        console.error("StockChart - 데이터가 없음:", responseData);
        setError('차트 데이터를 불러오는데 실패했습니다.');
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
    // Safety check - only proceed if we have stable chart state
    if (!chartData || !chartRef.current || !rawData || rawData.length === 0) {
      return;
    }


    // Get the chart instance
    const chart = chartRef.current;
    if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length === 0) {
      return;
    }

    const prices = rawData.map(d => d.close);
    const highs = rawData.map(d => d.high || d.close);
    const lows = rawData.map(d => d.low || d.close);
    const volumes = rawData.map(d => d.volume);
    
    // SAFE APPROACH: Create a completely new dataset array instead of modifying existing
    const newDatasets = [];
    
    // Always keep the main price line as the first dataset
    const mainDataset = chart.data.datasets[0];
    if (mainDataset) {
      newDatasets.push({ ...mainDataset });
    }

    // Add indicators only if requested and data is sufficient
    try {
      // MA(20)
      if (showMA20 && prices.length >= 20) {
        const ma20Values = calculateMA(prices, 20);
        newDatasets.push({
          label: 'MA(20)',
          data: ma20Values,
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0,
        });
      }

      // MA(50) 
      if (showMA50 && prices.length >= 50) {
        const ma50Values = calculateMA(prices, 50);
        newDatasets.push({
          label: 'MA(50)',
          data: ma50Values,
          borderColor: '#8b5cf6',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0,
        });
      }

      // Bollinger Bands
      if (showBollingerBands && prices.length >= 20) {
        const bollingerResult = calculateBollingerBands(prices, 20, 2);
        
        newDatasets.push({
          label: 'BB Upper',
          data: bollingerResult.upper,
          borderColor: 'rgba(249, 115, 22, 0.8)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [2, 2],
          fill: false,
          pointRadius: 0,
        });

        newDatasets.push({
          label: 'BB Lower', 
          data: bollingerResult.lower,
          borderColor: 'rgba(249, 115, 22, 0.8)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [2, 2],
          fill: false,
          pointRadius: 0,
        });

        newDatasets.push({
          label: 'BB Middle',
          data: bollingerResult.middle,
          borderColor: 'rgba(249, 115, 22, 0.6)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
        });
      }

      // EMA(12)
      if (showEMA12 && prices.length >= 12) {
        const ema12Values = calculateEMA(prices, 12);
        newDatasets.push({
          label: 'EMA(12)',
          data: ema12Values,
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [3, 3],
          fill: false,
          pointRadius: 0,
        });
      }

      // EMA(26)
      if (showEMA26 && prices.length >= 26) {
        const ema26Values = calculateEMA(prices, 26);
        newDatasets.push({
          label: 'EMA(26)',
          data: ema26Values,
          borderColor: '#14b8a6',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [3, 3],
          fill: false,
          pointRadius: 0,
        });
      }

      // VWAP
      if (showVWAP) {
        const vwapValues = calculateVWAP(highs, lows, prices, volumes);
        newDatasets.push({
          label: 'VWAP',
          data: vwapValues,
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [2, 4],
          fill: false,
          pointRadius: 0,
        });
      }

      // Ichimoku (needs more data points)
      if (showIchimoku && prices.length >= 52) {
        const ichimokuResult = calculateIchimoku(highs, lows, prices);
        
        newDatasets.push({
          label: 'Tenkan',
          data: ichimokuResult.tenkanSen,
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
        });

        newDatasets.push({
          label: 'Kijun',
          data: ichimokuResult.kijunSen,
          borderColor: '#dc2626',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
        });
      }

      // Update chart with new datasets
      chart.data.datasets = newDatasets;
      chart.update('none'); // Use 'none' to avoid animation issues
      
    } catch (error) {
      console.error('Error updating indicators:', error);
      // If there's an error, just keep the main dataset
      chart.data.datasets = [chart.data.datasets[0]];
      chart.update('none');
    }

    // Handle separate chart indicators (RSI, MACD, Stochastic)
    updateSeparateChartIndicators();
  };

  const updateSeparateChartIndicators = () => {
    if (!rawData || rawData.length === 0) return;

    const prices = rawData.map(d => d.close);
    const highs = rawData.map(d => d.high || d.close);
    const lows = rawData.map(d => d.low || d.close);
    
    const labels = rawData.map(item => {
      if (typeof item.date === 'string' && item.date.length === 8) {
        return `${item.date.substring(4, 6)}/${item.date.substring(6, 8)}`;
      }
      return item.date;
    });

    // RSI Chart
    if (showRSI && prices.length >= 14) {
      try {
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
            fill: false,
          }],
        };
        setRsiChartData(newRsiData);
      } catch (error) {
        console.error('Error calculating RSI:', error);
        setRsiChartData(null);
      }
    } else {
      setRsiChartData(null);
    }

    // MACD Chart  
    if (showMACD && prices.length >= 26) {
      try {
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
              fill: false,
            },
            {
              label: 'Signal',
              data: macdResult.signalLine,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'transparent',
              tension: 0.1,
              pointRadius: 0,
              fill: false,
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
      } catch (error) {
        console.error('Error calculating MACD:', error);
        setMacdChartData(null);
      }
    } else {
      setMacdChartData(null);
    }

    // Stochastic Chart
    if (showStochastic && prices.length >= 14) {
      try {
        const stochResult = calculateStochastic(highs, lows, prices, 14, 3, 3);
        const newStochData = {
          labels,
          datasets: [
            {
              label: '%K',
              data: stochResult.k,
              borderColor: '#8b5cf6',
              backgroundColor: 'transparent',
              tension: 0.1,
              pointRadius: 0,
              fill: false,
            },
            {
              label: '%D',
              data: stochResult.d,
              borderColor: '#06b6d4',
              backgroundColor: 'transparent',
              tension: 0.1,
              pointRadius: 0,
              fill: false,
            },
          ],
        };
        setStochChartData(newStochData);
      } catch (error) {
        console.error('Error calculating Stochastic:', error);
        setStochChartData(null);
      }
    } else {
      setStochChartData(null);
    }
  };

  const toggleDrawingMode = () => {
    console.log('그리기 모드 토글:', !isDrawingMode);
    setIsDrawingMode(!isDrawingMode);
  };

  const handlePeriodChange = (newPeriod: string) => {
    console.log('=== Period Change Debug ===');
    console.log('Current period:', period);
    console.log('New period:', newPeriod);
    console.log('Selected ticker:', selectedStock?.ticker);
    setPeriod(newPeriod);
  };

  const handleChartTypeChange = (newType: ChartType) => {
    setChartType(newType);
  };

  const handleIndicatorChange = (indicator: string, value: boolean) => {
    switch(indicator) {
      case 'ma20': setShowMA20(value); break;
      case 'ma50': setShowMA50(value); break;
      case 'ema12': setShowEMA12(value); break;
      case 'ema26': setShowEMA26(value); break;
      case 'rsi': setShowRSI(value); break;
      case 'macd': setShowMACD(value); break;
      case 'bollinger': setShowBollingerBands(value); break;
      case 'stochastic': setShowStochastic(value); break;
      case 'vwap': setShowVWAP(value); break;
      case 'ichimoku': setShowIchimoku(value); break;
      case 'volume': setShowVolume(value); break;
    }
  };

  // Determine tick settings based on period
  const periodDays = parseInt(period);
  const getTickSettings = () => {
    if (periodDays === 1) {
      // For intraday, show every 2 hours
      return { maxTicksLimit: 8, maxRotation: 0 };
    } else if (periodDays <= 7) {
      // For week view, show all days
      return { maxTicksLimit: 7, maxRotation: 0 };
    } else if (periodDays <= 30) {
      // For month view, show weekly ticks
      return { maxTicksLimit: 8, maxRotation: 45 };
    } else if (periodDays <= 90) {
      // For 3 months, show bi-weekly
      return { maxTicksLimit: 12, maxRotation: 45 };
    } else {
      // For longer periods, limit ticks
      return { maxTicksLimit: 15, maxRotation: 45 };
    }
  };
  
  const tickSettings = getTickSettings();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
          padding: 15,
          font: {
            size: 11,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: false, // Title is now in the header
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#f3f4f6' : '#111827',
        bodyColor: darkMode ? '#d1d5db' : '#4b5563',
        borderColor: darkMode ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (label.includes('종가') || label.includes('MA') || label.includes('EMA')) {
              return `${label}: ${value?.toLocaleString()}원`;
            } else if (label.includes('거래량')) {
              return `${label}: ${formatVolume(value)}`;
            } else if (label.includes('RSI') || label.includes('Stochastic')) {
              return `${label}: ${value?.toFixed(2)}%`;
            }
            return `${label}: ${value?.toFixed(2)}`;
          },
        },
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: false,
          },
          pinch: {
            enabled: false,
          },
        },
        pan: {
          enabled: false,
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: false,
        },
        ticks: {
          maxTicksLimit: tickSettings.maxTicksLimit,
          maxRotation: tickSettings.maxRotation,
          minRotation: 0,
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
          autoSkip: true,
          autoSkipPadding: 5,
        },
        grid: {
          display: true,
          color: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: false,
        },
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString();
          },
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
        },
        grid: {
          display: true,
          color: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: false,
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
            return value.toLocaleString();
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

  const stochasticChartOptions = {
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
        text: 'Stochastic',
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
    <div className={`min-h-[800px] ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg shadow-xl overflow-hidden flex flex-col`}>
      {/* Header Section */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <ChartControls
          period={period}
          chartType={chartType}
          onPeriodChange={handlePeriodChange}
          onChartTypeChange={handleChartTypeChange}
          darkMode={darkMode}
        />
        
        {/* Drawing Mode Toggle */}
        <div className="px-4 py-2 flex items-center justify-between">
          <button
            onClick={toggleDrawingMode}
            className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
              isDrawingMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isDrawingMode ? '📝 그리기 모드 끄기' : '✏️ 그리기 모드 켜기'}
          </button>
          
          <div className="text-xs text-gray-500">
            {selectedStock ? `${selectedStock.name} (${selectedStock.ticker})` : '종목 미선택'}
          </div>
        </div>
        
        {isDrawingMode && (
          <DrawingToolbar
            onToolChange={setDrawingTool}
            onColorChange={setStrokeColor}
            onWidthChange={setStrokeWidth}
            onClear={clearCanvas}
            onDelete={undoLastShape}
            darkMode={darkMode}
          />
        )}
      </div>
      
      {/* Technical Indicators Panel */}
      <TechnicalIndicators
        indicators={{
          ma20: showMA20,
          ma50: showMA50,
          ema12: showEMA12,
          ema26: showEMA26,
          rsi: showRSI,
          macd: showMACD,
          bollinger: showBollingerBands,
          stochastic: showStochastic,
          vwap: showVWAP,
          ichimoku: showIchimoku,
          volume: showVolume,
        }}
        onIndicatorChange={(indicator, value) => {
          switch(indicator) {
            case 'ma20': setShowMA20(value); break;
            case 'ma50': setShowMA50(value); break;
            case 'ema12': setShowEMA12(value); break;
            case 'ema26': setShowEMA26(value); break;
            case 'rsi': setShowRSI(value); break;
            case 'macd': setShowMACD(value); break;
            case 'bollinger': setShowBollingerBands(value); break;
            case 'stochastic': setShowStochastic(value); break;
            case 'vwap': setShowVWAP(value); break;
            case 'ichimoku': setShowIchimoku(value); break;
            case 'volume': setShowVolume(value); break;
          }
        }}
        darkMode={darkMode}
      />

      {/* Charts Container */}
      <div className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-white'} p-4 space-y-4 overflow-auto`}>
        {/* Main Price Chart */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 shadow-inner`}>
          <div className="relative" style={{ height: '400px' }} ref={chartContainerRef}>
            {isLoading && (
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10 rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-200 dark:border-gray-700 border-t-blue-500"></div>
                <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">차트 데이터를 불러오는 중...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col justify-center items-center">
                <div className="text-red-500 dark:text-red-400 text-center">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium mb-3">{error}</p>
                  <button
                    onClick={() => fetchChartData()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            )}

            {chartData && !isLoading && !error && (
              <Line data={chartData} options={chartOptions} ref={chartRef} />
            )}
            
            {isDrawingMode && (
              <div id="drawing-canvas" className="absolute inset-0 pointer-events-none"></div>
            )}
          </div>
        </div>

        {/* Volume Chart */}
        {showVolume && volumeChartData && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 shadow-inner`}>
            <div style={{ height: '150px' }}>
              <Bar data={volumeChartData} options={volumeChartOptions} ref={volumeChartRef} />
            </div>
          </div>
        )}

        {/* RSI Chart */}
        {showRSI && rsiChartData && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 shadow-inner`}>
            <div style={{ height: '150px' }}>
              <Line data={rsiChartData} options={rsiChartOptions} ref={rsiChartRef} />
            </div>
          </div>
        )}

        {/* MACD Chart */}
        {showMACD && macdChartData && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 shadow-inner`}>
            <div style={{ height: '150px' }}>
              <Bar data={macdChartData} options={macdChartOptions} ref={macdChartRef} />
            </div>
          </div>
        )}
        
        {/* Stochastic Chart */}
        {showStochastic && stochChartData && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 shadow-inner`}>
            <div style={{ height: '150px' }}>
              <Line data={stochChartData} options={stochasticChartOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockChart;