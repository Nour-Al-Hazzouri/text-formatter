/**
 * ErrorMessage Component - User-friendly error display
 * 
 * Features:
 * - Clear error messaging
 * - Actionable suggestions
 * - Error categorization
 * - Retry actions
 */

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ErrorMessageProps {
  error: Error | string;
  title?: string;
  severity?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onDismiss?: () => void;
  suggestions?: string[];
  className?: string;
}

export function ErrorMessage({
  error,
  title,
  severity = 'error',
  onRetry,
  onDismiss,
  suggestions,
  className,
}: ErrorMessageProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  const config = {
    error: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: title || 'Processing Error',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      title: title || 'Warning',
    },
    info: {
      icon: AlertCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: title || 'Information',
    },
  };

  const { icon: Icon, color, bg, border, title: defaultTitle } = config[severity];

  return (
    <Alert className={cn(bg, border, className)}>
      <Icon className={cn('w-5 h-5', color)} />
      <AlertTitle className="font-handwritten">
        {defaultTitle}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm font-content text-gray-700">
          {errorMessage}
        </p>

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <HelpCircle className="w-4 h-4" />
              Suggestions:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {(onRetry || onDismiss) && (
          <div className="flex items-center gap-2 mt-3">
            {onRetry && (
              <Button
                size="sm"
                onClick={onRetry}
                className="gap-2"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                onClick={onDismiss}
                variant="ghost"
              >
                Dismiss
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Inline error display
 */
export function InlineError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-2 text-red-600', className)}>
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="text-sm font-content">{message}</span>
    </div>
  );
}
