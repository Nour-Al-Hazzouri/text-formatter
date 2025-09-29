/**
 * NLP Types - Natural Language Processing and Pattern Recognition
 * 
 * Types for content analysis, pattern matching, and intelligent format detection
 */

import type { FormatType } from './index';

// ============================================================================
// Content Analysis Types
// ============================================================================

/**
 * Text analysis results
 */
export interface TextAnalysis {
  /** Analysis metadata */
  metadata: AnalysisMetadata;
  
  /** Content structure analysis */
  structure: ContentStructure;
  
  /** Pattern matches found */
  patterns: PatternMatch[];
  
  /** Extracted entities */
  entities: ExtractedEntity[];
  
  /** Content classification results */
  classification: ContentClassification;
  
  /** Confidence scores */
  confidence: ConfidenceScores;
  
  /** Processing statistics */
  statistics: AnalysisStatistics;
}

/**
 * Analysis metadata information
 */
export interface AnalysisMetadata {
  /** Analysis timestamp */
  analyzedAt: Date;
  
  /** Analysis duration in milliseconds */
  duration: number;
  
  /** Analysis version/algorithm used */
  version: string;
  
  /** Processing engine information */
  engine: {
    name: string;
    version: string;
  };
  
  /** Input text characteristics */
  input: {
    length: number;
    lines: number;
    words: number;
    sentences: number;
    language?: string;
  };
}

/**
 * Content structure analysis
 */
export interface ContentStructure {
  /** Detected document sections */
  sections: DocumentSection[];
  
  /** Hierarchical structure */
  hierarchy: StructureNode[];
  
  /** List structures detected */
  lists: ListStructure[];
  
  /** Paragraph organization */
  paragraphs: ParagraphInfo[];
  
  /** Indentation patterns */
  indentation: IndentationPattern[];
}

/**
 * Document section definition
 */
export interface DocumentSection {
  /** Section identifier */
  id: string;
  
  /** Section type */
  type: SectionType;
  
  /** Section title/header */
  title?: string;
  
  /** Section content */
  content: string;
  
  /** Section position in document */
  position: {
    start: number;
    end: number;
    line: number;
  };
  
  /** Section confidence score */
  confidence: number;
}

/**
 * Document section types
 */
export type SectionType = 
  | 'header'
  | 'title'
  | 'subtitle'
  | 'content'
  | 'list'
  | 'quote'
  | 'code'
  | 'metadata'
  | 'footer'
  | 'appendix';

/**
 * Hierarchical structure node
 */
export interface StructureNode {
  /** Node level (1-6 for headings) */
  level: number;
  
  /** Node type */
  type: 'heading' | 'section' | 'item' | 'subitem';
  
  /** Node content */
  content: string;
  
  /** Child nodes */
  children: StructureNode[];
  
  /** Parent node reference */
  parent?: string;
  
  /** Node identifier */
  id: string;
}

/**
 * List structure information
 */
export interface ListStructure {
  /** List type */
  type: ListType;
  
  /** List items */
  items: ListItem[];
  
  /** List markers used */
  markers: string[];
  
  /** List nesting level */
  level: number;
  
  /** List consistency score */
  consistency: number;
}

/**
 * List types
 */
export type ListType = 
  | 'unordered'
  | 'ordered'
  | 'mixed'
  | 'checklist'
  | 'definition'
  | 'nested';

/**
 * Individual list item
 */
export interface ListItem {
  /** Item content */
  content: string;
  
  /** Item marker/bullet */
  marker: string;
  
  /** Item nesting level */
  level: number;
  
  /** Item type classification */
  type: ListItemType;
  
  /** Item metadata */
  metadata?: ListItemMetadata;
}

/**
 * List item types
 */
export type ListItemType = 
  | 'text'
  | 'task'
  | 'completed-task'
  | 'priority-item'
  | 'dated-item'
  | 'categorized-item';

/**
 * List item metadata
 */
export interface ListItemMetadata {
  /** Priority level */
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  /** Due date */
  dueDate?: Date;
  
  /** Category */
  category?: string;
  
  /** Completion status */
  completed?: boolean;
  
  /** Associated person */
  assignee?: string;
}

