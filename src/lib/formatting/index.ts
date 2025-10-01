/**
 * Formatting Module - Text formatters for all 6 format types
 * 
 * Central export point for all formatting functionality
 */

export { MeetingNotesFormatter } from './MeetingNotesFormatter';

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
