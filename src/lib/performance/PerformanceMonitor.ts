/**
 * Performance Monitor - Comprehensive application performance monitoring
 * 
 * Features:
 * - Core Web Vitals tracking (LCP, FID, CLS)
 * - Memory usage monitoring and optimization
 * - Bundle size analysis and reporting
 * - Processing performance metrics
 * - Performance budget enforcement
 * - Real-time performance alerts
 */

/**
 * Performance metric types
 */
export interface PerformanceMetrics {
  /** Core Web Vitals */
  webVitals: {
    lcp: number | null; // Largest Contentful Paint
    fid: number | null; // First Input Delay
    cls: number | null; // Cumulative Layout Shift
    fcp: number | null; // First Contentful Paint
    ttfb: number | null; // Time to First Byte
  };
  
  /** Memory metrics */
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    usage: number; // Percentage
  } | null;
  
  /** Processing metrics */
  processing: {
    averageFormattingTime: number;
    totalOperations: number;
    operationsPerSecond: number;
    workerUtilization: number;
  };
  
  /** Bundle metrics */
  bundle: {
    mainChunkSize: number;
    totalChunksCount: number;
    lazyChunksLoaded: number;
    compressionRatio: number;
  };
  
  /** User experience metrics */
  ux: {
    averageInteractionTime: number;
    errorRate: number;
    successfulOperations: number;
    totalInteractions: number;
  };
}

/**
 * Performance thresholds and budgets
 */
export interface PerformanceBudget {
  /** Core Web Vitals thresholds */
  webVitals: {
    lcp: { good: number; needs_improvement: number; poor: number };
    fid: { good: number; needs_improvement: number; poor: number };
    cls: { good: number; needs_improvement: number; poor: number };
  };
  
  /** Memory budgets */
  memory: {
    maxUsage: number; // Maximum memory usage in MB
    warningThreshold: number; // Warning threshold percentage
    criticalThreshold: number; // Critical threshold percentage
  };
  
  /** Bundle size budgets */
  bundle: {
    maxInitialSize: number; // Maximum initial bundle size in KB
    maxChunkSize: number; // Maximum chunk size in KB
    maxTotalSize: number; // Maximum total size in KB
  };
  
  /** Processing budgets */
  processing: {
    maxFormattingTime: number; // Maximum formatting time in ms
    minOperationsPerSecond: number; // Minimum ops/second
    maxWorkerUtilization: number; // Maximum worker utilization %
  };
}

/**
 * Performance alert types
 */
export type PerformanceAlertType = 
  | 'budget_exceeded'
  | 'memory_leak'
  | 'slow_performance'
  | 'high_error_rate'
  | 'worker_overload';

export interface PerformanceAlert {
  type: PerformanceAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metrics: Partial<PerformanceMetrics>;
  suggestions: string[];
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private budget: PerformanceBudget;
  private observers: Map<string, PerformanceObserver> = new Map();
  private intervalId: number | null = null;
  private alerts: PerformanceAlert[] = [];
  private listeners: Map<string, Function[]> = new Map();

