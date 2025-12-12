import { useEffect, useState, useRef } from 'react';
import { useEditorStore } from '../../store';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import SlideNavigator from '../slides/SlideNavigator';
import SlideCanvas from '../canvas/SlideCanvas';
import SlideShow from '../slideshow/SlideShow';
import TabBar from '../tabs/TabBar';
import {
  savePresentation,
  loadPresentation as loadPresentationFile,
  createTempPresentation,
  moveTempPresentation,
} from '../../services/presentationService';
import { setCurrentPresentationPath } from '../../services/assetService';
import { Play, FolderOpen, Save, PanelRightClose, PanelRight, FilePlus2 } from 'lucide-react';
import { ask } from '@tauri-apps/plugin-dialog';

export default function EditorLayout() {
  const createPresentation = useEditorStore((s) => s.createPresentation);
  const loadPresentation = useEditorStore((s) => s.loadPresentation);
  const updatePresentationName = useEditorStore((s) => s.updatePresentationName);
  const closePresentation = useEditorStore((s) => s.closePresentation);
  const activePresentationId = useEditorStore((s) => s.activePresentationId);
  const presentation = useEditorStore((s) =>
    s.activePresentationId ? s.presentations[s.activePresentationId] : null
  );
  const presentationIds = useEditorStore((s) => s.presentationIds);
  const filePaths = useEditorStore((s) => s.filePaths);
  const isTemp = useEditorStore((s) => s.isTemp);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setFilePath = useEditorStore((s) => s.setFilePath);
  const markAsSaved = useEditorStore((s) => s.markAsSaved);
  const showRightPanel = useEditorStore((s) => s.showRightPanel);
  const toggleRightPanel = useEditorStore((s) => s.toggleRightPanel);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Record<string, number>>({});
  const initializedRef = useRef(false);
  const filePath = activePresentationId ? filePaths[activePresentationId] : null;
  const isTempFile = activePresentationId ? isTemp[activePresentationId] : false;

  // Initialize with default presentation
  useEffect(() => {
    if (presentationIds.length === 0 && !initializedRef.current) {
      initializedRef.current = true;
      const presentationId = createPresentation('Untitled Presentation', {
        width: 1920,
        height: 1080,
      });

      // Create temp file
      const initTempFile = async () => {
        const state = useEditorStore.getState();
        const pres = state.presentations[presentationId];
        if (pres && presentationId) {
          try {
            const tempPath = await createTempPresentation(pres);
            setFilePath(presentationId, tempPath, true);
            setCurrentPresentationPath(tempPath);
            markAsSaved(presentationId);
            console.log('Created temp presentation at:', tempPath);
          } catch (error) {
            console.error('Failed to create temp presentation:', error);
          }
        }
      };

      initTempFile();
    }
  }, [presentationIds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure presentation path is set
  useEffect(() => {
    if (filePath) {
      setCurrentPresentationPath(filePath);
    }
  }, [filePath]);

  // Autosave for active presentation
  useEffect(() => {
    if (!presentation || !activePresentationId || !filePath) return;

    const autoSaveInterval = setInterval(async () => {
      if (isDirty(activePresentationId)) {
        try {
          await savePresentation(presentation, { filePath });
          markAsSaved(activePresentationId);
          setLastSavedTime(prev => ({ ...prev, [activePresentationId]: Date.now() }));
          console.log('Auto-saved at', new Date().toLocaleTimeString());
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 5000);

    return () => clearInterval(autoSaveInterval);
  }, [presentation, activePresentationId, filePath, isDirty, markAsSaved]);

  // Prompt before unload if any presentation is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const anyDirty = presentationIds.some(id => isDirty(id));
      if (anyDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [presentationIds, isDirty]);

  const promptSaveIfDirty = async (presentationId: string): Promise<boolean> => {
    if (!isDirty(presentationId)) return true;

    const result = await ask('You have unsaved changes. Do you want to save them?', {
      title: 'Unsaved Changes',
      kind: 'warning',
      okLabel: 'Save',
      cancelLabel: 'Discard',
    });

    if (result) {
      await handleSavePresentation(presentationId);
    }
    return true;
  };

  const handleNew = async () => {
    // Prompt to save active presentation if dirty
    if (activePresentationId && isDirty(activePresentationId)) {
      await promptSaveIfDirty(activePresentationId);
    }

    // Create new presentation (will be added as new tab)
    const presentationId = createPresentation('Untitled Presentation', {
      width: 1920,
      height: 1080,
    });

    // Create temp file for new presentation
    const state = useEditorStore.getState();
    const pres = state.presentations[presentationId];
    if (pres && presentationId) {
      try {
        const tempPath = await createTempPresentation(pres);
        setFilePath(presentationId, tempPath, true);
        setCurrentPresentationPath(tempPath);
        markAsSaved(presentationId);
      } catch (error) {
        console.error('Failed to create temp presentation:', error);
      }
    }
  };

  const handleSavePresentation = async (presentationId: string) => {
    const pres = useEditorStore.getState().presentations[presentationId];
    if (!pres) return;

    const presentationFilePath = filePaths[presentationId];
    const isTempPresentation = isTemp[presentationId];

    setIsSaving(true);
    try {
      if (isTempPresentation) {
        // First time save - show dialog
        const newFilePath = await savePresentation(pres);
        if (newFilePath && presentationFilePath) {
          await moveTempPresentation(presentationFilePath, newFilePath);
          setFilePath(presentationId, newFilePath, false);
          setCurrentPresentationPath(newFilePath);
          markAsSaved(presentationId);
          setLastSavedTime(prev => ({ ...prev, [presentationId]: Date.now() }));
          console.log('Presentation saved to:', newFilePath);
        }
      } else {
        // Update existing file
        if (presentationFilePath) {
          await savePresentation(pres, { filePath: presentationFilePath });
          markAsSaved(presentationId);
          setLastSavedTime(prev => ({ ...prev, [presentationId]: Date.now() }));
          console.log('Presentation updated at:', presentationFilePath);
        }
      }
    } catch (error) {
      console.error('Failed to save presentation:', error);
      alert(`Failed to save: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (activePresentationId) {
      await handleSavePresentation(activePresentationId);
    }
  };

  const handleOpen = async () => {
    // Prompt to save active if dirty
    if (activePresentationId && isDirty(activePresentationId)) {
      await promptSaveIfDirty(activePresentationId);
    }

    setIsOpening(true);
    try {
      const result = await loadPresentationFile();
      if (result) {
        // Load as new tab
        const presentationId = loadPresentation(result.presentation, result.filePath);
        setCurrentPresentationPath(result.filePath);
        setLastSavedTime(prev => ({ ...prev, [presentationId]: Date.now() }));
        console.log('Presentation loaded successfully from:', result.filePath);
      }
    } catch (error) {
      console.error('Failed to open presentation:', error);
      alert(`Failed to open: ${error}`);
    } finally {
      setIsOpening(false);
    }
  };

  const handleCloseTab = async () => {
    if (!activePresentationId) return;

    // If this is the last tab, create a new one before closing
    if (presentationIds.length === 1) {
      // Check if dirty and prompt to save
      if (isDirty(activePresentationId)) {
        const result = await ask('You have unsaved changes. Do you want to save them before closing?', {
          title: 'Unsaved Changes',
          kind: 'warning',
          okLabel: 'Save',
          cancelLabel: 'Discard',
        });

        if (result) {
          await handleSavePresentation(activePresentationId);
        }
      }

      // Create new presentation before closing the last one
      await handleNew();
      // Close the old one
      closePresentation(activePresentationId);
      return;
    }

    // Check if dirty and prompt to save
    if (isDirty(activePresentationId)) {
      const result = await ask('You have unsaved changes. Do you want to save them before closing?', {
        title: 'Unsaved Changes',
        kind: 'warning',
        okLabel: 'Save',
        cancelLabel: 'Discard',
      });

      if (result) {
        await handleSavePresentation(activePresentationId);
      }
    }

    closePresentation(activePresentationId);
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
      } else if (modifier && e.key === 'w') {
        e.preventDefault();
        handleCloseTab();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePresentationId, isDirty]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!presentation) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  const dirty = activePresentationId ? isDirty(activePresentationId) : false;
  const savedTime = activePresentationId ? lastSavedTime[activePresentationId] : null;

  return (
    <>
      <div className="flex h-screen flex-col bg-gray-100">
        {/* Top Toolbar */}
        <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">
              {presentation.name}
            </h1>
            {savedTime && filePath && !dirty && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Saved at {new Date(savedTime).toLocaleTimeString()}
              </span>
            )}
            {dirty && (
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

        {/* Tab Bar */}
        <TabBar
          onNewTab={handleNew}
          onSaveTab={handleSavePresentation}
        />

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
