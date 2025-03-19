import { useState, useEffect, useCallback, useRef } from 'react';
import { THEME, BREAKPOINTS } from '../utils/constants';

interface UseUIOptions {
  defaultTheme?: typeof THEME[keyof typeof THEME];
  breakpoint?: number;
}

export function useUI(options: UseUIOptions = {}) {
  const { defaultTheme = THEME.LIGHT, breakpoint = BREAKPOINTS.MD } = options;
  
  // Theme management
  const [theme, setTheme] = useState(defaultTheme);
  const toggleTheme = useCallback(() => {
    setTheme(current => current === THEME.LIGHT ? THEME.DARK : THEME.LIGHT);
  }, []);

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  // Scroll position tracking
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer hook
  function useIntersectionObserver(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ) {
    const observer = useRef<IntersectionObserver | null>(null);

    return useCallback((element: Element | null) => {
      if (observer.current) {
        observer.current.disconnect();
      }

      if (!element) return;

      observer.current = new IntersectionObserver(callback, options);
      observer.current.observe(element);
    }, [callback, options]);
  }

  // Click outside hook
  function useClickOutside(callback: () => void) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
      const handleClick = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          callback();
        }
      };

      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [callback]);

    return ref;
  }

  // Local storage hook
  function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(error);
        return initialValue;
      }
    });

    const setValue = (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(error);
      }
    };

    return [storedValue, setValue] as const;
  }

  // Debounced value hook
  function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }

  // Previous value hook
  function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>();
    
    useEffect(() => {
      ref.current = value;
    }, [value]);
    
    return ref.current;
  }

  // Window focus hook
  function useWindowFocus() {
    const [isFocused, setIsFocused] = useState(document.hasFocus());

    useEffect(() => {
      const onFocus = () => setIsFocused(true);
      const onBlur = () => setIsFocused(false);

      window.addEventListener('focus', onFocus);
      window.addEventListener('blur', onBlur);

      return () => {
        window.removeEventListener('focus', onFocus);
        window.removeEventListener('blur', onBlur);
      };
    }, []);

    return isFocused;
  }

  return {
    theme,
    setTheme,
    toggleTheme,
    isMobile,
    isScrolled,
    useIntersectionObserver,
    useClickOutside,
    useLocalStorage,
    useDebouncedValue,
    usePrevious,
    useWindowFocus,
  };
}