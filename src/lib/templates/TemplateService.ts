/**
 * Template Service - Format template management and application
 * 
 * Manages format templates with CRUD operations, search/filtering,
 * and template application to input text
 */

// Using crypto.randomUUID() instead of nanoid
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
};
import { FORMATTERS } from '@/lib/formatting';
import type {
  FormatTemplate,
  TemplateService as ITemplateService,
  TemplateSearchOptions,
  TemplateStats,
  TemplateExport,
  ImportValidationResult,
  TemplateCategory
} from '@/types/history';
import type { FormattedOutput, TextInput } from '@/types/formatting';
import type { FormatType } from '@/types';

/**
 * Template validation result
 */
interface TemplateValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Template Service Implementation
 */
export class TemplateService implements ITemplateService {
  private templates = new Map<string, FormatTemplate>();
  private initialized = false;

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Create new template
   */
  async createTemplate(templateData: Omit<FormatTemplate, 'id' | 'metadata'>): Promise<string> {
    // Validate template data
    const validation = this.validateTemplate(templateData);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const id = generateId();
    const now = new Date();

    const template: FormatTemplate = {
      id,
      ...templateData,
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: 1,
        usageCount: 0,
        isPublic: false,
        isOfficial: false
      }
    };

    // Generate sample output if sample input is provided
    if (template.sampleInput) {
      try {
        const formatter = FORMATTERS[template.format];
        if (formatter) {
          const result = await formatter.format({
            content: template.sampleInput,
            metadata: {
              source: 'type',
              timestamp: now,
              size: template.sampleInput.length
            }
          });
          template.outputPreview = this.createPreview(result.content);
        }
      } catch (error) {
        // Silently fail - preview generation is not critical
      }
    }

    this.templates.set(id, template);
    await this.saveTemplate(template);
    
