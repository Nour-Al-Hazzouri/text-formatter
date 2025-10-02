/**
 * Task Lists Formatter - Transforms unstructured text into organized todo lists
 * 
 * Features:
 * - Priority level assignment based on keywords (urgent, important, high, low)
 * - Due date detection and formatting
 * - Category grouping and organization
 * - Checkbox generation for interactive lists
 * - Todo item extraction from various formats
 * - Preserves all original content while adding structure
 */

import type { TextInput, FormattedOutput, ExtractedData, ProcessingStats } from '@/types/formatting';

/**
 * Priority levels for tasks
 */
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

/**
 * Task item structure
 */
interface TaskItem {
  text: string;
  priority: TaskPriority;
  dueDate?: Date;
  category?: string;
  completed: boolean;
  originalLine: string;
}

/**
 * Organized tasks by category
 */
interface OrganizedTasks {
  categories: Map<string, TaskItem[]>;
  uncategorized: TaskItem[];
  totalTasks: number;
  confidence: number;
}

export class TaskListsFormatter {
  // Priority keywords for detection
  private static readonly PRIORITY_KEYWORDS = {
    urgent: ['urgent', 'asap', 'critical', 'emergency', '!!!', 'immediately'],
    high: ['important', 'high priority', '!!', 'must', 'priority'],
    low: ['low priority', 'maybe', 'optional', 'when possible', 'someday'],
  };

