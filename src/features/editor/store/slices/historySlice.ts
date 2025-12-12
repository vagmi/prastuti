import { StateCreator } from 'zustand';
import { Presentation } from '../../types';

interface HistoryState {
  past: Record<string, Presentation[]>;
  future: Record<string, Presentation[]>;
}

export interface HistorySlice extends HistoryState {
  takeSnapshot: (presentationId: string) => void;
  undo: (presentationId: string) => void;
  redo: (presentationId: string) => void;
  canUndo: (presentationId: string) => boolean;
  canRedo: (presentationId: string) => boolean;
  clearPresentationHistory: (presentationId: string) => void;
}

const MAX_HISTORY = 50;

export const createHistorySlice: StateCreator<
  HistorySlice,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  past: {},
  future: {},

  takeSnapshot: (presentationId) => {
    const state = get() as any;
    const presentation = state.presentations?.[presentationId];

    if (!presentation) return;

    // Deep clone presentation
    const snapshot = JSON.parse(JSON.stringify(presentation));

    set((state) => {
      const currentPast = state.past[presentationId] || [];
      return {
        past: {
          ...state.past,
          [presentationId]: [...currentPast, snapshot].slice(-MAX_HISTORY),
        },
        future: {
          ...state.future,
          [presentationId]: [], // Clear redo stack on new action
        },
      };
    });
  },

  undo: (presentationId) => {
    const state = get();
    const presentationPast = state.past[presentationId] || [];

    if (presentationPast.length === 0) return;

    const previous = presentationPast[presentationPast.length - 1];
    const current = (state as any).presentations?.[presentationId];

    if (!current) return;

    const currentFuture = state.future[presentationId] || [];

    set((state) => ({
      past: {
        ...state.past,
        [presentationId]: presentationPast.slice(0, -1),
      },
      future: {
        ...state.future,
        [presentationId]: [current, ...currentFuture].slice(0, MAX_HISTORY),
      },
      presentations: {
        ...(state as any).presentations,
        [presentationId]: previous,
      },
    }));
  },

  redo: (presentationId) => {
    const state = get();
    const presentationFuture = state.future[presentationId] || [];

    if (presentationFuture.length === 0) return;

    const next = presentationFuture[0];
    const current = (state as any).presentations?.[presentationId];

    if (!current) return;

    const currentPast = state.past[presentationId] || [];

    set((state) => ({
      past: {
        ...state.past,
        [presentationId]: [...currentPast, current].slice(-MAX_HISTORY),
      },
      future: {
        ...state.future,
        [presentationId]: presentationFuture.slice(1),
      },
      presentations: {
        ...(state as any).presentations,
        [presentationId]: next,
      },
    }));
  },

  canUndo: (presentationId) => {
    const state = get();
    const presentationPast = state.past[presentationId] || [];
    return presentationPast.length > 0;
  },

  canRedo: (presentationId) => {
    const state = get();
    const presentationFuture = state.future[presentationId] || [];
    return presentationFuture.length > 0;
  },

  clearPresentationHistory: (presentationId) => {
    set((state) => {
      const { [presentationId]: removedPast, ...remainingPast } = state.past;
      const { [presentationId]: removedFuture, ...remainingFuture } = state.future;
      return {
        past: remainingPast,
        future: remainingFuture,
      };
    });
  },
});
