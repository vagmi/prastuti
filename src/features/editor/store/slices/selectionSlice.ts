import { StateCreator } from 'zustand';

export interface SelectionSlice {
  selectedSlideId: string | null;
  selectedElementId: string | null;
  highlightedElementId: string | null;

  selectSlide: (slideId: string | null) => void;
  selectElement: (elementId: string | null) => void;
  highlightElement: (elementId: string | null) => void;
  clearSelection: () => void;
}

export const createSelectionSlice: StateCreator<
  SelectionSlice,
  [],
  [],
  SelectionSlice
> = (set) => ({
  selectedSlideId: null,
  selectedElementId: null,
  highlightedElementId: null,

  selectSlide: (slideId) => {
    set({
      selectedSlideId: slideId,
      selectedElementId: null, // Clear element selection when switching slides
    });
  },

  selectElement: (elementId) => {
    set({
      selectedElementId: elementId,
    });
  },

  highlightElement: (elementId) => {
    set({ highlightedElementId: elementId });
  },

  clearSelection: () => {
    set({ selectedElementId: null });
  },
});
