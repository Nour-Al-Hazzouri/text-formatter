'use client';

/**
 * StorageContext - Unified storage management for React components
 * 
 * Provides React hooks and context for all storage systems including
 * preferences, history, templates, and cache management
 */

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useCallback, 
  useMemo, 
  useEffect,
  useRef,
  type ReactNode 
} from 'react';

// Import storage modules
import { preferencesStorage } from '@/lib/storage/PreferencesStorage';
import { historyStorage } from '@/lib/storage/HistoryStorage';
import { templateStorage } from '@/lib/storage/TemplateStorage';
import { cacheStorage } from '@/lib/storage/CacheStorage';

// Import types
import type { 
  UserPreferences,
  FormatType,
  Result
} from '@/types/index';
import type { HistoryItem, HistorySearchOptions, HistoryStats } from '@/lib/storage/HistoryStorage';
import type { FormattingTemplate, TemplateSearchOptions } from '@/lib/storage/TemplateStorage';
import type { CacheStats } from '@/lib/storage/CacheStorage';
import type { StorageError } from '@/lib/storage/LocalStorageWrapper';

// ============================================================================
// Context State Types
// ============================================================================

interface StorageContextState {
  /** Storage initialization status */
  initialization: {
    preferences: 'idle' | 'loading' | 'loaded' | 'error';
    history: 'idle' | 'loading' | 'loaded' | 'error';
    templates: 'idle' | 'loading' | 'loaded' | 'error';
    cache: 'idle' | 'loading' | 'loaded' | 'error';
  };
  
  /** Current user preferences */
  preferences: UserPreferences | null;
  
  /** Recent history items cache */
  recentHistory: HistoryItem[];
  
  /** Available templates cache */
  templates: FormattingTemplate[];
  
  /** Storage statistics */
  stats: {
    history?: HistoryStats;
    cache?: CacheStats;
    templates?: {
      total: number;
      byFormat: Record<FormatType, number>;
    };
  };
  
  /** Error states */
  errors: {
    preferences?: StorageError;
    history?: StorageError;
    templates?: StorageError;
    cache?: StorageError;
  };
  
  /** Loading states for async operations */
  loading: {
    savingPreferences: boolean;
    addingHistory: boolean;
    searchingHistory: boolean;
    loadingTemplates: boolean;
    clearingCache: boolean;
  };
}

type StorageAction =
  | { type: 'SET_INIT_STATUS'; payload: { module: keyof StorageContextState['initialization']; status: StorageContextState['initialization'][keyof StorageContextState['initialization']] } }
  | { type: 'SET_PREFERENCES'; payload: UserPreferences }
  | { type: 'SET_RECENT_HISTORY'; payload: HistoryItem[] }
  | { type: 'SET_TEMPLATES'; payload: FormattingTemplate[] }
  | { type: 'SET_STATS'; payload: Partial<StorageContextState['stats']> }
  | { type: 'SET_ERROR'; payload: { module: keyof StorageContextState['errors']; error: StorageError | undefined } }
  | { type: 'SET_LOADING'; payload: { operation: keyof StorageContextState['loading']; loading: boolean } }
  | { type: 'ADD_HISTORY_ITEM'; payload: HistoryItem }
  | { type: 'UPDATE_HISTORY_ITEM'; payload: HistoryItem }
  | { type: 'REMOVE_HISTORY_ITEM'; payload: string }
  | { type: 'ADD_TEMPLATE'; payload: FormattingTemplate }
  | { type: 'UPDATE_TEMPLATE'; payload: FormattingTemplate }
  | { type: 'REMOVE_TEMPLATE'; payload: string };

// ============================================================================
// Context Interface
// ============================================================================

interface StorageContextType {
  /** Current state */
  state: StorageContextState;
  
  /** Preferences operations */
  preferences: {
    get: () => Promise<UserPreferences>;
    update: (updates: Partial<UserPreferences>) => Promise<Result<UserPreferences, StorageError>>;
    reset: () => Promise<Result<UserPreferences, StorageError>>;
    export: () => Promise<string>;
    import: (data: string) => Promise<Result<UserPreferences, StorageError>>;
    subscribe: (callback: (preferences: UserPreferences) => void) => () => void;
  };
  
