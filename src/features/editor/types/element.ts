import { AnimationConfig } from './animation';

export enum ElementType {
  Text = 'text',
  Image = 'image',
  Rectangle = 'rectangle',
  Circle = 'circle',
}

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  name?: string;
  zIndex: number; // Managed by elementIds order
  animation?: AnimationConfig;
}

export interface TextElement extends BaseElement {
  type: ElementType.Text;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'italic' | 'bold' | 'bold italic';
  fill: string;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
  textDecoration: '' | 'underline' | 'line-through';
  // Text outline/stroke
  stroke?: string; // Outline color
  strokeWidth?: number; // Outline thickness
  // Background box
  backgroundEnabled: boolean;
  backgroundColor?: string;
  backgroundOpacity?: number;
  backgroundPadding?: number;
}

export interface ImageElement extends BaseElement {
  type: ElementType.Image;
  src: string; // File path or data URL
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  filters?: string[]; // 'grayscale', 'blur', etc.
}

export interface ShapeElement extends BaseElement {
  type: ElementType.Rectangle | ElementType.Circle;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number; // For rectangles
  // For circles
  radius?: number;
}

export type Element = TextElement | ImageElement | ShapeElement;
