/**
 * Formatting Module - Text formatters for all 6 format types
 * 
 * Central export point for all formatting functionality
 */

export { MeetingNotesFormatter } from './MeetingNotesFormatter';
export { TaskListsFormatter } from './TaskListsFormatter';

// Convenience function for meeting notes formatting
export const formatMeetingNotes = async (text: string) => {
  const { MeetingNotesFormatter } = await import('./MeetingNotesFormatter');
  return MeetingNotesFormatter.format({
    content: text,
    metadata: {
      source: 'type',
      timestamp: new Date(),
      size: text.length,
    },
  });
};

// Convenience function for task lists formatting
export const formatTaskLists = async (text: string) => {
  const { TaskListsFormatter } = await import('./TaskListsFormatter');
  return TaskListsFormatter.format({
    content: text,
    metadata: {
      source: 'type',
      timestamp: new Date(),
      size: text.length,
    },
  });
};
