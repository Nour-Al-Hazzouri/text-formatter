/**
 * Entity Recognizer - Named Entity Recognition (NER)
 * 
 * Extracts entities like dates, times, emails, URLs, phone numbers, etc.
 */

import type { ExtractedEntity, EntityType } from '@/types/nlp';

/**
 * Entity recognition engine
 */
export class EntityRecognizer {
  /**
   * Extract all entities from text
   */
  static extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    entities.push(...this.extractDates(text));
    entities.push(...this.extractTimes(text));
    entities.push(...this.extractEmails(text));
    entities.push(...this.extractUrls(text));
    entities.push(...this.extractPhones(text));
    entities.push(...this.extractMentions(text));
    entities.push(...this.extractHashtags(text));

    return entities.sort((a, b) => a.position.start - b.position.start);
  }

  private static extractDates(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const datePattern = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/g;
    let match: RegExpExecArray | null;

    while ((match = datePattern.exec(text)) !== null) {
      entities.push({
        type: 'date',
        value: match[1],
        originalText: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length,
          line: this.getLineNumber(text, match.index),
        },
        confidence: 0.9,
      });
    }

    return entities;
  }

  private static extractTimes(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const timePattern = /\b(\d{1,2}:\d{2}(?:\s*(?:am|pm))?)\b/gi;
    let match: RegExpExecArray | null;

    while ((match = timePattern.exec(text)) !== null) {
      entities.push({
        type: 'time',
        value: match[1],
        originalText: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length,
          line: this.getLineNumber(text, match.index),
        },
        confidence: 0.85,
      });
    }

    return entities;
  }

  private static extractEmails(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
    let match: RegExpExecArray | null;

    while ((match = emailPattern.exec(text)) !== null) {
      entities.push({
        type: 'email',
        value: match[1],
        originalText: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length,
          line: this.getLineNumber(text, match.index),
        },
        confidence: 0.95,
      });
    }

    return entities;
  }

  private static extractUrls(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const urlPattern = /\b((?:https?:\/\/|www\.)[^\s<>"']+)/gi;
    let match: RegExpExecArray | null;

    while ((match = urlPattern.exec(text)) !== null) {
      entities.push({
        type: 'url',
        value: match[1],
        originalText: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length,
          line: this.getLineNumber(text, match.index),
        },
        confidence: 0.9,
      });
    }

    return entities;
  }

  private static extractPhones(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    let match: RegExpExecArray | null;

    while ((match = phonePattern.exec(text)) !== null) {
      entities.push({
        type: 'phone',
        value: match[0],
        originalText: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length,
          line: this.getLineNumber(text, match.index),
        },
        confidence: 0.85,
      });
    }

    return entities;
  }

  private static extractMentions(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const mentionPattern = /@([a-zA-Z0-9_]+)/g;
    let match: RegExpExecArray | null;

    while ((match = mentionPattern.exec(text)) !== null) {
      entities.push({
        type: 'mention',
        value: match[1],
        originalText: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length,
          line: this.getLineNumber(text, match.index),
        },
        confidence: 0.9,
      });
    }

    return entities;
  }

  private static extractHashtags(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const hashtagPattern = /#([a-zA-Z0-9_]+)/g;
    let match: RegExpExecArray | null;

    while ((match = hashtagPattern.exec(text)) !== null) {
      entities.push({
        type: 'hashtag',
        value: match[1],
        originalText: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length,
          line: this.getLineNumber(text, match.index),
        },
        confidence: 0.9,
      });
    }

    return entities;
  }

  private static getLineNumber(text: string, position: number): number {
    return text.substring(0, position).split('\n').length;
  }
}
