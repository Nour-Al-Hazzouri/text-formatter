/**
 * HistoryStorage - Format history persistence layer
 * 
 * Manages formatting history with size limits, cleanup, search capabilities,
 * and integration with user preferences for automatic maintenance
 */

import { storage, StorageError } from './LocalStorageWrapper';
import { preferencesStorage } from './PreferencesStorage';
import type { 
  FormatType, 
  ExportFormat,
  Result,
  UserPreferences 
} from '@/types/index';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface HistoryItem {
  /** Unique identifier for the history item */
  id: string;
  
  /** Original text input */
  originalText: string;
  
  /** Formatted output */
  formattedText: string;
  
  /** Format type used */
  formatType: FormatType;
  
  /** Processing metadata */
  metadata: {
    /** Processing timestamp */
    timestamp: Date;
    
    /** Processing duration in milliseconds */
    processingTime: number;
    
    /** Confidence score for format detection */
    confidenceScore?: number;
    
    /** Whether format was auto-detected or manually selected */
    autoDetected: boolean;
    
    /** Text length statistics */
    textStats: {
      originalLength: number;
      formattedLength: number;
      wordCount: number;
      lineCount: number;
    };
    
    /** Processing options used */
    processingOptions?: Record<string, unknown>;
  };
  
  /** User-provided title for the item */
  title?: string;
  
  /** User-provided tags for categorization */
  tags?: string[];
  
  /** Whether item is bookmarked/starred */
  starred?: boolean;
  
  /** Export information if exported */
  exports?: {
    format: ExportFormat;
    timestamp: Date;
    filename?: string;
  }[];
}

export interface HistorySearchOptions {
  /** Search query for text content */
  query?: string;
  
  /** Filter by format type */
  formatType?: FormatType;
  
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Filter by tags */
  tags?: string[];
  
  /** Only starred items */
  starredOnly?: boolean;
  
  /** Sort order */
  sortBy?: 'timestamp' | 'title' | 'formatType' | 'processingTime';
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Maximum number of results */
  limit?: number;
  
  /** Skip number of results (pagination) */
  offset?: number;
}

export interface HistoryStats {
  /** Total items in history */
  totalItems: number;
  
  /** Items by format type */
  itemsByFormat: Record<FormatType, number>;
  
  /** Items by date (last 30 days) */
  itemsByDate: Record<string, number>;
  
  /** Most used format type */
  mostUsedFormat: FormatType | null;
  
  /** Average processing time */
  averageProcessingTime: number;
  
  /** Storage usage in bytes */
  storageUsage: number;
  
  /** Starred items count */
  starredCount: number;
  
  /** Tagged items count */
  taggedCount: number;
  
  /** Unique tags */
  uniqueTags: string[];
}

// ============================================================================
// Storage Keys and Constants
// ============================================================================

const STORAGE_KEYS = {
  HISTORY: 'textFormatter:history',
  HISTORY_INDEX: 'textFormatter:history:index',
  HISTORY_TAGS: 'textFormatter:history:tags',
} as const;

const HISTORY_VERSION = 1;
const MAX_HISTORY_SIZE = 50 * 1024 * 1024; // 50MB
const CLEANUP_THRESHOLD = 0.8; // Clean up when 80% of quota is used

// ============================================================================
// Utility Functions
// ============================================================================

