/**
 * Export Types - File Generation and Export Functionality
 * 
 * Types for exporting formatted content in various formats and managing export operations
 */

import { FormattedOutput } from './formatting';

// ============================================================================
// Export Format Types
// ============================================================================

import type { ExportFormat } from './index';

// ExportFormat is imported from index.ts to avoid circular dependencies

/**
 * Export format definition
 */
export interface ExportFormatDefinition {
  /** Format identifier */
  id: ExportFormat;
  
  /** Human-readable name */
  name: string;
  
  /** Format description */
  description: string;
  
  /** File extension */
  extension: string;
  
  /** MIME type */
  mimeType: string;
  
  /** Format category */
  category: ExportCategory;
  
  /** Whether format supports styling */
  supportsFormatting: boolean;
  
  /** Whether format supports metadata */
  supportsMetadata: boolean;
  
  /** Available export options */
  options: ExportFormatOption[];
  
  /** Format-specific configuration */
  config?: ExportFormatConfig;
}

/**
 * Export format categories
 */
export type ExportCategory = 
  | 'text'
  | 'markup'
  | 'document'
  | 'data'
  | 'presentation'
  | 'archive';

/**
 * Export format option definition
 */
export interface ExportFormatOption {
  /** Option key */
  key: string;
  
  /** Option display name */
  name: string;
  
  /** Option description */
  description: string;
  
  /** Option type */
  type: 'boolean' | 'string' | 'number' | 'select' | 'multiselect';
  
  /** Default value */
  defaultValue: ExportOptionValue;
  
  /** Available choices (for select types) */
  choices?: ExportChoice[];
  
  /** Option validation */
  validation?: ExportOptionValidation;
  
  /** Whether option is required */
  required: boolean;
  
  /** Option category for grouping */
  category?: string;
}

/**
 * Export option value types
 */
export type ExportOptionValue = string | number | boolean | string[];

/**
 * Export choice for select options
 */
export interface ExportChoice {
  /** Choice value */
  value: ExportOptionValue;
  
  /** Choice display label */
  label: string;
  
  /** Choice description */
  description?: string;
  
  /** Whether choice is recommended */
  recommended?: boolean;
}

/**
 * Export option validation
 */
export interface ExportOptionValidation {
  /** Minimum value (for numbers) */
  min?: number;
  
  /** Maximum value (for numbers) */
  max?: number;
  
  /** Minimum length (for strings) */
  minLength?: number;
  
  /** Maximum length (for strings) */
  maxLength?: number;
  
  /** Validation pattern (for strings) */
  pattern?: RegExp;
  
  /** Custom validator function */
  validator?: (value: ExportOptionValue) => boolean | string;
}

/**
 * Format-specific configuration
 */
export interface ExportFormatConfig {
  /** Template engine used */
  templateEngine?: 'handlebars' | 'mustache' | 'ejs';
  
  /** Default template */
  defaultTemplate?: string;
  
  /** Custom templates available */
  templates?: ExportTemplate[];
  
  /** Post-processing steps */
  postProcessors?: string[];
  
  /** Format limitations */
  limitations?: ExportLimitation[];
}

/**
 * Export template definition
 */
export interface ExportTemplate {
  /** Template identifier */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Template content */
  content: string;
  
  /** Template variables */
  variables: TemplateVariable[];
  
  /** Template preview */
  preview?: string;
}

/**
 * Template variable definition
 */
export interface TemplateVariable {
  /** Variable name */
  name: string;
  
  /** Variable type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  
  /** Variable description */
  description: string;
  
  /** Default value */
  default?: unknown;
  
  /** Whether variable is required */
  required: boolean;
}

/**
 * Export format limitations
 */
export interface ExportLimitation {
  /** Limitation type */
  type: 'file-size' | 'content-length' | 'feature' | 'browser';
  
  /** Limitation description */
  description: string;
  
  /** Limitation value */
  value?: number | string;
  
  /** Workaround suggestion */
  workaround?: string;
}

// ============================================================================
// Export Request and Response Types
// ============================================================================

/**
 * Export request configuration
 */
export interface ExportRequest {
  /** Request identifier */
  id: string;
  
  /** Content to export */
  content: FormattedOutput;
  
  /** Target format */
  format: ExportFormat;
  
  /** Export options */
  options: ExportOptions;
  
  /** Export metadata */
  metadata: ExportMetadata;
  
  /** Request timestamp */
  requestedAt: Date;
  
  /** Request timeout */
  timeout?: number;
}

/**
 * Export options configuration
 */
export interface ExportOptions {
  /** Include original metadata */
  includeMetadata: boolean;
  
  /** Preserve original formatting */
  preserveFormatting: boolean;
  
  /** Include confidence scores */
  includeConfidence: boolean;
  
  /** Include processing statistics */
  includeStats: boolean;
  
  /** Template to use */
  template?: string;
  
  /** Custom styling */
  styling?: ExportStyling;
  
  /** Page layout options */
  layout?: PageLayout;
  
  /** Format-specific options */
  formatSpecific: Record<string, ExportOptionValue>;
  
