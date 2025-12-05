import { useState } from 'react';
import { useEditorStore } from '../../store';
import { TextElement } from '../../types';
import { Type, Palette, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Space, LineChart, ChevronDown, ChevronUp } from 'lucide-react';
import ColorPalette from './ColorPalette';

const FONT_OPTIONS = [
  { name: 'Arial', family: 'Arial, sans-serif' },
  { name: 'Helvetica', family: 'Helvetica, sans-serif' },
  { name: 'Times New Roman', family: '"Times New Roman", serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Courier New', family: '"Courier New", monospace' },
  { name: 'Verdana', family: 'Verdana, sans-serif' },
  { name: 'Impact', family: 'Impact, sans-serif' },
  { name: 'Comic Sans MS', family: '"Comic Sans MS", cursive' },
  { name: 'Trebuchet MS', family: '"Trebuchet MS", sans-serif' },
  { name: 'Arial Black', family: '"Arial Black", sans-serif' },
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96, 144];

interface TextPropertiesPanelProps {
  element: TextElement;
  slideId: string;
}

export default function TextPropertiesPanel({ element, slideId }: TextPropertiesPanelProps) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const handleUpdate = (props: Partial<TextElement>) => {
    updateElement(slideId, element.id, props);
  };

  const handleColorChange = (color: string) => {
    handleUpdate({ fill: color });
    setIsColorPickerOpen(false);
  };

  const toggleBold = () => {
    const isBold = element.fontStyle.includes('bold');
    const isItalic = element.fontStyle.includes('italic');

    let newStyle: TextElement['fontStyle'] = 'normal';
    if (!isBold && isItalic) newStyle = 'bold italic';
    else if (!isBold) newStyle = 'bold';
    else if (isItalic) newStyle = 'italic';

    handleUpdate({ fontStyle: newStyle });
  };

  const toggleItalic = () => {
    const isBold = element.fontStyle.includes('bold');
    const isItalic = element.fontStyle.includes('italic');

    let newStyle: TextElement['fontStyle'] = 'normal';
    if (isBold && !isItalic) newStyle = 'bold italic';
    else if (!isItalic) newStyle = 'italic';
    else if (isBold) newStyle = 'bold';

    handleUpdate({ fontStyle: newStyle });
  };

  const toggleUnderline = () => {
    handleUpdate({
      textDecoration: element.textDecoration === 'underline' ? '' : 'underline'
    });
  };

  return (
    <div className="space-y-3 pt-3 border-t border-gray-200 text-xs">
      <div className="flex items-center gap-1 mb-2">
        <Type className="w-3 h-3 text-gray-500" />
        <h3 className="text-xs font-semibold text-gray-700">Text Properties</h3>
      </div>

      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Font Family</label>
        <select
          value={element.fontFamily}
          onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
          style={{ fontFamily: element.fontFamily }}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.name} value={font.name} style={{ fontFamily: font.family }}>
              {font.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[10px] text-gray-500 mb-0.5 block">Font Size</label>
        <select
          value={element.fontSize}
          onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Text Color */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <Palette className="w-3 h-3 text-gray-500" />
          <label className="text-xs font-semibold text-gray-700">Text Color</label>
        </div>

        {/* Current Color Display */}
        <button
          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
          className="w-full flex items-center justify-between px-2 py-1.5 border border-gray-300 rounded hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-gray-300"
              style={{ backgroundColor: element.fill }}
            />
            <span className="text-xs text-gray-700 font-mono">{element.fill}</span>
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
              selectedColor={element.fill}
              onColorSelect={handleColorChange}
            />
          </div>
        )}
      </div>

      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Text Style</label>
        <div className="flex gap-1">
          <button
            onClick={toggleBold}
            className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded border transition-colors ${
              element.fontStyle.includes('bold')
                ? 'bg-purple-100 border-purple-400 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Bold"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            onClick={toggleItalic}
            className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded border transition-colors ${
              element.fontStyle.includes('italic')
                ? 'bg-purple-100 border-purple-400 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Italic"
          >
            <Italic className="w-3 h-3" />
          </button>
          <button
            onClick={toggleUnderline}
            className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded border transition-colors ${
              element.textDecoration === 'underline'
                ? 'bg-purple-100 border-purple-400 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Underline"
          >
            <Underline className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Alignment</label>
        <div className="flex gap-1">
          <button
            onClick={() => handleUpdate({ align: 'left' })}
            className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded border transition-colors ${
              element.align === 'left'
                ? 'bg-purple-100 border-purple-400 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleUpdate({ align: 'center' })}
            className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded border transition-colors ${
              element.align === 'center'
                ? 'bg-purple-100 border-purple-400 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleUpdate({ align: 'right' })}
            className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded border transition-colors ${
              element.align === 'right'
                ? 'bg-purple-100 border-purple-400 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <Space className="w-3 h-3 text-gray-500" />
            <label className="text-[10px] text-gray-500">Letter Spacing</label>
          </div>
          <span className="text-[10px] text-gray-500">{element.letterSpacing}px</span>
        </div>
        <input
          type="range"
          min="-5"
          max="20"
          step="0.5"
          value={element.letterSpacing}
          onChange={(e) => handleUpdate({ letterSpacing: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <LineChart className="w-3 h-3 text-gray-500" />
            <label className="text-[10px] text-gray-500">Line Height</label>
          </div>
          <span className="text-[10px] text-gray-500">{element.lineHeight.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={element.lineHeight}
          onChange={(e) => handleUpdate({ lineHeight: Number(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
}
