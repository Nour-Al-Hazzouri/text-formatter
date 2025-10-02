/**
 * History Service - Format transformation history tracking
 * 
 * Manages user's formatting history with efficient storage,
 * search capabilities, and data optimization
 */

// Using crypto.randomUUID() instead of nanoid
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
};
import type {
  FormatHistoryEntry,
  HistoryService as IHistoryService,
  HistorySearchOptions,
  HistoryStats,
  StorageSettings,
  StorageStats
} from '@/types/history';
import type { FormattedOutput, TextInput } from '@/types/formatting';

/**
 * Storage adapter interface for different storage backends
 */
interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
  size(): Promise<number>;
  clear(): Promise<void>;
}

/**
 * IndexedDB storage adapter for browser storage
 */
class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'text-formatter-history';
  private version = 1;
  private db?: IDBDatabase;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('timestamp', 'timestamp');
          historyStore.createIndex('format', 'format');
          historyStore.createIndex('tags', 'tags', { multiEntry: true });
        }
        
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage');
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      const request = store.put(value, key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(pattern?: string): Promise<string[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const keys = request.result as string[];
        if (pattern) {
          const regex = new RegExp(pattern.replace('*', '.*'));
          resolve(keys.filter(key => regex.test(key)));
        } else {
          resolve(keys);
        }
      };
    });
  }

  async size(): Promise<number> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.count();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['storage', 'history'], 'readwrite');
      
      const storageStore = transaction.objectStore('storage');
      const historyStore = transaction.objectStore('history');
      
      const storageRequest = storageStore.clear();
      const historyRequest = historyStore.clear();
      
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }
}

/**
 * History Service Implementation
 */
export class HistoryService implements IHistoryService {
  private storage: StorageAdapter;
  private cache = new Map<string, FormatHistoryEntry>();
  private cacheSize = 0;
  private maxCacheSize = 100;

  constructor(storage?: StorageAdapter) {
    this.storage = storage || new IndexedDBAdapter();
  }

  /**
   * Add new history entry
   */
  async addEntry(
    input: TextInput, 
    output: FormattedOutput, 
    metadata: Partial<FormatHistoryEntry> = {}
  ): Promise<string> {
    const id = generateId();
    const now = new Date();
    
    // Create input hash for deduplication
    const inputHash = await this.createHash(input.content);
    
    // Create preview text (first 200 characters)
    const inputPreview = this.createPreview(input.content);
    const outputPreview = this.createPreview(output.content);

    const entry: FormatHistoryEntry = {
      id,
      timestamp: now,
      format: output.format,
      inputPreview,
      inputHash,
      inputSize: input.content.length,
      outputPreview,
      processingMetadata: {
        duration: output.metadata.duration,
        confidence: output.metadata.confidence,
        itemCount: output.metadata.itemCount,
      },
      tags: [],
      favorited: false,
      ...metadata
    };

    // Store full data separately for large entries
    if (input.content.length > 10000 || output.content.length > 10000) {
      const storageRef = `full-data-${id}`;
      await this.storage.set(storageRef, {
        input: input.content,
        output: output.content,
        metadata: output.metadata,
        data: output.data
      });
      entry.storageRef = storageRef;
    }

    // Save entry
    await this.saveEntry(entry);
    
    // Add to cache
    this.addToCache(entry);
    
    return id;
  }

  /**
   * Get history entries with search and filtering
   */
  async getEntries(options: HistorySearchOptions): Promise<{ entries: FormatHistoryEntry[]; total: number }> {
    const allEntries = await this.getAllEntries();
    
    // Apply filters
    let filtered = allEntries;
    
    if (options.query) {
      const query = options.query.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.inputPreview.toLowerCase().includes(query) ||
        entry.outputPreview.toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (entry.notes && entry.notes.toLowerCase().includes(query))
      );
    }
    
    if (options.formats && options.formats.length > 0) {
      filtered = filtered.filter(entry => options.formats!.includes(entry.format));
    }
    
