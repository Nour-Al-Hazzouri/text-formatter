'use client';

/**
 * Study Display Component - Interactive study materials with outlines and Q&A
 * 
 * Features:
 * - Interactive outline with collapsible sections
 * - Q&A quiz mode with difficulty indicators
 * - Definition flashcard system
 * - Topic importance visualization
 * - Study progress tracking
 * - Modern orange theme styling
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { StudyNotesData, OutlineSection, QAPair, Definition, StudyTopic } from '@/types/formatting';

interface StudyDisplayProps {
  /** Study data from formatter */
  data: StudyNotesData;
  
  /** Display mode for study materials */
  displayMode?: 'outline' | 'flashcards' | 'quiz' | 'topics';
  
  /** Whether sections are interactive */
  interactive?: boolean;
  
  /** Callback when study item is completed */
  onItemComplete?: (itemId: string, type: 'definition' | 'question' | 'section') => void;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Difficulty level colors and indicators
 */
const DIFFICULTY_CONFIG = {
  easy: { 
    emoji: '🟢', 
    color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    label: 'Easy'
  },
  medium: { 
    emoji: '🟡', 
    color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    label: 'Medium'
  },
  hard: { 
    emoji: '🔴', 
    color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    label: 'Hard'
  }
};

/**
 * Importance level indicators
 */
