import React, { useState, useEffect, useRef } from 'react';
import type { Session } from 'openvidu-browser';
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  TimeScale,
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
import EnhancedTechnicalIndicators from '../chart-controls/enhanced-technical-indicators';
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
import 'chartjs-adapter-date-fns';

ChartJS.register(
  TimeScale,
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
  enableFutureSpace?: boolean;
  futureSpaceDays?: number;
}

type ChartType = 'line';

type ChartInfo = {
  ticker: string;
  period: string;
};


// 데이터 좌표로 변환하기 위한 type
type DataPoint = { x: number; y: number }; // x: timestamp(ms), y: price

// px to data 변환
const pxToData = (chart: any, px: number, py: number): DataPoint => ({
  x: chart.scales.x.getValueForPixel(px),
  y: chart.scales.y.getValueForPixel(py),
});

// data to px 
const dataToPx = (chart: any, x: number, y: number) => ({
  x: chart.scales.x.getPixelForValue(x),
  y: chart.scales.y.getPixelForValue(y),
});

// shape를 data -> px 로 변환
const toPixelsShape = (shape: any, chart: any) => {
  if (!shape || shape.coordType !== 'data' || !chart?.scales?.x) return shape;

  const clone = { ...shape };
  if (Array.isArray(clone.points)) {
    const flat: number[] = [];
    for (let i = 0; i < clone.points.length; i += 2) {
      const px = dataToPx(chart, clone.points[i], clone.points[i + 1]);
      flat.push(px.x, px.y);
    }
    clone.points = flat;
  } else if (clone.p1 && clone.p2) {
    const a = dataToPx(chart, clone.p1.x, clone.p1.y);
    const b = dataToPx(chart, clone.p2.x, clone.p2.y);
    clone.p1 = a;
    clone.p2 = b;
  }
  clone.coordType = 'px';
  return clone;
};

// shape를 px -> data 변환
const toDataShape = (shape: any, chart: any) => {
  if (!shape || !chart?.scales?.x) return shape;
  const clone = { ...shape };
  if (Array.isArray(clone.points)) {
    const pts: number[] = [];
    for (let i = 0; i < clone.points.length; i += 2) {
      const d = pxToData(chart, clone.points[i], clone.points[i + 1]);
      pts.push(d.x, d.y);
    }
    clone.points = pts;
  } else if (clone.p1 && clone.p2) {
    clone.p1 = pxToData(chart, clone.p1.x, clone.p1.y);
    clone.p2 = pxToData(chart, clone.p2.x, clone.p2.y);
  }
  clone.coordType = 'data';
  return clone;
};

// 타입 가드
const hasShape = (c: any): c is { type: 'add'|'update'; shape: any; version: number } =>
  c?.type === 'add' || c?.type === 'update';

const REAL_TIME_UPDATE_INTERVAL_MS = 10000;

