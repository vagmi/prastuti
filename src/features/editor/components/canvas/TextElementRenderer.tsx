import { useState, useRef, useEffect } from 'react';
import { TextElement } from '../../types';
import { useEditorStore } from '../../store';
import TransformControls from './TransformControls';

interface TextElementRendererProps {
  element: TextElement;
  slideId: string;
  scale: number;
  isSelected: boolean;
}

export default function TextElementRenderer({
  element,
  slideId,
  scale,
  isSelected,
}: TextElementRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(element.text);
  const textRef = useRef<HTMLDivElement>(null);
  const updateElement = useEditorStore((s) => s.updateElement);
  const selectElement = useEditorStore((s) => s.selectElement);
  const takeSnapshot = useEditorStore((s) => s.takeSnapshot);

  useEffect(() => {
    setEditText(element.text);
  }, [element.text]);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      // Select all text
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editText !== element.text) {
      updateElement(slideId, element.id, { text: editText });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(element.text); // Revert changes
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      selectElement(element.id);
    }
  };

  const handleTransform = (props: Partial<TextElement>) => {
    updateElement(slideId, element.id, props);
  };

  const handleTransformEnd = () => {
    takeSnapshot();
  };

  const fontStyle = element.fontStyle || 'normal';
  const isBold = fontStyle.includes('bold');
  const isItalic = fontStyle.includes('italic');

  return (
    <>
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className="absolute cursor-pointer"
        style={{
          left: `${element.x * scale}px`,
          top: `${element.y * scale}px`,
          width: `${element.width * scale}px`,
          height: `${element.height * scale}px`,
          transform: `rotate(${element.rotation}deg) scale(${element.scaleX}, ${element.scaleY})`,
          opacity: element.opacity,
          visibility: element.visible ? 'visible' : 'hidden',
          transformOrigin: 'top left',
        }}
      >
      {isEditing ? (
        <div
          ref={textRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onInput={(e) => setEditText(e.currentTarget.textContent || '')}
          className="w-full h-full outline-none bg-white bg-opacity-10"
          style={{
            fontSize: `${element.fontSize * scale}px`,
            fontFamily: element.fontFamily,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            color: element.fill,
            textAlign: element.align,
            lineHeight: element.lineHeight,
            letterSpacing: `${element.letterSpacing}px`,
            textDecoration: element.textDecoration,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {editText}
        </div>
      ) : (
        <div
          className="w-full h-full"
          style={{
            fontSize: `${element.fontSize * scale}px`,
            fontFamily: element.fontFamily,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            color: element.fill,
            textAlign: element.align,
            lineHeight: element.lineHeight,
            letterSpacing: `${element.letterSpacing}px`,
            textDecoration: element.textDecoration,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            pointerEvents: 'none',
          }}
        >
          {element.text}
        </div>
      )}
      </div>

      {/* Transform Controls (only show when selected and not editing) */}
      {isSelected && !isEditing && (
        <TransformControls
          element={element}
          scale={scale}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
        />
      )}
    </>
  );
}
