/**
 * History & Template System Types
 * 
 * Type definitions for format history tracking and template management
 */

import type { FormatType } from './index';
import type { FormattedOutput, TextInput } from './formatting';

// ============================================================================
// History Types
// ============================================================================

/**
 * Format history entry
 */
export interface FormatHistoryEntry {
  /** Unique entry identifier */
  id: string;
  
  /** Timestamp of the transformation */
  timestamp: Date;
  
  /** Format type used */
  format: FormatType;
  
  /** Input text (truncated for storage) */
  inputPreview: string;
  
  /** Input text hash for deduplication */
  inputHash: string;
  
  /** Full input text size */
  inputSize: number;
  
  /** Formatted output preview */
  outputPreview: string;
  
  /** Processing metadata */
  processingMetadata: {
    duration: number;
    confidence: number;
    itemCount: number;
    workerUsed?: string;
  };
  
  /** User-defined tags */
  tags: string[];
  
  /** User notes */
  notes?: string;
  
  /** Whether entry is favorited */
  favorited: boolean;
  
  /** Template ID if created from template */
  templateId?: string;
  
  /** Storage location for full data */
  storageRef?: string;
}

/**
 * History search and filter options
 */
export interface HistorySearchOptions {
  /** Text search query */
  query?: string;
  
  /** Filter by format types */
  formats?: FormatType[];
  
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Filter by tags */
  tags?: string[];
  
  /** Show only favorites */
  favoritesOnly?: boolean;
  
  /** Filter by confidence level */
  minConfidence?: number;
  
  /** Sort options */
  sort: {
    field: 'timestamp' | 'format' | 'confidence' | 'size';
    direction: 'asc' | 'desc';
  };
  
  /** Pagination */
  pagination: {
    page: number;
    limit: number;
  };
}

/**
 * History statistics
 */
export interface HistoryStats {
  /** Total number of transformations */
  totalTransformations: number;
  
  /** Transformations by format type */
  byFormat: Record<FormatType, number>;
  
  /** Most used format */
  mostUsedFormat: FormatType;
  
  /** Average confidence score */
  averageConfidence: number;
  
  /** Total processing time */
  totalProcessingTime: number;
  
  /** Storage usage in bytes */
  storageUsed: number;
  
  /** Recent activity (last 7 days) */
  recentActivity: number;
  
  /** Top tags */
  topTags: Array<{ tag: string; count: number }>;
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Format template definition
 */
export interface FormatTemplate {
  /** Unique template identifier */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description?: string;
  
  /** Template category */
  category: TemplateCategory;
  
  /** Format type this template applies to */
  format: FormatType;
  
  /** Template configuration */
  config: TemplateConfig;
  
  /** Sample input for demonstration */
  sampleInput?: string;
  
  /** Expected output preview */
  outputPreview?: string;
  
  /** Template tags for organization */
  tags: string[];
  
  /** Template metadata */
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    version: number;
    usageCount: number;
    rating?: number;
    isPublic: boolean;
    isOfficial: boolean;
  };
  
  /** Template sharing info */
  sharing?: {
    shareId: string;
    shareUrl: string;
    downloadCount: number;
    allowModifications: boolean;
  };
}

/**
 * Template categories
 */
export type TemplateCategory = 
  | 'business'
  | 'academic'
  | 'personal' 
  | 'creative'
  | 'technical'
  | 'educational'
  | 'productivity'
  | 'custom';

/**
 * Template configuration (format-specific settings)
 */
export interface TemplateConfig {
  /** Processing options */
  processing: {
    enablePatternRecognition: boolean;
    enableDataExtraction: boolean;
    enableContentAnalysis: boolean;
    customPatterns?: string[];
  };
  
  /** Output formatting preferences */
  formatting: {
    includeMetadata: boolean;
    includeConfidence: boolean;
    customHeaders?: string[];
    customFooters?: string[];
    theme?: 'minimal' | 'detailed' | 'compact';
  };
  
  /** Format-specific configurations */
  formatSpecific: Record<string, unknown>;
  
  /** Custom rules and transformations */
  customRules?: Array<{
    name: string;
    pattern: string;
    replacement: string;
    enabled: boolean;
  }>;
}

/**
 * Template search options
 */
export interface TemplateSearchOptions {
  /** Text search query */
  query?: string;
  
  /** Filter by categories */
  categories?: TemplateCategory[];
  
  /** Filter by format types */
  formats?: FormatType[];
  
  /** Filter by tags */
  tags?: string[];
  
  /** Show only public templates */
  publicOnly?: boolean;
  
  /** Show only official templates */
  officialOnly?: boolean;
  
  /** Minimum rating */
  minRating?: number;
  
  /** Sort options */
  sort: {
    field: 'name' | 'createdAt' | 'usageCount' | 'rating';
    direction: 'asc' | 'desc';
  };
  
  /** Pagination */
  pagination: {
    page: number;
    limit: number;
  };
}