  /** History operations */
  history: {
    add: (originalText: string, formattedText: string, formatType: FormatType, metadata?: any) => Promise<Result<string, StorageError>>;
    get: (id: string) => Promise<Result<HistoryItem | null, StorageError>>;
    search: (options?: HistorySearchOptions) => Promise<Result<HistoryItem[], StorageError>>;
    update: (id: string, updates: Partial<HistoryItem>) => Promise<Result<HistoryItem, StorageError>>;
    delete: (id: string) => Promise<Result<void, StorageError>>;
    clear: () => Promise<Result<void, StorageError>>;
    getStats: () => Promise<Result<HistoryStats, StorageError>>;
  };
  
  /** Template operations */
  templates: {
    create: (name: string, baseFormat: FormatType, config?: any) => Promise<Result<string, StorageError>>;
    get: (id: string) => Promise<Result<FormattingTemplate | null, StorageError>>;
    search: (options?: TemplateSearchOptions) => Promise<Result<FormattingTemplate[], StorageError>>;
    update: (id: string, updates: Partial<FormattingTemplate>) => Promise<Result<FormattingTemplate, StorageError>>;
    delete: (id: string) => Promise<Result<void, StorageError>>;
    recordUsage: (id: string, processingTime: number) => Promise<Result<void, StorageError>>;
  };
  
  /** Cache operations */
  cache: {
    get: <T>(key: string) => Promise<Result<T | null, StorageError>>;
    set: <T>(key: string, data: T, options?: any) => Promise<Result<void, StorageError>>;
    delete: (key: string) => Promise<Result<void, StorageError>>;
    clear: () => Promise<Result<void, StorageError>>;
    clearByTags: (tags: string[]) => Promise<Result<number, StorageError>>;
    getStats: () => Promise<Result<CacheStats, StorageError>>;
    // Processing-specific methods
    cacheProcessingResult: (text: string, formatType: FormatType, options: any, result: any) => Promise<Result<void, StorageError>>;
    getCachedProcessingResult: (text: string, formatType: FormatType, options: any) => Promise<Result<any, StorageError>>;
  };
  
  /** General operations */
  initialize: () => Promise<void>;
  isReady: boolean;
  refreshAll: () => Promise<void>;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: StorageContextState = {
  initialization: {
    preferences: 'idle',
    history: 'idle',
    templates: 'idle',
    cache: 'idle',
  },
  preferences: null,
  recentHistory: [],
  templates: [],
  stats: {},
  errors: {},
  loading: {
    savingPreferences: false,
    addingHistory: false,
    searchingHistory: false,
    loadingTemplates: false,
    clearingCache: false,
  },
};

// ============================================================================
// Reducer
// ============================================================================

function storageReducer(state: StorageContextState, action: StorageAction): StorageContextState {
  switch (action.type) {
    case 'SET_INIT_STATUS':
      return {
        ...state,
        initialization: {
          ...state.initialization,
          [action.payload.module]: action.payload.status,
        },
      };
      
    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: action.payload,
      };
      
    case 'SET_RECENT_HISTORY':
      return {
        ...state,
        recentHistory: action.payload,
      };
      
    case 'SET_TEMPLATES':
      return {
        ...state,
        templates: action.payload,
      };
      
    case 'SET_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload,
        },
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.module]: action.payload.error,
        },
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.operation]: action.payload.loading,
        },
      };
      
    case 'ADD_HISTORY_ITEM':
      return {
        ...state,
        recentHistory: [action.payload, ...state.recentHistory.slice(0, 19)], // Keep last 20
      };
      
    case 'UPDATE_HISTORY_ITEM':
      return {
        ...state,
        recentHistory: state.recentHistory.map(item =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
      
    case 'REMOVE_HISTORY_ITEM':
      return {
        ...state,
        recentHistory: state.recentHistory.filter(item => item.id !== action.payload),
      };
      
    case 'ADD_TEMPLATE':
      return {
        ...state,
        templates: [action.payload, ...state.templates],
      };
      
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(template =>
          template.id === action.payload.id ? action.payload : template
        ),
      };
      
    case 'REMOVE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter(template => template.id !== action.payload),
      };
      
    default:
      return state;
  }
}