  /** Custom variables */
  variables?: Record<string, unknown>;
}

/**
 * Export styling configuration
 */
export interface ExportStyling {
  /** Font family */
  fontFamily?: string;
  
  /** Font size */
  fontSize?: number;
  
  /** Line height */
  lineHeight?: number;
  
  /** Color scheme */
  colorScheme?: 'light' | 'dark' | 'auto';
  
  /** Custom CSS */
  customCSS?: string;
  
  /** Include notebook theme */
  notebookTheme?: boolean;
}

/**
 * Page layout configuration
 */
export interface PageLayout {
  /** Page size */
  pageSize: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Tabloid';
  
  /** Page orientation */
  orientation: 'portrait' | 'landscape';
  
  /** Page margins */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  /** Header configuration */
  header?: PageHeaderFooter;
  
  /** Footer configuration */
  footer?: PageHeaderFooter;
}

/**
 * Page header/footer configuration
 */
export interface PageHeaderFooter {
  /** Whether to include */
  enabled: boolean;
  
  /** Content template */
  content: string;
  
  /** Height in units */
  height: number;
  
  /** Alignment */
  alignment: 'left' | 'center' | 'right';
  
  /** Font size */
  fontSize?: number;
}

/**
 * Export metadata
 */
export interface ExportMetadata {
  /** Document title */
  title?: string;
  
  /** Document author */
  author?: string;
  
  /** Document subject */
  subject?: string;
  
  /** Document keywords */
  keywords?: string[];
  
  /** Creation date */
  createdAt: Date;
  
  /** Application name */
  application: string;
  
  /** Export source */
  source: {
    formatType: string;
    confidence: number;
    processedAt: Date;
  };
}

/**
 * Export response
 */
export interface ExportResponse {
  /** Request identifier */
  requestId: string;
  
  /** Export success status */
  success: boolean;
  
  /** Generated file information */
  file?: ExportedFile;
  
  /** Export error information */
  error?: ExportError;
  
  /** Export statistics */
  stats: ExportStats;
  
  /** Response timestamp */
  completedAt: Date;
}

/**
 * Exported file information
 */
export interface ExportedFile {
  /** File name */
  name: string;
  
  /** File size in bytes */
  size: number;
  
  /** File MIME type */
  mimeType: string;
  
  /** File content (base64 or blob) */
  content: string | Blob;
  
  /** Download URL (if applicable) */
  downloadUrl?: string;
  
  /** File hash/checksum */
  hash?: string;
  
  /** File metadata */
  metadata: FileMetadata;
}

/**
 * File metadata
 */
export interface FileMetadata {
  /** File creation date */
  createdAt: Date;
  
  /** File format version */
  formatVersion?: string;
  
  /** Compression used */
  compression?: string;
  
  /** Encoding used */
  encoding?: string;
  
  /** Custom properties */
  customProperties?: Record<string, string>;
}

/**
 * Export error information
 */
export interface ExportError {
  /** Error code */
  code: ExportErrorCode;
  
  /** Error message */
  message: string;
  
  /** Error details */
  details?: string;
  
  /** Error context */
  context?: Record<string, unknown>;
  
  /** Suggested solutions */
  suggestions?: string[];
}

/**
 * Export error codes
 */
export type ExportErrorCode = 
  | 'INVALID_FORMAT'
  | 'INVALID_OPTIONS'
  | 'CONTENT_TOO_LARGE'
  | 'TEMPLATE_ERROR'
  | 'PROCESSING_ERROR'
  | 'FILE_GENERATION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Export statistics
 */
export interface ExportStats {
  /** Processing duration */
  processingTime: number;
  
  /** Memory usage */
  memoryUsage?: number;
  
  /** Content statistics */
  content: {
    originalSize: number;
    exportedSize: number;
    compressionRatio?: number;
  };
  
  /** Performance metrics */
  performance: {
    templatingTime?: number;
    renderingTime?: number;
    fileGenerationTime?: number;
  };
}

// ============================================================================
// Clipboard and Sharing Types
// ============================================================================

/**
 * Clipboard export configuration
 */
export interface ClipboardExport {
  /** Content to copy */
  content: string;
  
  /** MIME type for clipboard */
  mimeType: string;
  
  /** Whether to preserve formatting */
  preserveFormatting: boolean;
  
  /** Fallback plain text */
  plainText?: string;
  
  /** Rich text (HTML) version */
  richText?: string;
}

/**
 * Sharing configuration
 */
export interface ShareConfig {
  /** Share title */
  title: string;
  
  /** Share description */
  description?: string;
  
  /** Share URL */
  url?: string;
  
  /** Share content */
  content: string;
  
  /** Sharing platforms */
  platforms: SharePlatform[];
  
  /** Share metadata */
  metadata?: ShareMetadata;
}

/**
 * Sharing platform configuration
 */
export interface SharePlatform {
  /** Platform identifier */
  id: string;
  
  /** Platform name */
  name: string;
  
  /** Platform icon */
  icon: string;
  
  /** Share URL template */
  urlTemplate: string;
  
  /** Platform-specific options */
  options?: Record<string, string>;
}

