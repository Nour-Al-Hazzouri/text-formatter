'use client';

/**
 * PreferencesContext - User preferences and local storage management
 * 
 * Manages user settings, format history, templates, and persistent storage
 * Provides type-safe preferences with automatic persistence and validation
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useMemo, 
  useEffect,
  useRef,
  type ReactNode 
} from 'react';

// Import types
import type { 
  UserPreferences,
  FormatType,
  ExportFormat 
} from '@/types/index';
import type { 
  FormattedOutput,
  TextInput 
} from '@/types/formatting';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface HistoryItem {
  /** Unique identifier */
  id: string;
  
  /** Original input */
  input: TextInput;
  
  /** Formatted output */
  output: FormattedOutput;
  
  /** Timestamp */
  timestamp: Date;
  
  /** User-defined title */
  title?: string;
  
  /** Tags for organization */
  tags: string[];
  
  /** Whether item is favorited */
  favorite: boolean;
}

interface Template {
  /** Unique identifier */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description?: string;
  
  /** Associated format type */
  formatType: FormatType;
  
  /** Template configuration */
  config: Record<string, any>;
  
  /** Template pattern/example */
  example?: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last modified timestamp */
  modifiedAt: Date;
  
  /** Usage count */
  usageCount: number;
  
  /** Template tags */
  tags: string[];
  
  /** Whether template is built-in */
  builtIn: boolean;
}

interface PreferencesState {
  /** User preferences */
  preferences: UserPreferences;
  
  /** Format history */
  history: HistoryItem[];
  
  /** Custom templates */
  templates: Template[];
  
  /** Recently used formats */
  recentFormats: FormatType[];
  
  /** Favorite formats */
  favoriteFormats: FormatType[];
  
  /** Application statistics */
  stats: {
    totalProcessed: number;
    totalCharactersProcessed: number;
    formatUsage: Record<FormatType, number>;
    lastUsed: Date | null;
    sessionsCount: number;
  };
  
  /** Storage information */
  storage: {
    used: number;
    available: number;
    quotaExceeded: boolean;
    lastCleanup: Date | null;
  };
}

interface PreferencesContextType {
  /** Current state */
  state: PreferencesState;
  
  /** Preference actions */
  preferences: {
    update: (preferences: Partial<UserPreferences>) => void;
    reset: () => void;
    export: () => string;
    import: (data: string) => boolean;
  };
  
  /** History management */
  history: {
    add: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
    remove: (id: string) => void;
    clear: () => void;
    search: (query: string) => HistoryItem[];
    toggleFavorite: (id: string) => void;
    updateTitle: (id: string, title: string) => void;
    addTags: (id: string, tags: string[]) => void;
    getByFormat: (format: FormatType) => HistoryItem[];
    export: (ids?: string[]) => string;
  };
  
  /** Template management */
  templates: {
    create: (template: Omit<Template, 'id' | 'createdAt' | 'modifiedAt' | 'usageCount'>) => string;
    update: (id: string, updates: Partial<Omit<Template, 'id' | 'createdAt'>>) => void;
    remove: (id: string) => void;
    duplicate: (id: string, name: string) => string;
    incrementUsage: (id: string) => void;
    search: (query: string) => Template[];
    getByFormat: (format: FormatType) => Template[];
    export: (ids?: string[]) => string;
    import: (data: string) => boolean;
  };
  
  /** Statistics */
  stats: {
    recordUsage: (format: FormatType, charactersProcessed: number) => void;
    getMostUsedFormat: () => FormatType | null;
    getProcessingStats: () => PreferencesState['stats'];
    reset: () => void;
  };
  
