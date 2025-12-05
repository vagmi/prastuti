import { StateCreator } from 'zustand';
import { AnimationConfig } from '../../types';

export interface AnimationSlice {
  updateElementAnimation: (
    slideId: string,
    elementId: string,
    animation: AnimationConfig | undefined
  ) => void;
  removeElementAnimation: (slideId: string, elementId: string) => void;
}

export const createAnimationSlice: StateCreator<
  AnimationSlice,
  [],
  [],
  AnimationSlice
> = (_set, get) => ({
  updateElementAnimation: (slideId, elementId, animation) => {
    (get() as any).updateElement(slideId, elementId, { animation });
    (get() as any).takeSnapshot();
  },

  removeElementAnimation: (slideId, elementId) => {
    (get() as any).updateElement(slideId, elementId, { animation: undefined });
    (get() as any).takeSnapshot();
  },
});