/**
 * Share metadata
 */
export interface ShareMetadata {
  /** Open Graph tags */
  og?: {
    title: string;
    description: string;
    image?: string;
    url?: string;
  };
  
  /** Twitter Card tags */
  twitter?: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    image?: string;
  };
}

// ============================================================================
// Batch Export Types
// ============================================================================

/**
 * Batch export request
 */
export interface BatchExportRequest {
  /** Batch identifier */
  batchId: string;
  
  /** Items to export */
  items: BatchExportItem[];
  
  /** Batch options */
  options: BatchExportOptions;
  
  /** Request timestamp */
  requestedAt: Date;
}

/**
 * Batch export item
 */
export interface BatchExportItem {
  /** Item identifier */
  id: string;
  
  /** Content to export */
  content: FormattedOutput;
  
  /** Target format */
  format: ExportFormat;
  
  /** Item-specific options */
  options?: Partial<ExportOptions>;
  
  /** Output file name */
  fileName?: string;
}

/**
 * Batch export options
 */
export interface BatchExportOptions {
  /** Archive format for multiple files */
  archiveFormat?: 'zip' | 'tar' | 'rar';
  
  /** Whether to create directory structure */
  createDirectories: boolean;
  
  /** Directory name pattern */
  directoryPattern?: string;
  
  /** File name pattern */
  fileNamePattern: string;
  
  /** Batch processing options */
  processing: {
    maxConcurrent: number;
    continueOnError: boolean;
    retryCount: number;
  };
}

/**
 * Batch export response
 */
export interface BatchExportResponse {
  /** Batch identifier */
  batchId: string;
  
  /** Overall success status */
  success: boolean;
  
  /** Individual item results */
  results: BatchExportResult[];
  
  /** Archive file (if created) */
  archive?: ExportedFile;
  
  /** Batch statistics */
  stats: BatchExportStats;
  
  /** Completion timestamp */
  completedAt: Date;
}

/**
 * Individual batch item result
 */
export interface BatchExportResult {
  /** Item identifier */
  itemId: string;
  
  /** Export success status */
  success: boolean;
  
  /** Generated file */
  file?: ExportedFile;
  
  /** Export error */
  error?: ExportError;
  
  /** Item processing time */
  processingTime: number;
}

/**
 * Batch export statistics
 */
export interface BatchExportStats {
  /** Total items processed */
  totalItems: number;
  
  /** Successful exports */
  successfulExports: number;
  
  /** Failed exports */
  failedExports: number;
  
  /** Total processing time */
  totalProcessingTime: number;
  
  /** Average processing time per item */
  avgProcessingTime: number;
  
  /** Total file size */
  totalFileSize: number;
}

// ============================================================================
// Export History and Management
// ============================================================================

/**
 * Export history item
 */
export interface ExportHistoryItem {
  /** Export identifier */
  id: string;
  
  /** Export timestamp */
  exportedAt: Date;
  
  /** Original content reference */
  contentId: string;
  
  /** Export format used */
  format: ExportFormat;
  
  /** Export options used */
  options: ExportOptions;
  
  /** File information */
  file: {
    name: string;
    size: number;
    downloadCount: number;
    lastDownloaded?: Date;
  };
  
  /** User metadata */
  metadata: {
    title?: string;
    description?: string;
    tags?: string[];
    favorited: boolean;
  };
  
  /** Export status */
  status: 'available' | 'expired' | 'deleted';
  
  /** Expiration date */
  expiresAt?: Date;
}

/**
 * Export management operations
 */
export interface ExportManager {
  /** Get export history */
  getHistory: (filters?: ExportHistoryFilter) => Promise<ExportHistoryItem[]>;
  
  /** Download exported file */
  download: (exportId: string) => Promise<Blob>;
  
  /** Delete export */
  deleteExport: (exportId: string) => Promise<void>;
  
  /** Update export metadata */
  updateMetadata: (exportId: string, metadata: Partial<ExportHistoryItem['metadata']>) => Promise<void>;
  
  /** Clean expired exports */
  cleanExpired: () => Promise<number>;
  
  /** Get storage usage */
  getStorageUsage: () => Promise<StorageUsage>;
}

/**
 * Export history filter
 */
export interface ExportHistoryFilter {
  /** Filter by format */
  format?: ExportFormat;
  
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Filter by tags */
  tags?: string[];
  
  /** Filter by status */
  status?: ExportHistoryItem['status'];
  
  /** Search query */
  search?: string;
  
  /** Sort options */
  sort?: {
    field: 'exportedAt' | 'size' | 'downloadCount';
    direction: 'asc' | 'desc';
  };
  
  /** Pagination */
  pagination?: {
    page: number;
    limit: number;
  };
}

/**
 * Storage usage information
 */
export interface StorageUsage {
  /** Total storage used */
  totalUsed: number;
  
  /** Storage limit */
  limit: number;
  
  /** Usage by format */
  byFormat: Record<ExportFormat, number>;
  
  /** Number of files */
  fileCount: number;
  
  /** Oldest export date */
  oldestExport?: Date;
  
  /** Largest export size */
  largestExport?: number;
}