/**
 * Paragraph information
 */
export interface ParagraphInfo {
  /** Paragraph content */
  content: string;
  
  /** Paragraph length */
  length: number;
  
  /** Sentence count */
  sentences: number;
  
  /** Paragraph type */
  type: ParagraphType;
  
  /** Topic/theme */
  topic?: string;
  
  /** Sentiment score */
  sentiment?: number;
}

/**
 * Paragraph types
 */
export type ParagraphType = 
  | 'introduction'
  | 'body'
  | 'conclusion'
  | 'quote'
  | 'example'
  | 'summary'
  | 'transition';

/**
 * Indentation pattern analysis
 */
export interface IndentationPattern {
  /** Indentation type */
  type: 'spaces' | 'tabs' | 'mixed';
  
  /** Indentation size */
  size: number;
  
  /** Pattern consistency */
  consistency: number;
  
  /** Lines using this pattern */
  lines: number[];
}

// ============================================================================
// Pattern Recognition Types
// ============================================================================

/**
 * Pattern matching result
 */
export interface PatternMatch {
  /** Pattern identifier */
  patternId: string;
  
  /** Pattern name */
  name: string;
  
  /** Matched text */
  match: string;
  
  /** Match position */
  position: {
    start: number;
    end: number;
    line: number;
  };
  
  /** Pattern confidence */
  confidence: number;
  
  /** Extracted data */
  data?: PatternData;
  
  /** Pattern context */
  context?: string;
}

/**
 * Pattern data extraction
 */
export interface PatternData {
  /** Raw extracted values */
  raw: Record<string, string>;
  
  /** Parsed/normalized values */
  parsed: Record<string, unknown>;
  
  /** Data type information */
  types: Record<string, string>;
}

/**
 * Pattern definition for recognition
 */
export interface PatternDefinition {
  /** Pattern identifier */
  id: string;
  
  /** Pattern name */
  name: string;
  
  /** Pattern description */
  description: string;
  
  /** Regular expression pattern */
  regex: RegExp;
  
  /** Pattern weight for scoring */
  weight: number;
  
  /** Pattern category */
  category: PatternCategory;
  
  /** Format types this pattern applies to */
  formats: FormatType[];
  
  /** Data extraction configuration */
  extraction?: ExtractionConfig;
}

/**
 * Pattern categories
 */
export type PatternCategory = 
  | 'structure'
  | 'content'
  | 'format'
  | 'entity'
  | 'metadata'
  | 'syntax';

/**
 * Data extraction configuration
 */
export interface ExtractionConfig {
  /** Named capture groups */
  groups: Record<string, ExtractionGroup>;
  
  /** Post-processing functions */
  processors?: string[];
  
  /** Validation rules */
  validation?: ValidationRule[];
}

/**
 * Extraction group definition
 */
export interface ExtractionGroup {
  /** Group name */
  name: string;
  
  /** Data type */
  type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'url';
  
  /** Whether group is required */
  required: boolean;
  
  /** Default value if not matched */
  default?: unknown;
  
  /** Transformation function */
  transform?: string;
}

/**
 * Pattern validation rule
 */
export interface ValidationRule {
  /** Rule name */
  name: string;
  
  /** Validation function */
  validator: (value: unknown) => boolean;
  
  /** Error message */
  message: string;
}

// ============================================================================
// Entity Recognition Types
// ============================================================================

/**
 * Extracted entity information
 */
export interface ExtractedEntity {
  /** Entity type */
  type: EntityType;
  
  /** Entity value/text */
  value: string;
  
  /** Original text span */
  originalText: string;
  
  /** Entity position */
  position: {
    start: number;
    end: number;
    line: number;
  };
  
  /** Entity confidence */
  confidence: number;
  
  /** Entity metadata */
  metadata?: EntityMetadata;
}

/**
 * Entity types for recognition
 */
export type EntityType = 
  | 'person'
  | 'organization'
  | 'location'
  | 'date'
  | 'time'
  | 'datetime'
  | 'email'
  | 'url'
  | 'phone'
  | 'mention'
  | 'hashtag'
  | 'currency'
  | 'percentage'
  | 'number';

