/**
 * Performance Optimization Hook
 * 
 * React hook for performance monitoring and optimization features
 * Integrates with PerformanceMonitor and LazyLoader
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { PerformanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { LazyLoader } from '@/lib/performance/LazyLoader';
import type { 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceBudget 
} from '@/lib/performance/PerformanceMonitor';

/**
 * Hook configuration options
 */
export interface UsePerformanceOptimizationOptions {
  /** Whether to auto-start monitoring */
  autoStart?: boolean;
  
  /** Performance budget configuration */
  budget?: Partial<PerformanceBudget>;
  
  /** Monitoring interval in milliseconds */
  monitoringInterval?: number;
  
  /** Enable automatic optimizations */
  enableAutoOptimization?: boolean;
  
  /** Callback for performance alerts */
  onAlert?: (alert: PerformanceAlert) => void;
  
  /** Callback for metrics updates */
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

/**
 * Hook return type
 */
export interface UsePerformanceOptimizationResult {
  /** Current performance metrics */
  metrics: PerformanceMetrics | null;
  
  /** Current performance alerts */
  alerts: PerformanceAlert[];
  
  /** Performance budget */
  budget: PerformanceBudget | null;
  
  /** Whether monitoring is active */
  isMonitoring: boolean;
  
  /** Lazy loader instance */
  lazyLoader: LazyLoader;
  
  /** Performance monitor instance */
  performanceMonitor: PerformanceMonitor | null;
  
  /** Start performance monitoring */
  startMonitoring: () => void;
  
  /** Stop performance monitoring */
  stopMonitoring: () => void;
  
  /** Clear all alerts */
  clearAlerts: () => void;
  
  /** Record a processing operation */
  recordOperation: (duration: number, success: boolean) => void;
  
  /** Update worker utilization */
  updateWorkerUtilization: (utilization: number) => void;
  
  /** Preload components */
  preloadComponents: (componentNames: string[]) => Promise<void>;
  
  /** Preload formatters */
  preloadFormatters: (formats: any[]) => Promise<void>;
  
  /** Get loading statistics */
  getLoadingStats: () => any;
  
  /** Force garbage collection (if available) */
  forceGarbageCollection: () => void;
  
  /** Get performance score */
  getPerformanceScore: () => number;
  
