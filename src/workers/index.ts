/**
 * Workers Index - Central export point for all Web Workers
 * 
 * Manages worker instantiation and communication for text processing
 */

export { BaseWorker } from './base/BaseWorker';
export { WorkerPool } from './pool/WorkerPool';
export { AdvancedWorkerPool } from './pool/AdvancedWorkerPool';
export { EnhancedWorkerManager } from './utils/EnhancedWorkerManager';

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

// Worker URLs for dynamic loading
export const WORKER_URLS = {
  meetingNotes: '/workers/formatters/meetingNotes.worker.js',
  taskLists: '/workers/formatters/taskLists.worker.js',
  shoppingLists: '/workers/formatters/shoppingLists.worker.js',
  journalNotes: '/workers/formatters/journalNotes.worker.js',
  researchNotes: '/workers/formatters/researchNotes.worker.js',
  studyNotes: '/workers/formatters/studyNotes.worker.js',
  textProcessor: '/workers/processors/TextProcessor.worker.js',
} as const;

// Worker types
export type WorkerType = keyof typeof WORKER_URLS;

// React hooks
export { 
  useWorkerPool,
  type UseWorkerPoolResult,
  type ProcessingOptions as WorkerProcessingOptions
} from '@/hooks/workers/useWorkerPool';

// Enhanced worker manager hook - will be available after proper setup
// export {
//   useEnhancedWorkerManager,
//   type UseEnhancedWorkerManagerResult
// } from '@/hooks/workers/useEnhancedWorkerManager';

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
