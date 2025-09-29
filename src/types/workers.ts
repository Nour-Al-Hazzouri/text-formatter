/**
 * Web Worker Types - Communication and Processing Definitions
 * 
 * Types for Web Worker communication, task management, and concurrent processing
 */

import { TextInput, FormattedOutput, ProcessingStats } from './formatting';
import type { FormatType } from './index';

// ============================================================================
// Worker Communication Types
// ============================================================================

/**
 * Base message structure for worker communication
 */
export interface WorkerMessage<T = unknown> {
  /** Unique message identifier */
  id: string;
  
  /** Message type */
  type: WorkerMessageType;
  
  /** Message payload */
  payload: T;
  
  /** Message timestamp */
  timestamp: number;
  
  /** Transfer list for transferable objects */
  transferList?: Transferable[];
}

/**
 * Worker message types
 */
export type WorkerMessageType = 
  | 'INIT'
  | 'PROCESS_TEXT'
  | 'DETECT_FORMAT'
  | 'ANALYZE_CONTENT'
  | 'CANCEL_PROCESSING'
  | 'GET_STATUS'
  | 'UPDATE_CONFIG'
  | 'TERMINATE'
  | 'PROGRESS_UPDATE'
  | 'PROCESSING_COMPLETE'
  | 'PROCESSING_ERROR'
  | 'WORKER_READY'
  | 'WORKER_BUSY'
  | 'WORKER_ERROR';

/**
 * Worker response wrapper
 */
export interface WorkerResponse<T = unknown> extends WorkerMessage<T> {
  /** Whether response indicates success */
  success: boolean;
  
  /** Error information if request failed */
  error?: WorkerError;
  
  /** Response to original message ID */
  originalMessageId: string;
}

/**
 * Worker error information
 */
export interface WorkerError {
  /** Error message */
  message: string;
  
  /** Error code */
  code: string;
  
  /** Error stack trace */
  stack?: string;
  
  /** Error context data */
  context?: Record<string, unknown>;
}

// ============================================================================
// Processing Task Types
// ============================================================================

/**
 * Text processing task for workers
 */
export interface ProcessingTask {
  /** Unique task identifier */
  taskId: string;
  
  /** Task type */
  type: ProcessingTaskType;
  
  /** Input data */
  input: TextInput;
  
  /** Processing options */
  options: ProcessingOptions;
  
  /** Task priority */
  priority: TaskPriority;
  
  /** Task creation timestamp */
  createdAt: number;
  
  /** Task timeout in milliseconds */
  timeout?: number;
}

/**
 * Types of processing tasks
 */
export type ProcessingTaskType = 
  | 'format-detection'
  | 'text-formatting'
  | 'content-analysis'
  | 'pattern-extraction'
  | 'data-extraction'
  | 'format-conversion';

/**
 * Task priority levels
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Processing options for tasks
 */
export interface ProcessingOptions {
  /** Target format (if known) */
  targetFormat?: FormatType;
  
  /** Enable/disable specific processing features */
  features: {
    patternRecognition: boolean;
    dataExtraction: boolean;
    contentAnalysis: boolean;
    duplicateRemoval: boolean;
    sorting: boolean;
  };
  
  /** Performance settings */
  performance: {
    maxProcessingTime: number;
    enableCaching: boolean;
    useStreaming: boolean;
  };
  
  /** Output preferences */
  output: {
    includeMetadata: boolean;
    includeStats: boolean;
    includeConfidence: boolean;
  };
}

/**
 * Task execution result
 */
export interface TaskResult {
  /** Task identifier */
  taskId: string;
  
  /** Execution status */
  status: TaskStatus;
  
  /** Processing result */
  result?: FormattedOutput;
  
  /** Execution error */
  error?: WorkerError;
  
  /** Execution metrics */
  metrics: TaskMetrics;
  
  /** Result timestamp */
  completedAt: number;
}

/**
 * Task execution status
 */
export type TaskStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

/**
 * Task execution metrics
 */
export interface TaskMetrics {
  /** Execution duration in milliseconds */
  duration: number;
  
  /** Memory usage in bytes */
  memoryUsage?: number;
  
  /** Processing statistics */
  stats: ProcessingStats;
  
  /** Worker ID that processed the task */
  workerId: string;
  
