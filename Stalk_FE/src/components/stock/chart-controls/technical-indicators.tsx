import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface TechnicalIndicatorsProps {
  indicators: {
    ma20?: boolean;
    ma50?: boolean;
    ma200?: boolean;
    ema12?: boolean;
    ema26?: boolean;
    rsi?: boolean;
    macd?: boolean;
    bollinger?: boolean;
    stochastic?: boolean;
    vwap?: boolean;
    ichimoku?: boolean;
    volume?: boolean;
  };
  onIndicatorChange: (indicator: string, value: boolean) => void;
  darkMode?: boolean;
  disabledIndicators?: {
    ma20?: boolean;
    ma50?: boolean;
    ema12?: boolean;
    ema26?: boolean;
    rsi?: boolean;
    macd?: boolean;
    bollinger?: boolean;
    stochastic?: boolean;
    ichimoku?: boolean;
  };
}

const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({
  indicators,
  onIndicatorChange,
  darkMode = false,
  disabledIndicators = {}
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('trend');

  const indicatorCategories = [
    {
      key: 'trend',
      label: '추세 지표',
      indicators: [
        { key: 'ma20', label: 'MA', description: '이동평균', color: '#ef4444' },
        { key: 'ema12', label: 'EMA', description: '지수이동평균', color: '#10b981' },
      ]
    },
    {
      key: 'momentum',
      label: '모멘텀 지표',
      indicators: [
        { key: 'rsi', label: 'RSI', description: '상대강도지수 (과매수/과매도)', color: '#3b82f6' },
        { key: 'macd', label: 'MACD', description: '이동평균 수렴/확산', color: '#6366f1' },
        { key: 'stochastic', label: 'Stochastic', description: '스토캐스틱 오실레이터', color: '#ec4899' },
      ]
    },
    {
      key: 'volatility',
      label: '변동성 지표',
      indicators: [
        { key: 'bollinger', label: '볼린저 밴드', description: '가격 변동성 범위', color: '#f97316' },
        { key: 'vwap', label: 'VWAP', description: '거래량 가중 평균가격', color: '#84cc16' },
      ]
    },
    {
      key: 'advanced',
      label: '고급 지표',
      indicators: [
        { key: 'ichimoku', label: '일목균형표', description: '종합적 추세 분석', color: '#a855f7' },
      ]
    },
    {
      key: 'basic',
      label: '기본 차트',
      indicators: [
        { key: 'volume', label: '거래량', description: '거래량 차트 표시', color: '#64748b' },
      ]
    }
  ];

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className={`${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="p-4">
        <h3 className={`text-base font-bold mb-4 ${
          darkMode ? 'text-gray-200' : 'text-gray-900'
        }`}>
          📊 기술적 지표
        </h3>
        
        <div className="space-y-2">
          {indicatorCategories.map(category => (
            <div key={category.key} className={`rounded-lg border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => toggleCategory(category.key)}
                className={`w-full px-3 py-2 flex items-center justify-between text-sm font-medium ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-700 hover:bg-gray-50'
                } transition-colors`}
              >
                <span>{category.label}</span>
                {expandedCategory === category.key ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>
              
              {expandedCategory === category.key && (
                <div className={`px-3 py-2 space-y-2 border-t ${
                  darkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  {category.indicators.map(ind => {
                    const isDisabled = disabledIndicators[ind.key as keyof typeof disabledIndicators] || false;
                    return (
                      <label
                        key={ind.key}
                        className={`flex items-center gap-3 p-2 rounded-md ${
                          isDisabled 
                            ? darkMode 
                              ? 'opacity-50 cursor-not-allowed text-gray-500' 
                              : 'opacity-50 cursor-not-allowed text-gray-400'
                            : darkMode 
                              ? 'hover:bg-gray-800 text-gray-300 cursor-pointer' 
                              : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
                        } transition-colors`}
                      >
                        <input
                          type="checkbox"
                          checked={indicators[ind.key as keyof typeof indicators] || false}
                          onChange={(e) => !isDisabled && onIndicatorChange(ind.key, e.target.checked)}
                          disabled={isDisabled}
                          className={`rounded border-gray-300 ${
                            isDisabled 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-blue-600 focus:ring-blue-500'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span 
                              className={`w-3 h-3 rounded-full ${isDisabled ? 'opacity-50' : ''}`}
                              style={{ backgroundColor: ind.color }}
                            />
                            <span className={`text-sm font-medium ${isDisabled ? 'line-through' : ''}`}>
                              {ind.label}
                            </span>
                            {isDisabled && (
                              <span className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                                (데이터 부족)
                              </span>
                            )}
                          </div>
                          <div className={`text-xs mt-0.5 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {ind.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechnicalIndicators;