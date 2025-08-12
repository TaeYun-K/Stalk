/**
 * Custom hook for managing technical indicators state
 */

import { useState, useCallback } from 'react';
import { IndicatorStates } from '../utils/chart-types';

const initialIndicatorStates: IndicatorStates = {
  ma20: false,
  ma50: false,
  ma200: false,
  ema12: false,
  ema26: false,
  rsi: false,
  macd: false,
  bollinger: false,
  stochastic: false,
  vwap: false,
  ichimoku: false,
  volume: true, // Volume is shown by default
};

export const useIndicators = () => {
  const [indicators, setIndicators] = useState<IndicatorStates>(initialIndicatorStates);

  const toggleIndicator = useCallback((indicator: keyof IndicatorStates) => {
    setIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
  }, []);

  const setIndicatorValue = useCallback((indicator: keyof IndicatorStates, value: boolean) => {
    setIndicators(prev => ({
      ...prev,
      [indicator]: value
    }));
  }, []);

  const resetIndicators = useCallback(() => {
    setIndicators(initialIndicatorStates);
  }, []);

  return {
    indicators,
    toggleIndicator,
    setIndicatorValue,
    resetIndicators
  };
};