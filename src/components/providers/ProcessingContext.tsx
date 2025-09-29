'use client';

/**
 * ProcessingContext - Web Worker pool and text processing state management
 * 
 * Manages Web Worker lifecycle, task queuing, and concurrent text processing
 * Integrates with React 18 concurrent features for optimal performance
 */

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useCallback, 
  useMemo, 
  useEffect,
  useRef,
  type ReactNode 
} from 'react';

// Import types
import type { 
  ProcessingState,
  FormatType,
  ErrorState 
} from '@/types/index';
import type {
  WorkerMessage,
  WorkerResponse,
  ProcessingTask,
  ProcessingTaskType,
  TaskPriority,
  ProcessingOptions,
  WorkerPoolConfig
} from '@/types/workers';
import type {
  TextInput,
  FormattedOutput
} from '@/types/formatting';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ProcessingContextState {
  /** Worker pool configuration */
  config: WorkerPoolConfig & {
    taskTimeout?: number;
    retryAttempts?: number;
    enableTransferableObjects?: boolean;
    workerIdleTimeout?: number;
  };
  
  /** Active workers */
  workers: {
    [workerId: string]: {
      worker: Worker;
      status: 'idle' | 'busy' | 'error' | 'terminating';
      currentTask: ProcessingTask | null;
      startedAt: Date | null;
      totalProcessed: number;
      errors: ErrorState[];
    };
  };
  
  /** Task queue */
  taskQueue: ProcessingTask[];
  
  /** Completed tasks */
  completedTasks: ProcessingTask[];
  
  /** Failed tasks */
  failedTasks: ProcessingTask[];
  
  /** Processing statistics */
  stats: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
    totalProcessingTime: number;
    activeWorkers: number;
    queuedTasks: number;
  };
  
  /** Worker pool status */
  poolStatus: 'initializing' | 'ready' | 'busy' | 'error' | 'shutting-down';
  
  /** Global error state */
  error: ErrorState | null;
}

type ProcessingAction =
  | { type: 'INITIALIZE_POOL'; payload: WorkerPoolConfig }
  | { type: 'ADD_WORKER'; payload: { workerId: string; worker: Worker } }
  | { type: 'REMOVE_WORKER'; payload: string }
  | { type: 'UPDATE_WORKER_STATUS'; payload: { workerId: string; status: ProcessingContextState['workers'][string]['status'] } }
  | { type: 'ASSIGN_TASK'; payload: { workerId: string; task: ProcessingTask } }
  | { type: 'COMPLETE_TASK'; payload: { workerId: string; task: ProcessingTask } }
  | { type: 'FAIL_TASK'; payload: { workerId: string; task: ProcessingTask; error: ErrorState } }
  | { type: 'ADD_TASK_TO_QUEUE'; payload: ProcessingTask }
  | { type: 'REMOVE_TASK_FROM_QUEUE'; payload: string }
  | { type: 'UPDATE_STATS' }
  | { type: 'SET_POOL_STATUS'; payload: ProcessingContextState['poolStatus'] }
  | { type: 'SET_ERROR'; payload: ErrorState | null }
  | { type: 'CLEAR_COMPLETED_TASKS' }
  | { type: 'CLEAR_FAILED_TASKS' };

interface ProcessingContextType {
  /** Current processing state */
  state: ProcessingContextState;
  
  /** Processing actions */
  actions: {
    initializePool: (config?: any) => Promise<void>;
    shutdownPool: () => Promise<void>;
    processText: (text: string, formatType: FormatType, options?: any) => Promise<any>;
    cancelTask: (taskId: string) => void;
    retryFailedTask: (taskId: string) => void;
    clearCompletedTasks: () => void;
    clearFailedTasks: () => void;
    getWorkerStats: () => ProcessingContextState['stats'];
  };
  
  /** Computed values */
  computed: {
    isReady: boolean;
    hasAvailableWorker: boolean;
    queueLength: number;
    averageTaskTime: number;
    successRate: number;
    workerUtilization: number;
  };
}

