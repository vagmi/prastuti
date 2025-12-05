import { useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text as KonvaText } from 'react-konva';
import { useEditorStore } from '../../store';
import { ElementType } from '../../types';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface SlideShowProps {
  onClose: () => void;
}

export default function SlideShow({ onClose }: SlideShowProps) {
  const presentation = useEditorStore((s) => s.presentation);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const slideIds = presentation?.slideIds || [];
  const currentSlide = presentation?.slides[slideIds[currentSlideIndex]];

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(prev + 1, slideIds.length - 1));
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setCurrentSlideIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setCurrentSlideIndex(slideIds.length - 1);
        break;
      case 'Escape':
        // Exit fullscreen before closing
        const exitAndClose = async () => {
          try {
            const appWindow = getCurrentWindow();
            await appWindow.setFullscreen(false);
          } catch (err) {
            console.error('Failed to exit fullscreen:', err);
          }
          onClose();
        };
        exitAndClose();
        break;
    }
  }, [slideIds.length, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Full screen management using Tauri's native API
  const toggleFullScreen = async () => {
    try {
      const appWindow = getCurrentWindow();
      const currentFullscreen = await appWindow.isFullscreen();
      await appWindow.setFullscreen(!currentFullscreen);
      setIsFullScreen(!currentFullscreen);
    } catch (err) {
      console.error('Failed to toggle fullscreen:', err);
    }
  };

  // Check initial fullscreen state and set up monitoring
  useEffect(() => {
    const checkFullscreen = async () => {
      try {
        const appWindow = getCurrentWindow();
        const isFull = await appWindow.isFullscreen();
        setIsFullScreen(isFull);
      } catch (err) {
        console.error('Failed to check fullscreen status:', err);
      }
    };

    checkFullscreen();

    // Enter fullscreen when slideshow starts
    const enterFullscreen = async () => {
      try {
        const appWindow = getCurrentWindow();
        await appWindow.setFullscreen(true);
        setIsFullScreen(true);
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    };

    enterFullscreen();

    // Exit fullscreen when component unmounts
    return () => {
      const exitFullscreen = async () => {
        try {
          const appWindow = getCurrentWindow();
          await appWindow.setFullscreen(false);
        } catch (err) {
          console.error('Failed to exit fullscreen:', err);
        }
      };
      exitFullscreen();
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    timeout = setTimeout(() => setShowControls(false), 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const goToNext = () => {
    setCurrentSlideIndex((prev) => Math.min(prev + 1, slideIds.length - 1));
  };

  const goToPrevious = () => {
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
  };

  if (!currentSlide || !presentation) {
    return null;
  }

  const { width, height } = currentSlide.dimensions;

  // Calculate scaling to fit screen
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const scaleX = screenWidth / width;
  const scaleY = screenHeight / height;
  const scale = Math.min(scaleX, scaleY);

  const stageWidth = width * scale;
  const stageHeight = height * scale;

  // Center the stage
  const offsetX = (screenWidth - stageWidth) / 2;
  const offsetY = (screenHeight - stageHeight) / 2;

  const renderTextElement = (element: any) => {
    const fontStyle = element.fontStyle || 'normal';
    const isBold = fontStyle.includes('bold');
    const isItalic = fontStyle.includes('italic');

    return (
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
        align={element.align}
        verticalAlign={element.verticalAlign}
        lineHeight={element.lineHeight}
        letterSpacing={element.letterSpacing}
        textDecoration={element.textDecoration}
        rotation={element.rotation}
        opacity={element.opacity}
        visible={element.visible}
      />
    );
  };

  // Determine if the slide has a dark background
  const slideBackgroundColor = currentSlide.background.fill || '#ffffff';
  const isDarkSlide = slideBackgroundColor.toLowerCase() !== '#ffffff' &&
                      slideBackgroundColor.toLowerCase() !== '#fff';

  // Use black background only if slide background is white/light
  const outerBackgroundColor = isDarkSlide ? slideBackgroundColor : '#000000';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300"
      style={{ backgroundColor: outerBackgroundColor }}
    >
      {/* Slide Stage */}
      <div style={{ marginLeft: `${offsetX}px`, marginTop: `${offsetY}px` }}>
        <Stage width={stageWidth} height={stageHeight} scaleX={scale} scaleY={scale}>
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill={slideBackgroundColor}
            />

            {/* Render elements */}
            {currentSlide.elementIds.map((elementId) => {
              const element = currentSlide.elements[elementId];
              if (!element || !element.visible) return null;

              switch (element.type) {
                case ElementType.Text:
                  return renderTextElement(element);
                default:
                  return null;
              }
            })}
          </Layer>
        </Stage>
      </div>

      {/* Controls Overlay */}
      <div
        className={`fixed inset-x-0 bottom-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                disabled={currentSlideIndex === 0}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous (← or PageUp)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <span className="text-white text-sm px-4">
                {currentSlideIndex + 1} / {slideIds.length}
              </span>

              <button
                onClick={goToNext}
                disabled={currentSlideIndex === slideIds.length - 1}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next (→, Space, or PageDown)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Center - Slide Indicator */}
            <div className="flex gap-1">
              {slideIds.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlideIndex
                      ? 'bg-white w-4'
                      : 'bg-white bg-opacity-40 hover:bg-opacity-60'
                  }`}
                  title={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullScreen}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
                title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullScreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
                title="Exit (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div
        className={`fixed top-4 right-4 text-white text-xs bg-black bg-opacity-50 backdrop-blur-sm px-3 py-2 rounded transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="space-y-1">
          <div>← → : Navigate</div>
          <div>Space : Next</div>
          <div>Esc : Exit</div>
        </div>
      </div>
    </div>
  );
}
