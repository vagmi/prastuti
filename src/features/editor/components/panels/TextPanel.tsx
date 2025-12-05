import { useEditorStore } from '../../store';
import { ElementType } from '../../types';

// Popular fonts like Canva
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

// Text style presets like Canva
const TEXT_PRESETS = [
  { label: 'Heading', fontSize: 64, fontFamily: 'Arial', text: 'Add a heading' },
  { label: 'Subheading', fontSize: 32, fontFamily: 'Arial', text: 'Add a subheading' },
  { label: 'Body text', fontSize: 18, fontFamily: 'Arial', text: 'Add a little bit of body text' },
];

export default function TextPanel() {
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const createElement = useEditorStore((s) => s.createElement);
  const presentation = useEditorStore((s) => s.presentation);

  const handleAddText = (preset: typeof TEXT_PRESETS[0]) => {
    if (!selectedSlideId) return;

    const slide = presentation?.slides[selectedSlideId];
    if (!slide) return;

    createElement(selectedSlideId, ElementType.Text, {
      text: preset.text,
      fontSize: preset.fontSize,
      fontFamily: preset.fontFamily,
      width: preset.fontSize * 10, // Approximate width
      height: preset.fontSize * 1.5,
    });
  };

  const handleAddCustomText = () => {
    if (!selectedSlideId) return;

    createElement(selectedSlideId, ElementType.Text, {
      text: 'Click to edit',
      fontSize: 24,
      fontFamily: 'Arial',
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Text Button */}
      <button
        onClick={handleAddCustomText}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        + Add a text box
      </button>

      {/* Text Presets */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Text styles</h3>
        <div className="space-y-2">
          {TEXT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleAddText(preset)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <div
                className="text-gray-800"
                style={{
                  fontSize: `${Math.min(preset.fontSize / 3, 20)}px`,
                  fontFamily: preset.fontFamily,
                  fontWeight: preset.label === 'Heading' ? 'bold' : 'normal',
                }}
              >
                {preset.text}
              </div>
              <div className="text-xs text-gray-500 mt-1">{preset.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Font List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Font combinations</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.name}
              onClick={() => {
                if (!selectedSlideId) return;
                createElement(selectedSlideId, ElementType.Text, {
                  text: 'Sample text',
                  fontSize: 24,
                  fontFamily: font.name,
                });
              }}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <div style={{ fontFamily: font.family }} className="text-base text-gray-800">
                {font.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                The quick brown fox jumps
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
