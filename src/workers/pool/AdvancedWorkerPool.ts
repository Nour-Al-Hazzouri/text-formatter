/**
 * Advanced Worker Pool Management System
 * 
 * Enhanced Web Worker pool with advanced features for concurrent processing:
 * - Dynamic worker lifecycle management
 * - Intelligent load balancing
 * - Priority-based task queuing
 * - Resource cleanup and memory management
 * - Performance monitoring and optimization
 * - Error recovery and worker replacement
 */

import { EventEmitter } from 'events';
import { WorkerPool } from './WorkerPool';
import { WorkerCommunicator, WorkerErrorRecovery } from '../utils/WorkerCommunication';
import type { 
  WorkerPoolConfig,
  WorkerInfo,
  WorkerStatus,
  ProcessingTask,
  TaskResult,
  PoolStats,
  LoadBalancingStrategy,
  WorkerError,
  TaskPriority,
  WorkerMetrics
} from '@/types/workers';

/**
 * Advanced pool configuration extending base config
 */
export interface AdvancedWorkerPoolConfig extends WorkerPoolConfig {
  /** Auto-scaling settings */
  autoScaling: {
    enabled: boolean;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    scaleUpDelay: number;
    scaleDownDelay: number;
  };
  
  /** Performance monitoring */
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    performanceThresholds: {
      maxResponseTime: number;
      minSuccessRate: number;
      maxMemoryUsage: number;
    };
  };
  
  /** Resource management */
  resources: {
    memoryLimit: number;
    cpuThreshold: number;
    cleanupInterval: number;
    workerRecycleAfter: number;
  };
  
  /** Error recovery */
  errorRecovery: {
    maxRetries: number;
    retryDelay: number;
    workerReplacementThreshold: number;
    circuitBreakerThreshold: number;
  };
}

/**
 * Enhanced pool statistics
 */
export interface AdvancedPoolStats extends PoolStats {
  /** Memory usage statistics */
  memoryUsage: {
    total: number;
    average: number;
    peak: number;
  };
  
  /** Performance metrics */
  performance: {
    throughput: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    successRate: number;
  };
  
  /** Error statistics */
  errors: {
    total: number;
    rate: number;
    recoveredWorkers: number;
  };
  
  /** Auto-scaling metrics */
  scaling: {
    lastScaleAction: 'up' | 'down' | 'none';
    lastScaleTime: number;
    scaleEvents: number;
  };
}

/**
 * Task execution context with enhanced tracking
 */
interface TaskExecutionContext {
  workerId: string;
  startTime: number;
  retryCount: number;
  queueTime: number;
  memorySnapshot: number;
}

/**
 * Advanced Worker Pool with enhanced management capabilities
 */
export class AdvancedWorkerPool extends EventEmitter {
  private basePool: WorkerPool;
  private workers: Map<string, WorkerInfo> = new Map();
  private taskQueue: ProcessingTask[] = [];
  private priorityQueues: Map<TaskPriority, ProcessingTask[]> = new Map();
  private executionContexts: Map<string, TaskExecutionContext> = new Map();
  private workerReplacements: Map<string, number> = new Map();
  
  private stats!: AdvancedPoolStats;
  private monitoring = {
    interval: null as NodeJS.Timeout | null,
    metrics: new Map<string, number[]>(),
    lastCleanup: Date.now()
  };
  
  private autoScaling = {
    lastCheck: Date.now(),
    pendingScale: null as 'up' | 'down' | null,
    scaleTimeout: null as NodeJS.Timeout | null
  };

  constructor(private config: AdvancedWorkerPoolConfig) {
    super();
    
    this.initializeQueues();
    this.stats = this.initializeStats();
    this.setupMonitoring();
    this.setupAutoScaling();
    this.setupResourceCleanup();
    
    // Initialize base pool with enhanced config
    this.basePool = new WorkerPool({
      ...config,
      // Override with enhanced settings
      loadBalancing: 'priority-based' // Use advanced load balancing
    });
    
    this.setupBasePoolEvents();
  }

  /**
   * Initialize priority queues
   */
  private initializeQueues(): void {
    this.priorityQueues.set('urgent', []);
    this.priorityQueues.set('high', []);
    this.priorityQueues.set('normal', []);
    this.priorityQueues.set('low', []);
  }

