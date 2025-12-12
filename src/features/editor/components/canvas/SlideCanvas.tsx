import { Stage, Layer, Rect } from 'react-konva';
import { useEditorStore } from '../../store';
import { ElementType } from '../../types';
import KonvaTextElement from './KonvaTextElement';
import KonvaImageElement from './KonvaImageElement';
import KonvaShapeElement from './KonvaShapeElement';

export default function SlideCanvas() {
  const activePresentationId = useEditorStore((s) => s.activePresentationId);
  const presentation = useEditorStore((s) =>
    s.activePresentationId ? s.presentations[s.activePresentationId] : null
  );
  const selectedSlideId = useEditorStore((s) =>
    s.activePresentationId ? s.selectedSlideIds[s.activePresentationId] : null
  );
  const selectedElementId = useEditorStore((s) =>
    s.activePresentationId ? s.selectedElementIds[s.activePresentationId] : null
  );
  const selectElement = useEditorStore((s) => s.selectElement);

  if (!presentation || !selectedSlideId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-200">
        <p className="text-gray-500">No slide selected</p>
      </div>
    );
  }

  const slide = presentation.slides[selectedSlideId];

  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-200">
        <p className="text-gray-500">Slide not found</p>
      </div>
    );
  }

  const { width, height } = slide.dimensions;
  const scale = 0.6; // Scale down for display

  const stageWidth = width * scale;
  const stageHeight = height * scale;

  const handleStageClick = (e: any) => {
    // Deselect when clicking on empty area (Stage or Background Rect)
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    if (clickedOnEmpty && activePresentationId) {
      selectElement(activePresentationId, null);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-200 p-8">
      <div className="flex items-center justify-center min-h-full">
        <div className="shadow-2xl relative">
          <Stage
            width={stageWidth}
            height={stageHeight}
            scaleX={scale}
            scaleY={scale}
            onClick={handleStageClick}
            onTap={handleStageClick}
          >
            <Layer>
              {/* Background */}
              <Rect
                name="background"
                x={0}
                y={0}
                width={width}
                height={height}
                fill={slide.background.fill || '#ffffff'}
              />

              {/* Render elements */}
              {slide.elementIds.map((elementId) => {
                const element = slide.elements[elementId];
                if (!element) return null;

                const isSelected = elementId === selectedElementId;

                switch (element.type) {
                  case ElementType.Text:
                    return (
                      <KonvaTextElement
                        key={elementId}
                        element={element}
                        slideId={selectedSlideId}
                        isSelected={isSelected}
                        onSelect={() => activePresentationId && selectElement(activePresentationId, elementId)}
                      />
                    );

                  case ElementType.Image:
                    return (
                      <KonvaImageElement
                        key={elementId}
                        element={element}
                        slideId={selectedSlideId}
                        isSelected={isSelected}
                        onSelect={() => activePresentationId && selectElement(activePresentationId, elementId)}
                      />
                    );

                  case ElementType.Rectangle:
                  case ElementType.Circle:
                  case ElementType.Ellipse:
                  case ElementType.Polygon:
                  case ElementType.Star:
                    return (
                      <KonvaShapeElement
                        key={elementId}
                        element={element}
                        slideId={selectedSlideId}
                        isSelected={isSelected}
                        onSelect={() => activePresentationId && selectElement(activePresentationId, elementId)}
                      />
                    );

                  default:
                    return null;
                }
              })}
            </Layer>
          </Stage>

          {/* Watermark for empty slides (overlay) */}
          {slide.elementIds.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <div className="text-2xl font-bold mb-2">{slide.name}</div>
                <div className="text-sm">
                  <p>Empty slide - Add elements from the toolbar</p>
                </div>
                <div className="text-xs mt-4 text-gray-300">
                  {width} × {height}px
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
