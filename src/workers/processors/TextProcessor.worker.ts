/**
 * Basic Text Processing Worker
 * 
 * Handles simple text processing operations like cleaning, normalization,
 * and basic pattern detection. Serves as foundation for format-specific workers.
 */

import { BaseWorker } from '../base/BaseWorker';
import type { 
  ProcessingTask, 
  CancellationToken
} from '@/types/workers';
import type { FormattedOutput } from '@/types/formatting';
import type { FormatType } from '@/types';

/**
 * Basic text processor worker implementation
 */
class TextProcessorWorker extends BaseWorker {

  /**
   * Initialize the text processor
   */
  protected async onInitialize(): Promise<void> {
    // Initialize any processing libraries or configurations
  }

  /**
   * Get worker capabilities
   */
  protected getCapabilities(): string[] {
    return [
      'text-cleaning',
      'text-normalization',
      'basic-pattern-detection',
      'word-count',
      'character-analysis',
      'line-processing'
    ];
  }

  /**
   * Process text based on task requirements
   */
  protected async processText(
    task: ProcessingTask, 
    cancellationToken: CancellationToken
  ): Promise<FormattedOutput> {
    const { input, options } = task;
    const startTime = Date.now();

    // Send initial progress
    this.sendProgressUpdate(task.taskId, 0, 'Starting text processing');

    try {
      // Step 1: Clean and normalize text
      cancellationToken.throwIfCancelled();
      this.sendProgressUpdate(task.taskId, 20, 'Cleaning text');
      
      const cleanedText = this.cleanText(input.content);
      const normalizedText = this.normalizeText(cleanedText);

      // Step 2: Basic analysis
      cancellationToken.throwIfCancelled();
      this.sendProgressUpdate(task.taskId, 40, 'Analyzing content');
      
      const analysis = this.analyzeText(normalizedText);

      // Step 3: Apply basic formatting
      cancellationToken.throwIfCancelled();
      this.sendProgressUpdate(task.taskId, 60, 'Applying formatting');
      
      const formattedText = this.applyBasicFormatting(normalizedText, options);

      // Step 4: Generate metadata
      cancellationToken.throwIfCancelled();
      this.sendProgressUpdate(task.taskId, 80, 'Generating metadata');
      
      const metadata = this.generateMetadata(input.content, formattedText, analysis);

      // Step 5: Finalize result
      this.sendProgressUpdate(task.taskId, 100, 'Finalizing result');

      const result: FormattedOutput = {
        content: formattedText,
        format: options.targetFormat || 'journal-notes',
        metadata: {
          processedAt: new Date(),
          duration: Date.now() - startTime,
          confidence: Math.round(analysis.confidence * 100),
          itemCount: analysis.paragraphCount,
          stats: {
            linesProcessed: analysis.lineCount,
            patternsMatched: analysis.patterns.length,
            itemsExtracted: analysis.patterns.length,
            duplicatesRemoved: 0,
            changesApplied: analysis.patterns.length
          }
        },
        data: {
          common: {
            dates: [],
            urls: [],
            emails: [],
            phoneNumbers: [],
            mentions: [],
            hashtags: []
          },
          formatSpecific: {
            entries: [],
            insights: [],
            topics: [],
            mood: undefined
          }
        }
      };

      return result;

    } catch (error) {
      if (cancellationToken.isCancelled) {
        throw new Error('Processing cancelled by user');
      }
      
      throw new Error(`Text processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean text by removing unwanted characters and normalizing whitespace
   */
  private cleanText(text: string): string {
    return text
      .replace(/^\uFEFF/, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Normalize text formatting and structure
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\s+([,.!?;:])/g, '$1')
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
      .replace(/[""]([^""]*)[""]/g, '"$1"')
      .replace(/['']([^'']*)['']/g, "'$1'")
      .replace(/\.{3,}/g, '...')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\[\s+/g, '[')
      .replace(/\s+\]/g, ']');
  }

  /**
   * Analyze text to detect patterns and characteristics
   */
  private analyzeText(text: string): {
    confidence: number;
    patterns: string[];
    suggestions: string[];
    wordCount: number;
    lineCount: number;
    paragraphCount: number;
  } {
    const lines = text.split('\n');
    const paragraphs = text.split(/\n\s*\n/);
    const words = text.match(/\b\w+\b/g) || [];
    
    const patterns: string[] = [];
    const suggestions: string[] = [];

    // Detect list patterns
    const listItemPattern = /^[\s]*[-•*]\s+/;
    const numberedListPattern = /^[\s]*\d+\.?\s+/;
    
    let listItems = 0;
    let numberedItems = 0;
    
    lines.forEach(line => {
      if (listItemPattern.test(line)) listItems++;
      if (numberedListPattern.test(line)) numberedItems++;
    });

    if (listItems > 2) {
      patterns.push('bullet-list');
      suggestions.push('Consider converting to a formatted list');
    }
    
    if (numberedItems > 2) {
      patterns.push('numbered-list');
      suggestions.push('Consider converting to a numbered list format');
    }

    // Detect potential headers
    let potentialHeaders = 0;
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 80 && 
          trimmed === trimmed.toUpperCase() && 
          /^[A-Z\s]+$/.test(trimmed)) {
        potentialHeaders++;
      }
    });

    if (potentialHeaders > 0) {
      patterns.push('headers');
      suggestions.push('Consider formatting headers consistently');
    }

    // Detect action items
    const actionKeywords = ['TODO', 'FIXME', 'NOTE', 'IMPORTANT', 'REMINDER'];
    let actionItems = 0;
    
    actionKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) actionItems += matches.length;
    });

    if (actionItems > 0) {
      patterns.push('action-items');
      suggestions.push('Consider highlighting action items');
    }

    // Detect dates and times
    const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g;
    const timePattern = /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\b/gi;
    
    if (text.match(datePattern) || text.match(timePattern)) {
      patterns.push('datetime');
      suggestions.push('Consider standardizing date and time formats');
    }

    // Calculate confidence based on detected patterns
    let confidence = 0.5; // Base confidence
    if (patterns.length > 0) confidence += 0.1 * patterns.length;
    if (words.length > 50) confidence += 0.1;
    if (paragraphs.length > 1) confidence += 0.1;
    
    confidence = Math.min(confidence, 1.0);

    return {
      confidence,
      patterns,
      suggestions,
      wordCount: words.length,
      lineCount: lines.length,
      paragraphCount: paragraphs.length
    };
  }

  /**
   * Apply basic formatting based on detected patterns
   */
  private applyBasicFormatting(text: string, options: any): string {
    let formatted = text;

    // Basic paragraph formatting
    if (options.features?.contentAnalysis) {
      formatted = formatted.replace(/\n\n+/g, '\n\n');
      formatted = formatted.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
    }

    return formatted;
  }

  /**
   * Generate metadata for the processed text
   */
  private generateMetadata(originalText: string, formattedText: string, analysis: any): any {
    return {
      confidence: analysis.confidence,
      detectedPatterns: analysis.patterns,
      stats: {
        inputLength: originalText.length,
        outputLength: formattedText.length,
        wordCount: analysis.wordCount,
        lineCount: analysis.lineCount,
        paragraphCount: analysis.paragraphCount,
        processingTime: 0 // Will be set by caller
      },
      suggestions: analysis.suggestions,
      quality: {
        readability: this.calculateReadability(formattedText),
        structure: this.assessStructure(formattedText)
      }
    };
  }

  /**
   * Calculate basic readability score
   */
  private calculateReadability(text: string): number {
    const words = text.match(/\b\w+\b/g) || [];
    const sentences = text.match(/[.!?]+/g) || [];

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    
    // Simple readability approximation
    const score = Math.max(0, Math.min(1, 1 - (avgWordsPerSentence - 15) / 20));
    
    return score;
  }

  /**
   * Assess text structure quality
   */
  private assessStructure(text: string): number {
    const lines = text.split('\n');
    const paragraphs = text.split(/\n\s*\n/);
    
    let score = 0.5; // Base score
    
    if (paragraphs.length > 1) score += 0.2;
    
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    if (avgLineLength > 20 && avgLineLength < 100) score += 0.2;
    
    const longLines = lines.filter(line => line.length > 120).length;
    score -= (longLines / lines.length) * 0.3;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get export options based on format
   */
  private getExportOptions(format?: FormatType): string[] {
    const baseOptions = ['plain-text', 'copy'];
    
    switch (format) {
      case 'meeting-notes':
        return [...baseOptions, 'markdown', 'html', 'pdf'];
      case 'task-lists':
        return [...baseOptions, 'markdown', 'csv', 'json'];
      case 'shopping-lists':
        return [...baseOptions, 'markdown', 'csv'];
      default:
        return baseOptions;
    }
  }

  /**
   * Cleanup on termination
   */
  protected onTerminate(): void {
    // Clean up any resources
  }
}

// Initialize the worker
const worker = new TextProcessorWorker();

// Export for TypeScript
export default worker;
