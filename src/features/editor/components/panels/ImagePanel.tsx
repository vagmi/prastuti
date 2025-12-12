import { useState } from 'react';
import { useEditorStore } from '../../store';
import { ElementType, PanelType } from '../../types';
import { addImageAsset } from '../../services/presentationService';
import { getCurrentPresentationPath } from '../../services/assetService';
import { Image, Upload } from 'lucide-react';

export default function ImagePanel() {
  const activePresentationId = useEditorStore((s) => s.activePresentationId);
  const selectedSlideId = useEditorStore((s) =>
    s.activePresentationId ? s.selectedSlideIds[s.activePresentationId] : null
  );
  const createElement = useEditorStore((s) => s.createElement);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddImage = async () => {
    if (!selectedSlideId) return;

    const presentationPath = getCurrentPresentationPath();
    if (!presentationPath) {
      alert('Unable to add image. Please try again.');
      return;
    }

    setIsUploading(true);
    try {
      const result = await addImageAsset(presentationPath);

      if (result) {
        const { assetUrl, width, height } = result;

        // Calculate appropriate size (scale down if too large)
        const maxWidth = 800;
        const maxHeight = 600;
        let scaledWidth = width;
        let scaledHeight = height;

        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          scaledWidth = width * scale;
          scaledHeight = height * scale;
        }

        // Create image element with asset URL
        createElement(selectedSlideId, ElementType.Image, {
          src: assetUrl,
          width: scaledWidth,
          height: scaledHeight,
          x: 100, // Default position
          y: 100,
        });

        // Clear the active panel
        setActivePanel(PanelType.None);
      }
    } catch (error) {
      console.error('Failed to add image:', error);
      alert(`Failed to add image: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Image Button */}
      <button
        onClick={handleAddImage}
        disabled={isUploading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Upload Image
          </>
        )}
      </button>

      {/* Info Section */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-2">
          <Image className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Supported Formats</h3>
            <p className="text-xs text-gray-600 mb-2">
              PNG, JPG, JPEG, GIF, WebP, SVG
            </p>
            <p className="text-xs text-gray-500">
              Images will be embedded in your presentation file.
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Tips</h3>
        <ul className="text-xs text-gray-600 space-y-1.5">
          <li>• Use high-quality images for best results</li>
          <li>• Images are automatically scaled to fit</li>
          <li>• Drag corners to resize, use handle to rotate</li>
          <li>• Double-click to reset transforms</li>
        </ul>
      </div>
    </div>
  );
}
