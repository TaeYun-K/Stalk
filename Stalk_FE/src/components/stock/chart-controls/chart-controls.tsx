import React from 'react';

interface ChartControlsProps {
  period: string;
  chartType: 'line';
  onPeriodChange: (period: string) => void;
  onChartTypeChange: (type: 'line') => void;
  darkMode?: boolean;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  period,
  chartType,
  onPeriodChange,
  onChartTypeChange,
  darkMode = false
}) => {
  const periods = [
    { value: '7', label: '1주' },
    { value: '30', label: '1개월' },
    { value: '100', label: '100일' },
  ];

  const chartTypes = [
    { value: 'line', label: '라인' },
  ];

  return (
    <div className={`flex items-center justify-between p-4 border-b ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            기간:
          </span>
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`px-3 py-1 rounded transition-colors ${
                period === p.value
                  ? 'bg-blue-600 text-white'
                  : darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ChartControls;