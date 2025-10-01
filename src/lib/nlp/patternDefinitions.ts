/**
 * Pattern Definitions - Comprehensive pattern recognition rules
 * 
 * Defines all pattern recognition rules for the 6 formatting modes
 */

import type { FormatType } from '@/types/index';
import type { PatternDefinition, PatternCategory } from '@/types/nlp';

/**
 * Pattern library containing all recognition patterns
 */
export class PatternLibrary {
  private static patterns: Map<FormatType, PatternDefinition[]> = new Map();

  /**
   * Initialize pattern library with all format patterns
   */
  static initialize(): void {
    this.patterns.set('meeting-notes', this.getMeetingNotePatterns());
    this.patterns.set('task-lists', this.getTaskListPatterns());
    this.patterns.set('journal-notes', this.getJournalNotePatterns());
    this.patterns.set('shopping-lists', this.getShoppingListPatterns());
    this.patterns.set('research-notes', this.getResearchNotePatterns());
    this.patterns.set('study-notes', this.getStudyNotePatterns());
  }

  /**
   * Get patterns for a specific format type
   */
  static getPatterns(format: FormatType): PatternDefinition[] {
    if (this.patterns.size === 0) {
      this.initialize();
    }
    return this.patterns.get(format) || [];
  }

  /**
   * Get all patterns across all formats
   */
  static getAllPatterns(): PatternDefinition[] {
    if (this.patterns.size === 0) {
      this.initialize();
    }
    const allPatterns: PatternDefinition[] = [];
    this.patterns.forEach((patterns) => allPatterns.push(...patterns));
    return allPatterns;
  }

