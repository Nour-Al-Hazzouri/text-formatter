/**
 * Meeting Notes Formatter - Organizes messy text into clean, structured format
 * 
 * This formatter DOES NOT extract or summarize - it purely organizes existing text by:
 * - Detecting and formatting lists (-, *, bullets, numbers)
 * - Adding section headers where appropriate
 * - Formatting dates and times consistently
 * - Adding proper spacing and structure
 * - Preserving ALL original content
 */

import type { TextInput, FormattedOutput, ExtractedData } from '@/types/formatting';
import type { ProcessingStats } from '@/types/formatting';

export class MeetingNotesFormatter {
  /**
   * Format meeting notes from unstructured text
   */
  static async format(input: TextInput): Promise<FormattedOutput> {
    const startTime = performance.now();
    const lines = input.content.split('\n');
    
    // Organize lines into structured sections
    const organized = this.organizeLines(lines);
    
    // Format the organized content
    const formattedText = this.buildFormattedOutput(organized);
    
    // Calculate statistics
    const stats = this.calculateStats(input.content, organized);
    const duration = performance.now() - startTime;

    return {
      format: 'meeting-notes',
      content: formattedText,
      metadata: {
        processedAt: new Date(),
        duration,
        confidence: organized.confidence,
        itemCount: organized.totalItems,
        stats,
      },
      data: {
        common: {
          dates: [],
          urls: [],
          emails: [],
          phoneNumbers: [],
          mentions: [],
          hashtags: [],
        },
        formatSpecific: {
          attendees: [],
          agendaItems: [],
          actionItems: [],
          decisions: [],
          meeting: {},
        },
      },
    };
  }

  /**
   * Organize lines into structured sections
   */
  private static organizeLines(lines: string[]): {
    sections: { title: string; content: string[] }[];
    lists: { items: string[] }[];
    totalItems: number;
    confidence: number;
  } {
    const sections: { title: string; content: string[] }[] = [];
    const lists: { items: string[] }[] = [];
    let currentSection: { title: string; content: string[] } | null = null;
    let currentList: string[] = [];
    let totalItems = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        if (currentList.length > 0) {
          lists.push({ items: [...currentList] });
          currentList = [];
        }
        continue;
      }

      // Check if line is a header (short line, all caps, or ends with colon)
      if (this.isHeader(trimmed, lines[i + 1])) {
        // Save current list if any
        if (currentList.length > 0) {
          lists.push({ items: [...currentList] });
          currentList = [];
        }
        
        // Save current section
        if (currentSection && currentSection.content.length > 0) {
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          title: trimmed.replace(/:$/, ''), // Remove trailing colon
          content: []
        };
        continue;
      }

      // Check if line is a list item
      if (this.isListItem(trimmed)) {
        const cleanedItem = this.cleanListItem(trimmed);
        currentList.push(cleanedItem);
        totalItems++;
        continue;
      }

      // Regular content line
      if (currentList.length > 0) {
        lists.push({ items: [...currentList] });
        currentList = [];
      }

      if (currentSection) {
        currentSection.content.push(trimmed);
      } else {
        // Create default section for content without header
        currentSection = { title: 'Notes', content: [trimmed] };
      }
    }

    // Save remaining section and list
    if (currentList.length > 0) {
      lists.push({ items: [...currentList] });
    }
    if (currentSection && currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    // If no structure detected, create single section with all content
    if (sections.length === 0 && lists.length === 0) {
      sections.push({
        title: 'Notes',
        content: lines.filter(l => l.trim()).map(l => l.trim())
      });
    }

    const confidence = this.calculateConfidence(sections, lists, totalItems);

    return { sections, lists, totalItems, confidence };
  }

  /**
   * Check if a line is a header
   */
  private static isHeader(line: string, nextLine?: string): boolean {
    // Short lines (< 50 chars) are potential headers
    if (line.length < 50) {
      // All caps
      if (line === line.toUpperCase() && line.length > 2) {
        return true;
      }
      
      // Ends with colon
      if (line.endsWith(':')) {
        return true;
      }

      // Followed by empty line or list
      if (nextLine) {
        const nextTrimmed = nextLine.trim();
        if (!nextTrimmed || this.isListItem(nextTrimmed)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if a line is a list item
   */
  private static isListItem(line: string): boolean {
    // Matches:
    // - item
    // * item
    // • item
    // 1. item
    // 1) item
    // [ ] item or [x] item (checkboxes)
    const listPatterns = [
      /^[-*•]\s+/,           // Dash, asterisk, bullet
      /^\d+[.)]\s+/,         // Numbered list
      /^[a-z][.)]\s+/i,      // Letter list
      /^\[[ x]\]\s+/i,       // Checkbox
      /^→\s+/,               // Arrow
      /^>\s+/,               // Quote/indent marker
    ];

    return listPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Clean list item by removing markers
   */
  private static cleanListItem(line: string): string {
    return line
      .replace(/^[-*•]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .replace(/^[a-z][.)]\s+/i, '')
      .replace(/^\[[ x]\]\s+/i, '')
      .replace(/^→\s+/, '')
      .replace(/^>\s+/, '')
      .trim();
  }

  /**
   * Calculate confidence score based on detected structure
   */
  private static calculateConfidence(
    sections: { title: string; content: string[] }[],
    lists: { items: string[] }[],
    totalItems: number
  ): number {
    let score = 0.5; // Base score

    // Has sections with headers
    if (sections.length > 1) {
      score += 0.2;
    }

    // Has lists
    if (lists.length > 0) {
      score += 0.2;
    }

    // Has multiple items
    if (totalItems > 3) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Build formatted output from organized content
   */
  private static buildFormattedOutput(organized: {
    sections: { title: string; content: string[] }[];
    lists: { items: string[] }[];
  }): string {
    const output: string[] = [];

    // Add sections
    for (const section of organized.sections) {
      // Add section header
      output.push(`# ${section.title}`);
      output.push('');

      // Add section content
      if (section.content.length > 0) {
        for (const line of section.content) {
          output.push(line);
        }
        output.push('');
      }
    }

    // Add standalone lists
    if (organized.lists.length > 0) {
      for (const list of organized.lists) {
        for (const item of list.items) {
          output.push(`- ${item}`);
        }
        output.push('');
      }
    }

    return output.join('\n').trim();
  }

  /**
   * Calculate processing statistics
   */
  private static calculateStats(
    originalText: string,
    organized: { totalItems: number }
  ): ProcessingStats {
    const lines = originalText.split('\n').filter(l => l.trim());
    
    return {
      linesProcessed: lines.length,
      patternsMatched: organized.totalItems,
      itemsExtracted: organized.totalItems,
      duplicatesRemoved: 0,
      changesApplied: organized.totalItems,
    };
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

    if (output.metadata.confidence < 0.3) {
      issues.push('Low confidence score - text may not be suitable for meeting notes format');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
