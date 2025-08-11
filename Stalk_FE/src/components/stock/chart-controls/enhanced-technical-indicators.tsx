import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface IndicatorConfig {
  enabled: boolean;
  period?: number;
  period2?: number;
  stdDev?: number;
}

interface IndicatorSettings {
  ma20: IndicatorConfig;
  ma50: IndicatorConfig;
  ema12: IndicatorConfig;
  ema26: IndicatorConfig;
  rsi: IndicatorConfig;
  macd: IndicatorConfig;
  bollinger: IndicatorConfig;
  stochastic: IndicatorConfig;
  vwap: IndicatorConfig;
  ichimoku: IndicatorConfig;
  volume: IndicatorConfig;
}

interface EnhancedTechnicalIndicatorsProps {
  indicators: IndicatorSettings;
  onIndicatorChange: (indicator: string, config: IndicatorConfig) => void;
  darkMode?: boolean;
  disabledIndicators?: {
    [key: string]: boolean;
  };
}

// Korean explanations for each indicator
const indicatorExplanations = {
  ma: {
    title: '이동평균선 (MA)',
    description: '일정 기간 동안의 주가 평균을 연결한 선으로, 추세를 파악하는데 사용됩니다.',
    usage: '주가가 이동평균선 위에 있으면 상승 추세, 아래에 있으면 하락 추세로 해석합니다.',
    params: '기간(일): 평균을 계산할 일수'
  },
  ema: {
    title: '지수이동평균 (EMA)',
    description: '최근 가격에 더 큰 가중치를 두는 이동평균선입니다.',
    usage: '단순 이동평균보다 최근 추세를 빠르게 반영합니다.',
    params: '기간(일): 평균을 계산할 일수'
  },
  rsi: {
    title: 'RSI (상대강도지수)',
    description: '가격의 상승압력과 하락압력 간의 상대적 강도를 나타냅니다.',
    usage: '70 이상: 과매수 구간, 30 이하: 과매도 구간',
    params: '기간(일): 일반적으로 14일 사용'
  },
  macd: {
    title: 'MACD',
    description: '두 이동평균선의 차이를 이용한 추세 추종 모멘텀 지표입니다.',
    usage: 'MACD선이 시그널선을 상향 돌파시 매수 신호, 하향 돌파시 매도 신호',
    params: '단기(12), 장기(26), 시그널(9)이 기본값'
  },
  bollinger: {
    title: '볼린저 밴드',
    description: '이동평균선 위아래로 표준편차를 이용한 밴드를 그린 지표입니다.',
    usage: '가격이 상단 밴드에 닿으면 과매수, 하단 밴드에 닿으면 과매도로 해석',
    params: '기간(일), 표준편차 배수'
  },
  stochastic: {
    title: '스토캐스틱',
    description: '일정 기간 중 현재 가격의 상대적 위치를 나타내는 모멘텀 지표입니다.',
    usage: '80 이상: 과매수, 20 이하: 과매도. %K와 %D선의 교차로 매매 신호 포착',
    params: '%K 기간, %D 기간 (smoothing)'
  },
  vwap: {
    title: 'VWAP (거래량 가중 평균가격)',
    description: '거래량을 가중치로 한 평균 가격입니다.',
    usage: '기관투자자들이 많이 참고하는 지표. VWAP 위: 강세, 아래: 약세',
    params: '별도 설정 없음'
  },
  ichimoku: {
    title: '일목균형표',
    description: '5개의 선을 이용해 지지/저항과 추세를 종합적으로 보여주는 지표입니다.',
    usage: '구름대 위: 상승추세, 구름대 아래: 하락추세',
    params: '전환선(9), 기준선(26), 선행스팬(52)'
  },
  volume: {
    title: '거래량',
    description: '주식 거래량을 막대 그래프로 표시합니다.',
    usage: '가격 상승시 거래량 증가: 상승 추세 강화',
    params: '별도 설정 없음'
  }
};

