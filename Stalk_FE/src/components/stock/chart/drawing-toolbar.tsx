import React, { useState } from 'react';

interface DrawingToolbarProps {
  onToolChange: (tool: string) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onAddShape: (shape: string) => void;
  onClear: () => void;
  onDelete: () => void;
  darkMode?: boolean;
}

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  onToolChange,
  onColorChange,
  onWidthChange,
  onAddShape,
  onClear,
  onDelete,
  darkMode = false
}) => {
  const [selectedTool, setSelectedTool] = useState<string>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#ff0000');
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
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#ff00ff', '#00ffff', '#000000', '#ffffff'
  ];

  const widths = [1, 2, 3, 5, 8];

  return (
    <div className={`flex items-center gap-4 p-4 border-b ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          도구:
        </span>
        <button
          onClick={() => handleToolChange('pen')}
          className={`px-3 py-1 rounded ${
            selectedTool === 'pen'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          펜
        </button>
        <button
          onClick={() => handleToolChange('select')}
          className={`px-3 py-1 rounded ${
            selectedTool === 'select'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}
        >
          선택
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          도형:
        </span>
        <button
          onClick={() => onAddShape('line')}
          className={`px-3 py-1 rounded ${
            darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          선
        </button>
        <button
          onClick={() => onAddShape('rectangle')}
          className={`px-3 py-1 rounded ${
            darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          사각형
        </button>
        <button
          onClick={() => onAddShape('circle')}
          className={`px-3 py-1 rounded ${
            darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          원
        </button>
        <button
          onClick={() => onAddShape('text')}
          className={`px-3 py-1 rounded ${
            darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          텍스트
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          색상:
        </span>
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

      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          두께:
        </span>
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

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onDelete}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          선택 삭제
        </button>
        <button
          onClick={onClear}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          모두 지우기
        </button>
      </div>
    </div>
  );
};

export default DrawingToolbar;