// ============================================================================
// Context Creation
// ============================================================================

const StorageContext = createContext<StorageContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface StorageProviderProps {
  children: ReactNode;
  autoInitialize?: boolean;
}

export function StorageProvider({ 
  children, 
  autoInitialize = true 
}: StorageProviderProps) {
  const [state, dispatch] = useReducer(storageReducer, initialState);
  const initializationAttempted = useRef(false);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && !initializationAttempted.current) {
      initializationAttempted.current = true;
      initialize().catch(console.error);
    }
  }, [autoInitialize]);

  // Initialize all storage systems
  const initialize = useCallback(async () => {
    const modules = ['preferences', 'history', 'templates', 'cache'] as const;
    
    // Set all to loading
    modules.forEach(module => {
      dispatch({ type: 'SET_INIT_STATUS', payload: { module, status: 'loading' } });
    });

    // Initialize preferences
    try {
      const preferencesResult = await preferencesStorage.loadPreferences();
      if (preferencesResult.success) {
        dispatch({ type: 'SET_PREFERENCES', payload: preferencesResult.data });
        dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'preferences', status: 'loaded' } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: { module: 'preferences', error: preferencesResult.error } });
        dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'preferences', status: 'error' } });
      }
    } catch (error) {
      console.error('Failed to initialize preferences:', error);
      dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'preferences', status: 'error' } });
    }

    // Initialize history
    try {
      const historyResult = await historyStorage.initialize();
      if (historyResult.success) {
        // Load recent history
        const recentResult = await historyStorage.searchHistory({ limit: 20, sortBy: 'timestamp' });
        if (recentResult.success) {
          dispatch({ type: 'SET_RECENT_HISTORY', payload: recentResult.data });
        }
        dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'history', status: 'loaded' } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: { module: 'history', error: historyResult.error } });
        dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'history', status: 'error' } });
      }
    } catch (error) {
      console.error('Failed to initialize history:', error);
      dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'history', status: 'error' } });
    }

    // Initialize templates
    try {
      const templateResult = await templateStorage.initialize();
      if (templateResult.success) {
        // Load templates
        const templatesResult = await templateStorage.searchTemplates({ limit: 50 });
        if (templatesResult.success) {
          dispatch({ type: 'SET_TEMPLATES', payload: templatesResult.data });
        }
        dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'templates', status: 'loaded' } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: { module: 'templates', error: templateResult.error } });
        dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'templates', status: 'error' } });
      }
    } catch (error) {
      console.error('Failed to initialize templates:', error);
      dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'templates', status: 'error' } });
    }

    // Initialize cache
    try {
      const cacheResult = await cacheStorage.initialize();
      if (cacheResult.success) {
        dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'cache', status: 'loaded' } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: { module: 'cache', error: cacheResult.error } });
        dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'cache', status: 'error' } });
      }
    } catch (error) {
      console.error('Failed to initialize cache:', error);
      dispatch({ type: 'SET_INIT_STATUS', payload: { module: 'cache', status: 'error' } });
    }

    // Load statistics
    await loadStatistics();
  }, []);

  // Load statistics for all storage systems
  const loadStatistics = useCallback(async () => {
    try {
      // Load history stats
      const historyStats = await historyStorage.getHistoryStats();
      if (historyStats.success) {
        dispatch({ type: 'SET_STATS', payload: { history: historyStats.data } });
      }

      // Load cache stats
      const cacheStats = await cacheStorage.getStats();
      if (cacheStats.success) {
        dispatch({ type: 'SET_STATS', payload: { cache: cacheStats.data } });
      }

      // Calculate template stats
      const templates = state.templates;
      const templateStats = {
        total: templates.length,
        byFormat: templates.reduce((acc, template) => {
          acc[template.baseFormat] = (acc[template.baseFormat] || 0) + 1;
          return acc;
        }, {} as Record<FormatType, number>),
      };
      dispatch({ type: 'SET_STATS', payload: { templates: templateStats } });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, [state.templates]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await initialize();
  }, [initialize]);

  // Preferences operations
  const preferencesOperations = useMemo(() => ({
    get: async () => {
      if (state.preferences) {
        return state.preferences;
      }
      const result = await preferencesStorage.getPreferences();
      dispatch({ type: 'SET_PREFERENCES', payload: result });
      return result;
    },

    update: async (updates: Partial<UserPreferences>) => {
      dispatch({ type: 'SET_LOADING', payload: { operation: 'savingPreferences', loading: true } });
      try {
        const result = await preferencesStorage.savePreferences(updates);
        if (result.success) {
          dispatch({ type: 'SET_PREFERENCES', payload: result.data });
        } else {
          dispatch({ type: 'SET_ERROR', payload: { module: 'preferences', error: result.error } });
        }
        return result;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { operation: 'savingPreferences', loading: false } });
      }
    },

    reset: async () => {
      const result = await preferencesStorage.resetPreferences();
      if (result.success) {
        dispatch({ type: 'SET_PREFERENCES', payload: result.data });
      }
      return result;
    },

    export: () => preferencesStorage.exportPreferences(),
    
    import: async (data: string) => {
      const result = await preferencesStorage.importPreferences(data);
      if (result.success) {
        dispatch({ type: 'SET_PREFERENCES', payload: result.data });
      }
      return result;
    },

    subscribe: (callback: (preferences: UserPreferences) => void) => {
      return preferencesStorage.addPreferenceChangeListener(callback);
    },
  }), [state.preferences]);

  // History operations
  const historyOperations = useMemo(() => ({
    add: async (originalText: string, formattedText: string, formatType: FormatType, metadata?: any) => {
      dispatch({ type: 'SET_LOADING', payload: { operation: 'addingHistory', loading: true } });
      try {
        const result = await historyStorage.addHistoryItem(originalText, formattedText, formatType, metadata);
        if (result.success) {
          const item = await historyStorage.getHistoryItem(result.data);
          if (item.success && item.data) {
            dispatch({ type: 'ADD_HISTORY_ITEM', payload: item.data });
          }
        }
        return result;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { operation: 'addingHistory', loading: false } });
      }
    },

    get: (id: string) => historyStorage.getHistoryItem(id),

    search: async (options?: HistorySearchOptions) => {
      dispatch({ type: 'SET_LOADING', payload: { operation: 'searchingHistory', loading: true } });
      try {
        return await historyStorage.searchHistory(options);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { operation: 'searchingHistory', loading: false } });
      }
    },

    update: async (id: string, updates: Partial<HistoryItem>) => {
      const result = await historyStorage.updateHistoryItem(id, updates);
      if (result.success) {
        dispatch({ type: 'UPDATE_HISTORY_ITEM', payload: result.data });
      }
      return result;
    },

    delete: async (id: string) => {
      const result = await historyStorage.deleteHistoryItem(id);
      if (result.success) {
        dispatch({ type: 'REMOVE_HISTORY_ITEM', payload: id });
      }
      return result;
    },

    clear: async () => {
      const result = await historyStorage.clearHistory();
      if (result.success) {
        dispatch({ type: 'SET_RECENT_HISTORY', payload: [] });
      }
      return result;
    },

    getStats: () => historyStorage.getHistoryStats(),
  }), []);

  // Template operations
  const templateOperations = useMemo(() => ({
    create: async (name: string, baseFormat: FormatType, config?: any) => {
      const result = await templateStorage.createTemplate(name, baseFormat, config);
      if (result.success) {
        const template = await templateStorage.getTemplate(result.data);
        if (template.success && template.data) {
          dispatch({ type: 'ADD_TEMPLATE', payload: template.data });
        }
      }
      return result;
    },

    get: (id: string) => templateStorage.getTemplate(id),

    search: (options?: TemplateSearchOptions) => templateStorage.searchTemplates(options),

    update: async (id: string, updates: Partial<FormattingTemplate>) => {
      const result = await templateStorage.updateTemplate(id, updates);
      if (result.success) {
        dispatch({ type: 'UPDATE_TEMPLATE', payload: result.data });
      }
      return result;
    },

    delete: async (id: string) => {
      const result = await templateStorage.deleteTemplate(id);
      if (result.success) {
        dispatch({ type: 'REMOVE_TEMPLATE', payload: id });
      }
      return result;
    },

    recordUsage: (id: string, processingTime: number) => 
      templateStorage.recordUsage(id, processingTime),
  }), []);

  // Cache operations
  const cacheOperations = useMemo(() => ({
    get: <T,>(key: string) => cacheStorage.get<T>(key),
    
    set: <T,>(key: string, data: T, options?: any) => cacheStorage.set(key, data, options),
    
    delete: (key: string) => cacheStorage.delete(key),
    
    clear: async () => {
      dispatch({ type: 'SET_LOADING', payload: { operation: 'clearingCache', loading: true } });
      try {
        return await cacheStorage.clear();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { operation: 'clearingCache', loading: false } });
      }
    },
    
    clearByTags: (tags: string[]) => cacheStorage.clearByTags(tags),
    
    getStats: () => cacheStorage.getStats(),
    
    cacheProcessingResult: (text: string, formatType: FormatType, options: any, result: any) =>
      cacheStorage.cacheProcessingResult(text, formatType, options, result),
      
    getCachedProcessingResult: (text: string, formatType: FormatType, options: any) =>
      cacheStorage.getCachedProcessingResult(text, formatType, options),
  }), []);

  // Check if all systems are ready
  const isReady = useMemo(() => {
    const { initialization } = state;
    return Object.values(initialization).every(status => status === 'loaded');
  }, [state.initialization]);

  const contextValue: StorageContextType = useMemo(() => ({
    state,
    preferences: preferencesOperations,
    history: historyOperations,
    templates: templateOperations,
    cache: cacheOperations,
    initialize,
    isReady,
    refreshAll,
  }), [
    state,
    preferencesOperations,
    historyOperations,
    templateOperations,
    cacheOperations,
    initialize,
    isReady,
    refreshAll,
  ]);

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Main storage hook
 */
