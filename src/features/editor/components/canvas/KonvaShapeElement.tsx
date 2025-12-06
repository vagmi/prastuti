import { useEffect, useRef } from 'react';
import { Rect, Circle, Ellipse, RegularPolygon, Star, Transformer } from 'react-konva';
import { useEditorStore } from '../../store';
import type { ShapeElement } from '../../types';
import { ElementType } from '../../types';
import Konva from 'konva';

interface KonvaShapeElementProps {
  element: ShapeElement;
  slideId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export default function KonvaShapeElement({
  element,
  slideId,
  isSelected,
  onSelect,
}: KonvaShapeElementProps) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const takeSnapshot = useEditorStore((s) => s.takeSnapshot);
  const shapeRef = useRef<Konva.Shape>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && shapeRef.current && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    updateElement(slideId, element.id, {
      x: node.x(),
      y: node.y(),
    });
    takeSnapshot();
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update width/height instead
    node.scaleX(1);
    node.scaleY(1);

    updateElement(slideId, element.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
    takeSnapshot();
  };

  const commonProps = {
    ref: shapeRef,
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    opacity: element.opacity,
    fill: element.fill,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    draggable: isSelected,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
  };

  const renderShape = () => {
    switch (element.type) {
      case ElementType.Rectangle:
        return (
          <Rect
            {...commonProps}
            width={element.width}
            height={element.height}
            cornerRadius={element.cornerRadius || 0}
          />
        );

      case ElementType.Circle:
        return (
          <Circle
            {...commonProps}
            radius={Math.min(element.width, element.height) / 2}
            offsetX={-element.width / 2}
            offsetY={-element.height / 2}
          />
        );

      case ElementType.Ellipse:
        return (
          <Ellipse
            {...commonProps}
            radiusX={element.width / 2}
            radiusY={element.height / 2}
            offsetX={-element.width / 2}
            offsetY={-element.height / 2}
          />
        );

      case ElementType.Polygon:
        const sides = element.sides || 6;
        const radius = Math.min(element.width, element.height) / 2;
        return (
          <RegularPolygon
            {...commonProps}
            sides={sides}
            radius={radius}
            offsetX={-element.width / 2}
            offsetY={-element.height / 2}
          />
        );

      case ElementType.Star:
        const points = element.points || 5;
        const outerRadius = Math.min(element.width, element.height) / 2;
        const innerRadiusRatio = element.innerRadius || 0.5;
        const innerRadius = outerRadius * innerRadiusRatio;
        return (
          <Star
            {...commonProps}
            numPoints={points}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            offsetX={-element.width / 2}
            offsetY={-element.height / 2}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderShape()}

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center',
          ]}
          borderStroke="#7c3aed"
          borderStrokeWidth={2}
          anchorStroke="#7c3aed"
          anchorFill="#ffffff"
          anchorSize={8}
          anchorCornerRadius={4}
        />
      )}
    </>
  );
}
