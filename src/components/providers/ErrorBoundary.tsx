'use client';

/**
 * ErrorBoundary - React error boundaries for graceful error handling
 * 
 * Provides comprehensive error catching, logging, and recovery mechanisms
 * Includes specialized boundaries for different application areas
 */

import React, { 
  Component, 
  ErrorInfo, 
  ReactNode, 
  createContext, 
  useContext,
  useState,
  useCallback,
  type PropsWithChildren 
} from 'react';

// Import types
import type { ErrorState } from '@/types/index';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  timestamp: Date | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  /** Fallback UI component */
  fallback?: React.ComponentType<ErrorBoundaryState>;
  
  /** Custom error handler */
  onError?: (error: Error, errorInfo: ErrorInfo, context?: string) => void;
  
  /** Error boundary context/name */
  context?: string;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Whether to show retry button */
  showRetry?: boolean;
  
  /** Whether to show error details in development */
  showDetails?: boolean;
  
  /** Custom recovery actions */
  recoveryActions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface GlobalErrorContextType {
  /** All errors captured by boundaries */
  errors: ErrorState[];
  
  /** Add error to global tracker */
  addError: (error: ErrorState) => void;
  
  /** Clear specific error */
  clearError: (errorId: string) => void;
  
  /** Clear all errors */
  clearAllErrors: () => void;
  
  /** Get errors by type */
  getErrorsByType: (type: ErrorState['type']) => ErrorState[];
}

// ============================================================================
// Global Error Context
// ============================================================================

const GlobalErrorContext = createContext<GlobalErrorContextType | undefined>(undefined);

export function GlobalErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<ErrorState[]>([]);
  
  const addError = useCallback((error: ErrorState) => {
    setErrors(prev => [error, ...prev.slice(0, 99)]); // Keep last 100 errors
  }, []);
  
  const clearError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.context?.errorId !== errorId));
  }, []);
  
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);
  
  const getErrorsByType = useCallback((type: ErrorState['type']) => {
    return errors.filter(error => error.type === type);
  }, [errors]);
  
  return (
    <GlobalErrorContext.Provider value={{
      errors,
      addError,
      clearError,
      clearAllErrors,
      getErrorsByType,
    }}>
      {children}
    </GlobalErrorContext.Provider>
  );
}

export function useGlobalErrors() {
  const context = useContext(GlobalErrorContext);
  if (context === undefined) {
    throw new Error('useGlobalErrors must be used within a GlobalErrorProvider');
  }
  return context;
}

// ============================================================================
// Base Error Boundary
// ============================================================================

export class BaseErrorBoundary extends Component<
  PropsWithChildren<ErrorBoundaryProps>,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  
  constructor(props: PropsWithChildren<ErrorBoundaryProps>) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      timestamp: null,
      retryCount: 0,
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      timestamp: new Date(),
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error
    console.error(`Error caught by ErrorBoundary (${this.props.context || 'Unknown'}):`, {
      error,
      errorInfo,
      timestamp: new Date(),
      retryCount: this.state.retryCount,
    });
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.props.context);
    }
    
    // Add to global error context if available
    try {
      const globalErrorContext = (this as any).context;
      if (globalErrorContext?.addError) {
        const errorState: ErrorState = {
          type: this.getErrorType(error),
          message: error.message,
          code: error.name,
          stack: error.stack,
          context: {
            errorId: this.state.errorId,
            boundaryContext: this.props.context,
            componentStack: errorInfo.componentStack,
            retryCount: this.state.retryCount,
          },
          timestamp: new Date(),
          recoverable: true,
        };
        
        globalErrorContext.addError(errorState);
      }
    } catch (contextError) {
      console.warn('Failed to add error to global context:', contextError);
    }
  }
  
  private getErrorType(error: Error): ErrorState['type'] {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'network';
    }
    if (error.message.includes('Worker') || error.message.includes('worker')) {
      return 'worker';
    }
    if (error.message.includes('localStorage') || error.message.includes('storage')) {
      return 'storage';
    }
    return 'unknown';
  }
  
  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      timestamp: null,
      retryCount: prevState.retryCount + 1,
    }));
  };
  
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      timestamp: null,
      retryCount: 0,
    });
  };
  
  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent {...this.state} />;
      }
      
      // Default fallback UI
      return (
        <DefaultErrorFallback
          {...this.state}
          context={this.props.context}
          onRetry={this.props.showRetry !== false ? this.handleRetry : undefined}
          onReset={this.handleReset}
          maxRetries={this.props.maxRetries || 3}
          showDetails={this.props.showDetails}
          recoveryActions={this.props.recoveryActions}
        />
      );
    }
    
    return this.props.children;
  }
}

