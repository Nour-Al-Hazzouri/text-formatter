/**
 * LocalStorageWrapper - Robust localStorage interface with error handling
 * 
 * Provides safe access to localStorage with serialization, error recovery,
 * quota management, and migration support
 */

import type { Result } from '@/types/index';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface StorageOptions {
  /** Enable encryption for sensitive data */
  encrypt?: boolean;
  
  /** Custom serializer for complex data types */
  serializer?: StorageSerializer;
  
  /** TTL for automatic expiration (in milliseconds) */
  ttl?: number;
  
  /** Enable compression for large data */
  compress?: boolean;
  
  /** Validation function for data integrity */
  validator?: (value: unknown) => boolean;
}

export interface StorageItem<T = unknown> {
  /** Stored data */
  data: T;
  
  /** Storage timestamp */
  timestamp: number;
  
  /** TTL expiration timestamp */
  expiresAt?: number;
  
  /** Data version for migration */
  version: number;
  
  /** Data checksum for integrity verification */
  checksum?: string;
  
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface StorageSerializer {
  serialize: (value: unknown) => string;
  deserialize: <T>(value: string) => T;
}

export interface StorageStats {
  /** Total items in storage */
  totalItems: number;
  
  /** Total storage size in bytes */
  totalSize: number;
  
  /** Available storage space */
  availableSpace: number;
  
  /** Storage quota (if available) */
  quota?: number;
  
  /** Items by namespace */
  itemsByNamespace: Record<string, number>;
  
  /** Expired items count */
  expiredItems: number;
}

export interface StorageMigration {
  /** Migration version */
  version: number;
  
  /** Migration function */
  migrate: (data: unknown) => unknown;
  
  /** Validation function */
  validate?: (data: unknown) => boolean;
}

// ============================================================================
// Storage Error Types
// ============================================================================

export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageQuotaError extends StorageError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'QUOTA_EXCEEDED', context);
    this.name = 'StorageQuotaError';
  }
}

export class StorageCorruptionError extends StorageError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATA_CORRUPTION', context);
    this.name = 'StorageCorruptionError';
  }
}

// ============================================================================
// Default Serializer
// ============================================================================

const defaultSerializer: StorageSerializer = {
  serialize: (value: unknown) => JSON.stringify(value),
  deserialize: <T>(value: string): T => JSON.parse(value) as T,
};

// ============================================================================
// LocalStorageWrapper Class
// ============================================================================

export class LocalStorageWrapper {
  private static instance: LocalStorageWrapper | null = null;
  private readonly migrations: Map<number, StorageMigration> = new Map();
  private readonly currentVersion = 1;
  private readonly defaultOptions: Required<StorageOptions> = {
    encrypt: false,
    serializer: defaultSerializer,
    ttl: 0, // No expiration by default
    compress: false,
    validator: () => true,
  };