// ============================================================================
// Initial State and Configuration
// ============================================================================

const defaultConfig = {
  maxWorkers: Math.min(typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4, 8),
  minWorkers: 1,
  maxQueueSize: 100,
  idleTimeout: 300000, // 5 minutes
  workerScript: '/workers/textProcessor.worker.js',
  loadBalancing: 'round-robin' as const,
  taskTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  enableTransferableObjects: true,
};

const initialState: ProcessingContextState = {
  config: defaultConfig,
  workers: {},
  taskQueue: [],
  completedTasks: [],
  failedTasks: [],
  stats: {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0,
    activeWorkers: 0,
    queuedTasks: 0,
  },
  poolStatus: 'initializing',
  error: null,
};

// ============================================================================
// Reducer
// ============================================================================

function processingReducer(state: ProcessingContextState, action: ProcessingAction): ProcessingContextState {
  switch (action.type) {
    case 'INITIALIZE_POOL':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
        poolStatus: 'initializing',
      };
      
    case 'ADD_WORKER':
      return {
        ...state,
        workers: {
          ...state.workers,
          [action.payload.workerId]: {
            worker: action.payload.worker,
            status: 'idle',
            currentTask: null,
            startedAt: null,
            totalProcessed: 0,
            errors: [],
          },
        },
      };
      
    case 'REMOVE_WORKER':
      const { [action.payload]: removed, ...remainingWorkers } = state.workers;
      return {
        ...state,
        workers: remainingWorkers,
      };
      
    case 'UPDATE_WORKER_STATUS':
      return {
        ...state,
        workers: {
          ...state.workers,
          [action.payload.workerId]: {
            ...state.workers[action.payload.workerId],
            status: action.payload.status,
          },
        },
      };
      
    case 'ASSIGN_TASK':
      return {
        ...state,
        workers: {
          ...state.workers,
          [action.payload.workerId]: {
            ...state.workers[action.payload.workerId],
            status: 'busy',
            currentTask: action.payload.task,
            startedAt: new Date(),
          },
        },
        taskQueue: state.taskQueue.filter(task => task.taskId !== action.payload.task.taskId),
      };
      
    case 'COMPLETE_TASK':
      return {
        ...state,
        workers: {
          ...state.workers,
          [action.payload.workerId]: {
            ...state.workers[action.payload.workerId],
            status: 'idle',
            currentTask: null,
            startedAt: null,
            totalProcessed: state.workers[action.payload.workerId].totalProcessed + 1,
          },
        },
        completedTasks: [...state.completedTasks, action.payload.task],
      };
      
    case 'FAIL_TASK':
      return {
        ...state,
        workers: {
          ...state.workers,
          [action.payload.workerId]: {
            ...state.workers[action.payload.workerId],
            status: 'idle',
            currentTask: null,
            startedAt: null,
            errors: [...state.workers[action.payload.workerId].errors, action.payload.error],
          },
        },
        failedTasks: [...state.failedTasks, action.payload.task],
      };
      
    case 'ADD_TASK_TO_QUEUE':
      return {
        ...state,
        taskQueue: [...state.taskQueue, action.payload],
      };
      
    case 'REMOVE_TASK_FROM_QUEUE':
      return {
        ...state,
        taskQueue: state.taskQueue.filter(task => task.taskId !== action.payload),
      };
      
    case 'SET_POOL_STATUS':
      return {
        ...state,
        poolStatus: action.payload,
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
      
    case 'CLEAR_COMPLETED_TASKS':
      return {
        ...state,
        completedTasks: [],
      };
      
    case 'CLEAR_FAILED_TASKS':
      return {
        ...state,
        failedTasks: [],
      };
      
    case 'UPDATE_STATS':
      const activeWorkers = Object.values(state.workers).filter(w => w.status === 'busy').length;
      const totalCompleted = state.completedTasks.length;
      const totalFailed = state.failedTasks.length;
      const totalProcessingTime = 0; // We'll calculate this differently
      
      return {
        ...state,
        stats: {
          totalTasks: totalCompleted + totalFailed + state.taskQueue.length + activeWorkers,
          completedTasks: totalCompleted,
          failedTasks: totalFailed,
          averageProcessingTime: totalCompleted > 0 ? totalProcessingTime / totalCompleted : 0,
          totalProcessingTime,
          activeWorkers,
          queuedTasks: state.taskQueue.length,
        },
      };
      
    default:
      return state;
  }
}

