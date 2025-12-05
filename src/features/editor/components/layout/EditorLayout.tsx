import { useEffect, useState, useRef } from 'react';
import { useEditorStore } from '../../store';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import SlideNavigator from '../slides/SlideNavigator';
import SlideCanvas from '../canvas/SlideCanvas';
import SlideShow from '../slideshow/SlideShow';
import {
  openPresentationDialog,
  savePresentationDialog,
  savePresentation,
} from '../../api/fileOperations';
import { Play } from 'lucide-react';

export default function EditorLayout() {
  const createPresentation = useEditorStore((s) => s.createPresentation);
  const loadPresentation = useEditorStore((s) => s.loadPresentation);
  const updatePresentationName = useEditorStore((s) => s.updatePresentationName);
  const presentation = useEditorStore((s) => s.presentation);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [lastSavedPath, setLastSavedPath] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const lastUpdatedAtRef = useRef<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  useEffect(() => {
    // Initialize with default presentation
    if (!presentation) {
      createPresentation('Untitled Presentation', {
        width: 1920,
        height: 1080,
      });
    }
  }, [presentation, createPresentation]);

  // Autosave every 5 seconds
  useEffect(() => {
    if (!presentation || !lastSavedPath) return;

    const autoSaveInterval = setInterval(async () => {
      // Only save if there are changes
      if (lastUpdatedAtRef.current !== presentation.updatedAt) {
        try {
          await savePresentation(presentation, [], lastSavedPath);
          setLastSavedTime(Date.now());
          lastUpdatedAtRef.current = presentation.updatedAt;
          console.log('Auto-saved at', new Date().toLocaleTimeString());
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 5000); // 5 seconds

    return () => clearInterval(autoSaveInterval);
  }, [presentation, lastSavedPath]);

  const handleSave = async () => {
    if (!presentation) return;

    setIsSaving(true);
    try {
      const result = await savePresentationDialog(presentation, []);
      if (result) {
        setLastSavedPath(result.filePath);
        setLastSavedTime(Date.now());
        lastUpdatedAtRef.current = presentation.updatedAt;
        console.log('Presentation saved successfully to:', result.filePath);
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
        setLastSavedPath(result.filePath);
        setLastSavedTime(Date.now());
        lastUpdatedAtRef.current = result.presentation.updatedAt;
        console.log('Presentation loaded successfully from:', result.filePath);
      }
    } catch (error) {
      console.error('Failed to open presentation:', error);
      alert(`Failed to open: ${error}`);
    } finally {
      setIsOpening(false);
    }
  };

  const handleTitleClick = () => {
    if (presentation) {
      setTitleValue(presentation.name);
      setIsEditingTitle(true);
    }
  };

  const handleTitleBlur = () => {
    if (titleValue.trim() && titleValue !== presentation?.name) {
      updatePresentationName(titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
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
    <>
      <div className="flex h-screen flex-col bg-gray-100">
        {/* Top Toolbar */}
        <div className="border-b border-gray-300 bg-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="text-lg font-semibold px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            ) : (
              <h1
                className="text-lg font-semibold px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                onClick={handleTitleClick}
                title="Click to edit title"
              >
                {presentation.name}
              </h1>
            )}
            {lastSavedTime && lastSavedPath && (
              <span className="text-xs text-gray-500">
                Auto-saved at {new Date(lastSavedTime).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpen}
              disabled={isOpening}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isOpening ? 'Opening...' : 'Open'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsPresenting(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors text-sm font-medium"
            >
              <Play className="w-4 h-4" />
              Present
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

      {/* Slide Show Modal */}
      {isPresenting && (
        <SlideShow onClose={() => setIsPresenting(false)} />
      )}
    </>
  );
}
