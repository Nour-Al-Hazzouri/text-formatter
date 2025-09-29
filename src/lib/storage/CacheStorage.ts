/**
 * CacheStorage - Processing results cache management
 * 
 * Manages caching of text processing results with TTL, invalidation strategies,
 * and memory-aware cleanup to improve performance
 */

import { storage, StorageError } from './LocalStorageWrapper';
import type { 
  FormatType, 
  Result 
} from '@/types/index';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CacheEntry<T = unknown> {
  /** Unique cache key */
  key: string;
  
  /** Cached data */
  data: T;
  
  /** Cache metadata */
  metadata: {
    /** Cache creation timestamp */
    createdAt: Date;
    
    /** Time to live in milliseconds */
    ttl: number;
    
    /** Expiration timestamp */
    expiresAt: Date;
    
    /** Access count */
    accessCount: number;
    
    /** Last accessed timestamp */
    lastAccessed: Date;
    
    /** Data size in bytes (estimate) */
    size: number;
    
    /** Cache tags for bulk invalidation */
    tags: string[];
    
    /** Cache version for invalidation */
    version: number;
  };
}

export interface ProcessingCacheEntry extends CacheEntry {
  /** Processing input hash */
  inputHash: string;
  
  /** Format type used */
  formatType: FormatType;
  
  /** Processing options hash */
  optionsHash: string;
  
  /** Formatted result */
  data: {
    formattedText: string;
    metadata: {
      processingTime: number;
      confidenceScore?: number;
      patterns: string[];
      statistics: Record<string, number>;
    };
  };
}

export interface CacheConfig {
  /** Default TTL in milliseconds */
  defaultTtl: number;
  
  /** Maximum cache size in bytes */
  maxSize: number;
  
  /** Maximum number of entries */
  maxEntries: number;
  
  /** Cleanup threshold (0-1) */
  cleanupThreshold: number;
  
  /** Cleanup strategy */
  cleanupStrategy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  
  /** Enable compression for large entries */
  compression: boolean;
  
  /** Enable cache statistics */
  statistics: boolean;
}

export interface CacheStats {
  /** Total entries count */
  totalEntries: number;
  
  /** Total cache size in bytes */
  totalSize: number;
  
  /** Cache hit rate */
  hitRate: number;
  
  /** Cache miss rate */
  missRate: number;
  
  /** Average entry size */
  averageEntrySize: number;
  
  /** Entries by tag */
  entriesByTag: Record<string, number>;
  
  /** Entries by TTL range */
  entriesByTtl: {
    expired: number;
    expiringSoon: number; // < 10% of TTL remaining
    fresh: number;
  };
  
  /** Performance metrics */
  performance: {
    totalHits: number;
    totalMisses: number;
    totalWrites: number;
    totalEvictions: number;
    averageAccessTime: number;
  };
}

export interface CacheSearchOptions {
  /** Filter by tags */
  tags?: string[];
  
  /** Filter by expiration status */
  expired?: boolean;
  
  /** Filter by format type (for processing cache) */
  formatType?: FormatType;
  
  /** Sort by access patterns */
  sortBy?: 'lastAccessed' | 'accessCount' | 'createdAt' | 'size';
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Limit results */
  limit?: number;
}

// ============================================================================
// Storage Keys and Constants
// ============================================================================

const STORAGE_KEYS = {
  CACHE: 'textFormatter:cache',
  CACHE_INDEX: 'textFormatter:cache:index',
  CACHE_STATS: 'textFormatter:cache:stats',
  PROCESSING_CACHE: 'textFormatter:cache:processing',
} as const;

const DEFAULT_CONFIG: CacheConfig = {
  defaultTtl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 10 * 1024 * 1024, // 10MB
  maxEntries: 1000,
  cleanupThreshold: 0.8,
  cleanupStrategy: 'lru',
  compression: true,
  statistics: true,
};

// ============================================================================
// Utility Functions
// ============================================================================