  /** Number of retry attempts */
  retryCount: number;
}

// ============================================================================
// Worker Pool Management Types
// ============================================================================

/**
 * Worker pool configuration
 */
export interface WorkerPoolConfig {
  /** Minimum number of workers */
  minWorkers: number;
  
  /** Maximum number of workers */
  maxWorkers: number;
  
  /** Worker idle timeout in milliseconds */
  idleTimeout: number;
  
  /** Task queue size limit */
  maxQueueSize: number;
  
  /** Worker script URL */
  workerScript: string;
  
  /** Worker initialization data */
  initData?: Record<string, unknown>;
  
  /** Load balancing strategy */
  loadBalancing: LoadBalancingStrategy;
}

/**
 * Load balancing strategies
 */
export type LoadBalancingStrategy = 
  | 'round-robin'
  | 'least-busy'
  | 'random'
  | 'priority-based';

/**
 * Worker instance information
 */
export interface WorkerInfo {
  /** Unique worker identifier */
  id: string;
  
  /** Worker instance */
  worker: Worker;
  
  /** Worker status */
  status: WorkerStatus;
  
  /** Current task ID (if processing) */
  currentTaskId?: string;
  
  /** Worker creation timestamp */
  createdAt: number;
  
  /** Last activity timestamp */
  lastActivity: number;
  
  /** Number of tasks processed */
  tasksProcessed: number;
  
  /** Worker performance metrics */
  metrics: WorkerMetrics;
}

/**
 * Worker status states
 */
export type WorkerStatus = 
  | 'initializing'
  | 'idle'
  | 'busy'
  | 'error'
  | 'terminating'
  | 'terminated';

/**
 * Worker performance metrics
 */
export interface WorkerMetrics {
  /** Average task processing time */
  averageProcessingTime: number;
  
  /** Total processing time */
  totalProcessingTime: number;
  
  /** Success rate (0-1) */
  successRate: number;
  
  /** Error count */
  errorCount: number;
  
  /** Last error timestamp */
  lastError?: number;
}

/**
 * Worker pool statistics
 */
export interface PoolStats {
  /** Total workers in pool */
  totalWorkers: number;
  
  /** Active workers count */
  activeWorkers: number;
  
  /** Idle workers count */
  idleWorkers: number;
  
  /** Current queue size */
  queueSize: number;
  
  /** Total tasks processed */
  totalTasksProcessed: number;
  
  /** Average queue wait time */
  averageQueueTime: number;
  
  /** Pool utilization percentage */
  utilization: number;
}

// ============================================================================
// Processing Pipeline Types
// ============================================================================

/**
 * Processing pipeline stage
 */
export interface ProcessingStage {
  /** Stage identifier */
  id: string;
  
  /** Stage name */
  name: string;
  
  /** Stage processor function */
  processor: StageProcessor;
  
  /** Stage dependencies */
  dependencies: string[];
  
  /** Stage configuration */
  config: StageConfig;
  
  /** Whether stage is optional */
  optional: boolean;
}

/**
 * Stage processor function type
 */
export type StageProcessor = (
  input: ProcessingStageInput,
  config: StageConfig
) => Promise<ProcessingStageOutput>;

/**
 * Processing stage input
 */
export interface ProcessingStageInput {
  /** Input text data */
  text: string;
  
  /** Previous stage results */
  previousResults: Record<string, unknown>;
  
  /** Task context */
  context: ProcessingContext;
  
  /** Cancellation token */
  cancellationToken: CancellationToken;
}

/**
 * Processing stage output
 */
export interface ProcessingStageOutput {
  /** Processed text */
  text?: string;
  
  /** Extracted data */
  data?: Record<string, unknown>;
  
  /** Stage metadata */
  metadata: StageMetadata;
  
  /** Processing success status */
  success: boolean;
  
  /** Stage errors */
  errors?: string[];
}

/**
 * Stage configuration
 */
export interface StageConfig {
  /** Stage-specific settings */
  settings: Record<string, unknown>;
  
  /** Performance limits */
  limits: {
    maxProcessingTime: number;
    maxMemoryUsage: number;
  };
  
  /** Error handling options */
  errorHandling: {
    retryCount: number;
    continueOnError: boolean;
  };
}

