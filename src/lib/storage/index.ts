/**
 * Storage Module - Centralized export for all storage utilities
 * 
 * Provides clean imports for all storage-related functionality
 * including localStorage wrapper, preferences, history, templates, and cache
 */

// ============================================================================
// Core Storage
// ============================================================================

export {
  LocalStorageWrapper,
  storage,
  StorageError,
  StorageQuotaError,
  StorageCorruptionError,
  type StorageOptions,
  type StorageItem,
  type StorageSerializer,
  type StorageStats,
  type StorageMigration,
} from './LocalStorageWrapper';

// ============================================================================
// Preferences Storage
// ============================================================================

export {
  PreferencesStorage,
  preferencesStorage,
  DEFAULT_PREFERENCES,
  clonePreferences,
  mergePreferences,
  isValidPreferences,
} from './PreferencesStorage';

// ============================================================================
// History Storage
// ============================================================================

export {
  HistoryStorage,
  historyStorage,
  type HistoryItem,
  type HistorySearchOptions,
  type HistoryStats,
} from './HistoryStorage';

// ============================================================================
// Template Storage
// ============================================================================

export {
  TemplateStorage,
  templateStorage,
  type FormattingTemplate,
  type FormattingRule,
  type PatternConfig,
  type OutputConfig,
  type ProcessingConfig,
  type TemplateSearchOptions,
} from './TemplateStorage';

// ============================================================================
// Cache Storage
// ============================================================================

export {
  CacheStorage,
  cacheStorage,
  type CacheEntry,
  type ProcessingCacheEntry,
  type CacheConfig,
  type CacheStats,
  type CacheSearchOptions,
} from './CacheStorage';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Initialize all storage systems
 */
export async function initializeAllStorage(): Promise<{
  preferences: boolean;
  history: boolean;
  templates: boolean;
  cache: boolean;
  errors: Record<string, any>;
}> {
  const results = {
    preferences: false,
    history: false,
    templates: false,
    cache: false,
    errors: {} as Record<string, any>,
  };

  // Initialize preferences
  try {
    const { preferencesStorage } = await import('./PreferencesStorage');
    const prefsResult = await preferencesStorage.loadPreferences();
    results.preferences = prefsResult.success;
    if (!prefsResult.success) {
      results.errors.preferences = prefsResult.error;
    }
  } catch (error) {
    results.errors.preferences = error;
  }

  // Initialize history
  try {
    const { historyStorage } = await import('./HistoryStorage');
    const historyResult = await historyStorage.initialize();
    results.history = historyResult.success;
    if (!historyResult.success) {
      results.errors.history = historyResult.error;
    }
  } catch (error) {
    results.errors.history = error;
  }

  // Initialize templates
  try {
    const { templateStorage } = await import('./TemplateStorage');
    const templateResult = await templateStorage.initialize();
    results.templates = templateResult.success;
    if (!templateResult.success) {
      results.errors.templates = templateResult.error;
    }
  } catch (error) {
    results.errors.templates = error;
  }

  // Initialize cache
  try {
    const { cacheStorage } = await import('./CacheStorage');
    const cacheResult = await cacheStorage.initialize();
    results.cache = cacheResult.success;
    if (!cacheResult.success) {
      results.errors.cache = cacheResult.error;
    }
  } catch (error) {
    results.errors.cache = error;
  }

  return results;
}

/**
 * Get comprehensive storage statistics
 */
export async function getStorageOverview() {
  const { storage } = await import('./LocalStorageWrapper');
  const { preferencesStorage } = await import('./PreferencesStorage');
  const { historyStorage } = await import('./HistoryStorage');
  const { templateStorage } = await import('./TemplateStorage');
  const { cacheStorage } = await import('./CacheStorage');

  const stats = {
    localStorage: storage.getStats(),
    preferences: {
      loaded: !!preferencesStorage,
      stats: await preferencesStorage.getPreferenceStats(),
    },
    history: {
      initialized: true,
      stats: await historyStorage.getHistoryStats(),
    },
    templates: {
      initialized: true,
      available: await (async () => {
        const result = await templateStorage.searchTemplates();
        return result.success ? result.data.length : 0;
      })(),
    },
    cache: {
      initialized: true,
      stats: await cacheStorage.getStats(),
    },
  };

  return stats;
}

