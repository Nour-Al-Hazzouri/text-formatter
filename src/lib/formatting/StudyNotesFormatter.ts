/**
 * Study Notes Formatter - Transforms linear notes into structured study materials
 * 
 * Features:
 * - Outline conversion from linear notes
 * - Q&A section generation from content
 * - Definition highlighting and formatting
 * - Topic and subtopic organization
 * - Summary point extraction
 * - Study guide formatting
 */

import type { TextInput, FormattedOutput, ExtractedData, ProcessingStats } from '@/types/formatting';

/**
 * Parsed outline section
 */
interface ParsedOutlineSection {
  level: number;
  title: string;
  content?: string;
  subsections: ParsedOutlineSection[];
  id: string;
  originalLines: string[];
}

/**
 * Parsed Q&A pair
 */
interface ParsedQAPair {
  question: string;
  answer: string;
  type: 'definition' | 'explanation' | 'example' | 'analysis' | 'comparison';
  difficulty?: 'easy' | 'medium' | 'hard';
  topics: string[];
}

/**
 * Parsed definition
 */
interface ParsedDefinition {
  term: string;
  definition: string;
  context?: string;
  example?: string;
  relatedTerms: string[];
}

/**
 * Parsed study topic
 */
interface ParsedStudyTopic {
  name: string;
  importance: 'low' | 'medium' | 'high';
  sectionIds: string[];
  definitionIds: string[];
}

/**
 * Organized study material
 */
interface OrganizedStudyMaterial {
  outline: ParsedOutlineSection[];
  qaPairs: ParsedQAPair[];
  definitions: ParsedDefinition[];
  topics: ParsedStudyTopic[];
  totalSections: number;
  confidence: number;
}

/**
 * Patterns for identifying different types of study content
 */
const DEFINITION_PATTERNS = [
  /^([A-Z][a-zA-Z\s]+):\s*(.+)$/gm,                    // Term: definition
  /^([A-Z][a-zA-Z\s]+)\s*[-–—]\s*(.+)$/gm,             // Term - definition
  /^([A-Z][a-zA-Z\s]+)\s*is\s+(.+)$/gmi,               // Term is definition
  /^([A-Z][a-zA-Z\s]+)\s*means\s+(.+)$/gmi,            // Term means definition
  /^([A-Z][a-zA-Z\s]+)\s*refers to\s+(.+)$/gmi,        // Term refers to definition
  /^Definition of\s+([^:]+):\s*(.+)$/gmi,               // Definition of Term: text
];

/**
 * Patterns for identifying questions
 */
const QUESTION_PATTERNS = [
  /^(What|How|Why|When|Where|Who)\s+.+\?$/gmi,          // Standard questions
  /^.+\?$/gm,                                           // Any line ending with ?
  /^Q\d*[:.)\s]+(.+\??)$/gmi,                          // Q1: or Q. format
  /^Question\s*\d*[:.)\s]+(.+\??)$/gmi,                // Question format
];

/**
 * Patterns for outline structure
 */
