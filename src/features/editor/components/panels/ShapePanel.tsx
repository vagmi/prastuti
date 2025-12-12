import { useEditorStore } from '../../store';
import { ElementType, PanelType } from '../../types';

// Shape presets with their default properties
const SHAPE_PRESETS = [
  {
    type: ElementType.Rectangle,
    label: 'Rectangle',
    icon: '□',
  },
  {
    type: ElementType.Circle,
    label: 'Circle',
    icon: '○',
  },
  {
    type: ElementType.Ellipse,
    label: 'Ellipse',
    icon: '◯',
  },
  {
    type: ElementType.Polygon,
    label: 'Polygon',
    icon: '⬡',
  },
  {
    type: ElementType.Star,
    label: 'Star',
    icon: '★',
  },
];

export default function ShapePanel() {
  const activePresentationId = useEditorStore((s) => s.activePresentationId);
  const selectedSlideId = useEditorStore((s) =>
    s.activePresentationId ? s.selectedSlideIds[s.activePresentationId] : null
  );
  const createElement = useEditorStore((s) => s.createElement);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);

  const handleAddShape = (shapeType: ElementType) => {
    if (!selectedSlideId) return;

    createElement(selectedSlideId, shapeType, {});

    // Clear the active panel so clicking on background shows slide properties
    setActivePanel(PanelType.None);
  };

  return (
    <div className="space-y-6">
      {/* Shape Type Grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Select a shape</h3>
        <div className="grid grid-cols-2 gap-3">
          {SHAPE_PRESETS.map((shape) => (
            <button
              key={shape.type}
              onClick={() => handleAddShape(shape.type)}
              className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <div className="text-4xl text-gray-700 mb-2">{shape.icon}</div>
              <div className="text-sm font-medium text-gray-700">{shape.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Shape Tips</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Click to add a shape to your slide</li>
          <li>• Drag corners to resize</li>
          <li>• Use rotation handle to rotate</li>
          <li>• Customize colors in properties panel</li>
        </ul>
      </div>
    </div>
  );
}