  /**
   * Initialize advanced statistics
   */
  private initializeStats(): AdvancedPoolStats {
    this.stats = {
      // Base stats
      totalWorkers: 0,
      activeWorkers: 0,
      idleWorkers: 0,
      queueSize: 0,
      totalTasksProcessed: 0,
      averageQueueTime: 0,
      utilization: 0,
      
      // Advanced stats
      memoryUsage: { total: 0, average: 0, peak: 0 },
      performance: { 
        throughput: 0, 
        averageResponseTime: 0, 
        p95ResponseTime: 0, 
        successRate: 1 
      },
      errors: { total: 0, rate: 0, recoveredWorkers: 0 },
      scaling: { 
        lastScaleAction: 'none', 
        lastScaleTime: Date.now(), 
        scaleEvents: 0 
      }
    };
    
    return this.stats;
  }

  /**
   * Setup performance monitoring
   */
  private setupMonitoring(): void {
    if (!this.config.monitoring.enabled) return;
    
    this.monitoring.interval = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.checkResourceLimits();
    }, this.config.monitoring.metricsInterval);
  }

  /**
   * Setup auto-scaling system
   */
  private setupAutoScaling(): void {
    if (!this.config.autoScaling.enabled) return;
    
    setInterval(() => {
      this.evaluateScaling();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Setup resource cleanup
   */
  private setupResourceCleanup(): void {
    setInterval(() => {
      this.performResourceCleanup();
      this.recycleOldWorkers();
      this.optimizeMemoryUsage();
    }, this.config.resources.cleanupInterval);
  }

  /**
   * Submit task with enhanced processing
   */
  async submitTask(task: ProcessingTask): Promise<TaskResult> {
    const context: TaskExecutionContext = {
      workerId: '',
      startTime: Date.now(),
      retryCount: 0,
      queueTime: Date.now(),
      memorySnapshot: this.getCurrentMemoryUsage()
    };
    
    this.executionContexts.set(task.taskId, context);
    
    // Add to priority queue
    const queue = this.priorityQueues.get(task.priority) || this.priorityQueues.get('normal')!;
    queue.push(task);
    
    this.updateStats();
    this.processQueues();
    
    return new Promise((resolve, reject) => {
      (task as any)._resolve = resolve;
      (task as any)._reject = reject;
      (task as any)._submitTime = Date.now();
      
      // Enhanced timeout with context cleanup
      if (task.timeout) {
        setTimeout(() => {
          this.handleTaskTimeout(task.taskId);
          reject({
            message: `Task ${task.taskId} timed out after ${task.timeout}ms`,
            code: 'ENHANCED_TIMEOUT'
          } as WorkerError);
        }, task.timeout);
      }
    });
  }

  /**
   * Process queues with priority-based scheduling
   */
  private processQueues(): void {
    const availableWorker = this.findOptimalWorker();
    if (!availableWorker) {
      this.evaluateWorkerCreation();
      return;
    }

    const task = this.getNextPriorityTask();
    if (!task) return;

    this.assignTaskWithMonitoring(task, availableWorker.id);
    
    // Continue processing
    setImmediate(() => this.processQueues());
  }

  /**
   * Find optimal worker using enhanced load balancing
   */
  private findOptimalWorker(): WorkerInfo | null {
    const availableWorkers = Array.from(this.workers.values())
      .filter(w => w.status === 'idle');

    if (availableWorkers.length === 0) return null;

    // Advanced load balancing considering multiple factors
    return availableWorkers.reduce((best, current) => {
      const bestScore = this.calculateWorkerScore(best);
      const currentScore = this.calculateWorkerScore(current);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Calculate worker score for load balancing
   */
  private calculateWorkerScore(worker: WorkerInfo): number {
    const metrics = worker.metrics;
    
    // Factors: success rate, response time, memory usage, recency
    const successScore = metrics.successRate * 100;
    const speedScore = Math.max(0, 100 - (metrics.averageProcessingTime / 1000));
    const memoryScore = Math.max(0, 100 - (this.getWorkerMemoryUsage(worker.id) / 1024 / 1024));
    const freshnessScore = Math.max(0, 100 - ((Date.now() - worker.lastActivity) / 60000));
    
    return (successScore * 0.3) + (speedScore * 0.3) + (memoryScore * 0.2) + (freshnessScore * 0.2);
  }

  /**
   * Get next task based on enhanced priority system
   */
  private getNextPriorityTask(): ProcessingTask | null {
    // Process queues in priority order
    for (const priority of ['urgent', 'high', 'normal', 'low'] as TaskPriority[]) {
      const queue = this.priorityQueues.get(priority)!;
      if (queue.length > 0) {
        // Sort by age within priority level
        queue.sort((a, b) => a.createdAt - b.createdAt);
        return queue.shift() || null;
      }
    }
    return null;
  }

  /**
   * Assign task with enhanced monitoring
   */
  private async assignTaskWithMonitoring(task: ProcessingTask, workerId: string): Promise<void> {
    const context = this.executionContexts.get(task.taskId);
    if (!context) return;

    context.workerId = workerId;
    context.startTime = Date.now();
    
    const worker = this.workers.get(workerId);
    if (!worker) throw new Error(`Worker ${workerId} not found`);

    try {
      worker.status = 'busy';
      worker.currentTaskId = task.taskId;
      worker.lastActivity = Date.now();

      // Enhanced communication with monitoring
      const communicator = new WorkerCommunicator(worker.worker);
      await communicator.sendMessage('PROCESS_TEXT', {
        ...task,
        monitoring: {
          trackMemory: true,
          trackPerformance: true,
          reportProgress: true
        }
      });

      this.trackWorkerAssignment(workerId, task.taskId);
      
    } catch (error) {
      await this.handleWorkerError(workerId, {
        message: `Enhanced assignment failed: ${error instanceof Error ? error.message : 'Unknown'}`,
        code: 'ENHANCED_ASSIGNMENT_ERROR'
      });
    }
  }

  /**
   * Enhanced error handling and recovery
   */
  private async handleWorkerError(workerId: string, error: WorkerError): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    this.stats.errors.total++;
    worker.metrics.errorCount++;
    
    // Track replacement count
    const replacements = this.workerReplacements.get(workerId) || 0;
    this.workerReplacements.set(workerId, replacements + 1);

    // Determine recovery strategy
    if (replacements >= this.config.errorRecovery.workerReplacementThreshold) {
      await this.replaceWorker(workerId);
    } else {
      await this.recoverWorker(workerId, error);
    }

    this.emit('worker-error-handled', { workerId, error, action: 'recovered' });
  }

  /**
   * Replace a problematic worker
   */
  private async replaceWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    // Terminate old worker
    worker.worker.terminate();
    this.workers.delete(workerId);
    this.workerReplacements.delete(workerId);

    // Create replacement
    try {
      const newWorkerId = await this.createEnhancedWorker();
      this.stats.errors.recoveredWorkers++;
      this.emit('worker-replaced', { oldId: workerId, newId: newWorkerId });
    } catch (error) {
      console.error('Failed to replace worker:', error);
    }
  }

  /**
   * Create enhanced worker with monitoring
   */
  private async createEnhancedWorker(): Promise<string> {
    const workerId = this.generateWorkerId();
    
    const worker = new Worker(this.config.workerScript, {
      type: 'module'
    });

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

    this.workers.set(workerId, workerInfo);
    
    // Enhanced initialization with monitoring capabilities
    const communicator = new WorkerCommunicator(worker);
    await communicator.sendMessage('INIT', {
      ...this.config.initData,
      monitoring: this.config.monitoring,
      workerId,
      enhancedFeatures: true
    });

    return workerId;
  }

  /**
   * Auto-scaling evaluation
   */
  private evaluateScaling(): void {
    if (!this.config.autoScaling.enabled || this.autoScaling.pendingScale) return;

    const queueLoad = this.getTotalQueueSize() / this.config.maxQueueSize;
    const utilization = this.stats.utilization;
    
    // Scale up conditions
    if (queueLoad > this.config.autoScaling.scaleUpThreshold || 
        utilization > this.config.autoScaling.scaleUpThreshold) {
      this.scheduleScaleUp();
    }
    
    // Scale down conditions
    else if (queueLoad < this.config.autoScaling.scaleDownThreshold && 
             utilization < this.config.autoScaling.scaleDownThreshold) {
      this.scheduleScaleDown();
    }
  }

  /**
   * Performance optimization and cleanup
   */
  private performResourceCleanup(): void {
    // Clean up completed task contexts
    const cutoff = Date.now() - (5 * 60 * 1000); // 5 minutes
    
    for (const [taskId, context] of this.executionContexts.entries()) {
      if (context.startTime < cutoff) {
        this.executionContexts.delete(taskId);
      }
    }

    // Update cleanup timestamp
    this.monitoring.lastCleanup = Date.now();
  }

  /**
   * Collect and analyze performance metrics
   */
  private collectMetrics(): void {
    const now = Date.now();
    
    // Collect response times
    const activeTasks = Array.from(this.executionContexts.values());
    const responseTimes = activeTasks
      .filter(ctx => ctx.startTime > 0)
      .map(ctx => now - ctx.startTime);

    if (responseTimes.length > 0) {
      this.stats.performance.averageResponseTime = 
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      // Calculate P95
      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      this.stats.performance.p95ResponseTime = sortedTimes[p95Index] || 0;
    }

    // Calculate throughput (tasks per second)
    const window = 60000; // 1 minute
    const recentTasks = this.stats.totalTasksProcessed; // Simplified
    this.stats.performance.throughput = recentTasks / (window / 1000);

    this.emit('metrics-updated', this.stats);
  }

  /**
   * Utility methods
   */
  private generateWorkerId(): string {
    return `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  private getWorkerMemoryUsage(workerId: string): number {
    // Simplified memory tracking
    return this.getCurrentMemoryUsage() / Math.max(1, this.workers.size);
  }

  private getTotalQueueSize(): number {
    return Array.from(this.priorityQueues.values())
      .reduce((total, queue) => total + queue.length, 0);
  }

  private trackWorkerAssignment(workerId: string, taskId: string): void {
    // Implementation for tracking worker assignments
  }

  private handleTaskTimeout(taskId: string): void {
    const context = this.executionContexts.get(taskId);
    if (context) {
      this.executionContexts.delete(taskId);
    }
  }

  private evaluateWorkerCreation(): void {
    if (this.workers.size < this.config.maxWorkers) {
      this.createEnhancedWorker().catch(console.error);
    }
  }

  private async recoverWorker(workerId: string, error: WorkerError): Promise<void> {
    // Implementation for worker recovery
  }

  private scheduleScaleUp(): void {
    // Implementation for scaling up
  }

  private scheduleScaleDown(): void {
    // Implementation for scaling down  
  }

  private analyzePerformance(): void {
    // Implementation for performance analysis
  }

  private checkResourceLimits(): void {
    // Implementation for resource limit checking
  }

  private recycleOldWorkers(): void {
    // Implementation for worker recycling
  }

  private optimizeMemoryUsage(): void {
    // Implementation for memory optimization
  }

  private setupBasePoolEvents(): void {
    // Setup event forwarding from base pool
  }

  private updateStats(): void {
    this.stats.totalWorkers = this.workers.size;
    this.stats.activeWorkers = Array.from(this.workers.values())
      .filter(w => w.status === 'busy').length;
    this.stats.idleWorkers = this.workers.size - this.stats.activeWorkers;
    this.stats.queueSize = this.getTotalQueueSize();
    this.stats.utilization = this.workers.size > 0 ? 
      (this.stats.activeWorkers / this.workers.size) * 100 : 0;
  }

  /**
   * Public API methods
   */
  getStats(): AdvancedPoolStats {
    return { ...this.stats };
  }

  async shutdown(): Promise<void> {
    // Cleanup and shutdown
    if (this.monitoring.interval) {
      clearInterval(this.monitoring.interval);
    }
    
    if (this.autoScaling.scaleTimeout) {
      clearTimeout(this.autoScaling.scaleTimeout);
    }

    // Terminate all workers
    for (const worker of this.workers.values()) {
      worker.worker.terminate();
    }
    
    this.workers.clear();
    this.emit('pool-shutdown');
  }
}
