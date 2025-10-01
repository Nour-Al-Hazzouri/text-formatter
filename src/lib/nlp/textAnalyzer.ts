/**
 * Text Analyzer - Comprehensive text structure analysis
 * 
 * Analyzes text structure including sections, lists, paragraphs, and indentation
 */

import type {
  ContentStructure,
  DocumentSection,
  ListStructure,
  ParagraphInfo,
  IndentationPattern,
  StructureNode,
  SectionType,
  ListType,
  ListItem,
  ParagraphType,
} from '@/types/nlp';

/**
 * Text structure analysis engine
 */
export class TextAnalyzer {
  /**
   * Analyze complete text structure
   */
  static analyzeStructure(text: string): ContentStructure {
    const lines = text.split('\n');

    return {
      sections: this.detectSections(text, lines),
      hierarchy: this.buildHierarchy(lines),
      lists: this.detectLists(lines),
      paragraphs: this.analyzeParagraphs(text),
      indentation: this.analyzeIndentation(lines),
    };
  }

  /**
   * Detect document sections
   */
  private static detectSections(
    text: string,
    lines: string[]
  ): DocumentSection[] {
    const sections: DocumentSection[] = [];
    let sectionId = 0;
    let currentSection: DocumentSection | null = null;
    let lineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const sectionType = this.identifySectionType(line);

      if (sectionType === 'header' || sectionType === 'title') {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          id: `section-${sectionId++}`,
          type: sectionType,
          title: line.trim(),
          content: '',
          position: {
            start: lineIndex,
            end: lineIndex + line.length,
            line: i + 1,
          },
          confidence: 0.8,
        };
      } else if (currentSection) {
        // Add to current section content
        currentSection.content += line + '\n';
        currentSection.position.end = lineIndex + line.length;
      } else {
        // Create default section for orphaned content
        currentSection = {
          id: `section-${sectionId++}`,
          type: 'content',
          content: line + '\n',
          position: {
            start: lineIndex,
            end: lineIndex + line.length,
            line: i + 1,
          },
          confidence: 0.6,
        };
      }

