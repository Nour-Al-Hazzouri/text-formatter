/**
 * Format Detection System - Automatically detects optimal format type
 * 
 * Analyzes text patterns to suggest the best formatting mode:
 * - Meeting Notes: attendees, dates, action items, decisions
 * - Task Lists: todo items, checkboxes, priorities
 * - Journal: timestamps, personal notes, paragraphs
 * - Shopping Lists: item quantities, categories
 * - Research: citations, references, sources
 * - Study Notes: definitions, Q&A, outlines
 */

import type { FormatType } from '@/types';
import { TextAnalysisEngine } from '../nlp';

export interface FormatDetectionResult {
  suggestedFormat: FormatType;
  confidence: number;
  scores: Record<FormatType, number>;
  reasoning: string;
}

export class FormatDetector {
  /**
   * Detect optimal format for given text
   */
  static detectFormat(text: string): FormatDetectionResult {
    if (!text || text.trim().length === 0) {
      return {
        suggestedFormat: 'journal-notes',
        confidence: 0,
        scores: this.getEmptyScores(),
        reasoning: 'No text provided',
      };
    }

    // Analyze text using NLP engine
    const analysis = TextAnalysisEngine.analyzeText(text);
    
    // Calculate scores for each format type
    const scores: Record<FormatType, number> = {
      'meeting-notes': this.scoreMeetingNotes(text, analysis),
      'task-lists': this.scoreTaskLists(text, analysis),
      'journal-notes': this.scoreJournalNotes(text, analysis),
      'shopping-lists': this.scoreShoppingLists(text, analysis),
      'research-notes': this.scoreResearchNotes(text, analysis),
      'study-notes': this.scoreStudyNotes(text, analysis),
    };

    // Find highest scoring format
    const suggestedFormat = this.getHighestScoringFormat(scores);
    const confidence = scores[suggestedFormat];
    const reasoning = this.generateReasoning(suggestedFormat, scores, analysis);

    return {
      suggestedFormat,
      confidence,
      scores,
      reasoning,
    };
  }

