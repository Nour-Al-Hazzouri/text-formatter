/**
 * Worker Communication Utilities
 * 
 * Utilities for efficient communication between main thread and workers,
 * including transferable objects, message serialization, and error handling.
 */

import type { 
  WorkerMessage, 
  WorkerResponse, 
  WorkerError,
  ProcessingTask 
} from '@/types/workers';

/**
 * Message serialization utilities
 */
export class MessageSerializer {
  /**
   * Serialize a message for worker communication
   * Handles transferable objects and large data efficiently
   */
  static serialize<T>(
    message: WorkerMessage<T>
  ): { message: WorkerMessage<T>; transferList: Transferable[] } {
    const transferList: Transferable[] = [];
    const serializedMessage = this.processForTransfer(message, transferList);
    
    return {
      message: serializedMessage,
      transferList
    };
  }

  /**
   * Process message payload for transferable objects
   */
  private static processForTransfer<T>(
    obj: T, 
    transferList: Transferable[]
  ): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      // Handle large text as transferable ArrayBuffer if beneficial
      if (obj.length > 50000) { // 50KB threshold
        const encoder = new TextEncoder();
        const buffer = encoder.encode(obj);
        transferList.push(buffer.buffer);
        return buffer as unknown as T;
      }
      return obj;
    }

    if (obj instanceof ArrayBuffer) {
      transferList.push(obj);
      return obj;
    }

    if (obj instanceof Uint8Array || obj instanceof Uint16Array || obj instanceof Uint32Array) {
      transferList.push(obj.buffer);
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.processForTransfer(item, transferList)) as T;
    }

    if (typeof obj === 'object') {
      const processed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        processed[key] = this.processForTransfer(value, transferList);
      }
      return processed;
    }

    return obj;
  }

  /**
   * Deserialize a message received from worker
   */
  static deserialize<T>(data: any): WorkerMessage<T> | WorkerResponse<T> {
    return this.processFromTransfer(data);
  }

  /**
   * Process received data from transferable objects
   */
  private static processFromTransfer<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj instanceof Uint8Array) {
      // Convert back to string if it was originally text
      const decoder = new TextDecoder();
      try {
        return decoder.decode(obj) as unknown as T;
      } catch {
        return obj;
      }
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.processFromTransfer(item)) as T;
    }

    if (typeof obj === 'object') {
      const processed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        processed[key] = this.processFromTransfer(value);
      }
      return processed;
    }

    return obj;
  }
}

/**
 * Worker communication manager for main thread
 */
export class WorkerCommunicator {
  private pendingMessages: Map<string, {
    resolve: (value: any) => void;
    reject: (error: WorkerError) => void;
    timeout?: NodeJS.Timeout;
  }> = new Map();

  private messageId = 0;

  constructor(private worker: Worker) {
    this.setupMessageHandling();
  }

  /**
   * Setup message handling for the worker
   */
  private setupMessageHandling(): void {
    this.worker.addEventListener('message', (event: MessageEvent) => {
      const data = MessageSerializer.deserialize(event.data);
      
      if ('originalMessageId' in data) {
        // This is a response to a previous message
        this.handleResponse(data as WorkerResponse);
      } else {
        // This is an unsolicited message (status update, etc.)
        this.handleUnsolicited(data as WorkerMessage);
      }
    });

    this.worker.addEventListener('error', (error: ErrorEvent) => {
      this.handleWorkerError(error);
    });
  }

