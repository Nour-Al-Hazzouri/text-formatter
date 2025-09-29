/**
 * React Hook for Worker Pool Integration
 * 
 * Provides React 18 concurrent features integration with Web Worker pool,
 * including useTransition, useDeferredValue, and Suspense support.
 */

'use client';

import { 
  useEffect, 
  useRef, 
  useState, 
  useCallback,
  useTransition,
  useDeferredValue,
  useMemo
} from 'react';
import { WorkerPool } from '@/workers/pool/WorkerPool';
import { ErrorRecoveryManager } from '@/workers/utils/ErrorRecovery';
import type { 
  WorkerPoolConfig,
  ProcessingTask,
  TaskResult,
  PoolStats,
  WorkerError
} from '@/types/workers';
import type { FormatType } from '@/types';

/**
 * Worker pool hook configuration
 */
export interface UseWorkerPoolConfig {
  workerScript: string;
  minWorkers?: number;
  maxWorkers?: number;
  idleTimeout?: number;
  maxQueueSize?: number;
  enableErrorRecovery?: boolean;
  enableCaching?: boolean;
}

/**
 * Processing state
 */
export interface ProcessingState {
  isProcessing: boolean;
  isPending: boolean;
  progress: number;
  currentStep: string;
  taskId?: string;
  error?: WorkerError;
}

/**
 * Worker pool hook result
 */
export interface UseWorkerPoolResult {
  // Processing methods
  processText: (text: string, format: FormatType, options?: ProcessingOptions) => Promise<TaskResult>;
  cancelProcessing: (taskId: string) => void;
  
  // State
  processingState: ProcessingState;
  poolStats: PoolStats;
  
  // Pool management
  isReady: boolean;
  isInitializing: boolean;
  error: WorkerError | null;
  
  // Utilities
  clearCache: () => void;
  resetPool: () => Promise<void>;
}

/**
 * Processing options for tasks
 */
export interface ProcessingOptions {
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  timeout?: number;
  enableStreaming?: boolean;
  cacheResults?: boolean;
}

/**
 * Default worker pool configuration
 */
const DEFAULT_CONFIG: WorkerPoolConfig = {
  minWorkers: 2,
  maxWorkers: 6,
  idleTimeout: 30000,
  maxQueueSize: 50,
  workerScript: '/workers/text-processor.worker.js',
  loadBalancing: 'least-busy'
};

/**
 * Hook for managing worker pool with React 18 concurrent features
 */