function generateHistoryId(): string {
  return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateTextStats(text: string): HistoryItem['metadata']['textStats'] {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const lines = text.split('\n');
  
  return {
    originalLength: text.length,
    formattedLength: text.length,
    wordCount: words.length,
    lineCount: lines.length,
  };
}

function validateHistoryItem(item: unknown): item is HistoryItem {
  if (!item || typeof item !== 'object') return false;
  
  const histItem = item as Record<string, unknown>;
  
  return (
    typeof histItem.id === 'string' &&
    typeof histItem.originalText === 'string' &&
    typeof histItem.formattedText === 'string' &&
    typeof histItem.formatType === 'string' &&
    histItem.metadata !== null &&
    histItem.metadata !== undefined &&
    typeof histItem.metadata === 'object'
  );
}

// ============================================================================
// HistoryStorage Class
// ============================================================================

export class HistoryStorage {
  private static instance: HistoryStorage | null = null;
  private historyIndex: Map<string, HistoryItem> = new Map();
  private tagsIndex: Map<string, Set<string>> = new Map();
  private isLoaded = false;

  private constructor() {
    this.setupAutoCleanup();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): HistoryStorage {
    if (!HistoryStorage.instance) {
      HistoryStorage.instance = new HistoryStorage();
    }
    return HistoryStorage.instance;
  }

  /**
   * Initialize history storage
   */
  public async initialize(): Promise<Result<void, StorageError>> {
    if (this.isLoaded) {
      return { success: true, data: undefined };
    }

    try {
      await this.loadHistoryIndex();
      await this.loadTagsIndex();
      this.isLoaded = true;
      
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to initialize history storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'INIT_FAILED',
          { error }
        )
      };
    }
  }

  /**
   * Add item to history
   */
  public async addHistoryItem(
    originalText: string,
    formattedText: string,
    formatType: FormatType,
    metadata: Partial<HistoryItem['metadata']> = {}
  ): Promise<Result<string, StorageError>> {
    try {
      await this.ensureInitialized();

      // Check if history is enabled
      const preferences = await preferencesStorage.getPreferences();
      if (!preferences.history.enabled) {
        return {
          success: false,
          error: new StorageError(
            'History is disabled in preferences',
            'HISTORY_DISABLED'
          )
        };
      }

      const id = generateHistoryId();
      const now = new Date();
      
      const historyItem: HistoryItem = {
        id,
        originalText,
        formattedText,
        formatType,
        metadata: {
          timestamp: now,
          processingTime: metadata.processingTime || 0,
          autoDetected: metadata.autoDetected ?? true,
          textStats: {
            ...calculateTextStats(originalText),
            formattedLength: formattedText.length,
          },
          ...metadata,
        },
      };

      // Store in index
      this.historyIndex.set(id, historyItem);

      // Save to storage
      const result = await this.saveHistoryItem(historyItem);
      if (!result.success) {
        // Remove from index if storage failed
        this.historyIndex.delete(id);
        return result;
      }

      // Update indexes
      await this.updateTagsIndex(historyItem);
      await this.saveHistoryIndex();

      // Check if cleanup is needed
      await this.checkAndCleanup();

      return { success: true, data: id };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to add history item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'ADD_FAILED',
          { error, originalText: originalText.substring(0, 100) }
        )
      };
    }
  }

  /**
   * Get history item by ID
   */
  public async getHistoryItem(id: string): Promise<Result<HistoryItem | null, StorageError>> {
    try {
      await this.ensureInitialized();

      const item = this.historyIndex.get(id);
      if (item) {
        return { success: true, data: item };
      }

      // Try to load from storage if not in index
      const result = storage.getItem<HistoryItem>(`${STORAGE_KEYS.HISTORY}:${id}`, {
        validator: validateHistoryItem,
      });

      if (!result.success) {
        return { success: true, data: null };
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to get history item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'GET_FAILED',
          { error, id }
        )
      };
    }
  }

  /**
   * Search history items
   */
  public async searchHistory(options: HistorySearchOptions = {}): Promise<Result<HistoryItem[], StorageError>> {
    try {
      await this.ensureInitialized();

      let items = Array.from(this.historyIndex.values());

      // Apply filters
      if (options.query) {
        const query = options.query.toLowerCase();
        items = items.filter(item => 
          item.originalText.toLowerCase().includes(query) ||
          item.formattedText.toLowerCase().includes(query) ||
          item.title?.toLowerCase().includes(query)
        );
      }

      if (options.formatType) {
        items = items.filter(item => item.formatType === options.formatType);
      }

      if (options.dateRange) {
        items = items.filter(item => {
          const timestamp = new Date(item.metadata.timestamp);
          return timestamp >= options.dateRange!.start && timestamp <= options.dateRange!.end;
        });
      }

      if (options.tags?.length) {
        items = items.filter(item => 
          item.tags?.some(tag => options.tags!.includes(tag))
        );
      }

      if (options.starredOnly) {
        items = items.filter(item => item.starred);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'timestamp';
      const sortDirection = options.sortDirection || 'desc';
      
      items.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'timestamp':
            comparison = new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime();
            break;
          case 'title':
            comparison = (a.title || '').localeCompare(b.title || '');
            break;
          case 'formatType':
            comparison = a.formatType.localeCompare(b.formatType);
            break;
          case 'processingTime':
            comparison = a.metadata.processingTime - b.metadata.processingTime;
            break;
        }

        return sortDirection === 'desc' ? -comparison : comparison;
      });

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || items.length;
      items = items.slice(offset, offset + limit);

      return { success: true, data: items };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to search history: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'SEARCH_FAILED',
          { error, options }
        )
      };
    }
  }

  /**
   * Update history item
   */
  public async updateHistoryItem(
    id: string, 
    updates: Partial<Pick<HistoryItem, 'title' | 'tags' | 'starred'>>
  ): Promise<Result<HistoryItem, StorageError>> {
    try {
      await this.ensureInitialized();

      const item = this.historyIndex.get(id);
      if (!item) {
        return {
          success: false,
          error: new StorageError(
            'History item not found',
            'ITEM_NOT_FOUND',
            { id }
          )
        };
      }

      const updatedItem: HistoryItem = {
        ...item,
        ...updates,
      };

      // Update in index
      this.historyIndex.set(id, updatedItem);

      // Save to storage
      const result = await this.saveHistoryItem(updatedItem);
      if (!result.success) {
        // Revert index change
        this.historyIndex.set(id, item);
        return result;
      }

      // Update tags index if tags changed
      if (updates.tags !== undefined) {
        await this.updateTagsIndex(updatedItem);
      }

      await this.saveHistoryIndex();

      return { success: true, data: updatedItem };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to update history item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'UPDATE_FAILED',
          { error, id, updates }
        )
      };
    }
  }

  /**
   * Delete history item
   */
  public async deleteHistoryItem(id: string): Promise<Result<void, StorageError>> {
    try {
      await this.ensureInitialized();

      const item = this.historyIndex.get(id);
      if (!item) {
        return { success: true, data: undefined }; // Already deleted
      }

      // Remove from storage
      const result = storage.removeItem(`${STORAGE_KEYS.HISTORY}:${id}`);
      if (!result.success) {
        return result;
      }

      // Remove from index
      this.historyIndex.delete(id);

      // Update tags index
      await this.removeFromTagsIndex(item);
      await this.saveHistoryIndex();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to delete history item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'DELETE_FAILED',
          { error, id }
        )
      };
    }
  }

  /**
   * Clear all history
   */
  public async clearHistory(): Promise<Result<void, StorageError>> {
    try {
      await this.ensureInitialized();

      // Delete all history items
      const deletePromises = Array.from(this.historyIndex.keys()).map(id => 
        storage.removeItem(`${STORAGE_KEYS.HISTORY}:${id}`)
      );

      await Promise.all(deletePromises);

      // Clear indexes
      this.historyIndex.clear();
      this.tagsIndex.clear();

      // Save empty indexes
      await this.saveHistoryIndex();
      await this.saveTagsIndex();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to clear history: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CLEAR_FAILED',
          { error }
        )
      };
    }
  }

  /**
   * Get history statistics
   */
  public async getHistoryStats(): Promise<Result<HistoryStats, StorageError>> {
    try {
      await this.ensureInitialized();

      const items = Array.from(this.historyIndex.values());
      
      const itemsByFormat = items.reduce((acc, item) => {
        acc[item.formatType] = (acc[item.formatType] || 0) + 1;
        return acc;
      }, {} as Record<FormatType, number>);

      const mostUsedFormat = Object.entries(itemsByFormat)
        .sort(([,a], [,b]) => b - a)[0]?.[0] as FormatType || null;

      const averageProcessingTime = items.length > 0 
        ? items.reduce((sum, item) => sum + item.metadata.processingTime, 0) / items.length
        : 0;

      const storageUsage = items.reduce((sum, item) => {
        return sum + item.originalText.length + item.formattedText.length;
      }, 0);

      const starredCount = items.filter(item => item.starred).length;
      const taggedCount = items.filter(item => item.tags?.length).length;
      const uniqueTags = Array.from(this.tagsIndex.keys());

      // Calculate items by date (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const itemsByDate = items
        .filter(item => new Date(item.metadata.timestamp) >= thirtyDaysAgo)
        .reduce((acc, item) => {
          const date = new Date(item.metadata.timestamp).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const stats: HistoryStats = {
        totalItems: items.length,
        itemsByFormat,
        itemsByDate,
        mostUsedFormat,
        averageProcessingTime,
        storageUsage,
        starredCount,
        taggedCount,
        uniqueTags,
      };

      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to get history stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'STATS_FAILED',
          { error }
        )
      };
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.isLoaded) {
      const result = await this.initialize();
      if (!result.success) {
        throw result.error;
      }
    }
  }

  private async loadHistoryIndex(): Promise<void> {
    const result = storage.getItem<Record<string, HistoryItem>>(STORAGE_KEYS.HISTORY_INDEX);
    if (result.success && result.data) {
      this.historyIndex = new Map(Object.entries(result.data));
    }
  }

  private async saveHistoryIndex(): Promise<void> {
    const indexObject = Object.fromEntries(this.historyIndex.entries());
    storage.setItem(STORAGE_KEYS.HISTORY_INDEX, indexObject);
  }

  private async loadTagsIndex(): Promise<void> {
    const result = storage.getItem<Record<string, string[]>>(STORAGE_KEYS.HISTORY_TAGS);
    if (result.success && result.data) {
      this.tagsIndex = new Map(
        Object.entries(result.data).map(([tag, ids]) => [tag, new Set(ids)])
      );
    }
  }

  private async saveTagsIndex(): Promise<void> {
    const tagsObject = Object.fromEntries(
      Array.from(this.tagsIndex.entries()).map(([tag, ids]) => [tag, Array.from(ids)])
    );
    storage.setItem(STORAGE_KEYS.HISTORY_TAGS, tagsObject);
  }

  private async saveHistoryItem(item: HistoryItem): Promise<Result<void, StorageError>> {
    return storage.setItem(`${STORAGE_KEYS.HISTORY}:${item.id}`, item, {
      validator: validateHistoryItem,
    });
  }

  private async updateTagsIndex(item: HistoryItem): Promise<void> {
    if (!item.tags?.length) return;

    item.tags.forEach(tag => {
      if (!this.tagsIndex.has(tag)) {
        this.tagsIndex.set(tag, new Set());
      }
      this.tagsIndex.get(tag)!.add(item.id);
    });

    await this.saveTagsIndex();
  }

  private async removeFromTagsIndex(item: HistoryItem): Promise<void> {
    if (!item.tags?.length) return;

    item.tags.forEach(tag => {
      const tagSet = this.tagsIndex.get(tag);
      if (tagSet) {
        tagSet.delete(item.id);
        if (tagSet.size === 0) {
          this.tagsIndex.delete(tag);
        }
      }
    });

    await this.saveTagsIndex();
  }

  private async checkAndCleanup(): Promise<void> {
    const preferences = await preferencesStorage.getPreferences();
    if (!preferences.history.autoCleanup) return;

    const stats = await this.getHistoryStats();
    if (!stats.success) return;

    const { totalItems, storageUsage } = stats.data;
    
    // Check if cleanup is needed
    const needsCleanup = 
      totalItems > preferences.history.maxItems ||
      storageUsage > MAX_HISTORY_SIZE * CLEANUP_THRESHOLD;

    if (needsCleanup) {
      await this.performCleanup(preferences.history);
    }
  }

  private async performCleanup(historyPrefs: UserPreferences['history']): Promise<void> {
    const items = Array.from(this.historyIndex.values());
    
    // Sort by timestamp (oldest first) and filter by retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - historyPrefs.retentionDays);
    
    const itemsToDelete = items
      .filter(item => !item.starred) // Don't delete starred items
      .filter(item => new Date(item.metadata.timestamp) < cutoffDate)
      .sort((a, b) => new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime());

    // Delete excess items
    const excessCount = Math.max(0, items.length - historyPrefs.maxItems);
    const toDelete = itemsToDelete.slice(0, Math.max(itemsToDelete.length, excessCount));

    for (const item of toDelete) {
      await this.deleteHistoryItem(item.id);
    }
  }

  private setupAutoCleanup(): void {
    // Run cleanup every hour
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.checkAndCleanup().catch(console.error);
      }, 60 * 60 * 1000);
    }
  }
}

// ============================================================================
// Exported Singleton Instance
// ============================================================================

export const historyStorage = HistoryStorage.getInstance();
export default historyStorage;