const StockChart: React.FC<StockChartProps> = ({
  selectedStock,
  darkMode = false,
  chartInfo,
  onChartChange,
  realTimeUpdates = false,
  chartType: propChartType = 'line',
  period: propPeriod = 7,
  drawingMode: propDrawingMode = false,
  session,
  enableFutureSpace = true,
  futureSpaceDays: initialFutureDays = 0
}) => {

  const [chartData, setChartData] = useState<any>(null);
  const [volumeChartData, setVolumeChartData] = useState<any>(null);
  const [rsiChartData, setRsiChartData] = useState<any>(null);
  const [macdChartData, setMacdChartData] = useState<any>(null);
  const [stochChartData, setStochChartData] = useState<any>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [period, setPeriod] = useState<string>(chartInfo?.period ?? propPeriod.toString());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(propDrawingMode);
  const [rawData, setRawData] = useState<ChartDataPoint[]>([]);
  const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false);
  const [futureDays, setFutureDays] = useState<number>(initialFutureDays);
  const [isDraggingFuture, setIsDraggingFuture] = useState(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [initialDragDays, setInitialDragDays] = useState<number>(0);
  const [activeIndicatorTab, setActiveIndicatorTab] = useState<'volume' | 'rsi' | 'macd' | 'stochastic'>('volume');
  const [hoveredHelp, setHoveredHelp] = useState<string | null>(null);
  const [localRSIPeriod, setLocalRSIPeriod] = useState<string>('');
  
  // Enhanced Technical indicators states with configurable periods
  const [indicatorSettings, setIndicatorSettings] = useState({
    ma20: { enabled: false, period: 20 },
    ma50: { enabled: false, period: 50 },
    ema12: { enabled: false, period: 12 },
    ema26: { enabled: false, period: 26 },
    rsi: { enabled: false, period: 14 },
    macd: { enabled: false },
    bollinger: { enabled: false, period: 20, stdDev: 2 },
    stochastic: { enabled: false },
    vwap: { enabled: false },
    ichimoku: { enabled: false },
    volume: { enabled: true }
  });
  
  // Keep backward compatibility
  const showVolume = indicatorSettings.volume.enabled;
  const showMA20 = indicatorSettings.ma20.enabled;
  const showMA50 = indicatorSettings.ma50.enabled;
  const showEMA12 = indicatorSettings.ema12.enabled;
  const showEMA26 = indicatorSettings.ema26.enabled;
  const showRSI = indicatorSettings.rsi.enabled;
  const showMACD = indicatorSettings.macd.enabled;
  const showBollingerBands = indicatorSettings.bollinger.enabled;
  const showStochastic = indicatorSettings.stochastic.enabled;
  const showVWAP = indicatorSettings.vwap.enabled;
  const showIchimoku = indicatorSettings.ichimoku.enabled;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const volumeChartRef = useRef<any>(null);
  const rsiChartRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const konvaStage = useRef<Konva.Stage | null>(null);

  const getCurrentTicker = () => chartInfo?.ticker ?? selectedStock?.ticker ?? '';
  const chartKey = { ticker: getCurrentTicker(), period };

  // Generate future dates for drawing space
  const generateFutureDates = (lastDate: string, days: number): string[] => {
    const dates: string[] = [];
    if (!lastDate || lastDate.length < 8) return dates;
    
    // Parse YYYYMMDD format
    const year = parseInt(lastDate.substring(0, 4));
    const month = parseInt(lastDate.substring(4, 6)) - 1; // JS months are 0-indexed
    const day = parseInt(lastDate.substring(6, 8));
    const startDate = new Date(year, month, day);
    
    let addedDays = 0;
    let currentDate = new Date(startDate);
    
    while (addedDays < days) {
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Skip weekends for stock market
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const dateStr = currentDate.getFullYear().toString() +
          (currentDate.getMonth() + 1).toString().padStart(2, '0') +
          currentDate.getDate().toString().padStart(2, '0');
        dates.push(dateStr);
        addedDays++;
      }
    }
    
    return dates;
  };

  // Handle mouse events for dragging future space
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableFutureSpace) return;
    if (isDrawingMode) return; // Don't interfere with drawing mode
    
    // Allow dragging from anywhere on the chart
    setIsDraggingFuture(true);
    setDragStartX(e.clientX);
    setInitialDragDays(futureDays); // Remember initial state when drag starts
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingFuture || !enableFutureSpace) return;

    const deltaX = dragStartX - e.clientX; // Reversed: dragging left increases days
    const deltaDays = Math.round(deltaX / 20); // 20 pixels = 1 day for very smooth control
    
    // Calculate based on initial days when drag started, not current value
    const newFutureDays = Math.max(
      0, // Allow 0 days (no future space)
      Math.min(180, initialDragDays + deltaDays) // Max 180 days (6 months), add to initial
    );
    
    setFutureDays(newFutureDays);
  };

  const handleMouseUp = () => {
    setIsDraggingFuture(false);
  };
  
  const {
    initializeCanvas,
    enableDrawing,
    disableDrawing,
    clearCanvas,
    undoLastShape,
    setDrawingTool,
    setStrokeColor,
    setStrokeWidth,
    getAllShapes,
    applyRemoteChange,
    applySnapshot
  } = useDrawingCanvas(chartContainerRef, {

    onChange: (change) => {
      console.log('[DRAW→PARENT] change', change); 
      if (!session) return;

      const chart = chartRef.current;
      const serialize = (shape: any) => {
        const clone = { ...shape };
        if (Array.isArray(clone.points)) {
          // [x1,y1,x2,y2,...] 형태라면:
          const pts = [];
          for (let i=0;i<clone.points.length;i+=2) {
            const d = pxToData(chart, clone.points[i], clone.points[i+1]);
            pts.push(d.x, d.y);
          }
          clone.points = pts;
          clone.coordType = 'data';
        } else if (clone.p1 && clone.p2) {
          clone.p1 = pxToData(chart, clone.p1.x, clone.p1.y);
          clone.p2 = pxToData(chart, clone.p2.x, clone.p2.y);
          clone.coordType = 'data';
        }
        return clone;
      };

      let type: string;
      let payload: any = { ...change, chart: { ticker: getCurrentTicker(), period } };

        if (hasShape(change)) {
          type = `drawing:${change.type}`; // add/update
          payload.shape = serialize(change.shape); // ✅ 이때만 shape 접근
        } else if (change.type === 'delete') {
          type = 'drawing:delete';         // id, version만 있음
        } else {
          type = 'drawing:clear';          // clear
        }

      session.signal({ type, data: JSON.stringify(payload) }).catch(console.error);
    }
  });

  
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

  // 언마운트/변경 시 destroy
  useEffect(() => {
    return () => {
      try { volumeChartRef.current?.destroy?.(); } catch {}
      try { rsiChartRef.current?.destroy?.(); } catch {}
      try { macdChartRef.current?.destroy?.(); } catch {}
    };
  }, [activeIndicatorTab]);

  // ticker 변경시 fetch
  useEffect(() => {
    const ticker = getCurrentTicker();

    if (chartInfo && period !== chartInfo.period) return;

    console.log('=== FETCH TRIGGER ===', { selectedTicker: selectedStock?.ticker, chartInfoTicker: chartInfo?.ticker, usedTicker: ticker, period });

    if(!ticker) return;
    fetchChartData(); //내부에서 getCurrentTicker와 period 사용

  }, [chartInfo?.ticker, selectedStock?.ticker, period]);
  
  // Reprocess chart data when futureDays changes
  useEffect(() => {
    if (rawData && rawData.length > 0 && enableFutureSpace) {
      // Trigger a re-fetch to add future dates
      fetchChartData(true);
    }
  }, [futureDays]); 

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

  // 드로잉 시그널 수신 핸들러 등록
  useEffect(() => {
    if (!session) return;

    console.log('[RECV] registering handlers');

    // 수신 페이로드 유효성/차트키 체크
    const isForThisChart = (msg: any) =>
      msg?.chart?.ticker === chartKey.ticker && msg?.chart?.period === chartKey.period;

    // add/update 수신 → 도형 반영
    // 드로잉 추가 수신 처리
    const onAdd = (e: any) => {
      const msg = JSON.parse(e.data);
      if (!isForThisChart(msg)) return;
      const chart = chartRef.current;
      if (!chart?.scales?.x) return; // 차트 준비 전이면 스킵하거나 큐에 저장
      const shapePx = toPixelsShape(msg.shape, chart);
      applyRemoteChange({ type: 'add', shape: shapePx, version: msg.version });
    };

    // 드로잉 갱신 수신 처리
    const onUpdate = (e: any) => {
      const msg = JSON.parse(e.data);
      if (!isForThisChart(msg)) return;
      const chart = chartRef.current;
      if (!chart?.scales?.x) return;
      const shapePx = toPixelsShape(msg.shape, chart);
      applyRemoteChange({ type: 'update', shape: shapePx, version: msg.version });
    };

    // 드로잉 삭제 수신 처리
    const onDelete = (e: any) => {
      const msg = JSON.parse(e.data);
      if (!isForThisChart(msg)) return;
      applyRemoteChange({ type: 'delete', id: msg.id, version: msg.version });
    };

    // 전체 지우기 수신 처리
    const onClear = (e: any) => {
      const msg = JSON.parse(e.data);
      if (!isForThisChart(msg)) return;
      applyRemoteChange({ type: 'clear', version: msg.version } as any);
    };

    // OpenVidu 시그널 리스너 등록
    session.on('signal:drawing:add', onAdd);
    session.on('signal:drawing:update', onUpdate);
    session.on('signal:drawing:delete', onDelete);
    session.on('signal:drawing:clear', onClear);

    // 언마운트 시 정리
    return () => {
      session.off('signal:drawing:add', onAdd);
      session.off('signal:drawing:update', onUpdate);
      session.off('signal:drawing:delete', onDelete);
      session.off('signal:drawing:clear', onClear);
    };
  }, [session, chartKey.ticker, chartKey.period, applyRemoteChange]);

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
  }, [chartData, rawData, indicatorSettings]);

  // Update secondary indicator charts when settings change
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      updateSeparateChartIndicators();
    }
  }, [rawData, indicatorSettings.rsi, indicatorSettings.macd, indicatorSettings.stochastic, indicatorSettings.volume]);


  // 동기화 요청/응답 처리
  useEffect(() => {
    if (!session) return;

    // 동기화 요청 수신 처리
    const onSyncReq = async (e: any) => {
      const msg = JSON.parse(e.data);
      if (msg?.chart?.ticker !== chartKey.ticker || msg?.chart?.period !== chartKey.period) return;

      // 스냅샷 생성 후 응답 전송
      const chart = chartRef.current;
      const shapesPx = getAllShapes();
      const shapesData = shapesPx.map((s: any) => toDataShape(s, chart));

      const response = {
        type: 'sync-response',
        chart: chartKey,
        shapes : shapesData,
        version: undefined // 훅에서 관리 중이면 필요 시 버전도 포함 가능
      };
      session.signal({ type: 'drawing:sync-response', data: JSON.stringify(response) }).catch(console.error);
    };

    // 동기화 응답 수신 처리
    const onSyncRes = (e: any) => {
      const msg = JSON.parse(e.data);
      if (msg?.chart?.ticker !== chartKey.ticker || msg?.chart?.period !== chartKey.period) return;
      const chart = chartRef.current;
      if (!chart?.scales?.x) return;
      const shapesPx = (msg.shapes || []).map((s: any) => toPixelsShape(s, chart));
      console.log('[SYNC] apply snapshot', msg.shapes?.length);
      applySnapshot(shapesPx, msg.version);
    };

    // 리스너 등록
    session.on('signal:drawing:sync-request', onSyncReq);
    session.on('signal:drawing:sync-response', onSyncRes);

    // 정리
    return () => {
      session.off('signal:drawing:sync-request', onSyncReq);
      session.off('signal:drawing:sync-response', onSyncRes);
    };
  }, [session, chartKey.ticker, chartKey.period, getAllShapes, applySnapshot]);

  // 드로잉 모드 켰을 때 또는 차트 변경 시 동기화 요청
  useEffect(() => {
    if (!session) return;
    if (isDrawingMode) {
      requestSync();
    }
  }, [session, isDrawingMode, chartKey.ticker, chartKey.period]);

  // 차트 x축을 TimeScale로 전환하는 함수
  const parseToTs = (raw: string) => {
    // YYYYMMDD → Date
    if (raw && raw.length === 8 && /^\d{8}$/.test(raw)) {
      const y = +raw.slice(0,4), m = +raw.slice(4,6)-1, d = +raw.slice(6,8);
      return new Date(y, m, d).getTime(); // ms timestamp
    }
    // HH:MM (intraday) 같은 케이스는 오늘 날짜와 합성하거나, 백엔드에서 full datetime을 내려주면 best
    if (raw && raw.includes(':')) {
      const [hh, mm] = raw.split(':').map(Number);
      const now = new Date();
      const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
      return dt.getTime();
    }
    // fallback
    return Date.now();
  };

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
        
        // Add future dates if enabled
        let finalData = sortedData;
        let actualDataLength = sortedData.length;

        if (enableFutureSpace && sortedData.length > 0) {
          const lastDate = sortedData[sortedData.length - 1].date;
          const futureDateStrings = generateFutureDates(lastDate, futureDays);
          
          // Create placeholder data points for future dates
          const futureDataPoints: ChartDataPoint[] = futureDateStrings.map(date => ({
            date,
            close: NaN, // NaN so the line doesn't continue
            volume: 0,
            open: NaN,
            high: NaN,
            low: NaN,
            change: 0,
            changeRate: 0
          }));
          
          finalData = [...sortedData, ...futureDataPoints];
        }
        
        setRawData(sortedData); // Store only real data for indicator calculations
        
        const points = finalData.map(item => {
          x : parseToTs(item.date)
          y : item.close
        });

        const volumePoints = finalData.map((item, i) => ({
          x: parseToTs(item.date),
          y: item.volume
        }));

        const prices = finalData.map(item => item.close);
        const volumes = finalData.map(item => item.volume);
        const opens = finalData.map(item => item.open || item.close);
        const highs = finalData.map(item => item.high || item.close);
        const lows = finalData.map(item => item.low || item.close);

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
          data: points,
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          pointRadius: 1,
          tension: 0.1,
          spanGaps: false, // Don't connect NaN values
        };
        
        // Just use the main dataset without the current time indicator
        const datasets = [mainDataset];
        
        const newChartData = {
          datasets,
          actualDataLength, // Store for reference
        };

        // Create volume chart data
        const newVolumeData = {
          datasets: [{
            label: '거래량',
            data: volumePoints,
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


        setChartData({
          datasets: [mainDataset],
          actualDataLength,
        });
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
    const fullXs: number[] = (chart.data.labels as number[]) ?? [];
    const realXs: number[] = rawData.map(d => parseToTs(d.date));
    const prices = rawData.map(d => d.close);
    const highs = rawData.map(d => d.high || d.close);
    const lows = rawData.map(d => d.low || d.close);
    const volumes = rawData.map(d => d.volume);

      // [{x,y}]로 만들고, 실데이터 뒤쪽은 y:null로 패딩하는 유틸
    const toXY = (vals: Array<number | null | undefined>) => {
      const pts: {x:number; y:number|null}[] = [];
      // 실데이터 구간
      const n = Math.min(vals.length, realXs.length);
      for (let i = 0; i < n; i++) {
        const v = vals[i];
        pts.push({ x: realXs[i], y: (v == null || Number.isNaN(v)) ? null : v });
      }
      // 미래공간 패딩
      for (let i = n; i < fullXs.length; i++) {
        pts.push({ x: fullXs[i], y: null });
      }
      return pts;
    };
    
    // SAFE APPROACH: Create a completely new dataset array instead of modifying existing
    const newDatasets: any[] = [];
    
    // Always keep the main price line as the first dataset
    const mainDataset = chart.data.datasets[0];
    if (mainDataset) {
      newDatasets.push({ ...mainDataset });
    }

    // Add indicators only if requested and data is sufficient
    try {
      // MA with configurable period
      if (showMA20 && prices.length >= indicatorSettings.ma20.period) {
        const maValues = calculateMA(prices, indicatorSettings.ma20.period);
        newDatasets.push({
          label: 'MA',
          data: maValues,
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0,
          parsing: false
        });
      }

      // MA(50) - Removed per user request

      // Bollinger Bands with configurable period and stdDev
      if (showBollingerBands && prices.length >= indicatorSettings.bollinger.period) {
        const bollingerResult = calculateBollingerBands(
          prices, 
          indicatorSettings.bollinger.period, 
          indicatorSettings.bollinger.stdDev || 2
        );
        
        newDatasets.push({
          label: 'BB Upper',
          data: toXY(bollingerResult.upperBand),
          borderColor: 'rgba(249, 115, 22, 0.8)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [2, 2],
          fill: false,
          pointRadius: 0,
          parsing: false
        });

        newDatasets.push({
          label: 'BB Lower', 
          data: toXY(bollingerResult.lowerBand),
          borderColor: 'rgba(249, 115, 22, 0.8)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [2, 2],
          fill: false,
          pointRadius: 0,
        });

        newDatasets.push({
          label: 'BB Middle',
          data: toXY(bollingerResult.middleBand),
          borderColor: 'rgba(249, 115, 22, 0.6)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
          parsing: false,
        });
      }

      // EMA with configurable period
      if (showEMA12 && prices.length >= indicatorSettings.ema12.period) {
        const emaValues = calculateEMA(prices, indicatorSettings.ema12.period);
        newDatasets.push({
          label: 'EMA',
          data: toXY(emaValues),
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [3, 3],
          fill: false,
          pointRadius: 0,
          parsing: false,
        });
      }

      // EMA(26) - Removed per user request

      // VWAP
      if (showVWAP) {
        const vwapValues = calculateVWAP(highs, lows, prices, volumes);
        newDatasets.push({
          label: 'VWAP',
          data: toXY(vwapValues),
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
          data: toXY(ichimokuResult.tenkanSen),
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0,
          parsing: false,
        });

        newDatasets.push({
          label: 'Kijun',
          data: toXY(ichimokuResult.kijunSen),
          borderColor: '#dc2626',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0,
          parsing: false,
        });

        // Senkou Span A
        newDatasets.push({
          label: 'Senkou A',
          data: toXY(ichimokuResult.senkouSpanA),
          borderColor: 'rgba(34, 197, 94, 0.5)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
          parsing: false,
        });

        // Senkou Span B
        newDatasets.push({
          label: 'Senkou B',
          data: toXY(ichimokuResult.senkouSpanB),
          borderColor: 'rgba(239, 68, 68, 0.5)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
          parsing: false,
        });

        // Chikou Span
        newDatasets.push({
          label: 'Chikou',
          data: toXY(ichimokuResult.chikouSpan),
          borderColor: '#a855f7',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [2, 2],
          fill: false,
          pointRadius: 0,
          parsing: false,
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

    // RSI Chart with configurable period
    if (showRSI && prices.length >= indicatorSettings.rsi.period) {
      try {
        const rsiValues = calculateRSI(prices, indicatorSettings.rsi.period);
        const newRsiData = {
          labels,
          datasets: [{
            label: `RSI(${indicatorSettings.rsi.period})`,
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
    setIndicatorSettings(prev => ({
      ...prev,
      [indicator]: { ...prev[indicator as keyof typeof prev], enabled: value }
    }));
  };

  // New handler for enhanced indicator settings
  const handleEnhancedIndicatorChange = (indicator: string, config: any) => {
    setIndicatorSettings(prev => ({
      ...prev,
      [indicator]: config
    }));
  };

  // 드로잉 데이터 동기화 요청 전송
  const requestSync = () => {
    if (!session) return;
    // 동기화 요청 브로드캐스트
    session.signal({
      type: 'drawing:sync-request',
      data: JSON.stringify({ type: 'sync-request', chart: chartKey })
    }).catch(console.error);
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
          title: function(context: any) {
            const index = context[0]?.dataIndex;
            if (chartData && index >= chartData.actualDataLength) {
              return 'Future Period (예측 영역)';
            }
            return context[0]?.label || '';
          },
          label: function(context: any) {
            const index = context.dataIndex;
            if (chartData && index >= chartData.actualDataLength && context.dataset.label === '종가') {
              return 'No data - Draw predictions here';
            }
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
        type : 'time',
        time : {
          unit: (periodDays <= 7) ? 'day'     // 필요시 'minute','hour','day' 분기
              : (periodDays <= 30) ? 'day'
              : 'day',
          tooltipFormat: 'yyyy-MM-dd HH:mm',  // 표시 포맷
          displayFormats: {
            minute: 'HH:mm',
            hour: 'MM/dd HH:mm',
            day: 'MM/dd',
            month: 'yyyy-MM'
          }
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
  const canShowMA50 = false; // Disabled per user request
  const canShowEMA12 = rawData && rawData.length >= 12;
  const canShowEMA26 = false; // Disabled per user request
  const canShowIchimoku = rawData && rawData.length >= 52;

  return (
    <div className={`h-full w-full flex ${darkMode ? 'bg-gray-950' : 'bg-gray-50'} relative`}>
      {/* Left Sidebar - Enhanced Technical Indicators */}
      <div className={`w-72 flex-shrink-0 ${darkMode ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200'} flex flex-col h-full overflow-y-auto relative z-20`}>
        <div className="flex-1 overflow-y-auto">
          <EnhancedTechnicalIndicators
            indicators={indicatorSettings}
            onIndicatorChange={handleEnhancedIndicatorChange}
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
              ichimoku: !canShowIchimoku
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
            <div 
              className="relative" 
              style={{ 
                minHeight: '400px', 
                height: '50vh', 
                maxHeight: '600px', 
                padding: '24px', 
                cursor: isDraggingFuture ? 'ew-resize' : (isDrawingMode ? 'default' : 'grab')
              }} 
              ref={chartContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}>
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
                <>
                  <Line key={`price-${getCurrentTicker()}-${period}-main`} data={chartData} options={chartOptions} ref={chartRef}/>
                  
                  {/* Future period visual indicator - subtle overlay only */}
                  {enableFutureSpace && futureDays > 0 && chartData.actualDataLength < chartData.labels.length && (
                    <div 
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{
                        left: `${(chartData.actualDataLength / chartData.labels.length) * 100}%`,
                        right: 0,
                        background: darkMode 
                          ? 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.02) 50%, rgba(59, 130, 246, 0.04) 100%)'
                          : 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.01) 50%, rgba(59, 130, 246, 0.02) 100%)',
                        borderLeft: `1px dashed ${darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.3)'}`
                      }}
                    />
                  )}
                  
                </>
              )}
              
              {/* Always render the canvas container to avoid DOM manipulation issues */}
              <div 
                id="drawing-canvas" 
                className={`absolute inset-0 ${isDrawingMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
                style={{ 
                  display: isDrawingMode ? 'block' : 'none',
                  opacity: isCanvasReady ? 1 : 0, 
                  transition: 'opacity 0.3s' 
                }}
              />
            </div>
          </div>

          {/* Secondary Indicators Container with Tabs - Always Visible */}
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              {/* Tab Headers with Checkboxes and Controls */}
              <div className={`flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex">
                  {/* Volume Tab */}
                  <div className="relative group">
                    <button
                      onClick={() => setActiveIndicatorTab('volume')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                        activeIndicatorTab === 'volume'
                          ? darkMode 
                            ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                            : 'bg-gray-50 text-blue-600 border-b-2 border-blue-600'
                          : darkMode
                            ? 'text-gray-400 hover:text-gray-200'
                            : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={showVolume}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleEnhancedIndicatorChange('volume', { ...indicatorSettings.volume, enabled: !showVolume });
                        }}
                        className="w-3 h-3"
                      />
                      거래량
                    </button>
                    {/* Hover tooltip */}
                    <div className={`absolute bottom-full left-0 mb-2 p-2 rounded shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 ${
                      darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700 border'
                    }`}>
                      거래량을 막대 그래프로 표시합니다
                    </div>
                  </div>

                  {/* RSI Tab */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveIndicatorTab('rsi')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                        activeIndicatorTab === 'rsi'
                          ? darkMode 
                            ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                            : 'bg-gray-50 text-blue-600 border-b-2 border-blue-600'
                          : darkMode
                            ? 'text-gray-400 hover:text-gray-200'
                            : 'text-gray-600 hover:text-gray-900'
                      } ${!canShowRSI ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!canShowRSI}
                    >
                      <input
                        type="checkbox"
                        checked={showRSI}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (canShowRSI) {
                            handleEnhancedIndicatorChange('rsi', { ...indicatorSettings.rsi, enabled: !showRSI });
                          }
                        }}
                        disabled={!canShowRSI}
                        className="w-3 h-3"
                      />
                      RSI
                      {showRSI && (
                        <input
                          type="text"
                          value={localRSIPeriod || indicatorSettings.rsi.period}
                          onChange={(e) => {
                            e.stopPropagation();
                            const value = e.target.value;
                            setLocalRSIPeriod(value); // Update local state immediately
                            
                            // Only update if it's a valid number
                            if (value === '') return; // Allow empty for typing
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue > 0 && numValue <= 100) {
                              handleEnhancedIndicatorChange('rsi', { ...indicatorSettings.rsi, period: numValue });
                            }
                          }}
                          onBlur={(e) => {
                            e.stopPropagation();
                            // On blur, ensure a valid value
                            const value = e.target.value;
                            const numValue = parseInt(value);
                            if (isNaN(numValue) || numValue < 2) {
                              setLocalRSIPeriod('14');
                              handleEnhancedIndicatorChange('rsi', { ...indicatorSettings.rsi, period: 14 });
                            } else if (numValue > 100) {
                              setLocalRSIPeriod('100');
                              handleEnhancedIndicatorChange('rsi', { ...indicatorSettings.rsi, period: 100 });
                            } else {
                              setLocalRSIPeriod(numValue.toString());
                              handleEnhancedIndicatorChange('rsi', { ...indicatorSettings.rsi, period: numValue });
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`w-12 px-1 text-xs rounded border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                          placeholder="14"
                        />
                      )}
                      <div
                        onMouseEnter={() => setHoveredHelp('rsi')}
                        onMouseLeave={() => setHoveredHelp(null)}
                        onClick={(e) => e.stopPropagation()}
                        className="relative"
                      >
                        <span className={`text-xs rounded-full w-4 h-4 flex items-center justify-center ${
                          darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}>
                          ?
                        </span>
                      </div>
                    </button>
                    {/* Detailed RSI Explanation */}
                    {hoveredHelp === 'rsi' && (
                      <div className={`absolute top-full left-0 mt-2 p-3 rounded-lg shadow-xl text-xs w-80 z-[100] ${
                        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                      }`}>
                        <h4 className={`font-bold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          RSI (Relative Strength Index) - 상대강도지수
                        </h4>
                        <div className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <p>
                            <strong>설명:</strong> RSI는 일정 기간 동안 주가의 상승폭과 하락폭을 비교하여 현재 주가가 과매수 또는 과매도 상태인지를 나타내는 모멘텀 지표입니다.
                          </p>
                          <p>
                            <strong>계산:</strong> 0~100 사이의 값으로 표시되며, 일반적으로 14일 기간을 사용합니다.
                          </p>
                          <div>
                            <strong>해석:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                              <li>70 이상: 과매수 구간 (하락 전환 가능성)</li>
                              <li>30 이하: 과매도 구간 (상승 전환 가능성)</li>
                              <li>50 기준: 상승/하락 추세 판단</li>
                            </ul>
                          </div>
                          <p>
                            <strong>활용:</strong> 다이버전스(주가와 RSI의 반대 움직임)를 통해 추세 전환을 예측할 수 있습니다.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* MACD Tab */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveIndicatorTab('macd')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                        activeIndicatorTab === 'macd'
                          ? darkMode 
                            ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                            : 'bg-gray-50 text-blue-600 border-b-2 border-blue-600'
                          : darkMode
                            ? 'text-gray-400 hover:text-gray-200'
                            : 'text-gray-600 hover:text-gray-900'
                      } ${!canShowMACD ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!canShowMACD}
                    >
                      <input
                        type="checkbox"
                        checked={showMACD}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (canShowMACD) {
                            handleEnhancedIndicatorChange('macd', { ...indicatorSettings.macd, enabled: !showMACD });
                          }
                        }}
                        disabled={!canShowMACD}
                        className="w-3 h-3"
                      />
                      MACD
                      <div
                        onMouseEnter={() => setHoveredHelp('macd')}
                        onMouseLeave={() => setHoveredHelp(null)}
                        onClick={(e) => e.stopPropagation()}
                        className="relative"
                      >
                        <span className={`text-xs rounded-full w-4 h-4 flex items-center justify-center ${
                          darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}>
                          ?
                        </span>
                      </div>
                    </button>
                    {/* Detailed MACD Explanation */}
                    {hoveredHelp === 'macd' && (
                      <div className={`absolute top-full left-0 mt-2 p-3 rounded-lg shadow-xl text-xs w-80 z-[100] ${
                        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                      }`}>
                        <h4 className={`font-bold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          MACD (Moving Average Convergence Divergence)
                        </h4>
                        <div className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <p>
                            <strong>설명:</strong> MACD는 두 이동평균선의 차이를 이용해 추세의 변화를 포착하는 지표입니다.
                          </p>
                          <div>
                            <strong>구성요소:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                              <li>MACD선: 12일 EMA - 26일 EMA</li>
                              <li>시그널선: MACD의 9일 EMA</li>
                              <li>히스토그램: MACD선 - 시그널선</li>
                            </ul>
                          </div>
                          <div>
                            <strong>매매신호:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                              <li>골든크로스: MACD가 시그널선 상향돌파 (매수)</li>
                              <li>데드크로스: MACD가 시그널선 하향돌파 (매도)</li>
                              <li>0선 돌파: 추세 전환 신호</li>
                            </ul>
                          </div>
                          <p>
                            <strong>주의:</strong> 횡보장에서는 잦은 거짓 신호가 발생할 수 있습니다.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stochastic Tab */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveIndicatorTab('stochastic')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                        activeIndicatorTab === 'stochastic'
                          ? darkMode 
                            ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                            : 'bg-gray-50 text-blue-600 border-b-2 border-blue-600'
                          : darkMode
                            ? 'text-gray-400 hover:text-gray-200'
                            : 'text-gray-600 hover:text-gray-900'
                      } ${!canShowStochastic ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!canShowStochastic}
                    >
                      <input
                        type="checkbox"
                        checked={showStochastic}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (canShowStochastic) {
                            handleEnhancedIndicatorChange('stochastic', { ...indicatorSettings.stochastic, enabled: !showStochastic });
                          }
                        }}
                        disabled={!canShowStochastic}
                        className="w-3 h-3"
                      />
                      스토캐스틱
                      <div
                        onMouseEnter={() => setHoveredHelp('stochastic')}
                        onMouseLeave={() => setHoveredHelp(null)}
                        onClick={(e) => e.stopPropagation()}
                        className="relative"
                      >
                        <span className={`text-xs rounded-full w-4 h-4 flex items-center justify-center ${
                          darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}>
                          ?
                        </span>
                      </div>
                    </button>
                    {/* Detailed Stochastic Explanation - Position adjusted to prevent cropping */}
                    {hoveredHelp === 'stochastic' && (
                      <div 
                        className={`absolute mt-2 p-3 rounded-lg shadow-xl text-xs w-80 z-[100] ${
                          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}
                        style={{
                          top: '100%',
                          right: 0, // Align to right edge instead of left to prevent right-side cropping
                        }}
                      >
                        <h4 className={`font-bold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          스토캐스틱 (Stochastic Oscillator)
                        </h4>
                        <div className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <p>
                            <strong>설명:</strong> 일정 기간 동안의 최고가와 최저가 범위 내에서 현재 가격의 위치를 백분율로 나타내는 지표입니다.
                          </p>
                          <div>
                            <strong>구성:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                              <li>%K (빠른선): 현재 가격의 상대적 위치</li>
                              <li>%D (느린선): %K의 3일 이동평균</li>
                            </ul>
                          </div>
                          <div>
                            <strong>매매신호:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                              <li>80 이상: 과매수 구간 (매도 고려)</li>
                              <li>20 이하: 과매도 구간 (매수 고려)</li>
                              <li>%K와 %D 교차: 추세 전환 신호</li>
                              <li>다이버전스: 추세 약화 신호</li>
                            </ul>
                          </div>
                          <p>
                            <strong>특징:</strong> 박스권 장세에서 특히 유용하며, 추세장에서는 과매수/과매도 상태가 지속될 수 있습니다.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div style={{ minHeight: '200px', height: '25vh', maxHeight: '300px', padding: '20px' }}>
                {/* Show chart based on active tab */}
                {activeIndicatorTab === 'volume' && showVolume && volumeChartData ? (
                  <Bar data={volumeChartData} options={volumeChartOptions} ref={volumeChartRef}/>
                ) : activeIndicatorTab === 'rsi' && showRSI && rsiChartData && canShowRSI ? (
                  <Line data={rsiChartData} options={rsiChartOptions} ref={rsiChartRef}/>
                ) : activeIndicatorTab === 'macd' && showMACD && macdChartData && canShowMACD ? (
                  <Line data={macdChartData} options={macdChartOptions} ref={macdChartRef}/>
                ) : activeIndicatorTab === 'stochastic' && showStochastic && stochChartData && canShowStochastic ? (
                  <Line data={stochChartData} options={stochasticChartOptions}/>
                ) : (
                  <div className={`flex items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="text-center">
                      <p className="text-sm mb-2">선택된 지표가 없습니다</p>
                      <p className="text-xs">위 탭에서 체크박스를 클릭하여 지표를 활성화하세요</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StockChart;