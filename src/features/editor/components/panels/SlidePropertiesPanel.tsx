import { useState } from 'react';
import { useEditorStore } from '../../store';
import { Slide } from '../../types';
import { FileText, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import ColorPalette from './ColorPalette';

interface SlidePropertiesPanelProps {
  slide: Slide;
  slideId: string;
}

export default function SlidePropertiesPanel({ slide, slideId }: SlidePropertiesPanelProps) {
  const updateSlideBackground = useEditorStore((s) => s.updateSlideBackground);
  const presentation = useEditorStore((s) => s.presentation);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const handleNameChange = (name: string) => {
    // Update slide name through the store
    const updateElement = useEditorStore.getState().updateElement;
    // We need to add a method to update slide properties
    // For now, we'll access the store directly
    if (presentation) {
      const updatedSlide = { ...slide, name };
      useEditorStore.setState({
        presentation: {
          ...presentation,
          slides: {
            ...presentation.slides,
            [slideId]: updatedSlide,
          },
          updatedAt: Date.now(),
        },
      });
    }
  };

  const handleBackgroundColorChange = (color: string) => {
    updateSlideBackground(slideId, {
      type: 'color',
      fill: color,
    });
    setIsColorPickerOpen(false);
  };

  const currentColor = slide.background.fill || '#ffffff';
  const slideIndex = presentation?.slideIds.indexOf(slideId) ?? 0;

  return (
    <div className="space-y-3 text-xs">
      {/* Slide Info */}
      <div className="pb-3 border-b border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-1">
          Slide {slideIndex + 1}
        </div>
        <div className="text-[10px] text-gray-500">
          {slide.dimensions.width} × {slide.dimensions.height}px
        </div>
      </div>

      {/* Slide Title */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <FileText className="w-3 h-3 text-gray-500" />
          <label className="text-xs font-semibold text-gray-700">Slide Title</label>
        </div>
        <input
          type="text"
          value={slide.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
          placeholder="Enter slide title..."
        />
      </div>

      {/* Background Color */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <Palette className="w-3 h-3 text-gray-500" />
          <label className="text-xs font-semibold text-gray-700">Background</label>
        </div>

        {/* Current Color Display */}
        <button
          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
          className="w-full flex items-center justify-between px-2 py-1.5 border border-gray-300 rounded hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-gray-300"
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-xs text-gray-700 font-mono">{currentColor}</span>
          </div>
          {isColorPickerOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {/* Color Palette Picker */}
        {isColorPickerOpen && (
          <div className="mt-2 p-2 border border-gray-300 rounded bg-white max-h-96 overflow-y-auto">
            <ColorPalette
              selectedColor={currentColor}
              onColorSelect={handleBackgroundColorChange}
            />
          </div>
        )}
      </div>

      {/* Slide Dimensions Info */}
      <div className="pt-3 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-1.5">Dimensions</div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="px-2 py-1.5 bg-gray-50 rounded">
            <div className="text-[10px] text-gray-500">Width</div>
            <div className="text-xs font-medium text-gray-700">
              {slide.dimensions.width}px
            </div>
          </div>
          <div className="px-2 py-1.5 bg-gray-50 rounded">
            <div className="text-[10px] text-gray-500">Height</div>
            <div className="text-xs font-medium text-gray-700">
              {slide.dimensions.height}px
            </div>
          </div>
        </div>
      </div>

      {/* Element Count */}
      <div className="pt-3 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-1.5">Content</div>
        <div className="px-2 py-1.5 bg-gray-50 rounded">
          <div className="text-[10px] text-gray-500">Elements on slide</div>
          <div className="text-xs font-medium text-gray-700">
            {slide.elementIds.length} {slide.elementIds.length === 1 ? 'element' : 'elements'}
          </div>
        </div>
      </div>
    </div>
  );
}