const OUTLINE_PATTERNS = [
  /^(#{1,6})\s+(.+)$/gm,                               // Markdown headers
  /^(\d+\.)+\s+(.+)$/gm,                               // Numbered outlines (1.1.1)
  /^([A-Z]\.|\d+\.)\s+(.+)$/gm,                        // Simple numbering (A. or 1.)
  /^([IVX]+\.)\s+(.+)$/gm,                             // Roman numerals
  /^[-*•]\s+(.+)$/gm,                                  // Bullet points
  /^[A-Z\s]{3,}$/gm,                                   // ALL CAPS headers
];

/**
 * Keywords that indicate important study topics
 */
const IMPORTANCE_KEYWORDS = {
  high: ['important', 'critical', 'key', 'essential', 'fundamental', 'major', 'primary', 'main'],
  medium: ['significant', 'notable', 'relevant', 'useful', 'consider', 'remember', 'note'],
  low: ['minor', 'secondary', 'additional', 'supplementary', 'optional', 'bonus']
};

/**
 * Question type indicators
 */
const QUESTION_TYPE_INDICATORS = {
  definition: ['what is', 'define', 'meaning of', 'definition'],
  explanation: ['how does', 'why does', 'explain', 'describe'],
  example: ['give an example', 'provide example', 'such as', 'for instance'],
  analysis: ['analyze', 'compare', 'contrast', 'evaluate', 'assess'],
  comparison: ['difference between', 'similar to', 'compare', 'contrast']
};

export class StudyNotesFormatter {
  /**
   * Format study notes from unstructured text
   */
  static async format(input: TextInput): Promise<FormattedOutput> {
    const startTime = performance.now();
    const lines = input.content.split('\n');
    
    // Organize study material
    const organized = this.organizeStudyMaterial(lines);
    
    // Build formatted output
    const formattedText = this.buildFormattedOutput(organized);
    
    // Calculate statistics
    const stats = this.calculateStats(input.content, organized);
    const duration = performance.now() - startTime;

    // Extract study-specific data
    const extractedData = this.extractStudyData(organized);

    return {
      format: 'study-notes',
      content: formattedText,
      metadata: {
        processedAt: new Date(),
        duration,
        confidence: organized.confidence,
        itemCount: organized.totalSections,
        stats,
      },
      data: extractedData,
    };
  }

  /**
   * Organize study material from raw lines
   */
  private static organizeStudyMaterial(lines: string[]): OrganizedStudyMaterial {
    const outline: ParsedOutlineSection[] = [];
    const qaPairs: ParsedQAPair[] = [];
    const definitions: ParsedDefinition[] = [];
    const topics: ParsedStudyTopic[] = [];

    // First pass: Extract definitions
    const fullText = lines.join('\n');
    this.extractDefinitions(fullText).forEach(def => definitions.push(def));

    // Second pass: Build outline structure
    const outlineStructure = this.buildOutlineStructure(lines);
    outline.push(...outlineStructure);

    // Third pass: Generate Q&A pairs from content
    this.generateQAPairs(lines, definitions).forEach(qa => qaPairs.push(qa));

    // Fourth pass: Identify study topics
    this.identifyStudyTopics(outline, definitions, qaPairs).forEach(topic => topics.push(topic));

    const confidence = this.calculateConfidence(outline, qaPairs, definitions);

    return {
      outline,
      qaPairs,
      definitions,
      topics,
      totalSections: outline.length,
      confidence,
    };
  }

  /**
   * Extract definitions from text
   */
  private static extractDefinitions(text: string): ParsedDefinition[] {
    const definitions: ParsedDefinition[] = [];
    const foundTerms = new Set<string>();

    for (const pattern of DEFINITION_PATTERNS) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        const term = match[1]?.trim();
        const definition = match[2]?.trim();
        
        if (term && definition && term.length < 50 && definition.length > 10 && !foundTerms.has(term.toLowerCase())) {
          foundTerms.add(term.toLowerCase());
          
          const parsedDef: ParsedDefinition = {
            term,
            definition,
            context: this.extractContext(text, match[0]),
            example: this.extractExample(definition),
            relatedTerms: this.findRelatedTerms(term, Array.from(foundTerms))
          };
          
          definitions.push(parsedDef);
        }
      }
    }

    return definitions;
  }

  /**
   * Extract context around a definition
   */
  private static extractContext(text: string, defText: string): string | undefined {
    const index = text.indexOf(defText);
    if (index === -1) return undefined;
    
    // Look for the sentence before and after
    const beforeText = text.substring(Math.max(0, index - 100), index).trim();
    const afterText = text.substring(index + defText.length, index + defText.length + 100).trim();
    
    const context = [beforeText.split('.').pop(), afterText.split('.')[0]]
      .filter(Boolean)
      .join(' ');
    
    return context.length > 20 ? context : undefined;
  }

  /**
   * Extract example from definition text
   */
  private static extractExample(definition: string): string | undefined {
    const examplePatterns = [
      /for example[,:]?\s*(.+?)(?:\.|$)/i,
      /such as\s+(.+?)(?:\.|$)/i,
      /e\.g\.[\s,]*(.+?)(?:\.|$)/i,
      /including\s+(.+?)(?:\.|$)/i
    ];

    for (const pattern of examplePatterns) {
      const match = definition.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Find related terms
   */
  private static findRelatedTerms(term: string, allTerms: string[]): string[] {
    const termWords = term.toLowerCase().split(/\s+/);
    const related: string[] = [];
    
    for (const otherTerm of allTerms) {
      if (otherTerm === term.toLowerCase()) continue;
      
      const otherWords = otherTerm.split(/\s+/);
      const commonWords = termWords.filter(word => 
        word.length > 3 && otherWords.some(other => other.includes(word) || word.includes(other))
      );
      
      if (commonWords.length > 0) {
        related.push(otherTerm);
      }
    }
    
    return related.slice(0, 3); // Limit to 3 related terms
  }

  /**
   * Build outline structure from lines
   */
  private static buildOutlineStructure(lines: string[]): ParsedOutlineSection[] {
    const outline: ParsedOutlineSection[] = [];
    let currentSection: ParsedOutlineSection | null = null;
    let sectionCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (!trimmed) continue;

      const outlineLevel = this.detectOutlineLevel(trimmed);
      
      if (outlineLevel > 0) {
        // Save previous section if exists
        if (currentSection) {
          outline.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          level: outlineLevel,
          title: this.cleanTitle(trimmed),
          content: '',
          subsections: [],
          id: `section-${++sectionCounter}`,
          originalLines: [line]
        };
      } else if (currentSection) {
        // Add content to current section
        currentSection.originalLines.push(line);
        if (trimmed.length > 0) {
          currentSection.content = currentSection.content 
            ? `${currentSection.content}\n${trimmed}`
            : trimmed;
        }
      } else {
        // Create a default section for orphaned content
        currentSection = {
          level: 1,
          title: 'Introduction',
          content: trimmed,
          subsections: [],
          id: `section-${++sectionCounter}`,
          originalLines: [line]
        };
      }
    }

    // Add the last section
    if (currentSection) {
      outline.push(currentSection);
    }

    // Build hierarchical structure
    return this.buildHierarchy(outline);
  }

  /**
   * Detect outline level from line
   */
  private static detectOutlineLevel(line: string): number {
    // Markdown headers
    const headerMatch = line.match(/^(#{1,6})\s/);
    if (headerMatch) {
      return headerMatch[1].length;
    }

    // Numbered outlines (1.1.1 format)
    const numberedMatch = line.match(/^(\d+\.)+/);
    if (numberedMatch) {
      return (numberedMatch[0].match(/\./g) || []).length;
    }

    // Simple numbering or letters
    if (/^([A-Z]\.|\d+\.)\s/.test(line)) {
      return 1;
    }

    // Roman numerals
    if (/^[IVX]+\.\s/.test(line)) {
      return 1;
    }

    // Bullet points
    if (/^[-*•]\s/.test(line)) {
      return 2;
    }

    // ALL CAPS (likely headers)
    if (/^[A-Z\s]{3,}$/.test(line) && line.length < 50) {
      return 1;
    }

    return 0; // Not an outline item
  }

  /**
   * Clean title text
   */
  private static cleanTitle(title: string): string {
    return title
      .replace(/^#+\s*/, '')           // Remove markdown headers
      .replace(/^\d+\.\s*/, '')        // Remove numbering
      .replace(/^[A-Z]\.\s*/, '')      // Remove letter numbering
      .replace(/^[IVX]+\.\s*/, '')     // Remove roman numerals
      .replace(/^[-*•]\s*/, '')        // Remove bullets
      .trim();
  }

  /**
   * Build hierarchical outline structure
   */
  private static buildHierarchy(flatOutline: ParsedOutlineSection[]): ParsedOutlineSection[] {
    const result: ParsedOutlineSection[] = [];
    const stack: ParsedOutlineSection[] = [];

    for (const section of flatOutline) {
      // Pop sections from stack until we find the right parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // Top level section
        result.push(section);
      } else {
        // Add as subsection to the last item in stack
        stack[stack.length - 1].subsections.push(section);
      }

      stack.push(section);
    }

    return result;
  }

  /**
   * Generate Q&A pairs from content
   */
  private static generateQAPairs(lines: string[], definitions: ParsedDefinition[]): ParsedQAPair[] {
    const qaPairs: ParsedQAPair[] = [];
    const text = lines.join('\n');

    // Extract explicit questions
    for (const pattern of QUESTION_PATTERNS) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        const question = this.cleanQuestion(match[1] || match[0]);
        if (question.length > 10) {
          const answer = this.findAnswer(question, text, lines);
          if (answer) {
            const type = this.determineQuestionType(question);
            const difficulty = this.estimateDifficulty(question, answer);
            const topics = this.extractTopicsFromText(question + ' ' + answer);

            qaPairs.push({
              question,
              answer,
              type,
              difficulty,
              topics
            });
          }
        }
      }
    }

    // Generate questions from definitions
    for (const definition of definitions) {
      // Create definition question
      qaPairs.push({
        question: `What is ${definition.term}?`,
        answer: definition.definition,
        type: 'definition',
        difficulty: 'easy',
        topics: [definition.term.toLowerCase()]
      });

      // Create example question if example exists
      if (definition.example) {
        qaPairs.push({
          question: `Give an example of ${definition.term}.`,
          answer: definition.example,
          type: 'example',
          difficulty: 'medium',
          topics: [definition.term.toLowerCase()]
        });
      }
    }

    return qaPairs.slice(0, 20); // Limit to prevent overwhelming output
  }

  /**
   * Clean question text
   */
  private static cleanQuestion(question: string): string {
    return question
      .replace(/^Q\d*[:.)\s]+/i, '')
      .replace(/^Question\s*\d*[:.)\s]+/i, '')
      .trim();
  }

  /**
   * Find answer for a question in the text
   */
  private static findAnswer(question: string, fullText: string, lines: string[]): string | undefined {
    const questionIndex = fullText.toLowerCase().indexOf(question.toLowerCase());
    if (questionIndex === -1) return undefined;

    // Look for answer in the next few sentences
    const afterQuestion = fullText.substring(questionIndex + question.length);
    const sentences = afterQuestion.split(/[.!?]+/);
    
    // Take the first 2-3 sentences as potential answer
    const answer = sentences.slice(0, 3)
      .join('. ')
      .trim();

    return answer.length > 10 && answer.length < 300 ? answer : undefined;
  }

  /**
   * Determine question type from content
   */
  private static determineQuestionType(question: string): 'definition' | 'explanation' | 'example' | 'analysis' | 'comparison' {
    const lowerQuestion = question.toLowerCase();

    for (const [type, indicators] of Object.entries(QUESTION_TYPE_INDICATORS)) {
      if (indicators.some(indicator => lowerQuestion.includes(indicator))) {
        return type as any;
      }
    }

    return 'explanation'; // Default type
  }

  /**
   * Estimate difficulty of a question
   */
  private static estimateDifficulty(question: string, answer: string): 'easy' | 'medium' | 'hard' {
    const questionLength = question.split(/\s+/).length;
    const answerLength = answer.split(/\s+/).length;
    
    // Simple heuristics
    if (question.toLowerCase().includes('define') || question.toLowerCase().includes('what is')) {
      return 'easy';
    }
    
    if (questionLength > 10 || answerLength > 50) {
      return 'hard';
    }
    
    if (question.toLowerCase().includes('analyze') || question.toLowerCase().includes('compare')) {
      return 'hard';
    }
    
    return 'medium';
  }

  /**
   * Extract topics from text
   */
  private static extractTopicsFromText(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const topics: string[] = [];
    
    // Look for capitalized words (likely topic names)
    const capitalWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
    topics.push(...capitalWords.filter(word => word.length > 3).map(word => word.toLowerCase()));
    
    // Look for repeated important words
    const wordCount = new Map<string, number>();
    words.filter(word => word.length > 4).forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    // Add words that appear multiple times
    for (const [word, count] of wordCount.entries()) {
      if (count > 1 && !topics.includes(word)) {
        topics.push(word);
      }
    }
    
    return [...new Set(topics)].slice(0, 5);
  }

  /**
   * Identify study topics from all content
   */
  private static identifyStudyTopics(
    outline: ParsedOutlineSection[], 
    definitions: ParsedDefinition[], 
    qaPairs: ParsedQAPair[]
  ): ParsedStudyTopic[] {
    const topicMap = new Map<string, {
      importance: 'low' | 'medium' | 'high';
      sectionIds: string[];
      definitionIds: string[];
      count: number;
    }>();

    // Collect topics from outline sections
    this.collectTopicsFromSections(outline, topicMap);

    // Collect topics from definitions
    definitions.forEach(def => {
      const topic = def.term.toLowerCase();
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { importance: 'medium', sectionIds: [], definitionIds: [], count: 0 });
      }
      topicMap.get(topic)!.definitionIds.push(def.term);
      topicMap.get(topic)!.count++;
    });

    // Collect topics from Q&A pairs
    qaPairs.forEach(qa => {
      qa.topics.forEach(topic => {
        if (!topicMap.has(topic)) {
          topicMap.set(topic, { importance: 'low', sectionIds: [], definitionIds: [], count: 0 });
        }
        topicMap.get(topic)!.count++;
      });
    });

    // Convert to study topics
    const studyTopics: ParsedStudyTopic[] = [];
    for (const [name, data] of topicMap.entries()) {
      if (data.count > 0) {
        studyTopics.push({
          name,
          importance: data.count > 3 ? 'high' : data.count > 1 ? 'medium' : 'low',
          sectionIds: data.sectionIds,
          definitionIds: data.definitionIds
        });
      }
    }

    return studyTopics.sort((a, b) => {
      const importanceOrder = { high: 3, medium: 2, low: 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    });
  }

  /**
   * Collect topics from outline sections recursively
   */
  private static collectTopicsFromSections(
    sections: ParsedOutlineSection[], 
    topicMap: Map<string, any>
  ): void {
    sections.forEach(section => {
      const topic = section.title.toLowerCase();
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { importance: 'medium', sectionIds: [], definitionIds: [], count: 0 });
      }
      
      topicMap.get(topic)!.sectionIds.push(section.id);
      topicMap.get(topic)!.count++;
      
      // Check for importance keywords
      const fullContent = (section.title + ' ' + (section.content || '')).toLowerCase();
      for (const [importance, keywords] of Object.entries(IMPORTANCE_KEYWORDS)) {
        if (keywords.some(keyword => fullContent.includes(keyword))) {
          topicMap.get(topic)!.importance = importance;
          break;
        }
      }
      
      // Process subsections
      this.collectTopicsFromSections(section.subsections, topicMap);
    });
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(
    outline: ParsedOutlineSection[], 
    qaPairs: ParsedQAPair[], 
    definitions: ParsedDefinition[]
  ): number {
    let score = 50; // Base score

    // Boost for outline structure
    if (outline.length > 0) {
      score += Math.min(20, outline.length * 3);
    }

    // Boost for definitions
    if (definitions.length > 0) {
      score += Math.min(15, definitions.length * 2);
    }

    // Boost for Q&A pairs
    if (qaPairs.length > 0) {
      score += Math.min(15, qaPairs.length * 1);
    }

    // Boost for hierarchical structure
    const hasHierarchy = outline.some(section => section.subsections.length > 0);
    if (hasHierarchy) score += 10;

    return Math.min(100, Math.round(score));
  }

  /**
   * Build formatted output
   */
  private static buildFormattedOutput(organized: OrganizedStudyMaterial): string {
    const sections: string[] = [];
    
    // Add header
    sections.push('# 📚 Study Guide\n');
    
    // Add outline
    if (organized.outline.length > 0) {
      sections.push('## 📋 Study Outline\n');
      organized.outline.forEach(section => {
        sections.push(this.formatOutlineSection(section, 1));
      });
      sections.push('');
    }
    
    // Add definitions
    if (organized.definitions.length > 0) {
      sections.push('## 📖 Key Definitions\n');
      organized.definitions.forEach((def, index) => {
        sections.push(`### ${def.term}\n`);
        sections.push(`${def.definition}\n`);
        
        if (def.example) {
          sections.push(`**Example:** ${def.example}\n`);
        }
        
        if (def.relatedTerms.length > 0) {
          sections.push(`**Related terms:** ${def.relatedTerms.join(', ')}\n`);
        }
        
        sections.push('');
      });
    }
    
    // Add Q&A section
    if (organized.qaPairs.length > 0) {
      sections.push('## ❓ Study Questions\n');
      organized.qaPairs.forEach((qa, index) => {
        const difficultyEmoji = {
          easy: '🟢',
          medium: '🟡', 
          hard: '🔴'
        }[qa.difficulty || 'medium'];
        
        sections.push(`### Q${index + 1}: ${qa.question} ${difficultyEmoji}\n`);
        sections.push(`**Answer:** ${qa.answer}\n`);
        
        if (qa.topics.length > 0) {
          sections.push(`**Topics:** ${qa.topics.join(', ')}\n`);
        }
        
        sections.push('');
      });
    }
    
    // Add study topics
    if (organized.topics.length > 0) {
      sections.push('## 🎯 Key Topics\n');
      const topicsByImportance = {
        high: organized.topics.filter(t => t.importance === 'high'),
        medium: organized.topics.filter(t => t.importance === 'medium'),
        low: organized.topics.filter(t => t.importance === 'low')
      };
      
      if (topicsByImportance.high.length > 0) {
        sections.push('### 🔥 High Priority\n');
        topicsByImportance.high.forEach(topic => {
          sections.push(`- **${topic.name}**`);
        });
        sections.push('');
      }
      
      if (topicsByImportance.medium.length > 0) {
        sections.push('### 📌 Medium Priority\n');
        topicsByImportance.medium.forEach(topic => {
          sections.push(`- ${topic.name}`);
        });
        sections.push('');
      }
      
      if (topicsByImportance.low.length > 0) {
        sections.push('### 📝 Review\n');
        topicsByImportance.low.forEach(topic => {
          sections.push(`- ${topic.name}`);
        });
        sections.push('');
      }
    }
    
    // Add summary
    sections.push(`\n---\n**Summary:** ${organized.totalSections} sections • ${organized.definitions.length} definitions • ${organized.qaPairs.length} study questions`);
    
    return sections.join('\n');
  }

  /**
   * Format outline section recursively
   */
  private static formatOutlineSection(section: ParsedOutlineSection, depth: number): string {
    const indent = '  '.repeat(depth - 1);
    const bullet = depth === 1 ? '###' : depth === 2 ? '-' : '  •';
    
    let result = `${indent}${bullet} ${section.title}\n`;
    
    if (section.content && section.content.trim()) {
      const contentIndent = '  '.repeat(depth);
      result += `${contentIndent}${section.content}\n\n`;
    }
    
    // Add subsections
    section.subsections.forEach(subsection => {
      result += this.formatOutlineSection(subsection, depth + 1);
    });
    
    return result;
  }

  /**
   * Calculate processing statistics
   */
  private static calculateStats(originalText: string, organized: OrganizedStudyMaterial): ProcessingStats {
    const originalLines = originalText.split('\n').filter(line => line.trim()).length;
    const totalDefinitions = organized.definitions.length;
    const totalQuestions = organized.qaPairs.length;
    const totalTopics = organized.topics.length;
    
    return {
      linesProcessed: originalLines,
      patternsMatched: organized.totalSections,
      itemsExtracted: totalDefinitions + totalQuestions + totalTopics,
      duplicatesRemoved: 0, // Not applicable for study notes
      changesApplied: organized.outline.length + (totalDefinitions > 0 ? 1 : 0) + (totalQuestions > 0 ? 1 : 0),
    };
  }

  /**
   * Extract study-specific data
   */
  private static extractStudyData(organized: OrganizedStudyMaterial): ExtractedData {
    const studyData = {
      outline: organized.outline.map(section => ({
        level: section.level,
        title: section.title,
        content: section.content,
        subsections: section.subsections,
        id: section.id
      })),
      qaPairs: organized.qaPairs,
      definitions: organized.definitions,
      topics: organized.topics,
    };

    return {
      common: {
        dates: [], // Study notes don't typically have date extraction
        urls: [],
        emails: [],
        phoneNumbers: [],
        mentions: organized.definitions.map(d => d.term),
        hashtags: organized.topics.map(topic => `#${topic.name.replace(/\s+/g, '')}`),
      },
      formatSpecific: studyData,
    };
  }
}
