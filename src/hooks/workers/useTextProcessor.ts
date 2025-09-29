/**
 * React Hook for Text Processing with Web Workers
 * 
 * Simplified interface for text processing with automatic format detection,
 * React 18 concurrent features, and error handling.
 */

'use client';

import { 
  useState, 
  useCallback, 
  useTransition,
  useDeferredValue,
  useMemo 
} from 'react';
import { useWorkerPool } from './useWorkerPool';
import type { FormatType } from '@/types';
import type { WorkerError } from '@/types/workers';
import type { FormattedOutput } from '@/types/formatting';

/**
 * Text processing options
 */
export interface TextProcessingOptions {
  format?: FormatType;
  autoDetect?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  enableStreaming?: boolean;
  timeout?: number;
}

/**
 * Processing result with metadata
 */
export interface ProcessingResult {
  formatted: FormattedOutput | null;
  isProcessing: boolean;
  isPending: boolean;
  progress: number;
  error: WorkerError | null;
  confidence: number;
  suggestedFormat?: FormatType;
  processingTime: number;
}

/**
 * Text processor hook result
 */
export interface UseTextProcessorResult {
  // Main processing function
  processText: (text: string, options?: TextProcessingOptions) => Promise<FormattedOutput>;
  
  // Batch processing
  processBatch: (texts: string[], options?: TextProcessingOptions) => Promise<FormattedOutput[]>;
  
  // Format detection only
  detectFormat: (text: string) => Promise<FormatType>;
  
  // State
  result: ProcessingResult;
  
  // Control
  cancel: () => void;
  clear: () => void;
  
  // Pool status
  isReady: boolean;
  poolStats: {
    activeWorkers: number;
    queueSize: number;
    utilization: number;
  };
}

/**
 * Default processing options
 */
const DEFAULT_OPTIONS: TextProcessingOptions = {
  autoDetect: true,
  priority: 'normal',
  enableStreaming: false,
  timeout: 30000
};

/**
 * Hook for text processing with automatic format detection
 */
