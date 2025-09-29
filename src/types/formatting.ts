/**
 * Formatting Types - Text Processing and Format Definitions
 * 
 * Types for the 6 core formatting modes and text processing pipeline
 */

// ============================================================================
// Core Formatting Types
// ============================================================================

import type { FormatType } from './index';

// FormatType is imported from index.ts to avoid circular dependencies

/**
 * Format metadata and configuration
 */
export interface FormatDefinition {
  /** Format identifier */
  type: FormatType;
  
  /** Human-readable name */
  name: string;
  
  /** Format description */
  description: string;
  
  /** Format icon or emoji */
  icon: string;
  
  /** Format-specific settings */
  settings: FormatSettings;
  
  /** Pattern recognition rules */
  patterns: FormatPattern[];
  
  /** Output template configuration */
  template: OutputTemplate;
}

/**
 * Format-specific configuration settings
 */
export interface FormatSettings {
  /** Whether this format supports auto-detection */
  autoDetectable: boolean;
  
  /** Minimum confidence score for auto-detection */
  minConfidence: number;
  
  /** Processing options */
  options: {
    preserveLineBreaks: boolean;
    groupSimilarItems: boolean;
    sortItems: boolean;
    removeDuplicates: boolean;
    extractDates: boolean;
    extractUrls: boolean;
    extractEmails: boolean;
  };
  
  /** Format-specific customizations */
  customizations: Record<string, unknown>;
}

/**
 * Pattern recognition rules for format detection
 */
export interface FormatPattern {
  /** Pattern name/identifier */
  name: string;
  
  /** Regular expression pattern */
  regex: RegExp;
  
  /** Pattern weight for scoring */
  weight: number;
  
  /** Pattern description */
  description: string;
  
  /** Whether pattern is required for format detection */
  required: boolean;
}

/**
 * Output template configuration
 */
export interface OutputTemplate {
  /** Template structure */
  structure: TemplateSection[];
  
  /** CSS classes for styling */
  styles: Record<string, string>;
  
  /** Custom rendering options */
  rendering: {
    showHeaders: boolean;
    showMetadata: boolean;
    showTimestamps: boolean;
    groupByCategory: boolean;
  };
}

/**
 * Template section definition
 */
export interface TemplateSection {
  /** Section identifier */
  id: string;
  
  /** Section type */
  type: 'header' | 'content' | 'list' | 'metadata' | 'footer';
  
  /** Section title */
  title?: string;
  
  /** Section content template */
  template: string;
  
  /** Whether section is conditional */
  conditional?: boolean;
  
  /** Condition for showing section */
  condition?: string;
}

// ============================================================================
// Input and Output Types
// ============================================================================

/**
 * Raw text input for processing
 */
export interface TextInput {
  /** Input text content */
  content: string;
  
  /** Input metadata */
  metadata: {
    /** Input source/origin */
    source: 'paste' | 'type' | 'upload' | 'import';
    
    /** Input timestamp */
    timestamp: Date;
    
    /** Original file name (if uploaded) */
    fileName?: string;
    
    /** Original file type */
    fileType?: string;
    
    /** Input size in characters */
    size: number;
  };
  
  /** User preferences for processing */
  preferences?: {
    /** Preferred format type (manual selection) */
    preferredFormat?: FormatType;
    
    /** Processing options override */
    options?: Partial<FormatSettings['options']>;
  };
}

/**
 * Processed and formatted output
 */
export interface FormattedOutput {
  /** Formatted content */
  content: string;
  
  /** Format type used */
  format: FormatType;
  
  /** Processing metadata */
  metadata: {
    /** Processing timestamp */
    processedAt: Date;
    
    /** Processing duration in milliseconds */
    duration: number;
    
    /** Confidence score (0-100) */
    confidence: number;
    
    /** Number of items/sections processed */
    itemCount: number;
    
    /** Processing statistics */
    stats: ProcessingStats;
  };
  
  /** Extracted structured data */
  data: ExtractedData;
  
  /** Processing warnings or notes */
  warnings?: string[];
}

/**
 * Processing performance statistics
 */
export interface ProcessingStats {
  /** Lines processed */
  linesProcessed: number;
  
  /** Patterns matched */
  patternsMatched: number;
  
