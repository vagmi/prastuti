import { useEditorStore } from '../../store';
import { ElementType, PanelType } from '../../types';
import TextPanel from '../panels/TextPanel';
import ImagePanel from '../panels/ImagePanel';
import TextPropertiesPanel from '../panels/TextPropertiesPanel';
import ElementPropertiesPanel from '../panels/ElementPropertiesPanel';
import SlidePropertiesPanel from '../panels/SlidePropertiesPanel';

export default function RightSidebar() {
  const activePanel = useEditorStore((s) => s.activePanel);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const presentation = useEditorStore((s) => s.presentation);

  const selectedElement =
    selectedSlideId && selectedElementId && presentation
      ? presentation.slides[selectedSlideId]?.elements[selectedElementId]
      : null;

  const currentSlide =
    selectedSlideId && presentation
      ? presentation.slides[selectedSlideId]
      : null;

  const renderPanel = () => {
    // Priority 1: Show element properties if element is selected
    if (selectedElement && selectedSlideId) {
      return (
        <>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            {selectedElement.type === ElementType.Text && 'Text Element'}
            {selectedElement.type === ElementType.Image && 'Image Element'}
            {selectedElement.type === ElementType.Rectangle && 'Rectangle'}
            {selectedElement.type === ElementType.Circle && 'Circle'}
          </h2>

          {/* Universal Element Properties (position, size, rotation, etc.) */}
          <ElementPropertiesPanel element={selectedElement} slideId={selectedSlideId} />

          {/* Element-specific properties */}
          {selectedElement.type === ElementType.Text && (
            <TextPropertiesPanel element={selectedElement} slideId={selectedSlideId} />
          )}

          {/* Other element types will have their specific properties here */}
        </>
      );
    }

    // Priority 2: Show tool panels based on active panel (when a tool is selected)
    switch (activePanel) {
      case PanelType.Text:
        return (
          <>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Text</h2>
            <TextPanel />
          </>
        );

      case PanelType.Image:
        return (
          <>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Image</h2>
            <ImagePanel />
          </>
        );

      case PanelType.Shape:
        return (
          <>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Shape</h2>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Shape tools coming soon</p>
            </div>
          </>
        );

      case PanelType.None:
      default:
        // Priority 3: Show slide properties when no tool is active and no element is selected
        if (currentSlide && selectedSlideId) {
          return (
            <>
              <h2 className="mb-4 text-lg font-semibold text-gray-800">Slide Properties</h2>
              <SlidePropertiesPanel slide={currentSlide} slideId={selectedSlideId} />
            </>
          );
        }

        // Fallback: Nothing selected
        return (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Select a tool or element to begin</p>
          </div>
        );
    }
  };

  return (
    <div className="w-80 border-l border-gray-300 bg-white overflow-y-auto">
      <div className="p-4">{renderPanel()}</div>
    </div>
  );
}