      lineIndex += line.length + 1; // +1 for newline
    }

    // Add final section
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Identify section type from line content
   */
  private static identifySectionType(line: string): SectionType {
    const trimmed = line.trim();

    // Markdown headers
    if (/^#{1,6}\s+.+/.test(trimmed)) {
      return 'header';
    }

    // All caps titles
    if (/^[A-Z][A-Z\s]{3,}:?$/.test(trimmed)) {
      return 'title';
    }

    // Quoted content
    if (/^>\s*.+/.test(trimmed)) {
      return 'quote';
    }

    // Code blocks
    if (/^```/.test(trimmed) || /^    /.test(line)) {
      return 'code';
    }

    // List items
    if (/^\s*[-*•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      return 'list';
    }

    return 'content';
  }

  /**
   * Build hierarchical structure from lines
   */
  private static buildHierarchy(lines: string[]): StructureNode[] {
    const root: StructureNode[] = [];
    const stack: StructureNode[] = [];
    let nodeId = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const level = this.getHeadingLevel(line);
      const type = level > 0 ? 'heading' : this.getNodeType(line);

      const node: StructureNode = {
        id: `node-${nodeId++}`,
        level: level || this.getIndentLevel(line),
        type,
        content: trimmed,
        children: [],
      };

      // Find parent in stack
      while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(node);
      } else {
        const parent = stack[stack.length - 1];
        node.parent = parent.id;
        parent.children.push(node);
      }

      stack.push(node);
    }

    return root;
  }

  /**
   * Get heading level (1-6 for markdown headers, 0 for non-headers)
   */
  private static getHeadingLevel(line: string): number {
    const match = line.match(/^(#{1,6})\s+/);
    return match ? match[1].length : 0;
  }

  /**
   * Get node type based on line content
   */
  private static getNodeType(line: string): 'heading' | 'section' | 'item' | 'subitem' {
    if (/^\s*[-*•]\s+/.test(line)) return 'item';
    if (/^\s*\d+\.\s+/.test(line)) return 'item';
    if (/^\s{2,}/.test(line)) return 'subitem';
    return 'section';
  }

  /**
   * Get indentation level
   */
  private static getIndentLevel(line: string): number {
    const match = line.match(/^(\s+)/);
    return match ? Math.floor(match[1].length / 2) : 0;
  }

  /**
   * Detect list structures
   */
  private static detectLists(lines: string[]): ListStructure[] {
    const lists: ListStructure[] = [];
    let currentList: ListStructure | null = null;
    let listId = 0;

    for (const line of lines) {
      if (this.isListItem(line)) {
        const item = this.parseListItem(line);
        
        if (!currentList) {
          // Start new list
          currentList = {
            type: item.marker.match(/\d+/) ? 'ordered' : 'unordered',
            items: [],
            markers: [],
            level: item.level,
            consistency: 1.0,
          };
        }

        currentList.items.push(item);
        if (!currentList.markers.includes(item.marker)) {
          currentList.markers.push(item.marker);
        }
      } else if (currentList && line.trim() === '') {
        // Empty line ends current list
        currentList.consistency = this.calculateListConsistency(currentList);
        lists.push(currentList);
        currentList = null;
      } else if (currentList) {
        // Non-empty, non-list line ends list
        currentList.consistency = this.calculateListConsistency(currentList);
        lists.push(currentList);
        currentList = null;
      }
    }

    // Add final list if exists
    if (currentList) {
      currentList.consistency = this.calculateListConsistency(currentList);
      lists.push(currentList);
    }

    return lists;
  }

  /**
   * Check if line is a list item
   */
  private static isListItem(line: string): boolean {
    return /^\s*[-*•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line) || /^\s*\[[ xX]?\]\s+/.test(line);
  }

  /**
   * Parse individual list item
   */
  private static parseListItem(line: string): ListItem {
    const indentMatch = line.match(/^(\s*)/);
    const level = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0;

    let marker = '-';
    let content = line.trim();
    let type: ListItem['type'] = 'text';

    // Checkbox list
    const checkboxMatch = line.match(/^\s*([-*•])\s*\[([xX ]?)\]\s*(.+)/);
    if (checkboxMatch) {
      marker = checkboxMatch[1];
      type = checkboxMatch[2].toLowerCase() === 'x' ? 'completed-task' : 'task';
      content = checkboxMatch[3];
    }
    // Ordered list
    else if (/^\s*(\d+)\.\s+/.test(line)) {
      const orderedMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
      if (orderedMatch) {
        marker = orderedMatch[1] + '.';
        content = orderedMatch[2];
      }
    }
    // Unordered list
    else if (/^\s*([-*•])\s+/.test(line)) {
      const unorderedMatch = line.match(/^\s*([-*•])\s+(.+)/);
      if (unorderedMatch) {
        marker = unorderedMatch[1];
        content = unorderedMatch[2];
      }
    }

    // Check for priority/date indicators
    const metadata: ListItem['metadata'] = {};
    
    if (/\b(high|urgent|important)\b/i.test(content)) {
      type = 'priority-item';
      metadata.priority = 'high';
    }

    const dateMatch = content.match(/\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/);
    if (dateMatch) {
      type = 'dated-item';
      metadata.dueDate = new Date(dateMatch[1]);
    }

    return {
      content,
      marker,
      level,
      type,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  }

  /**
   * Calculate list consistency score
   */
  private static calculateListConsistency(list: ListStructure): number {
    if (list.items.length === 0) return 0;

    // Check marker consistency
    const uniqueMarkers = new Set(list.items.map(item => item.marker)).size;
    const markerConsistency = 1 - (uniqueMarkers - 1) * 0.2;

    // Check level consistency
    const levels = list.items.map(item => item.level);
    const maxLevel = Math.max(...levels);
    const minLevel = Math.min(...levels);
    const levelConsistency = maxLevel - minLevel <= 2 ? 1 : 0.7;

    return Math.max(0, Math.min(1, (markerConsistency + levelConsistency) / 2));
  }

  /**
   * Analyze paragraphs in text
   */
  private static analyzeParagraphs(text: string): ParagraphInfo[] {
    const paragraphs: ParagraphInfo[] = [];
    const blocks = text.split(/\n\s*\n/);

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim());
      
      paragraphs.push({
        content: trimmed,
        length: trimmed.length,
        sentences: sentences.length,
        type: this.classifyParagraph(trimmed, sentences),
        sentiment: this.analyzeSentiment(trimmed),
      });
    }

    return paragraphs;
  }

  /**
   * Classify paragraph type
   */
  private static classifyParagraph(
    content: string,
    sentences: string[]
  ): ParagraphType {
    const firstSentence = sentences[0]?.toLowerCase() || '';
    
    if (/^(in conclusion|to summarize|finally|in summary)/i.test(firstSentence)) {
      return 'conclusion';
    }
    if (/^(for example|for instance|such as)/i.test(firstSentence)) {
      return 'example';
    }
    if (content.startsWith('>') || content.startsWith('"')) {
      return 'quote';
    }
    if (sentences.length === 1 && content.length < 100) {
      return 'introduction';
    }
    
    return 'body';
  }

  /**
   * Analyze sentiment (simple keyword-based)
   */
  private static analyzeSentiment(text: string): number {
    const positive = /\b(good|great|excellent|happy|joy|success|wonderful|amazing)\b/gi;
    const negative = /\b(bad|terrible|awful|sad|fail|poor|horrible|disappointing)\b/gi;
    
    const positiveMatches = (text.match(positive) || []).length;
    const negativeMatches = (text.match(negative) || []).length;
    
    const total = positiveMatches + negativeMatches;
    if (total === 0) return 0;
    
    return (positiveMatches - negativeMatches) / total;
  }

  /**
   * Analyze indentation patterns
   */
  private static analyzeIndentation(lines: string[]): IndentationPattern[] {
    const patterns: Map<string, IndentationPattern> = new Map();

    lines.forEach((line, index) => {
      if (!line.trim()) return;

      const indent = line.match(/^(\s+)/);
      if (!indent) return;

      const indentStr = indent[1];
      const type = indentStr.includes('\t') ? 'tabs' : 'spaces';
      const size = type === 'tabs' ? indentStr.length : indentStr.length;
      const key = `${type}-${size}`;

      if (!patterns.has(key)) {
        patterns.set(key, {
          type: type as 'spaces' | 'tabs' | 'mixed',
          size,
          consistency: 1.0,
          lines: [],
        });
      }

      patterns.get(key)!.lines.push(index + 1);
    });

    // Calculate consistency for each pattern
    return Array.from(patterns.values()).map(pattern => ({
      ...pattern,
      consistency: this.calculateIndentConsistency(pattern, lines.length),
    }));
  }

  /**
   * Calculate indentation consistency
   */
  private static calculateIndentConsistency(
    pattern: IndentationPattern,
    totalLines: number
  ): number {
    const usageRatio = pattern.lines.length / totalLines;
    return Math.min(1, usageRatio * 2); // Boost patterns used in at least 50% of lines
  }

  /**
   * Get basic text statistics
   */
  static getTextStatistics(text: string): {
    characters: number;
    words: number;
    sentences: number;
    paragraphs: number;
    lines: number;
    avgWordLength: number;
    avgSentenceLength: number;
  } {
    const lines = text.split('\n');
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

    const avgWordLength = words.length > 0
      ? words.reduce((sum, w) => sum + w.length, 0) / words.length
      : 0;

    const wordsInSentences = sentences.reduce((sum, s) => {
      return sum + s.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);
    const avgSentenceLength = sentences.length > 0
      ? wordsInSentences / sentences.length
      : 0;

    return {
      characters: text.length,
      words: words.length,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      lines: lines.length,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    };
  }
}