    if (options.dateRange) {
      filtered = filtered.filter(entry => 
        entry.timestamp >= options.dateRange!.start &&
        entry.timestamp <= options.dateRange!.end
      );
    }
    
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(entry =>
        options.tags!.some(tag => entry.tags.includes(tag))
      );
    }
    
    if (options.favoritesOnly) {
      filtered = filtered.filter(entry => entry.favorited);
    }
    
    if (options.minConfidence !== undefined) {
      filtered = filtered.filter(entry => 
        entry.processingMetadata.confidence >= options.minConfidence!
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = options.sort;
      let aVal: any, bVal: any;
      
      switch (field) {
        case 'timestamp':
          aVal = a.timestamp.getTime();
          bVal = b.timestamp.getTime();
          break;
        case 'format':
          aVal = a.format;
          bVal = b.format;
          break;
        case 'confidence':
          aVal = a.processingMetadata.confidence;
          bVal = b.processingMetadata.confidence;
          break;
        case 'size':
          aVal = a.inputSize;
          bVal = b.inputSize;
          break;
        default:
          return 0;
      }
      
      if (direction === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });
    
    // Apply pagination
    const { page, limit } = options.pagination;
    const start = (page - 1) * limit;
    const paginatedEntries = filtered.slice(start, start + limit);
    
    return {
      entries: paginatedEntries,
      total: filtered.length
    };
  }

  /**
   * Get single entry by ID
   */
  async getEntry(id: string): Promise<FormatHistoryEntry | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }
    
    // Load from storage
    const entry = await this.storage.get<FormatHistoryEntry>(`history-${id}`);
    if (entry) {
      this.addToCache(entry);
    }
    
    return entry;
  }

  /**
   * Update entry
   */
  async updateEntry(id: string, updates: Partial<FormatHistoryEntry>): Promise<void> {
    const entry = await this.getEntry(id);
    if (!entry) {
      throw new Error(`History entry ${id} not found`);
    }
    
    const updatedEntry = { ...entry, ...updates };
    await this.saveEntry(updatedEntry);
    this.addToCache(updatedEntry);
  }

  /**
   * Delete entry
   */
  async deleteEntry(id: string): Promise<void> {
    const entry = await this.getEntry(id);
    if (!entry) {
      return; // Already deleted
    }
    
    // Delete full data if exists
    if (entry.storageRef) {
      await this.storage.delete(entry.storageRef);
    }
    
    // Delete entry
    await this.storage.delete(`history-${id}`);
    
    // Remove from cache
    this.cache.delete(id);
    this.cacheSize--;
  }

  /**
   * Get history statistics
   */
  async getStats(): Promise<HistoryStats> {
    const allEntries = await this.getAllEntries();
    
    if (allEntries.length === 0) {
      return {
        totalTransformations: 0,
        byFormat: {} as any,
        mostUsedFormat: 'meeting-notes',
        averageConfidence: 0,
        totalProcessingTime: 0,
        storageUsed: 0,
        recentActivity: 0,
        topTags: []
      };
    }
    
    // Calculate statistics
    const byFormat: Record<string, number> = {};
    let totalConfidence = 0;
    let totalProcessingTime = 0;
    const tagCounts: Record<string, number> = {};
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let recentActivity = 0;
    
    for (const entry of allEntries) {
      byFormat[entry.format] = (byFormat[entry.format] || 0) + 1;
      totalConfidence += entry.processingMetadata.confidence;
      totalProcessingTime += entry.processingMetadata.duration;
      
      if (entry.timestamp >= oneWeekAgo) {
        recentActivity++;
      }
      
      for (const tag of entry.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    
    const mostUsedFormat = Object.entries(byFormat)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'meeting-notes';
    
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
    
    const storageUsed = await this.calculateStorageUsage();
    
    return {
      totalTransformations: allEntries.length,
      byFormat: byFormat as any,
      mostUsedFormat: mostUsedFormat as any,
      averageConfidence: totalConfidence / allEntries.length,
      totalProcessingTime,
      storageUsed,
      recentActivity,
      topTags
    };
  }

  /**
   * Cleanup old entries based on settings
   */
  async cleanup(settings: StorageSettings): Promise<number> {
    const allEntries = await this.getAllEntries();
    const cutoffDate = new Date(Date.now() - settings.autoCleanupAfterDays * 24 * 60 * 60 * 1000);
    
    let cleanedCount = 0;
    let entriesToDelete: FormatHistoryEntry[] = [];
    
    // Find entries to delete
    for (const entry of allEntries) {
      const shouldDelete = 
        entry.timestamp < cutoffDate &&
        !(settings.retention.keepFavorites && entry.favorited) &&
        !(settings.retention.keepTemplateUsage && entry.templateId);
      
      if (shouldDelete) {
        entriesToDelete.push(entry);
      }
    }
    
    // Respect max entries limit
    if (allEntries.length > settings.maxHistoryEntries) {
      const excessCount = allEntries.length - settings.maxHistoryEntries;
      const sortedEntries = allEntries
        .filter(entry => !entriesToDelete.includes(entry))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      entriesToDelete.push(...sortedEntries.slice(0, excessCount));
    }
    
    // Delete entries
    for (const entry of entriesToDelete) {
      await this.deleteEntry(entry.id);
      cleanedCount++;
    }
    
    return cleanedCount;
  }

  /**
   * Private helper methods
   */
  
  private async saveEntry(entry: FormatHistoryEntry): Promise<void> {
    await this.storage.set(`history-${entry.id}`, entry);
  }

  private async getAllEntries(): Promise<FormatHistoryEntry[]> {
    const keys = await this.storage.keys('history-*');
    const entries: FormatHistoryEntry[] = [];
    
    for (const key of keys) {
      const entry = await this.storage.get<FormatHistoryEntry>(key);
      if (entry) {
        entries.push(entry);
      }
    }
    
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private addToCache(entry: FormatHistoryEntry): void {
    // Remove oldest entries if cache is full
    if (this.cacheSize >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.cacheSize--;
      }
    }
    
    this.cache.set(entry.id, entry);
    this.cacheSize++;
  }

  private createPreview(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength - 3) + '...';
  }

  private async createHash(text: string): Promise<string> {
    // Simple hash function for deduplication
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private async calculateStorageUsage(): Promise<number> {
    const keys = await this.storage.keys();
    let totalSize = 0;
    
    for (const key of keys) {
      const data = await this.storage.get(key);
      if (data) {
        // Approximate size calculation
        totalSize += JSON.stringify(data).length * 2; // UTF-16 encoding
      }
    }
    
    return totalSize;
  }
}