  /**
   * Meeting Notes pattern definitions
   */
  private static getMeetingNotePatterns(): PatternDefinition[] {
    return [
      {
        id: 'meeting-attendees',
        name: 'Attendees List',
        description: 'Identifies meeting attendees',
        regex: /(?:attendees?|participants?|present):\s*([^\n]+)/gi,
        weight: 0.25,
        category: 'metadata' as PatternCategory,
        formats: ['meeting-notes'],
        extraction: {
          groups: {
            attendees: {
              name: 'attendees',
              type: 'string',
              required: true,
            },
          },
        },
      },
      {
        id: 'meeting-date',
        name: 'Meeting Date',
        description: 'Identifies meeting date/time',
        regex: /(?:date|when|meeting on|scheduled for):\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+ \d{1,2},? \d{4})/gi,
        weight: 0.15,
        category: 'metadata' as PatternCategory,
        formats: ['meeting-notes'],
        extraction: {
          groups: {
            date: {
              name: 'date',
              type: 'date',
              required: false,
            },
          },
        },
      },
      {
        id: 'action-items',
        name: 'Action Items',
        description: 'Identifies action items and tasks',
        regex: /(?:action item|todo|task|follow[- ]?up|@\w+):\s*([^\n]+)/gi,
        weight: 0.3,
        category: 'content' as PatternCategory,
        formats: ['meeting-notes'],
        extraction: {
          groups: {
            action: {
              name: 'action',
              type: 'string',
              required: true,
            },
          },
        },
      },
      {
        id: 'agenda-items',
        name: 'Agenda Items',
        description: 'Identifies agenda or discussion topics',
        regex: /(?:agenda|topics?|discuss(?:ion|ed)?|covered):\s*([^\n]+)/gi,
        weight: 0.2,
        category: 'structure' as PatternCategory,
        formats: ['meeting-notes'],
        extraction: {
          groups: {
            topic: {
              name: 'topic',
              type: 'string',
              required: true,
            },
          },
        },
      },
      {
        id: 'decisions',
        name: 'Decisions Made',
        description: 'Identifies decisions or conclusions',
        regex: /(?:decision|agreed|concluded|resolved|determined):\s*([^\n]+)/gi,
        weight: 0.1,
        category: 'content' as PatternCategory,
        formats: ['meeting-notes'],
        extraction: {
          groups: {
            decision: {
              name: 'decision',
              type: 'string',
              required: true,
            },
          },
        },
      },
    ];
  }

  /**
   * Task Lists pattern definitions
   */
  private static getTaskListPatterns(): PatternDefinition[] {
    return [
      {
        id: 'task-checkbox',
        name: 'Checkbox Tasks',
        description: 'Identifies tasks with checkboxes',
        regex: /^\s*[-*]\s*\[[ xX]?\]\s*(.+)$/gm,
        weight: 0.35,
        category: 'structure' as PatternCategory,
        formats: ['task-lists'],
        extraction: {
          groups: {
            task: {
              name: 'task',
              type: 'string',
              required: true,
            },
          },
        },
      },
      {
        id: 'task-priority',
        name: 'Priority Indicators',
        description: 'Identifies task priority levels',
        regex: /(?:high|urgent|important|critical|priority|!!!|P[0-3])/gi,
        weight: 0.15,
        category: 'metadata' as PatternCategory,
        formats: ['task-lists'],
      },
      {
        id: 'task-due-date',
        name: 'Due Dates',
        description: 'Identifies task due dates',
        regex: /(?:due|deadline|by|before):\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+ \d{1,2})/gi,
        weight: 0.15,
        category: 'metadata' as PatternCategory,
        formats: ['task-lists'],
        extraction: {
          groups: {
            dueDate: {
              name: 'dueDate',
              type: 'date',
              required: false,
            },
          },
        },
      },
      {
        id: 'task-category',
        name: 'Task Categories',
        description: 'Identifies task categories or tags',
        regex: /(?:#\w+|@\w+|\[[\w\s]+\])/g,
        weight: 0.2,
        category: 'metadata' as PatternCategory,
        formats: ['task-lists'],
        extraction: {
          groups: {
            category: {
              name: 'category',
              type: 'string',
              required: false,
            },
          },
        },
      },
      {
        id: 'task-bullet',
        name: 'Bullet Point Tasks',
        description: 'Identifies tasks in bullet point format',
        regex: /^\s*[-*•]\s*(.+)$/gm,
        weight: 0.15,
        category: 'structure' as PatternCategory,
        formats: ['task-lists'],
        extraction: {
          groups: {
            task: {
              name: 'task',
              type: 'string',
              required: true,
            },
          },
        },
      },
    ];
  }

  /**
   * Journal Notes pattern definitions
   */
  private static getJournalNotePatterns(): PatternDefinition[] {
    return [
      {
        id: 'journal-date',
        name: 'Journal Entry Date',
        description: 'Identifies journal entry dates',
        regex: /(?:^|\n)(?:date|today|entry):?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+ \d{1,2},? \d{4})/gim,
        weight: 0.2,
        category: 'metadata' as PatternCategory,
        formats: ['journal-notes'],
        extraction: {
          groups: {
            date: {
              name: 'date',
              type: 'date',
              required: false,
            },
          },
        },
      },
      {
        id: 'journal-time',
        name: 'Timestamp',
        description: 'Identifies timestamps in journal entries',
        regex: /\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b/gi,
        weight: 0.1,
        category: 'metadata' as PatternCategory,
        formats: ['journal-notes'],
        extraction: {
          groups: {
            time: {
              name: 'time',
              type: 'string',
              required: false,
            },
          },
        },
      },
      {
        id: 'journal-feelings',
        name: 'Emotional Content',
        description: 'Identifies emotional or feeling words',
        regex: /\b(feel(?:ing)?|felt|emotion|happy|sad|angry|excited|worried|grateful|anxious)\b/gi,
        weight: 0.25,
        category: 'content' as PatternCategory,
        formats: ['journal-notes'],
      },
      {
        id: 'journal-reflection',
        name: 'Reflective Keywords',
        description: 'Identifies reflective thought patterns',
        regex: /\b(think(?:ing)?|thought|realize[d]?|understand|learn(?:ed)?|discover(?:ed)?|insight|wonder(?:ing)?)\b/gi,
        weight: 0.25,
        category: 'content' as PatternCategory,
        formats: ['journal-notes'],
      },
      {
        id: 'journal-narrative',
        name: 'Narrative Style',
        description: 'Identifies first-person narrative',
        regex: /\b(I|me|my|myself|we|us|our)\b/gi,
        weight: 0.2,
        category: 'content' as PatternCategory,
        formats: ['journal-notes'],
      },
    ];
  }

  /**
   * Shopping Lists pattern definitions
   */
  private static getShoppingListPatterns(): PatternDefinition[] {
    return [
      {
        id: 'shopping-item',
        name: 'Shopping Items',
        description: 'Identifies individual shopping items',
        regex: /^\s*[-*•]\s*(.+)$/gm,
        weight: 0.3,
        category: 'structure' as PatternCategory,
        formats: ['shopping-lists'],
        extraction: {
          groups: {
            item: {
              name: 'item',
              type: 'string',
              required: true,
            },
          },
        },
      },
      {
        id: 'shopping-quantity',
        name: 'Quantities',
        description: 'Identifies item quantities',
        regex: /(\d+(?:\.\d+)?)\s*(lbs?|kg|oz|g|mg|l|ml|pcs?|units?|dozen|pack|box)?/gi,
        weight: 0.15,
        category: 'metadata' as PatternCategory,
        formats: ['shopping-lists'],
        extraction: {
          groups: {
            quantity: {
              name: 'quantity',
              type: 'number',
              required: false,
            },
            unit: {
              name: 'unit',
              type: 'string',
              required: false,
            },
          },
        },
      },
      {
        id: 'shopping-category-produce',
        name: 'Produce Items',
        description: 'Identifies produce/fruits/vegetables',
        regex: /\b(apple|banana|orange|lettuce|tomato|carrot|onion|potato|fruit|vegetable|produce)\b/gi,
        weight: 0.25,
        category: 'content' as PatternCategory,
        formats: ['shopping-lists'],
      },
      {
        id: 'shopping-category-dairy',
        name: 'Dairy Items',
        description: 'Identifies dairy products',
        regex: /\b(milk|cheese|yogurt|butter|cream|eggs?|dairy)\b/gi,
        weight: 0.15,
        category: 'content' as PatternCategory,
        formats: ['shopping-lists'],
      },
      {
        id: 'shopping-category-meat',
        name: 'Meat/Protein Items',
        description: 'Identifies meat and protein products',
        regex: /\b(chicken|beef|pork|fish|meat|turkey|bacon|sausage|protein)\b/gi,
        weight: 0.15,
        category: 'content' as PatternCategory,
        formats: ['shopping-lists'],
      },
    ];
  }

  /**
   * Research Notes pattern definitions
   */
  private static getResearchNotePatterns(): PatternDefinition[] {
    return [
      {
        id: 'research-citation',
        name: 'Citations',
        description: 'Identifies academic citations',
        regex: /(?:\(\w+(?:,?\s+\d{4})\)|\[\d+\]|(?:et al\.|& \w+))/g,
        weight: 0.3,
        category: 'metadata' as PatternCategory,
        formats: ['research-notes'],
      },
      {
        id: 'research-quote',
        name: 'Quotes',
        description: 'Identifies quoted text',
        regex: /"([^"]+)"|'([^']+)'|(?:^|\n)>\s*(.+)/gm,
        weight: 0.25,
        category: 'content' as PatternCategory,
        formats: ['research-notes'],
        extraction: {
          groups: {
            quote: {
              name: 'quote',
              type: 'string',
              required: true,
            },
          },
        },
      },
      {
        id: 'research-source',
        name: 'Source References',
        description: 'Identifies source references',
        regex: /(?:source|from|according to|as stated in):\s*([^\n]+)/gi,
        weight: 0.2,
        category: 'metadata' as PatternCategory,
        formats: ['research-notes'],
        extraction: {
          groups: {
            source: {
              name: 'source',
              type: 'string',
              required: true,
            },
          },
        },
      },
      {
        id: 'research-topic',
        name: 'Topic Headers',
        description: 'Identifies research topics and sections',
        regex: /(?:^|\n)(#{1,6}\s*.+|[A-Z][A-Z\s]{2,}:?$)/gm,
        weight: 0.15,
        category: 'structure' as PatternCategory,
        formats: ['research-notes'],
      },
      {
        id: 'research-url',
        name: 'URLs and Links',
        description: 'Identifies URLs and web references',
        regex: /https?:\/\/[^\s]+|www\.[^\s]+/gi,
        weight: 0.1,
        category: 'metadata' as PatternCategory,
        formats: ['research-notes'],
        extraction: {
          groups: {
            url: {
              name: 'url',
              type: 'url',
              required: false,
            },
          },
        },
      },
    ];
  }

  /**
   * Study Notes pattern definitions
   */
  private static getStudyNotePatterns(): PatternDefinition[] {
    return [
      {
        id: 'study-definition',
        name: 'Definitions',
        description: 'Identifies definitions and terms',
        regex: /(?:^|\n)(.+?):\s*(.+?)(?=\n|$)/gm,
        weight: 0.25,
        category: 'content' as PatternCategory,
        formats: ['study-notes'],
        extraction: {
          groups: {
            term: {
              name: 'term',
              type: 'string',
              required: true,
            },
            definition: {
              name: 'definition',
              type: 'string',
              required: true,
            },
          },
        },
      },
      {
        id: 'study-outline',
        name: 'Outline Structure',
        description: 'Identifies outline numbering',
        regex: /^\s*(?:\d+\.|\w\)|[ivxIVX]+\.)\s*(.+)$/gm,
        weight: 0.3,
        category: 'structure' as PatternCategory,
        formats: ['study-notes'],
        extraction: {
          groups: {
            item: {
              name: 'item',
              type: 'string',
              required: true,
            },
          },
        },
      },
      {
        id: 'study-heading',
        name: 'Topic Headings',
        description: 'Identifies topic headings and sections',
        regex: /(?:^|\n)(#{1,6}\s*.+|[A-Z][A-Z\s]{3,}:?$|\*\*.+?\*\*)/gm,
        weight: 0.2,
        category: 'structure' as PatternCategory,
        formats: ['study-notes'],
      },
      {
        id: 'study-question',
        name: 'Study Questions',
        description: 'Identifies questions for review',
        regex: /(?:^|\n)(?:Q:|Question:|\?)\s*(.+?)(?=\n|$)/gim,
        weight: 0.15,
        category: 'content' as PatternCategory,
        formats: ['study-notes'],
        extraction: {
          groups: {
            question: {
              name: 'question',
              type: 'string',
              required: true,
            },
          },
        },
      },
      {
        id: 'study-key-terms',
        name: 'Key Terms',
        description: 'Identifies emphasized or key terms',
        regex: /\*\*(.+?)\*\*|__(.+?)__|IMPORTANT:\s*(.+)/gi,
        weight: 0.1,
        category: 'content' as PatternCategory,
        formats: ['study-notes'],
        extraction: {
          groups: {
            term: {
              name: 'term',
              type: 'string',
              required: true,
            },
          },
        },
      },
    ];
  }
}

// Initialize pattern library on module load
PatternLibrary.initialize();
