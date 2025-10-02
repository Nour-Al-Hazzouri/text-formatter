'use client';

/**
 * Performance Dashboard - Real-time performance monitoring and optimization
 * 
 * Features:
 * - Core Web Vitals visualization
 * - Memory usage monitoring
 * - Bundle size analysis
 * - Performance alerts and suggestions
 * - Real-time metrics updates
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { 
  PerformanceMetrics, 
  PerformanceAlert, 
  PerformanceBudget 
} from '@/lib/performance/PerformanceMonitor';

interface PerformanceDashboardProps {
  /** Performance monitor instance */
  performanceMonitor: any; // Would be properly typed in real implementation
  
  /** Whether to show detailed metrics */
  showDetailedMetrics?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Core Web Vitals scoring
 */
const getWebVitalScore = (metric: string, value: number | null): { score: string; color: string } => {
  if (value === null) return { score: 'N/A', color: 'text-gray-500' };
  
  switch (metric) {
    case 'lcp':
      if (value <= 2500) return { score: 'Good', color: 'text-green-600' };
      if (value <= 4000) return { score: 'Needs Improvement', color: 'text-yellow-600' };
      return { score: 'Poor', color: 'text-red-600' };
    
    case 'fid':
      if (value <= 100) return { score: 'Good', color: 'text-green-600' };
      if (value <= 300) return { score: 'Needs Improvement', color: 'text-yellow-600' };
      return { score: 'Poor', color: 'text-red-600' };
    
    case 'cls':
      if (value <= 0.1) return { score: 'Good', color: 'text-green-600' };
      if (value <= 0.25) return { score: 'Needs Improvement', color: 'text-yellow-600' };
      return { score: 'Poor', color: 'text-red-600' };
    
    default:
      return { score: 'Unknown', color: 'text-gray-500' };
  }
};

/**
 * Alert severity colors
 */
const getAlertColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-300';
    case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
    default: return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