  constructor(budget?: Partial<PerformanceBudget>) {
    this.budget = {
      webVitals: {
        lcp: { good: 2500, needs_improvement: 4000, poor: Infinity },
        fid: { good: 100, needs_improvement: 300, poor: Infinity },
        cls: { good: 0.1, needs_improvement: 0.25, poor: Infinity }
      },
      memory: {
        maxUsage: 100, // 100MB
        warningThreshold: 70, // 70%
        criticalThreshold: 90 // 90%
      },
      bundle: {
        maxInitialSize: 500, // 500KB
        maxChunkSize: 200, // 200KB
        maxTotalSize: 2000 // 2MB
      },
      processing: {
        maxFormattingTime: 1000, // 1 second
        minOperationsPerSecond: 10,
        maxWorkerUtilization: 80 // 80%
      },
      ...budget
    };

    this.metrics = this.initializeMetrics();
    this.setupPerformanceObservers();
    this.startMonitoring();
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      webVitals: {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null
      },
      memory: this.getMemoryInfo(),
      processing: {
        averageFormattingTime: 0,
        totalOperations: 0,
        operationsPerSecond: 0,
        workerUtilization: 0
      },
      bundle: {
        mainChunkSize: 0,
        totalChunksCount: 0,
        lazyChunksLoaded: 0,
        compressionRatio: 0
      },
      ux: {
        averageInteractionTime: 0,
        errorRate: 0,
        successfulOperations: 0,
        totalInteractions: 0
      }
    };
  }

  /**
   * Setup performance observers for Core Web Vitals
   */
  private setupPerformanceObservers(): void {
    // Largest Contentful Paint (LCP)
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.webVitals.lcp = lastEntry?.startTime || null;
          this.checkBudgetCompliance('lcp', lastEntry?.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.webVitals.fid = entry.processingStart - entry.startTime;
            this.checkBudgetCompliance('fid', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          let clsValue = 0;
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.webVitals.cls = clsValue;
          this.checkBudgetCompliance('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    this.intervalId = window.setInterval(() => {
      this.updateMetrics();
      this.checkPerformanceBudgets();
      this.detectMemoryLeaks();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update all metrics
   */
  private updateMetrics(): void {
    // Update memory metrics
    this.metrics.memory = this.getMemoryInfo();
    
    // Update navigation timing
    this.updateNavigationMetrics();
    
    // Update bundle metrics
    this.updateBundleMetrics();
    
    // Emit metrics update event
    this.emit('metrics-updated', this.metrics);
  }

  /**
   * Get current memory information
   */
  private getMemoryInfo() {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  /**
   * Update navigation timing metrics
   */
  private updateNavigationMetrics(): void {
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing;
      this.metrics.webVitals.ttfb = timing.responseStart - timing.navigationStart;
      
      // Calculate FCP if not available from observer
      if (!this.metrics.webVitals.fcp && timing.domContentLoadedEventStart) {
        this.metrics.webVitals.fcp = timing.domContentLoadedEventStart - timing.navigationStart;
      }
    }
  }

  /**
   * Update bundle size metrics (approximated)
   */
  private updateBundleMetrics(): void {
    if (typeof performance !== 'undefined') {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let totalSize = 0;
      let chunkCount = 0;
      
      resources.forEach(resource => {
        if (resource.name.includes('.js') || resource.name.includes('.css')) {
          totalSize += resource.transferSize || 0;
          chunkCount++;
        }
      });
      
      this.metrics.bundle.totalChunksCount = chunkCount;
      // Main chunk size is approximated as the largest JS resource
      const jsResources = resources.filter(r => r.name.includes('.js')).sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0));
      this.metrics.bundle.mainChunkSize = jsResources[0]?.transferSize || 0;
    }
  }

  /**
   * Check budget compliance for specific metrics
   */
  private checkBudgetCompliance(metric: string, value: number): void {
    let threshold: any;
    let alertType: PerformanceAlertType = 'budget_exceeded';
    
    switch (metric) {
      case 'lcp':
        threshold = this.budget.webVitals.lcp;
        break;
      case 'fid':
        threshold = this.budget.webVitals.fid;
        break;
      case 'cls':
        threshold = this.budget.webVitals.cls;
        break;
      default:
        return;
    }
    
    if (value > threshold.poor) {
      this.createAlert(alertType, 'critical', `${metric.toUpperCase()} is in poor range: ${value}`, {
        webVitals: { [metric]: value } as any
      });
    } else if (value > threshold.needs_improvement) {
      this.createAlert(alertType, 'medium', `${metric.toUpperCase()} needs improvement: ${value}`, {
        webVitals: { [metric]: value } as any
      });
    }
  }

  /**
   * Check all performance budgets
   */
  private checkPerformanceBudgets(): void {
    // Check memory budget
    if (this.metrics.memory) {
      const memoryUsageMB = this.metrics.memory.usedJSHeapSize / 1024 / 1024;
      const memoryPercentage = this.metrics.memory.usage;
      
      if (memoryUsageMB > this.budget.memory.maxUsage) {
        this.createAlert('budget_exceeded', 'critical', 
          `Memory usage exceeds budget: ${memoryUsageMB.toFixed(1)}MB > ${this.budget.memory.maxUsage}MB`, 
          { memory: this.metrics.memory }
        );
      } else if (memoryPercentage > this.budget.memory.criticalThreshold) {
        this.createAlert('memory_leak', 'high',
          `Memory usage is critical: ${memoryPercentage.toFixed(1)}%`,
          { memory: this.metrics.memory }
        );
      } else if (memoryPercentage > this.budget.memory.warningThreshold) {
        this.createAlert('memory_leak', 'medium',
          `Memory usage is high: ${memoryPercentage.toFixed(1)}%`,
          { memory: this.metrics.memory }
        );
      }
    }
    
    // Check processing budget
    if (this.metrics.processing.averageFormattingTime > this.budget.processing.maxFormattingTime) {
      this.createAlert('slow_performance', 'high',
        `Formatting time exceeds budget: ${this.metrics.processing.averageFormattingTime}ms`,
        { processing: this.metrics.processing }
      );
    }
    
    if (this.metrics.processing.workerUtilization > this.budget.processing.maxWorkerUtilization) {
      this.createAlert('worker_overload', 'medium',
        `Worker utilization is high: ${this.metrics.processing.workerUtilization}%`,
        { processing: this.metrics.processing }
      );
    }
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): void {
    if (!this.metrics.memory) return;
    
    // Simple memory leak detection based on continuous growth
    const memoryHistory = this.getMemoryHistory();
    if (memoryHistory.length >= 10) {
      const trend = this.calculateMemoryTrend(memoryHistory);
      if (trend > 1.5) { // Memory growing by more than 1.5MB per minute
        this.createAlert('memory_leak', 'high',
          'Potential memory leak detected: continuous memory growth',
          { memory: this.metrics.memory }
        );
      }
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(
    type: PerformanceAlertType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    metrics: Partial<PerformanceMetrics>,
    suggestions: string[] = []
  ): void {
    const alert: PerformanceAlert = {
      type,
      severity,
      message,
      timestamp: new Date(),
      metrics,
      suggestions: suggestions.length > 0 ? suggestions : this.getDefaultSuggestions(type)
    };
    
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    this.emit('alert', alert);
  }

  /**
   * Get default suggestions for alert types
   */
  private getDefaultSuggestions(type: PerformanceAlertType): string[] {
    switch (type) {
      case 'memory_leak':
        return [
          'Check for circular references in JavaScript objects',
          'Ensure proper cleanup of event listeners',
          'Verify Web Workers are terminated when not needed',
          'Review cache implementation for unbounded growth'
        ];
      case 'slow_performance':
        return [
          'Consider code splitting to reduce bundle size',
          'Implement lazy loading for non-critical components',
          'Optimize heavy computations with Web Workers',
          'Review and optimize DOM manipulations'
        ];
      case 'worker_overload':
        return [
          'Increase worker pool size if resources allow',
          'Implement task prioritization',
          'Consider breaking large tasks into smaller chunks',
          'Review task distribution algorithm'
        ];
      case 'budget_exceeded':
        return [
          'Analyze bundle composition and remove unused code',
          'Implement dynamic imports for large dependencies',
          'Optimize images and assets',
          'Consider using a lighter UI framework'
        ];
      default:
        return ['Review application performance and optimize as needed'];
    }
  }

  /**
   * Record processing operation
   */
  recordOperation(duration: number, success: boolean): void {
    this.metrics.processing.totalOperations++;
    this.metrics.ux.totalInteractions++;
    
    if (success) {
      this.metrics.ux.successfulOperations++;
      // Update running average
      const total = this.metrics.processing.averageFormattingTime * (this.metrics.processing.totalOperations - 1);
      this.metrics.processing.averageFormattingTime = (total + duration) / this.metrics.processing.totalOperations;
    } else {
      this.metrics.ux.errorRate = (this.metrics.ux.totalInteractions - this.metrics.ux.successfulOperations) / this.metrics.ux.totalInteractions;
    }
    
    // Calculate operations per second (approximated)
    this.metrics.processing.operationsPerSecond = this.metrics.processing.totalOperations / (performance.now() / 1000);
  }

  /**
   * Update worker utilization
   */
  updateWorkerUtilization(utilization: number): void {
    this.metrics.processing.workerUtilization = utilization;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Get performance budget
   */
  getBudget(): PerformanceBudget {
    return { ...this.budget };
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    this.emit('alerts-cleared');
  }

  /**
   * Event listener management
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Helper methods for memory leak detection
   */
  private getMemoryHistory(): number[] {
    // This would typically be stored and retrieved from a more persistent storage
    // For now, return empty array as placeholder
    return [];
  }

  private calculateMemoryTrend(history: number[]): number {
    // Simple linear regression to calculate memory growth trend
    if (history.length < 2) return 0;
    
    const n = history.length;
    const sumX = n * (n - 1) / 2; // Sum of indices
    const sumY = history.reduce((sum, val) => sum + val, 0);
    const sumXY = history.reduce((sum, val, i) => sum + (i * val), 0);
    const sumXX = n * (n - 1) * (2 * n - 1) / 6; // Sum of squares of indices
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Cleanup and disconnect observers
   */
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.listeners.clear();
  }
}
