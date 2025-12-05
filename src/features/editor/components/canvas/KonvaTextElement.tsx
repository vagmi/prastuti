import { useEffect, useRef, useState } from 'react';
import { Text as KonvaText, Transformer } from 'react-konva';
import Konva from 'konva';
import { TextElement } from '../../types';
import { useEditorStore } from '../../store';

interface KonvaTextElementProps {
  element: TextElement;
  slideId: string;
  isSelected: boolean;
  onSelect: () => void;
}

export default function KonvaTextElement({
  element,
  slideId,
  isSelected,
  onSelect,
}: KonvaTextElementProps) {
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [isEditing, setIsEditing] = useState(false);

  const updateElement = useEditorStore((s) => s.updateElement);
  const takeSnapshot = useEditorStore((s) => s.takeSnapshot);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      // Attach transformer to text element
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    updateElement(slideId, element.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
    takeSnapshot();
  };

  const handleTransformEnd = () => {
    const node = textRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and apply it to width/height
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

  const handleDoubleClick = () => {
    setIsEditing(true);
    const node = textRef.current;
    if (!node) return;

    // Hide text node and transformer
    node.hide();
    trRef.current?.hide();

    // Create textarea for editing
    const stage = node.getStage();
    if (!stage) return;

    const textPosition = node.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    const rotation = node.rotation();

    // Create textarea
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    // Style textarea to match text element
    textarea.value = element.text;
    textarea.style.position = 'absolute';
    textarea.style.top = `${stageBox.top + textPosition.y}px`;
    textarea.style.left = `${stageBox.left + textPosition.x}px`;
    textarea.style.width = `${node.width()}px`;
    textarea.style.height = `${node.height()}px`;
    textarea.style.fontSize = `${element.fontSize}px`;
    textarea.style.fontFamily = element.fontFamily;
    textarea.style.fontWeight = element.fontStyle.includes('bold') ? 'bold' : 'normal';
    textarea.style.fontStyle = element.fontStyle.includes('italic') ? 'italic' : 'normal';
    textarea.style.color = element.fill;
    textarea.style.textAlign = element.align;
    textarea.style.lineHeight = `${element.lineHeight}`;
    textarea.style.letterSpacing = `${element.letterSpacing}px`;
    textarea.style.textDecoration = element.textDecoration;
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.border = '2px solid #9333ea';
    textarea.style.outline = 'none';
    textarea.style.background = 'rgba(255, 255, 255, 0.9)';
    textarea.style.overflow = 'hidden';
    textarea.style.resize = 'none';
    textarea.style.transform = `rotate(${rotation}deg)`;
    textarea.style.transformOrigin = 'left top';
    textarea.style.zIndex = '1000';

    textarea.focus();
    textarea.select();

    const removeTextarea = () => {
      document.body.removeChild(textarea);
      node.show();
      trRef.current?.show();
      setIsEditing(false);

      // Update text content
      if (textarea.value !== element.text) {
        updateElement(slideId, element.id, { text: textarea.value });
        takeSnapshot();
      }
    };

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        removeTextarea();
      }
      // Stop propagation to prevent interference
      e.stopPropagation();
    });

    textarea.addEventListener('blur', removeTextarea);
  };

  const fontStyle = element.fontStyle || 'normal';
  const isBold = fontStyle.includes('bold');
  const isItalic = fontStyle.includes('italic');

  return (
    <>
      <KonvaText
        ref={textRef}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        text={element.text}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fontStyle={`${isBold ? 'bold' : ''} ${isItalic ? 'italic' : ''}`.trim() || 'normal'}
        fill={element.fill}
        align={element.align}
        verticalAlign={element.verticalAlign}
        lineHeight={element.lineHeight}
        letterSpacing={element.letterSpacing}
        textDecoration={element.textDecoration}
        rotation={element.rotation}
        opacity={element.opacity}
        visible={element.visible && !isEditing}
        draggable={!isEditing}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
      />
      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'top-center',
            'bottom-center',
            'middle-left',
            'middle-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