/**
 * Template usage statistics
 */
export interface TemplateStats {
  /** Total templates created */
  totalTemplates: number;
  
  /** Templates by category */
  byCategory: Record<TemplateCategory, number>;
  
  /** Templates by format */
  byFormat: Record<FormatType, number>;
  
  /** Most used templates */
  mostUsed: Array<{
    template: FormatTemplate;
    usageCount: number;
  }>;
  
  /** Recently created */
  recentlyCreated: FormatTemplate[];
  
  /** Public template contributions */
  publicContributions: number;
}

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Storage optimization settings
 */
export interface StorageSettings {
  /** Maximum history entries to keep */
  maxHistoryEntries: number;
  
  /** Maximum storage size in bytes */
  maxStorageSize: number;
  
  /** Auto-cleanup after days */
  autoCleanupAfterDays: number;
  
  /** Compression settings */
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'brotli' | 'lz4';
    level: number;
  };
  
  /** Data retention policies */
  retention: {
    keepFavorites: boolean;
    keepTemplateUsage: boolean;
    archiveOldEntries: boolean;
  };
}

/**
 * Storage statistics
 */
export interface StorageStats {
  /** Current storage usage */
  currentUsage: number;
  
  /** Storage limit */
  limit: number;
  
  /** Usage by data type */
  breakdown: {
    history: number;
    templates: number;
    cache: number;
    other: number;
  };
  
  /** Compression ratio achieved */
  compressionRatio: number;
  
  /** Last cleanup timestamp */
  lastCleanup: Date;
  
  /** Entries cleaned up */
  entriesCleanedUp: number;
}

// ============================================================================
// Import/Export Types
// ============================================================================

/**
 * Template export format
 */
export interface TemplateExport {
  /** Export metadata */
  metadata: {
    version: string;
    exportedAt: Date;
    exportedBy?: string;
    includesHistory: boolean;
  };
  
  /** Exported templates */
  templates: FormatTemplate[];
  
  /** Associated history entries (if included) */
  history?: FormatHistoryEntry[];
  
  /** Export settings used */
  settings: {
    includePrivateTemplates: boolean;
    includeUsageStats: boolean;
    anonymizeData: boolean;
  };
}

/**
 * Import validation result
 */
export interface ImportValidationResult {
  /** Whether import is valid */
  isValid: boolean;
  
  /** Validation errors */
  errors: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  
  /** Import summary */
  summary: {
    templatesCount: number;
    historyCount: number;
    conflicts: number;
    newEntries: number;
  };
  
  /** Conflict resolution options */
  conflicts: Array<{
    type: 'template' | 'history';
    existing: FormatTemplate | FormatHistoryEntry;
    imported: FormatTemplate | FormatHistoryEntry;
    resolution: 'skip' | 'overwrite' | 'rename' | 'merge';
  }>;
}

// ============================================================================
// Service Interface Types
// ============================================================================

/**
 * History service interface
 */
export interface HistoryService {
  /** Add new history entry */
  addEntry(input: TextInput, output: FormattedOutput, metadata?: Partial<FormatHistoryEntry>): Promise<string>;
  
  /** Get history entries with search/filter */
  getEntries(options: HistorySearchOptions): Promise<{ entries: FormatHistoryEntry[]; total: number }>;
  
  /** Get single entry by ID */
  getEntry(id: string): Promise<FormatHistoryEntry | null>;
  
  /** Update entry (notes, tags, favorite status) */
  updateEntry(id: string, updates: Partial<FormatHistoryEntry>): Promise<void>;
  
  /** Delete entry */
  deleteEntry(id: string): Promise<void>;
  
  /** Get history statistics */
  getStats(): Promise<HistoryStats>;
  
  /** Cleanup old entries */
  cleanup(settings: StorageSettings): Promise<number>;
}

/**
 * Template service interface
 */
export interface TemplateService {
  /** Create new template */
  createTemplate(template: Omit<FormatTemplate, 'id' | 'metadata'>): Promise<string>;
  
  /** Get templates with search/filter */
  getTemplates(options: TemplateSearchOptions): Promise<{ templates: FormatTemplate[]; total: number }>;
  
  /** Get single template by ID */
  getTemplate(id: string): Promise<FormatTemplate | null>;
  
  /** Update template */
  updateTemplate(id: string, updates: Partial<FormatTemplate>): Promise<void>;
  
  /** Delete template */
  deleteTemplate(id: string): Promise<void>;
  
  /** Apply template to input */
  applyTemplate(templateId: string, input: TextInput): Promise<FormattedOutput>;
  
  /** Get template statistics */
  getStats(): Promise<TemplateStats>;
  
  /** Export templates */
  exportTemplates(templateIds: string[], settings: TemplateExport['settings']): Promise<TemplateExport>;
  
  /** Import templates */
  importTemplates(exportData: TemplateExport, validation: ImportValidationResult): Promise<string[]>;
}
