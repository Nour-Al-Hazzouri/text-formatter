/**
 * Enhanced Worker Manager - Advanced lifecycle and performance management
 * 
 * Provides sophisticated worker management with:
 * - Performance monitoring and optimization
 * - Resource cleanup and memory management  
 * - Error recovery and circuit breaking
 * - Load balancing and scaling decisions
 */

import { EventEmitter } from 'events';
import { AdvancedWorkerPool, AdvancedWorkerPoolConfig } from '../pool/AdvancedWorkerPool';
import type { 
  ProcessingTask, 
  TaskResult, 
  WorkerError 
} from '@/types/workers';
import type { FormatType } from '@/types';
import type { AdvancedPoolStats } from '../pool/AdvancedWorkerPool';

/**
 * Manager configuration for multiple worker pools
 */
export interface WorkerManagerConfig {
  /** Pool configurations per format type */
  pools: Record<FormatType, AdvancedWorkerPoolConfig>;
  
  /** Global settings */
  global: {
    maxConcurrentTasks: number;
    taskTimeout: number;
    circuitBreaker: {
      errorThreshold: number;
      resetTimeout: number;
    };
    monitoring: {
      enabled: boolean;
      reportingInterval: number;
    };
  };
  
  /** Cross-pool load balancing */
  crossPoolBalancing: {
    enabled: boolean;
    spilloverThreshold: number;
    preferredFormats: FormatType[];
  };
}

/**
 * Circuit breaker states for error recovery
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker for handling worker failures
 */
class CircuitBreaker extends EventEmitter {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailure = 0;
  private resetTimeout?: NodeJS.Timeout;

  constructor(
    private threshold: number,
    private resetTime: number
  ) {
    super();
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure >= this.resetTime) {
        this.state = 'half-open';
        this.emit('state-change', 'half-open');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'half-open') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      this.emit('state-change', 'open');
      
      this.resetTimeout = setTimeout(() => {
        this.state = 'half-open';
        this.emit('state-change', 'half-open');
      }, this.resetTime);
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.emit('state-change', 'closed');
    
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = undefined;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

/**
 * Enhanced Worker Manager with advanced pool management
 */
export class EnhancedWorkerManager extends EventEmitter {
  private pools: Map<FormatType, AdvancedWorkerPool> = new Map();
  private circuitBreakers: Map<FormatType, CircuitBreaker> = new Map();
  private globalStats = {
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageResponseTime: 0
  };
  
  private monitoring = {
    interval: null as NodeJS.Timeout | null,
    lastReport: Date.now()
  };

  constructor(private config: WorkerManagerConfig) {
    super();
    this.initializePools();
    this.setupCircuitBreakers();
    this.setupMonitoring();
  }

  /**
   * Initialize worker pools for each format type
   */
  private initializePools(): void {
    for (const [format, poolConfig] of Object.entries(this.config.pools)) {
      const pool = new AdvancedWorkerPool(poolConfig);
      this.pools.set(format as FormatType, pool);
      
      // Setup pool event handlers
      this.setupPoolEventHandlers(format as FormatType, pool);
    }
  }

  /**
   * Setup circuit breakers for error recovery
   */
  private setupCircuitBreakers(): void {
    const { errorThreshold, resetTimeout } = this.config.global.circuitBreaker;
    
    for (const format of Object.keys(this.config.pools) as FormatType[]) {
      const breaker = new CircuitBreaker(errorThreshold, resetTimeout);
      this.circuitBreakers.set(format, breaker);
      
      breaker.on('state-change', (state) => {
        this.emit('circuit-breaker-change', { format, state });
      });
    }
  }

  /**
   * Setup pool event handlers
   */
  private setupPoolEventHandlers(format: FormatType, pool: AdvancedWorkerPool): void {
    pool.on('metrics-updated', (stats: AdvancedPoolStats) => {
      this.updateGlobalStats(format, stats);
    });

    pool.on('worker-error-handled', (event) => {
      this.emit('worker-recovery', { format, ...event });
    });

    pool.on('pool-shutdown', () => {
      this.emit('pool-shutdown', { format });
    });
  }

  /**
   * Setup global monitoring
   */
  private setupMonitoring(): void {
    if (!this.config.global.monitoring.enabled) return;
    
    this.monitoring.interval = setInterval(() => {
      this.generateGlobalReport();
    }, this.config.global.monitoring.reportingInterval);
  }

  /**
   * Process task with enhanced routing and error recovery
   */
  async processTask(
    format: FormatType, 
    task: ProcessingTask,
    options: { 
      allowSpillover?: boolean;
      retryCount?: number;
    } = {}
  ): Promise<TaskResult> {
    const { allowSpillover = false, retryCount = 0 } = options;
    
    // Get primary pool
    let pool = this.pools.get(format);
    if (!pool) {
      throw new Error(`No pool configured for format: ${format}`);
    }

    // Check if spillover is needed and allowed
    if (allowSpillover && this.shouldSpillover(format)) {
      pool = this.findBestAlternativePool(format);
      if (!pool) {
        throw new Error('All pools are overloaded');
      }
    }

    // Execute with circuit breaker protection
    const circuitBreaker = this.circuitBreakers.get(format);
    if (!circuitBreaker) {
      throw new Error(`No circuit breaker for format: ${format}`);
    }

    try {
      this.globalStats.activeTasks++;
      this.globalStats.totalTasks++;
      
      const result = await circuitBreaker.execute(async () => {
        return await pool.submitTask({
          ...task,
          timeout: this.config.global.taskTimeout
        });
      });

      this.globalStats.activeTasks--;
      this.globalStats.completedTasks++;
      
      this.emit('task-completed', { format, taskId: task.taskId, result });
      return result;

    } catch (error) {
      this.globalStats.activeTasks--;
      this.globalStats.failedTasks++;
      
      // Retry logic
      if (retryCount < 2 && this.isRetryableError(error as WorkerError)) {
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.processTask(format, task, { ...options, retryCount: retryCount + 1 });
      }
      
      this.emit('task-failed', { format, taskId: task.taskId, error });
      throw error;
    }
  }

