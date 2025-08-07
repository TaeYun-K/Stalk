import React, { useState } from 'react';

interface DrawingToolbarProps {
  onToolChange: (tool: string) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onClear: () => void;
  onDelete: () => void;
  darkMode?: boolean;
}

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  onToolChange,
  onColorChange,
  onWidthChange,
  onClear,
  onDelete,
  darkMode = false
}) => {
  const [selectedTool, setSelectedTool] = useState<string>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#1e40af');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);

  const handleToolChange = (tool: string) => {
    setSelectedTool(tool);
    onToolChange(tool);
  };

  const handleColorChange = (color: string) => {
    setStrokeColor(color);
    onColorChange(color);
  };

  const handleWidthChange = (width: number) => {
    setStrokeWidth(width);
    onWidthChange(width);
  };

  const colors = [
    '#1e40af', // Deep Blue
    '#7c3aed', // Purple  
    '#ea580c', // Orange
    '#374151', // Gray
    '#0f766e', // Teal
    '#be185d', // Pink
    '#000000', // Black
    '#ffffff'  // White
  ];

  const widths = [1, 2, 3, 5, 8];

  return (
    <div className={`flex flex-wrap items-center gap-3 p-2 ${
      darkMode ? 'bg-gray-800' : 'bg-gray-50'
    } rounded-md`}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleToolChange('pen')}
          className={`px-2 py-1 text-xs rounded ${
            selectedTool === 'pen'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          펜
        </button>
        <button
          onClick={() => handleToolChange('trendline')}
          className={`px-2 py-1 text-xs rounded ${
            selectedTool === 'trendline'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          추세선
        </button>
        <button
          onClick={() => handleToolChange('vertical')}
          className={`px-2 py-1 text-xs rounded ${
            selectedTool === 'vertical'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          수직선
        </button>
        <button
          onClick={() => handleToolChange('rectangle')}
          className={`px-2 py-1 text-xs rounded ${
            selectedTool === 'rectangle'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          사각형
        </button>
        <button
          onClick={() => handleToolChange('arrow')}
          className={`px-2 py-1 text-xs rounded ${
            selectedTool === 'arrow'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          화살표
        </button>
        <button
          onClick={() => handleToolChange('fibonacci')}
          className={`px-2 py-1 text-xs rounded ${
            selectedTool === 'fibonacci'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          피보나치
        </button>
      </div>

      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

      <div className="flex items-center gap-1">
        {colors.map(color => (
          <button
            key={color}
            onClick={() => handleColorChange(color)}
            className={`w-6 h-6 rounded border-2 ${
              strokeColor === color ? 'border-blue-500' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

      <div className="flex items-center gap-1">
        {widths.map(width => (
          <button
            key={width}
            onClick={() => handleWidthChange(width)}
            className={`px-2 py-1 rounded ${
              strokeWidth === width
                ? 'bg-blue-600 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {width}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={onDelete}
          className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
          title="마지막에 그린 도형을 삭제합니다"
        >
          실행취소
        </button>
        <button
          onClick={onClear}
          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          title="모든 도형을 삭제합니다"
        >
          모두지우기
        </button>
      </div>
    </div>
  );
};

export default DrawingToolbar;