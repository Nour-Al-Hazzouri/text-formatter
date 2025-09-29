/**
 * Error Recovery and Fallback Mechanisms
 * 
 * Provides comprehensive error handling, fallback strategies, and recovery
 * mechanisms for Web Worker failures and processing errors.
 */

import type { 
  WorkerError, 
  ProcessingTask, 
  TaskResult,
  FormattedOutput 
} from '@/types/workers';
import type { FormatType } from '@/types';

/**
 * Fallback strategy types
 */
export type FallbackStrategy = 
  | 'client-side'
  | 'simplified'
  | 'cached'
  | 'manual'
  | 'none';

/**
 * Recovery action types
 */
export type RecoveryAction = 
  | 'retry'
  | 'fallback'
  | 'skip'
  | 'escalate';

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackStrategy: FallbackStrategy;
  enableClientSideFallback: boolean;
  cacheResults: boolean;
  escalationThreshold: number;
}

/**
 * Fallback processor interface
 */
export interface FallbackProcessor {
  canHandle(format: FormatType): boolean;
  process(task: ProcessingTask): Promise<FormattedOutput>;
  getCapabilities(): string[];
}

/**
 * Error recovery manager
 */
export class ErrorRecoveryManager {
  private retryAttempts: Map<string, number> = new Map();
  private fallbackProcessors: Map<FormatType, FallbackProcessor> = new Map();
  private errorHistory: Array<{ timestamp: number; error: WorkerError; taskId: string }> = [];
  private resultCache: Map<string, { result: FormattedOutput; timestamp: number }> = new Map();

  constructor(private config: ErrorRecoveryConfig) {
    this.initializeFallbackProcessors();
    this.startCacheCleanup();
  }

  /**
   * Initialize fallback processors for different formats
   */
  private initializeFallbackProcessors(): void {
    // Basic text processor fallback
    this.fallbackProcessors.set('plain-text', new BasicFallbackProcessor());
    
    // Meeting notes fallback
    this.fallbackProcessors.set('meeting-notes', new MeetingNotesFallbackProcessor());
    
    // Task lists fallback
    this.fallbackProcessors.set('task-lists', new TaskListsFallbackProcessor());
    
    // Shopping lists fallback
    this.fallbackProcessors.set('shopping-lists', new ShoppingListsFallbackProcessor());
    
    // Journal notes fallback
    this.fallbackProcessors.set('journal-notes', new JournalNotesFallbackProcessor());
    
    // Research notes fallback
    this.fallbackProcessors.set('research-notes', new ResearchNotesFallbackProcessor());
    
    // Study notes fallback
    this.fallbackProcessors.set('study-notes', new StudyNotesFallbackProcessor());
  }

  /**
   * Handle a processing error and determine recovery action
   */
  async handleError(
    error: WorkerError, 
    task: ProcessingTask
  ): Promise<{ action: RecoveryAction; result?: TaskResult }> {
    // Record error in history
    this.recordError(error, task.taskId);

    // Check if we should escalate based on error frequency
    if (this.shouldEscalate()) {
      return { action: 'escalate' };
    }

    // Determine recovery strategy based on error type
    const recoveryStrategy = this.determineRecoveryStrategy(error, task);

    switch (recoveryStrategy) {
      case 'retry':
        return this.handleRetry(task);
        
      case 'fallback':
        return await this.handleFallback(task);
        
      case 'skip':
        return { action: 'skip' };
        
      case 'escalate':
        return { action: 'escalate' };
        
      default:
        return await this.handleFallback(task);
    }
  }

  /**
   * Determine the best recovery strategy for an error
   */
  private determineRecoveryStrategy(error: WorkerError, task: ProcessingTask): RecoveryAction {
    const retryCount = this.retryAttempts.get(task.taskId) || 0;

    // Check for non-recoverable errors
    const nonRecoverableErrors = [
      'INVALID_INPUT',
      'UNSUPPORTED_FORMAT',
      'PERMISSION_DENIED',
      'QUOTA_EXCEEDED'
    ];

    if (nonRecoverableErrors.includes(error.code)) {
      return 'fallback';
    }

    // Check retry limit
    if (retryCount >= this.config.maxRetries) {
      return 'fallback';
    }

    // Determine based on error type
    switch (error.code) {
      case 'WORKER_TERMINATED':
      case 'WORKER_TIMEOUT':
      case 'NETWORK_ERROR':
        return retryCount < 2 ? 'retry' : 'fallback';
        
      case 'OUT_OF_MEMORY':
      case 'PROCESSING_TIMEOUT':
        return 'fallback'; // Don't retry memory/timeout issues
        
      case 'INITIALIZATION_ERROR':
        return retryCount === 0 ? 'retry' : 'escalate';
        
      default:
        return retryCount < this.config.maxRetries ? 'retry' : 'fallback';
    }
  }