  /**
   * Check if spillover is needed for a format
   */
  private shouldSpillover(format: FormatType): boolean {
    if (!this.config.crossPoolBalancing.enabled) return false;
    
    const pool = this.pools.get(format);
    if (!pool) return false;
    
    const stats = pool.getStats();
    const utilizationThreshold = this.config.crossPoolBalancing.spilloverThreshold;
    
    return stats.utilization > utilizationThreshold || stats.queueSize > 10;
  }

  /**
   * Find the best alternative pool for spillover
   */
  private findBestAlternativePool(excludeFormat: FormatType): AdvancedWorkerPool | undefined {
    let bestPool: AdvancedWorkerPool | undefined = undefined;
    let bestScore = Infinity;

    for (const [format, pool] of this.pools.entries()) {
      if (format === excludeFormat) continue;
      
      const stats = pool.getStats();
      const score = stats.utilization + (stats.queueSize * 10);
      
      if (score < bestScore) {
        bestScore = score;
        bestPool = pool;
      }
    }

    return bestPool;
  }

  /**
   * Update global statistics
   */
  private updateGlobalStats(format: FormatType, poolStats: AdvancedPoolStats): void {
    // Aggregate metrics from all pools
    const allStats = Array.from(this.pools.values()).map(pool => pool.getStats());
    
    this.globalStats.averageResponseTime = allStats.reduce(
      (sum, stats) => sum + stats.performance.averageResponseTime, 0
    ) / allStats.length;

    this.emit('global-stats-updated', this.globalStats);
  }

  /**
   * Generate comprehensive global report
   */
  private generateGlobalReport(): void {
    const report = {
      timestamp: Date.now(),
      global: this.globalStats,
      pools: {} as Record<FormatType, AdvancedPoolStats>,
      circuitBreakers: {} as Record<FormatType, CircuitState>,
      systemHealth: this.calculateSystemHealth()
    };

    // Collect pool stats
    for (const [format, pool] of this.pools.entries()) {
      report.pools[format] = pool.getStats();
    }

    // Collect circuit breaker states
    for (const [format, breaker] of this.circuitBreakers.entries()) {
      report.circuitBreakers[format] = breaker.getState();
    }

    this.emit('global-report', report);
    this.monitoring.lastReport = Date.now();
  }

  /**
   * Calculate overall system health score
   */
  private calculateSystemHealth(): number {
    const poolHealthScores = Array.from(this.pools.values()).map(pool => {
      const stats = pool.getStats();
      const performanceScore = Math.max(0, 100 - (stats.performance.averageResponseTime / 100));
      const utilizationScore = Math.max(0, 100 - stats.utilization);
      const errorScore = Math.max(0, 100 - (stats.errors.rate * 100));
      
      return (performanceScore + utilizationScore + errorScore) / 3;
    });

    return poolHealthScores.length > 0 
      ? poolHealthScores.reduce((sum, score) => sum + score, 0) / poolHealthScores.length
      : 0;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: WorkerError): boolean {
    const retryableCodes = ['TIMEOUT', 'WORKER_BUSY', 'TEMPORARY_ERROR'];
    return retryableCodes.includes(error.code);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Public API methods
   */

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      pools: Object.fromEntries(
        Array.from(this.pools.entries()).map(([format, pool]) => [
          format,
          pool.getStats()
        ])
      ),
      global: this.globalStats,
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([format, breaker]) => [
          format,
          breaker.getState()
        ])
      ),
      health: this.calculateSystemHealth()
    };
  }

  /**
   * Graceful shutdown of all pools
   */
  async shutdown(): Promise<void> {
    if (this.monitoring.interval) {
      clearInterval(this.monitoring.interval);
    }

    const shutdownPromises = Array.from(this.pools.values()).map(pool => pool.shutdown());
    await Promise.all(shutdownPromises);
    
    this.emit('manager-shutdown');
  }

  /**
   * Scale pool for specific format
   */
  async scalePool(format: FormatType, action: 'up' | 'down'): Promise<void> {
    const pool = this.pools.get(format);
    if (!pool) throw new Error(`No pool for format: ${format}`);
    
    // Implementation would depend on pool's scaling capabilities
    this.emit('pool-scaled', { format, action });
  }

  /**
   * Get pool statistics for specific format
   */
  getPoolStats(format: FormatType): AdvancedPoolStats | null {
    const pool = this.pools.get(format);
    return pool ? pool.getStats() : null;
  }
}
