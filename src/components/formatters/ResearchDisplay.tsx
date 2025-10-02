'use client';

/**
 * Research Display Component - Interactive research notes with citations and sources
 * 
 * Features:
 * - Organized research sections with topics
 * - Citation management and formatting
 * - Quote display with proper attribution
 * - Source organization and reference management
 * - Academic writing style presentation
 * - Modern orange theme styling
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ResearchNotesData, Citation, Quote, ResearchTopic, Source } from '@/types/formatting';

interface ResearchDisplayProps {
  /** Research data from formatter */
  data: ResearchNotesData;
  
  /** Display mode for organization */
  displayMode?: 'topics' | 'citations' | 'sources';
  
  /** Whether sections are expandable */
  interactive?: boolean;
  
  /** Callback when citation is clicked */
  onCitationClick?: (citationId: string) => void;
  
  /** Callback when source is accessed */
  onSourceClick?: (sourceId: string) => void;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Citation format colors for visual distinction
 */
const CITATION_FORMAT_COLORS = {
  apa: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  mla: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  chicago: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  harvard: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  custom: 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
};

/**
 * Source type icons for visual identification
 */
const SOURCE_TYPE_ICONS: Record<string, string> = {
  book: '📖',
  article: '📄',
  website: '🌐',
  journal: '📰',
  report: '📋',
  other: '📎'
};

