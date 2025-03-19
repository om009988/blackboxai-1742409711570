import { useState, useEffect, useCallback, useRef } from 'react';

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

// Interval hook
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// Timeout hook
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    
    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

// Update effect hook
export function useUpdateEffect(effect: () => void, deps: any[]) {
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
    } else {
      return effect();
    }
  }, deps);
}

// Boolean toggle hook
export function useToggle(initialValue: boolean = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  
  return [value, toggle];
}

// Counter hook
export function useCounter(initialValue: number = 0, options: { min?: number; max?: number } = {}) {
  const { min, max } = options;
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(c => (max !== undefined ? Math.min(c + 1, max) : c + 1));
  }, [max]);

  const decrement = useCallback(() => {
    setCount(c => (min !== undefined ? Math.max(c - 1, min) : c - 1));
  }, [min]);

  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  return { count, increment, decrement, reset, setCount };
}

// Array hook
export function useArray<T>(initialValue: T[] = []) {
  const [array, setArray] = useState<T[]>(initialValue);

  const push = useCallback((element: T) => {
    setArray(a => [...a, element]);
  }, []);

  const remove = useCallback((index: number) => {
    setArray(a => a.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => {
    setArray([]);
  }, []);

  const update = useCallback((index: number, newElement: T) => {
    setArray(a => [...a.slice(0, index), newElement, ...a.slice(index + 1)]);
  }, []);

  return { array, set: setArray, push, remove, clear, update };
}

// Map hook
export function useMap<K, V>(initialValue: Map<K, V> = new Map()) {
  const [map, setMap] = useState(initialValue);

  const set = useCallback((key: K, value: V) => {
    setMap(m => new Map(m).set(key, value));
  }, []);

  const remove = useCallback((key: K) => {
    setMap(m => {
      const newMap = new Map(m);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const clear = useCallback(() => {
    setMap(new Map());
  }, []);

  return { map, set, remove, clear };
}

// Set hook
export function useSet<T>(initialValue: Set<T> = new Set()) {
  const [set, setSet] = useState(initialValue);

  const add = useCallback((element: T) => {
    setSet(s => new Set(s).add(element));
  }, []);

  const remove = useCallback((element: T) => {
    setSet(s => {
      const newSet = new Set(s);
      newSet.delete(element);
      return newSet;
    });
  }, []);

  const clear = useCallback(() => {
    setSet(new Set());
  }, []);

  return { set, add, remove, clear };
}

// Types
export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;
export type UseStateResult<T> = [T, SetState<T>];
export type VoidFunction = () => void;
export type AnyFunction = (...args: any[]) => any;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;