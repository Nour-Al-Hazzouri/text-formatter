/**
 * Error Recovery and Fallback Mechanisms
 * 
 * Provides comprehensive error handling, fallback strategies, and recovery
 * mechanisms for Web Worker failures and processing errors.
 */

import type { 
  WorkerError, 
  ProcessingTask, 
  TaskResult
} from '../../types/workers';
import type { FormattedOutput } from '../../types/formatting';
import type { FormatType } from '../../types';

/**
 * Fallback strategy types
 */
export type FallbackStrategy = 
  | 'client-side'
  | 'simplified'
  | 'cached'
  | 'manual'
  | 'skip';

/**
 * Recovery action result
 */
export interface RecoveryAction {
  action: 'retry' | 'fallback' | 'skip' | 'manual';
  result?: TaskResult;
  delay?: number;
  strategy?: FallbackStrategy;
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
  enableClientSideFallback: boolean;
  enableCaching: boolean;
  cacheExpiration: number;
  fallbackStrategy: FallbackStrategy;
}

/**
 * Fallback processor interface
 */
interface FallbackProcessor {
  canHandle(format: FormatType): boolean;
  process(task: ProcessingTask): Promise<FormattedOutput>;
  getCapabilities(): string[];
}

/**
 * Comprehensive error recovery manager
 */
export class ErrorRecoveryManager {
  private retryAttempts: Map<string, number> = new Map();
  private errorHistory: Map<string, WorkerError[]> = new Map();
  private cache: Map<string, { result: FormattedOutput; timestamp: number }> = new Map();
  private fallbackProcessors: Map<FormatType, FallbackProcessor> = new Map();

  constructor(private config: ErrorRecoveryConfig) {
    this.initializeFallbackProcessors();
    this.startCacheCleanup();
  }

  /**
   * Initialize fallback processors for different formats
   */
  private initializeFallbackProcessors(): void {
    // Basic text processor fallback
    this.fallbackProcessors.set('journal-notes', new BasicFallbackProcessor());
    
    // Meeting notes fallback
    this.fallbackProcessors.set('meeting-notes', new MeetingNotesFallbackProcessor());
    
    // Task lists fallback
    this.fallbackProcessors.set('task-lists', new TaskListsFallbackProcessor());
    
    // Shopping lists fallback
    this.fallbackProcessors.set('shopping-lists', new ShoppingListsFallbackProcessor());
    
    // Additional format processors
    this.fallbackProcessors.set('research-notes', new ResearchNotesFallbackProcessor());
    this.fallbackProcessors.set('study-notes', new StudyNotesFallbackProcessor());
  }

  /**
   * Recover from worker error with appropriate strategy
   */
  async recover(error: WorkerError, task: ProcessingTask): Promise<RecoveryAction> {
    const taskId = task.taskId;
    
    // Record error for analysis
    this.recordError(error, taskId);
    
    // Get current retry count
    const retryCount = this.retryAttempts.get(taskId) || 0;
    
    // Determine recovery strategy
    if (retryCount < this.config.maxRetries && this.shouldRetry(error)) {
      return this.handleRetry(taskId, retryCount);
    }
    
    // Try fallback strategies
    return this.handleFallback(task, error);
  }

  /**
   * Handle retry logic with exponential backoff
   */
  private handleRetry(taskId: string, retryCount: number): RecoveryAction {
    this.retryAttempts.set(taskId, retryCount + 1);
    
    let delay = this.config.retryDelayMs;
    if (this.config.exponentialBackoff) {
      delay = Math.min(delay * Math.pow(2, retryCount), 30000); // Max 30 seconds
    }
    
    return {
      action: 'retry',
      delay
    };
  }

