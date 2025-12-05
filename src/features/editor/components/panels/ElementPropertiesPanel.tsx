import { Element } from '../../types';
import { useEditorStore } from '../../store';
import {
  Move,
  Maximize2,
  RotateCw,
  Droplet,
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
} from 'lucide-react';

interface ElementPropertiesPanelProps {
  element: Element;
  slideId: string;
}

export default function ElementPropertiesPanel({
  element,
  slideId,
}: ElementPropertiesPanelProps) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const deleteElement = useEditorStore((s) => s.deleteElement);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const bringToFront = useEditorStore((s) => s.bringToFront);
  const sendToBack = useEditorStore((s) => s.sendToBack);

  const handleUpdate = (props: Partial<Element>) => {
    updateElement(slideId, element.id, props);
  };

  const handleNumberInput = (field: keyof Element, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      handleUpdate({ [field]: numValue });
    }
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Position */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <Move className="w-3 h-3 text-gray-500" />
          <h3 className="text-xs font-semibold text-gray-700">Position</h3>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">X</label>
            <input
              type="number"
              value={Math.round(element.x)}
              onChange={(e) => handleNumberInput('x', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Y</label>
            <input
              type="number"
              value={Math.round(element.y)}
              onChange={(e) => handleNumberInput('y', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <Maximize2 className="w-3 h-3 text-gray-500" />
          <h3 className="text-xs font-semibold text-gray-700">Size</h3>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Width</label>
            <input
              type="number"
              value={Math.round(element.width)}
              onChange={(e) => handleNumberInput('width', e.target.value)}
              min="1"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Height</label>
            <input
              type="number"
              value={Math.round(element.height)}
              onChange={(e) => handleNumberInput('height', e.target.value)}
              min="1"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <RotateCw className="w-3 h-3 text-gray-500" />
          <h3 className="text-xs font-semibold text-gray-700">Rotation</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={Math.round(element.rotation)}
            onChange={(e) => handleNumberInput('rotation', e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <span className="text-[10px] text-gray-500">°</span>
          <button
            onClick={() => handleUpdate({ rotation: 0 })}
            className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 rounded"
            title="Reset rotation"
          >
            Reset
          </button>
        </div>
        <input
          type="range"
          min="-180"
          max="180"
          step="1"
          value={element.rotation}
          onChange={(e) => handleNumberInput('rotation', e.target.value)}
          className="w-full mt-1.5"
        />
      </div>

      {/* Opacity */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <Droplet className="w-3 h-3 text-gray-500" />
          <h3 className="text-xs font-semibold text-gray-700">Opacity</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={element.opacity}
            onChange={(e) => handleNumberInput('opacity', e.target.value)}
            className="flex-1"
          />
          <span className="text-xs text-gray-600 w-10 text-right">
            {Math.round(element.opacity * 100)}%
          </span>
        </div>
      </div>

      {/* Layer Order */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <Layers className="w-3 h-3 text-gray-500" />
          <h3 className="text-xs font-semibold text-gray-700">Layer Order</h3>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => bringToFront(slideId, element.id)}
            className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            <ArrowUp className="w-3 h-3" />
            To Front
          </button>
          <button
            onClick={() => sendToBack(slideId, element.id)}
            className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            <ArrowDown className="w-3 h-3" />
            To Back
          </button>
        </div>
      </div>

      {/* Visibility & Lock */}
      <div>
        <h3 className="text-xs font-semibold text-gray-700 mb-1.5">Options</h3>
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer">
            {element.visible ? (
              <Eye className="w-3 h-3 text-gray-500" />
            ) : (
              <EyeOff className="w-3 h-3 text-gray-500" />
            )}
            <input
              type="checkbox"
              checked={element.visible}
              onChange={(e) => handleUpdate({ visible: e.target.checked })}
              className="w-3 h-3 text-purple-600 rounded focus:ring-1 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-700">Visible</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            {element.locked ? (
              <Lock className="w-3 h-3 text-gray-500" />
            ) : (
              <Unlock className="w-3 h-3 text-gray-500" />
            )}
            <input
              type="checkbox"
              checked={element.locked}
              onChange={(e) => handleUpdate({ locked: e.target.checked })}
              className="w-3 h-3 text-purple-600 rounded focus:ring-1 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-700">Lock position</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700 mb-1.5">Actions</h3>
        <div className="flex gap-1.5">
          <button
            onClick={() => duplicateElement(slideId, element.id)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            <Copy className="w-3 h-3" />
            Duplicate
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this element?')) {
                deleteElement(slideId, element.id);
              }
            }}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
