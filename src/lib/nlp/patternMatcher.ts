/**
 * Pattern Matcher - Pattern recognition and matching engine
 * 
 * Performs pattern matching against text using defined patterns
 */

import type { PatternMatch, PatternDefinition } from '@/types/nlp';
import { PatternLibrary } from './patternDefinitions';

/**
 * Pattern matching engine
 */
export class PatternMatcher {
  /**
   * Match patterns against text
   */
  static matchPatterns(
    text: string,
    patterns: PatternDefinition[]
  ): PatternMatch[] {
    const matches: PatternMatch[] = [];
    let matchId = 0;

    for (const pattern of patterns) {
      const patternMatches = this.matchSinglePattern(text, pattern, matchId);
      matches.push(...patternMatches);
      matchId += patternMatches.length;
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Match a single pattern against text
   */
  private static matchSinglePattern(
    text: string,
    pattern: PatternDefinition,
    startId: number
  ): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;
    let matchIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const lineNumber = this.getLineNumber(text, match.index);
      
      // Calculate confidence based on pattern weight and match quality
      const confidence = this.calculateMatchConfidence(
        pattern,
        matchText,
        match
      );

      // Extract data if extraction config exists
      const data = pattern.extraction
        ? this.extractPatternData(match, pattern.extraction.groups)
        : undefined;

      // Get context around the match
      const context = this.getMatchContext(text, match.index, matchText.length);

      matches.push({
        patternId: `${pattern.id}-${startId + matchIndex}`,
        name: pattern.name,
        match: matchText,
        position: {
          start: match.index,
          end: match.index + matchText.length,
          line: lineNumber,
        },
        confidence,
        data,
        context,
      });

      matchIndex++;

      // Prevent infinite loops on zero-length matches
      if (matchText.length === 0) {
        regex.lastIndex++;
      }
    }

    return matches;
  }

  /**
   * Calculate confidence score for a match
   */
  private static calculateMatchConfidence(
    pattern: PatternDefinition,
    matchText: string,
    match: RegExpExecArray
  ): number {
    let confidence = pattern.weight;

    // Adjust confidence based on match quality
    // Longer matches generally indicate better confidence
    const lengthFactor = Math.min(matchText.length / 50, 1);
    confidence *= 0.7 + lengthFactor * 0.3;

    // Boost confidence if all capture groups are populated
    if (match.length > 1) {
      const filledGroups = match.slice(1).filter(Boolean).length;
      const totalGroups = match.length - 1;
      const groupCompleteness = filledGroups / totalGroups;
      confidence *= 0.8 + groupCompleteness * 0.2;
    }

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract data from pattern match using extraction groups
   */
  private static extractPatternData(
    match: RegExpExecArray,
    groups: Record<string, { name: string; type: string; required: boolean }>
  ): { raw: Record<string, string>; parsed: Record<string, unknown>; types: Record<string, string> } {
    const raw: Record<string, string> = {};
    const parsed: Record<string, unknown> = {};
    const types: Record<string, string> = {};

    Object.entries(groups).forEach(([key, group], index) => {
      const value = match[index + 1];
      if (value) {
        raw[group.name] = value;
        types[group.name] = group.type;
        
        // Parse based on type
        parsed[group.name] = this.parseValue(value, group.type);
      }
    });

    return { raw, parsed, types };
  }

  /**
   * Parse value based on its type
   */
  private static parseValue(value: string, type: string): unknown {
    switch (type) {
      case 'number':
        return parseFloat(value) || 0;
      case 'date':
        return this.parseDate(value);
      case 'boolean':
        return value.toLowerCase() === 'true' || value === '1';
      case 'email':
        return value.toLowerCase().trim();
      case 'url':
        return value.trim();
      default:
        return value.trim();
    }
  }

  /**
   * Parse date from various formats
   */
  private static parseDate(dateString: string): Date | null {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  /**
   * Get line number for a position in text
   */
  private static getLineNumber(text: string, position: number): number {
    return text.substring(0, position).split('\n').length;
  }

  /**
   * Get context around a match (50 characters before and after)
   */
  private static getMatchContext(
    text: string,
    position: number,
    length: number,
    contextLength: number = 50
  ): string {
    const start = Math.max(0, position - contextLength);
    const end = Math.min(text.length, position + length + contextLength);
    
    let context = text.substring(start, end);
    
    // Add ellipsis if context is truncated
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  }

  /**
   * Calculate pattern match statistics
   */
  static calculatePatternStats(matches: PatternMatch[]): {
    totalMatches: number;
    averageConfidence: number;
    patternCounts: Record<string, number>;
    highConfidenceMatches: number;
  } {
    const totalMatches = matches.length;
    const averageConfidence = totalMatches > 0
      ? matches.reduce((sum, m) => sum + m.confidence, 0) / totalMatches
      : 0;

    const patternCounts: Record<string, number> = {};
    matches.forEach((match) => {
      const patternName = match.name;
      patternCounts[patternName] = (patternCounts[patternName] || 0) + 1;
    });

    const highConfidenceMatches = matches.filter(
      (m) => m.confidence >= 0.7
    ).length;

    return {
      totalMatches,
      averageConfidence,
      patternCounts,
      highConfidenceMatches,
    };
  }
}