const EnhancedTechnicalIndicators: React.FC<EnhancedTechnicalIndicatorsProps> = ({
  indicators,
  onIndicatorChange,
  darkMode = false,
  disabledIndicators = {}
}) => {

  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);
  const [hoveredIndicator, setHoveredIndicator] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{[key: string]: string}>({});

  const toggleIndicator = (indicator: string) => {
    const currentConfig = indicators[indicator as keyof IndicatorSettings];
    onIndicatorChange(indicator, {
      ...currentConfig,
      enabled: !currentConfig.enabled
    });
  };

  const renderIndicatorControl = (
    key: string,
    label: string,
    config: IndicatorConfig,
    explanation: any,
    hasCustomPeriod: boolean = true,
    secondaryPeriod?: { label: string; field: string; value: number }
  ) => {
    const isDisabled = disabledIndicators[key] || false;

    return (
      <div className={`relative border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} py-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={() => !isDisabled && toggleIndicator(key)}
              disabled={isDisabled}
              className={`rounded ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-blue-500'
                  : 'bg-white border-gray-300 text-blue-600'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            />
            <label className={`text-sm font-medium ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            } ${isDisabled ? 'opacity-50' : 'cursor-pointer'}`}
            onClick={() => !isDisabled && toggleIndicator(key)}>
              {label}
            </label>
            <div
              className="relative group"
              onMouseEnter={() => setHoveredIndicator(key)}
              onMouseLeave={() => setHoveredIndicator(null)}
            >
              <button
                className={`ml-1 text-xs rounded-full w-4 h-4 flex items-center justify-center ${
                  darkMode
                    ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                type="button"
              >
                ?
              </button>
              {/* Hover tooltip - Fixed positioning */}
              {hoveredIndicator === key && (
                <div
                  className={`fixed p-3 rounded-lg shadow-xl text-xs w-80 z-[200] ${
                    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}
                  style={{
                    left: '320px', // Position to the right of sidebar (w-72 = 288px + some margin)
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                >
                  <h4 className={`font-semibold mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {explanation.title}
                  </h4>
                  <p className={`mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {explanation.description}
                  </p>
                  <p className={`mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <strong>사용법:</strong> {explanation.usage}
                  </p>
                  {explanation.params && (
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <strong>설정:</strong> {explanation.params}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {hasCustomPeriod && config.enabled && !isDisabled && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingValues[`${key}_period`] !== undefined
                  ? editingValues[`${key}_period`]
                  : (config.period || 20)}
                onFocus={(e) => {
                  setEditingValues(prev => ({
                    ...prev,
                    [`${key}_period`]: String(config.period || 20)
                  }));
                  e.target.select();
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditingValues(prev => ({
                    ...prev,
                    [`${key}_period`]: value
                  }));
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  const numValue = parseInt(value);

                  let finalValue = 20;
                  if (!isNaN(numValue) && numValue > 0) {
                    finalValue = Math.min(Math.max(numValue, 1), 200);
                  }

                  onIndicatorChange(key, {
                    ...config,
                    period: finalValue
                  });

                  // Clear editing state
                  setEditingValues(prev => {
                    const newState = { ...prev };
                    delete newState[`${key}_period`];
                    return newState;
                  });
                }}
                className={`w-16 px-2 py-1 text-xs rounded border ${
                  darkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                일
              </span>
            </div>
          )}
        </div>

        {secondaryPeriod && config.enabled && !isDisabled && (
          <div className="flex items-center justify-end gap-2 mt-2">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {secondaryPeriod.label}:
            </span>
            <input
              type="number"
              step="0.1"
              value={editingValues[`${key}_${secondaryPeriod.field}`] !== undefined
                ? editingValues[`${key}_${secondaryPeriod.field}`]
                : secondaryPeriod.value}
              onFocus={(e) => {
                setEditingValues(prev => ({
                  ...prev,
                  [`${key}_${secondaryPeriod.field}`]: String(secondaryPeriod.value)
                }));
                e.target.select();
              }}
              onChange={(e) => {
                const value = e.target.value;
                setEditingValues(prev => ({
                  ...prev,
                  [`${key}_${secondaryPeriod.field}`]: value
                }));
              }}
              onBlur={(e) => {
                const value = e.target.value;
                const numValue = parseFloat(value);

                let finalValue = secondaryPeriod.field === 'stdDev' ? 2 : 20;
                if (!isNaN(numValue) && numValue > 0) {
                  finalValue = numValue;
                }

                onIndicatorChange(key, {
                  ...config,
                  [secondaryPeriod.field]: finalValue
                });

                // Clear editing state
                setEditingValues(prev => {
                  const newState = { ...prev };
                  delete newState[`${key}_${secondaryPeriod.field}`];
                  return newState;
                });
              }}
              className={`w-16 px-2 py-1 text-xs rounded border ${
                darkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-200'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
              min="1"
              max="10"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-full ${darkMode ? 'bg-gray-900' : 'bg-white'} overflow-y-auto`}>
      <div className="p-4">
        <div className="mb-4">
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            기술적 지표
          </h3>
        </div>

        <div className="space-y-1">
          {/* Price Overlays Only */}
          <div className={`relative flex items-center gap-2 mb-2`}>
            <div className="relative">
              <button
                onMouseEnter={() => setHoveredIndicator('info')}
                onMouseLeave={() => setHoveredIndicator(null)}
                className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs transition-colors ${
                  darkMode
                    ? 'border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-400'
                    : 'border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                }`}
              >
                ?
              </button>

              {hoveredIndicator === 'info' && createPortal(
                <div
                  className={`fixed p-3 rounded-lg shadow-xl border w-72 ${
                    darkMode
                      ? 'bg-gray-800 border-gray-600 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                  style={{
                    zIndex: 2147483647,
                    left: '240px',
                    top: '200px',
                    pointerEvents: 'none'
                  }}
                >
                  <div className="text-sm font-medium mb-2">지표 사용 가능 조건</div>
                  <div className="text-xs space-y-1">
                    <div>• RSI, MACD: 최소 14일 데이터 필요</div>
                    <div>• 스토캐스틱: 최소 14일 데이터 필요</div>
                    <div>• 볼린저 밴드: 최소 20일 데이터 필요</div>
                    <div>• 일목균형표: 최소 52일 데이터 필요</div>
                    <div>• 이동평균: 설정된 기간만큼 데이터 필요</div>
                  </div>
                  <div className="text-xs mt-2 opacity-75">
                    데이터가 부족한 지표는 비활성화됩니다.
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>

          {renderIndicatorControl('ma20', 'MA', indicators.ma20, indicatorExplanations.ma)}
          {renderIndicatorControl('ema12', 'EMA', indicators.ema12, indicatorExplanations.ema)}
          {renderIndicatorControl(
            'bollinger',
            '볼린저밴드',
            indicators.bollinger,
            indicatorExplanations.bollinger,
            true,
            { label: '표준편차', field: 'stdDev', value: indicators.bollinger.stdDev || 2 }
          )}
          {renderIndicatorControl('vwap', 'VWAP', indicators.vwap, indicatorExplanations.vwap, false)}
          {renderIndicatorControl('ichimoku', '일목균형표', indicators.ichimoku, indicatorExplanations.ichimoku, false)}
        </div>

        {/* Tip */}
        <div className={`mt-4 p-3 rounded-lg text-xs ${
          darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
        }`}>
          <strong>팁:</strong> 여러 지표를 동시에 사용하면 차트가 복잡해질 수 있습니다.
          2-3개의 지표를 선택하여 사용하는 것을 권장합니다.
        </div>
      </div>
    </div>
  );
};

export default EnhancedTechnicalIndicators;
