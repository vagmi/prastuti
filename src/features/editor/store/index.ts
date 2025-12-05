import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createPresentationSlice, PresentationSlice } from './slices/presentationSlice';
import { createElementsSlice, ElementsSlice } from './slices/elementsSlice';
import { createSelectionSlice, SelectionSlice } from './slices/selectionSlice';
import { createHistorySlice, HistorySlice } from './slices/historySlice';
import { createUISlice, UISlice } from './slices/uiSlice';
import { createAnimationSlice, AnimationSlice } from './slices/animationSlice';

export type EditorStore = PresentationSlice &
  ElementsSlice &
  SelectionSlice &
  HistorySlice &
  UISlice &
  AnimationSlice;

export const useEditorStore = create<EditorStore>()(
  devtools(
    (...a) => ({
      ...createPresentationSlice(...a),
      ...createElementsSlice(...a),
      ...createSelectionSlice(...a),
      ...createHistorySlice(...a),
      ...createUISlice(...a),
      ...createAnimationSlice(...a),
    }),
    { name: 'EditorStore' }
  )
);
