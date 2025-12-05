import { useState, useRef, useEffect } from 'react';
import { Element } from '../../types';

interface TransformControlsProps {
  element: Element;
  scale: number;
  onTransform: (props: Partial<Element>) => void;
  onTransformEnd: () => void;
}

export default function TransformControls({
  element,
  scale,
  onTransform,
  onTransformEnd,
}: TransformControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');

  const dragStartRef = useRef({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const rotateStartRef = useRef({ angle: 0, centerX: 0, centerY: 0 });
  const resizeStartRef = useRef({
    x: 0, y: 0,
    width: 0, height: 0,
    elementX: 0, elementY: 0
  });

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      elementX: element.x,
      elementY: element.y,
    };
  };

  // Rotation handlers
  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRotating(true);

    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;

    const angle = Math.atan2(
      e.clientY / scale - centerY,
      e.clientX / scale - centerX
    ) * (180 / Math.PI);

    rotateStartRef.current = {
      angle: angle - element.rotation,
      centerX,
      centerY,
    };
  };

  // Resize handlers
  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);

    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: element.width,
      height: element.height,
      elementX: element.x,
      elementY: element.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = (e.clientX - dragStartRef.current.x) / scale;
        const deltaY = (e.clientY - dragStartRef.current.y) / scale;

        onTransform({
          x: dragStartRef.current.elementX + deltaX,
          y: dragStartRef.current.elementY + deltaY,
        });
      } else if (isRotating) {
        const centerX = rotateStartRef.current.centerX;
        const centerY = rotateStartRef.current.centerY;

        const angle = Math.atan2(
          e.clientY / scale - centerY,
          e.clientX / scale - centerX
        ) * (180 / Math.PI);

        let rotation = angle - rotateStartRef.current.angle;

        // Snap to 15-degree increments if shift is held
        if (e.shiftKey) {
          rotation = Math.round(rotation / 15) * 15;
        }

        onTransform({ rotation });
      } else if (isResizing) {
        const deltaX = (e.clientX - resizeStartRef.current.x) / scale;
        const deltaY = (e.clientY - resizeStartRef.current.y) / scale;

        const updates: Partial<Element> = {};

        switch (resizeDirection) {
          case 'nw':
            updates.x = resizeStartRef.current.elementX + deltaX;
            updates.y = resizeStartRef.current.elementY + deltaY;
            updates.width = resizeStartRef.current.width - deltaX;
            updates.height = resizeStartRef.current.height - deltaY;
            break;
          case 'ne':
            updates.y = resizeStartRef.current.elementY + deltaY;
            updates.width = resizeStartRef.current.width + deltaX;
            updates.height = resizeStartRef.current.height - deltaY;
            break;
          case 'sw':
            updates.x = resizeStartRef.current.elementX + deltaX;
            updates.width = resizeStartRef.current.width - deltaX;
            updates.height = resizeStartRef.current.height + deltaY;
            break;
          case 'se':
            updates.width = resizeStartRef.current.width + deltaX;
            updates.height = resizeStartRef.current.height + deltaY;
            break;
          case 'n':
            updates.y = resizeStartRef.current.elementY + deltaY;
            updates.height = resizeStartRef.current.height - deltaY;
            break;
          case 's':
            updates.height = resizeStartRef.current.height + deltaY;
            break;
          case 'w':
            updates.x = resizeStartRef.current.elementX + deltaX;
            updates.width = resizeStartRef.current.width - deltaX;
            break;
          case 'e':
            updates.width = resizeStartRef.current.width + deltaX;
            break;
        }

        // Maintain aspect ratio if shift is held
        if (e.shiftKey && ['nw', 'ne', 'sw', 'se'].includes(resizeDirection)) {
          const aspectRatio = resizeStartRef.current.width / resizeStartRef.current.height;
          if (updates.width) {
            updates.height = updates.width / aspectRatio;
          }
        }

        // Minimum size
        if (updates.width && updates.width < 20) updates.width = 20;
        if (updates.height && updates.height < 20) updates.height = 20;

        onTransform(updates);
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isRotating || isResizing) {
        setIsDragging(false);
        setIsRotating(false);
        setIsResizing(false);
        setResizeDirection('');
        onTransformEnd();
      }
    };

    if (isDragging || isRotating || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isRotating, isResizing, resizeDirection, element, scale, onTransform, onTransformEnd]);

  const handleStyle = 'w-3 h-3 bg-white border-2 border-purple-500 rounded-full absolute cursor-pointer hover:scale-150 transition-transform';

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${element.x * scale}px`,
        top: `${element.y * scale}px`,
        width: `${element.width * scale}px`,
        height: `${element.height * scale}px`,
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: 'top left',
      }}
    >
      {/* Selection Border */}
      <div
        className="absolute inset-0 border-2 border-purple-500 pointer-events-auto cursor-move"
        onMouseDown={handleMouseDown}
      />

      {/* Corner Resize Handles */}
      <div
        className={handleStyle}
        style={{ top: '-6px', left: '-6px', cursor: 'nw-resize' }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
      />
      <div
        className={handleStyle}
        style={{ top: '-6px', right: '-6px', cursor: 'ne-resize' }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
      />
      <div
        className={handleStyle}
        style={{ bottom: '-6px', left: '-6px', cursor: 'sw-resize' }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
      />
      <div
        className={handleStyle}
        style={{ bottom: '-6px', right: '-6px', cursor: 'se-resize' }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
      />

      {/* Side Resize Handles */}
      <div
        className={handleStyle}
        style={{ top: '-6px', left: '50%', marginLeft: '-6px', cursor: 'n-resize' }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
      />
      <div
        className={handleStyle}
        style={{ bottom: '-6px', left: '50%', marginLeft: '-6px', cursor: 's-resize' }}
        onMouseDown={(e) => handleResizeMouseDown(e, 's')}
      />
      <div
        className={handleStyle}
        style={{ top: '50%', left: '-6px', marginTop: '-6px', cursor: 'w-resize' }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
      />
      <div
        className={handleStyle}
        style={{ top: '50%', right: '-6px', marginTop: '-6px', cursor: 'e-resize' }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
      />

      {/* Rotation Handle */}
      <div
        className="absolute pointer-events-auto"
        style={{ top: '-40px', left: '50%', transform: 'translateX(-50%)' }}
      >
        <div className="flex flex-col items-center">
          <div
            className="w-4 h-4 bg-purple-500 rounded-full cursor-pointer hover:scale-125 transition-transform"
            onMouseDown={handleRotateMouseDown}
            title="Rotate"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div className="w-0.5 h-6 bg-purple-500" />
        </div>
      </div>
    </div>
  );
}