  // Date patterns for extraction
  private static readonly DATE_PATTERNS = [
    // ISO dates: 2024-10-02
    /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/,
    // US dates: 10/02/2024, 10-02-2024
    /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/,
    // Written dates: Oct 2, October 2nd, Oct 2nd 2024
    /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)\b/i,
    // Relative: today, tomorrow, this week, next week
    /\b(today|tomorrow|this week|next week|this month|next month)\b/i,
    // Due: due 10/2, by friday, before monday
    /\b(?:due|by|before|until)\s+([a-z]+day|[a-z]+ \d{1,2}(?:st|nd|rd|th)?)\b/i,
  ];

  // Category indicators
  private static readonly CATEGORY_KEYWORDS = [
    'work', 'personal', 'home', 'errands', 'shopping', 'health',
    'finance', 'family', 'projects', 'calls', 'emails', 'meetings'
  ];

  /**
   * Format task lists from unstructured text
   */
  static async format(input: TextInput): Promise<FormattedOutput> {
    const startTime = performance.now();
    const lines = input.content.split('\n');
    
    // Extract and organize tasks
    const organized = this.organizeTasks(lines);
    
    // Build formatted output
    const formattedText = this.buildFormattedOutput(organized);
    
    // Calculate statistics
    const stats = this.calculateStats(input.content, organized);
    const duration = performance.now() - startTime;

    // Extract task-specific data
    const extractedData = this.extractTaskData(organized);

    return {
      format: 'task-lists',
      content: formattedText,
      metadata: {
        processedAt: new Date(),
        duration,
        confidence: organized.confidence,
        itemCount: organized.totalTasks,
        stats,
      },
      data: extractedData,
    };
  }

  /**
   * Organize tasks from raw lines
   */
  private static organizeTasks(lines: string[]): OrganizedTasks {
    const tasks: TaskItem[] = [];
    let currentCategory: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        currentCategory = undefined;
        continue;
      }

      // Check if line is a category header
      const detectedCategory = this.detectCategory(trimmed);
      if (detectedCategory && this.isCategoryHeader(trimmed, lines[i + 1])) {
        currentCategory = detectedCategory;
        continue;
      }

      // Check if line is a task item
      if (this.isTaskItem(trimmed)) {
        const task = this.parseTaskItem(trimmed, currentCategory);
        tasks.push(task);
      } else if (trimmed.length > 3) {
        // Treat non-empty lines as potential tasks if they don't look like headers
        if (!this.isHeader(trimmed)) {
          const task = this.parseTaskItem(trimmed, currentCategory);
          tasks.push(task);
        }
      }
    }

    // Group tasks by category
    const categories = new Map<string, TaskItem[]>();
    const uncategorized: TaskItem[] = [];

    for (const task of tasks) {
      if (task.category) {
        if (!categories.has(task.category)) {
          categories.set(task.category, []);
        }
        categories.get(task.category)!.push(task);
      } else {
        uncategorized.push(task);
      }
    }

    // Sort tasks within each category by priority
    for (const [, categoryTasks] of categories) {
      this.sortTasksByPriority(categoryTasks);
    }
    this.sortTasksByPriority(uncategorized);

    const confidence = this.calculateConfidence(tasks, categories);

    return {
      categories,
      uncategorized,
      totalTasks: tasks.length,
      confidence,
    };
  }

  /**
   * Parse a single task item
   */
  private static parseTaskItem(line: string, category?: string): TaskItem {
    // Check if already completed (contains [x] or ✓)
    const completed = /\[x\]|✓|✔|☑/i.test(line);

    // Clean the line
    let cleanedText = this.cleanTaskText(line);

    // Extract due date
    const dueDate = this.extractDueDate(cleanedText);
    if (dueDate) {
      // Remove date text from task
      cleanedText = this.removeDateFromText(cleanedText);
    }

    // Detect priority
    const priority = this.detectPriority(cleanedText);

    // Remove priority markers from text
    cleanedText = this.removePriorityMarkers(cleanedText);

    return {
      text: cleanedText.trim(),
      priority,
      dueDate,
      category,
      completed,
      originalLine: line,
    };
  }

  /**
   * Check if line is a task item
   */
  private static isTaskItem(line: string): boolean {
    const taskPatterns = [
      /^[-*•]\s+/,                    // Bullet points
      /^\d+[.)]\s+/,                   // Numbered
      /^\[[ x]\]\s+/i,                 // Checkbox
      /^(?:todo|task|do):\s+/i,       // Todo prefix
      /^→\s+/,                         // Arrow
    ];

    return taskPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Clean task text by removing markers
   */
  private static cleanTaskText(line: string): string {
    return line
      .replace(/^[-*•]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .replace(/^\[[ x]\]\s+/i, '')
      .replace(/^(?:todo|task|do):\s+/i, '')
      .replace(/^→\s+/, '')
      .replace(/^>\s+/, '')
      .trim();
  }

  /**
   * Detect priority from text
   */
  private static detectPriority(text: string): TaskPriority {
    const lowerText = text.toLowerCase();

    // Check urgent keywords
    if (this.PRIORITY_KEYWORDS.urgent.some(kw => lowerText.includes(kw))) {
      return 'urgent';
    }

    // Check high priority keywords
    if (this.PRIORITY_KEYWORDS.high.some(kw => lowerText.includes(kw))) {
      return 'high';
    }

    // Check low priority keywords
    if (this.PRIORITY_KEYWORDS.low.some(kw => lowerText.includes(kw))) {
      return 'low';
    }

    // Default to medium
    return 'medium';
  }

  /**
   * Extract due date from text
   */
  private static extractDueDate(text: string): Date | undefined {
    for (const pattern of this.DATE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return this.parseDateString(match[1]);
      }
    }
    return undefined;
  }

  /**
   * Parse date string to Date object
   */
  private static parseDateString(dateStr: string): Date | undefined {
    const lowerDate = dateStr.toLowerCase();

    // Handle relative dates
    const now = new Date();
    if (lowerDate === 'today') {
      return now;
    }
    if (lowerDate === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    if (lowerDate === 'this week') {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      return endOfWeek;
    }
    if (lowerDate === 'next week') {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
    }

    // Try to parse as standard date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return undefined;
  }

  /**
   * Remove date text from task text
   */
  private static removeDateFromText(text: string): string {
    let result = text;
    for (const pattern of this.DATE_PATTERNS) {
      result = result.replace(pattern, '');
    }
    // Clean up extra spaces and punctuation
    return result
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+[,;]\s*/g, ' ')
      .replace(/\(\s*\)/g, '')
      .replace(/\[\s*\]/g, '')
      .trim();
  }

  /**
   * Remove priority markers from text
   */
  private static removePriorityMarkers(text: string): string {
    let result = text;
    
    // Remove all priority keywords
    const allKeywords = [
      ...this.PRIORITY_KEYWORDS.urgent,
      ...this.PRIORITY_KEYWORDS.high,
      ...this.PRIORITY_KEYWORDS.low,
    ];

    for (const keyword of allKeywords) {
      const pattern = new RegExp(`\\b${keyword}\\b`, 'gi');
      result = result.replace(pattern, '');
    }

    // Clean up
    return result
      .replace(/\s{2,}/g, ' ')
      .replace(/^[:\-,]\s*/, '')
      .replace(/\s+[:\-,]\s*$/, '')
      .trim();
  }

  /**
   * Detect category from line
   */
  private static detectCategory(line: string): string | undefined {
    const lowerLine = line.toLowerCase();
    
    for (const category of this.CATEGORY_KEYWORDS) {
      if (lowerLine.includes(category)) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }

    return undefined;
  }

  /**
   * Check if line is a category header
   */
  private static isCategoryHeader(line: string, nextLine?: string): boolean {
    const trimmed = line.trim();
    
    // Short line ending with colon
    if (trimmed.length < 30 && trimmed.endsWith(':')) {
      return true;
    }

    // All caps short line
    if (trimmed.length < 30 && trimmed === trimmed.toUpperCase()) {
      return true;
    }

    // Followed by list items
    if (nextLine && this.isTaskItem(nextLine.trim())) {
      return true;
    }

    return false;
  }

  /**
   * Check if line is a generic header
   */
  private static isHeader(line: string): boolean {
    if (line.length < 50) {
      if (line === line.toUpperCase() || line.endsWith(':')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Sort tasks by priority
   */
  private static sortTasksByPriority(tasks: TaskItem[]): void {
    const priorityOrder: Record<TaskPriority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
      none: 4,
    };

    tasks.sort((a, b) => {
      // Completed tasks go to bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Sort by due date if both have dates
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }

      // Tasks with due dates come first
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return 0;
    });
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(tasks: TaskItem[], categories: Map<string, TaskItem[]>): number {
    let score = 0.5; // Base score

    // Has multiple tasks
    if (tasks.length >= 3) {
      score += 0.2;
    }

    // Has priorities detected
    const hasPriorities = tasks.some(t => t.priority !== 'medium');
    if (hasPriorities) {
      score += 0.15;
    }

    // Has due dates
    const hasDueDates = tasks.some(t => t.dueDate);
    if (hasDueDates) {
      score += 0.1;
    }

    // Has categories
    if (categories.size > 0) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Build formatted output
   */
  private static buildFormattedOutput(organized: OrganizedTasks): string {
    const output: string[] = [];

    // Add categorized tasks
    if (organized.categories.size > 0) {
      for (const [category, tasks] of organized.categories) {
        output.push(`# ${category}`);
        output.push('');
        
        for (const task of tasks) {
          output.push(this.formatTask(task));
        }
        
        output.push('');
      }
    }

    // Add uncategorized tasks
    if (organized.uncategorized.length > 0) {
      if (organized.categories.size > 0) {
        output.push('# Other Tasks');
        output.push('');
      }

      for (const task of organized.uncategorized) {
        output.push(this.formatTask(task));
      }
    }

    return output.join('\n').trim();
  }

  /**
   * Format a single task
   */
  private static formatTask(task: TaskItem): string {
    const checkbox = task.completed ? '[x]' : '[ ]';
    let line = `- ${checkbox} ${task.text}`;

    // Add priority indicator
    if (task.priority === 'urgent') {
      line += ' 🔴';
    } else if (task.priority === 'high') {
      line += ' 🟠';
    } else if (task.priority === 'low') {
      line += ' 🔵';
    }

    // Add due date
    if (task.dueDate) {
      const dateStr = this.formatDate(task.dueDate);
      line += ` (Due: ${dateStr})`;
    }

    return line;
  }

  /**
   * Format date for display
   */
  private static formatDate(date: Date): string {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if today
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }

    // Check if tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    // Format as date
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    };
    
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Extract task-specific data
   */
  private static extractTaskData(organized: OrganizedTasks): ExtractedData {
    const allTasks = [
      ...organized.uncategorized,
      ...Array.from(organized.categories.values()).flat(),
    ];

    const urgentTasks = allTasks.filter(t => t.priority === 'urgent');
    const dueTasks = allTasks.filter(t => t.dueDate);
    const completedTasks = allTasks.filter(t => t.completed);

    // Create proper ExtractedDate objects
    const extractedDates = dueTasks
      .filter(t => t.dueDate)
      .map(t => ({
        originalText: this.formatDate(t.dueDate!),
        date: t.dueDate!,
        format: 'auto-detected',
        confidence: 0.8,
      }));

    // Create task categories (not shopping categories)
    const taskCategories = Array.from(organized.categories.entries()).map(([name, tasks]) => ({
      name,
      taskIds: tasks.map((_, idx) => `task-${idx}`),
      priority: 1,
    }));

    // Create individual task objects
    const tasks = allTasks.map((task, idx) => ({
      id: `task-${idx}`,
      description: task.text,
      priority: task.priority === 'none' ? ('medium' as const) : task.priority,
      dueDate: task.dueDate,
      category: task.category,
      status: (task.completed ? 'completed' : 'pending') as 'completed' | 'pending' | 'in-progress' | 'cancelled',
    }));

    return {
      common: {
        dates: extractedDates,
        urls: [],
        emails: [],
        phoneNumbers: [],
        mentions: [],
        hashtags: [],
      },
      formatSpecific: {
        categories: taskCategories,
        tasks,
        stats: {
          total: allTasks.length,
          completed: completedTasks.length,
          pending: allTasks.length - completedTasks.length,
          overdue: 0, // TODO: Calculate overdue tasks
        },
      },
    };
  }

  /**
   * Calculate processing statistics
   */
  private static calculateStats(originalText: string, organized: OrganizedTasks): ProcessingStats {
    const lines = originalText.split('\n').filter(l => l.trim());
    const allTasks = [
      ...organized.uncategorized,
      ...Array.from(organized.categories.values()).flat(),
    ];
    
    return {
      linesProcessed: lines.length,
      patternsMatched: organized.totalTasks,
      itemsExtracted: organized.totalTasks,
      duplicatesRemoved: 0,
      changesApplied: organized.totalTasks + organized.categories.size,
    };
  }

  /**
   * Validate task list output
   */
  static validate(output: FormattedOutput): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!output.content || output.content.length === 0) {
      issues.push('Formatted text is empty');
    }

    if (output.metadata.confidence < 0.3) {
      issues.push('Low confidence score - text may not be suitable for task list format');
    }

    if (output.metadata.itemCount === 0) {
      issues.push('No tasks detected in the input');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
