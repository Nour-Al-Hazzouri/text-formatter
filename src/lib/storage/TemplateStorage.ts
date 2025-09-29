/**
 * TemplateStorage - Custom formatting template persistence layer
 * 
 * Manages user-defined formatting templates with validation, sharing,
 * and integration with the formatting system
 */

import { storage, StorageError } from './LocalStorageWrapper';
import type { 
  FormatType, 
  Result 
} from '@/types/index';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface FormattingTemplate {
  /** Unique identifier for the template */
  id: string;
  
  /** User-defined name for the template */
  name: string;
  
  /** Optional description */
  description?: string;
  
  /** Base format type this template extends */
  baseFormat: FormatType;
  
  /** Template configuration */
  config: {
    /** Custom formatting rules */
    rules: FormattingRule[];
    
    /** Pattern matching configuration */
    patterns: PatternConfig[];
    
    /** Output formatting options */
    output: OutputConfig;
    
    /** Processing options */
    processing: ProcessingConfig;
  };
  
  /** Template metadata */
  metadata: {
    /** Creation timestamp */
    createdAt: Date;
    
    /** Last modified timestamp */
    modifiedAt: Date;
    
    /** Version number for updates */
    version: number;
    
    /** Usage statistics */
    usage: {
      timesUsed: number;
      lastUsed?: Date;
      averageProcessingTime: number;
    };
    
    /** Template tags for categorization */
    tags: string[];
    
    /** Whether template is public/shareable */
    public: boolean;
    
    /** Creator information (for shared templates) */
    creator?: {
      name: string;
      id: string;
    };
  };
  
  /** Example inputs/outputs for testing */
  examples?: {
    input: string;
    expectedOutput: string;
    description?: string;
  }[];
}

export interface FormattingRule {
  /** Rule identifier */
  id: string;
  
  /** Rule name */
  name: string;
  
  /** Rule type */
  type: 'pattern-replace' | 'structure' | 'formatting' | 'validation';
  
  /** Rule configuration */
  config: {
    /** Pattern to match (regex or string) */
    pattern: string;
    
    /** Replacement or transformation */
    replacement?: string;
    
    /** Flags for regex patterns */
    flags?: string;
    
    /** Priority order (higher numbers execute first) */
    priority: number;
    
    /** Whether rule is enabled */
    enabled: boolean;
  };
  
  /** Optional description */
  description?: string;
}

export interface PatternConfig {
  /** Pattern identifier */
  id: string;
  
  /** Pattern type */
  type: 'header' | 'list' | 'action-item' | 'date' | 'person' | 'custom';
  
  /** Pattern matching rules */
  matcher: {
    /** Regex pattern */
    pattern: string;
    
    /** Pattern flags */
    flags: string;
    
    /** Minimum confidence score */
    minConfidence: number;
    
    /** Context requirements */
    context?: {
      /** Preceding line patterns */
      before?: string[];
      
      /** Following line patterns */
      after?: string[];
      
      /** Position requirements */
      position?: 'start' | 'end' | 'any';
    };
  };
  
  /** Output formatting */
  formatter: {
    /** Template for matched content */
    template: string;
    
    /** CSS classes to apply */
    classes?: string[];
    
    /** Additional metadata to extract */
    metadata?: Record<string, string>;
  };
}

export interface OutputConfig {
  /** Output format structure */
  structure: {
    /** Header template */
    header?: string;
    
    /** Body template */
    body: string;
    
    /** Footer template */
    footer?: string;
    
    /** Section separators */
    separators?: {
      section: string;
      item: string;
      subitem: string;
    };
  };
  
  /** Styling options */
  styling: {
    /** Indentation settings */
    indentation: {
      type: 'spaces' | 'tabs';
      size: number;
    };
    
    /** Line spacing */
    lineSpacing: 'single' | 'double' | 'custom';
    
    /** Custom line spacing value */
    customSpacing?: number;
    
    /** Text wrapping */
    wrapping: {
      enabled: boolean;
      width?: number;
    };
  };
  
  /** Content organization */
  organization: {
    /** Sorting options */
    sorting?: {
      enabled: boolean;
      criteria: 'alphabetical' | 'priority' | 'date' | 'custom';
      direction: 'asc' | 'desc';
    };
    
    /** Grouping options */
    grouping?: {
      enabled: boolean;
      criteria: 'type' | 'category' | 'date' | 'custom';
    };
    
    /** Deduplication */
    deduplication: {
      enabled: boolean;
      criteria: 'exact' | 'similar' | 'custom';
    };
  };
}