  /**
   * Score text for Meeting Notes format
   */
  private static scoreMeetingNotes(text: string, analysis: any): number {
    let score = 0;

    // Check for meeting indicators
    const meetingKeywords = /\b(meeting|agenda|attendees|discussed|decided|action items?|minutes|follow[-\s]up)\b/gi;
    const meetingMatches = (text.match(meetingKeywords) || []).length;
    score += Math.min(meetingMatches * 0.1, 0.4);

    // Check for people/names patterns
    const namePatterns = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    const nameCount = (text.match(namePatterns) || []).length;
    if (nameCount >= 2) score += 0.2;

    // Check for date/time patterns
    const datePatterns = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[:/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/gi;
    if (datePatterns.test(text)) score += 0.15;

    // Check for action items
    const actionPatterns = /\b(TODO|FIXME|action|task|@\w+|assigned|responsible)\b/gi;
    if (actionPatterns.test(text)) score += 0.15;

    // Check for list structure
    const listLines = text.split('\n').filter(line => /^[-*•]\s/.test(line.trim()));
    if (listLines.length >= 3) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Score text for Task Lists format
   */
  private static scoreTaskLists(text: string, analysis: any): number {
    let score = 0;

    // Check for checkbox patterns
    const checkboxPattern = /\[[ xX]\]/g;
    const checkboxCount = (text.match(checkboxPattern) || []).length;
    if (checkboxCount >= 2) score += 0.4;

    // Check for task keywords
    const taskKeywords = /\b(todo|task|complete|finish|done|pending|priority|urgent|deadline|due)\b/gi;
    const taskMatches = (text.match(taskKeywords) || []).length;
    score += Math.min(taskMatches * 0.08, 0.3);

    // Check for list structure
    const lines = text.split('\n');
    const listLines = lines.filter(line => /^[-*•\d+[.)]\s/.test(line.trim()));
    const listRatio = listLines.length / Math.max(lines.length, 1);
    if (listRatio > 0.5) score += 0.2;

    // Check for priority indicators
    const priorityPattern = /\b(high|low|urgent|important|critical|\!{1,3}|P[0-4])\b/gi;
    if (priorityPattern.test(text)) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Score text for Journal/Notes format
   */
  private static scoreJournalNotes(text: string, analysis: any): number {
    let score = 0.3; // Base score as default format

    // Check for paragraph structure
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    if (paragraphs.length >= 2) score += 0.2;

    // Check for personal/reflective language
    const personalPattern = /\b(I|my|me|today|yesterday|felt|think|believe|realize)\b/gi;
    const personalMatches = (text.match(personalPattern) || []).length;
    score += Math.min(personalMatches * 0.02, 0.2);

    // Check for timestamps
    const timestampPattern = /\b\d{1,2}:\d{2}\s?(am|pm|AM|PM)?\b/g;
    if (timestampPattern.test(text)) score += 0.1;

    // Longer continuous text suggests journal
    const avgLineLength = text.split('\n')
      .filter(l => l.trim())
      .reduce((sum, l) => sum + l.length, 0) / Math.max(text.split('\n').length, 1);
    if (avgLineLength > 50) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Score text for Shopping Lists format
   */
  private static scoreShoppingLists(text: string, analysis: any): number {
    let score = 0;

    // Check for quantity patterns
    const quantityPattern = /\b\d+\s*(kg|g|lb|oz|liter|ml|pack|box|bottle|can|jar)\b/gi;
    const quantityMatches = (text.match(quantityPattern) || []).length;
    if (quantityMatches >= 2) score += 0.4;

    // Check for shopping keywords
    const shoppingKeywords = /\b(buy|get|purchase|need|grocery|store|aisle|produce|dairy|meat|bakery)\b/gi;
    const shoppingMatches = (text.match(shoppingKeywords) || []).length;
    score += Math.min(shoppingMatches * 0.1, 0.3);

    // Check for food items (common patterns)
    const foodPattern = /\b(milk|bread|eggs|cheese|chicken|beef|apple|banana|tomato|potato|rice|pasta)\b/gi;
    const foodMatches = (text.match(foodPattern) || []).length;
    if (foodMatches >= 3) score += 0.2;

    // Simple list structure
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length >= 5 && lines.length <= 30) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Score text for Research Notes format
   */
  private static scoreResearchNotes(text: string, analysis: any): number {
    let score = 0;

    // Check for citation patterns
    const citationPattern = /\([A-Z][a-z]+,?\s+\d{4}\)|\[\d+\]|et al\.|doi:|ISBN|http/gi;
    const citationMatches = (text.match(citationPattern) || []).length;
    if (citationMatches >= 2) score += 0.4;

    // Check for research keywords
    const researchKeywords = /\b(study|research|hypothesis|methodology|findings|conclusion|abstract|reference|citation|source|paper|journal|article)\b/gi;
    const researchMatches = (text.match(researchKeywords) || []).length;
    score += Math.min(researchMatches * 0.08, 0.3);

    // Check for quote patterns
    const quotePattern = /"[^"]{20,}"/g;
    const quoteMatches = (text.match(quotePattern) || []).length;
    if (quoteMatches >= 1) score += 0.15;

    // Check for academic language
    const academicPattern = /\b(therefore|however|furthermore|consequently|according to|in conclusion|significant|demonstrate)\b/gi;
    if (academicPattern.test(text)) score += 0.15;

    return Math.min(score, 1.0);
  }

  /**
   * Score text for Study Notes format
   */
  private static scoreStudyNotes(text: string, analysis: any): number {
    let score = 0;

    // Check for Q&A patterns
    const qaPattern = /\b(question|answer|Q:|A:|what|why|how|define|explain)\b/gi;
    const qaMatches = (text.match(qaPattern) || []).length;
    score += Math.min(qaMatches * 0.1, 0.3);

    // Check for definition patterns
    const definitionPattern = /\b(\w+)\s+(is|means|refers to|defined as)/gi;
    const defMatches = (text.match(definitionPattern) || []).length;
    if (defMatches >= 2) score += 0.25;

    // Check for study keywords
    const studyKeywords = /\b(chapter|lesson|exam|test|memorize|review|summary|key term|concept|theory|formula)\b/gi;
    const studyMatches = (text.match(studyKeywords) || []).length;
    score += Math.min(studyMatches * 0.08, 0.25);

    // Check for outline structure (numbered/lettered hierarchies)
    const outlinePattern = /^\s*([IVX]+\.|[A-Z]\.|[a-z]\.|[\d]+\.)\s/gm;
    const outlineMatches = (text.match(outlinePattern) || []).length;
    if (outlineMatches >= 3) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Get format with highest score
   */
  private static getHighestScoringFormat(scores: Record<FormatType, number>): FormatType {
    let maxScore = 0;
    let bestFormat: FormatType = 'journal-notes'; // Default fallback

    for (const [format, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestFormat = format as FormatType;
      }
    }

    return bestFormat;
  }

  /**
   * Generate empty scores
   */
  private static getEmptyScores(): Record<FormatType, number> {
    return {
      'meeting-notes': 0,
      'task-lists': 0,
      'journal-notes': 0,
      'shopping-lists': 0,
      'research-notes': 0,
      'study-notes': 0,
    };
  }

  /**
   * Generate human-readable reasoning
   */
  private static generateReasoning(
    suggestedFormat: FormatType,
    scores: Record<FormatType, number>,
    analysis: any
  ): string {
    const formatNames: Record<FormatType, string> = {
      'meeting-notes': 'Meeting Notes',
      'task-lists': 'Task Lists',
      'journal-notes': 'Journal/Notes',
      'shopping-lists': 'Shopping Lists',
      'research-notes': 'Research Notes',
      'study-notes': 'Study Notes',
    };

    const confidence = scores[suggestedFormat];
    const name = formatNames[suggestedFormat];

    if (confidence > 0.7) {
      return `Strong match for ${name} format (${Math.round(confidence * 100)}% confidence)`;
    } else if (confidence > 0.5) {
      return `Good match for ${name} format (${Math.round(confidence * 100)}% confidence)`;
    } else if (confidence > 0.3) {
      return `Moderate match for ${name} format (${Math.round(confidence * 100)}% confidence)`;
    } else {
      return `Low confidence - manually select format`;
    }
  }
}
