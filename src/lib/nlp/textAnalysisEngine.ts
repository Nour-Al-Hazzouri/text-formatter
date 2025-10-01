/**
 * Text Analysis Engine - Main orchestrator for pattern recognition
 * 
 * Coordinates all analysis components to provide comprehensive text analysis
 */

import type { FormatType } from '@/types/index';
import type { TextAnalysis, AnalysisMetadata, ConfidenceScores, AnalysisStatistics } from '@/types/nlp';
import { PatternLibrary } from './patternDefinitions';
import { PatternMatcher } from './patternMatcher';
import { TextAnalyzer } from './textAnalyzer';
import { ContentClassifier } from './contentClassifier';
import { EntityRecognizer } from './entityRecognizer';

/**
 * Main text analysis engine
 */
export class TextAnalysisEngine {
  /**
   * Perform complete text analysis
   */
  static analyzeText(text: string, targetFormat?: FormatType): TextAnalysis {
    const startTime = performance.now();

    // Get patterns to match
    const patterns = targetFormat
      ? PatternLibrary.getPatterns(targetFormat)
      : PatternLibrary.getAllPatterns();

    // Perform pattern matching
    const patternMatches = PatternMatcher.matchPatterns(text, patterns);

    // Analyze text structure
    const structure = TextAnalyzer.analyzeStructure(text);

    // Extract entities
    const entities = EntityRecognizer.extractEntities(text);

    // Classify content and predict formats
    const classification = ContentClassifier.classifyContent(
      text,
      structure,
      patternMatches
    );

    // Calculate confidence scores
    const confidence = this.calculateConfidenceScores(
      patternMatches,
      structure,
      classification
    );

    // Gather statistics
    const statistics = this.gatherStatistics(
      text,
      patternMatches,
      entities,
      performance.now() - startTime
    );

    // Create metadata
    const metadata = this.createMetadata(text, performance.now() - startTime);

    return {
      metadata,
      structure,
      patterns: patternMatches,
      entities,
      classification,
      confidence,
      statistics,
    };
  }

  /**
   * Quick format detection (lightweight analysis)
   */
  static detectFormat(text: string): {
    suggestedFormat: FormatType;
    confidence: number;
    alternatives: Array<{ format: FormatType; confidence: number }>;
  } {
    const startTime = performance.now();

    // Perform lightweight analysis
    const patterns = PatternLibrary.getAllPatterns();
    const patternMatches = PatternMatcher.matchPatterns(text, patterns);
    const structure = TextAnalyzer.analyzeStructure(text);

    // Classify content
    const classification = ContentClassifier.classifyContent(
      text,
      structure,
      patternMatches
    );

    const predictions = classification.formatPredictions;
    const topPrediction = predictions[0];

    return {
      suggestedFormat: topPrediction.format,
      confidence: topPrediction.confidence,
      alternatives: predictions.slice(1, 4).map((p) => ({
        format: p.format,
        confidence: p.confidence,
      })),
    };
  }

  /**
   * Calculate comprehensive confidence scores
   */
  private static calculateConfidenceScores(
    patterns: any[],
    structure: any,
    classification: any
  ): ConfidenceScores {
    // Pattern recognition confidence
    const patternStats = PatternMatcher.calculatePatternStats(patterns);
    const patternRecognition = patternStats.averageConfidence;

    // Structure analysis confidence
    const structureAnalysis = this.calculateStructureConfidence(structure);

    // Format detection confidence
    const formatDetection =
      classification.formatPredictions.length > 0
        ? classification.formatPredictions[0].confidence / 100
        : 0.5;

    // Entity extraction confidence
    const entityConfidences = patterns
      .filter((p) => p.data)
      .map((p) => p.confidence);
    const entityExtraction =
      entityConfidences.length > 0
        ? entityConfidences.reduce((sum, c) => sum + c, 0) /
          entityConfidences.length
        : 0.7;

    // Content classification confidence
    const contentClassification =
      classification.categories.length > 0
        ? classification.categories.reduce((sum: number, c: any) => sum + c.confidence, 0) /
          classification.categories.length
        : 0.6;

    // Overall confidence (weighted average)
    const overall =
      formatDetection * 0.3 +
      patternRecognition * 0.25 +
      structureAnalysis * 0.2 +
      entityExtraction * 0.15 +
      contentClassification * 0.1;

    return {
      overall,
      formatDetection,
      patternRecognition,
      entityExtraction,
      structureAnalysis,
      contentClassification,
    };
  }