export interface ProcessingConfig {
  /** Processing options */
  options: {
    /** Enable parallel processing */
    parallel: boolean;
    
    /** Maximum processing time */
    timeout: number;
    
    /** Enable caching */
    caching: boolean;
    
    /** Cache TTL */
    cacheTtl?: number;
  };
  
  /** Validation settings */
  validation: {
    /** Enable input validation */
    enabled: boolean;
    
    /** Minimum text length */
    minLength?: number;
    
    /** Maximum text length */
    maxLength?: number;
    
    /** Required patterns */
    requiredPatterns?: string[];
    
    /** Forbidden patterns */
    forbiddenPatterns?: string[];
  };
  
  /** Error handling */
  errorHandling: {
    /** Fallback behavior */
    fallback: 'base-format' | 'plain-text' | 'error';
    
    /** Retry attempts */
    retries: number;
    
    /** Error reporting */
    reporting: boolean;
  };
}

export interface TemplateSearchOptions {
  /** Search query */
  query?: string;
  
  /** Filter by base format */
  baseFormat?: FormatType;
  
  /** Filter by tags */
  tags?: string[];
  
  /** Only public templates */
  publicOnly?: boolean;
  
  /** Sort options */
  sortBy?: 'name' | 'created' | 'modified' | 'usage';
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Pagination */
  limit?: number;
  offset?: number;
}

// ============================================================================
// Storage Keys and Constants
// ============================================================================

const STORAGE_KEYS = {
  TEMPLATES: 'textFormatter:templates',
  TEMPLATE_INDEX: 'textFormatter:templates:index',
  TEMPLATE_TAGS: 'textFormatter:templates:tags',
  PUBLIC_TEMPLATES: 'textFormatter:templates:public',
} as const;

const TEMPLATE_VERSION = 1;
const MAX_TEMPLATES = 50;
const MAX_TEMPLATE_SIZE = 1024 * 1024; // 1MB per template

// ============================================================================
// Utility Functions
// ============================================================================

function generateTemplateId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function validateTemplate(template: unknown): template is FormattingTemplate {
  if (!template || typeof template !== 'object') return false;
  
  const tpl = template as Record<string, unknown>;
  
  return (
    typeof tpl.id === 'string' &&
    typeof tpl.name === 'string' &&
    typeof tpl.baseFormat === 'string' &&
    tpl.config !== null &&
    tpl.config !== undefined &&
    typeof tpl.config === 'object' &&
    tpl.metadata !== null &&
    tpl.metadata !== undefined &&
    typeof tpl.metadata === 'object'
  );
}

function createDefaultTemplate(
  name: string,
  baseFormat: FormatType
): Omit<FormattingTemplate, 'id' | 'metadata'> {
  return {
    name,
    baseFormat,
    config: {
      rules: [],
      patterns: [],
      output: {
        structure: {
          body: '{{content}}',
        },
        styling: {
          indentation: {
            type: 'spaces',
            size: 2,
          },
          lineSpacing: 'single',
          wrapping: {
            enabled: true,
            width: 80,
          },
        },
        organization: {
          deduplication: {
            enabled: false,
            criteria: 'exact',
          },
        },
      },
      processing: {
        options: {
          parallel: true,
          timeout: 30000,
          caching: true,
          cacheTtl: 3600000, // 1 hour
        },
        validation: {
          enabled: true,
          minLength: 1,
          maxLength: 1000000, // 1MB
        },
        errorHandling: {
          fallback: 'base-format',
          retries: 3,
          reporting: true,
        },
      },
    },
  };
}

// ============================================================================
// TemplateStorage Class
// ============================================================================

