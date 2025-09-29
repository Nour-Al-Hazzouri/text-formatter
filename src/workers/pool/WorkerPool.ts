/**
 * Worker Pool Management System
 * 
 * Manages a pool of Web Workers for concurrent text processing,
 * with load balancing, lifecycle management, and error recovery.
 */

import { WorkerCommunicator, WorkerErrorRecovery } from '../utils/WorkerCommunication';
import type { 
  WorkerPoolConfig,
  WorkerInfo,
  WorkerStatus,
  ProcessingTask,
  TaskResult,
  PoolStats,
  LoadBalancingStrategy,
  WorkerError
} from '@/types/workers';

/**
 * Event types for worker pool
 */
export interface WorkerPoolEvents {
  'worker-ready': (workerId: string) => void;
  'worker-error': (workerId: string, error: WorkerError) => void;
  'worker-terminated': (workerId: string) => void;
  'task-completed': (taskId: string, result: TaskResult) => void;
  'task-failed': (taskId: string, error: WorkerError) => void;
  'pool-stats': (stats: PoolStats) => void;
}

/**
 * Worker pool manager for concurrent processing
 */
export class WorkerPool {
  private workers: Map<string, WorkerInfo> = new Map();
  private taskQueue: ProcessingTask[] = [];
  private activeTasks: Map<string, { workerId: string; startTime: number }> = new Map();
  private eventHandlers: Map<keyof WorkerPoolEvents, Set<Function>> = new Map();
  private stats: PoolStats;
  private cleanupInterval?: NodeJS.Timeout;
  private statsInterval?: NodeJS.Timeout;

  constructor(private config: WorkerPoolConfig) {
    this.stats = {
      totalWorkers: 0,
      activeWorkers: 0,
      idleWorkers: 0,
      queueSize: 0,
      totalTasksProcessed: 0,
      averageQueueTime: 0,
      utilization: 0
    };

    this.initializePool();
    this.startBackgroundTasks();
  }

  /**
   * Initialize the worker pool with minimum workers
   */
  private async initializePool(): Promise<void> {
    for (let i = 0; i < this.config.minWorkers; i++) {
      await this.createWorker();
    }
  }

  /**
   * Create a new worker
   */
  private async createWorker(): Promise<string> {
    const workerId = this.generateWorkerId();
    
    try {
      const worker = new Worker(this.config.workerScript, {
        type: 'module'
      });

      const communicator = new WorkerCommunicator(worker);
      
      const workerInfo: WorkerInfo = {
        id: workerId,
        worker,
        status: 'initializing',
        createdAt: Date.now(),
        lastActivity: Date.now(),
        tasksProcessed: 0,
        metrics: {
          averageProcessingTime: 0,
          totalProcessingTime: 0,
          successRate: 1,
          errorCount: 0
        }
      };

      // Setup event handlers
      communicator.on('WORKER_READY', () => {
        workerInfo.status = 'idle';
        workerInfo.lastActivity = Date.now();
        this.emit('worker-ready', workerId);
        this.processQueue();
      });

      communicator.on('WORKER_ERROR', (error: WorkerError) => {
        workerInfo.status = 'error';
        workerInfo.metrics.errorCount++;
        this.emit('worker-error', workerId, error);
        this.handleWorkerError(workerId, error);
      });

      communicator.on('PROCESSING_COMPLETE', (result: TaskResult) => {
        this.handleTaskCompletion(workerId, result);
      });

      communicator.on('PROCESSING_ERROR', (error: WorkerError) => {
        this.handleTaskError(workerId, error);
      });

      communicator.on('PROGRESS_UPDATE', (progress: any) => {
        workerInfo.lastActivity = Date.now();
        // Forward progress updates
      });

      // Store worker info
      this.workers.set(workerId, workerInfo);
      
      // Initialize worker with configuration
      if (this.config.initData) {
        await communicator.sendMessage('INIT', this.config.initData);
      }

      this.updateStats();
      return workerId;

    } catch (error) {
      console.error(`Failed to create worker ${workerId}:`, error);
      throw error;
    }
  }

  /**
   * Submit a task for processing
   */
  async submitTask(task: ProcessingTask): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      // Add promise handlers to task
      (task as any)._resolve = resolve;
      (task as any)._reject = reject;
      (task as any)._queueTime = Date.now();

      // Add to queue
      this.taskQueue.push(task);
      this.updateStats();

      // Process queue
      this.processQueue();