  /**
   * Handle fallback processing strategies
   */
  private async handleFallback(task: ProcessingTask, error: WorkerError): Promise<RecoveryAction> {
    try {
      // Try cached result first
      if (this.config.enableCaching) {
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
                  linesProcessed: task.input.content.split('\n').length,
                  patternsMatched: 0,
                  itemsExtracted: 0,
                  duplicatesRemoved: 0,
                  changesApplied: 0
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
          // Cache the result
          if (this.config.enableCaching) {
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
                  linesProcessed: task.input.content.split('\n').length,
                  patternsMatched: 1,
                  itemsExtracted: 0,
                  duplicatesRemoved: 0,
                  changesApplied: 1
                },
                workerId: 'fallback',
                retryCount: this.retryAttempts.get(task.taskId) || 0
              },
              completedAt: Date.now()
            }
          };
        }
      }

      // Return simplified result as last resort
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
              linesProcessed: task.input.content.split('\n').length,
              patternsMatched: 0,
              itemsExtracted: 0,
              duplicatesRemoved: 0,
              changesApplied: 1
            },
            workerId: 'simplified',
            retryCount: this.retryAttempts.get(task.taskId) || 0
          },
          completedAt: Date.now()
        }
      };

    } catch (fallbackError) {
      // Complete failure - return skip action
      return {
        action: 'skip'
      };
    }
  }

  /**
   * Create a simplified result when all processing fails
   */
  private createSimplifiedResult(task: ProcessingTask): FormattedOutput {
    const input = task.input;
    
    // Basic text cleaning and formatting
    const cleanedText = input.content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      content: cleanedText,
      format: task.options.targetFormat || 'journal-notes',
      metadata: {
        processedAt: new Date(),
        duration: 10,
        confidence: 30, // Low confidence
        itemCount: 1,
        stats: {
          linesProcessed: input.content.split('\n').length,
          patternsMatched: 0,
          itemsExtracted: 0,
          duplicatesRemoved: 0,
          changesApplied: 1
        }
      },
      data: {
        common: {
          dates: [],
          urls: [],
          emails: [],
          phoneNumbers: [],
          mentions: [],
          hashtags: []
        },
        formatSpecific: {
          entries: [],
          insights: ['Basic text cleanup applied'],
          topics: [],
          mood: undefined
        }
      },
      warnings: ['Simplified processing applied due to worker errors']
    };
  }

  /**
   * Process task with appropriate fallback processor
   */
  private async processWithFallback(task: ProcessingTask): Promise<FormattedOutput | null> {
    const targetFormat = task.options.targetFormat;
    if (!targetFormat) return null;

    const processor = this.fallbackProcessors.get(targetFormat);
    if (!processor || !processor.canHandle(targetFormat)) {
      // Try basic processor as last resort
      const basicProcessor = this.fallbackProcessors.get('journal-notes');
      if (basicProcessor) {
        return await basicProcessor.process(task);
      }
      return null;
    }

    return await processor.process(task);
  }

  /**
   * Determine if error should trigger retry
   */
  private shouldRetry(error: WorkerError): boolean {
    const retryableErrors = [
      'WORKER_TIMEOUT',
      'NETWORK_ERROR',
      'TEMPORARY_FAILURE',
      'RESOURCE_EXHAUSTED'
    ];
    
    return retryableErrors.includes(error.code);
  }

  /**
   * Cache processing result
   */
  private cacheResult(task: ProcessingTask, result: FormattedOutput): void {
    const cacheKey = this.getCacheKey(task);
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(task: ProcessingTask): FormattedOutput | null {
    const cacheKey = this.getCacheKey(task);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.config.cacheExpiration;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  /**
   * Generate cache key for a task
   */
  private getCacheKey(task: ProcessingTask): string {
    const hash = this.simpleHash(task.input.content);
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
    
    return hash.toString();
  }

  /**
   * Record error in history for analysis
   */
  private recordError(error: WorkerError, taskId: string): void {
    const history = this.errorHistory.get(taskId) || [];
    history.push(error);
    
    // Keep only last 10 errors per task
    if (history.length > 10) {
      history.shift();
    }
    
    this.errorHistory.set(taskId, history);
  }

  /**
   * Clean up expired cache entries
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp > this.config.cacheExpiration) {
          this.cache.delete(key);
        }
      }
    }, this.config.cacheExpiration / 2);
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): { totalErrors: number; errorsByType: Record<string, number> } {
    let totalErrors = 0;
    const errorsByType: Record<string, number> = {};

    for (const errors of this.errorHistory.values()) {
      totalErrors += errors.length;
      for (const error of errors) {
        errorsByType[error.code] = (errorsByType[error.code] || 0) + 1;
      }
    }

    return { totalErrors, errorsByType };
  }

  /**
   * Clear error history and retry counts
   */
  reset(): void {
    this.retryAttempts.clear();
    this.errorHistory.clear();
    this.cache.clear();
  }
}

// Fallback processor implementations
class BasicFallbackProcessor implements FallbackProcessor {
  canHandle(format: FormatType): boolean {
    return true; // Can handle any format with basic processing
  }

  async process(task: ProcessingTask): Promise<FormattedOutput> {
    const cleaned = task.input.content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      content: cleaned,
      format: task.options.targetFormat || 'journal-notes',
      metadata: {
        processedAt: new Date(),
        duration: 50,
        confidence: 50,
        itemCount: 1,
        stats: {
          linesProcessed: task.input.content.split('\n').length,
          patternsMatched: 1,
          itemsExtracted: 0,
          duplicatesRemoved: 0,
          changesApplied: 1
        }
      },
      data: {
        common: {
          dates: [],
          urls: [],
          emails: [],
          phoneNumbers: [],
          mentions: [],
          hashtags: []
        },
        formatSpecific: {
          entries: [],
          insights: ['Basic formatting applied'],
          topics: [],
          mood: undefined
        }
      }
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
    const text = task.input.content;
    
    // Simple meeting notes formatting
    const lines = text.split('\n');
    const formatted: string[] = [];
    
    formatted.push('# Meeting Notes\n');
    
    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Basic action item detection
      if (trimmed.toLowerCase().includes('action') || trimmed.toLowerCase().includes('todo')) {
        formatted.push(`**Action:** ${trimmed}`);
      } else {
        formatted.push(trimmed);
      }
    });

    const result = formatted.join('\n');

    return {
      content: result,
      format: 'meeting-notes',
      metadata: {
        processedAt: new Date(),
        duration: 100,
        confidence: 60,
        itemCount: lines.length,
        stats: {
          linesProcessed: lines.length,
          patternsMatched: 1,
          itemsExtracted: 0,
          duplicatesRemoved: 0,
          changesApplied: 1
        }
      },
      data: {
        common: {
          dates: [],
          urls: [],
          emails: [],
          phoneNumbers: [],
          mentions: [],
          hashtags: []
        },
        formatSpecific: {
          attendees: [],
          agendaItems: [],
          actionItems: [],
          decisions: [],
          meeting: {
            date: new Date(),
            duration: undefined
          }
        }
      }
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
    const text = task.input.content;
    const lines = text.split('\n');
    const tasks: string[] = [];

    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Convert to checkbox format
      if (trimmed.match(/^[-*•]\s/)) {
        tasks.push(`- [ ] ${trimmed.substring(2)}`);
      } else {
        tasks.push(`- [ ] ${trimmed}`);
      }
    });

    const result = `# Task List\n\n${tasks.join('\n')}`;

    return {
      content: result,
      format: 'task-lists',
      metadata: {
        processedAt: new Date(),
        duration: 75,
        confidence: 70,
        itemCount: tasks.length,
        stats: {
          linesProcessed: lines.length,
          patternsMatched: tasks.length,
          itemsExtracted: tasks.length,
          duplicatesRemoved: 0,
          changesApplied: tasks.length
        }
      },
      data: {
        common: {
          dates: [],
          urls: [],
          emails: [],
          phoneNumbers: [],
          mentions: [],
          hashtags: []
        },
        formatSpecific: {
          categories: [],
          tasks: tasks.map((task, index) => ({
            id: `task_${index}`,
            description: task.replace('- [ ] ', ''),
            text: task.replace('- [ ] ', ''),
            completed: false,
            status: 'pending' as const,
            priority: 'medium' as const,
            dueDate: undefined,
            tags: []
          })),
          stats: {
            total: tasks.length,
            completed: 0,
            pending: tasks.length,
            overdue: 0
          }
        }
      }
    };
  }

  getCapabilities(): string[] {
    return ['task-conversion', 'checkbox-formatting'];
  }
}