export class TemplateStorage {
  private static instance: TemplateStorage | null = null;
  private templateIndex: Map<string, FormattingTemplate> = new Map();
  private tagsIndex: Map<string, Set<string>> = new Map();
  private isLoaded = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): TemplateStorage {
    if (!TemplateStorage.instance) {
      TemplateStorage.instance = new TemplateStorage();
    }
    return TemplateStorage.instance;
  }

  /**
   * Initialize template storage
   */
  public async initialize(): Promise<Result<void, StorageError>> {
    if (this.isLoaded) {
      return { success: true, data: undefined };
    }

    try {
      await this.loadTemplateIndex();
      await this.loadTagsIndex();
      this.isLoaded = true;
      
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to initialize template storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'INIT_FAILED',
          { error }
        )
      };
    }
  }

  /**
   * Create new template
   */
  public async createTemplate(
    name: string,
    baseFormat: FormatType,
    config?: Partial<FormattingTemplate['config']>
  ): Promise<Result<string, StorageError>> {
    try {
      await this.ensureInitialized();

      // Check template limit
      if (this.templateIndex.size >= MAX_TEMPLATES) {
        return {
          success: false,
          error: new StorageError(
            'Maximum number of templates reached',
            'TEMPLATE_LIMIT_EXCEEDED',
            { limit: MAX_TEMPLATES, current: this.templateIndex.size }
          )
        };
      }

      const id = generateTemplateId();
      const now = new Date();
      
      const defaultTemplate = createDefaultTemplate(name, baseFormat);
      
      const template: FormattingTemplate = {
        ...defaultTemplate,
        id,
        config: {
          ...defaultTemplate.config,
          ...config,
        },
        metadata: {
          createdAt: now,
          modifiedAt: now,
          version: 1,
          usage: {
            timesUsed: 0,
            averageProcessingTime: 0,
          },
          tags: [],
          public: false,
        },
      };

      // Validate template size
      const templateSize = JSON.stringify(template).length;
      if (templateSize > MAX_TEMPLATE_SIZE) {
        return {
          success: false,
          error: new StorageError(
            'Template size exceeds maximum limit',
            'TEMPLATE_TOO_LARGE',
            { size: templateSize, limit: MAX_TEMPLATE_SIZE }
          )
        };
      }

      // Store template
      const result = await this.saveTemplate(template);
      if (!result.success) {
        return result;
      }

      // Update index
      this.templateIndex.set(id, template);
      await this.saveTemplateIndex();

      return { success: true, data: id };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CREATE_FAILED',
          { error, name, baseFormat }
        )
      };
    }
  }

  /**
   * Get template by ID
   */
  public async getTemplate(id: string): Promise<Result<FormattingTemplate | null, StorageError>> {
    try {
      await this.ensureInitialized();

      const template = this.templateIndex.get(id);
      if (template) {
        return { success: true, data: template };
      }

      // Try to load from storage if not in index
      const result = storage.getItem<FormattingTemplate>(`${STORAGE_KEYS.TEMPLATES}:${id}`, {
        validator: validateTemplate,
      });

      if (!result.success) {
        return { success: true, data: null };
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to get template: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'GET_FAILED',
          { error, id }
        )
      };
    }
  }

  /**
   * Update template
   */
  public async updateTemplate(
    id: string, 
    updates: Partial<Pick<FormattingTemplate, 'name' | 'description' | 'config' | 'examples'>>
  ): Promise<Result<FormattingTemplate, StorageError>> {
    try {
      await this.ensureInitialized();

      const template = this.templateIndex.get(id);
      if (!template) {
        return {
          success: false,
          error: new StorageError(
            'Template not found',
            'TEMPLATE_NOT_FOUND',
            { id }
          )
        };
      }

      const updatedTemplate: FormattingTemplate = {
        ...template,
        ...updates,
        metadata: {
          ...template.metadata,
          modifiedAt: new Date(),
          version: template.metadata.version + 1,
        },
      };

      // Validate template size
      const templateSize = JSON.stringify(updatedTemplate).length;
      if (templateSize > MAX_TEMPLATE_SIZE) {
        return {
          success: false,
          error: new StorageError(
            'Updated template size exceeds maximum limit',
            'TEMPLATE_TOO_LARGE',
            { size: templateSize, limit: MAX_TEMPLATE_SIZE }
          )
        };
      }

      // Save updated template
      const result = await this.saveTemplate(updatedTemplate);
      if (!result.success) {
        return result;
      }

      // Update index
      this.templateIndex.set(id, updatedTemplate);
      await this.saveTemplateIndex();

      return { success: true, data: updatedTemplate };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'UPDATE_FAILED',
          { error, id, updates }
        )
      };
    }
  }

  /**
   * Delete template
   */
  public async deleteTemplate(id: string): Promise<Result<void, StorageError>> {
    try {
      await this.ensureInitialized();

      const template = this.templateIndex.get(id);
      if (!template) {
        return { success: true, data: undefined }; // Already deleted
      }

      // Remove from storage
      const result = storage.removeItem(`${STORAGE_KEYS.TEMPLATES}:${id}`);
      if (!result.success) {
        return result;
      }

      // Remove from indexes
      this.templateIndex.delete(id);
      await this.removeFromTagsIndex(template);
      await this.saveTemplateIndex();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'DELETE_FAILED',
          { error, id }
        )
      };
    }
  }

  /**
   * Search templates
   */
  public async searchTemplates(options: TemplateSearchOptions = {}): Promise<Result<FormattingTemplate[], StorageError>> {
    try {
      await this.ensureInitialized();

      let templates = Array.from(this.templateIndex.values());

      // Apply filters
      if (options.query) {
        const query = options.query.toLowerCase();
        templates = templates.filter(template => 
          template.name.toLowerCase().includes(query) ||
          template.description?.toLowerCase().includes(query)
        );
      }

      if (options.baseFormat) {
        templates = templates.filter(template => 
          template.baseFormat === options.baseFormat
        );
      }

      if (options.tags?.length) {
        templates = templates.filter(template => 
          template.metadata.tags.some(tag => options.tags!.includes(tag))
        );
      }

      if (options.publicOnly) {
        templates = templates.filter(template => template.metadata.public);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'modified';
      const sortDirection = options.sortDirection || 'desc';
      
      templates.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'created':
            comparison = new Date(a.metadata.createdAt).getTime() - new Date(b.metadata.createdAt).getTime();
            break;
          case 'modified':
            comparison = new Date(a.metadata.modifiedAt).getTime() - new Date(b.metadata.modifiedAt).getTime();
            break;
          case 'usage':
            comparison = a.metadata.usage.timesUsed - b.metadata.usage.timesUsed;
            break;
        }

        return sortDirection === 'desc' ? -comparison : comparison;
      });

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || templates.length;
      templates = templates.slice(offset, offset + limit);

      return { success: true, data: templates };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to search templates: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'SEARCH_FAILED',
          { error, options }
        )
      };
    }
  }

  /**
   * Record template usage
   */
  public async recordUsage(id: string, processingTime: number): Promise<Result<void, StorageError>> {
    try {
      const template = this.templateIndex.get(id);
      if (!template) {
        return { success: true, data: undefined }; // Template not found, skip silently
      }

      const usage = template.metadata.usage;
      const updatedUsage = {
        timesUsed: usage.timesUsed + 1,
        lastUsed: new Date(),
        averageProcessingTime: (usage.averageProcessingTime * usage.timesUsed + processingTime) / (usage.timesUsed + 1),
      };

      const updatedTemplate: FormattingTemplate = {
        ...template,
        metadata: {
          ...template.metadata,
          usage: updatedUsage,
        },
      };

      // Update in memory and storage
      this.templateIndex.set(id, updatedTemplate);
      await this.saveTemplate(updatedTemplate);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          `Failed to record template usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'USAGE_RECORD_FAILED',
          { error, id, processingTime }
        )
      };
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.isLoaded) {
      const result = await this.initialize();
      if (!result.success) {
        throw result.error;
      }
    }
  }

  private async loadTemplateIndex(): Promise<void> {
    const result = storage.getItem<Record<string, FormattingTemplate>>(STORAGE_KEYS.TEMPLATE_INDEX);
    if (result.success && result.data) {
      this.templateIndex = new Map(Object.entries(result.data));
    }
  }

  private async saveTemplateIndex(): Promise<void> {
    const indexObject = Object.fromEntries(this.templateIndex.entries());
    storage.setItem(STORAGE_KEYS.TEMPLATE_INDEX, indexObject);
  }

  private async loadTagsIndex(): Promise<void> {
    const result = storage.getItem<Record<string, string[]>>(STORAGE_KEYS.TEMPLATE_TAGS);
    if (result.success && result.data) {
      this.tagsIndex = new Map(
        Object.entries(result.data).map(([tag, ids]) => [tag, new Set(ids)])
      );
    }
  }

  private async saveTagsIndex(): Promise<void> {
    const tagsObject = Object.fromEntries(
      Array.from(this.tagsIndex.entries()).map(([tag, ids]) => [tag, Array.from(ids)])
    );
    storage.setItem(STORAGE_KEYS.TEMPLATE_TAGS, tagsObject);
  }

  private async saveTemplate(template: FormattingTemplate): Promise<Result<void, StorageError>> {
    return storage.setItem(`${STORAGE_KEYS.TEMPLATES}:${template.id}`, template, {
      validator: validateTemplate,
    });
  }

  private async removeFromTagsIndex(template: FormattingTemplate): Promise<void> {
    if (!template.metadata.tags.length) return;

    template.metadata.tags.forEach(tag => {
      const tagSet = this.tagsIndex.get(tag);
      if (tagSet) {
        tagSet.delete(template.id);
        if (tagSet.size === 0) {
          this.tagsIndex.delete(tag);
        }
      }
    });

    await this.saveTagsIndex();
  }
}

// ============================================================================
// Exported Singleton Instance
// ============================================================================

export const templateStorage = TemplateStorage.getInstance();
export default templateStorage;
