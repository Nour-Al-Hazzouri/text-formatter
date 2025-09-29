/**
 * Text Formatter - Global Type Definitions
 * 
 * Comprehensive TypeScript types for the text formatting application
 * Following strict type safety practices and modern TypeScript patterns
 */

// Re-export all type modules for centralized access
// Note: Avoiding re-exports to prevent circular dependencies
// Import specific types as needed in each module

// ============================================================================
// Global Application Types
// ============================================================================

/**
 * Application-wide configuration and settings
 */
export interface AppConfig {
  /** Version information */
  version: string;
  
  /** Feature flags for enabling/disabling functionality */
  features: {
    autoDetection: boolean;
    formatHistory: boolean;
    customTemplates: boolean;
    darkMode: boolean;
    exportOptions: boolean;
  };
  
  /** Performance and processing settings */
  performance: {
    maxTextLength: number;
    processingTimeout: number;
    workerPoolSize: number;
    cacheEnabled: boolean;
  };
  
  /** Default user preferences */
  defaults: {
    formatMode: FormatType;
    autoSave: boolean;
    theme: 'light' | 'dark' | 'system';
    exportFormat: ExportFormat;
  };
}

/**
 * Global application state interface
 */
export interface AppState {
  /** Current configuration */
  config: AppConfig;
  
  /** User preferences and settings */
  preferences: UserPreferences;
  
  /** Current processing state */
  processing: ProcessingState;
  
  /** Error state management */
  error: ErrorState | null;
}

/**
 * User preferences and customization options
 */
export interface UserPreferences {
  /** Theme and visual preferences */
  theme: {
    mode: 'light' | 'dark' | 'system';
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  
  /** Formatting preferences */
  formatting: {
    defaultMode: FormatType;
    autoDetect: boolean;
    preserveOriginal: boolean;
    showConfidenceScore: boolean;
  };
  
  /** History and storage preferences */
  history: {
    enabled: boolean;
    maxItems: number;
    autoCleanup: boolean;
    retentionDays: number;
  };
  
  /** Export preferences */
  export: {
    defaultFormat: ExportFormat;
    includeMetadata: boolean;
    preserveFormatting: boolean;
  };
}

/**
 * Processing state for real-time feedback
 */
export interface ProcessingState {
  /** Current processing status */
  status: 'idle' | 'analyzing' | 'processing' | 'completed' | 'error';
  
  /** Current step in the processing pipeline */
  currentStep: ProcessingStep | null;
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Processing start timestamp */
  startedAt: Date | null;
  
  /** Processing duration in milliseconds */
  duration: number | null;
  
  /** Any processing warnings */
  warnings: ProcessingWarning[];
}

/**
 * Processing pipeline steps
 */
export type ProcessingStep = 
  | 'input-validation'
  | 'content-analysis'
  | 'pattern-recognition'
  | 'format-detection'
  | 'format-application'
  | 'output-generation'
  | 'post-processing';

/**
 * Processing warnings and notifications
 */
export interface ProcessingWarning {
  /** Warning type */
  type: 'performance' | 'accuracy' | 'compatibility' | 'feature';
  
  /** Warning message */
  message: string;
  
  /** Severity level */
  severity: 'low' | 'medium' | 'high';
  
  /** Optional suggestions for resolution */
  suggestions?: string[];
}

/**
 * Error state management
 */
export interface ErrorState {
  /** Error type classification */
  type: ErrorType;
  
  /** Error message */
  message: string;
  
  /** Error code for programmatic handling */
  code: string;
  
  /** Stack trace for debugging */
  stack?: string;
  
  /** Error context and metadata */
  context: Record<string, unknown>;
  
  /** Timestamp when error occurred */
  timestamp: Date;
  
  /** Whether error is recoverable */
  recoverable: boolean;
}

/**
 * Error type classifications
 */
export type ErrorType = 
  | 'validation'
  | 'processing' 
  | 'worker'
  | 'storage'
  | 'network'
  | 'configuration'
  | 'unknown';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  /** Response success status */
  success: boolean;
  
  /** Response data */
  data?: T;
  
  /** Error information if request failed */
  error?: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
  
  /** Response metadata */
  meta?: {
    timestamp: string;
    requestId: string;
    processingTime: number;
  };
}

/**
 * Generic callback function types
 */
export type EventCallback<T = void> = (data: T) => void;
export type AsyncEventCallback<T = void> = (data: T) => Promise<void>;

/**
 * Generic result type with success/error states
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Utility type for making all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Utility type for making specific keys required
 */
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type for branded/nominal types
 */
export type Brand<T, B> = T & { readonly __brand: B };

// Forward declarations - define common types here to avoid circular imports
export type FormatType = 
  | 'meeting-notes'
  | 'task-lists'
  | 'journal-notes'
  | 'shopping-lists'
  | 'research-notes'
  | 'study-notes';

export type ExportFormat = 
  | 'plain-text'
  | 'markdown'
  | 'html'
  | 'pdf'
  | 'docx'
  | 'json'
  | 'csv'
  | 'rtf'
  | 'latex'
  | 'epub'
  | 'odt';
