/**
 * Web Workers Module - Main Export File
 * 
 * Exports all worker-related functionality including base classes,
 * communication utilities, pool management, and React hooks.
 */

// Base worker classes
export { BaseWorker } from './base/BaseWorker';

// Communication utilities
export { 
  MessageSerializer, 
  WorkerCommunicator, 
  BatchMessageProcessor,
  WorkerErrorRecovery 
} from './utils/WorkerCommunication';

// Error recovery
export { 
  ErrorRecoveryManager,
  type FallbackStrategy,
  type RecoveryAction,
  type ErrorRecoveryConfig
} from './utils/ErrorRecovery';

// Worker pool management
export { 
  WorkerPool,
  type WorkerPoolEvents 
} from './pool/WorkerPool';

// React hooks
export { 
  useWorkerPool,
  type UseWorkerPoolConfig,
  type UseWorkerPoolResult,
  type ProcessingOptions as WorkerProcessingOptions
} from '@/hooks/workers/useWorkerPool';

export { 
  useTextProcessor,
  useFormatProcessor,
  useStreamingProcessor,
  type TextProcessingOptions,
  type ProcessingResult,
  type UseTextProcessorResult
} from '@/hooks/workers/useTextProcessor';

// Re-export types for convenience
export type {
  WorkerMessage,
  WorkerResponse,
  WorkerError,
  ProcessingTask,
  TaskResult,
  WorkerPoolConfig,
  WorkerInfo,
  PoolStats,
  WorkerStatus
} from '@/types/workers';
