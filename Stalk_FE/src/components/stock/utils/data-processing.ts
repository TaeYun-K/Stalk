/**
 * Data processing utilities for chart data
 */

import { ChartDataPoint } from './chart-types';

export const processChartData = (data: any[]): ChartDataPoint[] => {
  return data.map(item => ({
    date: item.tradeDate || item.TRD_DD || item.date || new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    open: parseFloat((item.openPrice || item.TDD_OPNPRC || item.closePrice || '0').toString().replace(/,/g, '')),
    high: parseFloat((item.highPrice || item.TDD_HGPRC || item.closePrice || '0').toString().replace(/,/g, '')),
    low: parseFloat((item.lowPrice || item.TDD_LWPRC || item.closePrice || '0').toString().replace(/,/g, '')),
    close: parseFloat((item.closePrice || item.TDD_CLSPRC || '0').toString().replace(/,/g, '')),
    volume: parseInt((item.volume || item.ACC_TRDVOL || '0').toString().replace(/,/g, '')),
    change: parseFloat((item.priceChange || item.CMPPREVDD_PRC || '0').toString().replace(/,/g, '')),
    changeRate: parseFloat((item.changeRate || item.FLUC_RT || '0').toString().replace(/,/g, ''))
  }));
};

export const processSingleDataPoint = (stockInfo: any): ChartDataPoint => {
  const closePrice = stockInfo.closePrice || stockInfo.TDD_CLSPRC || stockInfo.ISU_CLSPRC || '0';
  const volumeStr = stockInfo.volume || stockInfo.ACC_TRDVOL || '0';
  const openPrice = stockInfo.openPrice || stockInfo.TDD_OPNPRC || closePrice;
  const highPrice = stockInfo.highPrice || stockInfo.TDD_HGPRC || closePrice;
  const lowPrice = stockInfo.lowPrice || stockInfo.TDD_LWPRC || closePrice;
  const priceChange = stockInfo.priceChange || stockInfo.CMPPREVDD_PRC || '0';
  const changeRate = stockInfo.changeRate || stockInfo.FLUC_RT || '0';
  
  return {
    date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    open: parseFloat(openPrice.toString().replace(/,/g, '')),
    high: parseFloat(highPrice.toString().replace(/,/g, '')),
    low: parseFloat(lowPrice.toString().replace(/,/g, '')),
    close: parseFloat(closePrice.toString().replace(/,/g, '')),
    volume: parseInt(volumeStr.toString().replace(/,/g, '')),
    change: parseFloat(priceChange.toString().replace(/,/g, '')),
    changeRate: parseFloat(changeRate.toString().replace(/,/g, ''))
  };
};

export const formatDateLabel = (date: string): string => {
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
};

export const filterValidData = (data: ChartDataPoint[]): ChartDataPoint[] => {
  return data.filter(item => 
    item.close > 0 && 
    item.date && 
    !isNaN(item.close)
  );
};

export const sortByDate = (data: ChartDataPoint[]): ChartDataPoint[] => {
  return [...data].sort((a, b) => a.date.localeCompare(b.date));
};

export const getVolumeColors = (prices: number[], index: number): { bg: string; border: string } => {
  if (index === 0) {
    return {
      bg: 'rgba(34, 197, 94, 0.6)',
      border: 'rgba(34, 197, 94, 1)'
    };
  }
  
  const isUp = prices[index] >= prices[index - 1];
  return {
    bg: isUp ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)',
    border: isUp ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
  };
};

export const createMainDataset = (
  prices: number[], 
  chartType: string
): any => {
  if (chartType === 'candlestick' || chartType === 'heikinashi') {
    return {
      label: '주가',
      data: prices,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      tension: 0.1,
      fill: true,
      pointRadius: 2,
      pointHoverRadius: 5,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      spanGaps: true,
    };
  } else if (chartType === 'bar') {
    return {
      label: '종가',
      data: prices,
      type: 'bar',
      backgroundColor: prices.map((price, i) => 
        i === 0 || price >= prices[i - 1] ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'
      ),
      borderColor: prices.map((price, i) => 
        i === 0 || price >= prices[i - 1] ? '#10b981' : '#ef4444'
      ),
      borderWidth: 1,
    };
  } else {
    // Line or Area chart
    return {
      label: '종가',
      data: prices,
      borderColor: '#3b82f6',
      backgroundColor: chartType === 'area' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      borderWidth: 2,
      tension: 0.1,
      fill: chartType === 'area',
      pointRadius: 0,
      pointHoverRadius: 4,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      spanGaps: true,
    };
  }
};