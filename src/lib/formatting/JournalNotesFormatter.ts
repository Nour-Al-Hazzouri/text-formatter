/**
 * Journal Notes Formatter - Transforms stream-of-consciousness text into organized journal entries
 * 
 * Features:
 * - Paragraph organization from rambling text
 * - Timestamp detection and formatting
 * - Header creation from content analysis
 * - Insight and quote highlighting
 * - Emotional tone detection and formatting
 * - Topic extraction and organization
 */

import type { TextInput, FormattedOutput, ExtractedData, ProcessingStats } from '@/types/formatting';

/**
 * Journal entry structure
 */
interface ParsedJournalEntry {
  timestamp?: Date;
  title?: string;
  content: string;
  mood?: string;
  tags: string[];
  insights: string[];
  quotes: string[];
  originalLines: string[];
}

/**
 * Organized journal content
 */
interface OrganizedJournal {
  entries: ParsedJournalEntry[];
  globalInsights: string[];
  overallMood: 'positive' | 'neutral' | 'negative' | 'mixed';
  topics: string[];
  totalEntries: number;
  confidence: number;
}

/**
 * Emotional tone keywords for mood detection
 */
const MOOD_INDICATORS = {
  positive: [
    'happy', 'excited', 'joyful', 'grateful', 'blessed', 'amazing', 'wonderful', 
    'fantastic', 'great', 'excellent', 'love', 'awesome', 'brilliant', 'thrilled',
    'delighted', 'pleased', 'satisfied', 'content', 'proud', 'accomplished',
    'successful', 'hopeful', 'optimistic', 'cheerful', 'elated'
  ],
  negative: [
    'sad', 'angry', 'frustrated', 'disappointed', 'worried', 'anxious', 'stressed',
    'depressed', 'upset', 'annoyed', 'terrible', 'awful', 'horrible', 'hate',
    'disgusted', 'furious', 'devastated', 'heartbroken', 'overwhelmed', 'exhausted',
    'discouraged', 'hopeless', 'lonely', 'regret', 'guilt'
  ]
};

/**
 * Common insight trigger words/phrases
 */
const INSIGHT_PATTERNS = [
  /\b(?:i (?:realized|learned|discovered|understood|figured out)|it (?:dawned on me|occurred to me)|suddenly|insight|epiphany)\b/i,
  /\b(?:the lesson is|what i learned|key takeaway|important insight|it's clear that)\b/i,
  /\b(?:i need to|should|must|have to|going forward|next time)\b/i,
  /\b(?:reflection|looking back|in hindsight|thinking about it)\b/i
];

/**
 * Quote detection patterns
 */
const QUOTE_PATTERNS = [
  /"([^"]+)"/g,        // Double quotes
  /'([^']+)'/g,        // Single quotes
  /«([^»]+)»/g,        // Guillemets
  /(?:he|she|they|someone) said[: ]+"([^"]+)"/gi,  // Reported speech
];

/**
 * Timestamp patterns for different formats
 */
const TIMESTAMP_PATTERNS = [
  // Standard formats: Jan 15, 2024 | January 15, 2024
  /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4}/i,
  // Numerical formats: 1/15/24 | 01-15-2024
  /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/,
  // ISO formats: 2024-01-15
  /\d{4}-\d{2}-\d{2}/,
  // Time formats: 3:30 PM | 15:30
  /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/i,
  // Relative dates: today, yesterday, last week
  /\b(?:today|yesterday|tomorrow|last (?:week|month|year)|this (?:morning|afternoon|evening))\b/i
];

export class JournalNotesFormatter {
  /**
   * Format journal notes from unstructured text
   */
  static async format(input: TextInput): Promise<FormattedOutput> {
    const startTime = performance.now();
    const lines = input.content.split('\n');
    
    // Organize journal content
    const organized = this.organizeJournal(lines);
    
    // Build formatted output
    const formattedText = this.buildFormattedOutput(organized);
    
    // Calculate statistics
    const stats = this.calculateStats(input.content, organized);
    const duration = performance.now() - startTime;

    // Extract journal-specific data
    const extractedData = this.extractJournalData(organized);

    return {
      format: 'journal-notes',
      content: formattedText,
      metadata: {
        processedAt: new Date(),
        duration,
        confidence: organized.confidence,
        itemCount: organized.totalEntries,
        stats,
      },
      data: extractedData,
    };
  }

