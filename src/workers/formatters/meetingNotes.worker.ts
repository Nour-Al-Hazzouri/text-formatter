/**
 * Meeting Notes Worker - Web Worker for meeting notes processing
 * 
 * Processes meeting notes formatting in background thread
 */

import type { WorkerMessage, WorkerResponse } from '../../types/workers';
import type { TextInput } from '../../types/formatting';
import { MeetingNotesFormatter } from '../../lib/formatting/MeetingNotesFormatter';

/**
 * Handle incoming messages from main thread
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;

  try {
    if (type === 'PROCESS_TEXT') {
      // Type cast payload to expected format
      const textPayload = payload as { text: string; options?: unknown };
      
      const input: TextInput = {
        content: textPayload.text,
        metadata: {
          source: 'type',
          timestamp: new Date(),
          size: textPayload.text.length,
        },
      };

      // Process meeting notes
      const result = await MeetingNotesFormatter.format(input);

      // Validate output
      const validation = MeetingNotesFormatter.validate(result);

      // Send success response
      const response: WorkerResponse = {
        id: `response-${id}`,
        type: 'PROCESS_TEXT',
        payload: result,
        timestamp: Date.now(),
        success: true,
        originalMessageId: id,
      };

      self.postMessage(response);
    } else if (type === 'TERMINATE') {
      self.close();
    }
  } catch (error) {
    // Send error response
    const response: WorkerResponse = {
      id: `error-${id}`,
      type: 'PROCESS_TEXT',
      payload: null,
      timestamp: Date.now(),
      success: false,
      originalMessageId: id,
      error: {
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined,
      },
    };

    self.postMessage(response);
  }
};

// Worker is ready
self.postMessage({ type: 'ready' });
