/**
 * Meeting Notes Formatter - First complete format implementation
 * 
 * Transforms unstructured meeting notes into well-organized format with:
 * - Attendee extraction and formatting
 * - Agenda item identification
 * - Action item detection with assignees
 * - Decision point highlighting
 * - Date/time standardization
 */

import type { TextInput, FormattedOutput } from '@/types/formatting';
import type { 
  MeetingNotesData, 
  AgendaItem, 
  ActionItem, 
  Decision,
  ProcessingStats,
  ExtractedData 
} from '@/types/formatting';
import type { TextAnalysis } from '@/types/nlp';
import { TextAnalysisEngine } from '@/lib/nlp';

/**
 * Meeting Notes formatting engine
 */
export class MeetingNotesFormatter {
  /**
   * Format meeting notes from unstructured text
   */
  static async format(input: TextInput): Promise<FormattedOutput> {
    const startTime = performance.now();

    // Analyze text using NLP engine
    const analysis = TextAnalysisEngine.analyzeText(input.content, 'meeting-notes');

    // Extract meeting-specific data
    const meetingData = this.extractMeetingData(input.content, analysis);

    // Generate formatted output
    const formattedText = this.generateFormattedOutput(meetingData, input.content);

    // Calculate statistics
    const stats = this.calculateStats(input.content, meetingData);

    // Prepare extracted data
    const extractedData = this.prepareExtractedData(analysis, meetingData);

    const duration = performance.now() - startTime;

    return {
      format: 'meeting-notes',
      content: formattedText,
      metadata: {
        processedAt: new Date(),
        duration,
        confidence: analysis.confidence.overall,
        itemCount: meetingData.actionItems.length + meetingData.decisions.length,
        stats,
      },
      data: extractedData,
    };
  }

  /**
   * Extract meeting-specific data from text
   */
  private static extractMeetingData(
    text: string,
    analysis: TextAnalysis
  ): MeetingNotesData {
    return {
      attendees: this.extractAttendees(text, analysis),
      agendaItems: this.extractAgendaItems(text, analysis),
      actionItems: this.extractActionItems(text, analysis),
      decisions: this.extractDecisions(text, analysis),
      meeting: this.extractMeetingMetadata(text, analysis),
    };
  }

  /**
   * Extract meeting attendees
   */
  private static extractAttendees(
    text: string,
    analysis: TextAnalysis
  ): string[] {
    const attendees: Set<string> = new Set();

    // Look for attendees pattern matches
    const attendeePatterns = analysis.patterns.filter(
      (p) => p.patternId.includes('meeting-attendees')
    );

    attendeePatterns.forEach((pattern) => {
      if (pattern.match) {
        // Split by common separators
        const names = pattern.match
          .split(/[,;:\n]/)
          .map((name) => name.trim())
          .filter((name) => name.length > 0 && name.length < 50);

        names.forEach((name) => {
          // Clean up common prefixes
          const cleaned = name
            .replace(/^(attendees?|participants?|present):\s*/gi, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/^[-*•]\s*/, '')
            .trim();

          if (cleaned.length > 2 && cleaned.length < 50) {
            attendees.add(cleaned);
          }
        });
      }
    });

    // Also extract from @mentions
    const mentions = analysis.entities.filter((e) => e.type === 'mention');
    mentions.forEach((mention) => {
      attendees.add(mention.value);
    });

    return Array.from(attendees);
  }

  /**
   * Extract agenda items
   */
  private static extractAgendaItems(
    text: string,
    analysis: TextAnalysis
  ): AgendaItem[] {
    const agendaItems: AgendaItem[] = [];

    // Look for agenda pattern matches
    const agendaPatterns = analysis.patterns.filter(
      (p) => p.patternId.includes('agenda-items')
    );

    agendaPatterns.forEach((pattern) => {
      if (pattern.match) {
        const title = pattern.match
          .replace(/^(agenda|topics?|discuss(?:ion|ed)?|covered):\s*/gi, '')
          .trim();

        if (title.length > 3) {
          agendaItems.push({
            title,
            description: pattern.context,
          });
        }
      }
    });

    // Also extract from sections with colon endings
    const lines = text.split('\n');
    lines.forEach((line) => {
      const colonMatch = line.match(/^(.+?):\s*$/);
      if (colonMatch && colonMatch[1].length > 5 && colonMatch[1].length < 100) {
        const title = colonMatch[1].trim();
        // Avoid duplicates
        if (!agendaItems.some((item) => item.title === title)) {
          agendaItems.push({ title });
        }
      }
    });

    return agendaItems.slice(0, 20); // Limit to 20 items
  }

