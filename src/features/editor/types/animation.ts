export enum AnimationType {
  FadeIn = 'fadeIn',
  FadeOut = 'fadeOut',
  SlideInLeft = 'slideInLeft',
  SlideInRight = 'slideInRight',
  SlideInTop = 'slideInTop',
  SlideInBottom = 'slideInBottom',
  SlideOutLeft = 'slideOutLeft',
  SlideOutRight = 'slideOutRight',
  SlideOutTop = 'slideOutTop',
  SlideOutBottom = 'slideOutBottom',
  ScaleIn = 'scaleIn',
  ScaleOut = 'scaleOut',
  RotateIn = 'rotateIn',
  RotateOut = 'rotateOut',
}

export interface AnimationConfig {
  type: AnimationType;
  duration: number; // milliseconds
  delay: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  // For spring easing (react-motion)
  stiffness?: number;
  damping?: number;
}
