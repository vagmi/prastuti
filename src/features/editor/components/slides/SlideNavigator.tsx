import { useEditorStore } from '../../store';
import SlideThumbnail from './SlideThumbnail';

export default function SlideNavigator() {
  const presentation = useEditorStore((s) => s.presentation);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectSlide = useEditorStore((s) => s.selectSlide);
  const createSlide = useEditorStore((s) => s.createSlide);
  const duplicateSlide = useEditorStore((s) => s.duplicateSlide);
  const deleteSlide = useEditorStore((s) => s.deleteSlide);

  if (!presentation) return null;

  const handleAddSlide = () => {
    createSlide(selectedSlideId);
  };

  const handleDuplicateSlide = (slideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateSlide(slideId);
  };

  const handleDeleteSlide = (slideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (presentation.slideIds.length === 1) {
      alert('Cannot delete the last slide');
      return;
    }
    if (confirm('Are you sure you want to delete this slide?')) {
      deleteSlide(slideId);
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-white border-t border-gray-300 overflow-x-auto">
      {presentation.slideIds.map((slideId, index) => {
        const slide = presentation.slides[slideId];
        const isSelected = slideId === selectedSlideId;

        return (
          <div
            key={slideId}
            className={`relative flex-shrink-0 group cursor-pointer transition-all ${
              isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-300'
            }`}
            onClick={() => selectSlide(slideId)}
          >
            {/* Slide Thumbnail */}
            <div className="w-40 h-24 bg-white border border-gray-300 rounded overflow-hidden">
              <SlideThumbnail slide={slide} width={160} height={96} />
            </div>

            {/* Slide Number */}
            <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-0.5 rounded">
              {index + 1}
            </div>

            {/* Action Buttons (shown on hover) */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => handleDuplicateSlide(slideId, e)}
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
                title="Duplicate"
              >
                Dup
              </button>
              {presentation.slideIds.length > 1 && (
                <button
                  onClick={(e) => handleDeleteSlide(slideId, e)}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
                  title="Delete"
                >
                  Del
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add Slide Button */}
      <button
        onClick={handleAddSlide}
        className="flex-shrink-0 w-40 h-24 border-2 border-dashed border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center group"
      >
        <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
          <div className="text-3xl">+</div>
          <div className="text-xs">Add Slide</div>
        </div>
      </button>
    </div>
  );
}
