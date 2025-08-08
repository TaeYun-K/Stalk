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
    <div className={`inline-flex items-center gap-1.5 px-2 py-1.5 ${
      darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-gray-50 border-gray-200'
    } rounded-lg mb-2 border`}>
      <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
        기간:
      </span>
      {periods.map(p => (
        <button
          key={p.value}
          onClick={() => onPeriodChange(p.value)}
          className={`px-2 py-1 text-xs rounded-md transition-all ${
            period === p.value
              ? 'bg-blue-500 text-white shadow-sm'
              : darkMode 
                ? 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-300' 
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

export default ChartControls;