function generateCacheKey(prefix: string, ...parts: string[]): string {
  return `${prefix}:${parts.join(':')}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

function estimateSize(data: unknown): number {
  return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
}

function isExpired(entry: CacheEntry): boolean {
  return Date.now() > entry.metadata.expiresAt.getTime();
}

function validateCacheEntry(entry: unknown): entry is CacheEntry {
  if (!entry || typeof entry !== 'object') return false;
  
  const cacheEntry = entry as Record<string, unknown>;
  
  return (
    typeof cacheEntry.key === 'string' &&
    cacheEntry.data !== undefined &&
    cacheEntry.metadata !== null &&
    cacheEntry.metadata !== undefined &&
    typeof cacheEntry.metadata === 'object'
  );
}

// ============================================================================
// CacheStorage Class
// ============================================================================

export class CacheStorage {
  private static instance: CacheStorage | null = null;
  private config: CacheConfig;
  private cacheIndex: Map<string, CacheEntry> = new Map();
  private stats: CacheStats | null = null;
  private isLoaded = false;

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupPeriodicCleanup();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<CacheConfig>): CacheStorage {
    if (!CacheStorage.instance) {
      CacheStorage.instance = new CacheStorage(config);
    }
    return CacheStorage.instance;
  }

  /**
   * Initialize cache storage
   */
  public async initialize(): Promise<Result<void, StorageError>> {
    if (this.isLoaded) {
      return { success: true, data: undefined };
    }

    try {
      await this.loadCacheIndex();
      await this.loadStats();
      this.isLoaded = true;
      
      // Clean up expired entries on startup
      await this.cleanupExpired();
      
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to initialize cache storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'INIT_FAILED',
          { error }
        )
      };
    }
  }

  /**
   * Set cache entry
   */
  public async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      tags?: string[];
      version?: number;
    } = {}
  ): Promise<Result<void, StorageError>> {
    try {
      await this.ensureInitialized();

      const now = new Date();
      const ttl = options.ttl || this.config.defaultTtl;
      const size = estimateSize(data);
      
      // Check size limits
      if (size > this.config.maxSize * 0.1) { // Single entry shouldn't exceed 10% of total cache
        return {
          success: false,
          error: new StorageError(
            'Cache entry too large',
            'ENTRY_TOO_LARGE',
            { key, size, maxSize: this.config.maxSize * 0.1 }
          )
        };
      }

      const entry: CacheEntry<T> = {
        key,
        data,
        metadata: {
          createdAt: now,
          ttl,
          expiresAt: new Date(now.getTime() + ttl),
          accessCount: 0,
          lastAccessed: now,
          size,
          tags: options.tags || [],
          version: options.version || 1,
        },
      };

      // Check if cleanup is needed before adding
      await this.checkAndCleanup();

      // Store in cache
      const result = storage.setItem(`${STORAGE_KEYS.CACHE}:${key}`, entry, {
        validator: validateCacheEntry,
      });

      if (!result.success) {
        return result;
      }

      // Update index
      this.cacheIndex.set(key, entry);
      await this.saveCacheIndex();
      
      // Update stats
      await this.updateStats('write');

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to set cache entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'SET_FAILED',
          { error, key }
        )
      };
    }
  }

  /**
   * Get cache entry
   */
  public async get<T>(key: string): Promise<Result<T | null, StorageError>> {
    try {
      await this.ensureInitialized();

      const entry = this.cacheIndex.get(key);
      if (!entry) {
        await this.updateStats('miss');
        return { success: true, data: null };
      }

      // Check if expired
      if (isExpired(entry)) {
        await this.delete(key);
        await this.updateStats('miss');
        return { success: true, data: null };
      }

      // Update access statistics
      entry.metadata.accessCount++;
      entry.metadata.lastAccessed = new Date();
      
      // Save updated entry
      await this.set(entry.key, entry.data, {
        ttl: entry.metadata.ttl,
        tags: entry.metadata.tags,
        version: entry.metadata.version,
      });

      await this.updateStats('hit');
      return { success: true, data: entry.data as T };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to get cache entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'GET_FAILED',
          { error, key }
        )
      };
    }
  }

  /**
   * Delete cache entry
   */
  public async delete(key: string): Promise<Result<void, StorageError>> {
    try {
      await this.ensureInitialized();

      // Remove from storage
      const result = storage.removeItem(`${STORAGE_KEYS.CACHE}:${key}`);
      if (!result.success) {
        return result;
      }

      // Remove from index
      this.cacheIndex.delete(key);
      await this.saveCacheIndex();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to delete cache entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'DELETE_FAILED',
          { error, key }
        )
      };
    }
  }

  /**
   * Clear cache by tags
   */
  public async clearByTags(tags: string[]): Promise<Result<number, StorageError>> {
    try {
      await this.ensureInitialized();

      const entries = Array.from(this.cacheIndex.values());
      const toDelete = entries.filter(entry => 
        entry.metadata.tags.some(tag => tags.includes(tag))
      );

      let deletedCount = 0;
      for (const entry of toDelete) {
        const result = await this.delete(entry.key);
        if (result.success) {
          deletedCount++;
        }
      }

      return { success: true, data: deletedCount };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to clear cache by tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CLEAR_BY_TAGS_FAILED',
          { error, tags }
        )
      };
    }
  }

  /**
   * Clear all cache
   */
  public async clear(): Promise<Result<void, StorageError>> {
    try {
      await this.ensureInitialized();

      // Delete all cache entries
      const deletePromises = Array.from(this.cacheIndex.keys()).map(key => 
        storage.removeItem(`${STORAGE_KEYS.CACHE}:${key}`)
      );

      await Promise.all(deletePromises);

      // Clear index
      this.cacheIndex.clear();
      await this.saveCacheIndex();

      // Reset stats
      this.stats = null;
      await this.saveStats();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CLEAR_FAILED',
          { error }
        )
      };
    }
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<Result<CacheStats, StorageError>> {
    try {
      await this.ensureInitialized();

      if (this.stats) {
        return { success: true, data: this.stats };
      }

      // Calculate stats from current entries
      const entries = Array.from(this.cacheIndex.values());
      const now = Date.now();
      
      const totalSize = entries.reduce((sum, entry) => sum + entry.metadata.size, 0);
      const entriesByTag: Record<string, number> = {};
      
      let expiredCount = 0;
      let expiringSoonCount = 0;
      let freshCount = 0;

      entries.forEach(entry => {
        // Count by tags
        entry.metadata.tags.forEach(tag => {
          entriesByTag[tag] = (entriesByTag[tag] || 0) + 1;
        });

        // Count by expiration status
        const timeToExpiry = entry.metadata.expiresAt.getTime() - now;
        if (timeToExpiry <= 0) {
          expiredCount++;
        } else if (timeToExpiry < entry.metadata.ttl * 0.1) {
          expiringSoonCount++;
        } else {
          freshCount++;
        }
      });

      const stats: CacheStats = {
        totalEntries: entries.length,
        totalSize,
        hitRate: 0, // Would be calculated from stored metrics
        missRate: 0,
        averageEntrySize: entries.length > 0 ? totalSize / entries.length : 0,
        entriesByTag,
        entriesByTtl: {
          expired: expiredCount,
          expiringSoon: expiringSoonCount,
          fresh: freshCount,
        },
        performance: {
          totalHits: 0,
          totalMisses: 0,
          totalWrites: 0,
          totalEvictions: 0,
          averageAccessTime: 0,
        },
      };

      this.stats = stats;
      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to get cache stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'STATS_FAILED',
          { error }
        )
      };
    }
  }

  // ============================================================================
  // Processing-Specific Methods
  // ============================================================================

  /**
   * Cache processing result
   */
  public async cacheProcessingResult(
    text: string,
    formatType: FormatType,
    options: Record<string, unknown>,
    result: {
      formattedText: string;
      metadata: Record<string, unknown>;
    }
  ): Promise<Result<void, StorageError>> {
    const inputHash = hashString(text);
    const optionsHash = hashString(JSON.stringify(options));
    const key = generateCacheKey('processing', formatType, inputHash, optionsHash);
    
    return this.set(key, result, {
      tags: ['processing', formatType],
      ttl: this.config.defaultTtl,
    });
  }

  /**
   * Get cached processing result
   */
  public async getCachedProcessingResult(
    text: string,
    formatType: FormatType,
    options: Record<string, unknown>
  ): Promise<Result<{ formattedText: string; metadata: Record<string, unknown> } | null, StorageError>> {
    const inputHash = hashString(text);
    const optionsHash = hashString(JSON.stringify(options));
    const key = generateCacheKey('processing', formatType, inputHash, optionsHash);
    
    return this.get(key);
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

  private async loadCacheIndex(): Promise<void> {
    const result = storage.getItem<Record<string, CacheEntry>>(STORAGE_KEYS.CACHE_INDEX);
    if (result.success && result.data) {
      this.cacheIndex = new Map(Object.entries(result.data));
    }
  }

  private async saveCacheIndex(): Promise<void> {
    const indexObject = Object.fromEntries(this.cacheIndex.entries());
    storage.setItem(STORAGE_KEYS.CACHE_INDEX, indexObject);
  }

  private async loadStats(): Promise<void> {
    const result = storage.getItem<CacheStats>(STORAGE_KEYS.CACHE_STATS);
    if (result.success && result.data) {
      this.stats = result.data;
    }
  }

  private async saveStats(): Promise<void> {
    if (this.stats) {
      storage.setItem(STORAGE_KEYS.CACHE_STATS, this.stats);
    }
  }

  private async updateStats(operation: 'hit' | 'miss' | 'write' | 'eviction'): Promise<void> {
    if (!this.config.statistics) return;

    if (!this.stats) {
      const statsResult = await this.getStats();
      if (!statsResult.success) return;
    }

    if (this.stats) {
      switch (operation) {
        case 'hit':
          this.stats.performance.totalHits++;
          break;
        case 'miss':
          this.stats.performance.totalMisses++;
          break;
        case 'write':
          this.stats.performance.totalWrites++;
          break;
        case 'eviction':
          this.stats.performance.totalEvictions++;
          break;
      }

      // Recalculate rates
      const total = this.stats.performance.totalHits + this.stats.performance.totalMisses;
      if (total > 0) {
        this.stats.hitRate = (this.stats.performance.totalHits / total) * 100;
        this.stats.missRate = (this.stats.performance.totalMisses / total) * 100;
      }

      await this.saveStats();
    }
  }

  private async checkAndCleanup(): Promise<void> {
    const currentSize = Array.from(this.cacheIndex.values())
      .reduce((sum, entry) => sum + entry.metadata.size, 0);
    
    const sizeThreshold = this.config.maxSize * this.config.cleanupThreshold;
    const countThreshold = this.config.maxEntries * this.config.cleanupThreshold;
    
    if (currentSize > sizeThreshold || this.cacheIndex.size > countThreshold) {
      await this.performCleanup();
    }
  }

  private async cleanupExpired(): Promise<number> {
    const entries = Array.from(this.cacheIndex.values());
    const expiredEntries = entries.filter(isExpired);
    
    let cleanedCount = 0;
    for (const entry of expiredEntries) {
      const result = await this.delete(entry.key);
      if (result.success) {
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  private async performCleanup(): Promise<void> {
    // First, clean up expired entries
    await this.cleanupExpired();
    
    // If still over threshold, apply cleanup strategy
    const entries = Array.from(this.cacheIndex.values());
    const targetCount = Math.floor(this.config.maxEntries * 0.7); // Clean to 70% capacity
    
    if (entries.length <= targetCount) return;

    let toDelete: CacheEntry[] = [];
    
    switch (this.config.cleanupStrategy) {
      case 'lru':
        toDelete = entries
          .sort((a, b) => a.metadata.lastAccessed.getTime() - b.metadata.lastAccessed.getTime())
          .slice(0, entries.length - targetCount);
        break;
        
      case 'lfu':
        toDelete = entries
          .sort((a, b) => a.metadata.accessCount - b.metadata.accessCount)
          .slice(0, entries.length - targetCount);
        break;
        
      case 'fifo':
        toDelete = entries
          .sort((a, b) => a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime())
          .slice(0, entries.length - targetCount);
        break;
        
      case 'ttl':
        toDelete = entries
          .sort((a, b) => a.metadata.expiresAt.getTime() - b.metadata.expiresAt.getTime())
          .slice(0, entries.length - targetCount);
        break;
    }

    for (const entry of toDelete) {
      await this.delete(entry.key);
      await this.updateStats('eviction');
    }
  }

  private setupPeriodicCleanup(): void {
    if (typeof window !== 'undefined') {
      // Clean up expired entries every 30 minutes
      setInterval(() => {
        this.cleanupExpired().catch(console.error);
      }, 30 * 60 * 1000);
    }
  }
}

// ============================================================================
// Exported Singleton Instance
// ============================================================================

export const cacheStorage = CacheStorage.getInstance();
export default cacheStorage;