export function useTextProcessor(): UseTextProcessorResult {
  // Worker pool hook
  const {
    processText: poolProcessText,
    cancelProcessing,
    processingState,
    poolStats,
    isReady,
    clearCache
  } = useWorkerPool({
    workerScript: '/workers/text-processor.worker.js',
    minWorkers: 2,
    maxWorkers: 4,
    enableErrorRecovery: true,
    enableCaching: true
  });

  // Local state for processing results
  const [result, setResult] = useState<ProcessingResult>({
    formatted: null,
    isProcessing: false,
    isPending: false,
    progress: 0,
    error: null,
    confidence: 0,
    processingTime: 0
  });

  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // React 18 concurrent features
  const [isPending, startTransition] = useTransition();
  
  // Deferred result for non-urgent UI updates
  const deferredResult = useDeferredValue(result);

  // Memoized pool stats for performance
  const simplifiedPoolStats = useMemo(() => ({
    activeWorkers: poolStats.activeWorkers,
    queueSize: poolStats.queueSize,
    utilization: poolStats.utilization
  }), [poolStats.activeWorkers, poolStats.queueSize, poolStats.utilization]);

  // Format detection function
  const detectFormat = useCallback(async (text: string): Promise<FormatType> => {
    if (!isReady) {
      throw new Error('Text processor not ready');
    }

    // Simple format detection based on patterns
    // This would be enhanced with the actual worker-based detection
    
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Meeting notes patterns
    if (text.toLowerCase().includes('meeting') || 
        text.toLowerCase().includes('agenda') ||
        text.toLowerCase().includes('attendees')) {
      return 'meeting-notes';
    }
    
    // Task list patterns
    const taskPatterns = /^[-*•]\s+|^\d+\.\s+|todo|task/i;
    if (lines.some(line => taskPatterns.test(line))) {
      return 'task-lists';
    }
    
    // Shopping list patterns
    const shoppingKeywords = ['buy', 'grocery', 'store', 'milk', 'bread', 'eggs'];
    if (shoppingKeywords.some(keyword => 
      text.toLowerCase().includes(keyword))) {
      return 'shopping-lists';
    }
    
    // Research notes patterns
    if (text.includes('http') || text.includes('research') || 
        text.includes('citation') || text.includes('reference')) {
      return 'research-notes';
    }
    
    // Study notes patterns
    if (text.includes('chapter') || text.includes('definition') || 
        text.includes('study') || text.includes('exam')) {
      return 'study-notes';
    }
    
    // Default to journal notes for personal text
    return 'journal-notes';
  }, [isReady]);

  // Main text processing function
  const processText = useCallback(async (
    text: string, 
    options: TextProcessingOptions = {}
  ): Promise<FormattedOutput> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    
    // Update state to show processing started
    startTransition(() => {
      setResult(prev => ({
        ...prev,
        isProcessing: true,
        isPending: true,
        progress: 0,
        error: null,
        formatted: null
      }));
    });

    try {
      // Detect format if not specified
      let targetFormat = opts.format;
      if (!targetFormat && opts.autoDetect) {
        startTransition(() => {
          setResult(prev => ({
            ...prev,
            progress: 10
          }));
        });
        
        targetFormat = await detectFormat(text);
        
        startTransition(() => {
          setResult(prev => ({
            ...prev,
            suggestedFormat: targetFormat,
            progress: 20
          }));
        });
      }

      if (!targetFormat) {
        targetFormat = 'journal-notes'; // Default format for unspecified text
      }

      // Process the text
      startTransition(() => {
        setResult(prev => ({
          ...prev,
          progress: 30
        }));
      });

      const taskResult = await poolProcessText(text, targetFormat as FormatType, {
        priority: opts.priority,
        timeout: opts.timeout,
        enableStreaming: opts.enableStreaming
      });

      const processingTime = Date.now() - startTime;
      const formatted = taskResult.result as FormattedOutput;

      // Update with final result
      startTransition(() => {
        setResult({
          formatted,
          isProcessing: false,
          isPending: false,
          progress: 100,
          error: null,
          confidence: formatted?.metadata?.confidence || 0,
          suggestedFormat: targetFormat,
          processingTime
        });
      });

      return formatted;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const workerError = error as WorkerError;
      
      startTransition(() => {
        setResult(prev => ({
          ...prev,
          isProcessing: false,
          isPending: false,
          error: workerError,
          processingTime
        }));
      });

      throw error;
    }
  }, [poolProcessText, detectFormat, isReady]);

  // Batch processing function
  const processBatch = useCallback(async (
    texts: string[], 
    options: TextProcessingOptions = {}
  ): Promise<FormattedOutput[]> => {
    if (!isReady) {
      throw new Error('Text processor not ready');
    }

    const results: FormattedOutput[] = [];
    const total = texts.length;
    
    startTransition(() => {
      setResult(prev => ({
        ...prev,
        isProcessing: true,
        isPending: true,
        progress: 0,
        error: null
      }));
    });

    try {
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const progress = Math.round(((i + 1) / total) * 100);
        
        startTransition(() => {
          setResult(prev => ({
            ...prev,
            progress
          }));
        });

        const result = await processText(text, options);
        results.push(result);
      }

      startTransition(() => {
        setResult(prev => ({
          ...prev,
          isProcessing: false,
          isPending: false,
          progress: 100
        }));
      });

      return results;

    } catch (error) {
      startTransition(() => {
        setResult(prev => ({
          ...prev,
          isProcessing: false,
          isPending: false,
          error: error as WorkerError
        }));
      });

      throw error;
    }
  }, [processText, isReady]);

  // Cancel processing
  const cancel = useCallback(() => {
    if (currentTaskId) {
      cancelProcessing(currentTaskId);
      setCurrentTaskId(null);
    }
    
    startTransition(() => {
      setResult(prev => ({
        ...prev,
        isProcessing: false,
        isPending: false
      }));
    });
  }, [currentTaskId, cancelProcessing]);

  // Clear results and cache
  const clear = useCallback(() => {
    startTransition(() => {
      setResult({
        formatted: null,
        isProcessing: false,
        isPending: false,
        progress: 0,
        error: null,
        confidence: 0,
        processingTime: 0
      });
    });
    
    clearCache();
  }, [clearCache]);

  // Combine processing state from pool with local state
  const combinedResult = useMemo((): ProcessingResult => ({
    ...deferredResult,
    isProcessing: deferredResult.isProcessing || processingState.isProcessing,
    isPending: isPending || processingState.isPending,
    progress: processingState.isProcessing ? processingState.progress : deferredResult.progress,
    error: processingState.error || deferredResult.error
  }), [deferredResult, processingState, isPending]);

  return {
    // Processing functions
    processText,
    processBatch,
    detectFormat,
    
    // State
    result: combinedResult,
    
    // Control
    cancel,
    clear,
    
    // Pool status
    isReady,
    poolStats: simplifiedPoolStats
  };
}

/**
 * Hook for format-specific text processing
 * Provides optimized processing for known formats
 */
export function useFormatProcessor(format: FormatType) {
  const { processText, ...rest } = useTextProcessor();

  const processForFormat = useCallback(async (
    text: string,
    options: Omit<TextProcessingOptions, 'format' | 'autoDetect'> = {}
  ): Promise<FormattedOutput> => {
    return processText(text, {
      ...options,
      format,
      autoDetect: false
    });
  }, [processText, format]);

  return {
    processText: processForFormat,
    ...rest
  };
}

/**
 * Hook for streaming text processing
 * Provides real-time processing updates for large texts
 */
export function useStreamingProcessor() {
  const { processText, ...rest } = useTextProcessor();

  const processStreaming = useCallback(async (
    text: string,
    options: TextProcessingOptions = {},
    onProgress?: (progress: number, chunk?: string) => void
  ): Promise<FormattedOutput> => {
    // Enable streaming in options
    const streamingOptions = {
      ...options,
      enableStreaming: true
    };

    // TODO: Implement actual streaming updates
    // For now, just process normally with progress callbacks
    return processText(text, streamingOptions);
  }, [processText]);

  return {
    processStreaming,
    ...rest
  };
}
