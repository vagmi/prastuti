import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { resolveAssetUrl } from '../../services/assetService';
import { Slide, ElementType } from '../../types';

// Helper to render image in thumbnail
function ThumbnailImage({ element }: { element: any }) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  useEffect(() => {
    const loadSrc = async () => {
      let src = element.src;

      // Resolve asset:// URLs through the asset service
      if (src.startsWith('asset://')) {
        const dataUrl = await resolveAssetUrl(src);
        src = dataUrl || src;
      }

      setResolvedSrc(src);
    };

    loadSrc();
  }, [element.src]);

  const [image] = useImage(resolvedSrc || '', 'anonymous');
  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
    />
  );
}

interface SlideThumbnailProps {
  slide: Slide;
  width?: number;
  height?: number;
}

export default function SlideThumbnail({ slide, width = 160, height = 96 }: SlideThumbnailProps) {
  const stageRef = useRef<any>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    // Generate thumbnail after component mounts and when slide changes
    const generateThumbnail = async () => {
      if (stageRef.current) {
        try {
          // Small delay to ensure Konva has rendered
          await new Promise(resolve => setTimeout(resolve, 100));

          const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
          setThumbnailUrl(dataUrl);
        } catch (error) {
          console.error('Error generating thumbnail:', error);
        }
      }
    };

    generateThumbnail();
  }, [slide]);

  const { width: slideWidth, height: slideHeight } = slide.dimensions;

  // Calculate scaling to fit thumbnail dimensions
  const scaleX = width / slideWidth;
  const scaleY = height / slideHeight;
  const scale = Math.min(scaleX, scaleY);

  const renderTextElement = (element: any) => {
    const fontStyle = element.fontStyle || 'normal';
    const isBold = fontStyle.includes('bold');
    const isItalic = fontStyle.includes('italic');

    return (
      <>
        {/* Stroke layer - render behind with only stroke */}
        {element.strokeWidth && element.strokeWidth > 0 && (
          <KonvaText
            key={`${element.id}-stroke`}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            text={element.text}
            fontSize={element.fontSize}
            fontFamily={element.fontFamily}
            fontStyle={`${isBold ? 'bold' : ''} ${isItalic ? 'italic' : ''}`.trim() || 'normal'}
            fillEnabled={false}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            align={element.align}
            verticalAlign={element.verticalAlign}
            lineHeight={element.lineHeight}
            letterSpacing={element.letterSpacing}
            textDecoration={element.textDecoration}
            rotation={element.rotation}
            opacity={element.opacity}
            visible={element.visible}
            listening={false}
          />
        )}

        {/* Fill layer - render on top with only fill */}
        <KonvaText
          key={element.id}
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          text={element.text}
          fontSize={element.fontSize}
          fontFamily={element.fontFamily}
          fontStyle={`${isBold ? 'bold' : ''} ${isItalic ? 'italic' : ''}`.trim() || 'normal'}
          fill={element.fill}
          strokeEnabled={false}
          align={element.align}
          verticalAlign={element.verticalAlign}
          lineHeight={element.lineHeight}
          letterSpacing={element.letterSpacing}
          textDecoration={element.textDecoration}
          rotation={element.rotation}
          opacity={element.opacity}
          visible={element.visible}
        />
      </>
    );
  };

  return (
    <>
      {/* Hidden Konva Stage for rendering */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          scaleX={scale}
          scaleY={scale}
        >
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={slideWidth}
              height={slideHeight}
              fill={slide.background.fill || '#ffffff'}
            />

            {/* Render elements */}
            {slide.elementIds.map((elementId) => {
              const element = slide.elements[elementId];
              if (!element || !element.visible) return null;

              switch (element.type) {
                case ElementType.Text:
                  return renderTextElement(element);
                case ElementType.Image:
                  return <ThumbnailImage key={element.id} element={element} />;
                default:
                  return null;
              }
            })}
          </Layer>
        </Stage>
      </div>

      {/* Display the captured thumbnail */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={slide.name}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <span className="text-xs text-gray-400">Loading...</span>
        </div>
      )}
    </>
  );
}
