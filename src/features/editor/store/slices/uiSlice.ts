import { StateCreator } from 'zustand';
import { PanelType } from '../../types';

export interface UISlice {
  zoom: number;
  activePanel: PanelType;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
  guideLines: { vertical: number[]; horizontal: number[] };
  isPlaying: boolean;

  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  setActivePanel: (panel: PanelType) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleSnapToGrid: () => void;
  toggleSnapToObjects: () => void;
  setGuideLines: (lines: { vertical: number[]; horizontal: number[] }) => void;
  clearGuideLines: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  zoom: 1,
  activePanel: PanelType.Slides,
  showGrid: false,
  showRulers: false,
  snapToGrid: true,
  snapToObjects: true,
  guideLines: { vertical: [], horizontal: [] },
  isPlaying: false,

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  zoomIn: () => set((state) => ({ zoom: Math.min(5, state.zoom * 1.2) })),

  zoomOut: () => set((state) => ({ zoom: Math.max(0.1, state.zoom / 1.2) })),

  fitToScreen: () => {
    // This will be implemented with actual canvas dimensions
    set({ zoom: 1 });
  },

  setActivePanel: (panel) => set({ activePanel: panel }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),

  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  toggleSnapToObjects: () => set((state) => ({ snapToObjects: !state.snapToObjects })),

  setGuideLines: (lines) => set({ guideLines: lines }),

  clearGuideLines: () => set({ guideLines: { vertical: [], horizontal: [] } }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),
});