  /** Enable/disable optimizations */
  toggleOptimizations: (enabled: boolean) => void;
}

/**
 * Performance optimization hook
 */
export function usePerformanceOptimization(
  options: UsePerformanceOptimizationOptions = {}
): UsePerformanceOptimizationResult {
  const {
    autoStart = true,
    budget,
    monitoringInterval = 5000,
    enableAutoOptimization = true,
    onAlert,
    onMetricsUpdate
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [budgetState, setBudget] = useState<PerformanceBudget | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [optimizationsEnabled, setOptimizationsEnabled] = useState(enableAutoOptimization);

  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
  const lazyLoaderRef = useRef<LazyLoader | null>(null);
  const optimizationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize performance monitor and lazy loader
  useEffect(() => {
    // Initialize lazy loader
    lazyLoaderRef.current = new LazyLoader({
      preloadFormats: ['meeting-notes', 'task-lists'],
      progressiveLoading: true
    });

    // Initialize performance monitor
    performanceMonitorRef.current = new PerformanceMonitor(budget);
    setBudget(performanceMonitorRef.current.getBudget());

    // Setup event listeners
    const handleMetricsUpdate = (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);
    };

    const handleAlert = (alert: PerformanceAlert) => {
      setAlerts(prev => [...prev, alert]);
      onAlert?.(alert);
      
      // Auto-optimization based on alerts
      if (optimizationsEnabled) {
        handleAutoOptimization(alert);
      }
    };

    performanceMonitorRef.current.on('metrics-updated', handleMetricsUpdate);
    performanceMonitorRef.current.on('alert', handleAlert);

    // Auto-start if enabled
    if (autoStart) {
      setIsMonitoring(true);
    }

    return () => {
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.destroy();
      }
      if (optimizationIntervalRef.current) {
        clearInterval(optimizationIntervalRef.current);
      }
    };
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // Start periodic optimizations
    if (optimizationsEnabled && !optimizationIntervalRef.current) {
      optimizationIntervalRef.current = setInterval(() => {
        performPeriodicOptimizations();
      }, 30000); // Every 30 seconds
    }
  }, [optimizationsEnabled]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (optimizationIntervalRef.current) {
      clearInterval(optimizationIntervalRef.current);
      optimizationIntervalRef.current = null;
    }
  }, []);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.clearAlerts();
    }
    setAlerts([]);
  }, []);

  // Record operation
  const recordOperation = useCallback((duration: number, success: boolean) => {
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.recordOperation(duration, success);
    }
  }, []);

  // Update worker utilization
  const updateWorkerUtilization = useCallback((utilization: number) => {
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.updateWorkerUtilization(utilization);
    }
  }, []);

  // Preload components
  const preloadComponents = useCallback(async (componentNames: string[]) => {
    if (lazyLoaderRef.current) {
      await lazyLoaderRef.current.preloadComponents(componentNames);
    }
  }, []);

  // Preload formatters
  const preloadFormatters = useCallback(async (formats: any[]) => {
    if (lazyLoaderRef.current) {
      await lazyLoaderRef.current.preloadFormatters(formats);
    }
  }, []);

  // Get loading stats
  const getLoadingStats = useCallback(() => {
    return lazyLoaderRef.current?.getLoadingStats() || null;
  }, []);

  // Force garbage collection
  const forceGarbageCollection = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).gc) {
      try {
        (window as any).gc();
        console.log('Garbage collection forced');
      } catch (error) {
        console.warn('Garbage collection not available');
      }
    }
  }, []);

  // Calculate performance score
  const getPerformanceScore = useCallback((): number => {
    if (!metrics) return 0;

    let score = 100;
    
    // Web Vitals scoring (40% weight)
    if (metrics.webVitals.lcp !== null) {
      if (metrics.webVitals.lcp > 4000) score -= 15;
      else if (metrics.webVitals.lcp > 2500) score -= 8;
    }
    
    if (metrics.webVitals.fid !== null) {
      if (metrics.webVitals.fid > 300) score -= 15;
      else if (metrics.webVitals.fid > 100) score -= 8;
    }
    
    if (metrics.webVitals.cls !== null) {
      if (metrics.webVitals.cls > 0.25) score -= 10;
      else if (metrics.webVitals.cls > 0.1) score -= 5;
    }
    
    // Memory usage scoring (30% weight)
    if (metrics.memory) {
      if (metrics.memory.usage > 90) score -= 20;
      else if (metrics.memory.usage > 70) score -= 10;
    }
    
    // Processing performance scoring (20% weight)
    if (metrics.processing.averageFormattingTime > 1000) score -= 15;
    else if (metrics.processing.averageFormattingTime > 500) score -= 8;
    
    // Error rate scoring (10% weight)
    if (metrics.ux.errorRate > 0.1) score -= 10;
    else if (metrics.ux.errorRate > 0.05) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }, [metrics]);

  // Toggle optimizations
  const toggleOptimizations = useCallback((enabled: boolean) => {
    setOptimizationsEnabled(enabled);
    
    if (enabled && isMonitoring && !optimizationIntervalRef.current) {
      optimizationIntervalRef.current = setInterval(() => {
        performPeriodicOptimizations();
      }, 30000);
    } else if (!enabled && optimizationIntervalRef.current) {
      clearInterval(optimizationIntervalRef.current);
      optimizationIntervalRef.current = null;
    }
  }, [isMonitoring]);

  // Handle automatic optimizations based on alerts
  const handleAutoOptimization = useCallback((alert: PerformanceAlert) => {
    switch (alert.type) {
      case 'memory_leak':
        // Trigger garbage collection if available
        forceGarbageCollection();
        
        // Clear component cache if memory is critical
        if (alert.severity === 'critical' && lazyLoaderRef.current) {
          lazyLoaderRef.current.clearCache();
        }
        break;
        
      case 'slow_performance':
        // Preload commonly used components to improve perceived performance
        if (lazyLoaderRef.current) {
          lazyLoaderRef.current.preloadComponents(['TaskListDisplay', 'JournalDisplay']);
        }
        break;
        
      case 'worker_overload':
        // Could implement worker pool scaling here
        console.log('Worker overload detected - consider scaling worker pool');
        break;
        
      default:
        break;
    }
  }, [forceGarbageCollection]);

  // Perform periodic optimizations
  const performPeriodicOptimizations = useCallback(() => {
    if (!metrics || !optimizationsEnabled) return;
    
    // Memory cleanup if usage is high
    if (metrics.memory && metrics.memory.usage > 80) {
      forceGarbageCollection();
    }
    
    // Preload based on usage patterns
    if (metrics.processing.totalOperations > 10) {
      // Preload components that might be needed soon
      preloadComponents(['HistoryDashboard']);
    }
  }, [metrics, optimizationsEnabled, forceGarbageCollection, preloadComponents]);

  return {
    metrics,
    alerts,
    budget: budgetState,
    isMonitoring,
    lazyLoader: lazyLoaderRef.current!,
    performanceMonitor: performanceMonitorRef.current,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
    recordOperation,
    updateWorkerUtilization,
    preloadComponents,
    preloadFormatters,
    getLoadingStats,
    forceGarbageCollection,
    getPerformanceScore,
    toggleOptimizations
  };
}

/**
 * Helper hook for component-level performance tracking
 */
export function useComponentPerformance(componentName: string) {
  const [renderTime, setRenderTime] = useState<number>(0);
  const [mountTime, setMountTime] = useState<number>(0);
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    const mountStart = performance.now();
    
    return () => {
      const mountDuration = performance.now() - mountStart;
      setMountTime(mountDuration);
    };
  }, []);

  const startRenderTracking = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const endRenderTracking = useCallback(() => {
    if (renderStartRef.current > 0) {
      const duration = performance.now() - renderStartRef.current;
      setRenderTime(duration);
      renderStartRef.current = 0;
    }
  }, []);

  return {
    renderTime,
    mountTime,
    startRenderTracking,
    endRenderTracking
  };
}
