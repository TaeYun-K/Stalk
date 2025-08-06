// 기술적 지표 계산 유틸리티

export interface PriceData {
  date: string;
  close: number;
  high?: number;
  low?: number;
  volume?: number;
}

// 단순 이동평균 (Simple Moving Average)
export const calculateMA = (data: number[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  
  return result;
};

// 지수 이동평균 (Exponential Moving Average)
export const calculateEMA = (data: number[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  
  // 첫 번째 EMA는 SMA로 계산
  let ema = 0;
  for (let i = 0; i < period; i++) {
    if (i < period - 1) {
      result.push(null);
      ema += data[i];
    } else {
      ema = (ema + data[i]) / period;
      result.push(ema);
    }
  }
  
  // 나머지 EMA 계산
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  
  return result;
};

// RSI (Relative Strength Index) 계산
export const calculateRSI = (data: number[], period: number = 14): (number | null)[] => {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // 가격 변화 계산
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  result.push(null); // 첫 번째 값은 null
  
  if (gains.length < period) {
    return Array(data.length).fill(null);
  }
  
  // 첫 번째 평균 계산
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result.push(rsi);
  }
  
  // 부족한 부분 null로 채우기
  while (result.length < data.length) {
    result.unshift(null);
  }
  
  return result;
};

// MACD (Moving Average Convergence Divergence) 계산
export const calculateMACD = (data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);
  
  const macdLine: (number | null)[] = [];
  const validMacdValues: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (emaFast[i] !== null && emaSlow[i] !== null) {
      const macdValue = emaFast[i]! - emaSlow[i]!;
      macdLine.push(macdValue);
      validMacdValues.push(macdValue);
    } else {
      macdLine.push(null);
    }
  }
  
  const signalLine = calculateEMA(validMacdValues, signalPeriod);
  const histogram: (number | null)[] = [];
  
  let signalIndex = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null && signalIndex < signalLine.length && signalLine[signalIndex] !== null) {
      histogram.push(macdLine[i]! - signalLine[signalIndex]!);
      signalIndex++;
    } else {
      histogram.push(null);
    }
  }
  
  return {
    macdLine,
    signalLine: alignSignalLine(macdLine, signalLine),
    histogram
  };
};

// 시그널 라인 정렬
const alignSignalLine = (macdLine: (number | null)[], signalLine: (number | null)[]): (number | null)[] => {
  const result: (number | null)[] = [];
  let signalIndex = 0;
  
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null && signalIndex < signalLine.length) {
      result.push(signalLine[signalIndex]);
      signalIndex++;
    } else {
      result.push(null);
    }
  }
  
  return result;
};

// 볼린저 밴드 계산
export const calculateBollingerBands = (data: number[], period: number = 20, stdDev: number = 2) => {
  const ma = calculateMA(data, period);
  const upperBand: (number | null)[] = [];
  const lowerBand: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (ma[i] === null) {
      upperBand.push(null);
      lowerBand.push(null);
    } else {
      const slice = data.slice(Math.max(0, i - period + 1), i + 1);
      const mean = ma[i]!;
      const squaredDiffs = slice.map(value => Math.pow(value - mean, 2));
      const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / slice.length;
      const standardDeviation = Math.sqrt(avgSquaredDiff);
      
      upperBand.push(mean + standardDeviation * stdDev);
      lowerBand.push(mean - standardDeviation * stdDev);
    }
  }
  
  return {
    middleBand: ma,
    upperBand,
    lowerBand
  };
};

// 가격 포맷팅
export const formatPrice = (price: number): string => {
  return price.toLocaleString('ko-KR');
};

// 변화율 계산
export const calculateChangeRate = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// 거래량 포맷팅
export const formatVolume = (volume: number): string => {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(1)}B`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
};