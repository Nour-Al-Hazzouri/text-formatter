/**
 * PerformanceMetrics Component - Display processing performance
 * 
 * Features:
 * - Processing duration
 * - Performance rating
 * - Detailed metrics breakdown
 * - Optimization suggestions
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Zap, 
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PerformanceMetricsProps {
  duration: number; // milliseconds
  itemCount?: number;
  linesProcessed?: number;
  showDetails?: boolean;
  className?: string;
}

export function PerformanceMetrics({
  duration,
  itemCount = 0,
  linesProcessed = 0,
  showDetails = false,
  className,
}: PerformanceMetricsProps) {
  // Calculate performance rating
  const getPerformanceRating = (ms: number, lines: number) => {
    const msPerLine = lines > 0 ? ms / lines : ms;
    
    if (msPerLine < 1) return { rating: 'Excellent', color: 'text-green-600', icon: Zap };
    if (msPerLine < 5) return { rating: 'Good', color: 'text-blue-600', icon: TrendingUp };
    if (msPerLine < 10) return { rating: 'Fair', color: 'text-yellow-600', icon: Activity };
    return { rating: 'Slow', color: 'text-red-600', icon: TrendingDown };
  };

  const { rating, color, icon: Icon } = getPerformanceRating(duration, linesProcessed);

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const displayDuration = formatDuration(duration);
  const throughput = linesProcessed > 0 
    ? Math.round(linesProcessed / (duration / 1000)) 
    : 0;

  return (
    <Card className={cn('border-gray-200', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-handwritten flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            Performance
          </span>
          <Badge variant="outline" className={cn('gap-1', color)}>
            <Icon className="w-3 h-3" />
            {rating}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Main duration */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 font-content">Processing Time</span>
          <span className="text-lg font-bold text-gray-900">{displayDuration}</span>
        </div>

        {/* Details */}
        {showDetails && (
          <>
            <div className="pt-2 border-t border-gray-200 space-y-2">
              {itemCount > 0 && (
                <MetricRow
                  label="Items Processed"
                  value={itemCount.toString()}
                />
              )}
              {linesProcessed > 0 && (
                <MetricRow
                  label="Lines Processed"
                  value={linesProcessed.toString()}
                />
              )}
              {throughput > 0 && (
                <MetricRow
                  label="Throughput"
                  value={`${throughput} lines/sec`}
                />
              )}
            </div>

            {/* Performance bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Fast</span>
                <span>Slow</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'h-full rounded-full transition-all',
                    duration < 100 ? 'bg-green-500' :
                    duration < 500 ? 'bg-blue-500' :
                    duration < 1000 ? 'bg-yellow-500' :
                    'bg-red-500'
                  )}
                  style={{ 
                    width: `${Math.min((duration / 2000) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Metric row component
 */
function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600 font-content">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

/**
 * Inline performance indicator
 */
export function InlinePerformance({
  duration,
  className,
}: {
  duration: number;
  className?: string;
}) {
  const formatted = duration < 1000 
    ? `${Math.round(duration)}ms` 
    : `${(duration / 1000).toFixed(2)}s`;

  return (
    <div className={cn('flex items-center gap-1.5 text-gray-600', className)}>
      <Clock className="w-3.5 h-3.5" />
      <span className="text-xs font-content">{formatted}</span>
    </div>
  );
}