      // Set timeout if specified
      if (task.timeout) {
        setTimeout(() => {
          if (this.taskQueue.includes(task)) {
            this.taskQueue = this.taskQueue.filter(t => t.taskId !== task.taskId);
            reject({
              message: `Task ${task.taskId} timed out`,
              code: 'TASK_TIMEOUT'
            } as WorkerError);
          }
        }, task.timeout);
      }
    });
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) {
      return;
    }

    // Find available worker
    const availableWorker = this.findAvailableWorker();
    if (!availableWorker) {
      // Try to create more workers if possible
      if (this.workers.size < this.config.maxWorkers) {
        this.createWorker().catch(console.error);
      }
      return;
    }

    // Get next task based on priority
    const task = this.getNextTask();
    if (!task) {
      return;
    }

    // Assign task to worker
    this.assignTaskToWorker(task, availableWorker.id);

    // Continue processing queue
    setTimeout(() => this.processQueue(), 0);
  }

  /**
   * Find an available worker using load balancing strategy
   */
  private findAvailableWorker(): WorkerInfo | null {
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'idle');

    if (availableWorkers.length === 0) {
      return null;
    }

    switch (this.config.loadBalancing) {
      case 'round-robin':
        return availableWorkers[this.stats.totalTasksProcessed % availableWorkers.length];
        
      case 'least-busy':
        return availableWorkers.reduce((least, current) => 
          current.tasksProcessed < least.tasksProcessed ? current : least
        );
        
      case 'random':
        return availableWorkers[Math.floor(Math.random() * availableWorkers.length)];
        
      case 'priority-based':
        // For now, same as least-busy, can be enhanced later
        return availableWorkers.reduce((best, current) => 
          current.metrics.averageProcessingTime < best.metrics.averageProcessingTime ? current : best
        );
        
      default:
        return availableWorkers[0];
    }
  }

  /**
   * Get next task from queue based on priority
   */
  private getNextTask(): ProcessingTask | null {
    if (this.taskQueue.length === 0) {
      return null;
    }

    // Sort by priority and creation time
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return a.createdAt - b.createdAt; // Earlier tasks first
    });

    return this.taskQueue.shift() || null;
  }

  /**
   * Assign a task to a specific worker
   */
  private async assignTaskToWorker(task: ProcessingTask, workerId: string): Promise<void> {
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) {
      throw new Error(`Worker ${workerId} not found`);
    }

    try {
      // Update worker status
      workerInfo.status = 'busy';
      workerInfo.currentTaskId = task.taskId;
      workerInfo.lastActivity = Date.now();

      // Track active task
      this.activeTasks.set(task.taskId, {
        workerId,
        startTime: Date.now()
      });

      // Send task to worker
      const communicator = new WorkerCommunicator(workerInfo.worker);
      await communicator.sendMessage('PROCESS_TEXT', task);

    } catch (error) {
      // Handle assignment error
      this.handleTaskError(workerId, {
        message: `Failed to assign task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'TASK_ASSIGNMENT_ERROR'
      });
    }
  }

  /**
   * Handle task completion
   */
  private handleTaskCompletion(workerId: string, result: TaskResult): void {
    const workerInfo = this.workers.get(workerId);
    const activeTask = this.activeTasks.get(result.taskId);
    
    if (workerInfo && activeTask) {
      // Update worker metrics
      const processingTime = Date.now() - activeTask.startTime;
      workerInfo.tasksProcessed++;
      workerInfo.status = 'idle';
      workerInfo.currentTaskId = undefined;
      workerInfo.lastActivity = Date.now();
      
      // Update processing time metrics
      const totalTime = workerInfo.metrics.totalProcessingTime + processingTime;
      workerInfo.metrics.totalProcessingTime = totalTime;
      workerInfo.metrics.averageProcessingTime = totalTime / workerInfo.tasksProcessed;
      
      // Update success rate
      const successfulTasks = workerInfo.tasksProcessed - workerInfo.metrics.errorCount;
      workerInfo.metrics.successRate = successfulTasks / workerInfo.tasksProcessed;
      
      // Clean up
      this.activeTasks.delete(result.taskId);
      this.stats.totalTasksProcessed++;
      
      // Resolve task promise
      const task = this.findTaskInQueue(result.taskId);
      if (task && (task as any)._resolve) {
        (task as any)._resolve(result);
      }
      
      this.emit('task-completed', result.taskId, result);
      this.updateStats();
      
      // Process next task
      this.processQueue();
    }
  }

  /**
   * Handle task error
   */
  private handleTaskError(workerId: string, error: WorkerError): void {
    const workerInfo = this.workers.get(workerId);
    
    if (workerInfo) {
      workerInfo.status = 'idle';
      workerInfo.metrics.errorCount++;
      workerInfo.lastActivity = Date.now();
      
      // Find and reject task promise
      const taskId = workerInfo.currentTaskId;
      if (taskId) {
        const activeTask = this.activeTasks.get(taskId);
        if (activeTask) {
          this.activeTasks.delete(taskId);
          
          const task = this.findTaskInQueue(taskId);
          if (task && (task as any)._reject) {
            (task as any)._reject(error);
          }
        }
        
        workerInfo.currentTaskId = undefined;
      }
      
      this.emit('task-failed', taskId || 'unknown', error);
      this.updateStats();
      
      // Continue processing queue
      this.processQueue();
    }
  }

  /**
   * Handle worker error and recovery
   */
  private async handleWorkerError(workerId: string, error: WorkerError): Promise<void> {
    const workerInfo = this.workers.get(workerId);
    
    if (workerInfo) {
      if (WorkerErrorRecovery.isRecoverable(error)) {
        // Try to recover the worker
        try {
          workerInfo.status = 'initializing';
          await this.recreateWorker(workerId);
        } catch (recoveryError) {
          // If recovery fails, terminate worker
          this.terminateWorker(workerId);
        }
      } else {
        // Non-recoverable error, terminate worker
        this.terminateWorker(workerId);
      }
    }
  }

  /**
   * Recreate a worker
   */
  private async recreateWorker(workerId: string): Promise<void> {
    const oldWorkerInfo = this.workers.get(workerId);
    if (!oldWorkerInfo) return;

    // Terminate old worker
    oldWorkerInfo.worker.terminate();
    this.workers.delete(workerId);

    // Create new worker
    await this.createWorker();
  }

  /**
   * Terminate a specific worker
   */
  private terminateWorker(workerId: string): void {
    const workerInfo = this.workers.get(workerId);
    
    if (workerInfo) {
      workerInfo.worker.terminate();
      this.workers.delete(workerId);
      this.emit('worker-terminated', workerId);
      
      // If below minimum, create replacement
      if (this.workers.size < this.config.minWorkers) {
        this.createWorker().catch(console.error);
      }
      
      this.updateStats();
    }
  }

  /**
   * Find task in various states
   */
  private findTaskInQueue(taskId: string): ProcessingTask | null {
    return this.taskQueue.find(task => task.taskId === taskId) || null;
  }

  /**
   * Update pool statistics
   */
  private updateStats(): void {
    const workers = Array.from(this.workers.values());
    
    this.stats = {
      totalWorkers: workers.length,
      activeWorkers: workers.filter(w => w.status === 'busy').length,
      idleWorkers: workers.filter(w => w.status === 'idle').length,
      queueSize: this.taskQueue.length,
      totalTasksProcessed: this.stats.totalTasksProcessed,
      averageQueueTime: this.calculateAverageQueueTime(),
      utilization: workers.length > 0 ? 
        (workers.filter(w => w.status === 'busy').length / workers.length) * 100 : 0
    };
    
    this.emit('pool-stats', this.stats);
  }

  /**
   * Calculate average queue time
   */
  private calculateAverageQueueTime(): number {
    if (this.taskQueue.length === 0) return 0;
    
    const now = Date.now();
    const totalQueueTime = this.taskQueue.reduce((sum, task) => {
      return sum + (now - ((task as any)._queueTime || task.createdAt));
    }, 0);
    
    return totalQueueTime / this.taskQueue.length;
  }

  /**
   * Start background maintenance tasks
   */
  private startBackgroundTasks(): void {
    // Cleanup idle workers
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleWorkers();
    }, this.config.idleTimeout);
    
    // Update stats
    this.statsInterval = setInterval(() => {
      this.updateStats();
    }, 5000); // Every 5 seconds
  }

  /**
   * Clean up idle workers that exceed the minimum
   */
  private cleanupIdleWorkers(): void {
    const idleWorkers = Array.from(this.workers.values())
      .filter(worker => 
        worker.status === 'idle' && 
        (Date.now() - worker.lastActivity) > this.config.idleTimeout
      )
      .sort((a, b) => a.lastActivity - b.lastActivity); // Oldest first

    const excessWorkers = Math.max(0, this.workers.size - this.config.minWorkers);
    const toTerminate = Math.min(idleWorkers.length, excessWorkers);
    
    for (let i = 0; i < toTerminate; i++) {
      this.terminateWorker(idleWorkers[i].id);
    }
  }

  /**
   * Get current pool statistics
   */
  getStats(): PoolStats {
    return { ...this.stats };
  }

  /**
   * Get worker information
   */
  getWorkerInfo(workerId: string): WorkerInfo | null {
    return this.workers.get(workerId) || null;
  }

  /**
   * Get all workers information
   */
  getAllWorkersInfo(): WorkerInfo[] {
    return Array.from(this.workers.values());
  }

  /**
   * Event handling
   */
  on<T extends keyof WorkerPoolEvents>(event: T, handler: WorkerPoolEvents[T]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off<T extends keyof WorkerPoolEvents>(event: T, handler: WorkerPoolEvents[T]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit<T extends keyof WorkerPoolEvents>(event: T, ...args: Parameters<WorkerPoolEvents[T]>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as any)(...args);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Generate unique worker ID
   */
  private generateWorkerId(): string {
    return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Terminate the entire pool
   */
  async terminate(): Promise<void> {
    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    // Terminate all workers
    const terminationPromises = Array.from(this.workers.keys()).map(workerId => {
      return new Promise<void>((resolve) => {
        this.terminateWorker(workerId);
        resolve();
      });
    });

    await Promise.all(terminationPromises);

    // Reject all queued tasks
    this.taskQueue.forEach(task => {
      if ((task as any)._reject) {
        (task as any)._reject({
          message: 'Worker pool terminated',
          code: 'POOL_TERMINATED'
        });
      }
    });

    this.taskQueue = [];
    this.activeTasks.clear();
    this.eventHandlers.clear();
  }
}
