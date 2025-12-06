import { StateCreator } from 'zustand';
import { v4 as uuid } from 'uuid';
import { Presentation, Dimensions, BackgroundConfig, SlideElement } from '../../types';

export interface PresentationSlice {
  presentation: Presentation | null;
  filePath: string | null;
  isTemp: boolean; // Whether this is a temp file
  lastSavedUpdatedAt: number | null; // Track when we last saved to compare with presentation.updatedAt

  // Computed
  isDirty: () => boolean;

  // File Management Actions
  setFilePath: (path: string | null, isTemp: boolean) => void;
  markAsSaved: () => void;
  clearPresentation: () => void;

  // Actions
  createPresentation: (name: string, dimensions: Dimensions) => void;
  loadPresentation: (presentation: Presentation) => void;
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
  presentation: null,
  filePath: null,
  isTemp: false,
  lastSavedUpdatedAt: null,

  isDirty: () => {
    const state = get();
    if (!state.presentation) return false;
    if (state.lastSavedUpdatedAt === null) return true; // Never saved
    return state.presentation.updatedAt > state.lastSavedUpdatedAt;
  },

  setFilePath: (path, isTemp) => {
    set({ filePath: path, isTemp });
  },

  markAsSaved: () => {
    const state = get();
    set({ lastSavedUpdatedAt: state.presentation?.updatedAt || Date.now() });
  },

  clearPresentation: () => {
    set({
      presentation: null,
      filePath: null,
      isTemp: false,
      lastSavedUpdatedAt: null
    });
    (get() as any).clearHistory();
    (get() as any).selectSlide(null);
    (get() as any).selectElement(null);
  },

  createPresentation: (name, dimensions) => {
    const slideId = uuid();
    const presentation: Presentation = {
      id: uuid(),
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

    set({ presentation });

    // Select first slide
    (get() as any).selectSlide(slideId);

    // Trigger history snapshot
    (get() as any).takeSnapshot();
  },

  loadPresentation: (presentation) => {
    set({ presentation });
    (get() as any).clearHistory();

    // Select first slide if none selected
    const selectedSlideId = (get() as any).selectedSlideId;
    if (!selectedSlideId && presentation.slideIds.length > 0) {
      (get() as any).selectSlide(presentation.slideIds[0]);
    }
  },

  updatePresentationName: (name) => {
    set((state) => ({
      presentation: state.presentation
        ? { ...state.presentation, name, updatedAt: Date.now() }
        : null,
    }));
    (get() as any).takeSnapshot();
  },

  createSlide: (afterSlideId) => {
    const slideId = uuid();
    const state = get();

    if (!state.presentation) return slideId;

    const afterIndex = afterSlideId
      ? state.presentation.slideIds.indexOf(afterSlideId)
      : state.presentation.slideIds.length - 1;

    const newSlideIds = [...state.presentation.slideIds];
    newSlideIds.splice(afterIndex + 1, 0, slideId);

    const slideNumber = afterIndex + 2;

    set((state) => ({
      presentation: state.presentation
        ? {
            ...state.presentation,
            slideIds: newSlideIds,
            slides: {
              ...state.presentation.slides,
              [slideId]: {
                id: slideId,
                name: `Slide ${slideNumber}`,
                dimensions: state.presentation.defaultDimensions,
                background: { type: 'color', fill: '#ffffff' },
                elementIds: [],
                elements: {},
              },
            },
            updatedAt: Date.now(),
          }
        : null,
    }));

    // Select the newly created slide
    (get() as any).selectSlide(slideId);

    (get() as any).takeSnapshot();
    return slideId;
  },

  duplicateSlide: (slideId) => {
    const state = get();
    if (!state.presentation?.slides[slideId]) return;

    const sourceSlide = state.presentation.slides[slideId];
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

    const index = state.presentation.slideIds.indexOf(slideId);
    const newSlideIds = [...state.presentation.slideIds];
    newSlideIds.splice(index + 1, 0, newSlideId);

    set((state) => ({
      presentation: state.presentation
        ? {
            ...state.presentation,
            slideIds: newSlideIds,
            slides: {
              ...state.presentation.slides,
              [newSlideId]: {
                ...sourceSlide,
                id: newSlideId,
                name: `${sourceSlide.name} (Copy)`,
                elementIds: newElementIds,
                elements: newElements,
                thumbnail: undefined, // Will regenerate
              },
            },
            updatedAt: Date.now(),
          }
        : null,
    }));

    (get() as any).takeSnapshot();
  },

  deleteSlide: (slideId) => {
    const state = get();
    if (!state.presentation) return;

    const newSlideIds = state.presentation.slideIds.filter((id) => id !== slideId);

    // Must keep at least one slide
    if (newSlideIds.length === 0) return;

    const { [slideId]: deleted, ...remainingSlides } = state.presentation.slides;

    set((state) => ({
      presentation: state.presentation
        ? {
            ...state.presentation,
            slideIds: newSlideIds,
            slides: remainingSlides,
            updatedAt: Date.now(),
          }
        : null,
    }));

    // Clear selection if deleted slide was selected
    const selectedSlideId = (state as any).selectedSlideId;
    if (selectedSlideId === slideId) {
      (get() as any).selectSlide(newSlideIds[0]);
    }

    (get() as any).takeSnapshot();
  },

  reorderSlides: (slideIds) => {
    set((state) => ({
      presentation: state.presentation
        ? {
            ...state.presentation,
            slideIds,
            updatedAt: Date.now(),
          }
        : null,
    }));
    (get() as any).takeSnapshot();
  },

  updateSlideBackground: (slideId, background) => {
    set((state) => ({
      presentation: state.presentation
        ? {
            ...state.presentation,
            slides: {
              ...state.presentation.slides,
              [slideId]: {
                ...state.presentation.slides[slideId],
                background,
              },
            },
            updatedAt: Date.now(),
          }
        : null,
    }));
    (get() as any).takeSnapshot();
  },

  updateSlideDimensions: (slideId, dimensions) => {
    set((state) => ({
      presentation: state.presentation
        ? {
            ...state.presentation,
            slides: {
              ...state.presentation.slides,
              [slideId]: {
                ...state.presentation.slides[slideId],
                dimensions,
              },
            },
            updatedAt: Date.now(),
          }
        : null,
    }));
    (get() as any).takeSnapshot();
  },

  generateSlideThumbnail: (slideId, dataURL) => {
    set((state) => ({
      presentation: state.presentation
        ? {
            ...state.presentation,
            slides: {
              ...state.presentation.slides,
              [slideId]: {
                ...state.presentation.slides[slideId],
                thumbnail: dataURL,
              },
            },
          }
        : null,
    }));
    // Don't take snapshot for thumbnail updates
  },
});
