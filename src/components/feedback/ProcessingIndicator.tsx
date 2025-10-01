/**
 * ProcessingIndicator Component - Animated loading states
 * 
 * Features:
 * - Animated loading spinner
 * - Processing status messages
 * - Progress indication
 * - Format-specific processing indicators
 */

'use client';

import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormatType } from '@/types';

export interface ProcessingIndicatorProps {
  isProcessing?: boolean;
  formatType?: FormatType;
  message?: string;
  progress?: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FORMAT_MESSAGES: Record<FormatType, string> = {
  'meeting-notes': 'Organizing meeting notes...',
  'task-lists': 'Formatting task list...',
  'journal-notes': 'Structuring journal entry...',
  'shopping-lists': 'Organizing shopping list...',
  'research-notes': 'Formatting research notes...',
  'study-notes': 'Organizing study notes...',
};

export function ProcessingIndicator({
  isProcessing = true,
  formatType = 'meeting-notes',
  message,
  progress,
  size = 'md',
  className,
}: ProcessingIndicatorProps) {
  const displayMessage = message || FORMAT_MESSAGES[formatType];

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  if (!isProcessing) {
    return null;
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-8', className)}>
      {/* Animated spinner */}
      <div className="relative">
        <Sparkles className={cn(
          iconSizes[size],
          'text-orange-500 animate-pulse absolute inset-0'
        )} />
        <Loader2 className={cn(
          iconSizes[size],
          'text-orange-600 animate-spin'
        )} />
      </div>

      {/* Status message */}
      <div className="text-center">
        <p className={cn(
          'font-content text-gray-700 font-medium',
          sizeClasses[size]
        )}>
          {displayMessage}
        </p>

        {/* Progress bar if provided */}
        {typeof progress === 'number' && (
          <div className="mt-3 w-48">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Inline processing indicator for smaller spaces
 */
export function InlineProcessingIndicator({
  message = 'Processing...',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
      <span className="text-sm text-gray-600 font-content">{message}</span>
    </div>
  );
}

/**
 * Success indicator
 */
export function SuccessIndicator({
  message = 'Processing complete!',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-green-600', className)}>
      <CheckCircle2 className="w-5 h-5" />
      <span className="text-sm font-content font-medium">{message}</span>
    </div>
  );
}