export function useWorkerPool(config: UseWorkerPoolConfig): UseWorkerPoolResult {
  // Refs for persistent objects
  const workerPoolRef = useRef<WorkerPool | null>(null);
  const errorRecoveryRef = useRef<ErrorRecoveryManager | null>(null);
  const activeTasksRef = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());

  // State management
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<WorkerError | null>(null);
  const [poolStats, setPoolStats] = useState<PoolStats>({
    totalWorkers: 0,
    activeWorkers: 0,
    idleWorkers: 0,
    queueSize: 0,
    totalTasksProcessed: 0,
    averageQueueTime: 0,
    utilization: 0
  });

  // React 18 concurrent features
  const [isPending, startTransition] = useTransition();
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isPending: false,
    progress: 0,
    currentStep: 'idle'
  });

  // Deferred processing state for non-urgent updates
  const deferredProcessingState = useDeferredValue(processingState);

  // Memoized worker pool configuration
  const poolConfig = useMemo((): WorkerPoolConfig => ({
    ...DEFAULT_CONFIG,
    workerScript: config.workerScript,
    minWorkers: config.minWorkers ?? DEFAULT_CONFIG.minWorkers,
    maxWorkers: config.maxWorkers ?? DEFAULT_CONFIG.maxWorkers,
    idleTimeout: config.idleTimeout ?? DEFAULT_CONFIG.idleTimeout,
    maxQueueSize: config.maxQueueSize ?? DEFAULT_CONFIG.maxQueueSize
  }), [config]);

  // Initialize worker pool
  useEffect(() => {
    let mounted = true;

    const initializePool = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Create worker pool
        const pool = new WorkerPool(poolConfig);
        workerPoolRef.current = pool;

        // Create error recovery manager if enabled
        if (config.enableErrorRecovery) {
          errorRecoveryRef.current = new ErrorRecoveryManager({
            maxRetries: 3,
            retryDelayMs: 1000,
            fallbackStrategy: 'client-side',
            enableClientSideFallback: true,
            enableCaching: config.enableCaching ?? true,
            cacheExpiration: 300000, // 5 minutes
            exponentialBackoff: true
          });
        }

        // Set up event listeners
        pool.on('worker-ready', () => {
          if (mounted) {
            setIsReady(true);
            setIsInitializing(false);
          }
        });

        pool.on('worker-error', (workerId: string, workerError: WorkerError) => {
          if (mounted) {
            console.error(`Worker ${workerId} error:`, workerError);
            setError(workerError);
          }
        });

        pool.on('pool-stats', (stats: PoolStats) => {
          if (mounted) {
            setPoolStats(stats);
          }
        });

        pool.on('task-completed', (taskId: string, result: TaskResult) => {
          if (mounted) {
            const taskHandlers = activeTasksRef.current.get(taskId);
            if (taskHandlers) {
              taskHandlers.resolve(result);
              activeTasksRef.current.delete(taskId);
            }

            // Update processing state
            startTransition(() => {
              setProcessingState(prev => ({
                ...prev,
                isProcessing: false,
                progress: 100,
                currentStep: 'completed'
              }));
            });
          }
        });

        pool.on('task-failed', (taskId: string, taskError: WorkerError) => {
          if (mounted) {
            const taskHandlers = activeTasksRef.current.get(taskId);
            if (taskHandlers) {
              taskHandlers.reject(taskError);
              activeTasksRef.current.delete(taskId);
            }

            startTransition(() => {
              setProcessingState(prev => ({
                ...prev,
                isProcessing: false,
                error: taskError
              }));
            });
          }
        });

      } catch (initError) {
        if (mounted) {
          setError({
            message: initError instanceof Error ? initError.message : 'Pool initialization failed',
            code: 'POOL_INIT_ERROR'
          });
          setIsInitializing(false);
        }
      }
    };

    initializePool();

    // Cleanup function
    return () => {
      mounted = false;
      if (workerPoolRef.current) {
        workerPoolRef.current.terminate();
        workerPoolRef.current = null;
      }
      activeTasksRef.current.clear();
    };
  }, [poolConfig, config.enableErrorRecovery, config.enableCaching]);

  // Process text function with concurrent features
  const processText = useCallback(async (
    text: string,
    format: FormatType,
    options: ProcessingOptions = {}
  ): Promise<TaskResult> => {
    if (!workerPoolRef.current || !isReady) {
      throw new Error('Worker pool not ready');
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create processing task
    const task: ProcessingTask = {
      taskId,
      type: 'text-formatting',
      input: {
        content: text,
        metadata: {
          source: 'paste',
          timestamp: new Date(),
          size: text.length
        }
      },
      options: {
        targetFormat: format,
        features: {
          patternRecognition: true,
          dataExtraction: true,
          contentAnalysis: true,
          duplicateRemoval: format === 'shopping-lists',
          sorting: format === 'shopping-lists' || format === 'task-lists'
        },
        performance: {
          maxProcessingTime: options.timeout || 30000,
          enableCaching: options.cacheResults ?? true,
          useStreaming: options.enableStreaming ?? false
        },
        output: {
          includeMetadata: true,
          includeStats: true,
          includeConfidence: true
        }
      },
      priority: options.priority || 'normal',
      createdAt: Date.now(),
      timeout: options.timeout
    };

    // Update processing state immediately for UI responsiveness
    setProcessingState({
      isProcessing: true,
      isPending: true,
      progress: 0,
      currentStep: 'queued',
      taskId
    });

    try {
      // Use startTransition for non-urgent state updates
      startTransition(() => {
        setProcessingState(prev => ({
          ...prev,
          currentStep: 'processing'
        }));
      });

      // Submit task to worker pool
      const result = await new Promise<TaskResult>((resolve, reject) => {
        activeTasksRef.current.set(taskId, { resolve, reject });
        
        workerPoolRef.current!.submitTask(task).catch(async (submitError) => {
          // Try error recovery if enabled
          if (errorRecoveryRef.current) {
            try {
              const recovery = await errorRecoveryRef.current.recover(submitError, task);
              
              if (recovery.action === 'retry') {
                // Retry the task
                return workerPoolRef.current!.submitTask(task);
              } else if (recovery.action === 'fallback' && recovery.result) {
                resolve(recovery.result);
                return;
              }
            } catch (recoveryError) {
              // Recovery also failed
              reject(recoveryError);
              return;
            }
          }
          
          reject(submitError);
        });
      });

      // Final state update
      startTransition(() => {
        setProcessingState({
          isProcessing: false,
          isPending: false,
          progress: 100,
          currentStep: 'completed',
          taskId: undefined
        });
      });

      return result;

    } catch (processError) {
      // Error state update
      startTransition(() => {
        setProcessingState({
          isProcessing: false,
          isPending: false,
          progress: 0,
          currentStep: 'error',
          error: processError as WorkerError,
          taskId: undefined
        });
      });

      throw processError;
    }
  }, [isReady]);

  // Cancel processing function
  const cancelProcessing = useCallback((taskId: string) => {
    if (!workerPoolRef.current) {
      return;
    }

    // Remove from active tasks
    const taskHandlers = activeTasksRef.current.get(taskId);
    if (taskHandlers) {
      taskHandlers.reject({
        message: 'Processing cancelled by user',
        code: 'USER_CANCELLED'
      });
      activeTasksRef.current.delete(taskId);
    }

    // Update state
    startTransition(() => {
      setProcessingState(prev => ({
        ...prev,
        isProcessing: false,
        isPending: false,
        currentStep: 'cancelled'
      }));
    });
  }, []);

  // Clear cache function
  const clearCache = useCallback(() => {
    if (errorRecoveryRef.current) {
      errorRecoveryRef.current.reset();
    }
  }, []);

  // Reset pool function
  const resetPool = useCallback(async () => {
    if (workerPoolRef.current) {
      await workerPoolRef.current.terminate();
      workerPoolRef.current = null;
    }
    
    activeTasksRef.current.clear();
    setIsReady(false);
    setIsInitializing(true);
    setError(null);
    
    // Re-initialization will be handled by the effect
  }, []);

  return {
    // Processing methods
    processText,
    cancelProcessing,
    
    // State (using deferred value for non-critical updates)
    processingState: {
      ...deferredProcessingState,
      isPending // Keep isPending immediate for better UX
    },
    poolStats,
    
    // Pool management
    isReady,
    isInitializing,
    error,
    
    // Utilities
    clearCache,
    resetPool
  };
}
