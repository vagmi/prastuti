import { useEditorStore } from '../../store';
import { PanelType } from '../../types';

export default function RightSidebar() {
  const activePanel = useEditorStore((s) => s.activePanel);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);

  return (
    <div className="w-80 border-l border-gray-300 bg-white">
      <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {activePanel === PanelType.Text && 'Text Tools'}
          {activePanel === PanelType.Image && 'Image Tools'}
          {activePanel === PanelType.Shape && 'Shape Tools'}
          {activePanel === PanelType.Slides && 'Slides'}
          {activePanel === PanelType.TextProperties && 'Text Properties'}
          {activePanel === PanelType.ImageProperties && 'Image Properties'}
          {activePanel === PanelType.ShapeProperties && 'Shape Properties'}
        </h2>

        {selectedElementId ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              Element properties will be shown here in Phase 4
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Selected: {selectedElementId}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              Tool panels will be shown here
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Active panel: {activePanel}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
