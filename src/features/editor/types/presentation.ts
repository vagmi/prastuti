export interface Presentation {
  id: string;
  name: string;
  slideIds: string[];
  slides: Record<string, Slide>;
  defaultDimensions: Dimensions;
  createdAt: number;
  updatedAt: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

// Import Element type from element.ts
import type { Element as SlideElement } from './element';

export interface Slide {
  id: string;
  name: string;
  dimensions: Dimensions;
  background: BackgroundConfig;
  elementIds: string[];
  elements: Record<string, SlideElement>;
  thumbnail?: string; // Base64 data URL
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image';
  fill?: string; // Solid color or gradient
  fillLinearGradientStartPoint?: { x: number; y: number };
  fillLinearGradientEndPoint?: { x: number; y: number };
  fillLinearGradientColorStops?: number[];
  image?: string; // Image URL
  imageFit?: 'fill' | 'cover' | 'contain';
}

// Re-export SlideElement
export type { SlideElement };
