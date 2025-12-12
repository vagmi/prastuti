import { StateCreator } from 'zustand';
import { v4 as uuid } from 'uuid';
import { Presentation, Dimensions, BackgroundConfig, SlideElement } from '../../types';

export interface PresentationSlice {
  // Multi-presentation state
  presentations: Record<string, Presentation>;
  presentationIds: string[];
  activePresentationId: string | null;
  filePaths: Record<string, string | null>;
  isTemp: Record<string, boolean>;
  lastSavedUpdatedAt: Record<string, number | null>;

  // Computed/helpers
  getActivePresentation: () => Presentation | null;
  isDirty: (presentationId: string) => boolean;

  // Tab Management
  setActivePresentation: (presentationId: string) => void;
  closePresentation: (presentationId: string) => void;

  // File Management Actions
  setFilePath: (presentationId: string, path: string | null, isTemp: boolean) => void;
  markAsSaved: (presentationId: string) => void;

  // Actions
  createPresentation: (name: string, dimensions: Dimensions) => string;
  loadPresentation: (presentation: Presentation, filePath: string) => string;
  updatePresentationName: (name: string) => void;

  // Slide CRUD
  createSlide: (afterSlideId?: string) => string;
  duplicateSlide: (slideId: string) => void;
  deleteSlide: (slideId: string) => void;
  reorderSlides: (slideIds: string[]) => void;
  updateSlideBackground: (slideId: string, background: BackgroundConfig) => void;
  updateSlideDimensions: (slideId: string, dimensions: Dimensions) => void;
  generateSlideThumbnail: (slideId: string, dataURL: string) => void;
}

export const createPresentationSlice: StateCreator<
  PresentationSlice,
  [],
  [],
  PresentationSlice