  /**
   * Send a message to the worker and wait for response
   */
  async sendMessage<TPayload, TResponse>(
    type: string,
    payload: TPayload,
    timeout: number = 30000
  ): Promise<TResponse> {
    const messageId = this.generateMessageId();
    
    const message: WorkerMessage<TPayload> = {
      id: messageId,
      type: type as any,
      payload,
      timestamp: Date.now()
    };

    const { message: serializedMessage, transferList } = MessageSerializer.serialize(message);

    return new Promise<TResponse>((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject({
          message: `Message timeout after ${timeout}ms`,
          code: 'MESSAGE_TIMEOUT'
        } as WorkerError);
      }, timeout);

      // Store pending message handlers
      this.pendingMessages.set(messageId, {
        resolve,
        reject,
        timeout: timeoutHandle
      });

      // Send message to worker
      this.worker.postMessage(serializedMessage, transferList);
    });
  }

  /**
   * Send a fire-and-forget message
   */
  sendMessageAsync<T>(type: string, payload: T): void {
    const message: WorkerMessage<T> = {
      id: this.generateMessageId(),
      type: type as any,
      payload,
      timestamp: Date.now()
    };

    const { message: serializedMessage, transferList } = MessageSerializer.serialize(message);
    this.worker.postMessage(serializedMessage, transferList);
  }

  /**
   * Handle response messages from worker
   */
  private handleResponse(response: WorkerResponse): void {
    const pending = this.pendingMessages.get(response.originalMessageId);
    
    if (pending) {
      // Clear timeout
      if (pending.timeout) {
        clearTimeout(pending.timeout);
      }
      
      // Remove from pending messages
      this.pendingMessages.delete(response.originalMessageId);
      
      // Resolve or reject based on success
      if (response.success) {
        pending.resolve(response.payload);
      } else {
        pending.reject(response.error || {
          message: 'Unknown error',
          code: 'UNKNOWN_ERROR'
        });
      }
    }
  }

  /**
   * Handle unsolicited messages from worker
   */
  private handleUnsolicited(message: WorkerMessage): void {
    // Emit events for unsolicited messages (status updates, etc.)
    this.emit(message.type, message.payload);
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    const workerError: WorkerError = {
      message: error.message,
      code: 'WORKER_ERROR',
      stack: error.error?.stack
    };

    // Reject all pending messages
    for (const [messageId, pending] of this.pendingMessages) {
      if (pending.timeout) {
        clearTimeout(pending.timeout);
      }
      pending.reject(workerError);
    }
    
    this.pendingMessages.clear();
    this.emit('error', workerError);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${++this.messageId}_${Date.now()}`;
  }

  /**
   * Simple event emitter for unsolicited messages
   */
  private eventHandlers: Map<string, Set<Function>> = new Map();

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Terminate the worker and clean up
   */
  terminate(): void {
    // Reject all pending messages
    for (const [messageId, pending] of this.pendingMessages) {
      if (pending.timeout) {
        clearTimeout(pending.timeout);
      }
      pending.reject({
        message: 'Worker terminated',
        code: 'WORKER_TERMINATED'
      });
    }
    
    this.pendingMessages.clear();
    this.eventHandlers.clear();
    this.worker.terminate();
  }
}

/**
 * Batch message processor for efficient communication
 */
export class BatchMessageProcessor {
  private batchQueue: WorkerMessage[] = [];
  private batchTimeout?: NodeJS.Timeout;
  private readonly batchSize: number;
  private readonly batchDelay: number;

  constructor(
    private communicator: WorkerCommunicator,
    batchSize: number = 10,
    batchDelay: number = 16 // ~60fps
  ) {
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  /**
   * Queue a message for batch processing
   */
  queueMessage<T>(type: string, payload: T): void {
    const message: WorkerMessage<T> = {
      id: `batch_${Date.now()}_${Math.random()}`,
      type: type as any,
      payload,
      timestamp: Date.now()
    };

    this.batchQueue.push(message);

    // Process batch if size limit reached
    if (this.batchQueue.length >= this.batchSize) {
      this.processBatch();
    } else {
      // Schedule batch processing
      this.scheduleBatchProcessing();
    }
  }

  /**
   * Schedule batch processing with delay
   */
  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) {
      return; // Already scheduled
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  /**
   * Process the current batch
   */
  private processBatch(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = undefined;
    }

    if (this.batchQueue.length === 0) {
      return;
    }

    // Send batch to worker
    this.communicator.sendMessageAsync('BATCH_PROCESS', {
      messages: this.batchQueue,
      batchId: `batch_${Date.now()}`
    });

    // Clear the queue
    this.batchQueue = [];
  }

  /**
   * Force immediate processing of current batch
   */
  flush(): void {
    this.processBatch();
  }
}

/**
 * Error recovery utilities
 */
export class WorkerErrorRecovery {
  /**
   * Determine if an error is recoverable
   */
  static isRecoverable(error: WorkerError): boolean {
    const recoverableCodes = [
      'MESSAGE_TIMEOUT',
      'NETWORK_ERROR', 
      'TEMPORARY_UNAVAILABLE',
      'RATE_LIMITED'
    ];

    return recoverableCodes.includes(error.code);
  }

  /**
   * Calculate retry delay using exponential backoff
   */
  static calculateRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
    const exponentialDelay = baseDelay * Math.pow(2, attemptNumber - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Retry a failed operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          break;
        }

        // Check if error is recoverable
        if (error instanceof Error && 'code' in error) {
          const workerError = error as unknown as WorkerError;
          if (!this.isRecoverable(workerError)) {
            break; // Don't retry non-recoverable errors
          }
        }

        // Wait before retry
        const delay = this.calculateRetryDelay(attempt, baseDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