const IMPORTANCE_CONFIG = {
  high: { emoji: '🔥', color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' },
  medium: { emoji: '📌', color: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' },
  low: { emoji: '📝', color: 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300' }
};

/**
 * Question type icons
 */
const QUESTION_TYPE_ICONS = {
  definition: '📖',
  explanation: '💡',
  example: '📝',
  analysis: '🔍',
  comparison: '⚖️'
};

export function StudyDisplay({
  data,
  displayMode = 'outline',
  interactive = true,
  onItemComplete,
  className = ''
}: StudyDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState<Set<string>>(new Set());
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);

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
   * Handle item completion
   */
  const handleItemComplete = useCallback((itemId: string, type: 'definition' | 'question' | 'section') => {
    setCompletedItems(prev => new Set([...prev, itemId]));
    onItemComplete?.(itemId, type);
  }, [onItemComplete]);

  /**
   * Handle answer reveal
   */
  const handleAnswerReveal = useCallback((questionId: string) => {
    setShowAnswers(prev => new Set([...prev, questionId]));
  }, []);

  /**
   * Render outline section recursively
   */
  const renderOutlineSection = (section: OutlineSection, depth: number = 0) => {
    const isExpanded = expandedSections.has(section.id);
    const isCompleted = completedItems.has(section.id);
    const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 12)}` : '';

    return (
      <div key={section.id} className={`${indentClass} mb-2`}>
        <Card className={`border-orange-200 dark:border-orange-800 ${isCompleted ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
          <CardHeader 
            className={`pb-2 ${interactive ? 'cursor-pointer' : ''}`}
            onClick={() => interactive && handleSectionToggle(section.id)}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-orange-600 dark:text-orange-400">
                  {'  '.repeat(depth)}#{'.'.repeat(section.level)}
                </span>
                <span className={`${isCompleted ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                  {section.title}
                </span>
                {isCompleted && <span className="text-green-500">✓</span>}
              </div>
              
              <div className="flex items-center gap-2">
                {section.subsections.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {section.subsections.length} subsections
                  </Badge>
                )}
                
                {interactive && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemComplete(section.id, 'section');
                      }}
                      className="text-xs"
                    >
                      {isCompleted ? 'Completed' : 'Mark Complete'}
                    </Button>
                    <span className="text-gray-400 text-sm">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          {(isExpanded || !interactive) && (
            <CardContent className="pt-0">
              {section.content && (
                <div className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                  {section.content}
                </div>
              )}
              
              {section.subsections.length > 0 && (
                <div className="space-y-2">
                  {section.subsections.map(subsection => 
                    renderOutlineSection(subsection, depth + 1)
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className={`study-display ${className}`}>
      {/* Header with stats and mode selector */}
      <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-handwritten text-orange-900 dark:text-orange-100 mb-1">
              📚 Study Materials
            </h2>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {data.outline.length} sections • {data.definitions.length} definitions • {data.qaPairs.length} questions • {data.topics.length} topics
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {(['outline', 'flashcards', 'quiz', 'topics'] as const).map(mode => (
              <Button
                key={mode}
                variant={displayMode === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => {/* Toggle display mode */}}
                className="bg-orange-500 hover:bg-orange-600 capitalize"
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="w-full bg-orange-200 dark:bg-orange-900 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ 
              width: `${Math.round((completedItems.size / (data.outline.length + data.definitions.length + data.qaPairs.length)) * 100)}%`
            }}
          />
        </div>
        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
          {completedItems.size} of {data.outline.length + data.definitions.length + data.qaPairs.length} items completed
        </div>
      </div>

      {/* Content based on display mode */}
      {displayMode === 'outline' && (
        <div className="space-y-4">
          <h3 className="font-handwritten text-lg text-gray-900 dark:text-gray-100">
            📋 Study Outline
          </h3>
          <div className="space-y-2">
            {data.outline.map(section => renderOutlineSection(section))}
          </div>
        </div>
      )}

      {displayMode === 'flashcards' && data.definitions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-handwritten text-lg text-gray-900 dark:text-gray-100">
              🃏 Definition Flashcards
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentFlashcardIndex + 1} of {data.definitions.length}
            </div>
          </div>
          
          {data.definitions[currentFlashcardIndex] && (
            <Card className="border-blue-200 dark:border-blue-800 min-h-[200px]">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <h4 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {showDefinition ? 'Definition' : 'Term'}
                  </h4>
                  <div className="text-lg text-gray-800 dark:text-gray-200">
                    {showDefinition 
                      ? data.definitions[currentFlashcardIndex].definition
                      : data.definitions[currentFlashcardIndex].term
                    }
                  </div>
                </div>
                
                {showDefinition && data.definitions[currentFlashcardIndex].example && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Example:</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {data.definitions[currentFlashcardIndex].example}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex gap-3 justify-center">
                  <Button
                    onClick={() => setShowDefinition(!showDefinition)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {showDefinition ? 'Show Term' : 'Show Definition'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentFlashcardIndex((prev) => 
                        prev > 0 ? prev - 1 : data.definitions.length - 1
                      );
                      setShowDefinition(false);
                    }}
                  >
                    Previous
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentFlashcardIndex((prev) => 
                        prev < data.definitions.length - 1 ? prev + 1 : 0
                      );
                      setShowDefinition(false);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {displayMode === 'quiz' && data.qaPairs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-handwritten text-lg text-gray-900 dark:text-gray-100">
              ❓ Study Quiz
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {data.qaPairs.length}
            </div>
          </div>

          {data.qaPairs.map((qa, index) => {
            if (index !== currentQuestionIndex) return null;
            
            const questionId = `question-${index}`;
            const isAnswerVisible = showAnswers.has(questionId);
            const difficulty = qa.difficulty || 'medium';
            const difficultyConfig = DIFFICULTY_CONFIG[difficulty];

            return (
              <Card key={questionId} className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{QUESTION_TYPE_ICONS[qa.type]}</span>
                      <div>
                        <div className="text-purple-900 dark:text-purple-100">
                          Q{index + 1}: {qa.question}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge className={difficultyConfig.color}>
                            {difficultyConfig.emoji} {difficultyConfig.label}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {qa.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {!isAnswerVisible ? (
                    <div className="text-center py-6">
                      <Button
                        onClick={() => handleAnswerReveal(questionId)}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        Show Answer
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <div className="font-medium text-purple-700 dark:text-purple-300 mb-2">Answer:</div>
                        <div className="text-purple-600 dark:text-purple-400">{qa.answer}</div>
                      </div>
                      
                      {qa.topics.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Related topics:</div>
                          <div className="flex flex-wrap gap-1">
                            {qa.topics.map(topic => (
                              <Badge key={topic} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCurrentQuestionIndex(prev => 
                              prev > 0 ? prev - 1 : data.qaPairs.length - 1
                            );
                          }}
                        >
                          Previous
                        </Button>
                        
                        <Button
                          onClick={() => {
                            handleItemComplete(questionId, 'question');
                            setCurrentQuestionIndex(prev => 
                              prev < data.qaPairs.length - 1 ? prev + 1 : 0
                            );
                          }}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Got It!
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCurrentQuestionIndex(prev => 
                              prev < data.qaPairs.length - 1 ? prev + 1 : 0
                            );
                          }}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {displayMode === 'topics' && (
        <div className="space-y-4">
          <h3 className="font-handwritten text-lg text-gray-900 dark:text-gray-100">
            🎯 Study Topics by Priority
          </h3>
          
          {(['high', 'medium', 'low'] as const).map(importance => {
            const topicsOfImportance = data.topics.filter(t => t.importance === importance);
            if (topicsOfImportance.length === 0) return null;
            
            const config = IMPORTANCE_CONFIG[importance];
            
            return (
              <Card key={importance} className={`border-2 ${config.color.includes('red') ? 'border-red-200' : config.color.includes('orange') ? 'border-orange-200' : 'border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{config.emoji}</span>
                    <span className="capitalize">{importance} Priority Topics</span>
                    <Badge variant="outline">{topicsOfImportance.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {topicsOfImportance.map((topic, index) => (
                      <div key={index} className={`p-3 rounded-lg ${config.color}`}>
                        <div className="font-medium">{topic.name}</div>
                        <div className="text-sm mt-1">
                          {topic.sectionIds.length} sections • {topic.definitionIds.length} definitions
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Study tips footer */}
      <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-1">
          🎓 <strong>Study Tips:</strong>
        </p>
        <ul className="space-y-1 text-xs ml-4">
          <li>• Use the outline to understand the structure before diving into details</li>
          <li>• Practice with flashcards to memorize key definitions</li>
          <li>• Test yourself with the quiz mode to check understanding</li>
          <li>• Focus on high-priority topics first, then work down</li>
        </ul>
      </div>
    </div>
  );
}
