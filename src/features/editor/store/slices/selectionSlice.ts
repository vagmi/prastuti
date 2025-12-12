import { StateCreator } from 'zustand';

export interface SelectionSlice {
  // Per-presentation selection state
  selectedSlideIds: Record<string, string | null>;
  selectedElementIds: Record<string, string | null>;
  highlightedElementId: string | null; // Global, not per-presentation

  // Helpers to get selection for active presentation
  getSelectedSlideId: (presentationId: string) => string | null;
  getSelectedElementId: (presentationId: string) => string | null;

  selectSlide: (presentationId: string, slideId: string | null) => void;
  selectElement: (presentationId: string, elementId: string | null) => void;
  highlightElement: (elementId: string | null) => void;
  clearSelection: (presentationId: string) => void;
  clearPresentationSelection: (presentationId: string) => void;
}

export const createSelectionSlice: StateCreator<
  SelectionSlice,
  [],
  [],
  SelectionSlice
> = (set, get) => ({
  selectedSlideIds: {},
  selectedElementIds: {},
  highlightedElementId: null,

  getSelectedSlideId: (presentationId) => {
    const state = get();
    return state.selectedSlideIds[presentationId] || null;
  },

  getSelectedElementId: (presentationId) => {
    const state = get();
    return state.selectedElementIds[presentationId] || null;
  },

  selectSlide: (presentationId, slideId) => {
    set((state) => ({
      selectedSlideIds: { ...state.selectedSlideIds, [presentationId]: slideId },
      selectedElementIds: { ...state.selectedElementIds, [presentationId]: null }, // Clear element selection
    }));
  },

  selectElement: (presentationId, elementId) => {
    set((state) => ({
      selectedElementIds: { ...state.selectedElementIds, [presentationId]: elementId },
    }));
  },

  highlightElement: (elementId) => {
    set({ highlightedElementId: elementId });
  },

  clearSelection: (presentationId) => {
    set((state) => ({
      selectedElementIds: { ...state.selectedElementIds, [presentationId]: null },
    }));
  },

  clearPresentationSelection: (presentationId) => {
    set((state) => {
      const { [presentationId]: removedSlide, ...remainingSlides } = state.selectedSlideIds;
      const { [presentationId]: removedElement, ...remainingElements } = state.selectedElementIds;
      return {
        selectedSlideIds: remainingSlides,
        selectedElementIds: remainingElements,
      };
    });
  },
});
