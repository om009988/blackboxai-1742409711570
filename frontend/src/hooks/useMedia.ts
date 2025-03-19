import { useState, useEffect, useMemo } from 'react';
import { BREAKPOINTS } from '../utils/constants';

type MediaQueryObject = {
  [key: string]: string | number;
};

type BreakpointKey = keyof typeof BREAKPOINTS;

interface UseMediaOptions {
  defaultMatches?: boolean;
}

/**
 * Convert a media query object to a media query string
 */
function toMediaQueryString(query: string | MediaQueryObject): string {
  if (typeof query === 'string') return query;
  
  return Object.entries(query)
    .map(([feature, value]) => {
      // Convert camelCase to kebab-case
      const kebabFeature = feature.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      return typeof value === 'number' && feature !== 'gridColumns'
        ? `(${kebabFeature}: ${value}px)`
        : `(${kebabFeature}: ${value})`;
    })
    .join(' and ');
}

/**
 * Hook to handle media queries
 */
export function useMedia(
  query: string | MediaQueryObject,
  options: UseMediaOptions = {}
) {
  const { defaultMatches = false } = options;
  
  // Initialize with defaultMatches if window is not defined (SSR)
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return defaultMatches;
    return window.matchMedia(toMediaQueryString(query)).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(toMediaQueryString(query));
    
    // Initial check
    setMatches(mediaQuery.matches);

    // Create event listener
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
    // Older browsers
    else {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, [query]);

  return matches;
}

/**
 * Hook to handle breakpoints
 */
export function useBreakpoint(breakpoint: BreakpointKey) {
  return useMedia({
    minWidth: BREAKPOINTS[breakpoint]
  });
}

/**
 * Hook to get current active breakpoint
 */
export function useActiveBreakpoint() {
  const breakpoints = useMemo(() => 
    Object.entries(BREAKPOINTS)
      .sort(([, a], [, b]) => b - a), // Sort breakpoints from largest to smallest
    []
  );

  const activeBreakpoints = breakpoints.map(([key, value]) => ({
    key,
    value,
    active: useMedia({ minWidth: value })
  }));

  return activeBreakpoints.find(bp => bp.active)?.key || 'xs';
}

/**
 * Hook to handle responsive values based on breakpoints
 */
export function useResponsive<T>(values: Partial<Record<BreakpointKey, T>>, defaultValue: T) {
  const activeBreakpoint = useActiveBreakpoint();
  const breakpoints = Object.keys(BREAKPOINTS) as BreakpointKey[];
  
  // Find the closest defined breakpoint value
  const currentIndex = breakpoints.indexOf(activeBreakpoint as BreakpointKey);
  for (let i = currentIndex; i >= 0; i--) {
    const value = values[breakpoints[i]];
    if (value !== undefined) return value;
  }
  
  return defaultValue;
}

/**
 * Hook to handle orientation changes
 */
export function useOrientation() {
  const isPortrait = useMedia({ orientation: 'portrait' });
  return {
    isPortrait,
    isLandscape: !isPortrait
  };
}

/**
 * Hook to handle dark mode
 */
export function useDarkMode() {
  const prefersDark = useMedia('(prefers-color-scheme: dark)');
  return prefersDark;
}

/**
 * Hook to handle reduced motion preference
 */
export function useReducedMotion() {
  return useMedia('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to handle high contrast mode
 */
export function useHighContrast() {
  return useMedia('(prefers-contrast: high)');
}

/**
 * Hook to handle hover capability
 */
export function useHoverCapability() {
  return useMedia('(hover: hover)');
}

/**
 * Predefined media query hooks
 */
export const useIsMobile = () => useMedia({ maxWidth: BREAKPOINTS.MD - 1 });
export const useIsTablet = () => useMedia({ minWidth: BREAKPOINTS.MD, maxWidth: BREAKPOINTS.LG - 1 });
export const useIsDesktop = () => useMedia({ minWidth: BREAKPOINTS.LG });
export const useIsRetina = () => useMedia({ minResolution: '2dppx' });