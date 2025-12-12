import { useEditorStore } from '../../store';
import { X, Plus } from 'lucide-react';
import { ask } from '@tauri-apps/plugin-dialog';

interface TabBarProps {
  onNewTab: () => void;
  onSaveTab: (presentationId: string) => Promise<void>;
}

export default function TabBar({ onNewTab, onSaveTab }: TabBarProps) {
  const presentations = useEditorStore((s) => s.presentations);
  const presentationIds = useEditorStore((s) => s.presentationIds);
  const activePresentationId = useEditorStore((s) => s.activePresentationId);
  const filePaths = useEditorStore((s) => s.filePaths);
  const isTemp = useEditorStore((s) => s.isTemp);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setActivePresentation = useEditorStore((s) => s.setActivePresentation);
  const closePresentation = useEditorStore((s) => s.closePresentation);

  const handleTabClick = (presentationId: string) => {
    if (presentationId !== activePresentationId) {
      setActivePresentation(presentationId);
    }
  };

  const handleCloseTab = async (e: React.MouseEvent, presentationId: string) => {
    e.stopPropagation();

    // Check if dirty and prompt to save
    if (isDirty(presentationId)) {
      const result = await ask('You have unsaved changes. Do you want to save them before closing?', {
        title: 'Unsaved Changes',
        kind: 'warning',
        okLabel: 'Save',
        cancelLabel: 'Discard',
      });

      if (result) {
        await onSaveTab(presentationId);
      }
    }

    closePresentation(presentationId);
  };

  const getTabName = (presentationId: string) => {
    const presentation = presentations[presentationId];
    const filePath = filePaths[presentationId];
    const isTempFile = isTemp[presentationId];

    if (!presentation) return 'Untitled';

    let name = presentation.name;

    // Show filename if not temp
    if (filePath && !isTempFile) {
      const fileName = filePath.split(/[\\/]/).pop() || name;
      name = fileName.replace(/\.prastuti$/, '');
    }

    // Add asterisk if dirty
    if (isDirty(presentationId)) {
      name = `${name} *`;
    }

    return name;
  };

  if (presentationIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-gray-50 border-b border-gray-200 px-2 overflow-x-auto">
      <div className="flex items-center gap-1 py-1">
        {presentationIds.map((presentationId) => {
          const isActive = presentationId === activePresentationId;
          const dirty = isDirty(presentationId);

          return (
            <div
              key={presentationId}
              onClick={() => handleTabClick(presentationId)}
              className={`
                group flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer transition-colors min-w-0 max-w-xs
                ${isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <span className="text-sm font-medium truncate flex-1">
                {getTabName(presentationId)}
              </span>
              <button
                onClick={(e) => handleCloseTab(e, presentationId)}
                className={`
                  p-0.5 rounded hover:bg-gray-200 transition-colors flex-shrink-0
                  ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
                title="Close tab"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* New Tab Button */}
      <button
        onClick={onNewTab}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors ml-1"
        title="New presentation (⌘N / Ctrl+N)"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