  /** Items extracted */
  itemsExtracted: number;
  
  /** Duplicates removed */
  duplicatesRemoved: number;
  
  /** Formatting changes applied */
  changesApplied: number;
}

/**
 * Extracted structured data from text processing
 */
export interface ExtractedData {
  /** Common extracted elements */
  common: {
    dates: ExtractedDate[];
    urls: ExtractedUrl[];
    emails: string[];
    phoneNumbers: string[];
    mentions: string[];
    hashtags: string[];
  };
  
  /** Format-specific extracted data */
  formatSpecific: MeetingNotesData | TaskListsData | JournalNotesData | 
                   ShoppingListsData | ResearchNotesData | StudyNotesData;
}

// ============================================================================
// Format-Specific Data Types
// ============================================================================

/**
 * Meeting Notes specific data
 */
export interface MeetingNotesData {
  /** Meeting attendees */
  attendees: string[];
  
  /** Agenda items */
  agendaItems: AgendaItem[];
  
  /** Action items */
  actionItems: ActionItem[];
  
  /** Decisions made */
  decisions: Decision[];
  
  /** Meeting metadata */
  meeting: {
    title?: string;
    date?: Date;
    duration?: string;
    location?: string;
    organizer?: string;
  };
}

export interface AgendaItem {
  /** Item title/topic */
  title: string;
  
  /** Item description */
  description?: string;
  
  /** Time allocation */
  timeAllocation?: string;
  
  /** Presenter/owner */
  presenter?: string;
}

export interface ActionItem {
  /** Task description */
  task: string;
  
  /** Assigned person */
  assignee?: string;
  
  /** Due date */
  dueDate?: Date;
  
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  /** Current status */
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Decision {
  /** Decision description */
  description: string;
  
  /** Decision maker */
  decisionMaker?: string;
  
  /** Decision rationale */
  rationale?: string;
  
  /** Implementation timeline */
  timeline?: string;
}

/**
 * Task Lists specific data
 */
export interface TaskListsData {
  /** Organized tasks by category */
  categories: TaskCategory[];
  
  /** Individual tasks */
  tasks: Task[];
  
  /** Task statistics */
  stats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
}

export interface TaskCategory {
  /** Category name */
  name: string;
  
  /** Category color/theme */
  color?: string;
  
  /** Tasks in this category */
  taskIds: string[];
  
  /** Category priority */
  priority?: number;
}

export interface Task {
  /** Unique task identifier */
  id: string;
  
  /** Task description */
  description: string;
  
  /** Task priority */
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  /** Due date */
  dueDate?: Date;
  
  /** Task category */
  category?: string;
  
  /** Task status */
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  
  /** Task notes */
  notes?: string;
  
  /** Estimated time */
  estimatedTime?: string;
}

/**
 * Journal Notes specific data
 */
export interface JournalNotesData {
  /** Journal entries */
  entries: JournalEntry[];
  
  /** Extracted insights */
  insights: string[];
  
  /** Mood indicators */
  mood?: 'positive' | 'neutral' | 'negative' | 'mixed';
  
  /** Topics discussed */
  topics: string[];
}

export interface JournalEntry {
  /** Entry timestamp */
  timestamp: Date;
  
  /** Entry content */
  content: string;
  
  /** Entry title/subject */
  title?: string;
  
  /** Entry mood/sentiment */
  mood?: string;
  
  /** Entry tags */
  tags: string[];
}

/**
 * Shopping Lists specific data
 */
export interface ShoppingListsData {
  /** Items organized by category */
  categories: ShoppingCategory[];
  
  /** Individual items */
  items: ShoppingItem[];
  
  /** Shopping statistics */
  stats: {
    totalItems: number;
    totalCategories: number;
    estimatedCost?: number;
  };
}

export interface ShoppingCategory {
  /** Category name (e.g., "Produce", "Dairy") */
  name: string;
  
  /** Store section/aisle */
  section?: string;
  
  /** Items in this category */
  itemIds: string[];
  
  /** Category ordering priority */
  order?: number;
}

export interface ShoppingItem {
  /** Unique item identifier */
  id: string;
  
  /** Item name */
  name: string;
  
  /** Item quantity */
  quantity?: string;
  
