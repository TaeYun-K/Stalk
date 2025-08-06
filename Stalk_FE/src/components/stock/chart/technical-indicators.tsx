import React from 'react';

interface TechnicalIndicatorsProps {
  indicators: {
    ma: boolean;
    ema: boolean;
    rsi: boolean;
    macd: boolean;
    bollinger: boolean;
    volume?: boolean;
  };
  onIndicatorChange: (indicator: string, value: boolean) => void;
  darkMode?: boolean;
}

const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({
  indicators,
  onIndicatorChange,
  darkMode = false
}) => {
  const indicatorList = [
    { key: 'volume', label: '거래량', description: '거래량 차트' },
    { key: 'ma', label: '이동평균선 (MA)', description: '단순 이동평균' },
    { key: 'ema', label: '지수이동평균 (EMA)', description: '지수 가중 이동평균' },
    { key: 'rsi', label: 'RSI', description: '상대강도지수' },
    { key: 'macd', label: 'MACD', description: '이동평균 수렴/확산' },
    { key: 'bollinger', label: '볼린저 밴드', description: '변동성 지표' },
  ];

  return (
    <div className={`p-4 border-b ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
    }`}>
      <h3 className={`text-sm font-semibold mb-3 ${
        darkMode ? 'text-gray-200' : 'text-gray-900'
      }`}>
        기술적 지표
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {indicatorList.map(ind => (
          <label
            key={ind.key}
            className={`flex items-start gap-2 cursor-pointer ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            <input
              type="checkbox"
              checked={indicators[ind.key as keyof typeof indicators]}
              onChange={(e) => onIndicatorChange(ind.key, e.target.checked)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium">{ind.label}</div>
              <div className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {ind.description}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default TechnicalIndicators;