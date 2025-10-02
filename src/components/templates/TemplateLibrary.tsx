'use client';

/**
 * Template Library - Template creation, management, and application
 * 
 * Features:
 * - Template browser with categorization
 * - Template creation and editing
 * - Template search and filtering
 * - Template application and preview
 * - Import/export capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { 
  FormatTemplate, 
  TemplateSearchOptions, 
  TemplateStats,
  TemplateCategory 
} from '@/types/history';
import type { FormatType } from '@/types';

interface TemplateLibraryProps {
  /** Template service instance */
  templateService: any; // Would be properly typed in real implementation
  
  /** Callback when template is applied */
  onTemplateApply?: (template: FormatTemplate) => void;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Category configuration
 */
const CATEGORY_CONFIG: Record<TemplateCategory, { icon: string; color: string; label: string }> = {
  business: { icon: '💼', color: 'bg-blue-100 text-blue-700', label: 'Business' },
  academic: { icon: '🎓', color: 'bg-indigo-100 text-indigo-700', label: 'Academic' },
  personal: { icon: '👤', color: 'bg-green-100 text-green-700', label: 'Personal' },
  creative: { icon: '🎨', color: 'bg-pink-100 text-pink-700', label: 'Creative' },
  technical: { icon: '⚙️', color: 'bg-gray-100 text-gray-700', label: 'Technical' },
  educational: { icon: '📚', color: 'bg-orange-100 text-orange-700', label: 'Educational' },
  productivity: { icon: '📈', color: 'bg-purple-100 text-purple-700', label: 'Productivity' },
  custom: { icon: '⭐', color: 'bg-yellow-100 text-yellow-700', label: 'Custom' }
};

/**
 * Format configuration
 */
const FORMAT_CONFIG: Record<FormatType, { icon: string; label: string }> = {
  'meeting-notes': { icon: '📝', label: 'Meeting Notes' },
  'task-lists': { icon: '✅', label: 'Task Lists' },
  'shopping-lists': { icon: '🛒', label: 'Shopping Lists' },
  'journal-notes': { icon: '📔', label: 'Journal Notes' },
  'research-notes': { icon: '📚', label: 'Research Notes' },
  'study-notes': { icon: '🎓', label: 'Study Notes' }
};