    return id;
  }

  /**
   * Get templates with search and filtering
   */
  async getTemplates(options: TemplateSearchOptions): Promise<{ templates: FormatTemplate[]; total: number }> {
    await this.ensureInitialized();
    
    let templates = Array.from(this.templates.values());

    // Apply filters
    if (options.query) {
      const query = options.query.toLowerCase();
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (options.categories && options.categories.length > 0) {
      templates = templates.filter(template =>
        options.categories!.includes(template.category)
      );
    }

    if (options.formats && options.formats.length > 0) {
      templates = templates.filter(template =>
        options.formats!.includes(template.format)
      );
    }

    if (options.tags && options.tags.length > 0) {
      templates = templates.filter(template =>
        options.tags!.some(tag => template.tags.includes(tag))
      );
    }

    if (options.publicOnly) {
      templates = templates.filter(template => template.metadata.isPublic);
    }

    if (options.officialOnly) {
      templates = templates.filter(template => template.metadata.isOfficial);
    }

    if (options.minRating !== undefined) {
      templates = templates.filter(template =>
        (template.metadata.rating || 0) >= options.minRating!
      );
    }

    // Apply sorting
    templates.sort((a, b) => {
      const { field, direction } = options.sort;
      let aVal: any, bVal: any;

      switch (field) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'createdAt':
          aVal = a.metadata.createdAt.getTime();
          bVal = b.metadata.createdAt.getTime();
          break;
        case 'usageCount':
          aVal = a.metadata.usageCount;
          bVal = b.metadata.usageCount;
          break;
        case 'rating':
          aVal = a.metadata.rating || 0;
          bVal = b.metadata.rating || 0;
          break;
        default:
          return 0;
      }

      if (direction === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    // Apply pagination
    const { page, limit } = options.pagination;
    const start = (page - 1) * limit;
    const paginatedTemplates = templates.slice(start, start + limit);

    return {
      templates: paginatedTemplates,
      total: templates.length
    };
  }

  /**
   * Get single template by ID
   */
  async getTemplate(id: string): Promise<FormatTemplate | null> {
    await this.ensureInitialized();
    return this.templates.get(id) || null;
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, updates: Partial<FormatTemplate>): Promise<void> {
    const template = await this.getTemplate(id);
    if (!template) {
      throw new Error(`Template ${id} not found`);
    }

    // Validate updates
    const updatedTemplate = { ...template, ...updates };
    const validation = this.validateTemplate(updatedTemplate);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Update metadata
    updatedTemplate.metadata = {
      ...template.metadata,
      updatedAt: new Date(),
      version: template.metadata.version + 1
    };

    this.templates.set(id, updatedTemplate);
    await this.saveTemplate(updatedTemplate);
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    const template = await this.getTemplate(id);
    if (!template) {
      return; // Already deleted
    }

    this.templates.delete(id);
    await this.removeTemplate(id);
  }

  /**
   * Apply template to input text
   */
  async applyTemplate(templateId: string, input: TextInput): Promise<FormattedOutput> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Get the formatter for this template's format
    const formatter = FORMATTERS[template.format];
    if (!formatter) {
      throw new Error(`No formatter available for format: ${template.format}`);
    }

    // Apply template configuration to processing
    const enhancedInput = this.applyTemplateConfig(input, template);
    
    // Format the text
    const result = await formatter.format(enhancedInput);
    
    // Apply template post-processing
    const enhancedResult = this.applyTemplatePostProcessing(result, template);
    
    // Update template usage count
    template.metadata.usageCount++;
    template.metadata.updatedAt = new Date();
    this.templates.set(templateId, template);
    await this.saveTemplate(template);

    return enhancedResult;
  }

  /**
   * Get template statistics
   */
  async getStats(): Promise<TemplateStats> {
    await this.ensureInitialized();
    
    const templates = Array.from(this.templates.values());
    
    if (templates.length === 0) {
      return {
        totalTemplates: 0,
        byCategory: {} as any,
        byFormat: {} as any,
        mostUsed: [],
        recentlyCreated: [],
        publicContributions: 0
      };
    }

    // Calculate statistics
    const byCategory: Record<TemplateCategory, number> = {} as any;
    const byFormat: Record<FormatType, number> = {} as any;
    let publicContributions = 0;
    
    for (const template of templates) {
      byCategory[template.category] = (byCategory[template.category] || 0) + 1;
      byFormat[template.format] = (byFormat[template.format] || 0) + 1;
      
      if (template.metadata.isPublic) {
        publicContributions++;
      }
    }

    // Most used templates
    const mostUsed = templates
      .filter(t => t.metadata.usageCount > 0)
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, 10)
      .map(template => ({
        template,
        usageCount: template.metadata.usageCount
      }));

    // Recently created templates
    const recentlyCreated = templates
      .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime())
      .slice(0, 10);

    return {
      totalTemplates: templates.length,
      byCategory,
      byFormat,
      mostUsed,
      recentlyCreated,
      publicContributions
    };
  }

  /**
   * Export templates
   */
  async exportTemplates(templateIds: string[], settings: TemplateExport['settings']): Promise<TemplateExport> {
    const templates: FormatTemplate[] = [];
    
    for (const id of templateIds) {
      const template = await this.getTemplate(id);
      if (template) {
        // Skip private templates if not included
        if (!settings.includePrivateTemplates && !template.metadata.isPublic) {
          continue;
        }
        
        let exportTemplate = { ...template };
        
        // Anonymize data if requested
        if (settings.anonymizeData) {
          exportTemplate.metadata.createdBy = undefined;
        }
        
        // Remove usage stats if not included
        if (!settings.includeUsageStats) {
          exportTemplate.metadata.usageCount = 0;
          exportTemplate.metadata.rating = undefined;
        }
        
        templates.push(exportTemplate);
      }
    }

    return {
      metadata: {
        version: '1.0.0',
        exportedAt: new Date(),
        includesHistory: false
      },
      templates,
      settings
    };
  }

  /**
   * Import templates
   */
  async importTemplates(exportData: TemplateExport, validation: ImportValidationResult): Promise<string[]> {
    if (!validation.isValid) {
      throw new Error('Import validation failed');
    }

    const importedIds: string[] = [];

    for (const templateData of exportData.templates) {
      try {
        // Handle conflicts based on resolution strategy
        const existingTemplate = Array.from(this.templates.values())
          .find(t => t.name === templateData.name && t.format === templateData.format);

        if (existingTemplate) {
          const conflict = validation.conflicts.find(c => 
            c.type === 'template' && 
            (c.existing as FormatTemplate).id === existingTemplate.id
          );

          switch (conflict?.resolution) {
            case 'skip':
              continue;
            case 'overwrite':
              await this.updateTemplate(existingTemplate.id, templateData);
              importedIds.push(existingTemplate.id);
              continue;
            case 'rename':
              templateData.name = `${templateData.name} (Imported)`;
              break;
            case 'merge':
              // Merge logic would go here
              break;
          }
        }

        // Create new template
        const { id: _, metadata: __, ...templateToImport } = templateData;
        const newId = await this.createTemplate(templateToImport);
        importedIds.push(newId);

      } catch (error) {
        console.error(`Failed to import template ${templateData.name}:`, error);
      }
    }

    return importedIds;
  }

  /**
   * Private helper methods
   */

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.loadTemplates();
      this.initialized = true;
    }
  }

  private async loadTemplates(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    // For now, we'll use the default templates
  }

  private async saveTemplate(template: FormatTemplate): Promise<void> {
    // In a real implementation, this would save to persistent storage
    // For now, we'll just keep it in memory
  }

  private async removeTemplate(id: string): Promise<void> {
    // In a real implementation, this would remove from persistent storage
  }

  private validateTemplate(template: Partial<FormatTemplate>): TemplateValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Template name is required' });
    }

    if (!template.format) {
      errors.push({ field: 'format', message: 'Template format is required' });
    }

    if (!template.category) {
      errors.push({ field: 'category', message: 'Template category is required' });
    }

    if (!template.config) {
      errors.push({ field: 'config', message: 'Template configuration is required' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private applyTemplateConfig(input: TextInput, template: FormatTemplate): TextInput {
    // Apply template-specific preprocessing
    let enhancedContent = input.content;

    // Apply custom rules if defined
    if (template.config.customRules) {
      for (const rule of template.config.customRules) {
        if (rule.enabled) {
          try {
            const regex = new RegExp(rule.pattern, 'g');
            enhancedContent = enhancedContent.replace(regex, rule.replacement);
          } catch (error) {
            console.warn(`Invalid regex pattern in template rule: ${rule.pattern}`);
          }
        }
      }
    }

    return {
      ...input,
      content: enhancedContent
    };
  }

  private applyTemplatePostProcessing(result: FormattedOutput, template: FormatTemplate): FormattedOutput {
    let enhancedContent = result.content;

    // Add custom headers
    if (template.config.formatting.customHeaders) {
      const headers = template.config.formatting.customHeaders.join('\n');
      enhancedContent = `${headers}\n\n${enhancedContent}`;
    }

    // Add custom footers
    if (template.config.formatting.customFooters) {
      const footers = template.config.formatting.customFooters.join('\n');
      enhancedContent = `${enhancedContent}\n\n${footers}`;
    }

    return {
      ...result,
      content: enhancedContent
    };
  }

  private createPreview(text: string, maxLength: number = 300): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<FormatTemplate, 'id' | 'metadata'>[] = [
      {
        name: 'Business Meeting Notes',
        description: 'Professional meeting notes with action items and attendee tracking',
        category: 'business',
        format: 'meeting-notes',
        config: {
          processing: {
            enablePatternRecognition: true,
            enableDataExtraction: true,
            enableContentAnalysis: true
          },
          formatting: {
            includeMetadata: true,
            includeConfidence: false,
            theme: 'detailed'
          },
          formatSpecific: {}
        },
        tags: ['business', 'professional', 'action-items'],
        sampleInput: 'Meeting with John and Sarah about Q4 planning. Action: John to review budget by Friday. Next meeting: December 15th.'
      },
      {
        name: 'Personal Task List',
        description: 'Simple task organization for personal productivity',
        category: 'personal',
        format: 'task-lists',
        config: {
          processing: {
            enablePatternRecognition: true,
            enableDataExtraction: false,
            enableContentAnalysis: true
          },
          formatting: {
            includeMetadata: false,
            includeConfidence: false,
            theme: 'minimal'
          },
          formatSpecific: {}
        },
        tags: ['personal', 'productivity', 'simple'],
        sampleInput: 'Buy groceries, call mom, finish project report, schedule dentist appointment'
      },
      {
        name: 'Academic Research Notes',
        description: 'Structured notes for academic research with citations and sources',
        category: 'academic',
        format: 'research-notes',
        config: {
          processing: {
            enablePatternRecognition: true,
            enableDataExtraction: true,
            enableContentAnalysis: true
          },
          formatting: {
            includeMetadata: true,
            includeConfidence: true,
            theme: 'detailed'
          },
          formatSpecific: {}
        },
        tags: ['academic', 'research', 'citations'],
        sampleInput: 'According to Smith (2023), climate change impacts agriculture. "The effects are more severe than previously thought" (p. 45).'
      }
    ];

    // Create default templates
    defaultTemplates.forEach(async (templateData) => {
      try {
        await this.createTemplate(templateData);
      } catch (error) {
        console.error('Failed to create default template:', error);
      }
    });
  }
}