export function ResearchDisplay({
  data,
  displayMode = 'topics',
  interactive = true,
  onCitationClick,
  onSourceClick,
  className = ''
}: ResearchDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  /**
   * Handle section expand/collapse
   */
  const handleSectionToggle = useCallback((sectionId: string) => {
    if (!interactive) return;
    
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, [interactive]);

  /**
   * Filter citations by format
   */
  const filteredCitations = selectedFormat === 'all' 
    ? data.citations 
    : data.citations.filter(c => c.format === selectedFormat);

  /**
   * Get citations for a specific topic
   */
  const getCitationsForTopic = (topic: ResearchTopic): Citation[] => {
    return topic.citationIds
      .map(id => data.citations.find(c => c.id === id))
      .filter(Boolean) as Citation[];
  };

  /**
   * Get quotes for a specific topic
   */
  const getQuotesForTopic = (topic: ResearchTopic): Quote[] => {
    return topic.quoteIds
      .map(id => data.quotes.find(q => q.text === id)) // Note: quotes use text as ID in this case
      .filter(Boolean) as Quote[];
  };

  /**
   * Format citation display text
   */
  const formatCitation = (citation: Citation): string => {
    const { source } = citation;
    switch (citation.format) {
      case 'apa':
        return `${source.author || 'Unknown'} (${source.year || 'n.d.'})`;
      case 'mla':
        return `${source.author || 'Unknown'}`;
      case 'chicago':
        return `${source.author || 'Unknown'}, ${source.year || 'n.d.'}`;
      case 'harvard':
        return `${source.author || 'Unknown'}, ${source.year || 'n.d.'}`;
      default:
        return citation.text;
    }
  };

  /**
   * Get unique citation formats for filtering
   */
  const availableFormats = [...new Set(data.citations.map(c => c.format))];

  return (
    <div className={`research-display ${className}`}>
      {/* Header with stats and controls */}
      <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-handwritten text-orange-900 dark:text-orange-100 mb-1">
              📚 Research Notes
            </h2>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {data.topics.length} topics • {data.citations.length} citations • {data.quotes.length} quotes • {data.sources.length} sources
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={displayMode === 'topics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {/* Toggle display mode */}}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Topics
            </Button>
            <Button
              variant={displayMode === 'citations' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {/* Toggle display mode */}}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Citations
            </Button>
            <Button
              variant={displayMode === 'sources' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {/* Toggle display mode */}}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Sources
            </Button>
          </div>
        </div>

        {/* Citation format filter */}
        {data.citations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300 mr-2">
              Citation formats:
            </span>
            <Badge
              variant={selectedFormat === 'all' ? 'default' : 'outline'}
              className={`cursor-pointer ${selectedFormat === 'all' ? 'bg-orange-500' : ''}`}
              onClick={() => setSelectedFormat('all')}
            >
              All ({data.citations.length})
            </Badge>
            {availableFormats.map(format => (
              <Badge
                key={format}
                variant={selectedFormat === format ? 'default' : 'outline'}
                className={`cursor-pointer ${CITATION_FORMAT_COLORS[format as keyof typeof CITATION_FORMAT_COLORS]}`}
                onClick={() => setSelectedFormat(format)}
              >
                {format.toUpperCase()} ({data.citations.filter(c => c.format === format).length})
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Main content based on display mode */}
      {displayMode === 'topics' && (
        <div className="space-y-4">
          {data.topics.map((topic, index) => {
            const isExpanded = expandedSections.has(topic.name);
            const topicCitations = getCitationsForTopic(topic);
            const topicQuotes = getQuotesForTopic(topic);
            
            return (
              <Card key={topic.name} className="border-orange-200 dark:border-orange-800">
                <CardHeader 
                  className={`pb-3 ${interactive ? 'cursor-pointer' : ''}`}
                  onClick={() => interactive && handleSectionToggle(topic.name)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📝</span>
                      <div>
                        <div className="font-handwritten text-orange-900 dark:text-orange-100">
                          {topic.name}
                        </div>
                        {topic.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-content">
                            {topic.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {topicCitations.length > 0 && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {topicCitations.length} citations
                        </Badge>
                      )}
                      {topicQuotes.length > 0 && (
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          {topicQuotes.length} quotes
                        </Badge>
                      )}
                      
                      {interactive && (
                        <span className="text-gray-400 text-sm">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>

                {(isExpanded || !interactive) && (
                  <CardContent className="pt-0">
                    {/* Citations for this topic */}
                    {topicCitations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                          📖 Citations
                        </h4>
                        <div className="space-y-2">
                          {topicCitations.map(citation => (
                            <div 
                              key={citation.id}
                              className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-400 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30"
                              onClick={() => onCitationClick?.(citation.id)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-blue-700 dark:text-blue-300">
                                  {formatCitation(citation)}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${CITATION_FORMAT_COLORS[citation.format]}`}
                                >
                                  {citation.format.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {citation.source.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quotes for this topic */}
                    {topicQuotes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                          💬 Quotes
                        </h4>
                        <div className="space-y-3">
                          {topicQuotes.map((quote, qIndex) => (
                            <blockquote 
                              key={qIndex}
                              className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50 dark:bg-purple-950/20 rounded-r"
                            >
                              <p className="text-purple-700 dark:text-purple-300 italic">
                                "{quote.text}"
                              </p>
                              {(quote.author || quote.source) && (
                                <footer className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                                  — {quote.author}
                                  {quote.source && `, ${quote.source}`}
                                  {quote.location && ` (${quote.location})`}
                                </footer>
                              )}
                              {quote.notes && (
                                <div className="text-xs text-purple-500 dark:text-purple-400 mt-1 italic">
                                  {quote.notes}
                                </div>
                              )}
                            </blockquote>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Citations view */}
      {displayMode === 'citations' && (
        <div className="space-y-3">
          <h3 className="font-handwritten text-lg text-gray-900 dark:text-gray-100">
            📖 All Citations
          </h3>
          <div className="space-y-2">
            {filteredCitations.map(citation => (
              <Card 
                key={citation.id}
                className="p-4 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer"
                onClick={() => onCitationClick?.(citation.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-blue-700 dark:text-blue-300">
                      {formatCitation(citation)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {citation.source.title}
                    </div>
                    {citation.source.publication && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {citation.source.publication}
                      </div>
                    )}
                  </div>
                  <Badge className={CITATION_FORMAT_COLORS[citation.format]}>
                    {citation.format.toUpperCase()}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sources view */}
      {displayMode === 'sources' && (
        <div className="space-y-3">
          <h3 className="font-handwritten text-lg text-gray-900 dark:text-gray-100">
            📚 All Sources
          </h3>
          <div className="space-y-2">
            {data.sources.map(source => (
              <Card 
                key={source.id}
                className="p-4 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950/20 cursor-pointer"
                onClick={() => onSourceClick?.(source.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {SOURCE_TYPE_ICONS[source.type] || SOURCE_TYPE_ICONS.other}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {source.title}
                    </div>
                    <Badge variant="outline" className="mt-1">
                      {source.type}
                    </Badge>
                    
                    {Object.keys(source.metadata).length > 0 && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {Object.entries(source.metadata).map(([key, value]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {value}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Footer with research tips */}
      <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-1">
          🔬 <strong>Research Tips:</strong>
        </p>
        <ul className="space-y-1 text-xs ml-4">
          <li>• Organize sources by topic for better academic structure</li>
          <li>• Use consistent citation formats throughout your research</li>
          <li>• Include page numbers and locations for better referencing</li>
          <li>• Keep detailed notes to track your research progress</li>
        </ul>
      </div>
    </div>
  );
}
