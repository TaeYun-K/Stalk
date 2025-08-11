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
    <div className="inline-flex items-center gap-1.5">
      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        기간:
      </span>
      {periods.map(p => (
        <button
          key={p.value}
          onClick={() => onPeriodChange(p.value)}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all transform hover:scale-105 ${
            period === p.value
              ? darkMode
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
              : darkMode 
                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white' 
                : 'bg-white/70 text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

export default ChartControls;