  private constructor() {
    this.setupMigrations();
    this.cleanupExpiredItems();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LocalStorageWrapper {
    if (!LocalStorageWrapper.instance) {
      LocalStorageWrapper.instance = new LocalStorageWrapper();
    }
    return LocalStorageWrapper.instance;
  }

  /**
   * Check if localStorage is available
   */
  public isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set item in localStorage with options
   */
  public setItem<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): Result<void, StorageError> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          error: new StorageError('localStorage not available', 'NOT_AVAILABLE')
        };
      }

      const mergedOptions = { ...this.defaultOptions, ...options };
      
      // Validate input if validator provided
      if (!mergedOptions.validator(value)) {
        return {
          success: false,
          error: new StorageError('Data validation failed', 'VALIDATION_FAILED', { key, value })
        };
      }

      // Create storage item
      const storageItem: StorageItem<T> = {
        data: value,
        timestamp: Date.now(),
        version: this.currentVersion,
        ...(mergedOptions.ttl > 0 && {
          expiresAt: Date.now() + mergedOptions.ttl
        }),
      };

      // Generate checksum for integrity
      if (typeof value === 'object' && value !== null) {
        storageItem.checksum = this.generateChecksum(value);
      }

      // Serialize data
      const serializedData = mergedOptions.serializer.serialize(storageItem);
      
      // Check storage quota before setting
      const quotaCheck = this.checkQuota(key, serializedData);
      if (!quotaCheck.success) {
        return quotaCheck;
      }

      // Store the item
      localStorage.setItem(key, serializedData);

      return { success: true, data: undefined };
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        return {
          success: false,
          error: new StorageQuotaError('Storage quota exceeded', { key, error: error.message })
        };
      }

      return {
        success: false,
        error: new StorageError(
          `Failed to set item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'SET_FAILED',
          { key, error }
        )
      };
    }
  }

  /**
   * Get item from localStorage with type safety
   */
  public getItem<T>(
    key: string,
    options: StorageOptions = {}
  ): Result<T | null, StorageError> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          error: new StorageError('localStorage not available', 'NOT_AVAILABLE')
        };
      }

      const rawData = localStorage.getItem(key);
      if (rawData === null) {
        return { success: true, data: null };
      }

      const mergedOptions = { ...this.defaultOptions, ...options };
      
      // Deserialize data
      const storageItem = mergedOptions.serializer.deserialize<StorageItem<T>>(rawData);
      
      // Check expiration
      if (storageItem.expiresAt && Date.now() > storageItem.expiresAt) {
        this.removeItem(key);
        return { success: true, data: null };
      }

      // Verify checksum if available
      if (storageItem.checksum) {
        const currentChecksum = this.generateChecksum(storageItem.data);
        if (currentChecksum !== storageItem.checksum) {
          return {
            success: false,
            error: new StorageCorruptionError('Data integrity check failed', {
              key,
              expectedChecksum: storageItem.checksum,
              actualChecksum: currentChecksum
            })
          };
        }
      }

      // Handle migrations if needed
      if (storageItem.version < this.currentVersion) {
        const migrationResult = this.migrateItem(key, storageItem);
        if (!migrationResult.success) {
          return migrationResult;
        }
        return { success: true, data: migrationResult.data as T };
      }

      // Validate data if validator provided
      if (!mergedOptions.validator(storageItem.data)) {
        return {
          success: false,
          error: new StorageError('Data validation failed', 'VALIDATION_FAILED', { key })
        };
      }

      return { success: true, data: storageItem.data };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to get item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'GET_FAILED',
          { key, error }
        )
      };
    }
  }

  /**
   * Remove item from localStorage
   */
  public removeItem(key: string): Result<void, StorageError> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          error: new StorageError('localStorage not available', 'NOT_AVAILABLE')
        };
      }

      localStorage.removeItem(key);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to remove item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'REMOVE_FAILED',
          { key, error }
        )
      };
    }
  }

  /**
   * Clear all items from localStorage
   */
  public clear(): Result<void, StorageError> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          error: new StorageError('localStorage not available', 'NOT_AVAILABLE')
        };
      }

      localStorage.clear();
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CLEAR_FAILED',
          { error }
        )
      };
    }
  }

  /**
   * Get all keys from localStorage
   */
  public getAllKeys(): string[] {
    if (!this.isAvailable()) return [];
    
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  }

  /**
   * Get storage statistics
   */
  public getStats(): StorageStats {
    const keys = this.getAllKeys();
    let totalSize = 0;
    let expiredItems = 0;
    const itemsByNamespace: Record<string, number> = {};

    keys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;
        
        // Check if expired
        try {
          const storageItem = JSON.parse(item) as StorageItem;
          if (storageItem.expiresAt && Date.now() > storageItem.expiresAt) {
            expiredItems++;
          }
        } catch {
          // Ignore parsing errors for non-StorageItem data
        }

        // Count by namespace (first part before colon)
        const namespace = key.split(':')[0] || 'default';
        itemsByNamespace[namespace] = (itemsByNamespace[namespace] || 0) + 1;
      }
    });

    return {
      totalItems: keys.length,
      totalSize,
      availableSpace: this.getAvailableSpace(),
      itemsByNamespace,
      expiredItems,
    };
  }

  /**
   * Clean up expired items
   */
  public cleanupExpiredItems(): number {
    if (!this.isAvailable()) return 0;

    const keys = this.getAllKeys();
    let cleanedCount = 0;

    keys.forEach(key => {
      try {
        const rawData = localStorage.getItem(key);
        if (rawData) {
          const storageItem = JSON.parse(rawData) as StorageItem;
          if (storageItem.expiresAt && Date.now() > storageItem.expiresAt) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch {
        // Ignore parsing errors
      }
    });

    return cleanedCount;
  }

  /**
   * Register a migration for version updates
   */
  public registerMigration(migration: StorageMigration): void {
    this.migrations.set(migration.version, migration);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private checkQuota(key: string, data: string): Result<void, StorageError> {
    try {
      // Estimate storage usage
      const currentItem = localStorage.getItem(key);
      const currentSize = currentItem ? currentItem.length : 0;
      const newSize = data.length;
      const sizeDifference = newSize - currentSize;

      const availableSpace = this.getAvailableSpace();
      
      if (sizeDifference > availableSpace) {
        return {
          success: false,
          error: new StorageQuotaError('Insufficient storage space', {
            required: sizeDifference,
            available: availableSpace,
            key
          })
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError('Failed to check quota', 'QUOTA_CHECK_FAILED', { error })
      };
    }
  }

  private getAvailableSpace(): number {
    try {
      // Rough estimation using current usage
      const stats = this.getStats();
      const estimatedQuota = 5 * 1024 * 1024; // 5MB typical localStorage quota
      return Math.max(0, estimatedQuota - stats.totalSize);
    } catch {
      return 0;
    }
  }

  private generateChecksum(data: unknown): string {
    // Simple hash function for data integrity
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private migrateItem<T>(key: string, item: StorageItem<T>): Result<T, StorageError> {
    try {
      let currentData = item.data;
      let currentVersion = item.version;

      // Apply migrations in sequence
      for (const [version, migration] of this.migrations.entries()) {
        if (version > currentVersion && version <= this.currentVersion) {
          currentData = migration.migrate(currentData) as T;
          currentVersion = version;

          // Validate migrated data if validator provided
          if (migration.validate && !migration.validate(currentData)) {
            return {
              success: false,
              error: new StorageError('Migration validation failed', 'MIGRATION_FAILED', {
                key,
                version,
                data: currentData
              })
            };
          }
        }
      }

      // Save migrated data back to storage
      const migratedItem: StorageItem<T> = {
        ...item,
        data: currentData,
        version: this.currentVersion,
        timestamp: Date.now(),
        checksum: this.generateChecksum(currentData),
      };

      const serialized = defaultSerializer.serialize(migratedItem);
      localStorage.setItem(key, serialized);

      return { success: true, data: currentData };
    } catch (error) {
      return {
        success: false,
        error: new StorageError('Migration failed', 'MIGRATION_FAILED', { key, error })
      };
    }
  }

  private setupMigrations(): void {
    // Example migration setup
    // Migrations will be added as the application evolves
    
    // Version 1 -> 2 migration example
    this.registerMigration({
      version: 2,
      migrate: (data: unknown) => {
        // Future migration logic will go here
        return data;
      },
      validate: (data: unknown) => {
        // Future validation logic will go here
        return true;
      },
    });
  }
}

// ============================================================================
// Exported Singleton Instance
// ============================================================================

export const storage = LocalStorageWrapper.getInstance();
export default storage;
