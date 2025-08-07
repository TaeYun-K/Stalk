import { useRef, useCallback, RefObject } from 'react';
import Konva from 'konva';

export const useDrawingCanvas = (containerRef: RefObject<HTMLDivElement>) => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastLineRef = useRef<Konva.Line | null>(null);
  const selectedShapeRef = useRef<Konva.Node | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const startPointRef = useRef<{ x: number, y: number } | null>(null);
  const currentShapeRef = useRef<Konva.Node | null>(null);
  const shapeHistoryRef = useRef<Konva.Node[]>([]); // Track shape creation order
  
  const drawingToolRef = useRef<string>('pen');
  const strokeColorRef = useRef<string>('#1e40af');
  const strokeWidthRef = useRef<number>(2);

  const initializeCanvas = useCallback(() => {
    if (!containerRef.current) {
      console.log('컨테이너가 준비되지 않음');
      return null;
    }

    const container = containerRef.current;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    if (width === 0 || height === 0) {
      console.log('컨테이너 크기가 0');
      return null;
    }

    // 기존 캔버스가 있으면 제거
    const existingCanvas = container.querySelector('#drawing-canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    // Konva 컨테이너 생성
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'drawing-canvas';
    canvasContainer.style.position = 'absolute';
    canvasContainer.style.top = '0';
    canvasContainer.style.left = '0';
    canvasContainer.style.width = '100%';
    canvasContainer.style.height = '100%';
    canvasContainer.style.pointerEvents = 'none';
    canvasContainer.style.zIndex = '10';
    container.appendChild(canvasContainer);

    console.log('Konva Stage 생성 중...', { width, height });

    // Konva Stage 생성
    const stage = new Konva.Stage({
      container: canvasContainer,
      width: width,
      height: height,
    });

    // Layer 생성
    const layer = new Konva.Layer();
    stage.add(layer);

    // Transformer 생성
    const transformer = new Konva.Transformer({
      nodes: [],
      visible: false,
    });
    layer.add(transformer);

    stageRef.current = stage;
    layerRef.current = layer;
    transformerRef.current = transformer;

    console.log('Konva 초기화 완료');

    // 이벤트 리스너 설정
    stage.on('mousedown touchstart', handleMouseDown);
    stage.on('mousemove touchmove', handleMouseMove);
    stage.on('mouseup touchend', handleMouseUp);
    stage.on('click tap', handleClick);

    return stage;
  }, [containerRef]);

  const handleMouseDown = useCallback((_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    isDrawingRef.current = true;
    startPointRef.current = { x: pos.x, y: pos.y };

    if (drawingToolRef.current === 'pen') {
      lastLineRef.current = new Konva.Line({
        stroke: strokeColorRef.current,
        strokeWidth: strokeWidthRef.current,
        globalCompositeOperation: 'source-over',
        points: [pos.x, pos.y, pos.x, pos.y],
        lineCap: 'round',
        lineJoin: 'round',
      });
      layer.add(lastLineRef.current);
      shapeHistoryRef.current.push(lastLineRef.current);
      console.log('펜 그리기 시작');
    } else {
      // Create temporary shape for drag-to-create
      currentShapeRef.current = createShapeByType(drawingToolRef.current, pos.x, pos.y, pos.x, pos.y);
      if (currentShapeRef.current) {
        layer.add(currentShapeRef.current);
        shapeHistoryRef.current.push(currentShapeRef.current);
        console.log(`${drawingToolRef.current} 드래그 생성 시작`);
      }
    }
  }, []);

  const handleMouseMove = useCallback((_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawingRef.current) return;

    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (drawingToolRef.current === 'pen') {
      if (!lastLineRef.current) return;
      const newPoints = lastLineRef.current.points().concat([pos.x, pos.y]);
      lastLineRef.current.points(newPoints);
      layer.batchDraw();
    } else {
      // Update shape during drag
      if (currentShapeRef.current && startPointRef.current) {
        updateShapeByType(drawingToolRef.current, currentShapeRef.current, startPointRef.current, pos);
        layer.batchDraw();
      }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    // Make shape draggable after drag creation is complete
    if (currentShapeRef.current && drawingToolRef.current !== 'pen') {
      if (currentShapeRef.current instanceof Konva.Group) {
        currentShapeRef.current.draggable(true);
      } else {
        (currentShapeRef.current as any).draggable(true);
      }
    }
    
    isDrawingRef.current = false;
    lastLineRef.current = null;
    currentShapeRef.current = null;
    startPointRef.current = null;
    console.log('그리기 종료');
  }, []);

  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Click handling for selection is now always available for any tool
    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!stage || !transformer) return;

    // Only allow selection when not actively drawing
    if (isDrawingRef.current || drawingToolRef.current === 'pen') return;

    // 클릭한 대상이 Stage인 경우 선택 해제
    if (e.target === stage) {
      transformer.nodes([]);
      transformer.visible(false);
      selectedShapeRef.current = null;
      stage.batchDraw();
      return;
    }

    // 도형 선택
    const shape = e.target;
    if (shape && shape !== stage) {
      transformer.nodes([shape]);
      transformer.visible(true);
      selectedShapeRef.current = shape;
      stage.batchDraw();
      console.log('도형 선택됨');
    }
  }, []);

  const enableDrawing = useCallback(() => {
    const canvasContainer = containerRef.current?.querySelector('#drawing-canvas') as HTMLElement;
    if (canvasContainer) {
      canvasContainer.style.pointerEvents = 'auto';
      console.log('그리기 활성화됨');
    }
  }, [containerRef]);

  const disableDrawing = useCallback(() => {
    const canvasContainer = containerRef.current?.querySelector('#drawing-canvas') as HTMLElement;
    if (canvasContainer) {
      canvasContainer.style.pointerEvents = 'none';
      console.log('그리기 비활성화됨');
    }
    isDrawingRef.current = false;
  }, [containerRef]);

  const clearCanvas = useCallback(() => {
    const layer = layerRef.current;
    const transformer = transformerRef.current;
    if (!layer || !transformer) return;

    // Transformer를 제외한 모든 도형 제거
    const children = layer.getChildren();
    children.forEach(child => {
      if (child !== transformer) {
        child.destroy();
      }
    });
    
    transformer.nodes([]);
    transformer.visible(false);
    selectedShapeRef.current = null;
    shapeHistoryRef.current = []; // Clear history
    layer.batchDraw();
    console.log('모든 도형 삭제됨');
  }, []);

  const undoLastShape = useCallback(() => {
    const layer = layerRef.current;
    const transformer = transformerRef.current;
    if (!layer || !transformer) return;

    const history = shapeHistoryRef.current;
    if (history.length === 0) {
      console.log('삭제할 도형이 없습니다');
      return;
    }

    // Get the last created shape
    const lastShape = history.pop();
    if (lastShape) {
      // If the last shape is currently selected, deselect it
      if (selectedShapeRef.current === lastShape) {
        transformer.nodes([]);
        transformer.visible(false);
        selectedShapeRef.current = null;
      }
      
      // Remove from layer
      lastShape.destroy();
      layer.batchDraw();
      console.log('마지막 도형 삭제됨');
    }
  }, []);

  // Helper function to create shape during drag
  const createShapeByType = useCallback((shapeType: string, x1: number, y1: number, x2: number, y2: number): Konva.Node | null => {
    switch (shapeType) {
      case 'trendline':
        return new Konva.Line({
          points: [x1, y1, x2, y2],
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current * 1.5,
          lineCap: 'round',
          draggable: false,
          shadowColor: strokeColorRef.current,
          shadowBlur: 1,
          shadowOpacity: 0.3,
        });
      case 'vertical':
        return new Konva.Line({
          points: [x1, Math.min(y1, y2), x1, Math.max(y1, y2)],
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current,
          lineCap: 'round',
          draggable: false,
        });
      case 'rectangle':
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        return new Konva.Rect({
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: width,
          height: height,
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current * 1.5,
          fill: 'transparent',
          draggable: false,
          shadowColor: strokeColorRef.current,
          shadowBlur: 2,
          shadowOpacity: 0.2,
        });
      case 'arrow':
        const arrowGroup = new Konva.Group({
          draggable: false,
        });
        
        // Calculate arrow dimensions
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Make arrowhead size proportional to line length but with limits
        const arrowLength = Math.min(Math.max(length * 0.2, 12), 25);
        const arrowWidth = arrowLength * 0.6;
        
        // Main line (shortened to not overlap with arrowhead)
        const lineEndX = x2 - (arrowLength * 0.7) * Math.cos(angle);
        const lineEndY = y2 - (arrowLength * 0.7) * Math.sin(angle);
        
        const arrowLine = new Konva.Line({
          points: [x1, y1, lineEndX, lineEndY],
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current * 1.5,
          lineCap: 'round',
        });
        
        // Arrowhead as a filled triangle
        const arrowHead = new Konva.Line({
          points: [
            x2, y2, // tip
            x2 - arrowLength * Math.cos(angle - Math.PI/6), y2 - arrowLength * Math.sin(angle - Math.PI/6), // left wing
            x2 - arrowLength * 0.5 * Math.cos(angle), y2 - arrowLength * 0.5 * Math.sin(angle), // middle back
            x2 - arrowLength * Math.cos(angle + Math.PI/6), y2 - arrowLength * Math.sin(angle + Math.PI/6), // right wing
            x2, y2 // close to tip
          ],
          stroke: strokeColorRef.current,
          strokeWidth: 1,
          fill: strokeColorRef.current,
          closed: true,
        });
        
        arrowGroup.add(arrowLine);
        arrowGroup.add(arrowHead);
        return arrowGroup;
      case 'fibonacci':
        const fibGroup = new Konva.Group({
          draggable: false,
        });
        
        const fibHeight = Math.abs(y2 - y1);
        const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        
        fibLevels.forEach((level) => {
          const y = Math.min(y1, y2) + (fibHeight * level);
          const isKeyLevel = [0.382, 0.5, 0.618].includes(level);
          const line = new Konva.Line({
            points: [Math.min(x1, x2), y, Math.max(x1, x2), y],
            stroke: strokeColorRef.current,
            strokeWidth: isKeyLevel ? 2 : 1,
            dash: isKeyLevel ? [0] : [8, 4],
            opacity: isKeyLevel ? 0.9 : 0.6,
            shadowColor: strokeColorRef.current,
            shadowBlur: isKeyLevel ? 1 : 0,
            shadowOpacity: 0.3,
          });
          
          const label = new Konva.Text({
            x: Math.max(x1, x2) + 5,
            y: y - 8,
            text: `${(level * 100).toFixed(1)}%`,
            fontSize: isKeyLevel ? 13 : 11,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fill: strokeColorRef.current,
            fontStyle: isKeyLevel ? 'bold' : 'normal',
          });
          
          fibGroup.add(line);
          fibGroup.add(label);
        });
        
        return fibGroup;
      default:
        return null;
    }
  }, []);

  // Helper function to update shape during drag
  const updateShapeByType = useCallback((shapeType: string, shape: Konva.Node, startPoint: { x: number, y: number }, currentPoint: { x: number, y: number }) => {
    const { x: x1, y: y1 } = startPoint;
    const { x: x2, y: y2 } = currentPoint;
    
    switch (shapeType) {
      case 'trendline':
        (shape as Konva.Line).points([x1, y1, x2, y2]);
        break;
      case 'vertical':
        (shape as Konva.Line).points([x1, Math.min(y1, y2), x1, Math.max(y1, y2)]);
        break;
      case 'rectangle':
        const rect = shape as Konva.Rect;
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        rect.x(Math.min(x1, x2));
        rect.y(Math.min(y1, y2));
        rect.width(width);
        rect.height(height);
        break;
      case 'arrow':
        const arrowGroup = shape as Konva.Group;
        const arrowLine = arrowGroup.getChildren()[0] as Konva.Line;
        const arrowHead = arrowGroup.getChildren()[1] as Konva.Line;
        
        // Recalculate arrow dimensions
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const arrowLength = Math.min(Math.max(length * 0.2, 12), 25);
        
        // Update main line
        const lineEndX = x2 - (arrowLength * 0.7) * Math.cos(angle);
        const lineEndY = y2 - (arrowLength * 0.7) * Math.sin(angle);
        arrowLine.points([x1, y1, lineEndX, lineEndY]);
        
        // Update arrowhead
        arrowHead.points([
          x2, y2, // tip
          x2 - arrowLength * Math.cos(angle - Math.PI/6), y2 - arrowLength * Math.sin(angle - Math.PI/6), // left wing
          x2 - arrowLength * 0.5 * Math.cos(angle), y2 - arrowLength * 0.5 * Math.sin(angle), // middle back
          x2 - arrowLength * Math.cos(angle + Math.PI/6), y2 - arrowLength * Math.sin(angle + Math.PI/6), // right wing
          x2, y2 // close to tip
        ]);
        break;
      case 'fibonacci':
        const fibGroup = shape as Konva.Group;
        const fibHeight = Math.abs(y2 - y1);
        const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        
        fibGroup.getChildren().forEach((child, index) => {
          const levelIndex = Math.floor(index / 2);
          if (levelIndex < fibLevels.length) {
            const level = fibLevels[levelIndex];
            const y = Math.min(y1, y2) + (fibHeight * level);
            
            if (child instanceof Konva.Line) {
              child.points([Math.min(x1, x2), y, Math.max(x1, x2), y]);
            } else if (child instanceof Konva.Text) {
              child.x(Math.max(x1, x2) + 5);
              child.y(y - 8);
            }
          }
        });
        break;
    }
  }, []);

  const addShape = useCallback((shapeType: string) => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return;

    let shape: Konva.Node | null = null;

    switch (shapeType) {
      case 'line':
        shape = new Konva.Line({
          points: [50, 50, 200, 200],
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current,
          lineCap: 'round',
          draggable: true,
        });
        break;
      case 'trendline':
        shape = new Konva.Line({
          points: [100, 100, 300, 150],
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current * 1.5,
          lineCap: 'round',
          draggable: true,
          dash: [0],
          shadowColor: strokeColorRef.current,
          shadowBlur: 1,
          shadowOpacity: 0.3,
        });
        break;
      case 'vertical':
        shape = new Konva.Line({
          points: [200, 50, 200, 350],
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current,
          lineCap: 'round',
          draggable: true,
        });
        break;
      case 'rectangle':
        shape = new Konva.Rect({
          x: 100,
          y: 100,
          width: 150,
          height: 100,
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current * 1.5,
          fill: 'transparent',
          draggable: true,
          shadowColor: strokeColorRef.current,
          shadowBlur: 2,
          shadowOpacity: 0.2,
        });
        break;
      case 'fibonacci':
        // Fibonacci retracement levels
        const fibGroup = new Konva.Group({
          draggable: true,
        });
        
        const baseY = 150;
        const height = 100;
        const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        
        fibLevels.forEach((level, index) => {
          const y = baseY + (height * level);
          const isKeyLevel = [0.382, 0.5, 0.618].includes(level);
          const line = new Konva.Line({
            points: [100, y, 300, y],
            stroke: strokeColorRef.current,
            strokeWidth: isKeyLevel ? 2 : 1,
            dash: isKeyLevel ? [0] : [8, 4],
            opacity: isKeyLevel ? 0.9 : 0.6,
            shadowColor: strokeColorRef.current,
            shadowBlur: isKeyLevel ? 1 : 0,
            shadowOpacity: 0.3,
          });
          
          const label = new Konva.Text({
            x: 305,
            y: y - 8,
            text: `${(level * 100).toFixed(1)}%`,
            fontSize: isKeyLevel ? 13 : 11,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fill: strokeColorRef.current,
            fontStyle: isKeyLevel ? 'bold' : 'normal',
          });
          
          fibGroup.add(line);
          fibGroup.add(label);
        });
        
        shape = fibGroup;
        break;
      case 'arrow':
        // Create enhanced arrow shape
        const arrowGroup = new Konva.Group({
          draggable: true,
        });
        
        const arrowLine = new Konva.Line({
          points: [100, 150, 200, 100],
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current * 1.2,
          lineCap: 'round',
          shadowColor: strokeColorRef.current,
          shadowBlur: 2,
          shadowOpacity: 0.4,
        });
        
        const arrowHead = new Konva.Line({
          points: [200, 100, 180, 85, 180, 115, 200, 100],
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current * 1.2,
          fill: strokeColorRef.current,
          closed: true,
          shadowColor: strokeColorRef.current,
          shadowBlur: 2,
          shadowOpacity: 0.4,
        });
        
        arrowGroup.add(arrowLine);
        arrowGroup.add(arrowHead);
        shape = arrowGroup;
        break;
    }

    if (shape) {
      // Make shape draggable after creation when using addShape button
      if (shape instanceof Konva.Group) {
        shape.draggable(true);
      } else {
        (shape as any).draggable(true);
      }
      layer.add(shape);
      shapeHistoryRef.current.push(shape);
      layer.batchDraw();
      console.log(`${shapeType} 도형 추가됨`);
    }
  }, []);

  const setDrawingTool = useCallback((tool: string) => {
    drawingToolRef.current = tool;
    console.log(`도구 변경: ${tool}`);
  }, []);

  const setStrokeColor = useCallback((color: string) => {
    strokeColorRef.current = color;
    console.log(`색상 변경: ${color}`);
  }, []);

  const setStrokeWidth = useCallback((width: number) => {
    strokeWidthRef.current = width;
    console.log(`두께 변경: ${width}`);
  }, []);

  return {
    initializeCanvas,
    enableDrawing,
    disableDrawing,
    clearCanvas,
    undoLastShape,
    addShape,
    setDrawingTool,
    setStrokeColor,
    setStrokeWidth,
  };
};