  /**
   * Calculate structure confidence
   */
  private static calculateStructureConfidence(structure: any): number {
    const scores: number[] = [];

    // Section confidence
    if (structure.sections.length > 0) {
      const avgSectionConfidence =
        structure.sections.reduce((sum: number, s: any) => sum + s.confidence, 0) /
        structure.sections.length;
      scores.push(avgSectionConfidence);
    }

    // List consistency
    if (structure.lists.length > 0) {
      const avgListConsistency =
        structure.lists.reduce((sum: number, l: any) => sum + l.consistency, 0) /
        structure.lists.length;
      scores.push(avgListConsistency);
    }

    // Indentation consistency
    if (structure.indentation.length > 0) {
      const avgIndentConsistency =
        structure.indentation.reduce((sum: number, i: any) => sum + i.consistency, 0) /
        structure.indentation.length;
      scores.push(avgIndentConsistency);
    }

    // Return average if we have scores, otherwise default
    return scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0.7;
  }

  /**
   * Gather analysis statistics
   */
  private static gatherStatistics(
    text: string,
    patterns: any[],
    entities: any[],
    duration: number
  ): AnalysisStatistics {
    const textStats = TextAnalyzer.getTextStatistics(text);
    const patternStats = PatternMatcher.calculatePatternStats(patterns);

    // Entity statistics by type
    const entityByType: Record<string, number> = {};
    entities.forEach((entity) => {
      entityByType[entity.type] = (entityByType[entity.type] || 0) + 1;
    });

    const entityConfidences = entities.map((e) => e.confidence);
    const avgEntityConfidence =
      entityConfidences.length > 0
        ? entityConfidences.reduce((sum, c) => sum + c, 0) / entityConfidences.length
        : 0;

    return {
      performance: {
        totalTime: duration,
        stageTimes: {
          patternMatching: duration * 0.3,
          structureAnalysis: duration * 0.25,
          entityExtraction: duration * 0.2,
          classification: duration * 0.25,
        },
      },
      content: {
        characters: textStats.characters,
        words: textStats.words,
        sentences: textStats.sentences,
        paragraphs: textStats.paragraphs,
        lines: textStats.lines,
        uniqueWords: 0, // Could implement this if needed
        avgWordLength: textStats.avgWordLength,
        avgSentenceLength: textStats.avgSentenceLength,
      },
      patterns: {
        patternsTestd: patterns.length,
        patternsMatched: patternStats.totalMatches,
        successRate: patterns.length > 0 ? patternStats.totalMatches / patterns.length : 0,
        avgConfidence: patternStats.averageConfidence,
        byCategory: patternStats.patternCounts,
      },
      entities: {
        totalEntities: entities.length,
        byType: entityByType as any,
        avgConfidence: avgEntityConfidence,
        uniqueEntities: new Set(entities.map((e) => e.value)).size,
      },
    };
  }

  /**
   * Create analysis metadata
   */
  private static createMetadata(text: string, duration: number): AnalysisMetadata {
    const textStats = TextAnalyzer.getTextStatistics(text);

    return {
      analyzedAt: new Date(),
      duration,
      version: '1.0.0',
      engine: {
        name: 'TextAnalysisEngine',
        version: '1.0.0',
      },
      input: {
        length: text.length,
        lines: textStats.lines,
        words: textStats.words,
        sentences: textStats.sentences,
        language: 'en',
      },
    };
  }

  /**
   * Validate analysis results
   */
  static validateAnalysis(analysis: TextAnalysis): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check confidence thresholds
    if (analysis.confidence.overall < 0.3) {
      issues.push('Overall confidence is very low');
    }

    // Check if format was detected
    if (analysis.classification.formatPredictions.length === 0) {
      issues.push('No format predictions available');
    }

    // Check if any patterns matched
    if (analysis.patterns.length === 0) {
      issues.push('No patterns matched in text');
    }

    // Check processing time
    if (analysis.metadata.duration > 5000) {
      issues.push('Analysis took longer than expected');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
