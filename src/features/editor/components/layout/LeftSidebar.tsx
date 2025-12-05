import { useEditorStore } from '../../store';
import { PanelType } from '../../types';

export default function LeftSidebar() {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);

  const tools = [
    { id: PanelType.Text, label: 'Text', icon: 'T' },
    { id: PanelType.Image, label: 'Image', icon: 'I' },
    { id: PanelType.Shape, label: 'Shape', icon: 'S' },
  ];

  return (
    <div className="w-20 border-r border-gray-300 bg-gray-50">
      <div className="flex flex-col items-center gap-2 p-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActivePanel(tool.id)}
            className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg border transition-colors ${
              activePanel === tool.id
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
            title={tool.label}
          >
            <span className="text-xl font-bold">{tool.icon}</span>
            <span className="text-xs">{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