// Additional fallback processors...
class ShoppingListsFallbackProcessor implements FallbackProcessor {
  canHandle(format: FormatType): boolean {
    return format === 'shopping-lists';
  }

  async process(task: ProcessingTask): Promise<FormattedOutput> {
    const text = task.input.content;
    const items = text.split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((item: string) => `- [ ] ${item.replace(/^[-*•]\s*/, '')}`);

    const result = `# Shopping List\n\n${items.join('\n')}`;

    return {
      content: result,
      format: 'shopping-lists',
      metadata: {
        processedAt: new Date(),
        duration: 60,
        confidence: 60,
        itemCount: items.length,
        stats: {
          linesProcessed: text.split('\n').length,
          patternsMatched: items.length,
          itemsExtracted: items.length,
          duplicatesRemoved: 0,
          changesApplied: items.length
        }
      },
      data: {
        common: {
          dates: [],
          urls: [],
          emails: [],
          phoneNumbers: [],
          mentions: [],
          hashtags: []
        },
        formatSpecific: {
          categories: [],
          items: items.map((item, index) => ({
            id: `item_${index}`,
            name: item.replace('- [ ] ', ''),
            checked: false,
            category: 'general',
            quantity: undefined
          })),
          stats: {
            totalItems: items.length,
            totalCategories: 0,
            estimatedCost: undefined
          }
        }
      }
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
    const text = task.input.content;
    const paragraphs = text.split(/\n\s*\n/)
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    const result = `# Journal Entry\n\n${paragraphs.join('\n\n')}`;

    return {
      content: result,
      format: 'journal-notes',
      metadata: {
        processedAt: new Date(),
        duration: 70,
        confidence: 50,
        itemCount: paragraphs.length,
        stats: {
          linesProcessed: text.split('\n').length,
          patternsMatched: 1,
          itemsExtracted: paragraphs.length,
          duplicatesRemoved: 0,
          changesApplied: 1
        }
      },
      data: {
        common: {
          dates: [],
          urls: [],
          emails: [],
          phoneNumbers: [],
          mentions: [],
          hashtags: []
        },
        formatSpecific: {
          entries: paragraphs.map((content, index) => ({
            timestamp: new Date(),
            content,
            tags: []
          })),
          insights: ['Basic journal formatting applied'],
          topics: [],
          mood: undefined
        }
      }
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
    const text = task.input.content;
    const result = `# Research Notes\n\n${text}`;

    return {
      content: result,
      format: 'research-notes',
      metadata: {
        processedAt: new Date(),
        duration: 80,
        confidence: 40,
        itemCount: 1,
        stats: {
          linesProcessed: text.split('\n').length,
          patternsMatched: 0,
          itemsExtracted: 0,
          duplicatesRemoved: 0,
          changesApplied: 1
        }
      },
      data: {
        common: {
          dates: [],
          urls: [],
          emails: [],
          phoneNumbers: [],
          mentions: [],
          hashtags: []
        },
        formatSpecific: {
          citations: [],
          quotes: [],
          topics: [],
          sources: []
        }
      }
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
    const text = task.input.content;
    const result = `# Study Notes\n\n${text}`;

    return {
      content: result,
      format: 'study-notes',
      metadata: {
        processedAt: new Date(),
        duration: 85,
        confidence: 40,
        itemCount: 1,
        stats: {
          linesProcessed: text.split('\n').length,
          patternsMatched: 0,
          itemsExtracted: 0,
          duplicatesRemoved: 0,
          changesApplied: 1
        }
      },
      data: {
        common: {
          dates: [],
          urls: [],
          emails: [],
          phoneNumbers: [],
          mentions: [],
          hashtags: []
        },
        formatSpecific: {
          outline: [],
          qaPairs: [],
          definitions: [],
          topics: []
        }
      }
    };
  }

  getCapabilities(): string[] {
    return ['basic-formatting'];
  }
}