// ============================================================================
// Context Creation
// ============================================================================

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface ProcessingProviderProps {
  children: ReactNode;
  config?: Partial<WorkerPoolConfig>;
  autoInitialize?: boolean;
}

export function ProcessingProvider({ 
  children, 
  config = {},
  autoInitialize = true 
}: ProcessingProviderProps) {
  const [state, dispatch] = useReducer(processingReducer, {
    ...initialState,
    config: { ...defaultConfig, ...config },
  });
  
  const taskCounter = useRef(0);
  const taskPromises = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());
  
  // Auto-initialize worker pool
  useEffect(() => {
    if (autoInitialize && state.poolStatus === 'initializing') {
      initializePool();
    }
    
    // Cleanup on unmount
    return () => {
      if (state.poolStatus !== 'shutting-down') {
        shutdownPool();
      }
    };
  }, [autoInitialize]);
  
  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'UPDATE_STATS' });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Process task queue
  useEffect(() => {
    processQueue();
  }, [state.taskQueue, state.workers]);
  
  // Actions
  const initializePool = useCallback(async (poolConfig?: any) => {
    try {
      dispatch({ type: 'SET_POOL_STATUS', payload: 'initializing' });
      
      if (poolConfig) {
        dispatch({ type: 'INITIALIZE_POOL', payload: poolConfig });
      }
      
      const config = { ...defaultConfig, ...poolConfig };
      
      // Create initial workers
      for (let i = 0; i < config.minWorkers; i++) {
        await createWorker();
      }
      
      dispatch({ type: 'SET_POOL_STATUS', payload: 'ready' });
    } catch (error) {
      const errorState: ErrorState = {
        type: 'worker',
        message: 'Failed to initialize worker pool',
        code: 'POOL_INIT_FAILED',
        context: { error },
        timestamp: new Date(),
        recoverable: true,
      };
      
      dispatch({ type: 'SET_ERROR', payload: errorState });
      dispatch({ type: 'SET_POOL_STATUS', payload: 'error' });
    }
  }, [state.config]);
  
  const shutdownPool = useCallback(async () => {
    dispatch({ type: 'SET_POOL_STATUS', payload: 'shutting-down' });
    
    // Terminate all workers
    Object.entries(state.workers).forEach(([workerId, workerInfo]) => {
      workerInfo.worker.terminate();
      dispatch({ type: 'REMOVE_WORKER', payload: workerId });
    });
    
    // Reject pending promises
    taskPromises.current.forEach(({ reject }) => {
      reject(new Error('Worker pool shutting down'));
    });
    taskPromises.current.clear();
  }, [state.workers]);
  
  const createWorker = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create worker (URL will be updated when worker files are implemented)
        const worker = new Worker('/workers/textProcessor.worker.js');
        const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          handleWorkerMessage(workerId, event.data);
        };
        
        worker.onerror = (error) => {
          handleWorkerError(workerId, error);
        };
        
        dispatch({ type: 'ADD_WORKER', payload: { workerId, worker } });
        resolve(workerId);
      } catch (error) {
        reject(error);
      }
    });
  }, []);
  
  const processText = useCallback(async (
    text: string, 
    formatType: FormatType, 
    options: any = {}
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const taskId = `task-${++taskCounter.current}`;
      
      const task: ProcessingTask = {
        taskId: taskId,
        type: 'text-formatting' as ProcessingTaskType,
        input: {
          content: text,
          metadata: {
            source: 'type',
            timestamp: new Date(),
            size: text.length,
          },
        } as TextInput,
        options: {
          targetFormat: formatType,
          features: {
            patternRecognition: true,
            dataExtraction: true,
            contentAnalysis: true,
            duplicateRemoval: false,
            sorting: false,
          },
          performance: {
            maxProcessingTime: 30000,
            enableCaching: true,
            useStreaming: false,
          },
          output: {
            includeMetadata: true,
            includeStats: true,
            includeConfidence: true,
          },
          ...options,
        } as ProcessingOptions,
        priority: (options.priority || 'normal') as TaskPriority,
        createdAt: Date.now(),
        timeout: state.config.taskTimeout,
      };
      
      taskPromises.current.set(taskId, { resolve, reject });
      dispatch({ type: 'ADD_TASK_TO_QUEUE', payload: task });
    });
  }, [state.config]);
  
  const processQueue = useCallback(() => {
    if (state.taskQueue.length === 0) return;
    
    // Find available workers
    const availableWorkers = Object.entries(state.workers)
      .filter(([_, worker]) => worker.status === 'idle')
      .map(([workerId]) => workerId);
      
    if (availableWorkers.length === 0) return;
    
    // Assign tasks to available workers
    const tasksToAssign = Math.min(availableWorkers.length, state.taskQueue.length);
    
    for (let i = 0; i < tasksToAssign; i++) {
      const workerId = availableWorkers[i];
      const task = state.taskQueue[0];
      
      dispatch({ type: 'ASSIGN_TASK', payload: { workerId, task } });
      
      // Send task to worker
      const worker = state.workers[workerId].worker;
      const message: WorkerMessage = {
        id: task.taskId,
        type: 'PROCESS_TEXT',
        payload: {
          text: task.input.content,
          formatType: task.options.targetFormat,
          options: task.options,
        },
        timestamp: Date.now(),
      };
      
      worker.postMessage(message);
      
      // Set task timeout
      setTimeout(() => {
        if (state.workers[workerId]?.currentTask?.taskId === task.taskId) {
          handleTaskTimeout(workerId, task.taskId);
        }
      }, task.timeout);
    }
  }, [state.taskQueue, state.workers]);
  
  const handleWorkerMessage = useCallback((workerId: string, response: WorkerResponse) => {
    const worker = state.workers[workerId];
    if (!worker || !worker.currentTask) return;
    
    const task = worker.currentTask;
    if (!task) return;
    
    if (response.success) {
      dispatch({ type: 'COMPLETE_TASK', payload: { workerId, task } });
      
      const promise = taskPromises.current.get(task.taskId);
      if (promise) {
        promise.resolve((response as any).payload || response);
        taskPromises.current.delete(task.taskId);
      }
    } else {
      const error: ErrorState = {
        type: 'processing',
        message: typeof response.error === 'string' ? response.error : (response.error?.message || 'Processing failed'),
        code: 'PROCESSING_ERROR',
        context: { taskId: task.taskId, workerId },
        timestamp: new Date(),
        recoverable: true,
      };
      
      dispatch({ type: 'FAIL_TASK', payload: { workerId, task, error } });
      
      const promise = taskPromises.current.get(task.taskId);
      if (promise) {
        const errorMessage = typeof response.error === 'string' ? response.error : (response.error?.message || 'Processing failed');
        promise.reject(new Error(errorMessage));
        taskPromises.current.delete(task.taskId);
      }
    }
  }, [state.workers, dispatch]);
  
  const handleWorkerError = useCallback((workerId: string, error: ErrorEvent) => {
    dispatch({ type: 'UPDATE_WORKER_STATUS', payload: { workerId, status: 'error' } });
    
    const errorState: ErrorState = {
      type: 'worker',
      message: `Worker ${workerId} encountered an error: ${error.message}`,
      code: 'WORKER_ERROR',
      context: { workerId, error: error.message },
      timestamp: new Date(),
      recoverable: true,
    };
    
    dispatch({ type: 'SET_ERROR', payload: errorState });
  }, []);
  
  const handleTaskTimeout = useCallback((workerId: string, taskId: string) => {
    const worker = state.workers[workerId];
    if (!worker || worker.currentTask?.taskId !== taskId) return;
    
    const error: ErrorState = {
      type: 'processing',
      message: 'Task timed out',
      code: 'TASK_TIMEOUT',
      context: { taskId, workerId, timeout: state.config.taskTimeout },
      timestamp: new Date(),
      recoverable: true,
    };
    
    dispatch({ type: 'FAIL_TASK', payload: { workerId, task: worker.currentTask, error } });
    
    const promise = taskPromises.current.get(taskId);
    if (promise) {
      promise.reject(new Error('Task timed out'));
      taskPromises.current.delete(taskId);
    }
  }, [state.workers, state.config.taskTimeout]);
  
  // Additional actions
  const actions = useMemo(() => ({
    initializePool,
    shutdownPool,
    processText,
    
    cancelTask: (taskId: string) => {
      dispatch({ type: 'REMOVE_TASK_FROM_QUEUE', payload: taskId });
      
      const promise = taskPromises.current.get(taskId);
      if (promise) {
        promise.reject(new Error('Task cancelled'));
        taskPromises.current.delete(taskId);
      }
    },
    
    retryFailedTask: (taskId: string) => {
      const failedTask = state.failedTasks.find(task => task.taskId === taskId);
      if (failedTask) {
        // Create a new task based on the failed one
        const retryTask: ProcessingTask = {
          ...failedTask,
          taskId: `${failedTask.taskId}-retry-${Date.now()}`,
          createdAt: Date.now(),
        };
        
        dispatch({ type: 'ADD_TASK_TO_QUEUE', payload: retryTask });
      }
    },
    
    clearCompletedTasks: () => {
      dispatch({ type: 'CLEAR_COMPLETED_TASKS' });
    },
    
    clearFailedTasks: () => {
      dispatch({ type: 'CLEAR_FAILED_TASKS' });
    },
    
    getWorkerStats: () => state.stats,
  }), [initializePool, shutdownPool, processText, state.failedTasks, state.stats]);
  
  // Computed values
  const computed = useMemo(() => ({
    isReady: state.poolStatus === 'ready',
    hasAvailableWorker: Object.values(state.workers).some(worker => worker.status === 'idle'),
    queueLength: state.taskQueue.length,
    averageTaskTime: state.stats.averageProcessingTime,
    successRate: state.stats.totalTasks > 0 ? 
      (state.stats.completedTasks / state.stats.totalTasks) * 100 : 0,
    workerUtilization: Object.keys(state.workers).length > 0 ? 
      (state.stats.activeWorkers / Object.keys(state.workers).length) * 100 : 0,
  }), [state]);
  
  const contextValue: ProcessingContextType = useMemo(() => ({
    state,
    actions,
    computed,
  }), [state, actions, computed]);
  
  return (
    <ProcessingContext.Provider value={contextValue}>
      {children}
    </ProcessingContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

export function useProcessing() {
  const context = useContext(ProcessingContext);
  
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  
  return context;
}

// ============================================================================
// Enhanced Custom Hooks
// ============================================================================

/**
 * Hook for simple text processing with automatic worker management
 */
export function useTextProcessor() {
  const { actions, computed } = useProcessing();
  
  const processText = useCallback(async (
    text: string, 
    formatType: FormatType, 
    options: any = {}
  ) => {
    if (!computed.isReady) {
      throw new Error('Worker pool not ready');
    }
    
    return actions.processText(text, formatType, options);
  }, [actions.processText, computed.isReady]);
  
  return {
    processText,
    isReady: computed.isReady,
    hasAvailableWorker: computed.hasAvailableWorker,
    queueLength: computed.queueLength,
  };
}

/**
 * Hook for monitoring worker pool performance
 */
export function useWorkerStats() {
  const { state, computed } = useProcessing();
  
  return {
    stats: state.stats,
    poolStatus: state.poolStatus,
    workerCount: Object.keys(state.workers).length,
    averageTaskTime: computed.averageTaskTime,
    successRate: computed.successRate,
    workerUtilization: computed.workerUtilization,
  };
}