  /**
   * Extract action items with assignees
   */
  private static extractActionItems(
    text: string,
    analysis: TextAnalysis
  ): ActionItem[] {
    const actionItems: ActionItem[] = [];

    // Look for action item pattern matches
    const actionPatterns = analysis.patterns.filter(
      (p) => p.patternId.includes('action-items')
    );

    actionPatterns.forEach((pattern) => {
      if (pattern.match) {
        const task = pattern.match
          .replace(/^(action item|todo|task|follow[- ]?up):\s*/gi, '')
          .trim();

        // Extract assignee if present
        const assigneeMatch = task.match(/@(\w+)/);
        const assignee = assigneeMatch ? assigneeMatch[1] : undefined;

        // Extract due date if present
        const dateEntities = analysis.entities.filter(
          (e) =>
            e.type === 'date' &&
            e.position.start >= pattern.position.start - 50 &&
            e.position.end <= pattern.position.end + 50
        );
        const dueDate = dateEntities.length > 0 ? new Date(dateEntities[0].value) : undefined;

        // Determine priority
        const priority = this.determinePriority(task);

        // Clean task text
        const cleanedTask = task
          .replace(/@\w+/g, '')
          .replace(/\b(high|urgent|important|priority)\b/gi, '')
          .trim();

        if (cleanedTask.length > 3) {
          actionItems.push({
            task: cleanedTask,
            assignee,
            dueDate,
            priority,
            status: 'pending',
          });
        }
      }
    });

    // Also extract from checkbox items
    const checkboxPattern = /^\s*[-*]\s*\[[ ]?\]\s*(.+)$/gm;
    let match: RegExpExecArray | null;

    while ((match = checkboxPattern.exec(text)) !== null) {
      const task = match[1].trim();
      const assigneeMatch = task.match(/@(\w+)/);
      const assignee = assigneeMatch ? assigneeMatch[1] : undefined;

      const cleanedTask = task.replace(/@\w+/g, '').trim();

      if (cleanedTask.length > 3) {
        // Avoid duplicates
        if (!actionItems.some((item) => item.task === cleanedTask)) {
          actionItems.push({
            task: cleanedTask,
            assignee,
            priority: this.determinePriority(task),
            status: 'pending',
          });
        }
      }
    }

    return actionItems;
  }

  /**
   * Determine action item priority
   */
  private static determinePriority(
    text: string
  ): 'low' | 'medium' | 'high' | 'urgent' {
    const lowerText = text.toLowerCase();

    if (/\b(urgent|critical|asap|immediately)\b/.test(lowerText)) {
      return 'urgent';
    }
    if (/\b(high|important|priority)\b/.test(lowerText)) {
      return 'high';
    }
    if (/\b(low|minor|optional)\b/.test(lowerText)) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Extract decisions made during meeting
   */
  private static extractDecisions(
    text: string,
    analysis: TextAnalysis
  ): Decision[] {
    const decisions: Decision[] = [];

    // Look for decision pattern matches
    const decisionPatterns = analysis.patterns.filter(
      (p) => p.patternId.includes('decisions')
    );

    decisionPatterns.forEach((pattern) => {
      if (pattern.match) {
        const description = pattern.match
          .replace(/^(decision|agreed|concluded|resolved|determined):\s*/gi, '')
          .trim();

        if (description.length > 5) {
          decisions.push({
            description,
            rationale: pattern.context,
          });
        }
      }
    });

    return decisions;
  }

  /**
   * Extract meeting metadata
   */
  private static extractMeetingMetadata(
    text: string,
    analysis: TextAnalysis
  ): MeetingNotesData['meeting'] {
    const metadata: MeetingNotesData['meeting'] = {};

    // Extract title (first line or first header)
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 100 && !firstLine.includes(':')) {
        metadata.title = firstLine.replace(/^#\s*/, '');
      }
    }

    // Extract date from entities
    const dateEntities = analysis.entities.filter((e) => e.type === 'date');
    if (dateEntities.length > 0) {
      metadata.date = new Date(dateEntities[0].value);
    }

    // Extract location if mentioned
    const locationMatch = text.match(/\b(?:location|room|venue):\s*([^\n]+)/i);
    if (locationMatch) {
      metadata.location = locationMatch[1].trim();
    }

    // Extract organizer
    const organizerMatch = text.match(/\b(?:organizer|host|led by):\s*([^\n]+)/i);
    if (organizerMatch) {
      metadata.organizer = organizerMatch[1].trim();
    }

    return metadata;
  }

