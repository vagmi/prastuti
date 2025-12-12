import { StateCreator } from 'zustand';
import { v4 as uuid } from 'uuid';
import { Element, ElementType, TextElement, ImageElement, ShapeElement } from '../../types';

export interface ElementsSlice {
  // Actions
  createElement: (slideId: string, type: ElementType, props?: Partial<any>) => string;
  updateElement: (slideId: string, elementId: string, props: Partial<any>) => void;
  deleteElement: (slideId: string, elementId: string) => void;
  duplicateElement: (slideId: string, elementId: string) => void;
  reorderElements: (slideId: string, elementIds: string[]) => void;
  bringToFront: (slideId: string, elementId: string) => void;
  sendToBack: (slideId: string, elementId: string) => void;
  bringForward: (slideId: string, elementId: string) => void;
  sendBackward: (slideId: string, elementId: string) => void;
}

export const createElementsSlice: StateCreator<
  ElementsSlice,
  [],
  [],
  ElementsSlice
> = (set, get) => ({
  createElement: (slideId, type, props: any = {}) => {
    const elementId = uuid();
    const state = get() as any;
    const presentationId = state.activePresentationId;

    if (!presentationId || !state.presentations?.[presentationId]?.slides[slideId]) return elementId;

    const presentation = state.presentations[presentationId];
    const slide = presentation.slides[slideId];

    // Create default element based on type
    const baseElement = {
      id: elementId,
      type,
      x: props.x ?? slide.dimensions.width / 2 - 50,
      y: props.y ?? slide.dimensions.height / 2 - 25,
      width: props.width ?? 100,
      height: props.height ?? 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: slide.elementIds.length,
      ...props,
    };

    let element: Element;

    switch (type) {
      case ElementType.Text:
        element = {
          ...baseElement,
          type: ElementType.Text,
          text: props.text ?? 'Text',
          fontSize: props.fontSize ?? 24,
          fontFamily: props.fontFamily ?? 'Arial',
          fontStyle: 'normal',
          fill: props.fill ?? '#000000',
          align: 'left',
          verticalAlign: 'top',
          lineHeight: 1.2,
          letterSpacing: 0,
          textDecoration: '',
          backgroundEnabled: false,
        } as TextElement;
        break;

      case ElementType.Image:
        element = {
          ...baseElement,
          type: ElementType.Image,
          src: props.src ?? '',
        } as ImageElement;
        break;

      case ElementType.Rectangle:
        element = {
          ...baseElement,
          type: ElementType.Rectangle,
          fill: props.fill ?? '#3b82f6',
          stroke: props.stroke ?? '#000000',
          strokeWidth: props.strokeWidth ?? 0,
          cornerRadius: props.cornerRadius ?? 0,
        } as ShapeElement;
        break;

      case ElementType.Circle:
        element = {
          ...baseElement,
          type: ElementType.Circle,
          width: props.width ?? 100,
          height: props.height ?? 100,
          fill: props.fill ?? '#3b82f6',
          stroke: props.stroke ?? '#000000',
          strokeWidth: props.strokeWidth ?? 0,
        } as ShapeElement;
        break;

      case ElementType.Ellipse:
        element = {
          ...baseElement,
          type: ElementType.Ellipse,
          width: props.width ?? 120,
          height: props.height ?? 80,
          fill: props.fill ?? '#3b82f6',
          stroke: props.stroke ?? '#000000',
          strokeWidth: props.strokeWidth ?? 0,
        } as ShapeElement;
        break;

      case ElementType.Polygon:
        element = {
          ...baseElement,
          type: ElementType.Polygon,
          width: props.width ?? 100,
          height: props.height ?? 100,
          fill: props.fill ?? '#3b82f6',
          stroke: props.stroke ?? '#000000',
          strokeWidth: props.strokeWidth ?? 0,
          sides: props.sides ?? 6,
        } as ShapeElement;
        break;

      case ElementType.Star:
        element = {
          ...baseElement,
          type: ElementType.Star,
          width: props.width ?? 100,
          height: props.height ?? 100,
          fill: props.fill ?? '#3b82f6',
          stroke: props.stroke ?? '#000000',
          strokeWidth: props.strokeWidth ?? 0,
          points: props.points ?? 5,
          innerRadius: props.innerRadius ?? 0.5,
          outerRadius: props.outerRadius ?? 1,
        } as ShapeElement;
        break;

      default:
        throw new Error(`Unsupported element type: ${type}`);
    }

    set((state: any) => {
      return {
        presentations: {
          ...state.presentations,
          [presentationId]: {
            ...presentation,
            slides: {
              ...presentation.slides,
              [slideId]: {
                ...slide,
                elementIds: [...slide.elementIds, elementId],
                elements: {
                  ...slide.elements,
                  [elementId]: element,
                },
                thumbnail: undefined, // Clear thumbnail to force regeneration
              },
            },
            updatedAt: Date.now(),
          },
        },
      } as Partial<ElementsSlice>;
    });

    // Auto-select new element
    (get() as any).selectElement(presentationId, elementId);
    (get() as any).takeSnapshot(presentationId);

    return elementId;
  },

  updateElement: (slideId, elementId, props) => {
    const state = get() as any;
    const presentationId = state.activePresentationId;

    if (!presentationId || !state.presentations?.[presentationId]) return;

    set((state: any) => {
      const presentation = state.presentations[presentationId];
      return {
        presentations: {
          ...state.presentations,
          [presentationId]: {
            ...presentation,
            slides: {
              ...presentation.slides,
              [slideId]: {
                ...presentation.slides[slideId],
                elements: {
                  ...presentation.slides[slideId].elements,
                  [elementId]: {
                    ...presentation.slides[slideId].elements[elementId],
                    ...props,
                  },
                },
                thumbnail: undefined, // Clear thumbnail to force regeneration
              },
            },
            updatedAt: Date.now(),
          },
        },
      } as Partial<ElementsSlice>;
    });

    // Note: Don't take snapshot here - will be called on drag/transform end
  },

  deleteElement: (slideId, elementId) => {
    const state = get() as any;
    const presentationId = state.activePresentationId;

    if (!presentationId || !state.presentations?.[presentationId]?.slides[slideId]) return;

    const presentation = state.presentations[presentationId];
    const slide = presentation.slides[slideId];
    const { [elementId]: deleted, ...remainingElements } = slide.elements;
    const newElementIds = slide.elementIds.filter((id: string) => id !== elementId);

    set((state: any) => {
      return {
        presentations: {
          ...state.presentations,
          [presentationId]: {
            ...presentation,
            slides: {
              ...presentation.slides,
              [slideId]: {
                ...slide,
                elementIds: newElementIds,
                elements: remainingElements,
                thumbnail: undefined, // Clear thumbnail to force regeneration
              },
            },
            updatedAt: Date.now(),
          },
        },
      } as Partial<ElementsSlice>;
    });

    // Clear selection if deleted
    const selectedElementId = state.getSelectedElementId(presentationId);
    if (selectedElementId === elementId) {
      (get() as any).selectElement(presentationId, null);
    }

    (get() as any).takeSnapshot(presentationId);
  },

  duplicateElement: (slideId, elementId) => {
    const state = get() as any;
    const presentationId = state.activePresentationId;

    if (!presentationId) return;

    const element = state.presentations?.[presentationId]?.slides[slideId]?.elements[elementId];

    if (!element) return;

    (get() as any).createElement(slideId, element.type, {
      ...element,
      id: undefined,
      x: element.x + 20,
      y: element.y + 20,
    });
  },

  reorderElements: (slideId, elementIds) => {
    const state = get() as any;
    const presentationId = state.activePresentationId;

    if (!presentationId || !state.presentations?.[presentationId]) return;

    set((state: any) => {
      const presentation = state.presentations[presentationId];
      return {
        presentations: {
          ...state.presentations,
          [presentationId]: {
            ...presentation,
            slides: {
              ...presentation.slides,
              [slideId]: {
                ...presentation.slides[slideId],
                elementIds,
              },
            },
            updatedAt: Date.now(),
          },
        },
      } as Partial<ElementsSlice>;
    });
    (get() as any).takeSnapshot(presentationId);
  },

  bringToFront: (slideId, elementId) => {
    const state = get() as any;
    const presentationId = state.activePresentationId;

    if (!presentationId) return;

    const slide = state.presentations?.[presentationId]?.slides[slideId];
    if (!slide) return;

    const newElementIds = slide.elementIds.filter((id: string) => id !== elementId);
    newElementIds.push(elementId);

    (get() as any).reorderElements(slideId, newElementIds);
  },

  sendToBack: (slideId, elementId) => {
    const state = get() as any;
    const presentationId = state.activePresentationId;

    if (!presentationId) return;

    const slide = state.presentations?.[presentationId]?.slides[slideId];
    if (!slide) return;

    const newElementIds = slide.elementIds.filter((id: string) => id !== elementId);
    newElementIds.unshift(elementId);

    (get() as any).reorderElements(slideId, newElementIds);
  },

  bringForward: (slideId, elementId) => {
    const state = get() as any;
    const presentationId = state.activePresentationId;

    if (!presentationId) return;

    const slide = state.presentations?.[presentationId]?.slides[slideId];
    if (!slide) return;

    const currentIndex = slide.elementIds.indexOf(elementId);
    if (currentIndex === slide.elementIds.length - 1) return;

    const newElementIds = [...slide.elementIds];
    [newElementIds[currentIndex], newElementIds[currentIndex + 1]] = [
      newElementIds[currentIndex + 1],
      newElementIds[currentIndex],
    ];

    (get() as any).reorderElements(slideId, newElementIds);
  },

  sendBackward: (slideId, elementId) => {
    const state = get() as any;
    const presentationId = state.activePresentationId;

    if (!presentationId) return;

    const slide = state.presentations?.[presentationId]?.slides[slideId];
    if (!slide) return;

    const currentIndex = slide.elementIds.indexOf(elementId);
    if (currentIndex === 0) return;

    const newElementIds = [...slide.elementIds];
    [newElementIds[currentIndex], newElementIds[currentIndex - 1]] = [
      newElementIds[currentIndex - 1],
      newElementIds[currentIndex],
    ];

    (get() as any).reorderElements(slideId, newElementIds);
  },
});
