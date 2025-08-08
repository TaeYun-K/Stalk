/**
 * Main stock chart component - refactored version
 * This component orchestrates all chart-related functionality
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// Local imports
import ChartControls from '../chart-controls/chart-controls';
import DrawingToolbar from '../chart-controls/drawing-toolbar';
import TechnicalIndicators from '../chart-controls/technical-indicators';
import PriceChart from './price-chart';
import CandlestickChart from './candlestick-chart';
import VolumeChart from './volume-chart';
import RsiChart from './rsi-chart';
import MacdChart from './macd-chart';

// Hooks
import { useDrawingCanvas } from '../hooks/use-drawing-canvas';
import { useChartData } from '../hooks/use-chart-data';
import { useIndicators } from '../hooks/use-indicators';

// Utils
import { 
  calculateMA, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands,
} from '../utils/calculations';
import { 
  formatDateLabel, 
  createMainDataset,
  getVolumeColors 
} from '../utils/data-processing';

// Types
import { StockChartProps, ChartType } from '../utils/chart-types';

// Register Chart.js components
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

const StockChartRefactored: React.FC<StockChartProps> = ({
  selectedStock,
  darkMode = false,
  realTimeUpdates = false,
  chartType: propChartType = 'candlestick',
  period: propPeriod = 7,
  drawingMode: propDrawingMode = false
}) => {
  // State management
  const [chartType, setChartType] = useState<ChartType>(propChartType);
  const [period, setPeriod] = useState<string>(propPeriod.toString());
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(propDrawingMode);
  
  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const volumeChartRef = useRef<any>(null);
  const rsiChartRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  
  // Custom hooks
  const { data, isLoading, error, refetch } = useChartData({
    selectedStock: selectedStock || null,
    period: parseInt(period),
    realTimeUpdates
  });
  
  const { indicators, setIndicatorValue } = useIndicators();
  
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

  // Sync props with state
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

  // Process chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const labels = data.map(item => formatDateLabel(item.date));
    const prices = data.map(item => item.close);
    const volumes = data.map(item => item.volume);
    
    const mainDataset = createMainDataset(prices, chartType);
    const datasets = [mainDataset];
    
    // Add indicator datasets
    if (indicators.ma20) {
      const ma20Values = calculateMA(prices, 20);
      datasets.push({
        label: 'MA(20)',
        data: ma20Values,
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
      });
    }
    
    if (indicators.ma50) {
      const ma50Values = calculateMA(prices, 50);
      datasets.push({
        label: 'MA(50)',
        data: ma50Values,
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
      });
    }
    
    if (indicators.ema12) {
      const ema12Values = calculateEMA(prices, 12);
      datasets.push({
        label: 'EMA(12)',
        data: ema12Values,
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [3, 3],
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
      });
    }
    
    if (indicators.bollinger) {
      const bands = calculateBollingerBands(prices, 20);
      datasets.push(
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
        },
        {
          label: '볼린저 중간',
          data: bands.middleBand,
          borderColor: 'rgba(255, 159, 64, 0.4)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
        {
          label: '볼린저 하단',
          data: bands.lowerBand,
          borderColor: 'rgba(255, 159, 64, 0.6)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [5, 5],
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
        }
      );
    }
    
    return {
      labels,
      datasets
    };
  }, [data, chartType, indicators]);

  // Volume chart data
  const volumeChartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const labels = data.map(item => formatDateLabel(item.date));
    const volumes = data.map(item => item.volume);
    const prices = data.map(item => item.close);
    
    return {
      labels,
      datasets: [{
        label: '거래량',
        data: volumes,
        backgroundColor: volumes.map((_, index) => getVolumeColors(prices, index).bg),
        borderColor: volumes.map((_, index) => getVolumeColors(prices, index).border),
        borderWidth: 1,
      }],
    };
  }, [data]);

  // RSI chart data
  const rsiChartData = useMemo(() => {
    if (!indicators.rsi || !data || data.length === 0) return null;
    
    const labels = data.map(item => formatDateLabel(item.date));
    const prices = data.map(item => item.close);
    const rsiValues = calculateRSI(prices, 14);
    
    return {
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
  }, [data, indicators.rsi]);

  // MACD chart data
  const macdChartData = useMemo(() => {
    if (!indicators.macd || !data || data.length === 0) return null;
    
    const labels = data.map(item => formatDateLabel(item.date));
    const prices = data.map(item => item.close);
    const macdResult = calculateMACD(prices);
    
    return {
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
  }, [data, indicators.macd]);

  // Initialize drawing canvas
  useEffect(() => {
    if (chartContainerRef.current && chartData) {
      const stage = initializeCanvas();
      if (stage && isDrawingMode) {
        enableDrawing();
      }
    }
  }, [chartData, isDrawingMode]);

  // Toggle drawing mode
  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
    if (!isDrawingMode) {
      enableDrawing();
    } else {
      disableDrawing();
    }
  };

  // Render empty state
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
          onPeriodChange={setPeriod}
          onChartTypeChange={setChartType}
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
        indicators={indicators}
        onIndicatorChange={setIndicatorValue}
        darkMode={darkMode}
      />

      {/* Charts Container */}
      <div className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-white'} p-4 space-y-4 overflow-auto`}>
        {/* Main Price Chart */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 shadow-inner`}>
          <div className="relative" style={{ height: '400px' }} ref={chartContainerRef}>
            {chartType === 'candlestick' && data && data.length > 0 ? (
              <CandlestickChart
                data={data}
                darkMode={darkMode}
                height={400}
                showVolume={false}
              />
            ) : (
              <PriceChart
                data={chartData}
                darkMode={darkMode}
                period={parseInt(period)}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                ref={chartRef}
              />
            )}
            
            {isDrawingMode && (
              <div id="drawing-canvas" className="absolute inset-0 pointer-events-none"></div>
            )}
          </div>
        </div>

        {/* Volume Chart */}
        {indicators.volume && volumeChartData && (
          <VolumeChart data={volumeChartData} darkMode={darkMode} ref={volumeChartRef} />
        )}

        {/* RSI Chart */}
        {indicators.rsi && rsiChartData && (
          <RsiChart data={rsiChartData} darkMode={darkMode} ref={rsiChartRef} />
        )}

        {/* MACD Chart */}
        {indicators.macd && macdChartData && (
          <MacdChart data={macdChartData} darkMode={darkMode} ref={macdChartRef} />
        )}
      </div>
    </div>
  );
};

export default StockChartRefactored;