/**
 * Base Worker Class - Foundation for Text Processing Workers
 * 
 * Provides lifecycle management, error handling, and communication utilities
 * for all text processing workers in the application.
 */

import type { 
  WorkerMessage, 
  WorkerResponse, 
  WorkerError,
  WorkerStatus,
  ProcessingTask,
  TaskResult,
  CancellationToken
} from '@/types/workers';

/**
 * Base class for all text processing workers
 * Handles initialization, communication, error recovery, and cleanup
 */
export abstract class BaseWorker {
  protected workerId: string;
  protected status: WorkerStatus = 'initializing';
  protected currentTaskId?: string;
  protected cancellationTokens: Map<string, CancellationToken> = new Map();
  private messageHandlers: Map<string, (message: WorkerMessage<any>) => void> = new Map();
  protected initialized: boolean = false;
  protected startTime: number = Date.now();
  protected tasksProcessed: number = 0;
  protected errorCount: number = 0;

  constructor(workerId?: string) {
    this.workerId = workerId || this.generateWorkerId();
    this.setupMessageHandlers();
    this.initialize();
  }

  /**
   * Initialize the worker
   */
  private async initialize(): Promise<void> {
    try {
      this.status = 'initializing';
      
      // Perform worker-specific initialization
      await this.onInitialize();
      
      this.status = 'idle';
      this.initialized = true;
      
      // Send ready message to main thread
      this.sendMessage({
        id: this.generateMessageId(),
        type: 'WORKER_READY',
        payload: {
          workerId: this.workerId,
          capabilities: this.getCapabilities(),
          timestamp: Date.now()
        },
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.handleInitializationError(error);
    }
  }

  /**
   * Abstract method for worker-specific initialization
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Abstract method to get worker capabilities
   */
  protected abstract getCapabilities(): string[];

  /**
   * Abstract method for text processing implementation
   */
  protected abstract processText(
    task: ProcessingTask, 
    cancellationToken: CancellationToken
  ): Promise<any>;

  /**
   * Setup message handlers for communication
   */
  private setupMessageHandlers(): void {
    // Listen for messages from main thread
    self.addEventListener('message', (event: MessageEvent) => {
      this.handleMessage(event.data);
    });

    // Handle worker termination
    self.addEventListener('beforeunload', () => {
      this.terminate('shutdown');
    });

    // Register core message handlers
    this.registerHandler('PROCESS_TEXT', this.handleProcessText.bind(this));
    this.registerHandler('CANCEL_PROCESSING', this.handleCancelProcessing.bind(this));
    this.registerHandler('GET_STATUS', this.handleGetStatus.bind(this));
    this.registerHandler('TERMINATE', this.handleTerminate.bind(this));
  }

  /**
   * Register a message handler
   */
  protected registerHandler(
    type: string, 
    handler: (message: WorkerMessage<any>) => void
  ): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WorkerMessage): void {
    try {
      const handler = this.messageHandlers.get(message.type);
      
      if (handler) {
        handler(message);
      } else {
        this.sendErrorResponse(message.id, {
          message: `Unknown message type: ${message.type}`,
          code: 'UNKNOWN_MESSAGE_TYPE'
        });
      }
      
    } catch (error) {
      this.sendErrorResponse(message.id, {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'MESSAGE_HANDLING_ERROR',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Handle text processing requests
   */
  private async handleProcessText(message: WorkerMessage<ProcessingTask>): Promise<void> {
    const task = message.payload;
    
    try {
      this.status = 'busy';
      this.currentTaskId = task.taskId;
      
      // Create cancellation token
      const cancellationToken = this.createCancellationToken(task.taskId);
      
      // Start processing timer
      const startTime = Date.now();
      
      // Process the text
      const result = await this.processText(task, cancellationToken);
      
      // Calculate processing duration
      const duration = Date.now() - startTime;
      
      // Create task result
      const taskResult: TaskResult = {
        taskId: task.taskId,
        status: 'completed',
        result,
        metrics: {
          duration,
          stats: result?.metadata?.stats || {
            inputLength: task.input.content.length,
            outputLength: result?.formattedText?.length || 0,
            processingTime: duration,
            confidence: result?.metadata?.confidence || 0
          },
          workerId: this.workerId,
          retryCount: 0
        },
        completedAt: Date.now()
      };
      
      // Send success response
      this.sendResponse(message.id, taskResult, true);
      
      // Update worker state
      this.tasksProcessed++;
      this.status = 'idle';
      this.currentTaskId = undefined;
      this.cancellationTokens.delete(task.taskId);
      
    } catch (error) {
      this.handleProcessingError(message.id, task, error);
    }
  }

  /**
   * Handle processing cancellation
   */
  private handleCancelProcessing(message: WorkerMessage<{ taskId: string }>): void {
    const { taskId } = message.payload;
    
    const cancellationToken = this.cancellationTokens.get(taskId);
    if (cancellationToken) {
      cancellationToken.isCancelled = true;
      cancellationToken.reason = 'User cancelled';
      cancellationToken.cancelledAt = Date.now();
      
      this.sendResponse(message.id, { 
        taskId, 
        status: 'cancelled' 
      }, true);
    }
  }

  /**
   * Handle status requests
   */
  private handleGetStatus(message: WorkerMessage): void {
    const statusInfo = {
      workerId: this.workerId,
      status: this.status,
      currentTaskId: this.currentTaskId,
      tasksProcessed: this.tasksProcessed,
      errorCount: this.errorCount,
      uptime: Date.now() - this.startTime,
      memoryUsage: this.getMemoryUsage()
    };
    
    this.sendResponse(message.id, statusInfo, true);
  }

  /**
   * Handle termination requests
   */
  private handleTerminate(message: WorkerMessage<{ graceful: boolean }>): void {
    const { graceful } = message.payload;
    
    if (graceful && this.currentTaskId) {
      // Allow current task to complete
      setTimeout(() => {
        this.terminate('manual');
      }, 5000); // 5 second grace period
    } else {
      this.terminate('manual');
    }
    
    this.sendResponse(message.id, { terminated: true }, true);
  }

  /**
   * Create a cancellation token for a task
   */
  private createCancellationToken(taskId: string): CancellationToken {
    const token: CancellationToken = {
      isCancelled: false,
      throwIfCancelled: () => {
        if (token.isCancelled) {
          throw new Error(`Task ${taskId} was cancelled: ${token.reason}`);
        }
      }
    };
    
    this.cancellationTokens.set(taskId, token);
    return token;
  }

  /**
   * Send a message to the main thread
   */
  protected sendMessage(message: WorkerMessage): void {
    try {
      if (message.transferList && message.transferList.length > 0) {
        self.postMessage(message, { transfer: message.transferList });
      } else {
        self.postMessage(message);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  /**
   * Send a response to the main thread
   */
  protected sendResponse<T>(
    originalMessageId: string, 
    payload: T, 
    success: boolean = true,
    error?: WorkerError
  ): void {
    const response: WorkerResponse<T> = {
      id: this.generateMessageId(),
      type: success ? 'PROCESSING_COMPLETE' : 'PROCESSING_ERROR',
      payload,
      timestamp: Date.now(),
      success,
      error,
      originalMessageId
    };
    
    this.sendMessage(response);
  }

  /**
   * Send an error response
   */
  protected sendErrorResponse(originalMessageId: string, error: WorkerError): void {
    this.errorCount++;
    this.sendResponse(originalMessageId, null, false, error);
  }

  /**
   * Handle processing errors
   */
  private handleProcessingError(
    messageId: string, 
    task: ProcessingTask, 
    error: unknown
  ): void {
    this.errorCount++;
    this.status = 'idle';
    this.currentTaskId = undefined;
    
    const workerError: WorkerError = {
      message: error instanceof Error ? error.message : 'Unknown processing error',
      code: 'PROCESSING_ERROR',
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        taskId: task.taskId,
        workerId: this.workerId
      }
    };
    
    this.sendErrorResponse(messageId, workerError);
  }

  /**
   * Handle initialization errors
   */
  private handleInitializationError(error: unknown): void {
    this.status = 'error';
    this.errorCount++;
    
    const workerError: WorkerError = {
      message: error instanceof Error ? error.message : 'Worker initialization failed',
      code: 'INITIALIZATION_ERROR',
      stack: error instanceof Error ? error.stack : undefined
    };
    
    this.sendMessage({
      id: this.generateMessageId(),
      type: 'WORKER_ERROR',
      payload: workerError,
      timestamp: Date.now()
    });
  }

  /**
   * Terminate the worker
   */
  private terminate(reason: string): void {
    this.status = 'terminated';
    
    // Cancel all active tasks
    for (const [taskId, token] of this.cancellationTokens) {
      token.isCancelled = true;
      token.reason = `Worker terminated: ${reason}`;
      token.cancelledAt = Date.now();
    }
    
    // Clean up resources
    this.onTerminate();
    
    // Close the worker
    self.close();
  }

  /**
   * Abstract method for cleanup on termination
   */
  protected onTerminate(): void {
    // Override in subclasses for cleanup
  }

  /**
   * Generate unique worker ID
   */
  private generateWorkerId(): string {
    return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  protected generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current memory usage (if available)
   */
  private getMemoryUsage(): number | undefined {
    if ('performance' in self && 'memory' in (self.performance as any)) {
      return (self.performance as any).memory?.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Send progress update
   */
  protected sendProgressUpdate(
    taskId: string, 
    progress: number, 
    currentStep: string,
    eta?: number
  ): void {
    this.sendMessage({
      id: this.generateMessageId(),
      type: 'PROGRESS_UPDATE',
      payload: {
        taskId,
        progress,
        currentStep,
        eta
      },
      timestamp: Date.now()
    });
  }
}
