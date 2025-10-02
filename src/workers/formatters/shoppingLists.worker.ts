/**
 * Shopping Lists Worker - Web Worker for shopping list formatting
 * 
 * Runs shopping list formatting in a separate thread to avoid blocking the main UI
 */

import { ShoppingListsFormatter } from '@/lib/formatting/ShoppingListsFormatter';
import type { TextInput, FormattedOutput } from '@/types/formatting';

// Worker message types
interface FormatMessage {
  type: 'format';
  payload: TextInput;
  id: string;
}

interface ResultMessage {
  type: 'result';
  payload: FormattedOutput;
  id: string;
}

interface ErrorMessage {
  type: 'error';
  error: string;
  id: string;
}

type WorkerMessage = FormatMessage;
type WorkerResponse = ResultMessage | ErrorMessage;

/**
 * Handle incoming messages
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;

  try {
    if (type === 'format') {
      // Format the shopping list
      const result = await ShoppingListsFormatter.format(payload);

      // Send result back
      const response: ResultMessage = {
        type: 'result',
        payload: result,
        id,
      };

      self.postMessage(response);
    }
  } catch (error) {
    // Send error back
    const errorResponse: ErrorMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown worker error',
      id,
    };

    self.postMessage(errorResponse);
  }
};

// Export empty object to make TypeScript happy
export {};
