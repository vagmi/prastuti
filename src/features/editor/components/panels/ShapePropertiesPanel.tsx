import { useState } from 'react';
import { useEditorStore } from '../../store';
import { ShapeElement, ElementType } from '../../types';
import { Palette, Circle } from 'lucide-react';
import ColorPalette from './ColorPalette';

interface ShapePropertiesPanelProps {
  element: ShapeElement;
  slideId: string;
}

export default function ShapePropertiesPanel({ element, slideId }: ShapePropertiesPanelProps) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const [isFillColorPickerOpen, setIsFillColorPickerOpen] = useState(false);
  const [isStrokeColorPickerOpen, setIsStrokeColorPickerOpen] = useState(false);

  const handleUpdate = (props: Partial<ShapeElement>) => {
    updateElement(slideId, element.id, props);
  };

  const handleFillColorChange = (color: string) => {
    handleUpdate({ fill: color });
    setIsFillColorPickerOpen(false);
  };

  const handleStrokeColorChange = (color: string) => {
    handleUpdate({ stroke: color });
    setIsStrokeColorPickerOpen(false);
  };

  return (
    <div className="space-y-3 pt-3 border-t border-gray-200 text-xs">
      <div className="flex items-center gap-1 mb-2">
        <Circle className="w-3 h-3 text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-700">Shape Properties</h3>
      </div>

      {/* Fill Color */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Fill Color</label>
        <button
          onClick={() => setIsFillColorPickerOpen(!isFillColorPickerOpen)}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 flex items-center gap-2"
        >
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: element.fill }}
          />
          <span className="flex-1 text-left font-mono">{element.fill}</span>
          <Palette className="w-3 h-3 text-gray-400" />
        </button>

        {isFillColorPickerOpen && (
          <div className="mt-2 p-2 border border-gray-300 rounded bg-white max-h-96 overflow-y-auto">
            <ColorPalette
              selectedColor={element.fill}
              onColorSelect={handleFillColorChange}
            />
          </div>
        )}
      </div>

      {/* Stroke Color */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Stroke Color</label>
        <button
          onClick={() => setIsStrokeColorPickerOpen(!isStrokeColorPickerOpen)}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 flex items-center gap-2"
        >
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: element.stroke }}
          />
          <span className="flex-1 text-left font-mono">{element.stroke}</span>
          <Palette className="w-3 h-3 text-gray-400" />
        </button>

        {isStrokeColorPickerOpen && (
          <div className="mt-2 p-2 border border-gray-300 rounded bg-white max-h-96 overflow-y-auto">
            <ColorPalette
              selectedColor={element.stroke}
              onColorSelect={handleStrokeColorChange}
            />
          </div>
        )}
      </div>

      {/* Stroke Width */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block flex items-center justify-between">
          <span>Stroke Width</span>
          <span className="font-mono">{element.strokeWidth}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={element.strokeWidth}
          onChange={(e) => handleUpdate({ strokeWidth: Number(e.target.value) })}
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
      </div>

      {/* Rectangle-specific: Corner Radius */}
      {element.type === ElementType.Rectangle && (
        <div>
          <label className="text-[10px] text-gray-500 mb-1 block flex items-center justify-between">
            <span>Corner Radius</span>
            <span className="font-mono">{element.cornerRadius || 0}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={element.cornerRadius || 0}
            onChange={(e) => handleUpdate({ cornerRadius: Number(e.target.value) })}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>
      )}

      {/* Polygon-specific: Sides */}
      {element.type === ElementType.Polygon && (
        <div>
          <label className="text-[10px] text-gray-500 mb-1 block flex items-center justify-between">
            <span>Sides</span>
            <span className="font-mono">{element.sides || 6}</span>
          </label>
          <input
            type="range"
            min="3"
            max="12"
            step="1"
            value={element.sides || 6}
            onChange={(e) => handleUpdate({ sides: Number(e.target.value) })}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>
      )}

      {/* Star-specific: Points and Inner Radius */}
      {element.type === ElementType.Star && (
        <>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block flex items-center justify-between">
              <span>Points</span>
              <span className="font-mono">{element.points || 5}</span>
            </label>
            <input
              type="range"
              min="3"
              max="12"
              step="1"
              value={element.points || 5}
              onChange={(e) => handleUpdate({ points: Number(e.target.value) })}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block flex items-center justify-between">
              <span>Inner Radius</span>
              <span className="font-mono">{((element.innerRadius || 0.5) * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={element.innerRadius || 0.5}
              onChange={(e) => handleUpdate({ innerRadius: Number(e.target.value) })}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>
        </>
      )}
    </div>
  );
}
