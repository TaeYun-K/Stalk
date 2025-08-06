import { useRef, useCallback, RefObject } from 'react';
import Konva from 'konva';

export const useDrawingCanvas = (containerRef: RefObject<HTMLDivElement>) => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastLineRef = useRef<Konva.Line | null>(null);
  const selectedShapeRef = useRef<Konva.Node | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  
  const drawingToolRef = useRef<string>('pen');
  const strokeColorRef = useRef<string>('#ff0000');
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
    if (drawingToolRef.current !== 'pen') return;

    isDrawingRef.current = true;
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    lastLineRef.current = new Konva.Line({
      stroke: strokeColorRef.current,
      strokeWidth: strokeWidthRef.current,
      globalCompositeOperation: 'source-over',
      points: [pos.x, pos.y, pos.x, pos.y],
      lineCap: 'round',
      lineJoin: 'round',
    });

    layer.add(lastLineRef.current);
    console.log('그리기 시작');
  }, []);

  const handleMouseMove = useCallback((_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawingRef.current || drawingToolRef.current !== 'pen') return;

    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer || !lastLineRef.current) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const newPoints = lastLineRef.current.points().concat([pos.x, pos.y]);
    lastLineRef.current.points(newPoints);
    layer.batchDraw();
  }, []);

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    lastLineRef.current = null;
    console.log('그리기 종료');
  }, []);

  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (drawingToolRef.current !== 'select') return;

    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!stage || !transformer) return;

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
    layer.batchDraw();
    console.log('캔버스 클리어됨');
  }, []);

  const deleteSelected = useCallback(() => {
    const transformer = transformerRef.current;
    const layer = layerRef.current;
    if (!transformer || !layer) return;

    const nodes = transformer.nodes();
    nodes.forEach(node => {
      (node as Konva.Shape | Konva.Group).destroy();
    });

    transformer.nodes([]);
    transformer.visible(false);
    selectedShapeRef.current = null;
    layer.batchDraw();
    console.log('선택된 도형 삭제됨');
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
      case 'rectangle':
        shape = new Konva.Rect({
          x: 100,
          y: 100,
          width: 150,
          height: 100,
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current,
          fill: 'transparent',
          draggable: true,
        });
        break;
      case 'circle':
        shape = new Konva.Circle({
          x: 150,
          y: 150,
          radius: 50,
          stroke: strokeColorRef.current,
          strokeWidth: strokeWidthRef.current,
          fill: 'transparent',
          draggable: true,
        });
        break;
      case 'text':
        shape = new Konva.Text({
          x: 100,
          y: 100,
          text: '텍스트',
          fontSize: 20,
          fontFamily: 'Arial',
          fill: strokeColorRef.current,
          draggable: true,
        });
        break;
    }

    if (shape) {
      layer.add(shape);
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
    deleteSelected,
    addShape,
    setDrawingTool,
    setStrokeColor,
    setStrokeWidth,
  };
};