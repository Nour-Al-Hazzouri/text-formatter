/**
 * ConfidenceDisplay Component - Shows confidence scores and metrics
 * 
 * Features:
 * - Visual confidence score display
 * - Color-coded confidence levels
 * - Confidence breakdown by category
 * - Tooltip explanations
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfidenceDisplayProps {
  confidence: number; // 0-1
  label?: string;
  showBreakdown?: boolean;
  breakdown?: {
    label: string;
    score: number;
    color?: string;
  }[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConfidenceDisplay({
  confidence,
  label = 'Confidence',
  showBreakdown = false,
  breakdown,
  size = 'md',
  className,
}: ConfidenceDisplayProps) {
  const percentage = Math.round(confidence * 100);
  
  // Determine confidence level and styling
  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-500', icon: CheckCircle };
    if (score >= 0.6) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-500', icon: TrendingUp };
    if (score >= 0.4) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-500', icon: Target };
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-500', icon: AlertCircle };
  };

  const { level, color, bg, icon: Icon } = getConfidenceLevel(confidence);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main confidence display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-5 h-5', color)} />
          <span className={cn('font-content font-medium text-gray-700', sizeClasses[size])}>
            {label}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('font-semibold', color)}>
            {percentage}%
          </Badge>
          <span className={cn('text-xs text-gray-500')}>{level}</span>
        </div>
      </div>

      {/* Visual progress bar */}
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn('h-full transition-all duration-500 rounded-full', bg)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Breakdown if provided */}
      {showBreakdown && breakdown && breakdown.length > 0 && (
        <Card className="mt-3">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-700 mb-2">Score Breakdown</p>
            {breakdown.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {Math.round(item.score * 100)}%
                  </span>
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      'h-full transition-all duration-300 rounded-full',
                      item.color || 'bg-orange-500'
                    )}
                    style={{ width: `${Math.round(item.score * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Compact confidence badge
 */
export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: number;
  className?: string;
}) {
  const percentage = Math.round(confidence * 100);
  
  const getColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 0.6) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (score >= 0.4) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <Badge variant="outline" className={cn('gap-1', getColor(confidence), className)}>
      <Target className="w-3 h-3" />
      {percentage}%
    </Badge>
  );
}
