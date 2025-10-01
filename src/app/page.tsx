'use client'

import { useState, useCallback } from "react";
import { MainLayout } from "@/components/layout";
import { InputPane, OutputPane, FormatSelector } from "@/components/formatter";
import { MeetingNotesFormatter } from "@/lib/formatting";
import type { FormatType } from "@/types";
import type { FormattedOutput } from "@/types/formatting";

export default function Home() {
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('meeting-notes');
  const [inputText, setInputText] = useState<string>('');
  const [formattedOutput, setFormattedOutput] = useState<FormattedOutput | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

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

        {/* Format Selection with Auto-Detection */}
        <FormatSelector
          selectedFormat={selectedFormat}
          onFormatChange={handleFormatChange}
          inputText={inputText}
          autoDetect={true}
          className="mb-8"
        />

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