// ============================================================================
// Specialized Error Boundaries
// ============================================================================

/**
 * Error boundary for text processing operations
 */
export function ProcessingErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <BaseErrorBoundary
      context="text-processing"
      maxRetries={2}
      showRetry={true}
      recoveryActions={[
        {
          label: 'Clear Input',
          action: () => {
            // This would be connected to the formatting context
            console.log('Clearing input text');
          },
        },
        {
          label: 'Reset Format',
          action: () => {
            console.log('Resetting format selection');
          },
        },
      ]}
      onError={(error, errorInfo) => {
        // Specific handling for processing errors
        console.error('Processing error:', { error, errorInfo });
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Error boundary for Web Worker operations
 */
export function WorkerErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <BaseErrorBoundary
      context="web-worker"
      maxRetries={1}
      showRetry={true}
      recoveryActions={[
        {
          label: 'Restart Workers',
          action: () => {
            console.log('Restarting worker pool');
          },
        },
      ]}
      onError={(error, errorInfo) => {
        console.error('Worker error:', { error, errorInfo });
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Error boundary for UI components
 */
export function UIErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <BaseErrorBoundary
      context="ui-component"
      maxRetries={3}
      showRetry={true}
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        console.error('UI component error:', { error, errorInfo });
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Error boundary for storage operations
 */
export function StorageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <BaseErrorBoundary
      context="storage"
      maxRetries={1}
      showRetry={false}
      recoveryActions={[
        {
          label: 'Clear Storage',
          action: () => {
            if (confirm('This will clear all stored data. Continue?')) {
              localStorage.clear();
              window.location.reload();
            }
          },
        },
      ]}
      onError={(error, errorInfo) => {
        console.error('Storage error:', { error, errorInfo });
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
}

// ============================================================================
// Default Error Fallback Component
// ============================================================================

interface DefaultErrorFallbackProps extends ErrorBoundaryState {
  context?: string;
  onRetry?: () => void;
  onReset?: () => void;
  maxRetries?: number;
  showDetails?: boolean;
  recoveryActions?: Array<{
    label: string;
    action: () => void;
  }>;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  errorId,
  timestamp,
  retryCount,
  context,
  onRetry,
  onReset,
  maxRetries = 3,
  showDetails = false,
  recoveryActions = [],
}: DefaultErrorFallbackProps) {
  const [showFullDetails, setShowFullDetails] = useState(false);
  
  const canRetry = onRetry && retryCount < maxRetries;
  
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
        {/* Header */}
        <div className="p-6 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {context ? `Error in ${context}` : 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Error Details */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {error?.message || 'An unknown error occurred'}
            </p>
            
            {errorId && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Error ID: {errorId}
              </p>
            )}
            
            {timestamp && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Time: {timestamp.toLocaleString()}
              </p>
            )}
            
            {retryCount > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Retry attempts: {retryCount}/{maxRetries}
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {canRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            )}
            
            {onReset && (
              <button
                onClick={onReset}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Reset
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
          
          {/* Recovery Actions */}
          {recoveryActions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recovery Options:
              </p>
              <div className="flex gap-2 flex-wrap">
                {recoveryActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 rounded text-sm transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Technical Details */}
          {(showDetails || process.env.NODE_ENV === 'development') && (
            <div className="space-y-2">
              <button
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showFullDetails ? 'Hide' : 'Show'} Technical Details
              </button>
              
              {showFullDetails && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs font-mono space-y-2 max-h-40 overflow-auto">
                  {error?.stack && (
                    <div>
                      <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Stack Trace:</div>
                      <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div>
                      <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Component Stack:</div>
                      <pre className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HOC for wrapping components with error boundaries
// ============================================================================

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <BaseErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </BaseErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// ============================================================================
// Hook for handling errors in functional components
// ============================================================================

export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);
  
  const handleError = useCallback((error: Error, context?: string) => {
    setError(error);
    console.error(`Error in ${context || 'component'}:`, error);
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }
  
  return { handleError, clearError };
}
