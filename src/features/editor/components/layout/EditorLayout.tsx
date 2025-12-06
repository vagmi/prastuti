import { useEffect, useState, useCallback } from 'react';
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
import { Play, FolderOpen, Save, PanelRightClose, PanelRight, FilePlus2 } from 'lucide-react';
import { ask } from '@tauri-apps/plugin-dialog';

export default function EditorLayout() {
  const createPresentation = useEditorStore((s) => s.createPresentation);
  const loadPresentationIntoStore = useEditorStore((s) => s.loadPresentation);
  const clearPresentation = useEditorStore((s) => s.clearPresentation);
  const updatePresentationName = useEditorStore((s) => s.updatePresentationName);
  const presentation = useEditorStore((s) => s.presentation);
  const filePath = useEditorStore((s) => s.filePath);
  const isTemp = useEditorStore((s) => s.isTemp);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setFilePath = useEditorStore((s) => s.setFilePath);
  const markAsSaved = useEditorStore((s) => s.markAsSaved);
  const showRightPanel = useEditorStore((s) => s.showRightPanel);
  const toggleRightPanel = useEditorStore((s) => s.toggleRightPanel);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  // Initialize with default presentation and create temp file
  useEffect(() => {
    const initPresentation = async () => {
      if (!presentation) {
        createPresentation('Untitled Presentation', {
          width: 1920,
          height: 1080,
        });
      } else if (!filePath) {
        // Create a temp file for the new presentation
        try {
          const tempPath = await createTempPresentation(presentation);
          setFilePath(tempPath, true);
          setCurrentPresentationPath(tempPath);
          markAsSaved(); // Mark as saved initially
          console.log('Created temp presentation at:', tempPath);
        } catch (error) {
          console.error('Failed to create temp presentation:', error);
        }
      }
    };

    initPresentation();
  }, [presentation, createPresentation, filePath, setFilePath, markAsSaved]);

  // Ensure presentation path is set when component mounts with existing path
  useEffect(() => {
    if (filePath) {
      setCurrentPresentationPath(filePath);
    }
  }, [filePath]);

  // Autosave every 5 seconds
  useEffect(() => {
    if (!presentation || !filePath) return;

    const autoSaveInterval = setInterval(async () => {
      // Only save if dirty
      if (isDirty()) {
        try {
          await savePresentation(presentation, { filePath });
          markAsSaved();
          setLastSavedTime(Date.now());
          console.log('Auto-saved at', new Date().toLocaleTimeString());
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 5000); // 5 seconds

    return () => clearInterval(autoSaveInterval);
  }, [presentation, filePath, isDirty, markAsSaved]);

  // Prompt before unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const promptSaveIfDirty = async (): Promise<boolean> => {
    if (!isDirty()) return true;

    const result = await ask('You have unsaved changes. Do you want to save them?', {
      title: 'Unsaved Changes',
      kind: 'warning',
      okLabel: 'Save',
      cancelLabel: 'Discard',
    });

    if (result) {
      await handleSave();
    }
    return true; // Continue with the action
  };

  const handleNew = async () => {
    // Prompt to save if dirty
    const canContinue = await promptSaveIfDirty();
    if (!canContinue) return;

    // Clear current presentation and create new one
    clearPresentation();
    createPresentation('Untitled Presentation', {
      width: 1920,
      height: 1080,
    });
  };

  const handleSave = async () => {
    if (!presentation) return;

    setIsSaving(true);
    try {
      if (isTemp) {
        // First time save - show dialog and move temp to permanent location
        const newFilePath = await savePresentation(presentation);
        if (newFilePath && filePath) {
          // Move the temp file to the new location
          await moveTempPresentation(filePath, newFilePath);
          setFilePath(newFilePath, false);
          setCurrentPresentationPath(newFilePath);
          markAsSaved();
          setLastSavedTime(Date.now());
          console.log('Presentation saved to:', newFilePath);
        }
      } else {
        // Subsequent saves - just update the existing file
        if (filePath) {
          await savePresentation(presentation, { filePath });
          markAsSaved();
          setLastSavedTime(Date.now());
          console.log('Presentation updated at:', filePath);
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
    // Prompt to save if dirty
    const canContinue = await promptSaveIfDirty();
    if (!canContinue) return;

    setIsOpening(true);
    try {
      const result = await loadPresentation();
      if (result) {
        // Clear current presentation first
        clearPresentation();

        // Set the presentation path and load data
        setFilePath(result.filePath, false);
        setCurrentPresentationPath(result.filePath);
        loadPresentationIntoStore(result.presentation);
        markAsSaved();
        setLastSavedTime(Date.now());
        console.log('Presentation loaded successfully from:', result.filePath);
      }
    } catch (error) {
      console.error('Failed to open presentation:', error);
      alert(`Failed to open: ${error}`);
    } finally {
      setIsOpening(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'n') {
        e.preventDefault();
        handleNew();
      } else if (modifier && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      } else if (modifier && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, presentation, filePath, isTemp]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Get display name for title
  const getDisplayName = () => {
    if (!presentation) return 'Loading...';

    let name = presentation.name;

    // Add file path if not temp
    if (filePath && !isTemp) {
      const fileName = filePath.split(/[\\/]/).pop() || name;
      name = fileName.replace(/\.prastuti$/, '');
    }

    // Add asterisk if dirty
    if (isDirty()) {
      name = `${name} *`;
    }

    return name;
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
                {getDisplayName()}
              </h1>
            )}
            {lastSavedTime && filePath && !isDirty() && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Saved at {new Date(lastSavedTime).toLocaleTimeString()}
              </span>
            )}
            {isDirty() && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-all text-sm font-medium hover:border-gray-400"
              title="New presentation (⌘N / Ctrl+N)"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>New</span>
            </button>
            <button
              onClick={handleOpen}
              disabled={isOpening}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium hover:border-gray-400"
              title="Open presentation (⌘O / Ctrl+O)"
            >
              <FolderOpen className="w-4 h-4" />
              <span>{isOpening ? 'Opening...' : 'Open'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium hover:border-gray-400"
              title="Save presentation (⌘S / Ctrl+S)"
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
