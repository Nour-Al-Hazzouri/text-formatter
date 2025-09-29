/**
 * PreferencesStorage - User preferences persistence layer
 * 
 * Manages user preferences with validation, defaults, and migration support
 * Integrates with LocalStorageWrapper for robust data persistence
 */

import { storage, StorageError } from './LocalStorageWrapper';
import type { 
  UserPreferences, 
  FormatType, 
  ExportFormat,
  Result 
} from '@/types/index';

// ============================================================================
// Storage Keys and Constants
// ============================================================================

const STORAGE_KEYS = {
  USER_PREFERENCES: 'textFormatter:preferences',
  PREFERENCES_VERSION: 'textFormatter:preferences:version',
} as const;

const PREFERENCES_VERSION = 1;
const PREFERENCES_TTL = 365 * 24 * 60 * 60 * 1000; // 1 year

// ============================================================================
// Default Preferences
// ============================================================================

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: {
    mode: 'system',
    accentColor: '#f97316', // Orange-500 for notebook theme
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

// ============================================================================
// Validation Schemas
// ============================================================================

const THEME_MODES = ['light', 'dark', 'system'] as const;
const FONT_SIZES = ['small', 'medium', 'large'] as const;
const FORMAT_TYPES: FormatType[] = [
  'meeting-notes',
  'task-lists', 
  'journal-notes',
  'shopping-lists',
  'research-notes',
  'study-notes'
];
const EXPORT_FORMATS: ExportFormat[] = [
  'plain-text',
  'markdown',
  'html',
  'pdf',
  'docx',
  'json',
  'csv',
  'rtf',
  'latex',
  'epub',
  'odt'
];

/**
 * Validate user preferences object
 */
function validatePreferences(preferences: unknown): preferences is UserPreferences {
  if (!preferences || typeof preferences !== 'object') {
    return false;
  }

  const prefs = preferences as Record<string, unknown>;

  // Validate theme preferences
  if (
    !prefs.theme ||
    typeof prefs.theme !== 'object' ||
    !THEME_MODES.includes((prefs.theme as any).mode) ||
    !FONT_SIZES.includes((prefs.theme as any).fontSize) ||
    typeof (prefs.theme as any).accentColor !== 'string' ||
    typeof (prefs.theme as any).compactMode !== 'boolean'
  ) {
    return false;
  }

  // Validate formatting preferences
  if (
    !prefs.formatting ||
    typeof prefs.formatting !== 'object' ||
    !FORMAT_TYPES.includes((prefs.formatting as any).defaultMode) ||
    typeof (prefs.formatting as any).autoDetect !== 'boolean' ||
    typeof (prefs.formatting as any).preserveOriginal !== 'boolean' ||
    typeof (prefs.formatting as any).showConfidenceScore !== 'boolean'
  ) {
    return false;
  }

  // Validate history preferences
  if (
    !prefs.history ||
    typeof prefs.history !== 'object' ||
    typeof (prefs.history as any).enabled !== 'boolean' ||
    typeof (prefs.history as any).maxItems !== 'number' ||
    typeof (prefs.history as any).autoCleanup !== 'boolean' ||
    typeof (prefs.history as any).retentionDays !== 'number' ||
    (prefs.history as any).maxItems < 1 ||
    (prefs.history as any).maxItems > 1000 ||
    (prefs.history as any).retentionDays < 1 ||
    (prefs.history as any).retentionDays > 365
  ) {
    return false;
  }

  // Validate export preferences
  if (
    !prefs.export ||
    typeof prefs.export !== 'object' ||
    !EXPORT_FORMATS.includes((prefs.export as any).defaultFormat) ||
    typeof (prefs.export as any).includeMetadata !== 'boolean' ||
    typeof (prefs.export as any).preserveFormatting !== 'boolean'
  ) {
    return false;
  }

  return true;
}

/**
 * Sanitize preferences to ensure valid values
 */
function sanitizePreferences(preferences: Partial<UserPreferences>): UserPreferences {
  const sanitized: UserPreferences = {
    theme: {
      mode: THEME_MODES.includes(preferences.theme?.mode as any) 
        ? preferences.theme!.mode 
        : DEFAULT_PREFERENCES.theme.mode,
      accentColor: preferences.theme?.accentColor || DEFAULT_PREFERENCES.theme.accentColor,
      fontSize: FONT_SIZES.includes(preferences.theme?.fontSize as any)
        ? preferences.theme!.fontSize
        : DEFAULT_PREFERENCES.theme.fontSize,
      compactMode: preferences.theme?.compactMode ?? DEFAULT_PREFERENCES.theme.compactMode,
    },
    formatting: {
      defaultMode: FORMAT_TYPES.includes(preferences.formatting?.defaultMode as any)
        ? preferences.formatting!.defaultMode
        : DEFAULT_PREFERENCES.formatting.defaultMode,
      autoDetect: preferences.formatting?.autoDetect ?? DEFAULT_PREFERENCES.formatting.autoDetect,
      preserveOriginal: preferences.formatting?.preserveOriginal ?? DEFAULT_PREFERENCES.formatting.preserveOriginal,
      showConfidenceScore: preferences.formatting?.showConfidenceScore ?? DEFAULT_PREFERENCES.formatting.showConfidenceScore,
    },
    history: {
      enabled: preferences.history?.enabled ?? DEFAULT_PREFERENCES.history.enabled,
      maxItems: Math.min(Math.max(preferences.history?.maxItems || DEFAULT_PREFERENCES.history.maxItems, 1), 1000),
      autoCleanup: preferences.history?.autoCleanup ?? DEFAULT_PREFERENCES.history.autoCleanup,
      retentionDays: Math.min(Math.max(preferences.history?.retentionDays || DEFAULT_PREFERENCES.history.retentionDays, 1), 365),
    },
    export: {
      defaultFormat: EXPORT_FORMATS.includes(preferences.export?.defaultFormat as any)
        ? preferences.export!.defaultFormat
        : DEFAULT_PREFERENCES.export.defaultFormat,
      includeMetadata: preferences.export?.includeMetadata ?? DEFAULT_PREFERENCES.export.includeMetadata,
      preserveFormatting: preferences.export?.preserveFormatting ?? DEFAULT_PREFERENCES.export.preserveFormatting,
    },
  };

  return sanitized;
}

// ============================================================================
// PreferencesStorage Class
// ============================================================================

export class PreferencesStorage {
  private static instance: PreferencesStorage | null = null;
  private cachedPreferences: UserPreferences | null = null;
  private readonly eventListeners: Set<(preferences: UserPreferences) => void> = new Set();

  private constructor() {
    this.setupMigrations();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PreferencesStorage {
    if (!PreferencesStorage.instance) {
      PreferencesStorage.instance = new PreferencesStorage();
    }
    return PreferencesStorage.instance;
  }

  /**
   * Load user preferences from storage
   */
  public async loadPreferences(): Promise<Result<UserPreferences, StorageError>> {
    try {
      const result = storage.getItem<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES, {
        validator: validatePreferences,
        ttl: PREFERENCES_TTL,
      });

      if (!result.success) {
        // If loading fails, return defaults but log the error
        console.warn('Failed to load preferences, using defaults:', result.error);
        this.cachedPreferences = DEFAULT_PREFERENCES;
        return { success: true, data: DEFAULT_PREFERENCES };
      }

      const preferences = result.success ? (result.data || DEFAULT_PREFERENCES) : DEFAULT_PREFERENCES;
      this.cachedPreferences = preferences;
      
      return { success: true, data: preferences };
    } catch (error) {
      console.error('Error loading preferences:', error);
      this.cachedPreferences = DEFAULT_PREFERENCES;
      return { success: true, data: DEFAULT_PREFERENCES };
    }
  }

  /**
   * Save user preferences to storage
   */
  public async savePreferences(preferences: Partial<UserPreferences>): Promise<Result<UserPreferences, StorageError>> {
    try {
      // Merge with existing preferences and sanitize
      const currentPreferences = this.cachedPreferences || DEFAULT_PREFERENCES;
      const mergedPreferences: Partial<UserPreferences> = {
        ...currentPreferences,
        ...preferences,
        ...(preferences.theme && { theme: { ...currentPreferences.theme, ...preferences.theme } }),
        ...(preferences.formatting && { formatting: { ...currentPreferences.formatting, ...preferences.formatting } }),
        ...(preferences.history && { history: { ...currentPreferences.history, ...preferences.history } }),
        ...(preferences.export && { export: { ...currentPreferences.export, ...preferences.export } }),
      };
      const updatedPreferences = sanitizePreferences(mergedPreferences);

      // Save to storage
      const result = storage.setItem(STORAGE_KEYS.USER_PREFERENCES, updatedPreferences, {
        validator: validatePreferences,
        ttl: PREFERENCES_TTL,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Update cache
      this.cachedPreferences = updatedPreferences;

      // Notify listeners
      this.notifyListeners(updatedPreferences);

      return { success: true, data: updatedPreferences };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to save preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'SAVE_FAILED',
          { error, preferences }
        )
      };
    }
  }

  /**
   * Get current preferences (from cache or storage)
   */
  public async getPreferences(): Promise<UserPreferences> {
    if (this.cachedPreferences) {
      return this.cachedPreferences;
    }

    const result = await this.loadPreferences();
    return result.success ? result.data : DEFAULT_PREFERENCES;
  }

  /**
   * Update specific preference category
   */
  public async updateThemePreferences(theme: Partial<UserPreferences['theme']>): Promise<Result<UserPreferences, StorageError>> {
    return this.savePreferences({ theme } as Partial<UserPreferences>);
  }

  public async updateFormattingPreferences(formatting: Partial<UserPreferences['formatting']>): Promise<Result<UserPreferences, StorageError>> {
    return this.savePreferences({ formatting } as Partial<UserPreferences>);
  }

  public async updateHistoryPreferences(history: Partial<UserPreferences['history']>): Promise<Result<UserPreferences, StorageError>> {
    return this.savePreferences({ history } as Partial<UserPreferences>);
  }

  public async updateExportPreferences(exportPrefs: Partial<UserPreferences['export']>): Promise<Result<UserPreferences, StorageError>> {
    return this.savePreferences({ export: exportPrefs } as Partial<UserPreferences>);
  }

  /**
   * Reset preferences to defaults
   */
  public async resetPreferences(): Promise<Result<UserPreferences, StorageError>> {
    const result = storage.setItem(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_PREFERENCES, {
      validator: validatePreferences,
      ttl: PREFERENCES_TTL,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    this.cachedPreferences = DEFAULT_PREFERENCES;
    this.notifyListeners(DEFAULT_PREFERENCES);

    return { success: true, data: DEFAULT_PREFERENCES };
  }

  /**
   * Export preferences as JSON
   */
  public async exportPreferences(): Promise<string> {
    const preferences = await this.getPreferences();
    return JSON.stringify(preferences, null, 2);
  }

  /**
   * Import preferences from JSON
   */
  public async importPreferences(preferencesJson: string): Promise<Result<UserPreferences, StorageError>> {
    try {
      const importedPreferences = JSON.parse(preferencesJson);
      
      if (!validatePreferences(importedPreferences)) {
        return {
          success: false,
          error: new StorageError(
            'Invalid preferences format',
            'INVALID_FORMAT',
            { importedPreferences }
          )
        };
      }

      return this.savePreferences(importedPreferences);
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to import preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'IMPORT_FAILED',
          { error, preferencesJson }
        )
      };
    }
  }

  /**
   * Add preference change listener
   */
  public addPreferenceChangeListener(listener: (preferences: UserPreferences) => void): () => void {
    this.eventListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  /**
   * Get preference change statistics
   */
  public getPreferenceStats(): {
    totalChanges: number;
    lastModified: Date | null;
    isUsingDefaults: boolean;
  } {
    const preferences = this.cachedPreferences;
    
    return {
      totalChanges: 0, // Would be tracked in a real system
      lastModified: preferences ? new Date() : null,
      isUsingDefaults: !preferences || JSON.stringify(preferences) === JSON.stringify(DEFAULT_PREFERENCES),
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private notifyListeners(preferences: UserPreferences): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(preferences);
      } catch (error) {
        console.error('Error in preference change listener:', error);
      }
    });
  }

  private setupMigrations(): void {
    // Register migrations for preference schema changes
    storage.registerMigration({
      version: 2,
      migrate: (data: unknown) => {
        // Future migration: Add new preference fields
        if (data && typeof data === 'object') {
          return {
            ...data,
            // Add new fields with defaults
          };
        }
        return data;
      },
      validate: validatePreferences,
    });
  }
}

// ============================================================================
// Exported Singleton Instance
// ============================================================================

export const preferencesStorage = PreferencesStorage.getInstance();
export default preferencesStorage;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a deep copy of preferences for immutability
 */
export function clonePreferences(preferences: UserPreferences): UserPreferences {
  return JSON.parse(JSON.stringify(preferences));
}

/**
 * Merge preferences with deep merging
 */
export function mergePreferences(
  base: UserPreferences, 
  updates: Partial<UserPreferences>
): UserPreferences {
  return {
    theme: { ...base.theme, ...updates.theme },
    formatting: { ...base.formatting, ...updates.formatting },
    history: { ...base.history, ...updates.history },
    export: { ...base.export, ...updates.export },
  };
}

/**
 * Check if preferences are valid
 */
export function isValidPreferences(preferences: unknown): preferences is UserPreferences {
  return validatePreferences(preferences);
}
