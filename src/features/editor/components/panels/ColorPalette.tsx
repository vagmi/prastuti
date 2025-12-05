// Tailwind color palette organized by hue
export const TAILWIND_COLORS = {
  Gray: [
    { name: 'White', value: '#ffffff' },
    { name: 'Gray 50', value: '#f9fafb' },
    { name: 'Gray 100', value: '#f3f4f6' },
    { name: 'Gray 200', value: '#e5e7eb' },
    { name: 'Gray 300', value: '#d1d5db' },
    { name: 'Gray 400', value: '#9ca3af' },
    { name: 'Gray 500', value: '#6b7280' },
    { name: 'Gray 600', value: '#4b5563' },
    { name: 'Gray 700', value: '#374151' },
    { name: 'Gray 800', value: '#1f2937' },
    { name: 'Gray 900', value: '#111827' },
    { name: 'Black', value: '#000000' },
  ],
  Red: [
    { name: 'Red 50', value: '#fef2f2' },
    { name: 'Red 100', value: '#fee2e2' },
    { name: 'Red 200', value: '#fecaca' },
    { name: 'Red 300', value: '#fca5a5' },
    { name: 'Red 400', value: '#f87171' },
    { name: 'Red 500', value: '#ef4444' },
    { name: 'Red 600', value: '#dc2626' },
    { name: 'Red 700', value: '#b91c1c' },
    { name: 'Red 800', value: '#991b1b' },
    { name: 'Red 900', value: '#7f1d1d' },
  ],
  Orange: [
    { name: 'Orange 50', value: '#fff7ed' },
    { name: 'Orange 100', value: '#ffedd5' },
    { name: 'Orange 200', value: '#fed7aa' },
    { name: 'Orange 300', value: '#fdba74' },
    { name: 'Orange 400', value: '#fb923c' },
    { name: 'Orange 500', value: '#f97316' },
    { name: 'Orange 600', value: '#ea580c' },
    { name: 'Orange 700', value: '#c2410c' },
    { name: 'Orange 800', value: '#9a3412' },
    { name: 'Orange 900', value: '#7c2d12' },
  ],
  Yellow: [
    { name: 'Yellow 50', value: '#fefce8' },
    { name: 'Yellow 100', value: '#fef9c3' },
    { name: 'Yellow 200', value: '#fef08a' },
    { name: 'Yellow 300', value: '#fde047' },
    { name: 'Yellow 400', value: '#facc15' },
    { name: 'Yellow 500', value: '#eab308' },
    { name: 'Yellow 600', value: '#ca8a04' },
    { name: 'Yellow 700', value: '#a16207' },
    { name: 'Yellow 800', value: '#854d0e' },
    { name: 'Yellow 900', value: '#713f12' },
  ],
  Green: [
    { name: 'Green 50', value: '#f0fdf4' },
    { name: 'Green 100', value: '#dcfce7' },
    { name: 'Green 200', value: '#bbf7d0' },
    { name: 'Green 300', value: '#86efac' },
    { name: 'Green 400', value: '#4ade80' },
    { name: 'Green 500', value: '#22c55e' },
    { name: 'Green 600', value: '#16a34a' },
    { name: 'Green 700', value: '#15803d' },
    { name: 'Green 800', value: '#166534' },
    { name: 'Green 900', value: '#14532d' },
  ],
  Blue: [
    { name: 'Blue 50', value: '#eff6ff' },
    { name: 'Blue 100', value: '#dbeafe' },
    { name: 'Blue 200', value: '#bfdbfe' },
    { name: 'Blue 300', value: '#93c5fd' },
    { name: 'Blue 400', value: '#60a5fa' },
    { name: 'Blue 500', value: '#3b82f6' },
    { name: 'Blue 600', value: '#2563eb' },
    { name: 'Blue 700', value: '#1d4ed8' },
    { name: 'Blue 800', value: '#1e40af' },
    { name: 'Blue 900', value: '#1e3a8a' },
  ],
  Purple: [
    { name: 'Purple 50', value: '#faf5ff' },
    { name: 'Purple 100', value: '#f3e8ff' },
    { name: 'Purple 200', value: '#e9d5ff' },
    { name: 'Purple 300', value: '#d8b4fe' },
    { name: 'Purple 400', value: '#c084fc' },
    { name: 'Purple 500', value: '#a855f7' },
    { name: 'Purple 600', value: '#9333ea' },
    { name: 'Purple 700', value: '#7e22ce' },
    { name: 'Purple 800', value: '#6b21a8' },
    { name: 'Purple 900', value: '#581c87' },
  ],
  Pink: [
    { name: 'Pink 50', value: '#fdf2f8' },
    { name: 'Pink 100', value: '#fce7f3' },
    { name: 'Pink 200', value: '#fbcfe8' },
    { name: 'Pink 300', value: '#f9a8d4' },
    { name: 'Pink 400', value: '#f472b6' },
    { name: 'Pink 500', value: '#ec4899' },
    { name: 'Pink 600', value: '#db2777' },
    { name: 'Pink 700', value: '#be185d' },
    { name: 'Pink 800', value: '#9f1239' },
    { name: 'Pink 900', value: '#831843' },
  ],
};

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export default function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
  return (
    <div className="space-y-2">
      {Object.entries(TAILWIND_COLORS).map(([category, colors]) => (
        <div key={category}>
          <div className="text-[9px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">
            {category}
          </div>
          <div className="grid grid-cols-6 gap-1">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => onColorSelect(color.value)}
                className={`w-full aspect-square rounded border-2 transition-all hover:scale-110 ${
                  selectedColor.toLowerCase() === color.value.toLowerCase()
                    ? 'border-purple-500 ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
