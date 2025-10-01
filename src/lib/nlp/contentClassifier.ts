/**
 * Content Classifier - Format detection and classification
 * 
 * Classifies text content and predicts optimal formatting type
 */

import type { FormatType } from '@/types/index';
import type {
  ContentClassification,
  FormatPrediction,
  PredictionFactor,
  FormatScores,
  PatternMatch,
  ContentStructure,
} from '@/types/nlp';
import { PatternLibrary } from './patternDefinitions';
import { PatternMatcher } from './patternMatcher';

/**
 * Content classification engine
 */
export class ContentClassifier {
  /**
   * Classify content and predict format types
   */
  static classifyContent(
    text: string,
    structure: ContentStructure,
    patterns: PatternMatch[]
  ): ContentClassification {
    const formatPredictions = this.predictFormats(text, structure, patterns);

    return {
      formatPredictions,
      categories: this.categorizeContent(text, patterns),
      language: this.detectLanguage(text),
      style: this.analyzeStyle(text),
    };
  }

  /**
   * Predict format types with confidence scores
   */
  static predictFormats(
    text: string,
    structure: ContentStructure,
    patterns: PatternMatch[]
  ): FormatPrediction[] {
    const formatTypes: FormatType[] = [
      'meeting-notes',
      'task-lists',
      'journal-notes',
      'shopping-lists',
      'research-notes',
      'study-notes',
    ];

    const predictions = formatTypes.map((format) =>
      this.predictFormat(format, text, structure, patterns)
    );

    // Sort by confidence descending
    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Predict confidence for a specific format
   */
  private static predictFormat(
    format: FormatType,
    text: string,
    structure: ContentStructure,
    patterns: PatternMatch[]
  ): FormatPrediction {
    const factors: PredictionFactor[] = [];
    const scores: FormatScores = {
      structure: 0,
      content: 0,
      patterns: 0,
      keywords: 0,
      overall: 0,
    };

    // Get format-specific patterns
    const formatPatterns = PatternLibrary.getPatterns(format);
    const formatPatternIds = new Set(formatPatterns.map((p) => p.id));
    const matchedPatterns = patterns.filter((p) =>
      formatPatternIds.has(p.patternId.split('-')[0])
    );

    // Calculate pattern score
    scores.patterns = this.calculatePatternScore(
      formatPatterns,
      matchedPatterns,
      factors
    );

    // Calculate structure score
    scores.structure = this.calculateStructureScore(
      format,
      structure,
      factors
    );

    // Calculate content score
    scores.content = this.calculateContentScore(format, text, factors);

    // Calculate keyword score
    scores.keywords = this.calculateKeywordScore(format, text, factors);

    // Calculate overall score (weighted average)
    scores.overall =
      scores.patterns * 0.4 +
      scores.structure * 0.25 +
      scores.content * 0.2 +
      scores.keywords * 0.15;

    // Convert to percentage
    const confidence = Math.round(scores.overall * 100);

    return {
      format,
      confidence,
      factors,
      scores,
    };
  }

  /**
   * Calculate pattern matching score
   */
  private static calculatePatternScore(
    formatPatterns: any[],
    matchedPatterns: PatternMatch[],
    factors: PredictionFactor[]
  ): number {
    if (formatPatterns.length === 0) return 0;

    const matchRatio = matchedPatterns.length / formatPatterns.length;
    const avgConfidence =
      matchedPatterns.length > 0
        ? matchedPatterns.reduce((sum, p) => sum + p.confidence, 0) /
          matchedPatterns.length
        : 0;

    const score = (matchRatio * 0.6 + avgConfidence * 0.4);

    factors.push({
      name: 'Pattern Matches',
      weight: 0.4,
      score: score,
      description: `${matchedPatterns.length} of ${formatPatterns.length} patterns matched`,
    });

    return score;
  }

  /**
   * Calculate structure score based on format expectations
   */
  private static calculateStructureScore(
    format: FormatType,
    structure: ContentStructure,
    factors: PredictionFactor[]
  ): number {
    let score = 0;
    let description = '';

    switch (format) {
      case 'meeting-notes':
        // Expect sections with titles, some lists, structured paragraphs
        const hasSections = structure.sections.length > 2;
        const hasLists = structure.lists.length > 0;
        score = (hasSections ? 0.5 : 0) + (hasLists ? 0.5 : 0);
        description = `${structure.sections.length} sections, ${structure.lists.length} lists`;
        break;

      case 'task-lists':
        // Expect many list items
        const taskListCount = structure.lists.reduce(
          (sum, list) => sum + list.items.length,
          0
        );
        score = Math.min(1, taskListCount / 10);
        description = `${taskListCount} list items found`;
        break;

      case 'journal-notes':
        // Expect paragraphs with narrative structure
        const paragraphCount = structure.paragraphs.length;
        score = Math.min(1, paragraphCount / 3);
        description = `${paragraphCount} paragraphs`;
        break;

      case 'shopping-lists':
        // Expect simple list structure
        const shoppingItems = structure.lists.reduce(
          (sum, list) => sum + list.items.length,
          0
        );
        score = Math.min(1, shoppingItems / 8);
        description = `${shoppingItems} items`;
        break;

      case 'research-notes':
        // Expect hierarchical structure with sections
        const hierarchyDepth = this.getMaxHierarchyDepth(structure.hierarchy);
        score = Math.min(1, hierarchyDepth / 3);
        description = `Hierarchy depth: ${hierarchyDepth}`;
        break;

      case 'study-notes':
        // Expect outline structure with hierarchy
        const outlineDepth = this.getMaxHierarchyDepth(structure.hierarchy);
        const hasDefinitions = structure.sections.some((s) =>
          s.content.includes(':')
        );
        score = (Math.min(1, outlineDepth / 4) * 0.7) + (hasDefinitions ? 0.3 : 0);
        description = `Outline depth: ${outlineDepth}`;
        break;
    }

    factors.push({
      name: 'Structure Analysis',
      weight: 0.25,
      score,
      description,
    });

    return score;
  }

  /**
   * Get maximum hierarchy depth
   */
  private static getMaxHierarchyDepth(nodes: any[], depth: number = 0): number {
    if (nodes.length === 0) return depth;

    const maxChildDepth = Math.max(
      0,
      ...nodes.map((node) =>
        this.getMaxHierarchyDepth(node.children || [], depth + 1)
      )
    );

    return Math.max(depth, maxChildDepth);
  }

  /**
   * Calculate content-based score
   */
  private static calculateContentScore(
    format: FormatType,
    text: string,
    factors: PredictionFactor[]
  ): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    let description = '';

    switch (format) {
      case 'meeting-notes':
        const meetingTerms = [
          'meeting',
          'attendees',
          'agenda',
          'discussed',
          'action item',
          'follow up',
        ];
        score = this.countKeywordMatches(lowerText, meetingTerms) / meetingTerms.length;
        description = 'Meeting-related terminology';
        break;

      case 'task-lists':
        const taskTerms = ['todo', 'task', 'complete', 'done', 'finish', 'priority'];
        score = this.countKeywordMatches(lowerText, taskTerms) / taskTerms.length;
        description = 'Task-related terminology';
        break;

      case 'journal-notes':
        const journalTerms = ['today', 'i feel', 'i think', 'my', 'realized', 'grateful'];
        score = this.countKeywordMatches(lowerText, journalTerms) / journalTerms.length;
        description = 'Personal narrative language';
        break;

      case 'shopping-lists':
        const shoppingTerms = ['buy', 'get', 'need', 'store', 'grocery', 'milk', 'bread'];
        score = this.countKeywordMatches(lowerText, shoppingTerms) / shoppingTerms.length;
        description = 'Shopping-related terms';
        break;

      case 'research-notes':
        const researchTerms = ['study', 'research', 'source', 'citation', 'according to', 'et al'];
        score = this.countKeywordMatches(lowerText, researchTerms) / researchTerms.length;
        description = 'Academic terminology';
        break;

      case 'study-notes':
        const studyTerms = ['definition', 'important', 'key term', 'chapter', 'concept', 'example'];
        score = this.countKeywordMatches(lowerText, studyTerms) / studyTerms.length;
        description = 'Educational terminology';
        break;
    }

    factors.push({
      name: 'Content Analysis',
      weight: 0.2,
      score,
      description,
    });

    return score;
  }