  /** Storage management */
  storage: {
    cleanup: () => Promise<void>;
    getUsage: () => PreferencesState['storage'];
    clearAll: () => void;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

const defaultPreferences: UserPreferences = {
  theme: {
    mode: 'system',
    accentColor: '#ea580c',
    fontSize: 'medium',
    compactMode: false,
  },
  formatting: {
    defaultMode: 'meeting-notes',
    autoDetect: true,
    preserveOriginal: true,
    showConfidenceScore: true,
  },
  history: {
    enabled: true,
    maxItems: 100,
    autoCleanup: true,
    retentionDays: 30,
  },
  export: {
    defaultFormat: 'markdown',
    includeMetadata: true,
    preserveFormatting: true,
  },
};

const initialState: PreferencesState = {
  preferences: defaultPreferences,
  history: [],
  templates: [],
  recentFormats: [],
  favoriteFormats: [],
  stats: {
    totalProcessed: 0,
    totalCharactersProcessed: 0,
    formatUsage: {
      'meeting-notes': 0,
      'task-lists': 0,
      'journal-notes': 0,
      'shopping-lists': 0,
      'research-notes': 0,
      'study-notes': 0,
    },
    lastUsed: null,
    sessionsCount: 0,
  },
  storage: {
    used: 0,
    available: 0,
    quotaExceeded: false,
    lastCleanup: null,
  },
};

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  PREFERENCES: 'text-formatter-preferences',
  HISTORY: 'text-formatter-history',
  TEMPLATES: 'text-formatter-templates',
  STATS: 'text-formatter-stats',
  RECENT_FORMATS: 'text-formatter-recent-formats',
  FAVORITE_FORMATS: 'text-formatter-favorite-formats',
} as const;

// ============================================================================
// Context Creation
// ============================================================================

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface PreferencesProviderProps {
  children: ReactNode;
  storagePrefix?: string;
}

export function PreferencesProvider({ 
  children, 
  storagePrefix = 'text-formatter' 
}: PreferencesProviderProps) {
  const [state, setState] = useState<PreferencesState>(() => {
    // Load initial state from localStorage
    if (typeof window === 'undefined') {
      return initialState;
    }
    
    return loadFromStorage(storagePrefix);
  });
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced save to localStorage
  const saveToStorage = useCallback((newState: PreferencesState) => {
    if (typeof window === 'undefined') return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          `${storagePrefix}-preferences`, 
          JSON.stringify(newState.preferences)
        );
        localStorage.setItem(
          `${storagePrefix}-history`, 
          JSON.stringify(newState.history)
        );
        localStorage.setItem(
          `${storagePrefix}-templates`, 
          JSON.stringify(newState.templates)
        );
        localStorage.setItem(
          `${storagePrefix}-stats`, 
          JSON.stringify(newState.stats)
        );
        localStorage.setItem(
          `${storagePrefix}-recent-formats`, 
          JSON.stringify(newState.recentFormats)
        );
        localStorage.setItem(
          `${storagePrefix}-favorite-formats`, 
          JSON.stringify(newState.favoriteFormats)
        );
        
        // Update storage usage
        const usage = calculateStorageUsage(storagePrefix);
        setState(prev => ({
          ...prev,
          storage: usage,
        }));
        
      } catch (error) {
        console.error('Failed to save preferences to localStorage:', error);
        
        // Handle quota exceeded
        if (error instanceof DOMException && error.code === 22) {
          setState(prev => ({
            ...prev,
            storage: { ...prev.storage, quotaExceeded: true },
          }));
        }
      }
    }, 500); // 500ms debounce
  }, [storagePrefix]);
  
  // Auto-save when state changes
  useEffect(() => {
    saveToStorage(state);
  }, [state, saveToStorage]);
  
  // Update session count on mount
  useEffect(() => {
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        sessionsCount: prev.stats.sessionsCount + 1,
        lastUsed: new Date(),
      },
    }));
  }, []);
  
  // Preference management
  const preferences = useMemo(() => ({
    update: (updates: Partial<UserPreferences>) => {
      setState(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...updates },
      }));
    },
    
    reset: () => {
      setState(prev => ({
        ...prev,
        preferences: defaultPreferences,
      }));
    },
    
    export: (): string => {
      return JSON.stringify({
        preferences: state.preferences,
        templates: state.templates.filter(t => !t.builtIn),
        favoriteFormats: state.favoriteFormats,
        exportedAt: new Date().toISOString(),
      }, null, 2);
    },
    
    import: (data: string): boolean => {
      try {
        const parsed = JSON.parse(data);
        
        if (parsed.preferences) {
          setState(prev => ({
            ...prev,
            preferences: { ...defaultPreferences, ...parsed.preferences },
          }));
        }
        
        if (parsed.templates) {
          setState(prev => ({
            ...prev,
            templates: [
              ...prev.templates.filter(t => t.builtIn),
              ...parsed.templates.map((t: any) => ({
                ...t,
                id: generateId(),
                createdAt: new Date(),
                modifiedAt: new Date(),
                usageCount: 0,
              })),
            ],
          }));
        }
        
        if (parsed.favoriteFormats) {
          setState(prev => ({
            ...prev,
            favoriteFormats: parsed.favoriteFormats,
          }));
        }
        
        return true;
      } catch (error) {
        console.error('Failed to import preferences:', error);
        return false;
      }
    },
  }), [state.preferences, state.templates, state.favoriteFormats]);
  
  // History management
  const history = useMemo(() => ({
    add: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
      if (!state.preferences.history.enabled) return;
      
      const newItem: HistoryItem = {
        ...item,
        id: generateId(),
        timestamp: new Date(),
      };
      
      setState(prev => {
        let newHistory = [newItem, ...prev.history];
        
        // Apply max items limit
        if (newHistory.length > prev.preferences.history.maxItems) {
          newHistory = newHistory.slice(0, prev.preferences.history.maxItems);
        }
        
        return { ...prev, history: newHistory };
      });
    },
    
    remove: (id: string) => {
      setState(prev => ({
        ...prev,
        history: prev.history.filter(item => item.id !== id),
      }));
    },
    
    clear: () => {
      setState(prev => ({ ...prev, history: [] }));
    },
    
    search: (query: string): HistoryItem[] => {
      const searchTerm = query.toLowerCase().trim();
      if (!searchTerm) return state.history;
      
      return state.history.filter(item => 
        item.title?.toLowerCase().includes(searchTerm) ||
        item.input.content.toLowerCase().includes(searchTerm) ||
        item.output.content.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    },
    
    toggleFavorite: (id: string) => {
      setState(prev => ({
        ...prev,
        history: prev.history.map(item => 
          item.id === id ? { ...item, favorite: !item.favorite } : item
        ),
      }));
    },
    
    updateTitle: (id: string, title: string) => {
      setState(prev => ({
        ...prev,
        history: prev.history.map(item => 
          item.id === id ? { ...item, title } : item
        ),
      }));
    },
    
    addTags: (id: string, tags: string[]) => {
      setState(prev => ({
        ...prev,
        history: prev.history.map(item => 
          item.id === id ? { 
            ...item, 
            tags: [...new Set([...item.tags, ...tags])] 
          } : item
        ),
      }));
    },
    
    getByFormat: (format: FormatType): HistoryItem[] => {
      return state.history.filter(item => item.output.format === format);
    },
    
    export: (ids?: string[]): string => {
      const itemsToExport = ids 
        ? state.history.filter(item => ids.includes(item.id))
        : state.history;
        
      return JSON.stringify({
        history: itemsToExport,
        exportedAt: new Date().toISOString(),
      }, null, 2);
    },
  }), [state.history, state.preferences.history.enabled, state.preferences.history.maxItems]);
  
  // Template management
  const templates = useMemo(() => ({
    create: (template: Omit<Template, 'id' | 'createdAt' | 'modifiedAt' | 'usageCount'>): string => {
      const id = generateId();
      const newTemplate: Template = {
        ...template,
        id,
        createdAt: new Date(),
        modifiedAt: new Date(),
        usageCount: 0,
        builtIn: false,
      };
      
      setState(prev => ({
        ...prev,
        templates: [...prev.templates, newTemplate],
      }));
      
      return id;
    },
    
    update: (id: string, updates: Partial<Omit<Template, 'id' | 'createdAt'>>) => {
      setState(prev => ({
        ...prev,
        templates: prev.templates.map(template => 
          template.id === id 
            ? { ...template, ...updates, modifiedAt: new Date() }
            : template
        ),
      }));
    },
    
    remove: (id: string) => {
      setState(prev => ({
        ...prev,
        templates: prev.templates.filter(template => template.id !== id),
      }));
    },
    
    duplicate: (id: string, name: string): string => {
      const template = state.templates.find(t => t.id === id);
      if (!template) return '';
      
      const newId = generateId();
      const duplicatedTemplate: Template = {
        ...template,
        id: newId,
        name,
        createdAt: new Date(),
        modifiedAt: new Date(),
        usageCount: 0,
        builtIn: false,
      };
      
      setState(prev => ({
        ...prev,
        templates: [...prev.templates, duplicatedTemplate],
      }));
      
      return newId;
    },
    
    incrementUsage: (id: string) => {
      setState(prev => ({
        ...prev,
        templates: prev.templates.map(template => 
          template.id === id 
            ? { ...template, usageCount: template.usageCount + 1 }
            : template
        ),
      }));
    },
    
    search: (query: string): Template[] => {
      const searchTerm = query.toLowerCase().trim();
      if (!searchTerm) return state.templates;
      
      return state.templates.filter(template => 
        template.name.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    },
    
    getByFormat: (format: FormatType): Template[] => {
      return state.templates.filter(template => template.formatType === format);
    },
    
    export: (ids?: string[]): string => {
      const templatesToExport = ids 
        ? state.templates.filter(template => ids.includes(template.id))
        : state.templates.filter(template => !template.builtIn);
        
      return JSON.stringify({
        templates: templatesToExport,
        exportedAt: new Date().toISOString(),
      }, null, 2);
    },
    
    import: (data: string): boolean => {
      try {
        const parsed = JSON.parse(data);
        
        if (parsed.templates && Array.isArray(parsed.templates)) {
          setState(prev => ({
            ...prev,
            templates: [
              ...prev.templates,
              ...parsed.templates.map((t: any) => ({
                ...t,
                id: generateId(),
                createdAt: new Date(t.createdAt || Date.now()),
                modifiedAt: new Date(),
                usageCount: 0,
                builtIn: false,
              })),
            ],
          }));
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Failed to import templates:', error);
        return false;
      }
    },
  }), [state.templates]);
  
  // Statistics management
  const stats = useMemo(() => ({
    recordUsage: (format: FormatType, charactersProcessed: number) => {
      setState(prev => {
        const newRecentFormats = [format, ...prev.recentFormats.filter(f => f !== format)].slice(0, 10);
        
        return {
          ...prev,
          stats: {
            ...prev.stats,
            totalProcessed: prev.stats.totalProcessed + 1,
            totalCharactersProcessed: prev.stats.totalCharactersProcessed + charactersProcessed,
            formatUsage: {
              ...prev.stats.formatUsage,
              [format]: (prev.stats.formatUsage[format] || 0) + 1,
            },
            lastUsed: new Date(),
          },
          recentFormats: newRecentFormats,
        };
      });
    },
    
    getMostUsedFormat: (): FormatType | null => {
      const usage = state.stats.formatUsage;
      const formats = Object.entries(usage) as [FormatType, number][];
      
      if (formats.length === 0) return null;
      
      return formats.reduce((mostUsed, [format, count]) => 
        count > usage[mostUsed] ? format : mostUsed
      , formats[0][0]);
    },
    
    getProcessingStats: () => state.stats,
    
    reset: () => {
      setState(prev => ({
        ...prev,
        stats: {
          ...initialState.stats,
          sessionsCount: prev.stats.sessionsCount,
        },
      }));
    },
  }), [state.stats]);
  
  // Storage management
  const storage = useMemo(() => ({
    cleanup: async () => {
      if (!state.preferences.history.autoCleanup) return;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - state.preferences.history.retentionDays);
      
      setState(prev => ({
        ...prev,
        history: prev.history.filter(item => 
          item.favorite || item.timestamp > cutoffDate
        ),
        storage: {
          ...prev.storage,
          lastCleanup: new Date(),
        },
      }));
    },
    
    getUsage: () => state.storage,
    
    clearAll: () => {
      if (typeof window !== 'undefined') {
        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(`${storagePrefix}-${key}`);
        });
      }
      
      setState(initialState);
    },
  }), [state.preferences.history, state.storage, storagePrefix]);
  
  const contextValue: PreferencesContextType = useMemo(() => ({
    state,
    preferences,
    history,
    templates,
    stats,
    storage,
  }), [state, preferences, history, templates, stats, storage]);
  
  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