export function useStorage() {
  const context = useContext(StorageContext);
  
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  
  return context;
}

/**
 * Preferences-specific hook
 */
export function usePreferences() {
  const { preferences, state } = useStorage();
  
  return {
    ...preferences,
    current: state.preferences,
    loading: state.loading.savingPreferences,
    error: state.errors.preferences,
  };
}

/**
 * History-specific hook
 */
export function useHistory() {
  const { history, state } = useStorage();
  
  return {
    ...history,
    recent: state.recentHistory,
    loading: {
      adding: state.loading.addingHistory,
      searching: state.loading.searchingHistory,
    },
    error: state.errors.history,
    stats: state.stats.history,
  };
}

/**
 * Templates-specific hook
 */
export function useTemplates() {
  const { templates, state } = useStorage();
  
  return {
    ...templates,
    available: state.templates,
    loading: state.loading.loadingTemplates,
    error: state.errors.templates,
    stats: state.stats.templates,
  };
}

/**
 * Cache-specific hook
 */
export function useCache() {
  const { cache, state } = useStorage();
  
  return {
    ...cache,
    loading: state.loading.clearingCache,
    error: state.errors.cache,
    stats: state.stats.cache,
  };
}

/**
 * Storage status hook
 */
export function useStorageStatus() {
  const { state, isReady } = useStorage();
  
  return {
    isReady,
    initialization: state.initialization,
    errors: state.errors,
    loading: state.loading,
  };
}
