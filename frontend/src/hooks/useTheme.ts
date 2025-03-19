import { useState, useEffect, useCallback } from 'react';
import { THEME, STORAGE_KEYS } from '../utils/constants';

type ThemeMode = typeof THEME[keyof typeof THEME];

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
}

interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
  fontSize: string;
  spacing: string;
  borderRadius: string;
}

const defaultLightTheme: ThemeColors = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  background: '#FFFFFF',
  text: '#1F2937',
  border: '#E5E7EB',
};

const defaultDarkTheme: ThemeColors = {
  primary: '#60A5FA',
  secondary: '#9CA3AF',
  background: '#1F2937',
  text: '#F9FAFB',
  border: '#374151',
};

interface UseThemeOptions {
  defaultMode?: ThemeMode;
  defaultColors?: Partial<ThemeColors>;
  persistTheme?: boolean;
}

export function useTheme(options: UseThemeOptions = {}) {
  const {
    defaultMode = THEME.LIGHT,
    defaultColors = {},
    persistTheme = true,
  } = options;

  // Initialize theme state from localStorage or defaults
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    if (persistTheme) {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme) {
        return JSON.parse(savedTheme);
      }
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = prefersDark ? THEME.DARK : defaultMode;

    return {
      mode: initialMode,
      colors: {
        ...(initialMode === THEME.DARK ? defaultDarkTheme : defaultLightTheme),
        ...defaultColors,
      },
      fontSize: '16px',
      spacing: '1rem',
      borderRadius: '0.375rem',
    };
  });

  // Update theme in localStorage when it changes
  useEffect(() => {
    if (persistTheme) {
      localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(themeConfig));
    }
  }, [themeConfig, persistTheme]);

  // Toggle theme mode
  const toggleTheme = useCallback(() => {
    setThemeConfig(prev => ({
      ...prev,
      mode: prev.mode === THEME.LIGHT ? THEME.DARK : THEME.LIGHT,
      colors:
        prev.mode === THEME.LIGHT
          ? { ...defaultDarkTheme, ...defaultColors }
          : { ...defaultLightTheme, ...defaultColors },
    }));
  }, [defaultColors]);

  // Update specific theme properties
  const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
    setThemeConfig(prev => ({
      ...prev,
      ...updates,
      colors: {
        ...prev.colors,
        ...(updates.colors || {}),
      },
    }));
  }, []);

  // Reset theme to defaults
  const resetTheme = useCallback(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = prefersDark ? THEME.DARK : defaultMode;

    setThemeConfig({
      mode: initialMode,
      colors: {
        ...(initialMode === THEME.DARK ? defaultDarkTheme : defaultLightTheme),
        ...defaultColors,
      },
      fontSize: '16px',
      spacing: '1rem',
      borderRadius: '0.375rem',
    });
  }, [defaultMode, defaultColors]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const { mode, colors, fontSize, spacing, borderRadius } = themeConfig;

    // Set CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    root.style.setProperty('--font-size-base', fontSize);
    root.style.setProperty('--spacing-base', spacing);
    root.style.setProperty('--border-radius', borderRadius);

    // Set theme class
    root.classList.remove(THEME.LIGHT, THEME.DARK);
    root.classList.add(mode);

    // Set color scheme meta tag
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', colors.background);
    }
  }, [themeConfig]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (!persistTheme) {
        setThemeConfig(prev => ({
          ...prev,
          mode: e.matches ? THEME.DARK : THEME.LIGHT,
          colors: e.matches ? defaultDarkTheme : defaultLightTheme,
        }));
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [persistTheme]);

  return {
    theme: themeConfig,
    isDark: themeConfig.mode === THEME.DARK,
    toggleTheme,
    updateTheme,
    resetTheme,
  };
}

// Helper function to generate CSS variables string
export function generateThemeVariables(colors: ThemeColors): string {
  return Object.entries(colors)
    .map(([key, value]) => `--color-${key}: ${value};`)
    .join('\n');
}

// Helper function to get theme-aware color
export function getThemeColor(color: keyof ThemeColors, theme: ThemeConfig): string {
  return theme.colors[color];
}

// Helper function to generate color variations
export function generateColorVariations(baseColor: string, variations: number = 9): Record<number, string> {
  const colors: Record<number, string> = {};
  
  for (let i = 1; i <= variations; i++) {
    const lightness = (100 / variations) * i;
    colors[i * 100] = `color-mix(in srgb, ${baseColor}, white ${lightness}%)`;
  }
  
  return colors;
}