  /**
   * Handle retry strategy
   */
  private async handleRetry(task: ProcessingTask): Promise<{ action: RecoveryAction; result?: TaskResult }> {
    const retryCount = (this.retryAttempts.get(task.taskId) || 0) + 1;
    this.retryAttempts.set(task.taskId, retryCount);

    // Calculate delay with exponential backoff
    const delay = this.config.retryDelay * Math.pow(2, retryCount - 1);
    
    // Add some jitter
    const jitter = Math.random() * 0.1 * delay;
    const finalDelay = delay + jitter;

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, finalDelay));

    return { action: 'retry' };
  }

  /**
   * Handle fallback strategy
   */
  private async handleFallback(task: ProcessingTask): Promise<{ action: RecoveryAction; result?: TaskResult }> {
    try {
      // First check if we have a cached result
      if (this.config.cacheResults) {
        const cachedResult = this.getCachedResult(task);
        if (cachedResult) {
          return {
            action: 'fallback',
            result: {
              taskId: task.taskId,
              status: 'completed',
              result: cachedResult,
              metrics: {
                duration: 0,
                stats: {
                  inputLength: task.input.text.length,
                  outputLength: cachedResult.formattedText.length,
                  processingTime: 0,
                  confidence: 0.7 // Lower confidence for cached results
                },
                workerId: 'cache',
                retryCount: this.retryAttempts.get(task.taskId) || 0
              },
              completedAt: Date.now()
            }
          };
        }
      }

      // Try client-side fallback processing
      if (this.config.enableClientSideFallback) {
        const result = await this.processWithFallback(task);
        
        if (result) {
          // Cache the result if successful
          if (this.config.cacheResults) {
            this.cacheResult(task, result);
          }

          return {
            action: 'fallback',
            result: {
              taskId: task.taskId,
              status: 'completed',
              result,
              metrics: {
                duration: 100, // Estimated
                stats: {
                  inputLength: task.input.text.length,
                  outputLength: result.formattedText.length,
                  processingTime: 100,
                  confidence: 0.6 // Lower confidence for fallback
                },
                workerId: 'fallback',
                retryCount: this.retryAttempts.get(task.taskId) || 0
              },
              completedAt: Date.now()
            }
          };
        }
      }

      // If all else fails, return a simplified result
      const simplifiedResult = this.createSimplifiedResult(task);
      return {
        action: 'fallback',
        result: {
          taskId: task.taskId,
          status: 'completed',
          result: simplifiedResult,
          metrics: {
            duration: 50,
            stats: {
              inputLength: task.input.text.length,
              outputLength: simplifiedResult.formattedText.length,
              processingTime: 50,
              confidence: 0.3 // Very low confidence
            },
            workerId: 'simplified',
            retryCount: this.retryAttempts.get(task.taskId) || 0
          },
          completedAt: Date.now()
        }
      };

    } catch (fallbackError) {
      return { action: 'escalate' };
    }
  }

  /**
   * Process task using fallback processor
   */
  private async processWithFallback(task: ProcessingTask): Promise<FormattedOutput | null> {
    const targetFormat = task.options.targetFormat;
    if (!targetFormat) {
      return null;
    }

    const processor = this.fallbackProcessors.get(targetFormat);
    if (!processor || !processor.canHandle(targetFormat)) {
      return null;
    }

    try {
      return await processor.process(task);
    } catch (error) {
      console.error('Fallback processor failed:', error);
      return null;
    }
  }

  /**
   * Create a simplified result when all processing fails
   */
  private createSimplifiedResult(task: ProcessingTask): FormattedOutput {
    const input = task.input;
    
    // Basic text cleaning and formatting
    const cleanedText = input.text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      id: `simplified_${task.taskId}`,
      formattedText: cleanedText,
      originalText: input.text,
      format: task.options.targetFormat || 'plain-text',
      metadata: {
        confidence: 0.3,
        detectedPatterns: ['basic-cleanup'],
        stats: {
          inputLength: input.text.length,
          outputLength: cleanedText.length,
          processingTime: 10,
          confidence: 0.3
        },
        suggestions: ['Manual review recommended'],
        exportOptions: ['plain-text', 'copy']
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Record error in history for analysis
   */
  private recordError(error: WorkerError, taskId: string): void {
    this.errorHistory.push({
      timestamp: Date.now(),
      error,
      taskId
    });

    // Keep only recent errors (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.errorHistory = this.errorHistory.filter(e => e.timestamp > oneHourAgo);
  }

  /**
   * Check if errors should be escalated
   */
  private shouldEscalate(): boolean {
    const recentErrors = this.errorHistory.filter(
      e => e.timestamp > Date.now() - 10 * 60 * 1000 // Last 10 minutes
    );

    return recentErrors.length >= this.config.escalationThreshold;
  }

  /**
   * Cache a successful result
   */
  private cacheResult(task: ProcessingTask, result: FormattedOutput): void {
    const cacheKey = this.getCacheKey(task);
    this.resultCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached result if available
   */
  private getCachedResult(task: ProcessingTask): FormattedOutput | null {
    const cacheKey = this.getCacheKey(task);
    const cached = this.resultCache.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    // Check if cache is still valid (1 hour)
    const maxAge = 60 * 60 * 1000;
    if (Date.now() - cached.timestamp > maxAge) {
      this.resultCache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  /**
   * Generate cache key for a task
   */
  private getCacheKey(task: ProcessingTask): string {
    const hash = this.simpleHash(task.input.text);
    return `${task.options.targetFormat || 'default'}_${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Start cache cleanup process
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const maxAge = 60 * 60 * 1000; // 1 hour
      const now = Date.now();
      
      for (const [key, value] of this.resultCache) {
        if (now - value.timestamp > maxAge) {
          this.resultCache.delete(key);
        }
      }
    }, 10 * 60 * 1000); // Clean every 10 minutes
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    recentErrors: number;
    errorsByType: Record<string, number>;
    escalationThresholdReached: boolean;
  } {
    const recentErrors = this.errorHistory.filter(
      e => e.timestamp > Date.now() - 10 * 60 * 1000
    );

    const errorsByType = this.errorHistory.reduce((acc, e) => {
      acc[e.error.code] = (acc[e.error.code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recentErrors.length,
      errorsByType,
      escalationThresholdReached: this.shouldEscalate()
    };
  }

  /**
   * Clear retry attempts for a task
   */
  clearRetryAttempts(taskId: string): void {
    this.retryAttempts.delete(taskId);
  }

  /**
   * Reset error recovery state
   */
  reset(): void {
    this.retryAttempts.clear();
    this.errorHistory = [];
    this.resultCache.clear();
  }
}

// Fallback processor implementations
class BasicFallbackProcessor implements FallbackProcessor {
  canHandle(format: FormatType): boolean {
    return true; // Can handle any format with basic processing
  }

  async process(task: ProcessingTask): Promise<FormattedOutput> {
    const cleaned = task.input.text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      id: `fallback_${task.taskId}`,
      formattedText: cleaned,
      originalText: task.input.text,
      format: task.options.targetFormat || 'plain-text',
      metadata: {
        confidence: 0.5,
        detectedPatterns: ['basic-cleanup'],
        stats: {
          inputLength: task.input.text.length,
          outputLength: cleaned.length,
          processingTime: 50,
          confidence: 0.5
        },
        suggestions: ['Basic formatting applied'],
        exportOptions: ['plain-text', 'copy']
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };
  }

  getCapabilities(): string[] {
    return ['basic-cleanup', 'text-normalization'];
  }
}

class MeetingNotesFallbackProcessor implements FallbackProcessor {
  canHandle(format: FormatType): boolean {
    return format === 'meeting-notes';
  }

  async process(task: ProcessingTask): Promise<FormattedOutput> {
    const text = task.input.text;
    
    // Simple meeting notes formatting
    const lines = text.split('\n');
    const formatted: string[] = [];
    
    formatted.push('# Meeting Notes\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Simple action item detection
      if (trimmed.toLowerCase().includes('todo') || 
          trimmed.toLowerCase().includes('action')) {
        formatted.push(`**Action Item:** ${trimmed}`);
      } else if (trimmed.length < 80 && trimmed.endsWith(':')) {
        // Potential section header
        formatted.push(`\n## ${trimmed.replace(':', '')}\n`);
      } else {
        formatted.push(`- ${trimmed}`);
      }
    });

    const result = formatted.join('\n');

    return {
      id: `meeting_fallback_${task.taskId}`,
      formattedText: result,
      originalText: text,
      format: 'meeting-notes',
      metadata: {
        confidence: 0.6,
        detectedPatterns: ['basic-structure'],
        stats: {
          inputLength: text.length,
          outputLength: result.length,
          processingTime: 100,
          confidence: 0.6
        },
        suggestions: ['Basic meeting structure applied'],
        exportOptions: ['markdown', 'plain-text', 'copy']
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };
  }

  getCapabilities(): string[] {
    return ['basic-meeting-formatting', 'action-item-detection'];
  }
}

class TaskListsFallbackProcessor implements FallbackProcessor {
  canHandle(format: FormatType): boolean {
    return format === 'task-lists';
  }

  async process(task: ProcessingTask): Promise<FormattedOutput> {
    const text = task.input.text;
    const lines = text.split('\n');
    const tasks: string[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Convert to checkbox format
      if (trimmed.match(/^[-*•]\s/)) {
        tasks.push(`- [ ] ${trimmed.substring(2)}`);
      } else if (trimmed.match(/^\d+\.\s/)) {
        tasks.push(`- [ ] ${trimmed.replace(/^\d+\.\s/, '')}`);
      } else {
        tasks.push(`- [ ] ${trimmed}`);
      }
    });

    const result = `# Task List\n\n${tasks.join('\n')}`;

    return {
      id: `tasks_fallback_${task.taskId}`,
      formattedText: result,
      originalText: text,
      format: 'task-lists',
      metadata: {
        confidence: 0.7,
        detectedPatterns: ['task-conversion'],
        stats: {
          inputLength: text.length,
          outputLength: result.length,
          processingTime: 75,
          confidence: 0.7
        },
        suggestions: ['Basic task list formatting applied'],
        exportOptions: ['markdown', 'csv', 'plain-text', 'copy']
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };
  }

  getCapabilities(): string[] {
    return ['task-conversion', 'checkbox-formatting'];
  }
}

// Additional fallback processors for other formats...
class ShoppingListsFallbackProcessor implements FallbackProcessor {
  canHandle(format: FormatType): boolean {
    return format === 'shopping-lists';
  }

  async process(task: ProcessingTask): Promise<FormattedOutput> {
    const text = task.input.text;
    const items = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(item => `- [ ] ${item.replace(/^[-*•]\s*/, '')}`);

    const result = `# Shopping List\n\n${items.join('\n')}`;

    return {
      id: `shopping_fallback_${task.taskId}`,
      formattedText: result,
      originalText: text,
      format: 'shopping-lists',
      metadata: {
        confidence: 0.6,
        detectedPatterns: ['list-items'],
        stats: {
          inputLength: text.length,
          outputLength: result.length,
          processingTime: 60,
          confidence: 0.6
        },
        suggestions: ['Basic shopping list formatting applied'],
        exportOptions: ['markdown', 'csv', 'plain-text', 'copy']
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };
  }

  getCapabilities(): string[] {
    return ['list-formatting', 'item-extraction'];
  }
}

class JournalNotesFallbackProcessor implements FallbackProcessor {
  canHandle(format: FormatType): boolean {
    return format === 'journal-notes';
  }

  async process(task: ProcessingTask): Promise<FormattedOutput> {
    const text = task.input.text;
    const paragraphs = text.split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const result = `# Journal Entry\n\n${paragraphs.join('\n\n')}`;

    return {
      id: `journal_fallback_${task.taskId}`,
      formattedText: result,
      originalText: text,
      format: 'journal-notes',
      metadata: {
        confidence: 0.5,
        detectedPatterns: ['paragraph-structure'],
        stats: {
          inputLength: text.length,
          outputLength: result.length,
          processingTime: 70,
          confidence: 0.5
        },
        suggestions: ['Basic journal formatting applied'],
        exportOptions: ['markdown', 'html', 'plain-text', 'copy']
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };
  }

  getCapabilities(): string[] {
    return ['paragraph-formatting', 'basic-structure'];
  }
}

class ResearchNotesFallbackProcessor implements FallbackProcessor {
  canHandle(format: FormatType): boolean {
    return format === 'research-notes';
  }

  async process(task: ProcessingTask): Promise<FormattedOutput> {
    const text = task.input.text;
    // Basic research notes formatting
    const result = `# Research Notes\n\n${text}`;

    return {
      id: `research_fallback_${task.taskId}`,
      formattedText: result,
      originalText: text,
      format: 'research-notes',
      metadata: {
        confidence: 0.4,
        detectedPatterns: ['basic-structure'],
        stats: {
          inputLength: text.length,
          outputLength: result.length,
          processingTime: 80,
          confidence: 0.4
        },
        suggestions: ['Basic research formatting applied'],
        exportOptions: ['markdown', 'html', 'plain-text', 'copy']
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };
  }

  getCapabilities(): string[] {
    return ['basic-formatting'];
  }
}

class StudyNotesFallbackProcessor implements FallbackProcessor {
  canHandle(format: FormatType): boolean {
    return format === 'study-notes';
  }

  async process(task: ProcessingTask): Promise<FormattedOutput> {
    const text = task.input.text;
    // Basic study notes formatting
    const result = `# Study Notes\n\n${text}`;

    return {
      id: `study_fallback_${task.taskId}`,
      formattedText: result,
      originalText: text,
      format: 'study-notes',
      metadata: {
        confidence: 0.4,
        detectedPatterns: ['basic-structure'],
        stats: {
          inputLength: text.length,
          outputLength: result.length,
          processingTime: 85,
          confidence: 0.4
        },
        suggestions: ['Basic study formatting applied'],
        exportOptions: ['markdown', 'html', 'plain-text', 'copy']
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };
  }

  getCapabilities(): string[] {
    return ['basic-formatting'];
  }
}