  /**
   * Organize journal content from raw lines
   */
  private static organizeJournal(lines: string[]): OrganizedJournal {
    const entries: ParsedJournalEntry[] = [];
    let currentEntry: Partial<ParsedJournalEntry> | null = null;
    let currentParagraph: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines - they might indicate paragraph breaks
      if (!trimmed) {
        if (currentParagraph.length > 0) {
          this.completeParagraph(currentEntry, currentParagraph);
          currentParagraph = [];
        }
        continue;
      }

      // Check if line contains timestamp
      const timestamp = this.extractTimestamp(trimmed);
      if (timestamp) {
        // Save current entry if exists
        if (currentEntry && (currentEntry.content || currentParagraph.length > 0)) {
          this.finalizeEntry(currentEntry, currentParagraph);
          entries.push(currentEntry as ParsedJournalEntry);
        }
        
        // Start new entry
        currentEntry = {
          timestamp,
          content: '',
          tags: [],
          insights: [],
          quotes: [],
          originalLines: []
        };
        currentParagraph = [];
        continue;
      }

      // Check if line is a potential title/header
      if (this.isPotentialTitle(trimmed, lines[i + 1])) {
        if (!currentEntry) {
          currentEntry = {
            content: '',
            tags: [],
            insights: [],
            quotes: [],
            originalLines: []
          };
        }
        currentEntry.title = this.cleanTitle(trimmed);
        continue;
      }

      // Add line to current paragraph
      if (currentEntry || currentParagraph.length === 0) {
        if (!currentEntry) {
          currentEntry = {
            content: '',
            tags: [],
            insights: [],
            quotes: [],
            originalLines: []
          };
        }
        currentParagraph.push(line);
        currentEntry.originalLines?.push(line);
      }
    }

    // Finalize the last entry
    if (currentEntry && (currentEntry.content || currentParagraph.length > 0)) {
      this.finalizeEntry(currentEntry, currentParagraph);
      entries.push(currentEntry as ParsedJournalEntry);
    }

    // If no entries were created from structure, treat entire text as one entry
    if (entries.length === 0 && lines.some(line => line.trim())) {
      const singleEntry: ParsedJournalEntry = {
        content: '',
        tags: [],
        insights: [],
        quotes: [],
        originalLines: lines.filter(line => line.trim())
      };
      
      this.finalizeEntry(singleEntry, lines.filter(line => line.trim()));
      entries.push(singleEntry);
    }

    // Process each entry for insights, mood, etc.
    entries.forEach(entry => this.enrichEntry(entry));

    // Calculate global insights and mood
    const globalInsights = this.extractGlobalInsights(entries);
    const overallMood = this.calculateOverallMood(entries);
    const topics = this.extractTopics(entries);
    const confidence = this.calculateConfidence(entries, lines);

