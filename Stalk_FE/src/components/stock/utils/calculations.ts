// 기술적 지표 계산 유틸리티

export interface PriceData {
  date: string;
  close: number;
  high?: number;
  low?: number;
  open?: number;
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

// 거래량 포맷팅 (한국어 단위)
export const formatVolume = (volume: number): string => {
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

// VWAP (Volume Weighted Average Price)
export const calculateVWAP = (highs: number[], lows: number[], closes: number[], volumes: number[]) => {
  const vwapValues: (number | null)[] = [];
  let cumulativeTPV = 0; // Cumulative (Typical Price × Volume)
  let cumulativeVolume = 0;
  
  for (let i = 0; i < closes.length; i++) {
    const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
    cumulativeTPV += typicalPrice * volumes[i];
    cumulativeVolume += volumes[i];
    
    if (cumulativeVolume === 0) {
      vwapValues.push(null);
    } else {
      vwapValues.push(cumulativeTPV / cumulativeVolume);
    }
  }
  
  return vwapValues;
};

// ATR (Average True Range) - Volatility indicator
export const calculateATR = (highs: number[], lows: number[], closes: number[], period: number = 14) => {
  const trueRanges: number[] = [];
  const atrValues: (number | null)[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      trueRanges.push(highs[i] - lows[i]);
    } else {
      const highLow = highs[i] - lows[i];
      const highClose = Math.abs(highs[i] - closes[i - 1]);
      const lowClose = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(highLow, highClose, lowClose));
    }
  }
  
  // Calculate ATR using EMA
  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      atrValues.push(null);
    } else if (i === period - 1) {
      const sum = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
      atrValues.push(sum / period);
    } else {
      const prevATR = atrValues[i - 1];
      if (prevATR !== null) {
        atrValues.push((prevATR * (period - 1) + trueRanges[i]) / period);
      } else {
        atrValues.push(null);
      }
    }
  }
  
  return atrValues;
};

// Williams %R
export const calculateWilliamsR = (highs: number[], lows: number[], closes: number[], period: number = 14) => {
  const values: (number | null)[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      values.push(null);
    } else {
      const periodHighs = highs.slice(i - period + 1, i + 1);
      const periodLows = lows.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...periodHighs);
      const lowestLow = Math.min(...periodLows);
      
      if (highestHigh === lowestLow) {
        values.push(-50); // Middle value when no range
      } else {
        const williams = ((highestHigh - closes[i]) / (highestHigh - lowestLow)) * -100;
        values.push(williams);
      }
    }
  }
  
  return values;
};

// Stochastic Oscillator
export const calculateStochastic = (highs: number[], lows: number[], closes: number[], period: number = 14, smoothK: number = 3, smoothD: number = 3) => {
  const kValues: (number | null)[] = [];
  const dValues: (number | null)[] = [];
  
  // Calculate %K
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      kValues.push(null);
    } else {
      const periodHighs = highs.slice(i - period + 1, i + 1);
      const periodLows = lows.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...periodHighs);
      const lowestLow = Math.min(...periodLows);
      
      if (highestHigh - lowestLow === 0) {
        kValues.push(50); // Default to 50 if no range
      } else {
        const k = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
        kValues.push(k);
      }
    }
  }
  
  // Smooth %K
  const smoothedK = calculateMA(kValues.filter(v => v !== null) as number[], smoothK);
  
  // Calculate %D (MA of %K)
  const dValuesRaw = calculateMA(smoothedK.filter(v => v !== null) as number[], smoothD);
  
  return {
    k: smoothedK,
    d: dValuesRaw
  };
};

// Heikin-Ashi calculation
export const calculateHeikinAshi = (opens: number[], highs: number[], lows: number[], closes: number[]) => {
  const haData: any[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    let haClose = (opens[i] + highs[i] + lows[i] + closes[i]) / 4;
    let haOpen;
    
    if (i === 0) {
      haOpen = (opens[i] + closes[i]) / 2;
    } else {
      haOpen = (haData[i - 1].o + haData[i - 1].c) / 2;
    }
    
    const haHigh = Math.max(highs[i], haOpen, haClose);
    const haLow = Math.min(lows[i], haOpen, haClose);
    
    haData.push({
      o: haOpen,
      h: haHigh,
      l: haLow,
      c: haClose
    });
  }
  
  return haData;
};

// Ichimoku Cloud
export const calculateIchimoku = (highs: number[], lows: number[], closes: number[]) => {
  const period1 = 9;
  const period2 = 26;
  const period3 = 52;
  
  const tenkanSen: (number | null)[] = [];
  const kijunSen: (number | null)[] = [];
  const senkouSpanA: (number | null)[] = [];
  const senkouSpanB: (number | null)[] = [];
  const chikouSpan: (number | null)[] = [];
  
  for (let i = 0; i < highs.length; i++) {
    // Tenkan-sen (Conversion Line)
    if (i < period1 - 1) {
      tenkanSen.push(null);
    } else {
      const periodHighs = highs.slice(i - period1 + 1, i + 1);
      const periodLows = lows.slice(i - period1 + 1, i + 1);
      tenkanSen.push((Math.max(...periodHighs) + Math.min(...periodLows)) / 2);
    }
    
    // Kijun-sen (Base Line)
    if (i < period2 - 1) {
      kijunSen.push(null);
    } else {
      const periodHighs = highs.slice(i - period2 + 1, i + 1);
      const periodLows = lows.slice(i - period2 + 1, i + 1);
      kijunSen.push((Math.max(...periodHighs) + Math.min(...periodLows)) / 2);
    }
    
    // Senkou Span A (Leading Span A)
    if (tenkanSen[i] !== null && kijunSen[i] !== null) {
      senkouSpanA.push((tenkanSen[i]! + kijunSen[i]!) / 2);
    } else {
      senkouSpanA.push(null);
    }
    
    // Senkou Span B (Leading Span B)
    if (i < period3 - 1) {
      senkouSpanB.push(null);
    } else {
      const periodHighs = highs.slice(i - period3 + 1, i + 1);
      const periodLows = lows.slice(i - period3 + 1, i + 1);
      senkouSpanB.push((Math.max(...periodHighs) + Math.min(...periodLows)) / 2);
    }
    
    // Chikou Span (Lagging Span) - close price shifted back by period2
    if (i >= period2) {
      chikouSpan.push(closes[i - period2]);
    } else {
      chikouSpan.push(null);
    }
  }
  
  return {
    tenkanSen,
    kijunSen,
    senkouSpanA,
    senkouSpanB,
    chikouSpan
  };
};