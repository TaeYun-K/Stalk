/**
 * Chart type definitions following Google Code Style
 */

export interface StockData {
  ticker: string;
  name: string;
}

export interface ChartDataPoint {
  date: string;
  close: number;
  volume: number;
  open?: number;
  high?: number;
  low?: number;
  change?: number;
  changeRate?: number;
}

export type ChartType = 'line';

export interface StockChartProps {
  selectedStock?: StockData | null;
  darkMode?: boolean;
  realTimeUpdates?: boolean;
  chartType?: ChartType;
  period?: number;
  drawingMode?: boolean;
}

export interface IndicatorStates {
  ma20: boolean;
  ma50: boolean;
  ma200: boolean;
  ema12: boolean;
  ema26: boolean;
  rsi: boolean;
  macd: boolean;
  bollinger: boolean;
  stochastic: boolean;
  vwap: boolean;
  ichimoku: boolean;
  volume: boolean;
}

export interface ChartDataState {
  labels: string[];
  prices: number[];
  volumes: number[];
  opens: number[];
  highs: number[];
  lows: number[];
  changes: number[];
  changeRates: number[];
}

export interface ApiResponse {
  success?: boolean;
  data?: any;
  message?: string;
  error?: string;
}