export function usePreferences() {
  const context = useContext(PreferencesContext);
  
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  
  return context;
}

// ============================================================================
// Utility Functions
// ============================================================================

function loadFromStorage(prefix: string): PreferencesState {
  try {
    const preferences = localStorage.getItem(`${prefix}-preferences`);
    const history = localStorage.getItem(`${prefix}-history`);
    const templates = localStorage.getItem(`${prefix}-templates`);
    const stats = localStorage.getItem(`${prefix}-stats`);
    const recentFormats = localStorage.getItem(`${prefix}-recent-formats`);
    const favoriteFormats = localStorage.getItem(`${prefix}-favorite-formats`);
    
    return {
      preferences: preferences ? { ...defaultPreferences, ...JSON.parse(preferences) } : defaultPreferences,
      history: history ? JSON.parse(history).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      })) : [],
      templates: templates ? JSON.parse(templates).map((template: any) => ({
        ...template,
        createdAt: new Date(template.createdAt),
        modifiedAt: new Date(template.modifiedAt),
      })) : [],
      stats: stats ? JSON.parse(stats) : initialState.stats,
      recentFormats: recentFormats ? JSON.parse(recentFormats) : [],
      favoriteFormats: favoriteFormats ? JSON.parse(favoriteFormats) : [],
      storage: calculateStorageUsage(prefix),
    };
  } catch (error) {
    console.error('Failed to load preferences from localStorage:', error);
    return initialState;
  }
}

