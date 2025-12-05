import { useEditorStore } from '../../store';

export default function SlideCanvas() {
  const presentation = useEditorStore((s) => s.presentation);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);

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

  return (
    <div className="flex-1 overflow-auto bg-gray-200 p-8">
      <div className="flex items-center justify-center min-h-full">
        <div
          className="bg-white shadow-2xl relative"
          style={{
            width: `${width * scale}px`,
            height: `${height * scale}px`,
            backgroundColor: slide.background.fill || '#ffffff',
          }}
        >
          {/* Slide Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-2xl font-bold mb-2">{slide.name}</div>
              <div className="text-sm">
                {slide.elementIds.length === 0 ? (
                  <p>Empty slide - Add elements from the toolbar</p>
                ) : (
                  <p>{slide.elementIds.length} element(s) on this slide</p>
                )}
              </div>
              <div className="text-xs mt-4 text-gray-300">
                {width} × {height}px
              </div>
            </div>
          </div>

          {/* TODO: Render actual elements here */}
          {slide.elementIds.map((elementId) => {
            const element = slide.elements[elementId];
            if (!element) return null;

            // Basic element rendering (will be enhanced with proper rendering later)
            return (
              <div
                key={elementId}
                className="absolute border border-blue-300 bg-blue-50 bg-opacity-20"
                style={{
                  left: `${element.x * scale}px`,
                  top: `${element.y * scale}px`,
                  width: `${element.width * scale}px`,
                  height: `${element.height * scale}px`,
                  transform: `rotate(${element.rotation}deg)`,
                  opacity: element.opacity,
                  visibility: element.visible ? 'visible' : 'hidden',
                }}
              >
                <div className="text-xs text-gray-500 p-1">
                  {element.type}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
