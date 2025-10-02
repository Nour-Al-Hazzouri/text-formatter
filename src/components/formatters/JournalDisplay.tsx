'use client';

/**
 * Journal Display Component - Interactive journal entries with mood tracking
 * 
 * Features:
 * - Organized journal entries with timestamps
 * - Mood indicators and emotional tone visualization
 * - Insights and quotes highlighting
 * - Topic tags and navigation
 * - Modern orange theme styling
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { JournalNotesData, JournalEntry } from '@/types/formatting';

interface JournalDisplayProps {
  /** Journal data from formatter */
  data: JournalNotesData;
  
  /** Whether entries are expandable/collapsible */
  interactive?: boolean;
  
  /** Display mode: chronological or by mood */
  displayMode?: 'chronological' | 'by-mood' | 'by-topic';
  
  /** Callback when entry is expanded */
  onEntryExpand?: (entryIndex: number, expanded: boolean) => void;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Mood indicators and colors
 */
const MOOD_CONFIG = {
  positive: { 
    emoji: '😊', 
    color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    textColor: 'text-green-700 dark:text-green-300'
  },
  negative: { 
    emoji: '😔', 
    color: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
    textColor: 'text-red-700 dark:text-red-300'
  },
  mixed: { 
    emoji: '😐', 
    color: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-700 dark:text-yellow-300'
  },
  neutral: { 
    emoji: '😌', 
    color: 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300'
  }
};

export function JournalDisplay({
  data,
  interactive = true,
  displayMode = 'chronological',
  onEntryExpand,
  className = ''
}: JournalDisplayProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

  /**
   * Handle entry expand/collapse
   */
  const handleEntryToggle = useCallback((entryIndex: number) => {
    if (!interactive) return;
    
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      const isExpanded = newSet.has(entryIndex);
      
      if (isExpanded) {
        newSet.delete(entryIndex);
      } else {
        newSet.add(entryIndex);
      }
      
      onEntryExpand?.(entryIndex, !isExpanded);
      return newSet;
    });
  }, [interactive, onEntryExpand]);

  /**
   * Sort entries based on display mode
   */
  const sortedEntries = [...data.entries].sort((a, b) => {
    switch (displayMode) {
      case 'chronological':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'by-mood':
        const moodOrder = { positive: 0, mixed: 1, neutral: 2, negative: 3 };
        const aMoodOrder = moodOrder[a.mood as keyof typeof moodOrder] ?? 4;
        const bMoodOrder = moodOrder[b.mood as keyof typeof moodOrder] ?? 4;
        return aMoodOrder - bMoodOrder;
      case 'by-topic':
        return a.tags.length - b.tags.length;
      default:
        return 0;
    }
  });

  /**
   * Get mood configuration for entry
   */
  const getMoodConfig = (mood?: string) => {
    return MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG] || MOOD_CONFIG.neutral;
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Extract preview text from content
   */
  const getPreviewText = (content: string, maxLength: number = 150): string => {
    const plainText = content.replace(/[#*`]/g, '').trim();
    if (plainText.length <= maxLength) return plainText;
    
    const lastSentence = plainText.lastIndexOf('.', maxLength);
    const cutoff = lastSentence > maxLength * 0.7 ? lastSentence + 1 : maxLength;
    
    return plainText.substring(0, cutoff).trim() + '...';
  };

  return (
    <div className={`journal-display ${className}`}>
      {/* Header with overall mood and stats */}
      <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-handwritten text-orange-900 dark:text-orange-100 mb-1">
              📓 Journal Entries
            </h2>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {data.entries.length} entries • {data.topics.length} topics discussed
            </p>
          </div>
          
          {data.mood && data.mood !== 'neutral' && (
            <div className="text-right">
              <div className="flex items-center gap-2 text-lg font-medium">
                <span>{MOOD_CONFIG[data.mood].emoji}</span>
                <span className={`capitalize ${MOOD_CONFIG[data.mood].textColor}`}>
                  {data.mood}
                </span>
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                Overall mood
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Topics overview */}
      {data.topics.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h3 className="font-handwritten text-lg text-gray-900 dark:text-gray-100 mb-2">
            🏷️ Topics Discussed
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.topics.map((topic, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
              >
                #{topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Key insights */}
      {data.insights.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-handwritten text-lg text-blue-900 dark:text-blue-100 mb-3">
            💡 Key Insights
          </h3>
          <ul className="space-y-2">
            {data.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-blue-700 dark:text-blue-300">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Journal entries */}
      <div className="space-y-4">
        {sortedEntries.map((entry, index) => {
          const isExpanded = expandedEntries.has(index);
          const moodConfig = getMoodConfig(entry.mood);
          
          return (
            <Card 
              key={index} 
              className={`border transition-all duration-200 hover:shadow-md ${moodConfig.color}`}
            >
              <CardHeader 
                className={`pb-3 ${interactive ? 'cursor-pointer' : ''}`}
                onClick={() => interactive && handleEntryToggle(index)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{moodConfig.emoji}</span>
                    <div>
                      <div className="font-handwritten text-gray-900 dark:text-gray-100">
                        {entry.title || `Entry ${index + 1}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-content">
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {entry.mood && (
                      <Badge variant="outline" className={`${moodConfig.textColor} border-current`}>
                        {entry.mood}
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

              <CardContent className="pt-0">
                {/* Preview or full content */}
                <div className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                  {isExpanded || !interactive ? (
                    <div className="whitespace-pre-wrap">{entry.content}</div>
                  ) : (
                    <div>{getPreviewText(entry.content)}</div>
                  )}
                </div>

                {/* Tags */}
                {entry.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.slice(0, isExpanded ? entry.tags.length : 3).map((tag, tagIndex) => (
                        <Badge 
                          key={tagIndex} 
                          variant="outline"
                          className="text-xs bg-white dark:bg-gray-800"
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </Badge>
                      ))}
                      {!isExpanded && entry.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800">
                          +{entry.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Show more content when expanded */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Additional insights or quotes could be shown here */}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Word count:</strong> {entry.content.split(' ').length} words
                    </div>
                  </div>
                )}

                {/* Click to expand hint */}
                {!isExpanded && interactive && (
                  <div className="text-center mt-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEntryToggle(index);
                      }}
                      className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      Click to expand full entry
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer with writing tips */}
      <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-1">
          ✍️ <strong>Journaling Tips:</strong>
        </p>
        <ul className="space-y-1 text-xs ml-4">
          <li>• Include timestamps to track your thoughts over time</li>
          <li>• Write freely - insights and patterns will emerge naturally</li>
          <li>• Use quotes to capture important conversations or ideas</li>
          <li>• Review entries to identify recurring themes and growth</li>
        </ul>
      </div>
    </div>
  );
}
