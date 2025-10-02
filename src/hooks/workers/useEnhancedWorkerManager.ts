/**
 * Enhanced Worker Manager Hook
 * 
 * React hook for managing advanced worker pools with:
 * - Automatic lifecycle management
 * - Performance monitoring
 * - Error recovery and circuit breaking
 * - Load balancing across format types
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  EnhancedWorkerManager,
  WorkerManagerConfig 
} from '@/workers/utils/EnhancedWorkerManager';
import type { 
  ProcessingTask, 
  TaskResult, 
  WorkerError 
} from '@/types/workers';
import type { FormatType } from '@/types';

/**
 * Hook configuration options
 */
export interface UseEnhancedWorkerManagerOptions {
  /** Whether to auto-initialize the manager */
  autoInit?: boolean;
  
  /** Configuration for the worker manager */
  config: WorkerManagerConfig;
  
  /** Event callbacks */
  onTaskCompleted?: (result: { format: FormatType; taskId: string; result: TaskResult }) => void;
  onTaskFailed?: (error: { format: FormatType; taskId: string; error: WorkerError }) => void;
  onSystemHealthChange?: (health: number) => void;
}

/**
 * Hook return type
 */
export interface UseEnhancedWorkerManagerResult {
  /** Process a task with the enhanced manager */
  processTask: (
    format: FormatType, 
    task: ProcessingTask,
    options?: { allowSpillover?: boolean }
  ) => Promise<TaskResult>;
  
  /** Get current system status */
  getSystemStatus: () => any;
  
  /** Get statistics for specific pool */
  getPoolStats: (format: FormatType) => any;
  
  /** Whether the manager is ready */
  isReady: boolean;
  
  /** Current system health score */
  systemHealth: number;
  
  /** Manager instance (for advanced usage) */
  manager: EnhancedWorkerManager | null;
  
  /** Error state */
  error: WorkerError | null;
  
  /** Shutdown the manager */
  shutdown: () => Promise<void>;
}

/**
 * Enhanced Worker Manager Hook
 */
export function useEnhancedWorkerManager(
  options: UseEnhancedWorkerManagerOptions
): UseEnhancedWorkerManagerResult {
  const managerRef = useRef<EnhancedWorkerManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [systemHealth, setSystemHealth] = useState(0);
  const [error, setError] = useState<WorkerError | null>(null);

  // Initialize manager
  useEffect(() => {
    if (!options.autoInit) return;

    const initManager = async () => {
      try {
        const manager = new EnhancedWorkerManager(options.config);
        
        // Setup event listeners
        if (options.onTaskCompleted) {
          manager.on('task-completed', options.onTaskCompleted);
        }
        
        if (options.onTaskFailed) {
          manager.on('task-failed', options.onTaskFailed);
        }
        
        if (options.onSystemHealthChange) {
          manager.on('global-report', (report) => {
            const health = report.systemHealth;
            setSystemHealth(health);
            options.onSystemHealthChange!(health);
          });
        }
        
        manager.on('manager-shutdown', () => {
          setIsReady(false);
        });

        managerRef.current = manager;
        setIsReady(true);
        setError(null);
        
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Manager initialization failed',
          code: 'MANAGER_INIT_ERROR'
        });
      }
    };

    initManager();

    return () => {
      if (managerRef.current) {
        managerRef.current.shutdown().catch(console.error);
        managerRef.current = null;
        setIsReady(false);
      }
    };
  }, [options.autoInit, options.config]);

  // Process task
  const processTask = useCallback(async (
    format: FormatType,
    task: ProcessingTask,
    taskOptions: { allowSpillover?: boolean } = {}
  ): Promise<TaskResult> => {
    if (!managerRef.current) {
      throw new Error('Manager not initialized');
    }

    return managerRef.current.processTask(format, task, taskOptions);
  }, []);

  // Get system status
  const getSystemStatus = useCallback(() => {
    return managerRef.current?.getSystemStatus() || null;
  }, []);

  // Get pool stats
  const getPoolStats = useCallback((format: FormatType) => {
    return managerRef.current?.getPoolStats(format) || null;
  }, []);

  // Shutdown
  const shutdown = useCallback(async () => {
    if (managerRef.current) {
      await managerRef.current.shutdown();
      managerRef.current = null;
      setIsReady(false);
    }
  }, []);

  return {
    processTask,
    getSystemStatus,
    getPoolStats,
    isReady,
    systemHealth,
    manager: managerRef.current,
    error,
    shutdown
  };
}