> = (set, get) => ({
  presentations: {},
  presentationIds: [],
  activePresentationId: null,
  filePaths: {},
  isTemp: {},
  lastSavedUpdatedAt: {},

  getActivePresentation: () => {
    const state = get();
    if (!state.activePresentationId) return null;
    return state.presentations[state.activePresentationId] || null;
  },

  isDirty: (presentationId: string) => {
    const state = get();
    const presentation = state.presentations[presentationId];
    if (!presentation) return false;
    const lastSaved = state.lastSavedUpdatedAt[presentationId];
    if (lastSaved === null || lastSaved === undefined) return true; // Never saved
    return presentation.updatedAt > lastSaved;
  },

  setActivePresentation: (presentationId) => {
    set({ activePresentationId: presentationId });
  },

  closePresentation: (presentationId) => {
    const state = get();

    // Remove from presentations
    const { [presentationId]: removed, ...remainingPresentations } = state.presentations;
    const newPresentationIds = state.presentationIds.filter(id => id !== presentationId);

    // Remove metadata
    const { [presentationId]: removedPath, ...remainingPaths } = state.filePaths;
    const { [presentationId]: removedTemp, ...remainingTemp } = state.isTemp;
    const { [presentationId]: removedSaved, ...remainingSaved } = state.lastSavedUpdatedAt;

    // Update active presentation if needed
    let newActiveId = state.activePresentationId;
    if (state.activePresentationId === presentationId) {
      const currentIndex = state.presentationIds.indexOf(presentationId);
      if (newPresentationIds.length > 0) {
        // Select next tab, or previous if this was the last one
        const nextIndex = currentIndex < newPresentationIds.length ? currentIndex : currentIndex - 1;
        newActiveId = newPresentationIds[Math.max(0, nextIndex)];
      } else {
        newActiveId = null;
      }
    }

    set({
      presentations: remainingPresentations,
      presentationIds: newPresentationIds,
      activePresentationId: newActiveId,
      filePaths: remainingPaths,
      isTemp: remainingTemp,
      lastSavedUpdatedAt: remainingSaved,
    });

    // Clean up related state for this presentation
    (get() as any).clearPresentationSelection?.(presentationId);
    (get() as any).clearPresentationHistory?.(presentationId);
  },

  setFilePath: (presentationId, path, isTempFile) => {
    set((state) => ({
      filePaths: { ...state.filePaths, [presentationId]: path },
      isTemp: { ...state.isTemp, [presentationId]: isTempFile },
    }));
  },

  markAsSaved: (presentationId) => {
    const state = get();
    const presentation = state.presentations[presentationId];
    set((state) => ({
      lastSavedUpdatedAt: {
        ...state.lastSavedUpdatedAt,
        [presentationId]: presentation?.updatedAt || Date.now(),
      },
    }));
  },

  createPresentation: (name, dimensions) => {
    const presentationId = uuid();
    const slideId = uuid();
    const presentation: Presentation = {
      id: presentationId,
      name,
      slideIds: [slideId],
      slides: {
        [slideId]: {
          id: slideId,
          name: 'Slide 1',
          dimensions,
          background: { type: 'color', fill: '#ffffff' },
          elementIds: [],
          elements: {},
        },
      },
      defaultDimensions: dimensions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      presentations: { ...state.presentations, [presentationId]: presentation },
      presentationIds: [...state.presentationIds, presentationId],
      activePresentationId: presentationId,
      filePaths: { ...state.filePaths, [presentationId]: null },
      isTemp: { ...state.isTemp, [presentationId]: false },
      lastSavedUpdatedAt: { ...state.lastSavedUpdatedAt, [presentationId]: null },
    }));

    // Select first slide
    (get() as any).selectSlide(presentationId, slideId);

    // Trigger history snapshot
    (get() as any).takeSnapshot(presentationId);

    return presentationId;
  },

  loadPresentation: (presentation, filePath) => {
    const presentationId = presentation.id;

    set((state) => ({
      presentations: { ...state.presentations, [presentationId]: presentation },
      presentationIds: [...state.presentationIds, presentationId],
      activePresentationId: presentationId,
      filePaths: { ...state.filePaths, [presentationId]: filePath },
      isTemp: { ...state.isTemp, [presentationId]: false },
      lastSavedUpdatedAt: { ...state.lastSavedUpdatedAt, [presentationId]: presentation.updatedAt },
    }));

    // Clear history for this presentation
    (get() as any).clearPresentationHistory?.(presentationId);

    // Select first slide if available
    if (presentation.slideIds.length > 0) {
      (get() as any).selectSlide(presentationId, presentation.slideIds[0]);
    }

    return presentationId;
  },

  updatePresentationName: (name) => {
    const state = get();
    const presentationId = state.activePresentationId;
    if (!presentationId) return;

    set((state) => ({
      presentations: {
        ...state.presentations,
        [presentationId]: {
          ...state.presentations[presentationId],
          name,
          updatedAt: Date.now(),
        },
      },
    }));
    (get() as any).takeSnapshot(presentationId);
  },

  createSlide: (afterSlideId) => {
    const slideId = uuid();
    const state = get();
    const presentationId = state.activePresentationId;
    if (!presentationId) return slideId;

    const presentation = state.presentations[presentationId];
    if (!presentation) return slideId;

    const afterIndex = afterSlideId
      ? presentation.slideIds.indexOf(afterSlideId)
      : presentation.slideIds.length - 1;

    const newSlideIds = [...presentation.slideIds];
    newSlideIds.splice(afterIndex + 1, 0, slideId);

    const slideNumber = afterIndex + 2;

    set((state) => ({
      presentations: {
        ...state.presentations,
        [presentationId]: {
          ...presentation,
          slideIds: newSlideIds,
          slides: {
            ...presentation.slides,
            [slideId]: {
              id: slideId,
              name: `Slide ${slideNumber}`,
              dimensions: presentation.defaultDimensions,
              background: { type: 'color', fill: '#ffffff' },
              elementIds: [],
              elements: {},
            },
          },
          updatedAt: Date.now(),
        },
      },
    }));

    // Select the newly created slide
    (get() as any).selectSlide(presentationId, slideId);

    (get() as any).takeSnapshot(presentationId);
    return slideId;
  },

  duplicateSlide: (slideId) => {
    const state = get();
    const presentationId = state.activePresentationId;
    if (!presentationId) return;

    const presentation = state.presentations[presentationId];
    if (!presentation?.slides[slideId]) return;

    const sourceSlide = presentation.slides[slideId];
    const newSlideId = uuid();

    // Deep clone elements with new IDs
    const newElements: Record<string, SlideElement> = {};
    const newElementIds: string[] = [];

    sourceSlide.elementIds.forEach((oldId) => {
      const newId = uuid();
      newElementIds.push(newId);
      newElements[newId] = {
        ...sourceSlide.elements[oldId],
        id: newId,
      };
    });

    const index = presentation.slideIds.indexOf(slideId);
    const newSlideIds = [...presentation.slideIds];
    newSlideIds.splice(index + 1, 0, newSlideId);

    set((state) => ({
      presentations: {
        ...state.presentations,
        [presentationId]: {
          ...presentation,
          slideIds: newSlideIds,
          slides: {
            ...presentation.slides,
            [newSlideId]: {
              ...sourceSlide,
              id: newSlideId,
              name: `${sourceSlide.name} (Copy)`,
              elementIds: newElementIds,
              elements: newElements,
              thumbnail: undefined,
            },
          },
          updatedAt: Date.now(),
        },
      },
    }));

    (get() as any).takeSnapshot(presentationId);
  },

  deleteSlide: (slideId) => {
    const state = get();
    const presentationId = state.activePresentationId;
    if (!presentationId) return;

    const presentation = state.presentations[presentationId];
    if (!presentation) return;

    const newSlideIds = presentation.slideIds.filter((id) => id !== slideId);

    // Must keep at least one slide
    if (newSlideIds.length === 0) return;

    const { [slideId]: deleted, ...remainingSlides } = presentation.slides;

    set((state) => ({
      presentations: {
        ...state.presentations,
        [presentationId]: {
          ...presentation,
          slideIds: newSlideIds,
          slides: remainingSlides,
          updatedAt: Date.now(),
        },
      },
    }));

    // Clear selection if deleted slide was selected
    const selectedSlideId = (state as any).getSelectedSlideId?.(presentationId);
    if (selectedSlideId === slideId) {
      (get() as any).selectSlide(presentationId, newSlideIds[0]);
    }

    (get() as any).takeSnapshot(presentationId);
  },

  reorderSlides: (slideIds) => {
    const state = get();
    const presentationId = state.activePresentationId;
    if (!presentationId) return;

    const presentation = state.presentations[presentationId];
    if (!presentation) return;

    set((state) => ({
      presentations: {
        ...state.presentations,
        [presentationId]: {
          ...presentation,
          slideIds,
          updatedAt: Date.now(),
        },
      },
    }));
    (get() as any).takeSnapshot(presentationId);
  },

  updateSlideBackground: (slideId, background) => {
    const state = get();
    const presentationId = state.activePresentationId;
    if (!presentationId) return;

    const presentation = state.presentations[presentationId];
    if (!presentation) return;

    set((state) => ({
      presentations: {
        ...state.presentations,
        [presentationId]: {
          ...presentation,
          slides: {
            ...presentation.slides,
            [slideId]: {
              ...presentation.slides[slideId],
              background,
              thumbnail: undefined, // Clear thumbnail to force regeneration
            },
          },
          updatedAt: Date.now(),
        },
      },
    }));
    (get() as any).takeSnapshot(presentationId);
  },

  updateSlideDimensions: (slideId, dimensions) => {
    const state = get();
    const presentationId = state.activePresentationId;
    if (!presentationId) return;

    const presentation = state.presentations[presentationId];
    if (!presentation) return;

    set((state) => ({
      presentations: {
        ...state.presentations,
        [presentationId]: {
          ...presentation,
          slides: {
            ...presentation.slides,
            [slideId]: {
              ...presentation.slides[slideId],
              dimensions,
              thumbnail: undefined, // Clear thumbnail to force regeneration
            },
          },
          updatedAt: Date.now(),
        },
      },
    }));
    (get() as any).takeSnapshot(presentationId);
  },

  generateSlideThumbnail: (slideId, dataURL) => {
    const state = get();
    const presentationId = state.activePresentationId;
    if (!presentationId) return;

    const presentation = state.presentations[presentationId];
    if (!presentation) return;

    set((state) => ({
      presentations: {
        ...state.presentations,
        [presentationId]: {
          ...presentation,
          slides: {
            ...presentation.slides,
            [slideId]: {
              ...presentation.slides[slideId],
              thumbnail: dataURL,
            },
          },
        },
      },
    }));
    // Don't take snapshot for thumbnail updates
  },
});