/**
 * Clear all storage data (useful for testing or reset functionality)
 */
export async function clearAllStorage(): Promise<{
  success: boolean;
  errors: Record<string, any>;
}> {
  const errors: Record<string, any> = {};
  let success = true;

  try {
    const { historyStorage } = await import('./HistoryStorage');
    await historyStorage.clearHistory();
  } catch (error) {
    errors.history = error;
    success = false;
  }

  try {
    const { cacheStorage } = await import('./CacheStorage');
    await cacheStorage.clear();
  } catch (error) {
    errors.cache = error;
    success = false;
  }

  try {
    const { preferencesStorage } = await import('./PreferencesStorage');
    await preferencesStorage.resetPreferences();
  } catch (error) {
    errors.preferences = error;
    success = false;
  }

  // Note: Template clearing would need to be implemented if needed
  // Templates are typically not cleared in a general "clear all" operation

  return { success, errors };
}

/**
 * Export all storage data for backup purposes
 */
export async function exportAllStorageData() {
  const { preferencesStorage } = await import('./PreferencesStorage');
  const { historyStorage } = await import('./HistoryStorage');
  const { templateStorage } = await import('./TemplateStorage');

  const data = {
    preferences: await preferencesStorage.exportPreferences(),
    history: await (async () => {
      const result = await historyStorage.searchHistory({ limit: 1000 });
      return result.success ? result.data : [];
    })(),
    templates: await (async () => {
      const result = await templateStorage.searchTemplates({ limit: 100 });
      return result.success ? result.data : [];
    })(),
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Storage health check
 */
export async function checkStorageHealth(): Promise<{
  healthy: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const { storage } = await import('./LocalStorageWrapper');

  // Check localStorage availability
  if (!storage.isAvailable()) {
    issues.push('localStorage is not available');
    recommendations.push('Enable localStorage in browser settings');
  }

  // Check storage usage
  const stats = storage.getStats();
  const usagePercentage = stats.availableSpace > 0 
    ? ((stats.totalSize / (stats.totalSize + stats.availableSpace)) * 100)
    : 0;

  if (usagePercentage > 80) {
    issues.push(`Storage usage is high (${usagePercentage.toFixed(1)}%)`);
    recommendations.push('Consider clearing old history or cache data');
  }

  // Check for expired items
  if (stats.expiredItems > 0) {
    issues.push(`${stats.expiredItems} expired items found`);
    recommendations.push('Run cleanup to remove expired items');
  }

  // Check initialization status
  const initResults = await initializeAllStorage();
  Object.entries(initResults.errors).forEach(([module, error]) => {
    issues.push(`${module} storage initialization failed: ${error}`);
    recommendations.push(`Check ${module} storage configuration`);
  });

  return {
    healthy: issues.length === 0,
    issues,
    recommendations,
  };
}

// ============================================================================
// Default Exports
// ============================================================================

export default {
  // Storage instances - use dynamic imports in production code
  get storage() {
    return require('./LocalStorageWrapper').storage;
  },
  get preferencesStorage() {
    return require('./PreferencesStorage').preferencesStorage;
  },
  get historyStorage() {
    return require('./HistoryStorage').historyStorage;
  },
  get templateStorage() {
    return require('./TemplateStorage').templateStorage;
  },
  get cacheStorage() {
    return require('./CacheStorage').cacheStorage;
  },
  // Utility functions
  initializeAllStorage,
  getStorageOverview,
  clearAllStorage,
  exportAllStorageData,
  checkStorageHealth,
};