/**
 * Entity metadata
 */
export interface EntityMetadata {
  /** Normalized form */
  normalized?: string;
  
  /** Entity properties */
  properties?: Record<string, unknown>;
  
  /** Related entities */
  related?: string[];
  
  /** Entity source/context */
  source?: string;
}

/**
 * Named Entity Recognition (NER) configuration
 */
export interface NERConfig {
  /** Enabled entity types */
  enabledTypes: EntityType[];
  
  /** Minimum confidence threshold */
  minConfidence: number;
  
  /** Custom entity patterns */
  customPatterns?: CustomEntityPattern[];
  
  /** Entity resolution settings */
  resolution: EntityResolutionConfig;
}

/**
 * Custom entity pattern definition
 */
export interface CustomEntityPattern {
  /** Pattern name */
  name: string;
  
  /** Entity type */
  type: EntityType;
  
  /** Pattern regex */
  pattern: RegExp;
  
  /** Extraction function */
  extractor?: (match: RegExpMatchArray) => EntityMetadata;
}

/**
 * Entity resolution configuration
 */
export interface EntityResolutionConfig {
  /** Enable date parsing */
  parseDates: boolean;
  
  /** Enable URL normalization */
  normalizeUrls: boolean;
  
  /** Enable phone formatting */
  formatPhones: boolean;
  
  /** Timezone for date parsing */
  timezone?: string;
}

// ============================================================================
// Content Classification Types
// ============================================================================

/**
 * Content classification results
 */
export interface ContentClassification {
  /** Format predictions */
  formatPredictions: FormatPrediction[];
  
  /** Content categories */
  categories: ContentCategory[];
  
  /** Language detection */
  language?: LanguageDetection;
  
  /** Writing style analysis */
  style?: StyleAnalysis;
  
  /** Content quality metrics */
  quality?: QualityMetrics;
}

/**
 * Format prediction with confidence
 */
export interface FormatPrediction {
  /** Predicted format */
  format: FormatType;
  
  /** Prediction confidence (0-100) */
  confidence: number;
  
  /** Contributing factors */
  factors: PredictionFactor[];
  
  /** Format-specific scoring */
  scores: FormatScores;
}

/**
 * Prediction contributing factors
 */
export interface PredictionFactor {
  /** Factor name */
  name: string;
  
  /** Factor weight */
  weight: number;
  
  /** Factor score */
  score: number;
  
  /** Factor description */
  description: string;
}

/**
 * Format-specific scoring breakdown
 */
export interface FormatScores {
  /** Structure score */
  structure: number;
  
  /** Content score */
  content: number;
  
  /** Pattern score */
  patterns: number;
  
  /** Keyword score */
  keywords: number;
  
  /** Overall score */
  overall: number;
}

/**
 * Content category classification
 */
export interface ContentCategory {
  /** Category name */
  name: string;
  
  /** Category confidence */
  confidence: number;
  
  /** Category description */
  description: string;
  
  /** Related keywords */
  keywords: string[];
}

/**
 * Language detection results
 */
export interface LanguageDetection {
  /** Detected language code */
  language: string;
  
  /** Language name */
  name: string;
  
  /** Detection confidence */
  confidence: number;
  
  /** Alternative languages */
  alternatives?: Array<{
    language: string;
    confidence: number;
  }>;
}

/**
 * Writing style analysis
 */
export interface StyleAnalysis {
  /** Formality level */
  formality: 'formal' | 'informal' | 'neutral';
  
  /** Tone analysis */
  tone: 'positive' | 'negative' | 'neutral' | 'mixed';
  
  /** Complexity level */
  complexity: 'simple' | 'moderate' | 'complex';
  
  /** Writing perspective */
  perspective: 'first-person' | 'second-person' | 'third-person' | 'mixed';
  
  /** Readability score */
  readability?: ReadabilityScore;
}

/**
 * Readability score metrics
 */
export interface ReadabilityScore {
  /** Flesch reading ease */
  fleschReading: number;
  
  /** Grade level */
  gradeLevel: number;
  
  /** Average sentence length */
  avgSentenceLength: number;
  
