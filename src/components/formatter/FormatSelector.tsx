/**
 * FormatSelector Component - Enhanced format selection with auto-detection
 * 
 * Features:
 * - Visual format selection grid
 * - Automatic format detection with confidence indicators
 * - Manual override functionality
 * - Format preview cards
 * - Smooth transitions between modes
 * - Integration with pattern recognition
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CheckSquare, 
  BookOpen, 
  ShoppingCart, 
  Search, 
  GraduationCap,
  Sparkles,
  Target,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormatType } from '@/types';
import { FormatDetector } from '@/lib/detection';
import type { FormatDetectionResult } from '@/lib/detection';

export interface FormatOption {
  id: FormatType;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  examples: string[];
}

export interface FormatSelectorProps {
  selectedFormat: FormatType;
  onFormatChange: (format: FormatType) => void;
  inputText?: string;
  autoDetect?: boolean;
  className?: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Organize meetings with sections and lists',
    icon: Users,
    color: 'bg-blue-500',
    examples: ['Agenda', 'Action Items', 'Decisions']
  },
  {
    id: 'task-lists',
    name: 'Task Lists',
    description: 'Format todos with priorities and structure',
    icon: CheckSquare,
    color: 'bg-green-500', 
    examples: ['Todo Items', 'Priorities', 'Categories']
  },
  {
    id: 'journal-notes',
    name: 'Journal & Notes',
    description: 'Structure paragraphs and add headers',
    icon: BookOpen,
    color: 'bg-purple-500',
    examples: ['Paragraphs', 'Timestamps', 'Sections']
  },
  {
    id: 'shopping-lists',
    name: 'Shopping Lists',
    description: 'Organize by categories with clean lists',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    examples: ['Categories', 'Quantities', 'Checkboxes']
  },
  {
    id: 'research-notes',
    name: 'Research Notes',
    description: 'Structure citations and references',
    icon: Search,
    color: 'bg-indigo-500',
    examples: ['Citations', 'Sources', 'References']
  },
  {
    id: 'study-notes',
    name: 'Study Notes',
    description: 'Convert to outlines and Q&A format',
    icon: GraduationCap,
    color: 'bg-pink-500',
    examples: ['Outlines', 'Definitions', 'Q&A']
  }
];

export function FormatSelector({
  selectedFormat,
  onFormatChange,
  inputText = '',
  autoDetect = true,
  className,
}: FormatSelectorProps) {
  const [detectionResult, setDetectionResult] = useState<FormatDetectionResult | null>(null);
  const [showAutoDetect, setShowAutoDetect] = useState(false);

  /**
   * Auto-detect format when text changes
   */
  useEffect(() => {
    if (!autoDetect || !inputText || inputText.trim().length < 20) {
      setDetectionResult(null);
      setShowAutoDetect(false);
      return;
    }

    // Debounce detection
    const timer = setTimeout(() => {
      const result = FormatDetector.detectFormat(inputText);
      setDetectionResult(result);
      
      // Show auto-detect suggestion if confidence is high and different from current
      if (result.confidence > 0.5 && result.suggestedFormat !== selectedFormat) {
        setShowAutoDetect(true);
      } else {
        setShowAutoDetect(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputText, autoDetect, selectedFormat]);

  /**
   * Apply auto-detected format
   */
  const handleApplyAutoDetect = () => {
    if (detectionResult) {
      onFormatChange(detectionResult.suggestedFormat);
      setShowAutoDetect(false);
    }
  };

  /**
   * Get confidence color
   */
  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.7) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence > 0.5) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (confidence > 0.3) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-handwritten font-semibold text-gray-900">
          Choose Format Type
        </h2>
        
        {/* Auto-detect indicator */}
        {detectionResult && detectionResult.confidence > 0.3 && (
          <Badge variant="outline" className={cn(
            'gap-1.5',
            getConfidenceColor(detectionResult.confidence)
          )}>
            <Target className="w-3 h-3" />
            Auto-detected: {FORMAT_OPTIONS.find(f => f.id === detectionResult.suggestedFormat)?.name}
            ({Math.round(detectionResult.confidence * 100)}%)
          </Badge>
        )}
      </div>

      {/* Auto-detect suggestion banner */}
      {showAutoDetect && detectionResult && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Smart Detection Suggestion
                  </p>
                  <p className="text-sm text-blue-700">
                    {detectionResult.reasoning}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAutoDetect(false)}
                  className="border-blue-300"
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyAutoDetect}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Format grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FORMAT_OPTIONS.map((format) => {
          const Icon = format.icon;
          const isSelected = selectedFormat === format.id;
          const detectionScore = detectionResult?.scores[format.id] || 0;
          const showScore = detectionResult && detectionScore > 0.2;

          return (
            <Card
              key={format.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md relative',
                isSelected 
                  ? 'ring-2 ring-orange-400 border-orange-300 bg-orange-50' 
                  : 'hover:border-orange-200'
              )}
              onClick={() => onFormatChange(format.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-lg',
                    format.color,
                    'flex items-center justify-center flex-shrink-0',
                    isSelected ? 'shadow-lg' : 'shadow-md'
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-handwritten font-medium text-gray-900 text-sm">
                        {format.name}
                      </h3>
                      {isSelected && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs font-content text-gray-600 mb-3 leading-relaxed">
                      {format.description}
                    </p>

                    {/* Examples */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {format.examples.map((example, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs font-content bg-gray-100 text-gray-600 rounded-md"
                        >
                          {example}
                        </span>
                      ))}
                    </div>

                    {/* Detection score */}
                    {showScore && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                'h-full rounded-full transition-all',
                                detectionScore > 0.7 ? 'bg-green-500' :
                                detectionScore > 0.5 ? 'bg-blue-500' :
                                detectionScore > 0.3 ? 'bg-yellow-500' :
                                'bg-gray-400'
                              )}
                              style={{ width: `${detectionScore * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            {Math.round(detectionScore * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