/**
 * Stage metadata
 */
export interface StageMetadata {
  /** Stage execution duration */
  duration: number;
  
  /** Memory usage */
  memoryUsage?: number;
  
  /** Processing confidence */
  confidence?: number;
  
  /** Stage-specific metrics */
  metrics?: Record<string, number>;
}

/**
 * Processing context for pipeline execution
 */
export interface ProcessingContext {
  /** Original task information */
  task: ProcessingTask;
  
  /** Worker information */
  worker: {
    id: string;
    capabilities: string[];
  };
  
  /** Processing session ID */
  sessionId: string;
  
  /** Context variables */
  variables: Record<string, unknown>;
}

/**
 * Cancellation token for aborting processing
 */
export interface CancellationToken {
  /** Whether cancellation was requested */
  isCancelled: boolean;
  
  /** Cancellation reason */
  reason?: string;
  
  /** Cancellation timestamp */
  cancelledAt?: number;
  
  /** Throw if cancelled */
  throwIfCancelled: () => void;
}

// ============================================================================
// Format-Specific Worker Types
// ============================================================================

/**
 * Meeting Notes processor configuration
 */
export interface MeetingNotesWorkerConfig {
  /** Attendee extraction settings */
  attendeeExtraction: {
    enabled: boolean;
    patterns: string[];
    minConfidence: number;
  };
  
  /** Action item detection settings */
  actionItems: {
    keywords: string[];
    assigneePatterns: string[];
    dueDatePatterns: string[];
  };
  
  /** Meeting metadata extraction */
  metadata: {
    extractTitle: boolean;
    extractDate: boolean;
    extractLocation: boolean;
  };
}

/**
 * Task Lists processor configuration
 */
export interface TaskListsWorkerConfig {
  /** Task priority detection */
  priorityDetection: {
    keywords: Record<string, string[]>;
    defaultPriority: string;
  };
  
  /** Category classification */
  categoryClassification: {
    enabled: boolean;
    categories: string[];
    autoClassify: boolean;
  };
  
  /** Due date extraction */
  dueDateExtraction: {
    patterns: string[];
    relativeDateParsing: boolean;
  };
}

/**
 * Format-specific worker factory
 */
export interface FormatWorkerFactory {
  /** Create worker for specific format */
  createWorker: (format: FormatType, config: unknown) => Worker;
  
  /** Get worker configuration schema */
  getConfigSchema: (format: FormatType) => Record<string, unknown>;
  
  /** Validate worker configuration */
  validateConfig: (format: FormatType, config: unknown) => boolean;
}

// ============================================================================
// Worker Communication Protocols
// ============================================================================

/**
 * Initialization message payload
 */
export interface InitMessage {
  /** Worker configuration */
  config: Record<string, unknown>;
  
  /** Available processing formats */
  formats: FormatType[];
  
  /** Performance settings */
  performance: {
    enableOptimizations: boolean;
    cacheSize: number;
    memoryLimit: number;
  };
}

/**
 * Progress update message payload
 */
export interface ProgressUpdateMessage {
  /** Task identifier */
  taskId: string;
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Current processing step */
  currentStep: string;
  
  /** Estimated completion time */
  eta?: number;
  
  /** Intermediate results */
  intermediateResults?: Record<string, unknown>;
}

/**
 * Status request message payload
 */
export interface StatusRequestMessage {
  /** Request all worker metrics */
  includeMetrics: boolean;
  
  /** Request current queue status */
  includeQueue: boolean;
  
  /** Request performance data */
  includePerformance: boolean;
}

/**
 * Status response message payload
 */
export interface StatusResponseMessage {
  /** Worker status */
  status: WorkerStatus;
  
  /** Current task information */
  currentTask?: {
    id: string;
    type: ProcessingTaskType;
    progress: number;
  };
  
  /** Worker metrics */
  metrics?: WorkerMetrics;
  
  /** Queue information */
  queue?: {
    size: number;
    pending: number;
    processing: number;
  };
}

/**
 * Worker termination message
 */
export interface TerminationMessage {
  /** Termination reason */
  reason: 'shutdown' | 'error' | 'timeout' | 'manual';
  
  /** Whether to complete current tasks */
  graceful: boolean;
  
  /** Termination timeout */
  timeout?: number;
}