  /** Average word length */
  avgWordLength: number;
}

/**
 * Content quality metrics
 */
export interface QualityMetrics {
  /** Grammar score */
  grammar: number;
  
  /** Spelling score */
  spelling: number;
  
  /** Structure score */
  structure: number;
  
  /** Clarity score */
  clarity: number;
  
  /** Overall quality */
  overall: number;
  
  /** Improvement suggestions */
  suggestions?: string[];
}

// ============================================================================
// Confidence and Scoring Types
// ============================================================================

/**
 * Comprehensive confidence scoring
 */
export interface ConfidenceScores {
  /** Overall analysis confidence */
  overall: number;
  
  /** Format detection confidence */
  formatDetection: number;
  
  /** Pattern recognition confidence */
  patternRecognition: number;
  
  /** Entity extraction confidence */
  entityExtraction: number;
  
  /** Structure analysis confidence */
  structureAnalysis: number;
  
  /** Content classification confidence */
  contentClassification: number;
}

/**
 * Detailed scoring breakdown
 */
export interface ScoringBreakdown {
  /** Individual component scores */
  components: ComponentScore[];
  
  /** Weighted final score */
  finalScore: number;
  
  /** Score distribution */
  distribution: ScoreDistribution;
  
  /** Scoring metadata */
  metadata: ScoringMetadata;
}

/**
 * Individual component score
 */
export interface ComponentScore {
  /** Component name */
  component: string;
  
  /** Raw score */
  raw: number;
  
  /** Weighted score */
  weighted: number;
  
  /** Component weight */
  weight: number;
  
  /** Score reliability */
  reliability: number;
}

/**
 * Score distribution information
 */
export interface ScoreDistribution {
  /** Minimum possible score */
  min: number;
  
  /** Maximum possible score */
  max: number;
  
  /** Mean score */
  mean: number;
  
  /** Standard deviation */
  stdDev: number;
  
  /** Score percentiles */
  percentiles: Record<number, number>;
}

/**
 * Scoring metadata
 */
export interface ScoringMetadata {
  /** Scoring algorithm version */
  algorithm: string;
  
  /** Model version */
  modelVersion: string;
  
  /** Calibration date */
  calibrationDate: Date;
  
  /** Training data size */
  trainingDataSize?: number;
}

// ============================================================================
// Analysis Statistics
// ============================================================================

/**
 * Comprehensive analysis statistics
 */
export interface AnalysisStatistics {
  /** Processing performance */
  performance: PerformanceStats;
  
  /** Content statistics */
  content: ContentStats;
  
  /** Pattern statistics */
  patterns: PatternStats;
  
  /** Entity statistics */
  entities: EntityStats;
}

/**
 * Processing performance statistics
 */
export interface PerformanceStats {
  /** Total processing time */
  totalTime: number;
  
  /** Individual stage timings */
  stageTimes: Record<string, number>;
  
  /** Memory usage */
  memoryUsage?: number;
  
  /** Cache hit rate */
  cacheHitRate?: number;
}

/**
 * Content statistics
 */
export interface ContentStats {
  /** Character count */
  characters: number;
  
  /** Word count */
  words: number;
  
  /** Sentence count */
  sentences: number;
  
  /** Paragraph count */
  paragraphs: number;
  
  /** Line count */
  lines: number;
  
  /** Unique words */
  uniqueWords: number;
  
  /** Average word length */
  avgWordLength: number;
  
  /** Average sentence length */
  avgSentenceLength: number;
}

/**
 * Pattern matching statistics
 */
export interface PatternStats {
  /** Total patterns tested */
  patternsTestd: number;
  
  /** Patterns matched */
  patternsMatched: number;
  
  /** Match success rate */
  successRate: number;
  
  /** Average confidence */
  avgConfidence: number;
  
  /** Patterns by category */
  byCategory: Record<string, number>;
}

/**
 * Entity extraction statistics
 */
export interface EntityStats {
  /** Total entities found */
  totalEntities: number;
  
  /** Entities by type */
  byType: Record<EntityType, number>;
  
  /** Average confidence */
  avgConfidence: number;
  
  /** Unique entities */
  uniqueEntities: number;
}
