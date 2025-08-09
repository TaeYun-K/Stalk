import React, { useState, useEffect, useRef } from 'react';
import type { Session } from 'openvidu-browser';
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
import { on } from 'events';

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
  session?: Session | null;
  chartInfo?: ChartInfo | null;
  onChartChange?: (info: ChartInfo) => void;
  realTimeUpdates?: boolean;
  chartType?: ChartType;
  period?: number;
  drawingMode?: boolean;
}

type ChartType = 'line';

type ChartInfo = {
  ticker: string;
  period: string;
};

const REAL_TIME_UPDATE_INTERVAL_MS = 10000;

const StockChart: React.FC<StockChartProps> = ({
  selectedStock,
  darkMode = false,
  chartInfo,
  onChartChange,
  realTimeUpdates = false,
  chartType: propChartType = 'line',
  period: propPeriod = 7,
  drawingMode: propDrawingMode = false
}) => {

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
  const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false);
  
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

  const getCurrentTicker = () => chartInfo?.ticker ?? selectedStock?.ticker ?? '';
  
  
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

  
  // 외부 chartInfo 들어오면 내부 period 동기화
  useEffect(() => {
    if(!chartInfo) return;

    if(chartInfo.period !== period) {
      setPeriod(chartInfo.period);
    }
  }, [chartInfo?.ticker, chartInfo?.period]);

  useEffect(() => {
    if (propChartType !== chartType) {
      setChartType(propChartType);
    }
    if (propDrawingMode !== isDrawingMode) {
      setIsDrawingMode(propDrawingMode);
    }

    // period: chartInfo가 없을 때만 보조로 반영
    if (!chartInfo && propPeriod != null) {
      const newPeriod = String(propPeriod);
      if (newPeriod !== period) setPeriod(newPeriod);
    }
  }, [propChartType, propDrawingMode, propPeriod, chartInfo?.ticker, chartInfo?.period]);

  useEffect(() => {
    const ticker = getCurrentTicker();
    console.log('=== FETCH TRIGGER ===', { selectedTicker: selectedStock?.ticker, chartInfoTicker: chartInfo?.ticker, usedTicker: ticker, period });

    if(!ticker) return;
    fetchChartData(); //내부에서 getCurrentTicker와 period 사용

  }, [chartInfo?.ticker, selectedStock?.ticker, period]); 


  // 실시간 업데이트 interval
  useEffect(() => {
  const ticker = getCurrentTicker();
  if (!ticker || !realTimeUpdates) return;

  const id = setInterval(() => fetchChartData(true), REAL_TIME_UPDATE_INTERVAL_MS);
  return () => clearInterval(id);
}, [chartInfo?.ticker, selectedStock?.ticker, period, realTimeUpdates]);

  // Single effect to manage canvas lifecycle with proper cleanup
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanupCanvas = () => {
      if (konvaStage.current) {
        try {
          konvaStage.current.destroy();
          konvaStage.current = null;
        } catch (e) {
          console.error('Error destroying Konva stage:', e);
        }
      }
      setIsCanvasReady(false);
    };

    const setupCanvas = () => {
      if (!mounted || !isDrawingMode || !chartData || !chartContainerRef.current) {
        return;
      }

      // Clean up first
      cleanupCanvas();

      // Setup with delay for DOM stability
      timeoutId = setTimeout(() => {
        if (!mounted) return;
        
        const canvasContainer = document.getElementById('drawing-canvas');
        if (canvasContainer && chartContainerRef.current) {
          try {
            console.log('Konva 캔버스 초기화 시작');
            const stage = initializeCanvas();
            if (stage && mounted) {
              konvaStage.current = stage;
              setIsCanvasReady(true);
              console.log('Konva 캔버스 초기화 성공');
              enableDrawing();
            }
          } catch (e) {
            console.error('Error initializing Konva:', e);
            if (mounted) {
              setIsCanvasReady(false);
            }
          }
        }
      }, 500); // Longer delay for stability
    };

    // Setup canvas when conditions are met
    setupCanvas();

    // Cleanup function
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      cleanupCanvas();
    };
  }, [isDrawingMode, period, chartData]); // All dependencies that should trigger re-init

  // Removed duplicate effect - drawing mode is now handled in the main canvas initialization effect

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
      // More comprehensive market type detection - same logic as in use-stock-data.ts
      const ticker = getCurrentTicker();
      let marketType: string;
      
      if (ticker.startsWith('9') || ticker.startsWith('3')) {
        marketType = 'KOSDAQ';
      } else if (ticker.startsWith('00')) {
        marketType = 'KOSPI'; 
      } else {
        // For ambiguous cases like 194480 (Dev Sisters), default to KOSDAQ for 1xxxxx range
        marketType = ticker.startsWith('1') ? 'KOSDAQ' : 'KOSPI';
      }
      
      // Ensure period is a number
      const periodNum = parseInt(period);
      console.log(`StockChart - API 요청: /api/krx/stock/${ticker}?market=${marketType}&period=${periodNum}`);
      console.log(`Period type: ${typeof period}, Period value: ${period}, Parsed: ${periodNum}`);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/krx/stock/${ticker}?market=${marketType}&period=${periodNum}&t=${Date.now()}`,
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
          data: bollingerResult.upperBand,
          borderColor: 'rgba(249, 115, 22, 0.8)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [2, 2],
          fill: false,
          pointRadius: 0,
        });

        newDatasets.push({
          label: 'BB Lower', 
          data: bollingerResult.lowerBand,
          borderColor: 'rgba(249, 115, 22, 0.8)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [2, 2],
          fill: false,
          pointRadius: 0,
        });

        newDatasets.push({
          label: 'BB Middle',
          data: bollingerResult.middleBand,
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
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0,
        });

        newDatasets.push({
          label: 'Kijun',
          data: ichimokuResult.kijunSen,
          borderColor: '#dc2626',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0,
        });

        // Senkou Span A
        newDatasets.push({
          label: 'Senkou A',
          data: ichimokuResult.senkouSpanA,
          borderColor: 'rgba(34, 197, 94, 0.5)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
        });

        // Senkou Span B
        newDatasets.push({
          label: 'Senkou B',
          data: ichimokuResult.senkouSpanB,
          borderColor: 'rgba(239, 68, 68, 0.5)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
        });

        // Chikou Span
        newDatasets.push({
          label: 'Chikou',
          data: ichimokuResult.chikouSpan,
          borderColor: '#a855f7',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [2, 2],
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
              type: 'line' as const,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'transparent',
              tension: 0.1,
              pointRadius: 0,
              fill: false,
              borderWidth: 2,
              yAxisID: 'y',
            },
            {
              label: 'Signal',
              data: macdResult.signalLine,
              type: 'line' as const,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'transparent',
              tension: 0.1,
              pointRadius: 0,
              fill: false,
              borderWidth: 2,
              yAxisID: 'y',
            },
            {
              label: 'Histogram',
              data: macdResult.histogram,
              type: 'bar' as const,
              backgroundColor: macdResult.histogram.map((val: number | null) => 
                val && val > 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
              ),
              borderColor: macdResult.histogram.map((val: number | null) => 
                val && val > 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
              ),
              borderWidth: 1,
              yAxisID: 'y',
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
    setPeriod(newPeriod);

    const ticker = getCurrentTicker();
    if(ticker) {
      onChartChange?.({
        ticker,
        period: newPeriod
      });
    }
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
          padding: 10,
          font: {
            size: 12,
            family: "'Inter', 'system-ui', sans-serif",
            weight: '500',
          },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,
          boxHeight: 6,
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
              return `${label}: ${value?.toLocaleString()}주 (${formatVolume(value)})`;
            } else if (label.includes('RSI') || label.includes('Stochastic')) {
              return `${label}: ${value?.toFixed(2)}%`;
            } else if (label.includes('VWAP') || label.includes('BB') || label.includes('Bollinger') || label.includes('Ichimoku')) {
              return `${label}: ${value?.toLocaleString()}원`;
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
            size: 11,
            family: "'Inter', 'system-ui', sans-serif",
          },
          autoSkip: true,
          autoSkipPadding: 5,
          padding: 8,
        },
        grid: {
          display: true,
          color: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: {
          display: false,
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
            return value.toLocaleString() + '원';
          },
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 11,
            family: "'Inter', 'system-ui', sans-serif",
          },
          padding: 8,
        },
        grid: {
          display: true,
          color: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
          drawBorder: false,
          lineWidth: 1,
        },
        border: {
          display: false,
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
        padding: 10,
        font: {
          size: 14,
          weight: '600',
        },
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
            const value = context.parsed.y;
            return `거래량: ${value?.toLocaleString()}주 (${formatVolume(value)})`;
          },
        },
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
          padding: 8,
          font: {
            size: 11,
          },
        },
        grid: {
          color: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        // Ensure minimum height for volume bars
        min: 0,
      },
    },
    // Improve interaction with volume bars
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
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
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
          padding: 8,
          font: {
            size: 11,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: 'MACD',
        color: darkMode ? '#e5e7eb' : '#111827',
        padding: 10,
        font: {
          size: 14,
          weight: '600',
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#f3f4f6' : '#111827',
        bodyColor: darkMode ? '#d1d5db' : '#4b5563',
        borderColor: darkMode ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          padding: 8,
          font: {
            size: 11,
          },
        },
        grid: {
          color: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
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
    if (volume >= 100000000) {
      return `${(volume / 100000000).toFixed(1)}억`;
    } else if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(1)}천만`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}백만`;
    } else if (volume >= 10000) {
      return `${(volume / 10000).toFixed(1)}만`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}천`;
    }
    return volume.toLocaleString();
  };

  const ticker = getCurrentTicker();
  const displayname = selectedStock?.name ?? `${ticker} (공유)`;
  if (!ticker) {
    return (
      <div className={`h-full ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
        <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-base py-16`}>
          주식을 선택하거나 공유된 차트를 기다려 주세요.
        </div>
      </div>
    );
  }

  // Determine which indicators can be shown based on data length
  const canShowRSI = rawData && rawData.length >= 14;
  const canShowMACD = rawData && rawData.length >= 26;
  const canShowStochastic = rawData && rawData.length >= 14;
  const canShowBollinger = rawData && rawData.length >= 20;
  const canShowMA20 = rawData && rawData.length >= 20;
  const canShowMA50 = rawData && rawData.length >= 50;
  const canShowEMA12 = rawData && rawData.length >= 12;
  const canShowEMA26 = rawData && rawData.length >= 26;
  const canShowIchimoku = rawData && rawData.length >= 52;

  return (
    <div className={`h-full w-full flex ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Left Sidebar - Technical Indicators */}
      <div className={`w-64 flex-shrink-0 ${darkMode ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200'} flex flex-col z-10 h-full overflow-y-auto`}>
        <div className="flex-1 overflow-y-auto">
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
              // Check if indicator can be enabled based on data length
              switch(indicator) {
                case 'ma20': 
                  if (!canShowMA20 && value) {
                    alert('MA(20)을 표시하려면 최소 20개의 데이터가 필요합니다.');
                    return;
                  }
                  setShowMA20(value); 
                  break;
                case 'ma50': 
                  if (!canShowMA50 && value) {
                    alert('MA(50)을 표시하려면 최소 50개의 데이터가 필요합니다.');
                    return;
                  }
                  setShowMA50(value); 
                  break;
                case 'ema12': 
                  if (!canShowEMA12 && value) {
                    alert('EMA(12)를 표시하려면 최소 12개의 데이터가 필요합니다.');
                    return;
                  }
                  setShowEMA12(value); 
                  break;
                case 'ema26': 
                  if (!canShowEMA26 && value) {
                    alert('EMA(26)을 표시하려면 최소 26개의 데이터가 필요합니다.');
                    return;
                  }
                  setShowEMA26(value); 
                  break;
                case 'rsi': 
                  if (!canShowRSI && value) {
                    alert('RSI를 표시하려면 최소 14개의 데이터가 필요합니다.');
                    return;
                  }
                  setShowRSI(value); 
                  break;
                case 'macd': 
                  if (!canShowMACD && value) {
                    alert('MACD를 표시하려면 최소 26개의 데이터가 필요합니다.');
                    return;
                  }
                  setShowMACD(value); 
                  break;
                case 'bollinger': 
                  if (!canShowBollinger && value) {
                    alert('볼린저 밴드를 표시하려면 최소 20개의 데이터가 필요합니다.');
                    return;
                  }
                  setShowBollingerBands(value); 
                  break;
                case 'stochastic': 
                  if (!canShowStochastic && value) {
                    alert('Stochastic을 표시하려면 최소 14개의 데이터가 필요합니다.');
                    return;
                  }
                  setShowStochastic(value); 
                  break;
                case 'vwap': setShowVWAP(value); break;
                case 'ichimoku': 
                  if (!canShowIchimoku && value) {
                    alert('일목균형표를 표시하려면 최소 52개의 데이터가 필요합니다.');
                    return;
                  }
                  setShowIchimoku(value); 
                  break;
                case 'volume': setShowVolume(value); break;
              }
            }}
            darkMode={darkMode}
            disabledIndicators={{
              ma20: !canShowMA20,
              ma50: !canShowMA50,
              ema12: !canShowEMA12,
              ema26: !canShowEMA26,
              rsi: !canShowRSI,
              macd: !canShowMACD,
              bollinger: !canShowBollinger,
              stochastic: !canShowStochastic,
              ichimoku: !canShowIchimoku,
            }}
          />
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact Header with Controls */}
        <div className={`${darkMode ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-gray-200'}`}>
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <h2 className={`text-lg font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedStock?.name || '공유 차트'}
                </h2>                
                  <>
                    <span className={`text-sm px-2 py-0.5 rounded font-medium ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      {displayname /* getCurrentTicker() 결과 */}
                    </span>
                    {rawData && (
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {rawData.length}개
                      </span>
                    )}
                  </>
                
                <div className="flex-1">
                  <ChartControls
                    period={period}
                    chartType={chartType}
                    onPeriodChange={handlePeriodChange}
                    onChartTypeChange={handleChartTypeChange}
                    darkMode={darkMode}
                  />
                </div>
              </div>
              <button
                onClick={toggleDrawingMode}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isDrawingMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isDrawingMode ? '그리기 끄기' : '그리기 켜기'}
              </button>
            </div>
            
            {isDrawingMode && (
              <div className="mt-2">
                <DrawingToolbar
                  onToolChange={setDrawingTool}
                  onColorChange={setStrokeColor}
                  onWidthChange={setStrokeWidth}
                  onClear={clearCanvas}
                  onDelete={undoLastShape}
                  darkMode={darkMode}
                />
              </div>
            )}
          </div>
        </div>
      

        {/* Charts Container */}
        <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-950' : 'bg-gray-50'} overflow-y-auto p-4`}>
          {/* Main Price Chart */}
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${darkMode ? 'border-gray-800' : 'border-gray-200'} mb-4`}>
            <div className="relative" style={{ minHeight: '400px', height: '50vh', maxHeight: '600px', padding: '24px' }} ref={chartContainerRef}>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10 rounded-xl">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500"></div>
                  <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">차트 데이터를 불러오는 중...</p>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col justify-center items-center p-6">
                  <div className={`max-w-md mx-auto text-center ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      차트 데이터를 불러올 수 없습니다
                    </h3>
                    <p className={`text-sm mb-6 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {error}
                    </p>
                    <button
                      onClick={() => fetchChartData()}
                      className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        darkMode 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } shadow-lg hover:shadow-xl transform hover:scale-105`}
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              )}

              {chartData && !isLoading && !error && (
                <Line data={chartData} options={chartOptions} ref={chartRef} />
              )}
              
              {/* Always render the canvas container to avoid DOM manipulation issues */}
              <div 
                id="drawing-canvas" 
                className="absolute inset-0 pointer-events-none"
                style={{ 
                  display: isDrawingMode ? 'block' : 'none',
                  opacity: isCanvasReady ? 1 : 0, 
                  transition: 'opacity 0.3s' 
                }}
              />
            </div>
          </div>

          {/* Secondary Indicators Container */}
          {(showVolume || showRSI || showMACD || showStochastic) && (
            <div className="space-y-4">
              {/* Volume Chart */}
              {showVolume && volumeChartData && (
                <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div style={{ minHeight: '180px', height: '25vh', maxHeight: '300px', padding: '20px' }}>
                    <Bar data={volumeChartData} options={volumeChartOptions} ref={volumeChartRef} />
                  </div>
                </div>
              )}

              {/* RSI Chart */}
              {showRSI && rsiChartData && canShowRSI && (
                <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div style={{ minHeight: '150px', height: '20vh', maxHeight: '250px', padding: '16px' }}>
                    <Line data={rsiChartData} options={rsiChartOptions} ref={rsiChartRef} />
                  </div>
                </div>
              )}

              {/* MACD Chart */}
              {showMACD && macdChartData && canShowMACD && (
                <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div style={{ minHeight: '180px', height: '25vh', maxHeight: '300px', padding: '20px' }}>
                    <Line data={macdChartData} options={macdChartOptions} ref={macdChartRef} />
                  </div>
                </div>
              )}
              
              {/* Stochastic Chart */}
              {showStochastic && stochChartData && canShowStochastic && (
                <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div style={{ minHeight: '150px', height: '20vh', maxHeight: '250px', padding: '16px' }}>
                    <Line data={stochChartData} options={stochasticChartOptions} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockChart;