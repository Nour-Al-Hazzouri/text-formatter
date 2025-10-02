/**
 * Formatting Library - Core Text Processing and Format Implementations
 * 
 * Central export point for all text formatting functionality
 */

// Core formatters
export { MeetingNotesFormatter } from './MeetingNotesFormatter';
export { TaskListsFormatter } from './TaskListsFormatter';
export { ShoppingListsFormatter } from './ShoppingListsFormatter';

// Formatter registry for dynamic loading
import { MeetingNotesFormatter } from './MeetingNotesFormatter';
import { TaskListsFormatter } from './TaskListsFormatter';
import { ShoppingListsFormatter } from './ShoppingListsFormatter';
import type { FormatType } from '@/types';

export const FORMATTERS = {
  'meeting-notes': MeetingNotesFormatter,
  'task-lists': TaskListsFormatter,
  'shopping-lists': ShoppingListsFormatter,
  // TODO: Add remaining formatters
  // 'journal-notes': JournalNotesFormatter,
  // 'research-notes': ResearchNotesFormatter,
  // 'study-notes': StudyNotesFormatter,
} as const;

/**
 * Get formatter for a specific format type
 */
export function getFormatter(formatType: FormatType) {
  return FORMATTERS[formatType as keyof typeof FORMATTERS];
}

// Convenience function for shopping lists formatting
export const formatShoppingLists = async (text: string) => {
  const { ShoppingListsFormatter } = await import('./ShoppingListsFormatter');
  return ShoppingListsFormatter.format({
    content: text,
    metadata: {
      source: 'type',
      timestamp: new Date(),
      size: text.length,
    },
  });
};
