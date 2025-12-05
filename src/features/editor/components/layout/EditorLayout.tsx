import { useEffect } from 'react';
import { useEditorStore } from '../../store';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

export default function EditorLayout() {
  const createPresentation = useEditorStore((s) => s.createPresentation);
  const presentation = useEditorStore((s) => s.presentation);

  useEffect(() => {
    // Initialize with default presentation
    if (!presentation) {
      createPresentation('Untitled Presentation', {
        width: 1920,
        height: 1080,
      });
    }
  }, [presentation, createPresentation]);

  if (!presentation) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Top Toolbar - Will be added in Phase 7 */}
      <div className="border-b border-gray-300 bg-white px-4 py-2">
        <h1 className="text-lg font-semibold">{presentation.name}</h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <LeftSidebar />

        {/* Center - Canvas Area */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-auto bg-gray-200 p-8">
            <div className="flex h-full items-center justify-center">
              <div className="rounded-lg bg-white p-12 shadow-lg">
                <h2 className="mb-4 text-2xl font-bold text-gray-800">
                  Prastuti Editor
                </h2>
                <p className="text-gray-600">
                  Canvas will be rendered here in Phase 2
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Presentation: {presentation.name}
                </p>
                <p className="text-sm text-gray-500">
                  Slides: {presentation.slideIds.length}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom - Slide Navigator - Will be added in Phase 2 */}
          <div className="border-t border-gray-300 bg-white p-4">
            <p className="text-center text-sm text-gray-500">
              Slide navigator will be here
            </p>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <RightSidebar />
      </div>
    </div>
  );
}