  /**
   * Calculate keyword-based score
   */
  private static calculateKeywordScore(
    format: FormatType,
    text: string,
    factors: PredictionFactor[]
  ): number {
    // This is a simplified version - in production you might use TF-IDF or similar
    const keywords = this.extractKeywords(text);
    const formatKeywords = this.getFormatKeywords(format);
    
    const matches = keywords.filter((kw) =>
      formatKeywords.some((fkw) => kw.includes(fkw) || fkw.includes(kw))
    );

    const score = formatKeywords.length > 0 ? matches.length / formatKeywords.length : 0;

    factors.push({
      name: 'Keyword Matching',
      weight: 0.15,
      score,
      description: `${matches.length} relevant keywords found`,
    });

    return score;
  }

  /**
   * Count how many keywords appear in text
   */
  private static countKeywordMatches(text: string, keywords: string[]): number {
    return keywords.filter((keyword) => text.includes(keyword)).length;
  }

  /**
   * Extract keywords from text (simplified)
   */
  private static extractKeywords(text: string): string[] {
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const frequency: Record<string, number> = {};
    
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Get format-specific keywords
   */
  private static getFormatKeywords(format: FormatType): string[] {
    const keywordMap: Record<FormatType, string[]> = {
      'meeting-notes': ['meeting', 'attendees', 'agenda', 'action', 'decision'],
      'task-lists': ['task', 'todo', 'complete', 'priority', 'deadline'],
      'journal-notes': ['today', 'feel', 'think', 'realize', 'grateful'],
      'shopping-lists': ['buy', 'need', 'store', 'grocery', 'item'],
      'research-notes': ['research', 'study', 'source', 'citation', 'reference'],
      'study-notes': ['chapter', 'definition', 'concept', 'important', 'example'],
    };

    return keywordMap[format] || [];
  }

  /**
   * Categorize content into general categories
   */
  private static categorizeContent(
    text: string,
    patterns: PatternMatch[]
  ): Array<{ name: string; confidence: number; description: string; keywords: string[] }> {
    const categories: Array<{ name: string; confidence: number; description: string; keywords: string[] }> = [];

    // Business/Professional
    if (this.hasBusinessContent(text, patterns)) {
      categories.push({
        name: 'Business/Professional',
        confidence: 0.8,
        description: 'Contains business or professional terminology',
        keywords: ['meeting', 'project', 'deadline', 'team'],
      });
    }

    // Personal
    if (this.hasPersonalContent(text)) {
      categories.push({
        name: 'Personal',
        confidence: 0.75,
        description: 'Contains personal or reflective content',
        keywords: ['i', 'my', 'feel', 'think'],
      });
    }

    // Academic
    if (this.hasAcademicContent(text, patterns)) {
      categories.push({
        name: 'Academic',
        confidence: 0.85,
        description: 'Contains academic or research content',
        keywords: ['study', 'research', 'citation', 'theory'],
      });
    }

    return categories;
  }

  /**
   * Check if text has business content
   */
  private static hasBusinessContent(text: string, patterns: PatternMatch[]): boolean {
    const businessTerms = /\b(meeting|project|deadline|client|team|manager|strategy)\b/gi;
    return businessTerms.test(text) || patterns.some(p => p.patternId.includes('meeting') || p.patternId.includes('action'));
  }

  /**
   * Check if text has personal content
   */
  private static hasPersonalContent(text: string): boolean {
    const personalTerms = /\b(i feel|i think|my day|today i|grateful|realized)\b/gi;
    const firstPerson = /\b(i|me|my|myself)\b/gi;
    const matches = text.match(firstPerson);
    return personalTerms.test(text) || (matches !== null && matches.length > 5);
  }

  /**
   * Check if text has academic content
   */
  private static hasAcademicContent(text: string, patterns: PatternMatch[]): boolean {
    const academicTerms = /\b(research|study|hypothesis|theory|methodology|citation|reference|et al)\b/gi;
    return academicTerms.test(text) || patterns.some(p => p.patternId.includes('research') || p.patternId.includes('citation'));
  }

  /**
   * Detect language (simplified - returns English by default)
   */
  private static detectLanguage(text: string): {
    language: string;
    name: string;
    confidence: number;
  } {
    // This is a placeholder - in production you'd use a proper language detection library
    return {
      language: 'en',
      name: 'English',
      confidence: 0.95,
    };
  }

  /**
   * Analyze writing style
   */
  private static analyzeStyle(text: string): {
    formality: 'formal' | 'informal' | 'neutral';
    tone: 'positive' | 'negative' | 'neutral' | 'mixed';
    complexity: 'simple' | 'moderate' | 'complex';
    perspective: 'first-person' | 'second-person' | 'third-person' | 'mixed';
  } {
    const avgSentenceLength = this.getAverageSentenceLength(text);
    const avgWordLength = this.getAverageWordLength(text);
    
    return {
      formality: this.determineFormalityLevel(text),
      tone: this.determineTone(text),
      complexity: avgSentenceLength > 20 ? 'complex' : avgSentenceLength > 12 ? 'moderate' : 'simple',
      perspective: this.determinePerspective(text),
    };
  }

  /**
   * Determine formality level
   */
  private static determineFormalityLevel(text: string): 'formal' | 'informal' | 'neutral' {
    const formalTerms = /\b(therefore|thus|consequently|furthermore|moreover|shall|hereby)\b/gi;
    const informalTerms = /\b(gonna|wanna|yeah|cool|awesome|hey|lol)\b/gi;
    
    const formalCount = (text.match(formalTerms) || []).length;
    const informalCount = (text.match(informalTerms) || []).length;
    
    if (formalCount > informalCount * 2) return 'formal';
    if (informalCount > formalCount * 2) return 'informal';
    return 'neutral';
  }

  /**
   * Determine tone
   */
  private static determineTone(text: string): 'positive' | 'negative' | 'neutral' | 'mixed' {
    const positiveTerms = /\b(happy|joy|success|excellent|wonderful|great|good|amazing)\b/gi;
    const negativeTerms = /\b(sad|bad|terrible|awful|fail|poor|horrible|disappointing)\b/gi;
    
    const positiveCount = (text.match(positiveTerms) || []).length;
    const negativeCount = (text.match(negativeTerms) || []).length;
    
    if (positiveCount > 0 && negativeCount > 0) return 'mixed';
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Determine perspective
   */
  private static determinePerspective(text: string): 'first-person' | 'second-person' | 'third-person' | 'mixed' {
    const firstPerson = (text.match(/\b(i|me|my|we|us|our)\b/gi) || []).length;
    const secondPerson = (text.match(/\b(you|your|yours)\b/gi) || []).length;
    const thirdPerson = (text.match(/\b(he|she|they|it|him|her|them)\b/gi) || []).length;
    
    const counts = [
      { type: 'first-person' as const, count: firstPerson },
      { type: 'second-person' as const, count: secondPerson },
      { type: 'third-person' as const, count: thirdPerson },
    ];
    
    counts.sort((a, b) => b.count - a.count);
    
    // If multiple perspectives are strong, return mixed
    if (counts[1].count > counts[0].count * 0.5) return 'mixed';
    
    return counts[0].type;
  }

  /**
   * Get average sentence length
   */
  private static getAverageSentenceLength(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const words = sentences.reduce((sum, s) => {
      return sum + s.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);
    
    return sentences.length > 0 ? words / sentences.length : 0;
  }

  /**
   * Get average word length
   */
  private static getAverageWordLength(text: string): number {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const totalLength = words.reduce((sum, w) => sum + w.length, 0);
    
    return words.length > 0 ? totalLength / words.length : 0;
  }
}
