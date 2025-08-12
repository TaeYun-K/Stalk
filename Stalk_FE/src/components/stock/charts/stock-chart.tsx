import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Session } from 'openvidu-browser';
import {
  Chart as ChartJS,
  Chart,
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
  enableFutureSpace?: boolean;
  futureSpaceDays?: number;
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
  const [scrollIndicatorVisible, setScrollIndicatorVisible] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [sharedChart, setSharedChart] = useState<ChartInfo | null>(null);

  // Detect sidebar state from body margin
  const [sidebarOffset, setSidebarOffset] = useState(0);
  const [activeIndicatorTab, setActiveIndicatorTab] = useState<'volume' | 'rsi' | 'macd' | 'stochastic'>('volume');
  const [hoveredHelp, setHoveredHelp] = useState<string | null>(null);
  const [hoveredIndicatorHelp, setHoveredIndicatorHelp] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Indicator explanations for tooltips
  const indicatorTabExplanations = {
    volume: {
      title: '거래량 (Volume)',
      description: '주식이 거래된 수량을 막대 그래프로 표시합니다.',
      usage: '가격 상승 시 거래량이 증가하면 상승 추세가 강화되었음을 의미합니다.',
    },
    rsi: {
      title: 'RSI (상대강도지수)',
      description: '가격의 상승압력과 하락압력 간의 상대적 강도를 0-100 범위로 나타냅니다.',
      usage: '70 이상: 과매수 구간, 30 이하: 과매도 구간으로 해석합니다.',
    },
    macd: {
      title: 'MACD',
      description: '단기와 장기 이동평균의 차이를 이용한 추세 추종 모멘텀 지표입니다.',
      usage: 'MACD선이 시그널선을 상향 돌파 시 매수 신호, 하향 돌파 시 매도 신호입니다.',
    },
    stochastic: {
      title: '스토캐스틱',
      description: '일정 기간 중 현재 가격의 상대적 위치를 0-100 범위로 나타내는 모멘텀 지표입니다.',
      usage: '80 이상: 과매수, 20 이하: 과매도. %K와 %D선의 교차로 매매 신호를 포착합니다.',
    },
  };
  const [localRSIPeriod, setLocalRSIPeriod] = useState<string>('');
  const [indicatorHeight, setIndicatorHeight] = useState(180); // Dynamic height
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [initialHeight, setInitialHeight] = useState(180);

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
  const stochasticChartRef = useRef<any>(null);
  const konvaStage = useRef<Konva.Stage | null>(null);

  const getCurrentTicker = () =>
  sharedChart?.ticker ?? chartInfo?.ticker ?? selectedStock?.ticker ?? '';

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

  // Note: Wheel event handling moved to native event listener in useEffect for better scroll prevention

  // Handle resize of indicator section
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    setResizeStartY(e.clientY);
    setInitialHeight(indicatorHeight);
    e.preventDefault();
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaY = resizeStartY - e.clientY;
    const newHeight = Math.max(100, Math.min(400, initialHeight + deltaY));
    setIndicatorHeight(newHeight);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStartY, initialHeight]);



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

      if (!session) return;
      const payload = { ...change, chart: chartKey };
      const type =
        change.type === 'add' || change.type === 'update' ? `drawing:${change.type}`
        : change.type === 'delete' ? 'drawing:delete'
        : 'drawing:clear';
      session.signal({ type, data: JSON.stringify(payload) }).catch(console.error);
    }
  });

  // 기간이 없을 때도 차트 공유 되도록
  useEffect(() => {
    if (sharedChart?.period && sharedChart.period !== period) {
      setPeriod(sharedChart.period);
    }
  }, [sharedChart?.period]);

  // ✅ 최초 진입 시 내가 ticker 모르면 최신 차트 요청
  useEffect(() => {
    if (!session) return;

    const noLocalChart =
      !sharedChart?.ticker && !chartInfo?.ticker && !selectedStock?.ticker;

    if (noLocalChart) {
      session.signal({
        type: 'chart:sync_request',
        data: JSON.stringify({ ts: Date.now() }),
      }).catch(console.error);
    }
  }, [session]);

  // ✅ chart:sync_request 들어오면 현재 차트 info 응답
  useEffect(() => {
    if (!session) return;

    const onChartSyncRequest = (e: any) => {
      try {
        // 내가 가지고 있는 현재 차트 상태
        const ticker = getCurrentTicker();
        const info = { ticker, period };

        // 내가 아직 차트를 안 보고 있으면 응답할 게 없으니 무시
        if (!info.ticker || !info.period) return;

        // 요청 보낸 상대에게만 회신 (OpenVidu: to 는 Connection 배열)
        const to = e.from ? [e.from] : undefined;

        session.signal({
          type: 'chart:change',
          data: JSON.stringify(info),
          to
        }).catch(console.error);
      } catch (err) {
        console.error('chart:sync_request handler error', err);
      }
    };

    session.on('signal:chart:sync_request', onChartSyncRequest);
    return () => {
      session.off('signal:chart:sync_request', onChartSyncRequest);
    };
  }, [session, sharedChart?.ticker, chartInfo?.ticker, selectedStock?.ticker, period]);

  // ✅ chart:change 수신 시 내 sharedChart 반영
  useEffect(() => {
    if (!session) return;
    const onChartChange = (e: any) => {
      try {
        const info = JSON.parse(e.data);
        if (!info?.ticker || !info?.period) return;
        setSharedChart(info);
        setPeriod(info.period);
        fetchChartData(false, { ticker: info.ticker, period: info.period });
      } catch (err) { console.error('chart:change payload error', err); }
    };
    session.on('signal:chart:change', onChartChange);
    return () => {session.off('signal:chart:change', onChartChange)};
  }, [session]);

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

  // ticker 변경시 fetch
  useEffect(() => {
    const ticker = getCurrentTicker();
    
    if(!ticker) return;
    fetchChartData(); //내부에서 getCurrentTicker와 period 사용

  }, [sharedChart?.ticker, chartInfo?.ticker, selectedStock?.ticker, period]);

  // Reprocess chart data when futureDays changes
  useEffect(() => {
    if (rawData && rawData.length > 0 && enableFutureSpace) {
      // Trigger a re-fetch to add future dates
      fetchChartData(true);
      // Also update indicator charts with new future space
      updateSeparateChartIndicators();
    }
  }, [futureDays]);

  // Detect sidebar state and calculate proper offset
  useEffect(() => {
    const checkSidebarState = () => {
      const bodyMargin = window.getComputedStyle(document.body).marginRight;
      const marginValue = parseInt(bodyMargin) || 0;

      // The sidebar is 80px wide (w-20), but sets different body margins
      // When collapsed: body margin is 64px, sidebar width is 80px -> 16px overlap
      // We need to account for the full sidebar width plus some padding
      let offset = 0;
      if (marginValue > 0) {
        // Add extra offset to account for the sidebar's actual width
        offset = Math.max(85, marginValue + 20); // Ensure minimum 85px offset
      }
      setSidebarOffset(offset);
    };

    // Check initially
    checkSidebarState();

    // Listen for changes
    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style']
    });

    // Also check on window resize
    window.addEventListener('resize', checkSidebarState);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkSidebarState);
    };
  }, []);

  // 실시간 업데이트 interval
  useEffect(() => {
  const ticker = getCurrentTicker();
  if (!ticker || !realTimeUpdates) return;

  const id = setInterval(() => fetchChartData(true), REAL_TIME_UPDATE_INTERVAL_MS);
  return () => clearInterval(id);
  }, [sharedChart?.ticker, chartInfo?.ticker, selectedStock?.ticker, period, realTimeUpdates]);

  // Add native wheel event listener for better scroll prevention
  useEffect(() => {
    if (!chartContainerRef.current || !enableFutureSpace) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (isDrawingMode) return;

      // Prevent default scrolling
      e.preventDefault();
      e.stopPropagation();

      // Handle future space expansion
      const delta = e.deltaY;
      const scrollSensitivity = 3;
      const deltaFutureDays = delta > 0 ? scrollSensitivity : -scrollSensitivity;

      setFutureDays(prev => {
        const newValue = Math.max(0, Math.min(180, prev + deltaFutureDays));

        // Show indicator
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        setScrollIndicatorVisible(true);
        scrollTimeoutRef.current = setTimeout(() => setScrollIndicatorVisible(false), 1500);

        // Broadcast future space change to other participants
        if (session && newValue !== prev) {
          session.signal({
            type: 'futureSpace:update',
            data: JSON.stringify({
              chart: chartKey,
              futureDays: newValue
            })
          }).catch(console.error);
        }

        return newValue;
      });
    };

    const element = chartContainerRef.current;
    // Use passive: false to ensure preventDefault works
    element.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      element.removeEventListener('wheel', handleNativeWheel);
    };
  }, [enableFutureSpace, isDrawingMode]);

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
            const stage = initializeCanvas();
            if (stage && mounted) {
              konvaStage.current = stage;
              setIsCanvasReady(true);
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
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      cleanupCanvas();
    };
  }, [isDrawingMode, period, chartData]); // All dependencies that should trigger re-init

  // 드로잉 시그널 수신 핸들러 등록
  useEffect(() => {
    if (!session) return;

    // 수신 페이로드 유효성/차트키 체크
    const isForThisChart = (msg: any) =>
      msg?.chart?.ticker === chartKey.ticker && msg?.chart?.period === chartKey.period;

    // add/update 수신 → 도형 반영
    // 드로잉 추가 수신 처리
    const onAdd = (e: any) => {
      const msg = JSON.parse(e.data);
      if (!isForThisChart(msg)) return;
      applyRemoteChange({ type: 'add', shape: msg.shape, version: msg.version });
    };

    // 드로잉 갱신 수신 처리
    const onUpdate = (e: any) => {
      const msg = JSON.parse(e.data);
      if (!isForThisChart(msg)) return;
      applyRemoteChange({ type: 'update', shape: msg.shape, version: msg.version });
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
      const shapes = getAllShapes();
      const response = {
        type: 'sync-response',
        chart: chartKey,
        shapes,
        futureDays, // Include current future days in sync
        version: undefined // 훅에서 관리 중이면 필요 시 버전도 포함 가능
      };
      session.signal({ type: 'drawing:sync-response', data: JSON.stringify(response) }).catch(console.error);
    };

    // 동기화 응답 수신 처리
    const onSyncRes = (e: any) => {
      const msg = JSON.parse(e.data);
      if (msg?.chart?.ticker !== chartKey.ticker || msg?.chart?.period !== chartKey.period) return;
      applySnapshot(msg.shapes, msg.version);
      // Also sync future days if provided in sync response
      if (typeof msg.futureDays === 'number') {
        setFutureDays(msg.futureDays);
      }
    };

    // 리스너 등록
    session.on('signal:drawing:sync-request', onSyncReq);
    session.on('signal:drawing:sync-response', onSyncRes);

    // 정리
    return () => {
      session.off('signal:drawing:sync-request', onSyncReq);
      session.off('signal:drawing:sync-response', onSyncRes);
    };
  }, [session, chartKey.ticker, chartKey.period, getAllShapes, applySnapshot, futureDays]);

  // 드로잉 모드 켰을 때 또는 차트 변경 시 동기화 요청
  useEffect(() => {
    if (!session) return;
    if (isDrawingMode) {
      requestSync();
    }
  }, [session, isDrawingMode, chartKey.ticker, chartKey.period]);

  // Future space sync listener
  useEffect(() => {
    if (!session) return;

    // Listen for future space updates from other participants
    const onFutureSpaceUpdate = (e: any) => {
      const msg = JSON.parse(e.data);
      // Check if update is for current chart
      if (msg?.chart?.ticker !== chartKey.ticker || msg?.chart?.period !== chartKey.period) return;
      
      // Update local future days
      if (typeof msg.futureDays === 'number') {
        setFutureDays(msg.futureDays);
        // Show indicator briefly when receiving update
        setScrollIndicatorVisible(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => setScrollIndicatorVisible(false), 1500);
      }
    };

    // Register listener
    session.on('signal:futureSpace:update', onFutureSpaceUpdate);

    // Cleanup
    return () => {
      session.off('signal:futureSpace:update', onFutureSpaceUpdate);
    };
  }, [session, chartKey.ticker, chartKey.period]);


  const fetchChartData = async (isUpdate = false, override?: { ticker: string; period?: string } ) => {
    if (isLoading) {
      return;
    }

    if (!isUpdate) {
      setIsLoading(true);
    }
    setError(null);

    try {
      // More comprehensive market type detection - same logic as in use-stock-data.ts
      const ticker = override?.ticker ?? getCurrentTicker();
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
      const periodNum = parseInt(override?.period ?? period);

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

        const labels = finalData.map(item => {
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

        const prices = finalData.map(item => item.close);
        const volumes = finalData.map(item => item.volume);
        const opens = finalData.map(item => item.open || item.close);
        const highs = finalData.map(item => item.high || item.close);
        const lows = finalData.map(item => item.low || item.close);


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
          spanGaps: false, // Don't connect NaN values
        };

        // Just use the main dataset without the current time indicator
        const datasets = [mainDataset];

        const newChartData = {
          labels,
          datasets,
          actualDataLength, // Store for reference
        };

        // Create volume chart data
        // Calculate reference volume (using median for better visibility)
        const validVolumes = volumes.filter(v => v && !isNaN(v));
        const sortedVolumes = [...validVolumes].sort((a, b) => a - b);
        const medianVolume = sortedVolumes.length > 0 ? sortedVolumes[Math.floor(sortedVolumes.length / 2)] : 0;

        const newVolumeData = {
          labels,
          datasets: [
            {
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
            },
            // Median volume reference line
            {
              label: 'Reference (Median)',
              data: new Array(labels.length).fill(medianVolume),
              type: 'line' as const,
              borderColor: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              spanGaps: false,
              hidden: false,
              showLine: true,
              legend: { display: false },
            },
          ],
        };


        setChartData(newChartData);
        setVolumeChartData(newVolumeData);

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

      // EMA with configurable period
      if (showEMA12 && prices.length >= indicatorSettings.ema12.period) {
        const emaValues = calculateEMA(prices, indicatorSettings.ema12.period);
        newDatasets.push({
          label: 'EMA',
          data: emaValues,
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [3, 3],
          fill: false,
          pointRadius: 0,
        });
      }

      // EMA(26) - Removed per user request

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

    // Generate labels including future dates for alignment with main chart
    let labels = rawData.map(item => {
      if (typeof item.date === 'string' && item.date.length === 8) {
        return `${item.date.substring(4, 6)}/${item.date.substring(6, 8)}`;
      }
      return item.date;
    });

    // Add future date labels if enabled (same as main chart)
    if (enableFutureSpace && futureDays > 0 && rawData.length > 0) {
      const lastDate = rawData[rawData.length - 1].date;
      const futureDateStrings = generateFutureDates(lastDate, futureDays);
      const futureLabels = futureDateStrings.map(date => {
        if (date && date.length === 8) {
          return `${date.substring(4, 6)}/${date.substring(6, 8)}`;
        }
        return date;
      });
      labels = [...labels, ...futureLabels];
    }

    // RSI Chart with configurable period
    if (showRSI && prices.length >= indicatorSettings.rsi.period) {
      try {
        let rsiValues = calculateRSI(prices, indicatorSettings.rsi.period);

        // Pad with NaN for future dates
        if (enableFutureSpace && futureDays > 0) {
          const futurePadding = new Array(labels.length - rsiValues.length).fill(NaN);
          rsiValues = [...rsiValues, ...futurePadding];
        }

        const newRsiData = {
          labels,
          datasets: [
            {
              label: `RSI(${indicatorSettings.rsi.period})`,
              data: rsiValues,
              borderColor: 'rgb(153, 102, 255)',
              backgroundColor: 'transparent',
              tension: 0.1,
              pointRadius: 0,
              fill: false,
              spanGaps: false, // Don't connect NaN values
            },
            // Horizontal reference lines
            {
              label: 'Reference (70)',
              data: new Array(labels.length).fill(70),
              borderColor: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              spanGaps: false,
              hidden: false,
              showLine: true,
              legend: { display: false },
            },
            {
              label: 'Reference (50)',
              data: new Array(labels.length).fill(50),
              borderColor: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              spanGaps: false,
              hidden: false,
              showLine: true,
              legend: { display: false },
            },
            {
              label: 'Reference (30)',
              data: new Array(labels.length).fill(30),
              borderColor: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              spanGaps: false,
              hidden: false,
              showLine: true,
              legend: { display: false },
            },
          ],
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

        // Pad with NaN for future dates
        let macdLine = macdResult.macdLine;
        let signalLine = macdResult.signalLine;
        let histogram = macdResult.histogram;

        if (enableFutureSpace && futureDays > 0) {
          const futurePadding = new Array(labels.length - macdLine.length).fill(NaN);
          macdLine = [...macdLine, ...futurePadding];
          signalLine = [...signalLine, ...futurePadding];
          histogram = [...histogram, ...futurePadding];
        }

        const newMacdData = {
          labels,
          datasets: [
            {
              label: 'MACD',
              data: macdLine,
              type: 'line' as const,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'transparent',
              tension: 0.1,
              pointRadius: 0,
              fill: false,
              borderWidth: 2,
              yAxisID: 'y',
              spanGaps: false,
            },
            {
              label: 'Signal',
              data: signalLine,
              type: 'line' as const,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'transparent',
              tension: 0.1,
              pointRadius: 0,
              fill: false,
              borderWidth: 2,
              yAxisID: 'y',
              spanGaps: false,
            },
            {
              label: 'Histogram',
              data: histogram,
              type: 'bar' as const,
              backgroundColor: histogram.map((val: number | null) =>
                val && val > 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
              ),
              borderColor: histogram.map((val: number | null) =>
                val && val > 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
              ),
              borderWidth: 1,
              yAxisID: 'y',
            },
            // MACD reference lines
            {
              label: 'Reference (+1)',
              data: new Array(labels.length).fill(1),
              type: 'line' as const,
              borderColor: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              yAxisID: 'y',
              spanGaps: false,
              hidden: false,
              showLine: true,
              legend: { display: false },
            },
            {
              label: 'Reference (0)',
              data: new Array(labels.length).fill(0),
              type: 'line' as const,
              borderColor: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              yAxisID: 'y',
              spanGaps: false,
              hidden: false,
              showLine: true,
              legend: { display: false },
            },
            {
              label: 'Reference (-1)',
              data: new Array(labels.length).fill(-1),
              type: 'line' as const,
              borderColor: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              yAxisID: 'y',
              spanGaps: false,
              hidden: false,
              showLine: true,
              legend: { display: false },
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

        // Pad with NaN for future dates
        let kValues = stochResult.k;
        let dValues = stochResult.d;

        if (enableFutureSpace && futureDays > 0) {
          const futurePadding = new Array(labels.length - kValues.length).fill(NaN);
          kValues = [...kValues, ...futurePadding];
          dValues = [...dValues, ...futurePadding];
        }

        const newStochData = {
          labels,
          datasets: [
            {
              label: '%K',
              data: kValues,
              borderColor: '#8b5cf6',
              backgroundColor: 'transparent',
              tension: 0.1,
              pointRadius: 0,
              fill: false,
              spanGaps: false,
            },
            {
              label: '%D',
              data: dValues,
              borderColor: '#06b6d4',
              backgroundColor: 'transparent',
              tension: 0.1,
              pointRadius: 0,
              fill: false,
              spanGaps: false,
            },
            // Horizontal reference lines
            {
              label: 'Reference (80)',
              data: new Array(labels.length).fill(80),
              borderColor: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              spanGaps: false,
              hidden: false,
              showLine: true,
              legend: { display: false },
            },
            {
              label: 'Reference (50)',
              data: new Array(labels.length).fill(50),
              borderColor: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              spanGaps: false,
              hidden: false,
              showLine: true,
              legend: { display: false },
            },
            {
              label: 'Reference (20)',
              data: new Array(labels.length).fill(20),
              borderColor: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              spanGaps: false,
              hidden: false,
              showLine: true,
              legend: { display: false },
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
    setIsDrawingMode(!isDrawingMode);
  };


  // 내가 period 바꿀 때 브로드 캐스트 보내기
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    const ticker = getCurrentTicker();

    if (ticker) {
      const info = { ticker, period: newPeriod };
      // 기존 상위 콜백 유지
      onChartChange?.(info);
      // ✅ 세션 브로드캐스트 추가
      session?.signal({
        type: 'chart:change',
        data: JSON.stringify(info),
      }).catch(console.error);

      // 내가 바꾼 걸 sharedChart에도 반영 (내 화면도 일관성 있게)
      setSharedChart(info);
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

  // Exclusive indicator selection - only one indicator can be active at a time
  const handleExclusiveIndicatorChange = (selectedIndicator: 'volume' | 'rsi' | 'macd' | 'stochastic') => {
    setIndicatorSettings(prev => ({
      ...prev,
      volume: { ...prev.volume, enabled: selectedIndicator === 'volume' },
      rsi: { ...prev.rsi, enabled: selectedIndicator === 'rsi' },
      macd: { ...prev.macd, enabled: selectedIndicator === 'macd' },
      stochastic: { ...prev.stochastic, enabled: selectedIndicator === 'stochastic' }
    }));
    setActiveIndicatorTab(selectedIndicator);
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

  // Check if any indicator is active
  const hasActiveIndicator = showVolume || (showRSI && canShowRSI) || (showMACD && canShowMACD) || (showStochastic && canShowStochastic);

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

  // Synchronized chart options with shared interaction
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 5,
        left: 0,
        top: 0,
        bottom: 0
      }
    },
    animation: {
      duration: 500,
      easing: 'easeInOutQuart' as const,
    },
    onHover: (event: any, activeElements: any, chart: any) => {
      // Sync crosshair across charts with improved positioning
      let index = -1;

      if (activeElements.length > 0) {
        index = activeElements[0].index;
      } else if (event && chart) {
        // Fallback: calculate index from mouse position
        const canvasPosition = Chart.helpers.getRelativePosition(event, chart);
        const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
        index = Math.round(dataX);
        index = Math.max(0, Math.min(index, chart.data.labels.length - 1));
      }

      if (index >= 0) {

        // Sync with volume chart - find main dataset (not reference)
        if (volumeChartRef.current) {
          const volumeElements = [];
          const volumeTooltipElements = [];
          for (let i = 0; i < volumeChartRef.current.data.datasets.length; i++) {
            if (!volumeChartRef.current.data.datasets[i].label.includes('Reference')) {
              volumeElements.push({ datasetIndex: i, index });
              volumeTooltipElements.push({ datasetIndex: i, index });
            }
          }
          volumeChartRef.current.setActiveElements(volumeElements);
          volumeChartRef.current.tooltip.setActiveElements(volumeTooltipElements);
          volumeChartRef.current.update('none');
        }

        // Sync with RSI chart - find main dataset (not reference)
        if (rsiChartRef.current) {
          const rsiElements = [];
          const rsiTooltipElements = [];
          for (let i = 0; i < rsiChartRef.current.data.datasets.length; i++) {
            if (!rsiChartRef.current.data.datasets[i].label.includes('Reference')) {
              rsiElements.push({ datasetIndex: i, index });
              rsiTooltipElements.push({ datasetIndex: i, index });
            }
          }
          rsiChartRef.current.setActiveElements(rsiElements);
          rsiChartRef.current.tooltip.setActiveElements(rsiTooltipElements);
          rsiChartRef.current.update('none');
        }

        // Sync with MACD chart - find main dataset (not reference)
        if (macdChartRef.current) {
          const macdElements = [];
          const macdTooltipElements = [];
          for (let i = 0; i < macdChartRef.current.data.datasets.length; i++) {
            if (!macdChartRef.current.data.datasets[i].label.includes('Reference')) {
              macdElements.push({ datasetIndex: i, index });
              macdTooltipElements.push({ datasetIndex: i, index });
            }
          }
          macdChartRef.current.setActiveElements(macdElements);
          macdChartRef.current.tooltip.setActiveElements(macdTooltipElements);
          macdChartRef.current.update('none');
        }

        // Sync with Stochastic chart - find main dataset (not reference)
        if (stochasticChartRef.current) {
          const stochElements = [];
          const stochTooltipElements = [];
          for (let i = 0; i < stochasticChartRef.current.data.datasets.length; i++) {
            if (!stochasticChartRef.current.data.datasets[i].label.includes('Reference')) {
              stochElements.push({ datasetIndex: i, index });
              stochTooltipElements.push({ datasetIndex: i, index });
            }
          }
          stochasticChartRef.current.setActiveElements(stochElements);
          stochasticChartRef.current.tooltip.setActiveElements(stochTooltipElements);
          stochasticChartRef.current.update('none');
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
          padding: 8,
          font: {
            size: 11,
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
        padding: 10,
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
              return null; // Hide tooltip for future dates
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
      crosshair: {
        line: {
          color: darkMode ? '#4b5563' : '#d1d5db',
          width: 1,
          dashPattern: [5, 5]
        },
        sync: {
          enabled: true,
          group: 1,
          suppressTooltips: false
        },
      }
    },
    scales: {
      x: {
        display: hasActiveIndicator ? false : true, // Hide x-axis when indicator is shown
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
            family: "'Inter', 'system-ui', sans-serif",
          },
          autoSkip: true,
          autoSkipPadding: 5,
          padding: 6,
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
            size: 10,
            family: "'Inter', 'system-ui', sans-serif",
          },
          padding: 8,
          crossAlign: 'far',
        },
        afterFit: (scaleInstance: any) => {
          scaleInstance.width = 70; // Fixed width for y-axis labels
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
      mode: 'index' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  // TradingView-style indicator chart options
  const indicatorChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 5,
        left: 0,
        top: 0,
        bottom: 0
      }
    },
    animation: {
      duration: 0,
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    onHover: (event: any, activeElements: any, chart: any) => {
      // Sync with all charts when hovering over indicator charts with improved positioning
      let index = -1;

      if (activeElements.length > 0) {
        index = activeElements[0].index;
      } else if (event && chart) {
        // Fallback: calculate index from mouse position
        const canvasPosition = Chart.helpers.getRelativePosition(event, chart);
        const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
        index = Math.round(dataX);
        index = Math.max(0, Math.min(index, chart.data.labels.length - 1));
      }

      if (index >= 0) {

        // Sync with main chart
        if (chartRef.current) {
          chartRef.current.setActiveElements([{ datasetIndex: 0, index }]);
          chartRef.current.tooltip.setActiveElements([{ datasetIndex: 0, index }]);
          chartRef.current.update('none');
        }

        // Sync with volume chart - find main dataset (not reference)
        if (volumeChartRef.current) {
          const volumeElements = [];
          const volumeTooltipElements = [];
          for (let i = 0; i < volumeChartRef.current.data.datasets.length; i++) {
            if (!volumeChartRef.current.data.datasets[i].label.includes('Reference')) {
              volumeElements.push({ datasetIndex: i, index });
              volumeTooltipElements.push({ datasetIndex: i, index });
            }
          }
          volumeChartRef.current.setActiveElements(volumeElements);
          volumeChartRef.current.tooltip.setActiveElements(volumeTooltipElements);
          volumeChartRef.current.update('none');
        }

        // Sync with RSI chart - find main dataset (not reference)
        if (rsiChartRef.current) {
          const rsiElements = [];
          const rsiTooltipElements = [];
          for (let i = 0; i < rsiChartRef.current.data.datasets.length; i++) {
            if (!rsiChartRef.current.data.datasets[i].label.includes('Reference')) {
              rsiElements.push({ datasetIndex: i, index });
              rsiTooltipElements.push({ datasetIndex: i, index });
            }
          }
          rsiChartRef.current.setActiveElements(rsiElements);
          rsiChartRef.current.tooltip.setActiveElements(rsiTooltipElements);
          rsiChartRef.current.update('none');
        }

        // Sync with MACD chart - find main dataset (not reference)
        if (macdChartRef.current) {
          const macdElements = [];
          const macdTooltipElements = [];
          for (let i = 0; i < macdChartRef.current.data.datasets.length; i++) {
            if (!macdChartRef.current.data.datasets[i].label.includes('Reference')) {
              macdElements.push({ datasetIndex: i, index });
              macdTooltipElements.push({ datasetIndex: i, index });
            }
          }
          macdChartRef.current.setActiveElements(macdElements);
          macdChartRef.current.tooltip.setActiveElements(macdTooltipElements);
          macdChartRef.current.update('none');
        }

        // Sync with Stochastic chart - find main dataset (not reference)
        if (stochasticChartRef.current) {
          const stochElements = [];
          const stochTooltipElements = [];
          for (let i = 0; i < stochasticChartRef.current.data.datasets.length; i++) {
            if (!stochasticChartRef.current.data.datasets[i].label.includes('Reference')) {
              stochElements.push({ datasetIndex: i, index });
              stochTooltipElements.push({ datasetIndex: i, index });
            }
          }
          stochasticChartRef.current.setActiveElements(stochElements);
          stochasticChartRef.current.tooltip.setActiveElements(stochTooltipElements);
          stochasticChartRef.current.update('none');
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#f3f4f6' : '#111827',
        bodyColor: darkMode ? '#d1d5db' : '#4b5563',
        borderColor: darkMode ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context: any) {
            if (context[0]) {
              return context[0].label || '';
            }
            return '';
          },
          label: function(context: any) {
            const value = context.parsed.y;
            const datasetLabel = context.dataset.label || '';

            // Skip reference lines
            if (datasetLabel.includes('Reference')) {
              return null;
            }

            // Format based on indicator type
            if (datasetLabel.includes('Volume') || datasetLabel.includes('거래량')) {
              if (value >= 100000000) {
                return `${datasetLabel}: ${(value / 100000000).toFixed(1)}억`;
              } else if (value >= 10000000) {
                return `${datasetLabel}: ${(value / 10000000).toFixed(1)}천만`;
              } else if (value >= 10000) {
                return `${datasetLabel}: ${(value / 10000).toFixed(1)}만`;
              } else {
                return `${datasetLabel}: ${value.toLocaleString()}`;
              }
            } else if (datasetLabel.includes('RSI') || datasetLabel.includes('Stochastic')) {
              return `${datasetLabel}: ${value.toFixed(2)}`;
            } else if (datasetLabel.includes('MACD')) {
              return `${datasetLabel}: ${value.toFixed(4)}`;
            } else {
              return `${datasetLabel}: ${value.toFixed(2)}`;
            }
          },
          filter: function(tooltipItem: any) {
            // Hide reference lines from tooltips
            return !tooltipItem.dataset.label.includes('Reference');
          }
        }
      },
      crosshair: {
        line: {
          color: darkMode ? '#4b5563' : '#d1d5db',
          width: 1,
          dashPattern: [5, 5]
        },
        sync: {
          enabled: true,
          group: 1,
          suppressTooltips: true
        },
      }
    },
    scales: {
      x: {
        display: true, // Show x-axis on indicator chart (TradingView style)
        ticks: {
          maxTicksLimit: tickSettings.maxTicksLimit,
          maxRotation: tickSettings.maxRotation,
          minRotation: 0,
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
            family: "'Inter', 'system-ui', sans-serif",
          },
          autoSkip: true,
          autoSkipPadding: 5,
          padding: 6,
        },
        grid: {
          display: false, // Hide grid lines on indicator chart
        },
        border: {
          display: false,
        },
      },
      y: {
        position: 'right' as const,
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
            family: "'Inter', 'system-ui', sans-serif",
          },
          maxTicksLimit: 3,
          padding: 8,
          crossAlign: 'far' as const,
          length: 0, // Remove tick marks
        },
        afterFit: (scaleInstance: any) => {
          scaleInstance.width = 70; // Fixed width matching main chart
        },
        grid: {
          display: false, // Hide grid lines on indicator chart
          drawBorder: false,
        },
        border: {
          display: false, // Hide Y-axis border line
        },
      },
    },
  };

  const volumeChartOptions = {
    ...indicatorChartOptions,
    scales: {
      ...indicatorChartOptions.scales,
      y: {
        ...indicatorChartOptions.scales.y,
        ticks: {
          ...indicatorChartOptions.scales.y.ticks,
          callback: function(value: any) {
            return formatVolume(value);
          },
        },
        min: 0,
      },
    },
  };

  const rsiChartOptions = {
    ...indicatorChartOptions,
    scales: {
      ...indicatorChartOptions.scales,
      y: {
        ...indicatorChartOptions.scales.y,
        min: 0,
        max: 100,
      },
    },
  };

  const macdChartOptions = {
    ...indicatorChartOptions,
    plugins: {
      ...indicatorChartOptions.plugins,
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
          padding: 4,
          font: {
            size: 9,
          },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 4,
          boxHeight: 4,
        },
      },
    },
  };

  const stochasticChartOptions = {
    ...indicatorChartOptions,
    scales: {
      ...indicatorChartOptions.scales,
      y: {
        ...indicatorChartOptions.scales.y,
        min: 0,
        max: 100,
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
    }
    return volume.toLocaleString();
  };

  const ticker = getCurrentTicker();
  if (!ticker) {
    return (
      <div className={`h-full ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
        <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-base py-16`}>
          주식을 선택하거나 공유된 차트를 기다려 주세요.
        </div>
      </div>
    );
  }

  return (
    <>
    <div className={`h-full w-full flex ${darkMode ? 'bg-gray-950' : 'bg-gray-50'} relative`}>
      {/* Enhanced Glassmorphism Left Sidebar */}
      <div
        className={`w-52 flex-shrink-0 ${
          darkMode 
            ? 'bg-gradient-to-b from-gray-900/90 via-gray-850/90 to-gray-800/90 backdrop-blur-2xl border-r border-gray-700/40' 
            : 'bg-gradient-to-b from-white/90 via-gray-50/90 to-white/90 backdrop-blur-2xl border-r border-gray-200/40'
        } flex flex-col h-full relative z-20 overflow-hidden`}
      >
        {/* Subtle pattern overlay for depth */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${darkMode ? 'white' : 'black'} 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Sidebar Content with padding */}
        <div className="flex-1 overflow-y-auto relative">
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
        {/* Glassmorphism Header with Improved Layout */}
        <div className={`relative ${
          darkMode
            ? 'bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-b border-gray-700/50'
            : 'bg-gradient-to-r from-white/95 to-gray-50/95 backdrop-blur-xl border-b border-gray-200/50'
        } shadow-lg`}>
          <div className="px-6 py-3">
            {/* First Row: Stock Info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedStock?.name || ticker}
                  </h2>
                  <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium ${
                    darkMode
                      ? 'bg-gray-700/50 text-gray-300 backdrop-blur-sm'
                      : 'bg-gray-100/80 text-gray-700 backdrop-blur-sm'
                  }`}>
                    {ticker}
                  </span>
                  {rawData && rawData.length > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      darkMode
                        ? 'bg-blue-500/20 text-blue-300 backdrop-blur-sm'
                        : 'bg-blue-100/80 text-blue-700 backdrop-blur-sm'
                    }`}>
                      {rawData.length} 데이터
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Second Row: Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Period Controls with Glassmorphism */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                  darkMode
                    ? 'bg-gray-800/40 backdrop-blur-md border border-gray-700/30'
                    : 'bg-white/60 backdrop-blur-md border border-gray-200/30'
                } shadow-sm`}>
                  <ChartControls
                    period={period}
                    chartType={chartType}
                    onPeriodChange={handlePeriodChange}
                    onChartTypeChange={handleChartTypeChange}
                    darkMode={darkMode}
                  />
                </div>

                {/* Indicator Pills with Glassmorphism */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                  darkMode
                    ? 'bg-gray-800/40 backdrop-blur-md border border-gray-700/30'
                    : 'bg-white/60 backdrop-blur-md border border-gray-200/30'
                } shadow-sm`}>
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      지표:
                    </span>

                    {/* Indicator Pills with Improved Design */}
                    <div className="relative flex items-center gap-1">
                      <button
                        onClick={() => handleExclusiveIndicatorChange('volume')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all transform hover:scale-105 ${
                          showVolume
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400/30'
                            : darkMode
                              ? 'bg-gray-800/50 backdrop-blur-sm text-gray-300 hover:bg-gray-700/70 hover:text-white border border-gray-700/30'
                              : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/80 hover:text-gray-900 shadow-sm border border-gray-200/30'
                        }`}
                      >
                        거래량
                      </button>
                      <button
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const tooltipWidth = 320;
                          const tooltipHeight = 120;

                          // Calculate position with boundary detection
                          let x = rect.right + 8;
                          let y = rect.top - 8;

                          // Adjust if tooltip would go off screen
                          if (x + tooltipWidth > window.innerWidth) {
                            x = rect.left - tooltipWidth - 8;
                          }

                          if (y + tooltipHeight > window.innerHeight) {
                            y = window.innerHeight - tooltipHeight - 8;
                          } else if (y < 0) {
                            y = 8;
                          }

                          setTooltipPosition({ x, y });
                          setHoveredIndicatorHelp('volume');
                        }}
                        onMouseLeave={() => setHoveredIndicatorHelp(null)}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs transition-colors ${
                          darkMode
                            ? 'border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-400'
                            : 'border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                        }`}
                      >
                        ?
                      </button>
                    </div>

                    <div className="relative flex items-center gap-1">
                      <button
                        onClick={() => canShowRSI && handleExclusiveIndicatorChange('rsi')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all transform ${
                          canShowRSI ? 'hover:scale-105' : ''
                        } ${
                          showRSI && canShowRSI
                            ? darkMode
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                              : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : darkMode
                              ? canShowRSI
                                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                                : 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                              : canShowRSI
                                ? 'bg-white/70 text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm'
                                : 'bg-gray-100/50 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!canShowRSI}
                      >
                        RSI
                      </button>
                      <button
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const tooltipWidth = 320;
                          const tooltipHeight = 120;

                          // Calculate position with boundary detection
                          let x = rect.right + 8;
                          let y = rect.top - 8;

                          // Adjust if tooltip would go off screen
                          if (x + tooltipWidth > window.innerWidth) {
                            x = rect.left - tooltipWidth - 8;
                          }

                          if (y + tooltipHeight > window.innerHeight) {
                            y = window.innerHeight - tooltipHeight - 8;
                          } else if (y < 0) {
                            y = 8;
                          }

                          setTooltipPosition({ x, y });
                          setHoveredIndicatorHelp('rsi');
                        }}
                        onMouseLeave={() => setHoveredIndicatorHelp(null)}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs transition-colors ${
                          darkMode
                            ? 'border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-400'
                            : 'border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                        }`}
                      >
                        ?
                      </button>
                    </div>

                    <div className="relative flex items-center gap-1">
                      <button
                        onClick={() => canShowMACD && handleExclusiveIndicatorChange('macd')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all transform ${
                          canShowMACD ? 'hover:scale-105' : ''
                        } ${
                          showMACD && canShowMACD
                            ? darkMode
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                              : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : darkMode
                              ? canShowMACD
                                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                                : 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                              : canShowMACD
                                ? 'bg-white/70 text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm'
                                : 'bg-gray-100/50 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!canShowMACD}
                      >
                        MACD
                      </button>
                      <button
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const tooltipWidth = 320;
                          const tooltipHeight = 120;

                          // Calculate position with boundary detection
                          let x = rect.right + 8;
                          let y = rect.top - 8;

                          // Adjust if tooltip would go off screen
                          if (x + tooltipWidth > window.innerWidth) {
                            x = rect.left - tooltipWidth - 8;
                          }

                          if (y + tooltipHeight > window.innerHeight) {
                            y = window.innerHeight - tooltipHeight - 8;
                          } else if (y < 0) {
                            y = 8;
                          }

                          setTooltipPosition({ x, y });
                          setHoveredIndicatorHelp('macd');
                        }}
                        onMouseLeave={() => setHoveredIndicatorHelp(null)}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs transition-colors ${
                          darkMode
                            ? 'border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-400'
                            : 'border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                        }`}
                      >
                        ?
                      </button>
                    </div>

                    <div className="relative flex items-center gap-1">
                      <button
                        onClick={() => canShowStochastic && handleExclusiveIndicatorChange('stochastic')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all transform ${
                          canShowStochastic ? 'hover:scale-105' : ''
                        } ${
                          showStochastic && canShowStochastic
                            ? darkMode
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                              : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : darkMode
                              ? canShowStochastic
                                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                                : 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                              : canShowStochastic
                                ? 'bg-white/70 text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm'
                                : 'bg-gray-100/50 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!canShowStochastic}
                      >
                        스토캐스틱
                      </button>
                      <button
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const tooltipWidth = 320;
                          const tooltipHeight = 120;

                          // Calculate position with boundary detection
                          let x = rect.right + 8;
                          let y = rect.top - 8;

                          // Adjust if tooltip would go off screen
                          if (x + tooltipWidth > window.innerWidth) {
                            x = rect.left - tooltipWidth - 8;
                          }

                          if (y + tooltipHeight > window.innerHeight) {
                            y = window.innerHeight - tooltipHeight - 8;
                          } else if (y < 0) {
                            y = 8;
                          }

                          setTooltipPosition({ x, y });
                          setHoveredIndicatorHelp('stochastic');
                        }}
                        onMouseLeave={() => setHoveredIndicatorHelp(null)}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs transition-colors ${
                          darkMode
                            ? 'border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-400'
                            : 'border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                        }`}
                      >
                        ?
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drawing Mode Button - Aligned with other controls */}
                <div className={`flex items-center px-3 py-1.5 rounded-xl ${
                  darkMode
                    ? 'bg-gray-800/40 backdrop-blur-md border border-gray-700/30'
                    : 'bg-white/60 backdrop-blur-md border border-gray-200/30'
                } shadow-sm`}>
                  <button
                    onClick={toggleDrawingMode}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all transform hover:scale-105 ${
                      isDrawingMode
                        ? darkMode
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                        : darkMode
                          ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {isDrawingMode ? '✏️ 그리기 중' : '✏️ 그리기'}
                  </button>
                </div>
              </div>
            </div>

            {isDrawingMode && (
              <div className={`mt-3 px-3 pb-2`}>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
                  darkMode
                    ? 'bg-gray-800/40 backdrop-blur-md border border-gray-700/30'
                    : 'bg-white/60 backdrop-blur-md border border-gray-200/30'
                } shadow-sm`}>
                  <DrawingToolbar
                    onToolChange={setDrawingTool}
                    onColorChange={setStrokeColor}
                    onWidthChange={setStrokeWidth}
                    onClear={clearCanvas}
                    onDelete={undoLastShape}
                    darkMode={darkMode}
                  />
                </div>
              </div>
            )}
          </div>

        {/* FULLY INTEGRATED Chart Container - Seamless design */}
        <div className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-xl border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex flex-col overflow-hidden`}>

            {/* Main Price Chart Section - Dynamic height based on indicator */}
            <div className="flex-1 relative" style={{ minHeight: '300px' }}>
              <div
                className="h-full relative"
                style={{
                  padding: '20px 20px 10px 20px',
                  cursor: isDrawingMode ? 'default' : 'default'
                }}
                ref={chartContainerRef}>
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10 rounded-xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500"></div>
                    <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">차트 데이터를 불러오는 중...</p>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-6">
                    <div className={`max-w-md mx-auto text-center ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
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
                    <Line data={chartData} options={chartOptions} ref={chartRef} />

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

                    {/* Relocated Future Space Indicator - Top left corner, more subtle */}
                    {enableFutureSpace && futureDays > 0 && (
                      <div
                        className={`absolute top-4 left-4 flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-sm transition-all duration-500 ${
                          darkMode 
                            ? 'bg-white/10 border border-white/20' 
                            : 'bg-black/10'
                        }`}
                        style={{ opacity: scrollIndicatorVisible ? 0.7 : 0.4 }}
                      >
                        <span className={`text-[10px] font-medium ${
                          darkMode ? 'text-white/70' : 'text-black/60'
                        }`}>
                          미래 {futureDays}일
                        </span>
                      </div>
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

            {/* TradingView-style Indicator Section - Above date axis */}
            {hasActiveIndicator && (
              <div className="relative">
                {/* Subtle Divider */}
                <div className={`h-px ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} opacity-50`} />

                {/* Resize Handle */}
                <div
                  onMouseDown={handleResizeStart}
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 flex items-center justify-center cursor-ns-resize group z-10`}
                >
                  <div className={`w-8 h-1 rounded-full ${darkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-300 group-hover:bg-gray-400'} transition-colors opacity-60`} />
                </div>

                {/* Seamless Indicator Area - At the very bottom */}
                <div
                  className={`${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-950' : 'bg-gradient-to-b from-white to-gray-50'}`}
                  style={{ height: `${indicatorHeight}px`, transition: 'height 0.2s' }}
                >
                  <div className="h-full" style={{ padding: '20px 20px 10px 20px' }}>
                    {activeIndicatorTab === 'volume' && showVolume && volumeChartData ? (
                      <Bar data={volumeChartData} options={volumeChartOptions} ref={volumeChartRef} />
                    ) : activeIndicatorTab === 'rsi' && showRSI && rsiChartData && canShowRSI ? (
                      <Line data={rsiChartData} options={rsiChartOptions} ref={rsiChartRef} />
                    ) : activeIndicatorTab === 'macd' && showMACD && macdChartData && canShowMACD ? (
                      <Line data={macdChartData} options={macdChartOptions} ref={macdChartRef} />
                    ) : activeIndicatorTab === 'stochastic' && showStochastic && stochChartData && canShowStochastic ? (
                      <Line data={stochChartData} options={stochasticChartOptions} ref={stochasticChartRef} />
                    ) : (
                      <div className={`flex items-center justify-center h-full ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <p className="text-xs">선택된 지표가 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    
    {/* Indicator Help Tooltip - Moved outside main container */}
    {hoveredIndicatorHelp && createPortal(
      <div
        className={`fixed p-3 rounded-lg shadow-xl border w-80 z-[2147483647] ${
          darkMode
            ? 'bg-gray-800 border-gray-600 text-gray-200'
            : 'bg-white border-gray-300 text-gray-700'
        }`}
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
          pointerEvents: 'none'
        }}
      >
        <div className="text-sm font-medium mb-2 text-blue-500">
          {indicatorTabExplanations[hoveredIndicatorHelp as keyof typeof indicatorTabExplanations].title}
        </div>
        <div className="text-xs mb-2">
          {indicatorTabExplanations[hoveredIndicatorHelp as keyof typeof indicatorTabExplanations].description}
        </div>
        <div className="text-xs opacity-75">
          <strong>사용법:</strong> {indicatorTabExplanations[hoveredIndicatorHelp as keyof typeof indicatorTabExplanations].usage}
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default StockChart;