    return {
      entries,
      globalInsights,
      overallMood,
      topics,
      totalEntries: entries.length,
      confidence,
    };
  }

  /**
   * Complete a paragraph by organizing sentences
   */
  private static completeParagraph(entry: Partial<ParsedJournalEntry> | null, paragraphLines: string[]): void {
    if (!entry || paragraphLines.length === 0) return;

    const paragraphText = this.organizeSentences(paragraphLines.join(' '));
    entry.content = entry.content ? `${entry.content}\n\n${paragraphText}` : paragraphText;
  }

  /**
   * Finalize entry by processing remaining content
   */
  private static finalizeEntry(entry: Partial<ParsedJournalEntry>, remainingLines: string[]): void {
    if (remainingLines.length > 0) {
      const finalContent = this.organizeSentences(remainingLines.join(' '));
      entry.content = entry.content ? `${entry.content}\n\n${finalContent}` : finalContent;
    }
  }

  /**
   * Organize sentences within a paragraph for better readability
   */
  private static organizeSentences(text: string): string {
    // Split on sentence boundaries
    const sentences = text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sentences.length === 0) return text;

    // Join sentences with proper punctuation and spacing
    return sentences
      .map((sentence, index) => {
        // Add appropriate punctuation if missing
        const trimmed = sentence.trim();
        if (!trimmed) return '';
        
        // Don't add punctuation to the last sentence if it was split incorrectly
        const hasEndPunctuation = /[.!?]$/.test(text.trim());
        const isLastSentence = index === sentences.length - 1;
        
        if (isLastSentence && !hasEndPunctuation && text.trim().endsWith(trimmed)) {
          return trimmed;
        }
        
        if (!/[.!?]$/.test(trimmed)) {
          return trimmed + '.';
        }
        
        return trimmed;
      })
      .filter(s => s)
      .join(' ');
  }

  /**
   * Extract timestamp from line
   */
  private static extractTimestamp(line: string): Date | undefined {
    for (const pattern of TIMESTAMP_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const timestampStr = match[0];
        
        // Handle relative dates
        if (/\b(?:today|yesterday|tomorrow)\b/i.test(timestampStr)) {
          const now = new Date();
          if (/yesterday/i.test(timestampStr)) {
            now.setDate(now.getDate() - 1);
          } else if (/tomorrow/i.test(timestampStr)) {
            now.setDate(now.getDate() + 1);
          }
          return now;
        }
        
        // Try to parse standard formats
        const parsed = new Date(timestampStr);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    
    return undefined;
  }

  /**
   * Check if line is a potential title
   */
  private static isPotentialTitle(line: string, nextLine?: string): boolean {
    // Short lines (under 60 chars) that might be titles
    if (line.length < 60 && line.length > 3) {
      // Followed by empty line or longer content
      if (!nextLine || nextLine.trim() === '' || nextLine.length > line.length) {
        return true;
      }
    }
    
    // Lines that are in title case or all caps
    if (this.isTitleCase(line) || line.toUpperCase() === line) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if text is in title case
   */
  private static isTitleCase(text: string): boolean {
    const words = text.split(' ').filter(w => w.length > 0);
    if (words.length === 0) return false;
    
    const capitalizedWords = words.filter(word => 
      /^[A-Z][a-z]*$/.test(word) || 
      ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word.toLowerCase())
    );
    
    return capitalizedWords.length >= words.length * 0.7;
  }

  /**
   * Clean title text
   */
  private static cleanTitle(title: string): string {
    return title.replace(/^#+\s*/, '').replace(/[:\-–—]*$/, '').trim();
  }

  /**
   * Enrich entry with insights, quotes, mood, and tags
   */
  private static enrichEntry(entry: ParsedJournalEntry): void {
    const fullText = `${entry.title || ''} ${entry.content}`.toLowerCase();
    
    // Extract insights
    entry.insights = this.extractInsights(entry.content);
    
    // Extract quotes
    entry.quotes = this.extractQuotes(entry.content);
    
    // Detect mood
    entry.mood = this.detectMood(fullText);
    
    // Extract tags/topics
    entry.tags = this.extractTags(entry.content);
  }

  /**
   * Extract insights from text
   */
  private static extractInsights(text: string): string[] {
    const insights: string[] = [];
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    for (const sentence of sentences) {
      for (const pattern of INSIGHT_PATTERNS) {
        if (pattern.test(sentence)) {
          // Clean up the insight sentence
          const cleaned = sentence.replace(/^(and|but|so|then)\s+/i, '').trim();
          if (cleaned.length > 10) {
            insights.push(cleaned);
          }
          break;
        }
      }
    }
    
    return insights;
  }

  /**
   * Extract quotes from text
   */
  private static extractQuotes(text: string): string[] {
    const quotes: string[] = [];
    
    for (const pattern of QUOTE_PATTERNS) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const quote = match[1]?.trim();
        if (quote && quote.length > 5) {
          quotes.push(quote);
        }
      }
    }
    
    return [...new Set(quotes)]; // Remove duplicates
  }

  /**
   * Detect emotional mood from text
   */
  private static detectMood(text: string): string | undefined {
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const word of words) {
      if (MOOD_INDICATORS.positive.some(pos => word.includes(pos))) {
        positiveCount++;
      }
      if (MOOD_INDICATORS.negative.some(neg => word.includes(neg))) {
        negativeCount++;
      }
    }
    
    if (positiveCount === 0 && negativeCount === 0) return undefined;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'mixed';
  }

  /**
   * Extract tags/topics from text
   */
  private static extractTags(text: string): string[] {
    const tags: string[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Look for hashtags
    const hashtagMatches = text.match(/#[\w]+/g);
    if (hashtagMatches) {
      tags.push(...hashtagMatches.map(tag => tag.toLowerCase()));
    }
    
    // Extract potential topics (capitalize words, proper nouns)
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      const capitalWords = sentence.match(/\b[A-Z][a-z]+\b/g);
      if (capitalWords) {
        tags.push(...capitalWords.filter(word => 
          word.length > 3 && !['The', 'This', 'That', 'Then', 'When', 'Where'].includes(word)
        ).map(word => word.toLowerCase()));
      }
    }
    
    return [...new Set(tags)].slice(0, 10); // Limit to 10 unique tags
  }

  /**
   * Extract global insights across all entries
   */
  private static extractGlobalInsights(entries: ParsedJournalEntry[]): string[] {
    const allInsights = entries.flatMap(entry => entry.insights);
    
    // Find common themes or recurring insights
    const insightCounts = new Map<string, number>();
    allInsights.forEach(insight => {
      const key = insight.toLowerCase();
      insightCounts.set(key, (insightCounts.get(key) || 0) + 1);
    });
    
    // Return insights that appear more than once, or top insights
    return Array.from(insightCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([insight]) => allInsights.find(i => i.toLowerCase() === insight) || insight);
  }

  /**
   * Calculate overall mood across all entries
   */
  private static calculateOverallMood(entries: ParsedJournalEntry[]): 'positive' | 'neutral' | 'negative' | 'mixed' {
    const moods = entries.map(entry => entry.mood).filter(Boolean);
    if (moods.length === 0) return 'neutral';
    
    const moodCounts = {
      positive: moods.filter(m => m === 'positive').length,
      negative: moods.filter(m => m === 'negative').length,
      mixed: moods.filter(m => m === 'mixed').length
    };
    
    const total = moods.length;
    const positiveRatio = moodCounts.positive / total;
    const negativeRatio = moodCounts.negative / total;
    
    if (positiveRatio > 0.6) return 'positive';
    if (negativeRatio > 0.6) return 'negative';
    if (moodCounts.mixed > 0 || (positiveRatio > 0.3 && negativeRatio > 0.3)) return 'mixed';
    
    return 'neutral';
  }

  /**
   * Extract topics across all entries
   */
  private static extractTopics(entries: ParsedJournalEntry[]): string[] {
    const allTags = entries.flatMap(entry => entry.tags);
    const tagCounts = new Map<string, number>();
    
    allTags.forEach(tag => {
      const cleaned = tag.replace(/^#/, '').toLowerCase();
      tagCounts.set(cleaned, (tagCounts.get(cleaned) || 0) + 1);
    });
    
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(entries: ParsedJournalEntry[], originalLines: string[]): number {
    if (entries.length === 0) return 0;
    
    let score = 50; // Base score
    
    // Boost for detected timestamps
    const entriesWithTimestamps = entries.filter(e => e.timestamp).length;
    score += (entriesWithTimestamps / entries.length) * 20;
    
    // Boost for extracted insights
    const totalInsights = entries.reduce((sum, e) => sum + e.insights.length, 0);
    if (totalInsights > 0) score += Math.min(15, totalInsights * 3);
    
    // Boost for mood detection
    const entriesWithMood = entries.filter(e => e.mood).length;
    score += (entriesWithMood / entries.length) * 10;
    
    // Boost for organization (multiple paragraphs)
    const totalParagraphs = entries.reduce((sum, e) => 
      sum + e.content.split('\n\n').length, 0
    );
    if (totalParagraphs > entries.length) score += 5;
    
    return Math.min(100, Math.round(score));
  }

  /**
   * Build formatted output
   */
  private static buildFormattedOutput(organized: OrganizedJournal): string {
    const sections: string[] = [];
    
    // Add header
    sections.push('# 📓 Journal Entries\n');
    
    // Add mood indicator if detected
    if (organized.overallMood !== 'neutral') {
      const moodEmoji = {
        positive: '😊',
        negative: '😔',
        mixed: '😐'
      }[organized.overallMood];
      
      sections.push(`**Overall Mood:** ${moodEmoji} ${organized.overallMood}\n`);
    }
    
    // Add entries
    organized.entries.forEach((entry, index) => {
      sections.push(this.formatEntry(entry, index + 1));
    });
    
    // Add global insights section
    if (organized.globalInsights.length > 0) {
      sections.push('\n## 💡 Key Insights\n');
      organized.globalInsights.forEach(insight => {
        sections.push(`• ${insight}`);
      });
      sections.push('');
    }
    
    // Add topics section
    if (organized.topics.length > 0) {
      sections.push('## 🏷️ Topics Discussed\n');
      sections.push(organized.topics.map(topic => `#${topic}`).join(', '));
      sections.push('');
    }
    
    // Add summary
    sections.push(`\n---\n**Summary:** ${organized.totalEntries} journal entries processed`);
    
    return sections.join('\n');
  }

  /**
   * Format a single journal entry
   */
  private static formatEntry(entry: ParsedJournalEntry, entryNumber: number): string {
    const lines: string[] = [];
    
    // Entry header
    if (entry.title) {
      lines.push(`## ${entry.title}`);
    } else {
      lines.push(`## Entry ${entryNumber}`);
    }
    
    // Timestamp
    if (entry.timestamp) {
      lines.push(`*${entry.timestamp.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
      })}*\n`);
    }
    
    // Mood indicator
    if (entry.mood) {
      const moodEmoji = {
        positive: '😊',
        negative: '😔',
        mixed: '😐'
      }[entry.mood];
      lines.push(`**Mood:** ${moodEmoji} ${entry.mood}\n`);
    }
    
    // Main content
    lines.push(entry.content);
    
    // Quotes section
    if (entry.quotes.length > 0) {
      lines.push('\n**Notable Quotes:**');
      entry.quotes.forEach(quote => {
        lines.push(`> "${quote}"`);
      });
    }
    
    // Insights section
    if (entry.insights.length > 0) {
      lines.push('\n**Key Insights:**');
      entry.insights.forEach(insight => {
        lines.push(`• ${insight}`);
      });
    }
    
    // Tags
    if (entry.tags.length > 0) {
      lines.push(`\n**Tags:** ${entry.tags.join(', ')}`);
    }
    
    lines.push(''); // Empty line after entry
    return lines.join('\n');
  }

  /**
   * Calculate processing statistics
   */
  private static calculateStats(originalText: string, organized: OrganizedJournal): ProcessingStats {
    const originalLines = originalText.split('\n').filter(line => line.trim()).length;
    const totalInsights = organized.entries.reduce((sum, e) => sum + e.insights.length, 0);
    const totalQuotes = organized.entries.reduce((sum, e) => sum + e.quotes.length, 0);
    
    return {
      linesProcessed: originalLines,
      patternsMatched: organized.totalEntries,
      itemsExtracted: totalInsights + totalQuotes + organized.topics.length,
      duplicatesRemoved: 0, // Not applicable for journal entries
      changesApplied: organized.entries.length,
    };
  }

  /**
   * Extract journal-specific data
   */
  private static extractJournalData(organized: OrganizedJournal): ExtractedData {
    const journalData = {
      entries: organized.entries.map(entry => ({
        timestamp: entry.timestamp || new Date(),
        content: entry.content,
        title: entry.title,
        mood: entry.mood,
        tags: entry.tags,
      })),
      insights: organized.globalInsights,
      mood: organized.overallMood,
      topics: organized.topics,
    };

    // Convert timestamps to ExtractedDate format
    const extractedDates = organized.entries
      .filter(e => e.timestamp)
      .map(entry => ({
        originalText: entry.originalLines?.find(line => 
          TIMESTAMP_PATTERNS.some(pattern => pattern.test(line))
        ) || entry.timestamp?.toDateString() || '',
        date: entry.timestamp!,
        format: 'detected',
        confidence: 80,
      }));

    return {
      common: {
        dates: extractedDates,
        urls: [],
        emails: [],
        phoneNumbers: [],
        mentions: [],
        hashtags: organized.topics.map(topic => `#${topic}`),
      },
      formatSpecific: journalData,
    };
  }
}
