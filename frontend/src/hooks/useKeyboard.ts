import { useEffect, useCallback, useRef } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;
type KeyCombo = string | string[];
type KeyMap = Record<string, KeyHandler>;

interface KeyboardOptions {
  target?: HTMLElement | null;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
}

interface ShortcutOptions extends KeyboardOptions {
  description?: string;
  category?: string;
}

const isInputElement = (element: Element): boolean => {
  const tag = element.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    element.isContentEditable
  );
};

const parseKeyCombo = (combo: string): string[] => {
  return combo.toLowerCase().split('+').map(key => key.trim());
};

const matchesKeyCombo = (event: KeyboardEvent, combo: string[]): boolean => {
  const pressedKeys = new Set<string>();
  
  if (event.ctrlKey) pressedKeys.add('ctrl');
  if (event.shiftKey) pressedKeys.add('shift');
  if (event.altKey) pressedKeys.add('alt');
  if (event.metaKey) pressedKeys.add('meta');
  pressedKeys.add(event.key.toLowerCase());

  return combo.every(key => pressedKeys.has(key));
};

export function useKeyboard(keyMap: KeyMap, options: KeyboardOptions = {}) {
  const {
    target = window,
    preventDefault = true,
    stopPropagation = true,
    enabled = true,
  } = options;

  const handlerRef = useRef<KeyMap>(keyMap);
  handlerRef.current = keyMap;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      
      // Skip if we're in an input element
      if (isInputElement(event.target as Element)) return;

      const handler = handlerRef.current[event.key.toLowerCase()];
      if (handler) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        handler(event);
      }
    },
    [enabled, preventDefault, stopPropagation]
  );

  useEffect(() => {
    const element = target || window;
    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [target, handleKeyDown]);
}

export function useShortcuts(shortcuts: Record<KeyCombo, KeyHandler>, options: ShortcutOptions = {}) {
  const {
    target = window,
    preventDefault = true,
    stopPropagation = true,
    enabled = true,
  } = options;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      
      // Skip if we're in an input element
      if (isInputElement(event.target as Element)) return;

      for (const [combo, handler] of Object.entries(shortcutsRef.current)) {
        const keys = Array.isArray(combo) ? combo : parseKeyCombo(combo);
        if (matchesKeyCombo(event, keys)) {
          if (preventDefault) event.preventDefault();
          if (stopPropagation) event.stopPropagation();
          handler(event);
          break;
        }
      }
    },
    [enabled, preventDefault, stopPropagation]
  );

  useEffect(() => {
    const element = target || window;
    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [target, handleKeyDown]);
}

export function useHotkey(key: KeyCombo, handler: KeyHandler, options: ShortcutOptions = {}) {
  useShortcuts({ [key]: handler }, options);
}

// Example usage of keyboard shortcuts for email actions
export const EMAIL_SHORTCUTS = {
  'j': 'Next email',
  'k': 'Previous email',
  'r': 'Reply',
  'a': 'Reply all',
  'f': 'Forward',
  's': 'Star/unstar',
  'u': 'Return to inbox',
  '/': 'Search',
  'esc': 'Close current view',
  'ctrl+enter': 'Send email',
  'cmd+enter': 'Send email (Mac)',
  'ctrl+s': 'Save draft',
  'cmd+s': 'Save draft (Mac)',
  'ctrl+k': 'Open command palette',
  'cmd+k': 'Open command palette (Mac)',
} as const;

// Helper function to check if a key combo is being pressed
export function isKeyComboPressed(event: KeyboardEvent, combo: string): boolean {
  const keys = parseKeyCombo(combo);
  return matchesKeyCombo(event, keys);
}

// Helper function to get a human-readable representation of a key combo
export function formatKeyCombo(combo: string): string {
  return combo
    .split('+')
    .map(key => key.charAt(0).toUpperCase() + key.slice(1))
    .join(' + ');
}