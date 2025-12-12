import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage, Circle, Ellipse, RegularPolygon, Star } from 'react-konva';
import useImage from 'use-image';
import { resolveAssetUrl } from '../../services/assetService';
import { useEditorStore } from '../../store';
import { Slide, ElementType } from '../../types';

// Helper to render image in thumbnail
function ThumbnailImage({ element, onLoad }: { element: any; onLoad?: () => void }) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [hasNotifiedLoad, setHasNotifiedLoad] = useState(false);

  // Reset notification flag when source changes
  useEffect(() => {
    setHasNotifiedLoad(false);
    setResolvedSrc(null);
  }, [element.src]);

  // Resolve asset:// URLs
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

  const [image, status] = useImage(resolvedSrc || '', 'anonymous');

  // Notify parent when image loads
  useEffect(() => {
    console.log('[ThumbnailImage] status:', status, 'hasNotifiedLoad:', hasNotifiedLoad, 'src:', element.src);
    if (status === 'loaded' && !hasNotifiedLoad && onLoad) {
      console.log('[ThumbnailImage] Calling onLoad for:', element.src);
      setHasNotifiedLoad(true);
      onLoad();
    }
  }, [status, hasNotifiedLoad, onLoad, element.src]);

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(slide.thumbnail || null);
  const [stageReady, setStageReady] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const generateSlideThumbnail = useEditorStore((s) => s.generateSlideThumbnail);

  // Count total images in slide
  useEffect(() => {
    const imageCount = slide.elementIds.filter(id => {
      const element = slide.elements[id];
      return element?.type === 'image';
    }).length;
    console.log('[SlideThumbnail] Image count for slide:', slide.id, '=', imageCount);
    setTotalImages(imageCount);
    setImagesLoaded(0);
  }, [slide.elementIds, slide.elements, slide.id]);

  // Set initial thumbnail if it exists
  useEffect(() => {
    if (slide.thumbnail) {
      setThumbnailUrl(slide.thumbnail);
    }
  }, [slide.thumbnail]);

  // Mark stage as ready after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setStageReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Generate thumbnail when stage is ready, all images loaded, and thumbnail doesn't exist
  useEffect(() => {
    console.log('[SlideThumbnail] Generation check:', {
      slideId: slide.id,
      stageReady,
      hasThumbnail: !!slide.thumbnail,
      hasStageRef: !!stageRef.current,
      imagesLoaded,
      totalImages,
    });

    if (!stageReady || slide.thumbnail || !stageRef.current) {
      return;
    }

    // Wait for all images to load before generating
    if (totalImages > 0 && imagesLoaded < totalImages) {
      console.log('[SlideThumbnail] Waiting for images:', imagesLoaded, '/', totalImages);
      return;
    }

    console.log('[SlideThumbnail] Generating thumbnail for slide:', slide.id);
    let isMounted = true;

    const generateThumbnail = async () => {
      try {
        // Small delay to ensure Konva has rendered everything
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!isMounted || !stageRef.current) return;

        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });

        if (isMounted) {
          console.log('[SlideThumbnail] Thumbnail generated for slide:', slide.id);
          setThumbnailUrl(dataUrl);
          // Save thumbnail to slide data (will be included in .prst file on save)
          generateSlideThumbnail(slide.id, dataUrl);
        }
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }
    };

    generateThumbnail();

    return () => {
      isMounted = false;
    };
  }, [stageReady, slide.id, slide.thumbnail, imagesLoaded, totalImages, generateSlideThumbnail]);

  const handleImageLoad = () => {
    console.log('[SlideThumbnail] Image loaded, incrementing count');
    setImagesLoaded(prev => {
      const newCount = prev + 1;
      console.log('[SlideThumbnail] Images loaded:', newCount, '/', totalImages);
      return newCount;
    });
  };

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
                  return <ThumbnailImage key={element.id} element={element} onLoad={handleImageLoad} />;
                case ElementType.Rectangle:
                  return (
                    <Rect
                      key={element.id}
                      x={element.x}
                      y={element.y}
                      width={element.width}
                      height={element.height}
                      rotation={element.rotation}
                      opacity={element.opacity}
                      fill={element.fill}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                      cornerRadius={element.cornerRadius || 0}
                    />
                  );
                case ElementType.Circle:
                  return (
                    <Circle
                      key={element.id}
                      x={element.x}
                      y={element.y}
                      radius={Math.min(element.width, element.height) / 2}
                      offsetX={-element.width / 2}
                      offsetY={-element.height / 2}
                      rotation={element.rotation}
                      opacity={element.opacity}
                      fill={element.fill}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                    />
                  );
                case ElementType.Ellipse:
                  return (
                    <Ellipse
                      key={element.id}
                      x={element.x}
                      y={element.y}
                      radiusX={element.width / 2}
                      radiusY={element.height / 2}
                      offsetX={-element.width / 2}
                      offsetY={-element.height / 2}
                      rotation={element.rotation}
                      opacity={element.opacity}
                      fill={element.fill}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                    />
                  );
                case ElementType.Polygon:
                  return (
                    <RegularPolygon
                      key={element.id}
                      x={element.x}
                      y={element.y}
                      sides={element.sides || 6}
                      radius={Math.min(element.width, element.height) / 2}
                      offsetX={-element.width / 2}
                      offsetY={-element.height / 2}
                      rotation={element.rotation}
                      opacity={element.opacity}
                      fill={element.fill}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                    />
                  );
                case ElementType.Star:
                  const outerRadius = Math.min(element.width, element.height) / 2;
                  const innerRadiusRatio = element.innerRadius || 0.5;
                  const innerRadius = outerRadius * innerRadiusRatio;
                  return (
                    <Star
                      key={element.id}
                      x={element.x}
                      y={element.y}
                      numPoints={element.points || 5}
                      outerRadius={outerRadius}
                      innerRadius={innerRadius}
                      offsetX={-element.width / 2}
                      offsetY={-element.height / 2}
                      rotation={element.rotation}
                      opacity={element.opacity}
                      fill={element.fill}
                      stroke={element.stroke}
                      strokeWidth={element.strokeWidth}
                    />
                  );
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
