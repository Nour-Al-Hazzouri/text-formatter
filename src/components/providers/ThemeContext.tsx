'use client';

/**
 * ThemeContext - Theme and notebook customization management
 * 
 * Manages theme state, notebook aesthetic customizations, and visual preferences
 * Provides dynamic theme switching and personalization options
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useMemo, 
  useEffect,
  type ReactNode 
} from 'react';

// Import types
import type { UserPreferences } from '@/types/index';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ThemeState {
  /** Current theme mode */
  mode: 'light' | 'dark' | 'system';
  
  /** Current accent color */
  accentColor: string;
  
  /** Font size preference */
  fontSize: 'small' | 'medium' | 'large';
  
  /** Compact mode for smaller screens */
  compactMode: boolean;
  
  /** Notebook aesthetic customizations */
  notebook: {
    /** Paper texture intensity */
    paperIntensity: 'subtle' | 'normal' | 'strong';
    
    /** Show ruled lines on paper */
    showRuledLines: boolean;
    
    /** Show margin lines */
    showMargin: boolean;
    
    /** Spiral binding visibility */
    showBinding: boolean;
    
    /** Animation level */
    animationLevel: 'none' | 'subtle' | 'normal' | 'dynamic';
    
    /** Paper color variant */
    paperColor: 'classic' | 'cream' | 'white' | 'aged';
  };
  
  /** Advanced customization options */
  advanced: {
    /** Custom CSS properties */
    customProperties: Record<string, string>;
    
    /** Font family overrides */
    fontOverrides: {
      heading?: string;
      body?: string;
      mono?: string;
    };
    
    /** Color scheme overrides */
    colorOverrides: Record<string, string>;
  };
}

interface ThemeContextType {
  /** Current theme state */
  state: ThemeState;
  
  /** Theme actions */
  actions: {
    setMode: (mode: ThemeState['mode']) => void;
    setAccentColor: (color: string) => void;
    setFontSize: (size: ThemeState['fontSize']) => void;
    toggleCompactMode: () => void;
    updateNotebookSettings: (settings: Partial<ThemeState['notebook']>) => void;
    updateAdvancedSettings: (settings: Partial<ThemeState['advanced']>) => void;
    resetToDefaults: () => void;
    applyPreferences: (preferences: UserPreferences['theme']) => void;
  };
  
  /** Computed theme values */
  computed: {
    /** Resolved theme mode (system preference resolved) */
    resolvedMode: 'light' | 'dark';
    
    /** CSS custom properties for theme */
    cssVariables: Record<string, string>;
    
    /** Theme classes for components */
    themeClasses: string[];
    
    /** Whether system dark mode is active */
    isSystemDark: boolean;
  };
}

// ============================================================================
// Default Theme Configuration
// ============================================================================

const defaultTheme: ThemeState = {
  mode: 'system',
  accentColor: '#ea580c', // Orange-600 from Tailwind
  fontSize: 'medium',
  compactMode: false,
  notebook: {
    paperIntensity: 'normal',
    showRuledLines: true,
    showMargin: true,
    showBinding: true,
    animationLevel: 'normal',
    paperColor: 'classic',
  },
  advanced: {
    customProperties: {},
    fontOverrides: {},
    colorOverrides: {},
  },
};

// ============================================================================
// Theme Presets
// ============================================================================

const themePresets = {
  classic: {
    ...defaultTheme,
    accentColor: '#ea580c',
    notebook: {
      ...defaultTheme.notebook,
      paperColor: 'classic' as const,
      paperIntensity: 'normal' as const,
    },
  },
  minimal: {
    ...defaultTheme,
    accentColor: '#6b7280',
    notebook: {
      ...defaultTheme.notebook,
      paperColor: 'white' as const,
      paperIntensity: 'subtle' as const,
      showRuledLines: false,
      showMargin: false,
      animationLevel: 'subtle' as const,
    },
  },
  vintage: {
    ...defaultTheme,
    accentColor: '#92400e',
    notebook: {
      ...defaultTheme.notebook,
      paperColor: 'aged' as const,
      paperIntensity: 'strong' as const,
      animationLevel: 'dynamic' as const,
    },
  },
} as const;

// ============================================================================
// Context Creation
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Partial<ThemeState>;
  storageKey?: string;
}

