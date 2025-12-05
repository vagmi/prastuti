export interface EditorUIState {
  zoom: number;
  selectedSlideId: string | null;
  selectedElementId: string | null;
  highlightedElementId: string | null;
  activePanel: PanelType;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
  guideLinesVisible: boolean;
  isPlaying: boolean; // Animation preview mode
}

export enum PanelType {
  None = 'none',
  Slides = 'slides',
  Text = 'text',
  Image = 'image',
  Shape = 'shape',
  Animation = 'animation',
  SlideSettings = 'slideSettings',
  // Property panels (shown when element is selected)
  TextProperties = 'textProperties',
  ImageProperties = 'imageProperties',
  ShapeProperties = 'shapeProperties',
}

export interface GuideLines {
  vertical: number[];
  horizontal: number[];
}
