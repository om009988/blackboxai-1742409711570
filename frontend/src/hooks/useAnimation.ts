import { useState, useEffect, useCallback, useRef } from 'react';
import { ANIMATION } from '../utils/constants';

interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  onComplete?: () => void;
}

interface TransitionOptions extends AnimationOptions {
  from: Record<string, string | number>;
  to: Record<string, string | number>;
}

interface FadeOptions extends AnimationOptions {
  initialOpacity?: number;
  targetOpacity?: number;
}

interface SlideOptions extends AnimationOptions {
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: string | number;
}

export function useAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();

  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const animate = useCallback((
    element: HTMLElement,
    options: TransitionOptions
  ) => {
    const {
      from,
      to,
      duration = ANIMATION.NORMAL,
      delay = 0,
      easing = 'ease',
      onComplete
    } = options;

    setIsAnimating(true);
    cleanup();

    // Apply initial styles
    Object.entries(from).forEach(([property, value]) => {
      element.style.setProperty(property, String(value));
    });

    // Force a reflow
    element.offsetHeight;

    // Apply transitions
    const transitions = Object.keys(to).map(
      property => `${property} ${duration}ms ${easing}`
    ).join(', ');
    element.style.transition = transitions;

    setTimeout(() => {
      // Apply final styles
      Object.entries(to).forEach(([property, value]) => {
        element.style.setProperty(property, String(value));
      });

      // Cleanup after animation
      setTimeout(() => {
        element.style.transition = '';
        setIsAnimating(false);
        onComplete?.();
      }, duration);
    }, delay);
  }, [cleanup]);

  const fade = useCallback((
    element: HTMLElement,
    options: FadeOptions = {}
  ) => {
    const {
      initialOpacity = 0,
      targetOpacity = 1,
      duration = ANIMATION.NORMAL,
      delay = 0,
      easing = 'ease',
      onComplete
    } = options;

    animate(element, {
      from: { opacity: String(initialOpacity) },
      to: { opacity: String(targetOpacity) },
      duration,
      delay,
      easing,
      onComplete
    });
  }, [animate]);

  const slide = useCallback((
    element: HTMLElement,
    options: SlideOptions = {}
  ) => {
    const {
      direction = 'up',
      distance = '100%',
      duration = ANIMATION.NORMAL,
      delay = 0,
      easing = 'ease',
      onComplete
    } = options;

    const getTransform = (isFrom: boolean) => {
      const value = isFrom ? distance : '0';
      switch (direction) {
        case 'up':
          return `translateY(${isFrom ? distance : '0'})`;
        case 'down':
          return `translateY(-${isFrom ? distance : '0'})`;
        case 'left':
          return `translateX(${isFrom ? distance : '0'})`;
        case 'right':
          return `translateX(-${isFrom ? distance : '0'})`;
        default:
          return '';
      }
    };

    animate(element, {
      from: { transform: getTransform(true) },
      to: { transform: getTransform(false) },
      duration,
      delay,
      easing,
      onComplete
    });
  }, [animate]);

  const spring = useCallback((
    element: HTMLElement,
    options: TransitionOptions
  ) => {
    const {
      from,
      to,
      duration = ANIMATION.NORMAL,
      delay = 0,
      onComplete
    } = options;

    animate(element, {
      from,
      to,
      duration,
      delay,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Spring easing
      onComplete
    });
  }, [animate]);

  return {
    isAnimating,
    animate,
    fade,
    slide,
    spring,
    cleanup
  };
}

// Helper function to create CSS keyframe animation
export function createKeyframeAnimation(
  name: string,
  keyframes: Record<string, Record<string, string | number>>
): string {
  const keyframeRules = Object.entries(keyframes)
    .map(([percentage, styles]) => {
      const cssStyles = Object.entries(styles)
        .map(([property, value]) => `${property}: ${value};`)
        .join(' ');
      return `${percentage} { ${cssStyles} }`;
    })
    .join('\n');

  return `@keyframes ${name} { ${keyframeRules} }`;
}

// Helper function to apply animation to element
export function applyAnimation(
  element: HTMLElement,
  animationName: string,
  options: AnimationOptions = {}
): void {
  const {
    duration = ANIMATION.NORMAL,
    delay = 0,
    easing = 'ease',
    onComplete
  } = options;

  element.style.animation = `${animationName} ${duration}ms ${easing} ${delay}ms forwards`;

  if (onComplete) {
    element.addEventListener('animationend', onComplete, { once: true });
  }
}