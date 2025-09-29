'use client'

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  const [selectedFormat, setSelectedFormat] = useState<string>('meeting-notes');
  const [inputText, setInputText] = useState<string>('');

  const selectedFormatDetails = formatOptions.find(f => f.id === selectedFormat);

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
                  onClick={() => setSelectedFormat(format.id)}
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
          <Card className="border-orange-200/50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-b border-orange-200/30">
              <CardTitle className="font-handwritten text-xl text-gray-900">
                Input Text
              </CardTitle>
              <CardDescription className="font-content">
                Paste or type your unformatted text here
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your text here to format it..."
                className="min-h-[400px] resize-none font-content"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500 font-content">
                  {inputText.length} characters
                </span>
                <Button size="sm" variant="outline" onClick={() => setInputText('')}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Pane */}
          <Card className="border-orange-200/50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-b border-orange-200/30">
              <CardTitle className="font-handwritten text-xl text-gray-900 flex items-center gap-2">
                Formatted Output
                {selectedFormatDetails && (
                  <div className={`
                    w-6 h-6 rounded ${selectedFormatDetails.color} 
                    flex items-center justify-center
                  `}>
                    <selectedFormatDetails.icon className="w-3 h-3 text-white" />
                  </div>
                )}
              </CardTitle>
              <CardDescription className="font-content">
                {selectedFormatDetails?.name} formatting applied
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="min-h-[400px] p-4 bg-white rounded-lg border border-gray-200">
                {inputText ? (
                  <div className="text-gray-900 font-content">
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600 font-semibold mb-1">
                        Preview: {selectedFormatDetails?.name}
                      </p>
                      <p className="text-xs text-blue-500">
                        Real formatting engine will be implemented in upcoming tasks
                      </p>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {inputText}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500 font-content">
                      <div className="mb-2">
                        {selectedFormatDetails && (
                          <div className={`
                            w-12 h-12 rounded-lg ${selectedFormatDetails.color} 
                            flex items-center justify-center mx-auto mb-3 opacity-50
                          `}>
                            <selectedFormatDetails.icon className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <p>Enter text to see {selectedFormatDetails?.name.toLowerCase()} formatting</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500 font-content">
                  {inputText ? 'Formatted' : 'Ready to format'}
                </span>
                <Button size="sm" disabled={!inputText}>
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
