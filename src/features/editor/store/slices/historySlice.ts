import { StateCreator } from 'zustand';
import { Presentation } from '../../types';

interface HistoryState {
  past: Presentation[];
  future: Presentation[];
}

export interface HistorySlice extends HistoryState {
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

const MAX_HISTORY = 50;

export const createHistorySlice: StateCreator<
  HistorySlice,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  past: [],
  future: [],

  takeSnapshot: () => {
    const state = get() as any;
    const presentation = state.presentation;

    if (!presentation) return;

    // Deep clone presentation
    const snapshot = JSON.parse(JSON.stringify(presentation));

    set((state) => ({
      past: [...state.past, snapshot].slice(-MAX_HISTORY),
      future: [], // Clear redo stack on new action
    }));
  },

  undo: () => {
    const state = get();

    if (state.past.length === 0) return;

    const previous = state.past[state.past.length - 1];
    const current = (state as any).presentation;

    set({
      past: state.past.slice(0, -1),
      future: [current, ...state.future].slice(0, MAX_HISTORY),
    });

    (get() as any).loadPresentation(previous);
  },

  redo: () => {
    const state = get();

    if (state.future.length === 0) return;

    const next = state.future[0];
    const current = (state as any).presentation;

    set({
      past: [...state.past, current].slice(-MAX_HISTORY),
      future: state.future.slice(1),
    });

    (get() as any).loadPresentation(next);
  },

  canUndo: () => get().past.length > 0,

  canRedo: () => get().future.length > 0,

  clearHistory: () => {
    set({ past: [], future: [] });
  },
});
