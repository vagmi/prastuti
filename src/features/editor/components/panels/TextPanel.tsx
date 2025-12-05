import { useEffect, useState } from 'react';
import { useEditorStore } from '../../store';
import { ElementType, PanelType } from '../../types';
import { fetchGoogleFonts, loadGoogleFont, getFontFamilyCSS, type GoogleFont } from '../../services/googleFonts';

// Text style presets like Canva
const TEXT_PRESETS = [
  { label: 'Heading', fontSize: 64, fontFamily: 'Montserrat', text: 'Add a heading' },
  { label: 'Subheading', fontSize: 32, fontFamily: 'Lato', text: 'Add a subheading' },
  { label: 'Body text', fontSize: 18, fontFamily: 'Open Sans', text: 'Add a little bit of body text' },
];

export default function TextPanel() {
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const createElement = useEditorStore((s) => s.createElement);
  const presentation = useEditorStore((s) => s.presentation);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const [googleFonts, setGoogleFonts] = useState<GoogleFont[]>([]);
  const [isLoadingFonts, setIsLoadingFonts] = useState(true);

  useEffect(() => {
    // Fetch Google Fonts on mount
    const loadFonts = async () => {
      try {
        const fonts = await fetchGoogleFonts();
        setGoogleFonts(fonts);
      } catch (error) {
        console.error('Failed to load Google Fonts:', error);
      } finally {
        setIsLoadingFonts(false);
      }
    };

    loadFonts();
  }, []);

  const handleAddText = (preset: typeof TEXT_PRESETS[0]) => {
    if (!selectedSlideId) return;

    const slide = presentation?.slides[selectedSlideId];
    if (!slide) return;

    // Load the font before creating the element
    loadGoogleFont(preset.fontFamily);

    createElement(selectedSlideId, ElementType.Text, {
      text: preset.text,
      fontSize: preset.fontSize,
      fontFamily: preset.fontFamily,
      width: preset.fontSize * 10, // Approximate width
      height: preset.fontSize * 1.5,
    });

    // Clear the active panel so clicking on background shows slide properties
    setActivePanel(PanelType.None);
  };

  const handleAddCustomText = () => {
    if (!selectedSlideId) return;

    loadGoogleFont('Roboto');

    createElement(selectedSlideId, ElementType.Text, {
      text: 'Click to edit',
      fontSize: 24,
      fontFamily: 'Roboto',
    });

    // Clear the active panel so clicking on background shows slide properties
    setActivePanel(PanelType.None);
  };

  const handleAddFontText = (fontFamily: string) => {
    if (!selectedSlideId) return;

    // Load the font before creating the element
    loadGoogleFont(fontFamily);

    createElement(selectedSlideId, ElementType.Text, {
      text: 'Sample text',
      fontSize: 24,
      fontFamily: fontFamily,
    });

    // Clear the active panel so clicking on background shows slide properties
    setActivePanel(PanelType.None);
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
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Google Fonts ({googleFonts.length})
        </h3>

        {isLoadingFonts ? (
          <div className="text-center py-8 text-sm text-gray-500">
            Loading fonts...
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {googleFonts.map((font) => {
              const fontCSS = getFontFamilyCSS(font.family);

              return (
                <button
                  key={font.family}
                  onClick={() => handleAddFontText(font.family)}
                  onMouseEnter={() => loadGoogleFont(font.family)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <div
                    style={{ fontFamily: fontCSS }}
                    className="text-base text-gray-800 font-bold"
                  >
                    {font.family}
                  </div>
                  <div
                    style={{ fontFamily: fontCSS }}
                    className="text-xs text-gray-500 mt-1"
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {font.category}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