  /**
   * Generate formatted output text
   */
  private static generateFormattedOutput(
    data: MeetingNotesData,
    originalText: string
  ): string {
    const sections: string[] = [];

    // Meeting Title and Metadata
    if (data.meeting.title) {
      sections.push(`# ${data.meeting.title}\n`);
    }

    const metadataLines: string[] = [];
    if (data.meeting.date) {
      metadataLines.push(
        `**Date:** ${data.meeting.date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`
      );
    }
    if (data.meeting.location) {
      metadataLines.push(`**Location:** ${data.meeting.location}`);
    }
    if (data.meeting.organizer) {
      metadataLines.push(`**Organizer:** ${data.meeting.organizer}`);
    }
    if (data.meeting.duration) {
      metadataLines.push(`**Duration:** ${data.meeting.duration}`);
    }

    if (metadataLines.length > 0) {
      sections.push(metadataLines.join('\n') + '\n');
    }

    // Attendees
    if (data.attendees.length > 0) {
      sections.push(`## 📋 Attendees\n`);
      data.attendees.forEach((attendee) => {
        sections.push(`- ${attendee}`);
      });
      sections.push('');
    }

    // Agenda Items
    if (data.agendaItems.length > 0) {
      sections.push(`## 📌 Agenda\n`);
      data.agendaItems.forEach((item, index) => {
        sections.push(`${index + 1}. **${item.title}**`);
        if (item.description) {
          sections.push(`   ${item.description}`);
        }
        if (item.presenter) {
          sections.push(`   *Presenter: ${item.presenter}*`);
        }
      });
      sections.push('');
    }

    // Action Items
    if (data.actionItems.length > 0) {
      sections.push(`## ✅ Action Items\n`);
      data.actionItems.forEach((item, index) => {
        const priorityEmoji = {
          urgent: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢',
        }[item.priority];

        let itemLine = `${index + 1}. ${priorityEmoji} ${item.task}`;
        if (item.assignee) {
          itemLine += ` [@${item.assignee}]`;
        }
        if (item.dueDate) {
          itemLine += ` - *Due: ${item.dueDate.toLocaleDateString()}*`;
        }

        sections.push(itemLine);
      });
      sections.push('');
    }

    // Decisions
    if (data.decisions.length > 0) {
      sections.push(`## 💡 Decisions Made\n`);
      data.decisions.forEach((decision, index) => {
        sections.push(`${index + 1}. ${decision.description}`);
        if (decision.decisionMaker) {
          sections.push(`   *Decision maker: ${decision.decisionMaker}*`);
        }
        if (decision.rationale) {
          sections.push(`   *Rationale: ${decision.rationale}*`);
        }
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Calculate processing statistics
   */
  private static calculateStats(
    originalText: string,
    data: MeetingNotesData
  ): ProcessingStats {
    const lines = originalText.split('\n').filter((l) => l.trim());

    return {
      linesProcessed: lines.length,
      patternsMatched: data.attendees.length + data.agendaItems.length,
      itemsExtracted:
        data.attendees.length +
        data.agendaItems.length +
        data.actionItems.length +
        data.decisions.length,
      duplicatesRemoved: 0,
      changesApplied:
        data.agendaItems.length + data.actionItems.length + data.decisions.length,
    };
  }

  /**
   * Prepare extracted data structure
   */
  private static prepareExtractedData(
    analysis: TextAnalysis,
    meetingData: MeetingNotesData
  ): ExtractedData {
    return {
      common: {
        dates: analysis.entities
          .filter((e) => e.type === 'date')
          .map((e) => ({
            originalText: e.value,
            date: new Date(e.value),
            format: 'auto-detected',
            confidence: e.confidence,
          })),
        urls: analysis.entities
          .filter((e) => e.type === 'url')
          .map((e) => ({
            originalText: e.value,
            url: e.value,
            domain: this.extractDomain(e.value),
            title: e.value,
          })),
        emails: analysis.entities.filter((e) => e.type === 'email').map((e) => e.value),
        phoneNumbers: analysis.entities
          .filter((e) => e.type === 'phone')
          .map((e) => e.value),
        mentions: analysis.entities.filter((e) => e.type === 'mention').map((e) => e.value),
        hashtags: analysis.entities.filter((e) => e.type === 'hashtag').map((e) => e.value),
      },
      formatSpecific: meetingData,
    };
  }

  /**
   * Extract domain from URL
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Validate meeting notes output
   */
  static validate(output: FormattedOutput): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!output.content || output.content.length === 0) {
      issues.push('Formatted text is empty');
    }

    if (output.metadata.confidence < 0.5) {
      issues.push('Low confidence score');
    }

    const meetingData = output.data.formatSpecific as MeetingNotesData;
    if (meetingData.actionItems.length === 0 && meetingData.decisions.length === 0) {
      issues.push('No actionable items or decisions extracted');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
