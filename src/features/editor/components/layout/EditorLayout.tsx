import { useEffect, useState, useRef } from 'react';
import { useEditorStore } from '../../store';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import SlideNavigator from '../slides/SlideNavigator';
import SlideCanvas from '../canvas/SlideCanvas';
import SlideShow from '../slideshow/SlideShow';
import {
  savePresentation,
  loadPresentation,
  createTempPresentation,
  moveTempPresentation,
} from '../../services/presentationService';
import { setCurrentPresentationPath } from '../../services/assetService';
import { Play, FolderOpen, Save, PanelRightClose, PanelRight } from 'lucide-react';

export default function EditorLayout() {
  const createPresentation = useEditorStore((s) => s.createPresentation);
  const loadPresentationIntoStore = useEditorStore((s) => s.loadPresentation);
  const updatePresentationName = useEditorStore((s) => s.updatePresentationName);
  const presentation = useEditorStore((s) => s.presentation);
  const showRightPanel = useEditorStore((s) => s.showRightPanel);
  const toggleRightPanel = useEditorStore((s) => s.toggleRightPanel);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [lastSavedPath, setLastSavedPath] = useState<string | null>(null);
  const [isTempPresentation, setIsTempPresentation] = useState(true); // Track if using temp file
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const lastUpdatedAtRef = useRef<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  useEffect(() => {
    // Initialize with default presentation and create temp file
    const initPresentation = async () => {
      if (!presentation) {
        createPresentation('Untitled Presentation', {
          width: 1920,
          height: 1080,
        });
      } else if (!lastSavedPath) {
        // Create a temp file for the new presentation
        try {
          const tempPath = await createTempPresentation(presentation);
          setLastSavedPath(tempPath);
          setCurrentPresentationPath(tempPath);
          setIsTempPresentation(true);
          console.log('Created temp presentation at:', tempPath);
        } catch (error) {
          console.error('Failed to create temp presentation:', error);
        }
      }
    };

    initPresentation();
  }, [presentation, createPresentation, lastSavedPath]);

  // Ensure presentation path is set when component mounts with existing path
  useEffect(() => {
    if (lastSavedPath) {
      setCurrentPresentationPath(lastSavedPath);
    }
  }, [lastSavedPath]);

  // Autosave every 5 seconds
  useEffect(() => {
    if (!presentation || !lastSavedPath) return;

    const autoSaveInterval = setInterval(async () => {
      // Only save if there are changes
      if (lastUpdatedAtRef.current !== presentation.updatedAt) {
        try {
          await savePresentation(presentation, { filePath: lastSavedPath });
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
      if (isTempPresentation) {
        // First time save - show dialog and move temp to permanent location
        const newFilePath = await savePresentation(presentation);
        if (newFilePath && lastSavedPath) {
          // Move the temp file to the new location
          await moveTempPresentation(lastSavedPath, newFilePath);
          setLastSavedPath(newFilePath);
          setCurrentPresentationPath(newFilePath);
          setIsTempPresentation(false);
          setLastSavedTime(Date.now());
          lastUpdatedAtRef.current = presentation.updatedAt;
          console.log('Presentation saved to:', newFilePath);
        }
      } else {
        // Subsequent saves - just update the existing file
        if (lastSavedPath) {
          await savePresentation(presentation, { filePath: lastSavedPath });
          setLastSavedTime(Date.now());
          lastUpdatedAtRef.current = presentation.updatedAt;
          console.log('Presentation updated at:', lastSavedPath);
        }
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
      const result = await loadPresentation();
      if (result) {
        // IMPORTANT: Set the presentation path FIRST, before loading into store
        // This ensures the asset service knows where to load images from
        // when components try to render them
        setLastSavedPath(result.filePath);
        setCurrentPresentationPath(result.filePath);
        setIsTempPresentation(false); // Loaded presentations are not temp

        // Now load the presentation data into the store
        // Images will be able to resolve their assets correctly
        loadPresentationIntoStore(result.presentation);

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
        <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="text-lg font-semibold px-3 py-1.5 border border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            ) : (
              <h1
                className="text-lg font-semibold px-3 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                onClick={handleTitleClick}
                title="Click to edit title"
              >
                {presentation.name}
              </h1>
            )}
            {lastSavedTime && lastSavedPath && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Auto-saved at {new Date(lastSavedTime).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpen}
              disabled={isOpening}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium hover:border-gray-400"
              title="Open presentation"
            >
              <FolderOpen className="w-4 h-4" />
              <span>{isOpening ? 'Opening...' : 'Open'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium hover:border-gray-400"
              title="Save presentation"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button
              onClick={() => setIsPresenting(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Present</span>
            </button>
            <button
              onClick={toggleRightPanel}
              className="p-2 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
              title={showRightPanel ? 'Hide properties panel' : 'Show properties panel'}
            >
              {showRightPanel ? (
                <PanelRightClose className="w-5 h-5" />
              ) : (
                <PanelRight className="w-5 h-5" />
              )}
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
        {showRightPanel && <RightSidebar />}
      </div>
    </div>

      {/* Slide Show Modal */}
      {isPresenting && (
        <SlideShow onClose={() => setIsPresenting(false)} />
      )}
    </>
  );
}
