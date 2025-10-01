'use client'

import { useState, useCallback } from "react";
import { MainLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InputPane, OutputPane } from "@/components/formatter";
import { MeetingNotesFormatter } from "@/lib/formatting";
import type { FormatType } from "@/types";
import type { FormattedOutput } from "@/types/formatting";
import { 
  Users, 
  CheckSquare, 
  BookOpen, 
  ShoppingCart, 
  Search, 
  GraduationCap 
} from 'lucide-react';

const formatOptions = [
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Extract attendees, agenda items, and action items',
    icon: Users,
    color: 'bg-blue-500',
    examples: ['Attendees', 'Agenda Items', 'Action Items', 'Decisions']
  },
  {
    id: 'task-lists',
    name: 'Task Lists',
    description: 'Convert to organized todos with priorities',
    icon: CheckSquare,
    color: 'bg-green-500', 
    examples: ['Todo Items', 'Priorities', 'Due Dates', 'Categories']
  },
  {
    id: 'journal-notes',
    name: 'Journal & Notes',
    description: 'Structure paragraphs and highlight insights',
    icon: BookOpen,
    color: 'bg-purple-500',
    examples: ['Paragraphs', 'Timestamps', 'Insights', 'Quotes']
  },
  {
    id: 'shopping-lists',
    name: 'Shopping Lists',
    description: 'Organize by categories and remove duplicates',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    examples: ['Categories', 'Quantities', 'Store Layout', 'Checkboxes']
  },
  {
    id: 'research-notes',
    name: 'Research Notes',
    description: 'Structure citations and references',
    icon: Search,
    color: 'bg-indigo-500',
    examples: ['Citations', 'Sources', 'Topics', 'References']
  },
  {
    id: 'study-notes',
    name: 'Study Notes',
    description: 'Convert to outlines and Q&A sections',
    icon: GraduationCap,
    color: 'bg-pink-500',
    examples: ['Outlines', 'Definitions', 'Q&A', 'Summaries']
  }
];

export default function Home() {
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('meeting-notes');
  const [inputText, setInputText] = useState<string>('');
  const [formattedOutput, setFormattedOutput] = useState<FormattedOutput | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const selectedFormatDetails = formatOptions.find(f => f.id === selectedFormat);

  /**
   * Handle text formatting
   */
  const handleFormat = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    try {
      // Currently only Meeting Notes formatter is implemented
      if (selectedFormat === 'meeting-notes') {
        const result = await MeetingNotesFormatter.format({
          content: inputText,
          metadata: {
            source: 'type',
            timestamp: new Date(),
            size: inputText.length,
          },
        });
        setFormattedOutput(result);
      } else {
        // Placeholder for other formats
        setFormattedOutput({
          format: selectedFormat,
          content: `${selectedFormat.toUpperCase()} FORMATTING\n\n${inputText}\n\n(Formatter not yet implemented)`,
          metadata: {
            processedAt: new Date(),
            duration: 0,
            confidence: 0,
            itemCount: 0,
            stats: {
              linesProcessed: inputText.split('\n').length,
              patternsMatched: 0,
              itemsExtracted: 0,
              duplicatesRemoved: 0,
              changesApplied: 0,
            },
          },
          data: {
            common: {
              dates: [],
              urls: [],
              emails: [],
              phoneNumbers: [],
              mentions: [],
              hashtags: [],
            },
            formatSpecific: {} as any,
          },
        });
      }
    } catch (error) {
      console.error('Formatting error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, selectedFormat]);

  /**
   * Handle format type change
   */
  const handleFormatChange = (formatId: string) => {
    setSelectedFormat(formatId as FormatType);
    setFormattedOutput(undefined); // Clear output when format changes
  };

  /**
   * Handle export
   */
  const handleExport = () => {
    if (!formattedOutput) return;
    
    const blob = new Blob([formattedOutput.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted-${selectedFormat}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout showSidebar={false}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-handwritten font-bold text-gray-900 mb-4">
            Text Formatter
          </h1>
          <p className="text-lg font-content text-gray-600 max-w-2xl mx-auto">
            Transform messy text into organized, readable formats with intelligent pattern recognition
          </p>
        </div>

        {/* Format Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-handwritten font-semibold text-gray-900 mb-4">
            Choose Format Type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              const isSelected = selectedFormat === format.id;
              
              return (
                <Card
                  key={format.id}
                  className={`
                    cursor-pointer transition-all duration-200 hover:shadow-md
                    ${isSelected 
                      ? 'ring-2 ring-orange-400 border-orange-300 bg-orange-50' 
                      : 'hover:border-orange-200'
                    }
                  `}
                  onClick={() => handleFormatChange(format.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`
                        w-10 h-10 rounded-lg ${format.color} 
                        flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'shadow-lg' : 'shadow-md'}
                      `}>
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
                        <div className="flex flex-wrap gap-1">
                          {format.examples.map((example, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 text-xs font-content bg-gray-100 text-gray-600 rounded-md"
                            >
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Dual-Pane Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Pane */}
          <InputPane
            value={inputText}
            onChange={setInputText}
            onFormat={handleFormat}
            isProcessing={isProcessing}
          />

          {/* Output Pane */}
          <OutputPane
            formatType={selectedFormat}
            formattedOutput={formattedOutput}
            originalText={inputText}
            isProcessing={isProcessing}
            showComparison={showComparison}
            onToggleComparison={() => setShowComparison(!showComparison)}
            onExport={handleExport}
          />
        </div>
      </div>
    </MainLayout>
  )
}