  /** Item unit (e.g., "lbs", "pieces") */
  unit?: string;
  
  /** Item category */
  category: string;
  
  /** Item notes */
  notes?: string;
  
  /** Whether item is checked/completed */
  checked: boolean;
  
  /** Estimated price */
  estimatedPrice?: number;
}

/**
 * Research Notes specific data
 */
export interface ResearchNotesData {
  /** Citations and references */
  citations: Citation[];
  
  /** Quotes and excerpts */
  quotes: Quote[];
  
  /** Research topics */
  topics: ResearchTopic[];
  
  /** Sources */
  sources: Source[];
}

export interface Citation {
  /** Citation identifier */
  id: string;
  
  /** Citation text */
  text: string;
  
  /** Citation format (APA, MLA, etc.) */
  format: 'apa' | 'mla' | 'chicago' | 'harvard' | 'custom';
  
  /** Source information */
  source: {
    title: string;
    author?: string;
    year?: number;
    publication?: string;
    url?: string;
  };
}

export interface Quote {
  /** Quote text */
  text: string;
  
  /** Quote author */
  author?: string;
  
  /** Quote source */
  source?: string;
  
  /** Page number or location */
  location?: string;
  
  /** Quote context/notes */
  notes?: string;
}

export interface ResearchTopic {
  /** Topic name */
  name: string;
  
  /** Topic description */
  description?: string;
  
  /** Related citations */
  citationIds: string[];
  
  /** Related quotes */
  quoteIds: string[];
}

export interface Source {
  /** Source identifier */
  id: string;
  
  /** Source title */
  title: string;
  
  /** Source type */
  type: 'book' | 'article' | 'website' | 'journal' | 'report' | 'other';
  
  /** Source metadata */
  metadata: Record<string, string>;
}

/**
 * Study Notes specific data
 */
export interface StudyNotesData {
  /** Study outline */
  outline: OutlineSection[];
  
  /** Q&A pairs */
  qaPairs: QAPair[];
  
  /** Key definitions */
  definitions: Definition[];
  
  /** Study topics */
  topics: StudyTopic[];
}

export interface OutlineSection {
  /** Section level (1, 2, 3, etc.) */
  level: number;
  
  /** Section title */
  title: string;
  
  /** Section content */
  content?: string;
  
  /** Subsections */
  subsections: OutlineSection[];
  
  /** Section identifier */
  id: string;
}

export interface QAPair {
  /** Question text */
  question: string;
  
  /** Answer text */
  answer: string;
  
  /** Question type */
  type: 'definition' | 'explanation' | 'example' | 'analysis' | 'comparison';
  
  /** Difficulty level */
  difficulty?: 'easy' | 'medium' | 'hard';
  
  /** Related topics */
  topics: string[];
}

export interface Definition {
  /** Term being defined */
  term: string;
  
  /** Definition text */
  definition: string;
  
  /** Definition context */
  context?: string;
  
  /** Example usage */
  example?: string;
  
  /** Related terms */
  relatedTerms: string[];
}

export interface StudyTopic {
  /** Topic name */
  name: string;
  
  /** Topic importance */
  importance: 'low' | 'medium' | 'high';
  
  /** Related sections */
  sectionIds: string[];
  
  /** Related definitions */
  definitionIds: string[];
}

// ============================================================================
// Utility Types for Formatting
// ============================================================================

/**
 * Extracted date information
 */
export interface ExtractedDate {
  /** Original text */
  originalText: string;
  
  /** Parsed date object */
  date: Date;
  
  /** Date format detected */
  format: string;
  
  /** Confidence score */
  confidence: number;
}

/**
 * Extracted URL information
 */
export interface ExtractedUrl {
  /** Original URL text */
  originalText: string;
  
  /** Cleaned URL */
  url: string;
  
  /** URL title (if available) */
  title?: string;
  
  /** URL domain */
  domain: string;
}

/**
 * Format comparison and validation
 */
export interface FormatComparison {
  /** Original input */
  original: TextInput;
  
  /** Formatted output */
  formatted: FormattedOutput;
  
  /** Comparison metrics */
  metrics: {
    characterChange: number;
    lineChange: number;
    structureImprovement: number;
    readabilityScore: number;
  };
}