function calculateStorageUsage(prefix: string): PreferencesState['storage'] {
  if (typeof window === 'undefined') {
    return { used: 0, available: 0, quotaExceeded: false, lastCleanup: null };
  }
  
  try {
    let used = 0;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(`${prefix}-${key}`);
      if (item) {
        used += new Blob([item]).size;
      }
    });
    
    // Estimate available storage (5MB typical limit)
    const available = 5 * 1024 * 1024 - used;
    
    return {
      used,
      available: Math.max(0, available),
      quotaExceeded: false,
      lastCleanup: null,
    };
  } catch (error) {
    return { used: 0, available: 0, quotaExceeded: true, lastCleanup: null };
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Enhanced Custom Hooks
// ============================================================================

/**
 * Hook for managing format usage and recommendations
 */
export function useFormatRecommendations() {
  const { state, stats } = usePreferences();
  
  const getRecommendedFormats = useCallback((): FormatType[] => {
    const { formatUsage } = state.stats;
    const sortedByUsage = Object.entries(formatUsage)
      .sort(([, a], [, b]) => b - a)
      .map(([format]) => format as FormatType);
      
    return sortedByUsage.slice(0, 3);
  }, [state.stats]);
  
  return {
    recentFormats: state.recentFormats,
    favoriteFormats: state.favoriteFormats,
    recommendedFormats: getRecommendedFormats(),
    mostUsedFormat: stats.getMostUsedFormat(),
  };
}

/**
 * Hook for managing user settings with validation
 */
export function useUserSettings() {
  const { state, preferences } = usePreferences();
  
  const updateSetting = useCallback(<K extends keyof UserPreferences>(
    category: K,
    setting: Partial<UserPreferences[K]>
  ) => {
    preferences.update({
      [category]: { ...state.preferences[category], ...setting },
    } as Partial<UserPreferences>);
  }, [preferences, state.preferences]);
  
  return {
    preferences: state.preferences,
    updateSetting,
    resetToDefaults: preferences.reset,
  };
}