export function PerformanceDashboard({ 
  performanceMonitor, 
  showDetailedMetrics = false,
  className = '' 
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [budget, setBudget] = useState<PerformanceBudget | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Load initial data and setup listeners
  useEffect(() => {
    if (!performanceMonitor) return;

    // Load initial data
    const loadData = () => {
      setMetrics(performanceMonitor.getMetrics());
      setAlerts(performanceMonitor.getAlerts());
      setBudget(performanceMonitor.getBudget());
    };

    loadData();

    // Setup event listeners
    const handleMetricsUpdate = (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);
    };

    const handleAlert = (alert: PerformanceAlert) => {
      setAlerts(prev => [...prev, alert]);
    };

    const handleAlertsCleared = () => {
      setAlerts([]);
    };

    performanceMonitor.on('metrics-updated', handleMetricsUpdate);
    performanceMonitor.on('alert', handleAlert);
    performanceMonitor.on('alerts-cleared', handleAlertsCleared);

    return () => {
      performanceMonitor.off('metrics-updated', handleMetricsUpdate);
      performanceMonitor.off('alert', handleAlert);
      performanceMonitor.off('alerts-cleared', handleAlertsCleared);
    };
  }, [performanceMonitor]);

  const handleClearAlerts = useCallback(() => {
    if (performanceMonitor) {
      performanceMonitor.clearAlerts();
    }
  }, [performanceMonitor]);

  const handleToggleMonitoring = useCallback(() => {
    setIsMonitoring(!isMonitoring);
    // In a real implementation, this would start/stop monitoring
  }, [isMonitoring]);

  if (!metrics || !budget) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading performance data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`performance-dashboard space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-handwritten text-orange-900 dark:text-orange-100">
            ⚡ Performance Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Real-time application performance monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isMonitoring ? 'Monitoring' : 'Paused'}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleMonitoring}
          >
            {isMonitoring ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎯 Core Web Vitals</span>
            <Badge variant="outline" className="text-xs">
              Google Standards
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LCP */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {metrics.webVitals.lcp ? `${metrics.webVitals.lcp.toFixed(0)}ms` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Largest Contentful Paint
              </div>
              <Badge className={getWebVitalScore('lcp', metrics.webVitals.lcp).color}>
                {getWebVitalScore('lcp', metrics.webVitals.lcp).score}
              </Badge>
            </div>

            {/* FID */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {metrics.webVitals.fid ? `${metrics.webVitals.fid.toFixed(0)}ms` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                First Input Delay
              </div>
              <Badge className={getWebVitalScore('fid', metrics.webVitals.fid).color}>
                {getWebVitalScore('fid', metrics.webVitals.fid).score}
              </Badge>
            </div>

            {/* CLS */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {metrics.webVitals.cls ? metrics.webVitals.cls.toFixed(3) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Cumulative Layout Shift
              </div>
              <Badge className={getWebVitalScore('cls', metrics.webVitals.cls).color}>
                {getWebVitalScore('cls', metrics.webVitals.cls).score}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory and Bundle Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle>🧠 Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.memory ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Heap Usage</span>
                    <span>{metrics.memory.usage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={metrics.memory.usage} 
                    className="h-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Used</div>
                    <div className="font-semibold">
                      {(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Limit</div>
                    <div className="font-semibold">
                      {(metrics.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0)} MB
                    </div>
                  </div>
                </div>
                
                {metrics.memory.usage > budget.memory.warningThreshold && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded text-sm text-yellow-700 dark:text-yellow-300">
                    ⚠️ Memory usage is high
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                Memory monitoring not available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing Performance */}
        <Card>
          <CardHeader>
            <CardTitle>⚙️ Processing Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Avg Format Time</div>
                  <div className="font-semibold text-lg">
                    {metrics.processing.averageFormattingTime.toFixed(0)}ms
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Operations/sec</div>
                  <div className="font-semibold text-lg">
                    {metrics.processing.operationsPerSecond.toFixed(1)}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Worker Utilization</span>
                  <span>{metrics.processing.workerUtilization.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={metrics.processing.workerUtilization} 
                  className="h-2"
                />
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Operations: {metrics.processing.totalOperations.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      {showDetailedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Detailed Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
              {/* Bundle Metrics */}
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">Bundle Info</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Main Chunk</span>
                    <span>{(metrics.bundle.mainChunkSize / 1024).toFixed(0)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Chunks</span>
                    <span>{metrics.bundle.totalChunksCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Lazy Loaded</span>
                    <span>{metrics.bundle.lazyChunksLoaded}</span>
                  </div>
                </div>
              </div>
              
              {/* UX Metrics */}
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">User Experience</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                    <span>{((metrics.ux.successfulOperations / Math.max(1, metrics.ux.totalInteractions)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Error Rate</span>
                    <span>{(metrics.ux.errorRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Interactions</span>
                    <span>{metrics.ux.totalInteractions}</span>
                  </div>
                </div>
              </div>
              
              {/* Additional Web Vitals */}
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">Additional Vitals</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">FCP</span>
                    <span>{metrics.webVitals.fcp ? `${metrics.webVitals.fcp.toFixed(0)}ms` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">TTFB</span>
                    <span>{metrics.webVitals.ttfb ? `${metrics.webVitals.ttfb.toFixed(0)}ms` : 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {/* Performance Budget Status */}
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">Budget Status</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Memory</span>
                    <Badge variant={metrics.memory && metrics.memory.usage > budget.memory.warningThreshold ? "destructive" : "secondary"}>
                      {metrics.memory ? (metrics.memory.usage < budget.memory.warningThreshold ? 'OK' : 'High') : 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Processing</span>
                    <Badge variant={metrics.processing.averageFormattingTime > budget.processing.maxFormattingTime ? "destructive" : "secondary"}>
                      {metrics.processing.averageFormattingTime < budget.processing.maxFormattingTime ? 'OK' : 'Slow'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bundle</span>
                    <Badge variant={metrics.bundle.mainChunkSize > budget.bundle.maxInitialSize * 1024 ? "destructive" : "secondary"}>
                      {metrics.bundle.mainChunkSize < budget.bundle.maxInitialSize * 1024 ? 'OK' : 'Large'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🚨 Performance Alerts</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{alerts.length} alerts</Badge>
                <Button variant="outline" size="sm" onClick={handleClearAlerts}>
                  Clear All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.slice(0, 10).map((alert, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-xs text-gray-500">
                      {alert.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {alert.suggestions.length > 0 && (
                    <div className="text-sm">
                      <div className="font-medium mb-1">Suggestions:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {alert.suggestions.slice(0, 2).map((suggestion, i) => (
                          <li key={i} className="text-xs">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
              
              {alerts.length > 10 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  ... and {alerts.length - 10} more alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🛠️ Performance Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" disabled>
              🔄 Force GC
            </Button>
            <Button variant="outline" size="sm" disabled>
              📊 Export Report
            </Button>
            <Button variant="outline" size="sm" disabled>
              🔍 Analyze Bundle
            </Button>
            <Button variant="outline" size="sm" disabled>
              ⚡ Optimize
            </Button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Advanced features available in full implementation
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