export function TemplateLibrary({ 
  templateService, 
  onTemplateApply,
  className = '' 
}: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<FormatTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [searchOptions, setSearchOptions] = useState<TemplateSearchOptions>({
    sort: { field: 'name', direction: 'asc' },
    pagination: { page: 1, limit: 12 }
  });
  const [selectedTemplate, setSelectedTemplate] = useState<FormatTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [total, setTotal] = useState(0);

  // Load templates and stats
  useEffect(() => {
    loadData();
  }, [searchOptions]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [templatesResult, statsResult] = await Promise.all([
        templateService.getTemplates(searchOptions),
        templateService.getStats()
      ]);
      
      setTemplates(templatesResult.templates);
      setTotal(templatesResult.total);
      setStats(statsResult);
      
    } catch (error) {
      console.error('Failed to load template data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchOptions(prev => ({
      ...prev,
      query: query.trim() || undefined,
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  const handleCategoryFilter = useCallback((categories: TemplateCategory[]) => {
    setSearchOptions(prev => ({
      ...prev,
      categories: categories.length > 0 ? categories : undefined,
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  const handleApplyTemplate = useCallback(async (template: FormatTemplate) => {
    try {
      onTemplateApply?.(template);
    } catch (error) {
      console.error('Failed to apply template:', error);
    }
  }, [onTemplateApply]);

  const handleDeleteTemplate = useCallback(async (template: FormatTemplate) => {
    if (!confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      return;
    }
    
    try {
      await templateService.deleteTemplate(template.id);
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      setTotal(prev => prev - 1);
      
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  }, [templateService]);

  const renderTemplate = (template: FormatTemplate) => {
    const categoryConfig = CATEGORY_CONFIG[template.category];
    const formatConfig = FORMAT_CONFIG[template.format];
    
    return (
      <Card 
        key={template.id} 
        className="cursor-pointer transition-all hover:shadow-md"
        onClick={() => setSelectedTemplate(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{categoryConfig.icon}</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {template.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatConfig.icon} {formatConfig.label}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {template.metadata.isOfficial && (
                <Badge variant="default" className="text-xs bg-orange-500">
                  Official
                </Badge>
              )}
              {template.metadata.isPublic && (
                <Badge variant="outline" className="text-xs">
                  Public
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {/* Description */}
          {template.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {template.description}
            </p>
          )}
          
          {/* Category and tags */}
          <div className="flex flex-wrap gap-1">
            <Badge className={`text-xs ${categoryConfig.color} border-current`}>
              {categoryConfig.label}
            </Badge>
            {template.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 2}
              </Badge>
            )}
          </div>
          
          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Used {template.metadata.usageCount} times</span>
            {template.metadata.rating && (
              <span>⭐ {template.metadata.rating.toFixed(1)}</span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleApplyTemplate(template);
              }}
              className="flex-1"
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                // Handle duplicate/fork
              }}
            >
              Fork
            </Button>
            {!template.metadata.isOfficial && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTemplate(template);
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCreateForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Create New Template</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateForm(false)}
          >
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Template Name</label>
            <Input placeholder="Enter template name..." />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <select className="w-full p-2 border rounded">
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea placeholder="Describe what this template does..." />
        </div>
        
        <div>
          <label className="text-sm font-medium">Format Type</label>
          <select className="w-full p-2 border rounded">
            {Object.entries(FORMAT_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Tags (comma-separated)</label>
          <Input placeholder="productivity, business, meeting..." />
        </div>
        
        <div>
          <label className="text-sm font-medium">Sample Input</label>
          <Textarea placeholder="Provide sample input text for demonstration..." />
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button className="flex-1">Create Template</Button>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`template-library ${className}`}>
      {/* Header with stats */}
      <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-handwritten text-orange-900 dark:text-orange-100">
            📋 Template Library
          </h2>
          
          <Button onClick={() => setShowCreateForm(true)}>
            ➕ Create Template
          </Button>
        </div>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-orange-700 dark:text-orange-300">
                {stats.totalTemplates}
              </div>
              <div className="text-orange-600 dark:text-orange-400">Total Templates</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-700 dark:text-blue-300">
                {stats.mostUsed.length}
              </div>
              <div className="text-blue-600 dark:text-blue-400">Popular</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-700 dark:text-green-300">
                {stats.recentlyCreated.length}
              </div>
              <div className="text-green-600 dark:text-green-400">Recent</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-700 dark:text-purple-300">
                {stats.publicContributions}
              </div>
              <div className="text-purple-600 dark:text-purple-400">Public</div>
            </div>
          </div>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && renderCreateForm()}

      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <Input
          placeholder="Search templates..."
          onChange={(e) => handleSearch(e.target.value)}
        />
        
        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Categories:
          </span>
          {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
            <Badge
              key={category}
              variant="outline"
              className={`cursor-pointer hover:${config.color}`}
              onClick={() => {
                const currentCategories = searchOptions.categories || [];
                const newCategories = currentCategories.includes(category as TemplateCategory)
                  ? currentCategories.filter(c => c !== category)
                  : [...currentCategories, category as TemplateCategory];
                handleCategoryFilter(newCategories);
              }}
            >
              {config.icon} {config.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Templates grid */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <div>No templates found</div>
          <div className="text-sm mt-1">Create your first template to get started</div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {templates.length} of {total} templates
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(renderTemplate)}
          </div>
        </>
      )}

      {/* Template detail modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedTemplate.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTemplate(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div><strong>Category:</strong> {CATEGORY_CONFIG[selectedTemplate.category].label}</div>
                <div><strong>Format:</strong> {FORMAT_CONFIG[selectedTemplate.format].label}</div>
                <div><strong>Description:</strong> {selectedTemplate.description || 'No description'}</div>
                <div><strong>Tags:</strong> {selectedTemplate.tags.join(', ')}</div>
              </div>
              
              {selectedTemplate.sampleInput && (
                <div>
                  <div className="font-medium mb-2">Sample Input:</div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                    {selectedTemplate.sampleInput}
                  </div>
                </div>
              )}
              
              {selectedTemplate.outputPreview && (
                <div>
                  <div className="font-medium mb-2">Expected Output:</div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded text-sm">
                    {selectedTemplate.outputPreview}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleApplyTemplate(selectedTemplate)}
                  className="flex-1"
                >
                  Apply Template
                </Button>
                <Button variant="outline">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