export function ThemeProvider({ 
  children, 
  initialTheme = {},
  storageKey = 'text-formatter-theme' 
}: ThemeProviderProps) {
  const [state, setState] = useState<ThemeState>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...defaultTheme, ...parsed, ...initialTheme };
        }
      } catch (error) {
        console.warn('Failed to load theme from localStorage:', error);
      }
    }
    
    return { ...defaultTheme, ...initialTheme };
  });
  
  const [systemDarkMode, setSystemDarkMode] = useState(false);
  
  // Monitor system dark mode preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Persist theme changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    }
  }, [state, storageKey]);
  
  // Actions
  const actions = useMemo(() => ({
    setMode: (mode: ThemeState['mode']) => {
      setState(prev => ({ ...prev, mode }));
    },
    
    setAccentColor: (accentColor: string) => {
      setState(prev => ({ ...prev, accentColor }));
    },
    
    setFontSize: (fontSize: ThemeState['fontSize']) => {
      setState(prev => ({ ...prev, fontSize }));
    },
    
    toggleCompactMode: () => {
      setState(prev => ({ ...prev, compactMode: !prev.compactMode }));
    },
    
    updateNotebookSettings: (settings: Partial<ThemeState['notebook']>) => {
      setState(prev => ({
        ...prev,
        notebook: { ...prev.notebook, ...settings },
      }));
    },
    
    updateAdvancedSettings: (settings: Partial<ThemeState['advanced']>) => {
      setState(prev => ({
        ...prev,
        advanced: {
          ...prev.advanced,
          ...settings,
          customProperties: {
            ...prev.advanced.customProperties,
            ...settings.customProperties,
          },
          fontOverrides: {
            ...prev.advanced.fontOverrides,
            ...settings.fontOverrides,
          },
          colorOverrides: {
            ...prev.advanced.colorOverrides,
            ...settings.colorOverrides,
          },
        },
      }));
    },
    
    resetToDefaults: () => {
      setState(defaultTheme);
    },
    
    applyPreferences: (preferences: UserPreferences['theme']) => {
      setState(prev => ({
        ...prev,
        mode: preferences.mode,
        accentColor: preferences.accentColor,
        fontSize: preferences.fontSize,
        compactMode: preferences.compactMode,
      }));
    },
  }), []);
  
  // Computed values
  const computed = useMemo(() => {
    const resolvedMode = state.mode === 'system' ? (systemDarkMode ? 'dark' : 'light') : state.mode;
    
    const cssVariables: Record<string, string> = {
      '--accent-color': state.accentColor,
      '--font-size-base': getFontSizeValue(state.fontSize),
      '--paper-intensity': getPaperIntensityValue(state.notebook.paperIntensity),
      '--animation-duration': getAnimationDuration(state.notebook.animationLevel),
      ...state.advanced.customProperties,
    };
    
    // Add theme-specific variables
    if (resolvedMode === 'dark') {
      cssVariables['--background-primary'] = '#0f172a';
      cssVariables['--background-secondary'] = '#1e293b';
      cssVariables['--text-primary'] = '#f8fafc';
      cssVariables['--text-secondary'] = '#cbd5e1';
    } else {
      cssVariables['--background-primary'] = '#ffffff';
      cssVariables['--background-secondary'] = '#f8fafc';
      cssVariables['--text-primary'] = '#0f172a';
      cssVariables['--text-secondary'] = '#475569';
    }
    
    // Add paper color variables
    const paperColors = getPaperColors(state.notebook.paperColor, resolvedMode);
    Object.assign(cssVariables, paperColors);
    
    const themeClasses = [
      `theme-${resolvedMode}`,
      `accent-${getAccentColorName(state.accentColor)}`,
      `font-size-${state.fontSize}`,
      `paper-${state.notebook.paperColor}`,
      `paper-intensity-${state.notebook.paperIntensity}`,
      `animation-${state.notebook.animationLevel}`,
      state.compactMode && 'compact-mode',
      state.notebook.showRuledLines && 'show-ruled-lines',
      state.notebook.showMargin && 'show-margin',
      state.notebook.showBinding && 'show-binding',
    ].filter(Boolean) as string[];
    
    return {
      resolvedMode,
      cssVariables,
      themeClasses,
      isSystemDark: systemDarkMode,
    };
  }, [state, systemDarkMode]);
  
  // Apply CSS variables to document root
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    Object.entries(computed.cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Add theme classes to body
    document.body.className = document.body.className
      .split(' ')
      .filter(cls => !cls.startsWith('theme-') && !cls.startsWith('accent-') && 
                     !cls.startsWith('font-size-') && !cls.startsWith('paper-') &&
                     !cls.startsWith('animation-') && cls !== 'compact-mode' &&
                     cls !== 'show-ruled-lines' && cls !== 'show-margin' && cls !== 'show-binding')
      .concat(computed.themeClasses)
      .join(' ');
      
  }, [computed]);
  
  const contextValue: ThemeContextType = useMemo(() => ({
    state,
    actions,
    computed,
  }), [state, actions, computed]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// ============================================================================
// Utility Functions
// ============================================================================

function getFontSizeValue(size: ThemeState['fontSize']): string {
  switch (size) {
    case 'small': return '0.875rem';
    case 'medium': return '1rem';
    case 'large': return '1.125rem';
    default: return '1rem';
  }
}

function getPaperIntensityValue(intensity: ThemeState['notebook']['paperIntensity']): string {
  switch (intensity) {
    case 'subtle': return '0.3';
    case 'normal': return '0.6';
    case 'strong': return '1';
    default: return '0.6';
  }
}

function getAnimationDuration(level: ThemeState['notebook']['animationLevel']): string {
  switch (level) {
    case 'none': return '0ms';
    case 'subtle': return '150ms';
    case 'normal': return '300ms';
    case 'dynamic': return '500ms';
    default: return '300ms';
  }
}

function getAccentColorName(color: string): string {
  const colorMap: Record<string, string> = {
    '#ea580c': 'orange',
    '#dc2626': 'red',
    '#16a34a': 'green',
    '#2563eb': 'blue',
    '#7c3aed': 'purple',
    '#92400e': 'brown',
    '#6b7280': 'gray',
  };
  
  return colorMap[color] || 'custom';
}

function getPaperColors(paperColor: ThemeState['notebook']['paperColor'], mode: 'light' | 'dark'): Record<string, string> {
  const colors = {
    classic: {
      light: { background: '#fefcf3', border: '#f5f1e8' },
      dark: { background: '#1a1612', border: '#2d2520' },
    },
    cream: {
      light: { background: '#fefdfb', border: '#f8f6f0' },
      dark: { background: '#1c1917', border: '#292524' },
    },
    white: {
      light: { background: '#ffffff', border: '#f1f5f9' },
      dark: { background: '#0f172a', border: '#1e293b' },
    },
    aged: {
      light: { background: '#faf8f0', border: '#f0ebe0' },
      dark: { background: '#171411', border: '#2b251e' },
    },
  };
  
  const selectedColors = colors[paperColor][mode];
  
  return {
    '--paper-background': selectedColors.background,
    '--paper-border': selectedColors.border,
  };
}

// ============================================================================
// Enhanced Custom Hooks for Specific Use Cases
// ============================================================================

/**
 * Hook for managing notebook aesthetic settings
 */
export function useNotebookTheme() {
  const { state, actions } = useTheme();
  
  return {
    settings: state.notebook,
    updateSettings: actions.updateNotebookSettings,
    presets: themePresets,
    applyPreset: (presetName: keyof typeof themePresets) => {
      const preset = themePresets[presetName];
      actions.updateNotebookSettings(preset.notebook);
      actions.setAccentColor(preset.accentColor);
    },
  };
}

/**
 * Hook for managing theme mode with system preference
 */
export function useThemeMode() {
  const { state, actions, computed } = useTheme();
  
  return {
    mode: state.mode,
    resolvedMode: computed.resolvedMode,
    isSystemDark: computed.isSystemDark,
    setMode: actions.setMode,
    toggleMode: () => {
      const nextMode = computed.resolvedMode === 'light' ? 'dark' : 'light';
      actions.setMode(nextMode);
    },
  };
}

/**
 * Hook for dynamic CSS custom properties
 */
export function useThemeVariables() {
  const { computed } = useTheme();
  
  return computed.cssVariables;
}
