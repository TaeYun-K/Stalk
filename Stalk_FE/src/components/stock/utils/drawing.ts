import Konva from 'konva';

export interface DrawingObject {
  id: string;
  type: DrawingTool;
  konvaObject: Konva.Shape | Konva.Group;
}

export type DrawingTool = 'select' | 'line' | 'rect' | 'arrow' | 'trendline' | 'fib' | 'text' | 'circle';

// Professional color palette for drawing tools
export const DRAWING_COLORS = [
  { color: '#1e40af', name: '파란색' },      // Deep Blue
  { color: '#7c3aed', name: '보라색' },      // Purple
  { color: '#ea580c', name: '주황색' },      // Orange
  { color: '#374151', name: '회색' },        // Gray
  { color: '#0f766e', name: '청록색' },      // Teal
  { color: '#be185d', name: '핑크색' }       // Pink
];

export const createTrendLine = (startX: number, startY: number, endX: number, endY: number, color: string, width: number): Konva.Line => {
  return new Konva.Line({
    points: [startX, startY, endX, endY],
    stroke: color,
    strokeWidth: width,
    lineCap: 'round',
    lineJoin: 'round',
    draggable: true,
  });
};

export const createRectangle = (x: number, y: number, width: number, height: number, color: string, strokeWidth: number): Konva.Rect => {
  return new Konva.Rect({
    x,
    y,
    width,
    height,
    stroke: color,
    strokeWidth,
    fill: 'transparent',
    draggable: true,
  });
};

export const createArrow = (startX: number, startY: number, endX: number, endY: number, color: string, width: number): Konva.Arrow => {
  return new Konva.Arrow({
    points: [startX, startY, endX, endY],
    stroke: color,
    strokeWidth: width,
    fill: color,
    pointerLength: 10,
    pointerWidth: 10,
    draggable: true,
  });
};

export const createFibonacciRetracement = (startX: number, startY: number, endX: number, endY: number, color: string): Konva.Group => {
  const group = new Konva.Group({
    draggable: true,
  });

  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const diff = endY - startY;

  levels.forEach(level => {
    const y = startY + diff * level;
    
    // Horizontal line
    const line = new Konva.Line({
      points: [startX, y, endX, y],
      stroke: color,
      strokeWidth: 1,
      opacity: 0.6,
      dash: level === 0 || level === 1 ? [] : [5, 5],
    });
    
    // Level text
    const text = new Konva.Text({
      x: endX + 5,
      y: y - 8,
      text: `${(level * 100).toFixed(1)}%`,
      fontSize: 12,
      fill: color,
    });
    
    group.add(line);
    group.add(text);
  });

  return group;
};

export const createText = (x: number, y: number, text: string, color: string, fontSize: number = 14): Konva.Text => {
  return new Konva.Text({
    x,
    y,
    text,
    fontSize,
    fill: color,
    draggable: true,
  });
};

export const createCircle = (x: number, y: number, radius: number, color: string, strokeWidth: number): Konva.Circle => {
  return new Konva.Circle({
    x,
    y,
    radius,
    stroke: color,
    strokeWidth,
    fill: 'transparent',
    draggable: true,
  });
};