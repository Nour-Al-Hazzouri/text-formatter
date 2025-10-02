'use client';

/**
 * History Dashboard - Format transformation history with search and filtering
 * 
 * Features:
 * - Recent transformations timeline
 * - Advanced search and filtering
 * - Statistics and analytics
 * - Favorites and tagging
 * - Export and sharing capabilities
 */

import { useState, useEffect, useCallback } from 'react';
// Using built-in date formatting instead of date-fns
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { 
  FormatHistoryEntry, 
  HistorySearchOptions, 
  HistoryStats 
} from '@/types/history';
import type { FormatType } from '@/types';

interface HistoryDashboardProps {
  /** History service instance */
  historyService: any; // Would be properly typed in real implementation
  
  /** Callback when entry is selected for reuse */
  onEntrySelect?: (entry: FormatHistoryEntry) => void;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format type icons and colors
 */
const FORMAT_CONFIG: Record<FormatType, { icon: string; color: string; label: string }> = {
  'meeting-notes': { icon: '📝', color: 'bg-blue-100 text-blue-700', label: 'Meeting Notes' },
  'task-lists': { icon: '✅', color: 'bg-green-100 text-green-700', label: 'Task Lists' },
  'shopping-lists': { icon: '🛒', color: 'bg-purple-100 text-purple-700', label: 'Shopping Lists' },
  'journal-notes': { icon: '📔', color: 'bg-orange-100 text-orange-700', label: 'Journal Notes' },
  'research-notes': { icon: '📚', color: 'bg-indigo-100 text-indigo-700', label: 'Research Notes' },
  'study-notes': { icon: '🎓', color: 'bg-pink-100 text-pink-700', label: 'Study Notes' }
};

export function HistoryDashboard({ 
  historyService, 
  onEntrySelect,
  className = '' 
}: HistoryDashboardProps) {
  const [entries, setEntries] = useState<FormatHistoryEntry[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [searchOptions, setSearchOptions] = useState<HistorySearchOptions>({
    sort: { field: 'timestamp', direction: 'desc' },
    pagination: { page: 1, limit: 20 }
  });
  const [selectedEntry, setSelectedEntry] = useState<FormatHistoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Load entries and stats
  useEffect(() => {
    loadData();
  }, [searchOptions]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [entriesResult, statsResult] = await Promise.all([
        historyService.getEntries(searchOptions),
        historyService.getStats()
      ]);
      
      setEntries(entriesResult.entries);
      setTotal(entriesResult.total);
      setStats(statsResult);
      
    } catch (error) {
      console.error('Failed to load history data:', error);
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

  const handleFormatFilter = useCallback((formats: FormatType[]) => {
    setSearchOptions(prev => ({
      ...prev,
      formats: formats.length > 0 ? formats : undefined,
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  const handleFavoriteToggle = useCallback(async (entry: FormatHistoryEntry) => {
    try {
      await historyService.updateEntry(entry.id, {
        favorited: !entry.favorited
      });
      
      // Update local state
      setEntries(prev => 
        prev.map(e => 
          e.id === entry.id ? { ...e, favorited: !e.favorited } : e
        )
      );
      
    } catch (error) {
      console.error('Failed to update favorite status:', error);
    }
  }, [historyService]);

  const handleTagUpdate = useCallback(async (entry: FormatHistoryEntry, newTags: string[]) => {
    try {
      await historyService.updateEntry(entry.id, { tags: newTags });
      
      // Update local state
      setEntries(prev =>
        prev.map(e =>
          e.id === entry.id ? { ...e, tags: newTags } : e
        )
      );
      
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  }, [historyService]);

  const handleDelete = useCallback(async (entry: FormatHistoryEntry) => {
    if (!confirm('Are you sure you want to delete this history entry?')) {
      return;
    }
    
    try {
      await historyService.deleteEntry(entry.id);
      setEntries(prev => prev.filter(e => e.id !== entry.id));
      setTotal(prev => prev - 1);
      
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  }, [historyService]);

  const renderEntry = (entry: FormatHistoryEntry) => {
    const formatConfig = FORMAT_CONFIG[entry.format];
    
    return (
      <Card 
        key={entry.id} 
        className={`cursor-pointer transition-all hover:shadow-md ${
          selectedEntry?.id === entry.id ? 'ring-2 ring-orange-500' : ''
        }`}
        onClick={() => setSelectedEntry(entry)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{formatConfig.icon}</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {formatConfig.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(entry.timestamp)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${formatConfig.color} border-current`}
              >
                {entry.processingMetadata.confidence}% confidence
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavoriteToggle(entry);
                }}
              >
                {entry.favorited ? '⭐' : '☆'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Input preview */}
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Input ({entry.inputSize.toLocaleString()} chars)
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                {entry.inputPreview}
              </div>
            </div>
            
            {/* Output preview */}
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Formatted Output
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-200 bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
                {entry.outputPreview}
              </div>
            </div>
            
            {/* Tags */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Notes */}
            {entry.notes && (
              <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                {entry.notes}
              </div>
            )}
            
            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
              <span>⏱️ {entry.processingMetadata.duration.toFixed(1)}ms</span>
              <span>📊 {entry.processingMetadata.itemCount} items</span>
              {entry.templateId && <span>📋 From template</span>}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEntrySelect?.(entry);
                }}
              >
                Reuse
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(entry.outputPreview);
                }}
              >
                Copy
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(entry);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`history-dashboard ${className}`}>
      {/* Header with stats */}
      <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <h2 className="text-xl font-handwritten text-orange-900 dark:text-orange-100 mb-3">
          📊 Format History Dashboard
        </h2>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-orange-700 dark:text-orange-300">
                {stats.totalTransformations.toLocaleString()}
              </div>
              <div className="text-orange-600 dark:text-orange-400">Total Formats</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-700 dark:text-blue-300">
                {stats.averageConfidence.toFixed(1)}%
              </div>
              <div className="text-blue-600 dark:text-blue-400">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-700 dark:text-green-300">
                {stats.recentActivity}
              </div>
              <div className="text-green-600 dark:text-green-400">This Week</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-700 dark:text-purple-300">
                {(stats.storageUsed / 1024 / 1024).toFixed(1)} MB
              </div>
              <div className="text-purple-600 dark:text-purple-400">Storage Used</div>
            </div>
          </div>
        )}
      </div>

      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Search history entries..."
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline">
            🔍 Advanced Search
          </Button>
        </div>
        
        {/* Format filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Filter by format:
          </span>
          {Object.entries(FORMAT_CONFIG).map(([format, config]) => (
            <Badge
              key={format}
              variant="outline"
              className={`cursor-pointer hover:${config.color}`}
              onClick={() => {
                const currentFormats = searchOptions.formats || [];
                const newFormats = currentFormats.includes(format as FormatType)
                  ? currentFormats.filter(f => f !== format)
                  : [...currentFormats, format as FormatType];
                handleFormatFilter(newFormats);
              }}
            >
              {config.icon} {config.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Entries list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading history...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📝</div>
            <div>No history entries found</div>
            <div className="text-sm mt-1">Start formatting text to build your history</div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {entries.length} of {total.toLocaleString()} entries
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={searchOptions.pagination.page === 1}
                  onClick={() => setSearchOptions(prev => ({
                    ...prev,
                    pagination: { ...prev.pagination, page: prev.pagination.page - 1 }
                  }))}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {searchOptions.pagination.page}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={entries.length < searchOptions.pagination.limit}
                  onClick={() => setSearchOptions(prev => ({
                    ...prev,
                    pagination: { ...prev.pagination, page: prev.pagination.page + 1 }
                  }))}
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {entries.map(renderEntry)}
            </div>
          </>
        )}
      </div>

      {/* Entry detail modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Entry Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEntry(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Detailed view of selected entry */}
              <div>
                <label className="text-sm font-medium">Tags</label>
                <Input
                  placeholder="Add tags (comma-separated)"
                  defaultValue={selectedEntry.tags.join(', ')}
                  onBlur={(e) => {
                    const newTags = e.target.value
                      .split(',')
                      .map(tag => tag.trim())
                      .filter(tag => tag.length > 0);
                    handleTagUpdate(selectedEntry, newTags);
                  }}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Add your notes..."
                  defaultValue={selectedEntry.notes || ''}
                  onBlur={(e) => {
                    historyService.updateEntry(selectedEntry.id, {
                      notes: e.target.value.trim() || undefined
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
