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
      <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        기간:
      </span>
      {periods.map(p => (
        <button
          key={p.value}
          onClick={() => onPeriodChange(p.value)}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all transform hover:scale-105 ${
            period === p.value
              ? darkMode
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400/30'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400/30'
              : darkMode 
                ? 'bg-gray-800/50 backdrop-blur-sm text-gray-300 hover:bg-gray-700/70 hover:text-white border border-gray-700/30' 
                : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/80 hover:text-gray-900 shadow-sm border border-gray-200/30'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

export default ChartControls;