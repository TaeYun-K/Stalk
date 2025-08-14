import { useRef, useCallback, RefObject } from 'react';
import Konva from 'konva';


// 드로잉 도구 타입
export type DrawingTool = 'pen' | 'trendline' | 'vertical' | 'rectangle' | 'arrow' | 'fibonacci';

export interface SerializedShape {
  id: string;                       // 전역 고유 ID (양쪽에서 동일해야 함)
  type: DrawingTool | 'path';       // Konva 라인 등 구분
  attrs: {
    x?: number; y?: number;
    width?: number; height?: number; rotation?: number;
    points?: number[]; tension?: number;
    stroke?: string; strokeWidth?: number; opacity?: number;
    dash?: number[]; fill?: string;
    scaleX?: number; scaleY?: number;
    offsetX?: number; offsetY?: number;
    pointerLength?: number; pointerWidth?: number;
    tool?: DrawingTool;             // 생성 당시 사용한 툴(구분용)
    [k: string]: any;               // 여유 슬롯
  };
}

export type DrawingChange =
  | { type: 'add' | 'update'; shape: SerializedShape; version: number }
  | { type: 'delete'; id: string; version: number }
  | { type: 'clear'; version: number };

type DrawableNode = Konva.Shape | Konva.Group;


export const useDrawingCanvas = (
  containerRef: RefObject<HTMLDivElement>,
  opts?: {
    onChange?: (change: DrawingChange) => void; // ← 추가
  }
) => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const versionRef = useRef(0);
  const isDrawingRef = useRef<boolean>(false);
  const lastLineRef = useRef<Konva.Line | null>(null);
  const selectedShapeRef = useRef<Konva.Node | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const startPointRef = useRef<{ x: number, y: number } | null>(null);
  const currentShapeRef = useRef<DrawableNode | null>(null);
  const shapeHistoryRef = useRef<Konva.Node[]>([]); // Track shape creation order
  
  const drawingToolRef = useRef<string>('pen');
  const strokeColorRef = useRef<string>('#1e40af');
  const strokeWidthRef = useRef<number>(2);
  
  // Chart context for coordinate mapping
  const chartContextRef = useRef<{
    totalDataPoints: number;
    actualDataPoints: number;
    futureDataPoints: number;
    hasFutureSpace: boolean;
  } | null>(null);

  const genId = () => `shape_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  // Get scaled pointer position accounting for future space
  const getScaledPointerPosition = useCallback((stage: Konva.Stage) => {
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    
    // If we have chart context with future space, adjust x coordinate
    if (chartContextRef.current && chartContextRef.current.hasFutureSpace) {
      const { totalDataPoints, actualDataPoints } = chartContextRef.current;
      const stageWidth = stage.width();
      
      // Calculate the scaling factor
      // The actual data takes up actualDataPoints/totalDataPoints of the width
      // We need to map the x coordinate accordingly
      const scaleFactor = totalDataPoints / actualDataPoints;
      
      // Only scale x coordinate for horizontal alignment with chart
      return {
        x: pos.x,  // Keep original for now - will be adjusted by chart
        y: pos.y
      };
    }
    
    return pos;
  }, []);

  // Konva 노드에 고유 ID 부여 (없으면 생성)
  const ensureId = useCallback((node: Konva.Node): string => {
    let id = node.id();
    if (!id) {
      id = `shape_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      node.id(id);
    }
    return id;
  }, []);

  // ID로 노드 검색
  const findById = useCallback((layer: Konva.Layer, id: string) => {
    return layer.findOne((n) => n.id() === id) as Konva.Node | null;
  }, []);

  // Konva 노드를 SerializedShape 객체로 변환
  const serialize = useCallback((node: Konva.Node): SerializedShape => {
    const className = node.getClassName();
    const id = ensureId(node);
    const attrs = node.getAttrs();
    
    // Group인 경우 tool 속성으로 타입 판단
    if (className === 'Group') {
      const tool = attrs.tool as DrawingTool;
      
      // 화살표 그룹인 경우 특별 처리
      if (tool === 'arrow') {
        const group = node as Konva.Group;
        const children = group.getChildren();
        
        // 첫 번째 자식(선)의 points와 스타일 속성을 가져옴
        const arrowLine = children[0] as Konva.Line;
        const linePoints = arrowLine ? arrowLine.points() : [];
        const lineStroke = arrowLine ? arrowLine.stroke() : '#000000';
        const lineStrokeWidth = arrowLine ? arrowLine.strokeWidth() : 2;
        
        return {
          id,
          type: 'arrow',
          attrs: {
            x: attrs.x || 0,
            y: attrs.y || 0,
            points: linePoints,
            stroke: lineStroke,
            strokeWidth: lineStrokeWidth / 1.5, // 생성 시 1.5배로 만들었으므로 원래 값으로 복원
            tool: 'arrow',
            draggable: attrs.draggable !== false,
            rotation: attrs.rotation || 0,
            scaleX: attrs.scaleX || 1,
            scaleY: attrs.scaleY || 1,
          }
        };
      }
      
      // 다른 Group 도구들(fibonacci 등)도 여기서 처리
      return {
        id,
        type: tool || 'path',
        attrs: {
          x: attrs.x, y: attrs.y, width: attrs.width, height: attrs.height, rotation: attrs.rotation,
          points: attrs.points, tension: attrs.tension, stroke: attrs.stroke, strokeWidth: attrs.strokeWidth,
          opacity: attrs.opacity, dash: attrs.dash, fill: attrs.fill,
          scaleX: attrs.scaleX, scaleY: attrs.scaleY, offsetX: attrs.offsetX, offsetY: attrs.offsetY,
          draggable: attrs.draggable, visible: attrs.visible,
          tool: attrs.tool,
        }
      };
    }
    
    const kept = {
      x: attrs.x, y: attrs.y, width: attrs.width, height: attrs.height, rotation: attrs.rotation,
      points: attrs.points, tension: attrs.tension, stroke: attrs.stroke, strokeWidth: attrs.strokeWidth,
      opacity: attrs.opacity, dash: attrs.dash, fill: attrs.fill,
      scaleX: attrs.scaleX, scaleY: attrs.scaleY, offsetX: attrs.offsetX, offsetY: attrs.offsetY,
      draggable: attrs.draggable, visible: attrs.visible,
      pointerLength: attrs.pointerLength, pointerWidth: attrs.pointerWidth,
      tool: attrs.tool,
    };

    const type: SerializedShape['type'] =
      className === 'Rect'  ? 'rectangle' :
      className === 'Arrow' ? 'arrow' :
      className === 'Line'  ? (attrs.tool as DrawingTool ?? 'pen') :
      'path';

    return { id, type, attrs: kept };
  }, [ensureId]);


  function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const out = {} as Pick<T, K>;
    keys.forEach(k => { if (obj[k] !== undefined) (out[k] = obj[k]); });
    return out;
  }

  //SerializedShape를 레이어에 생성/갱신
  const upsertFromSerialized = useCallback((layer: Konva.Layer, s: SerializedShape) => {
    let node = findById(layer, s.id);
    
    if (node) {
      // 기존 노드가 있으면 업데이트
      if (s.type === 'arrow' && node.getClassName() === 'Group') {
        // 화살표 그룹 업데이트
        const group = node as Konva.Group;
        const points = s.attrs.points as number[];
        if (points && points.length >= 4) {
          const x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3];
          
          // 화살표 치수 재계산
          const dx = x2 - x1;
          const dy = y2 - y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const arrowLength = Math.min(Math.max(length * 0.2, 12), 25);
          
          const children = group.getChildren();
          if (children.length >= 2) {
            const arrowLine = children[0] as Konva.Line;
            const arrowHead = children[1] as Konva.Line;
            
            // 선 업데이트
            const lineEndX = x2 - (arrowLength * 0.7) * Math.cos(angle);
            const lineEndY = y2 - (arrowLength * 0.7) * Math.sin(angle);
            arrowLine.points([x1, y1, lineEndX, lineEndY]);
            
            // 화살촉 업데이트
            arrowHead.points([
              x2, y2,
              x2 - arrowLength * Math.cos(angle - Math.PI/6), y2 - arrowLength * Math.sin(angle - Math.PI/6),
              x2 - arrowLength * 0.5 * Math.cos(angle), y2 - arrowLength * 0.5 * Math.sin(angle),
              x2 - arrowLength * Math.cos(angle + Math.PI/6), y2 - arrowLength * Math.sin(angle + Math.PI/6),
              x2, y2
            ]);
          }
        }
        
        // 그룹 속성 업데이트
        group.setAttrs({
          x: s.attrs.x,
          y: s.attrs.y,
          draggable: s.attrs.draggable,
          rotation: s.attrs.rotation,
          scaleX: s.attrs.scaleX,
          scaleY: s.attrs.scaleY,
        });
      } else {
        // 일반 노드 업데이트
        node.setAttrs({ ...s.attrs });
      }
      node.id(s.id);
    } else {
      // 새 노드 생성
      switch (s.type) {
        case 'rectangle': 
          node = new Konva.Rect({ ...s.attrs }); 
          break;
        case 'arrow':
          // 화살표를 Group으로 재생성
          const points = s.attrs.points as number[];
          if (points && points.length >= 4) {
            const x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3];
            
            const arrowGroup = new Konva.Group({
              draggable: s.attrs.draggable || true,
              x: s.attrs.x || 0,
              y: s.attrs.y || 0,
              rotation: s.attrs.rotation || 0,
              scaleX: s.attrs.scaleX || 1,
              scaleY: s.attrs.scaleY || 1,
            });
            
            // 화살표 치수 계산
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const arrowLength = Math.min(Math.max(length * 0.2, 12), 25);
            
            // 선
            const lineEndX = x2 - (arrowLength * 0.7) * Math.cos(angle);
            const lineEndY = y2 - (arrowLength * 0.7) * Math.sin(angle);
            const arrowLine = new Konva.Line({
              points: [x1, y1, lineEndX, lineEndY],
              stroke: s.attrs.stroke || '#000000',
              strokeWidth: (s.attrs.strokeWidth || 2) * 1.5,
              lineCap: 'round',
            });
            
            // 화살촉
            const arrowHead = new Konva.Line({
              points: [
                x2, y2,
                x2 - arrowLength * Math.cos(angle - Math.PI/6), y2 - arrowLength * Math.sin(angle - Math.PI/6),
                x2 - arrowLength * 0.5 * Math.cos(angle), y2 - arrowLength * 0.5 * Math.sin(angle),
                x2 - arrowLength * Math.cos(angle + Math.PI/6), y2 - arrowLength * Math.sin(angle + Math.PI/6),
                x2, y2
              ],
              stroke: s.attrs.stroke || '#000000',
              strokeWidth: 1,
              fill: s.attrs.stroke || '#000000',
              closed: true,
            });
            
            arrowGroup.add(arrowLine);
            arrowGroup.add(arrowHead);
            arrowGroup.setAttr('tool', 'arrow');
            node = arrowGroup;
          } else {
            // points가 없으면 일반 선으로 폴백
            node = new Konva.Line({ ...s.attrs });
          }
          break;
        default:
          node = new Konva.Line({ ...s.attrs });
          break;
      }
      node.id(s.id);
      layer.add(node);
    }
    return node!;
  }, [findById]);

  // 변화가 있을 때 event를 발생시키는 함수 
  const emit = useCallback((change: Omit<DrawingChange, 'version'>) => {
    const version = ++versionRef.current;
    opts?.onChange?.({ ...change, version } as DrawingChange);
  }, [opts]);

  // 도형 생성 직후 event 
  const onLocalShapeCreated = useCallback((node: Konva.Node, tool: DrawingTool) => {
    ensureId(node);
    node.setAttr('tool', tool);
    layerRef.current?.draw();
    emit({ type: 'add', shape: serialize(node) });
  }, [emit, ensureId, serialize]);

  // 로컬 도형 이동/리사이즈 후 변경 알림
  const onLocalShapeUpdated = useCallback((node: Konva.Node) => {
    ensureId(node);
    layerRef.current?.draw();
    emit({ type: 'update', shape: serialize(node) });
  }, [emit, ensureId, serialize]);

  // undo (마지막 도형 삭제)
  const undoLastShape = () => {
    const layer = layerRef.current;
    if (!layer) return;
    const children = layer.getChildren();
    const last = children[children.length - 1];
    if (!last) return;
    const id = ensureId(last);
    last.destroy();
    layer.draw();
    emit({ type: 'delete', id });
  };

  // 전체 지우기
  const clearCanvas = () => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.destroyChildren();
    layer.draw();
    emit({ type: 'clear' });
  };

  // 현재 레이어의 모든 도형 직렬화 배열 반환
  const getAllShapes = useCallback((): SerializedShape[] => {
    const layer = layerRef.current;
    if (!layer) return [];
    return layer.getChildren().map(serialize);
  }, [serialize]);

  // 원격에서 받은 단일 변경 사항을 로컬 stage에 반영
  const applyRemoteChange = useCallback((change: DrawingChange) => {
    console.log('[APPLY] remote change', change); 
    const layer = layerRef.current;
    if (!layer) return;

    if (change.type === 'clear') {
      layer.destroyChildren();
      layer.draw();
      return;
    }
    if (change.type === 'delete') {
      const node = findById(layer, change.id);
      if (node) node.destroy();
      layer.draw();
      return;
    }
    upsertFromSerialized(layer, change.shape);
    layer.draw();
  }, [findById, upsertFromSerialized]);

  // 원격에서 받은 전체 스냅샷을 로컬 stage에 연결
  const applySnapshot = useCallback((shapes: SerializedShape[], version?: number) => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.destroyChildren();
    shapes.forEach(s => upsertFromSerialized(layer, s));
    layer.draw();
    if (version != null) versionRef.current = version;
  }, [upsertFromSerialized]);

  const handleMouseDown = useCallback((_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return;

    const pos = getScaledPointerPosition(stage);
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
  }, [getScaledPointerPosition]);

  const handleMouseMove = useCallback((_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawingRef.current) return;

    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return;

    const pos = getScaledPointerPosition(stage);
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
  }, [getScaledPointerPosition]);


  // 드로잉 종료 시 생성된 도형을 add 시그널로 올리고, 
  const handleMouseUp = useCallback(() => {
    const layer = layerRef.current;
    if (!isDrawingRef.current || !layer) return;

    // 펜이면 lastLine, 그 외는 드래그 생성된 currentShape
    const node = drawingToolRef.current === 'pen' ? lastLineRef.current : currentShapeRef.current;
    if (!node) {
      console.warn('[END] finalize but no node');
      isDrawingRef.current = false;
      lastLineRef.current = null;
      currentShapeRef.current = null;
      startPointRef.current = null;
      return;
    }

    // 생성 직후: add 시그널 발생 (이게 있어야 상대 화면에 그려짐)
    onLocalShapeCreated(node as Konva.Node, drawingToolRef.current);

    // 이후 이동/리사이즈가 update 시그널로 나가도록 라이프사이클 연결
    // @ts-ignore
    stageRef.current?.__attachNodeLifecycle?.(node as Konva.Node);

    // 드래그 가능 옵션(원하면 유지)
    node.draggable(true);

    // 상태 정리
    isDrawingRef.current = false;
    lastLineRef.current = null;
    currentShapeRef.current = null;
    startPointRef.current = null;

    console.log('그리기 종료(ADD 발행 완료)');
  }, [onLocalShapeCreated]);

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


  // Helper function to create shape during drag
  const createShapeByType = useCallback((
    shapeType: string, 
    x1: number, y1: number, x2: number, y2: number): DrawableNode | null => {
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

    // 드로잉 관리 함수 & 드로잉 데이터 signal 전송
  const initializeCanvas = useCallback((): Konva.Stage | null => {
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

    // Use the existing drawing-canvas div from React
    const canvasContainer = document.getElementById('drawing-canvas') as HTMLDivElement | null;
    if (!canvasContainer) {
      console.error('Drawing canvas element not found');
      return null;
    }

    // 드로잉 입력이 막히지 않도록 보장
    canvasContainer.style.pointerEvents = 'auto';
    
    // Clear any existing Konva content
    canvasContainer.innerHTML = '';

    console.log('Konva Stage 생성 중...', { width, height });

    // Konva Stage 생성 - use container ID string
    const stage = new Konva.Stage({
      container: 'drawing-canvas',
      width: width,
      height: height,
    });

    // Layer 생성
    const layer = new Konva.Layer({ listening: true });
    stage.add(layer);

    // Transformer 생성
    const transformer = new Konva.Transformer({
      nodes: [],
      visible: false,
      rotateEnabled: true,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    });
    layer.add(transformer);

    // 내부 ref 연결
    stageRef.current = stage;
    layerRef.current = layer;
    transformerRef.current = transformer;

    console.log('Konva 초기화 완료');

    // ==== 변경 시 event 전송 로직 ====

    // 1) 기본 포인터 이벤트(그리기/선택)
    stage.on('mousedown touchstart', handleMouseDown);
    stage.on('mousemove touchmove', handleMouseMove);
    stage.on('mouseup touchend', handleMouseUp);
    stage.on('click tap', handleClick);

    // 2) 🔔 드로잉 변경 감지용(시그널링 트리거 포인트)
    //    - 어떤 노드든 dragend/transformend 발생 시 업데이트 이벤트 발생
    stage.on('dragend', (e) => {
      const node = e.target as Konva.Node;
      if (!node || node === stage) return;
      onLocalShapeUpdated(node); // ← STEP 1에서 만든 함수: emit({ type:'update', shape: serialize(node) })
    });
    stage.on('transformend', (e) => {
      const node = e.target as Konva.Node;
      if (!node || node === stage) return;
      onLocalShapeUpdated(node);
    });
    
    // 3) 🔥 더블클릭(또는 더블탭)로 노드 삭제 → delete 이벤트 발생
    stage.on('dblclick dbltap', (e) => {
      const node = e.target as Konva.Node;
      if (!node || node === stage) return;
      const id = ensureId(node);   // 없으면 생성
      node.destroy();
      layer.draw();
      emit({ type: 'delete', id }); // ← STEP 1의 emit
    });

    // 4) 스테이지 포커스 & 키보드 단축키(선택 노드 삭제)
    const containerEl = stage.container();
    containerEl.tabIndex = 1;
    containerEl.focus();
    const onKeyDown = (ev: KeyboardEvent) => {
      // Delete / Backspace
      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        const nodes = transformer.nodes?.() ?? [];
        if (nodes.length > 0) {
          nodes.forEach((n) => {
            const id = ensureId(n);
            n.destroy();
            emit({ type: 'delete', id });
          });
          layer.draw();
          transformer.nodes([]); // 선택 해제
          transformer.visible(false);
          layer.draw();
        }
      }
    };
    containerEl.addEventListener('keydown', onKeyDown);

    // 5) 컨테이너 리사이즈 대응 (차트 영역 크기 변동 시 Stage 동기화)
    const ro = new ResizeObserver(() => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w > 0 && h > 0) {
        stage.size({ width: w, height: h });
        layer.batchDraw();
      }
    });
    ro.observe(container);

    
    // 6) 스크롤 방지(차트 스크롤과 충돌 방지하고 싶으면 유지)
    stage.on('wheel', (e) => {
      // 필요 시 확대/축소를 막거나 커스텀 줌과 연동
      e.evt.preventDefault();
    });

    // 생성된 노드에 lifecycle event 달기 위한 헬퍼
    const attachNodeLifecycle = (node: Konva.Node) => {
      // 업데이트 시그널
      node.on('dragend transformend', () => onLocalShapeUpdated(node));
      // 필요시 단일 클릭으로 선택해서 transformer 표시하는 로직 등 추가 가능
    };  

    // 전역으로 접근 가능하게 저장
    (stage as any).__attachNodeLifecycle = attachNodeLifecycle;

    //cleanup은 훅의 cleanup에서 stage.distroy() 시 자동으로 대부분 정리
    (stage as any).__cleanup = () => {
      ro.disconnect();
      containerEl.removeEventListener('keydown', onKeyDown);
    };


    return stage;
  }, [  containerRef,
  handleMouseDown, handleMouseMove, handleMouseUp, handleClick,
  onLocalShapeUpdated, emit, ensureId]);

  // Update chart context for proper coordinate mapping
  const updateChartContext = useCallback((context: {
    totalDataPoints: number;
    actualDataPoints: number;
    futureDataPoints: number;
    hasFutureSpace: boolean;
  }) => {
    chartContextRef.current = context;
    
    // If stage exists and future space changed, re-calculate positions
    if (stageRef.current && layerRef.current) {
      // Trigger re-draw to update positions if needed
      layerRef.current.batchDraw();
    }
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
    getAllShapes,
    applyRemoteChange,
    applySnapshot,      
    onLocalShapeCreated,
    onLocalShapeUpdated,
    updateChartContext,
  };
};