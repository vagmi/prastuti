import { useEffect, useState } from 'react';
import { useEditorStore } from '../../store';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import SlideNavigator from '../slides/SlideNavigator';
import SlideCanvas from '../canvas/SlideCanvas';
import {
  openPresentationDialog,
  savePresentationDialog,
} from '../../api/fileOperations';

export default function EditorLayout() {
  const createPresentation = useEditorStore((s) => s.createPresentation);
  const loadPresentation = useEditorStore((s) => s.loadPresentation);
  const presentation = useEditorStore((s) => s.presentation);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    // Initialize with default presentation
    if (!presentation) {
      createPresentation('Untitled Presentation', {
        width: 1920,
        height: 1080,
      });
    }
  }, [presentation, createPresentation]);

  const handleSave = async () => {
    if (!presentation) return;

    setIsSaving(true);
    try {
      const success = await savePresentationDialog(presentation, []);
      if (success) {
        console.log('Presentation saved successfully');
      }
    } catch (error) {
      console.error('Failed to save presentation:', error);
      alert(`Failed to save: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpen = async () => {
    setIsOpening(true);
    try {
      const result = await openPresentationDialog();
      if (result) {
        loadPresentation(result.presentation);
        console.log('Presentation loaded successfully');
      }
    } catch (error) {
      console.error('Failed to open presentation:', error);
      alert(`Failed to open: ${error}`);
    } finally {
      setIsOpening(false);
    }
  };

  if (!presentation) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Top Toolbar */}
      <div className="border-b border-gray-300 bg-white px-4 py-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{presentation.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleOpen}
            disabled={isOpening}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isOpening ? 'Opening...' : 'Open'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <LeftSidebar />

        {/* Center - Canvas Area */}
        <div className="flex flex-1 flex-col">
          <SlideCanvas />

          {/* Bottom - Slide Navigator */}
          <SlideNavigator />
        </div>

        {/* Right Sidebar - Properties */}
        <RightSidebar />
      </div>
    </div>
  );
}
