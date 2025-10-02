/**
 * OutputPane Component - Formatted text display with comparison view
 * 
 * Features:
 * - Formatted text display with markdown support
 * - Copy and export functionality
 * - Side-by-side comparison view
 * - Processing status indicators
 * - Format-specific rendering
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Check, 
  Download, 
  Eye, 
  EyeOff,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormatType } from '@/types';
import type { FormattedOutput } from '@/types/formatting';
import { 
  ProcessingIndicator, 
  ConfidenceBadge, 
  AnalysisBreakdown,
  PerformanceMetrics
} from '@/components/feedback';
import { ExportOptions } from './ExportOptions';

export interface OutputPaneProps {
  formatType: FormatType;
  formattedOutput?: FormattedOutput;
  originalText: string;
  isProcessing?: boolean;
  showComparison?: boolean;
  onToggleComparison?: () => void;
  onExport?: () => void;
  showMetrics?: boolean;
  className?: string;
}

const FORMAT_ICONS: Record<FormatType, { icon: React.ReactNode; color: string }> = {
  'meeting-notes': { icon: '📋', color: 'bg-blue-500' },
  'task-lists': { icon: '✅', color: 'bg-green-500' },
  'journal-notes': { icon: '📝', color: 'bg-purple-500' },
  'shopping-lists': { icon: '🛒', color: 'bg-orange-500' },
  'research-notes': { icon: '🔍', color: 'bg-indigo-500' },
  'study-notes': { icon: '🎓', color: 'bg-pink-500' },
};

export function OutputPane({
  formatType,
  formattedOutput,
  originalText,
  isProcessing = false,
  showComparison = false,
  onToggleComparison,
  onExport,
  showMetrics = true,
  className,
}: OutputPaneProps) {
  const [isCopied, setIsCopied] = useState(false);
  const formatInfo = FORMAT_ICONS[formatType];

  /**
   * Copy formatted text to clipboard
   */
  const handleCopy = async () => {
    const textToCopy = formattedOutput?.content || originalText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  /**
   * Render formatted content
   */
  const renderFormattedContent = () => {
    if (isProcessing) {
      return (
        <div className="h-full min-h-[400px]">
          <ProcessingIndicator
            isProcessing={true}
            formatType={formatType}
            size="md"
          />
        </div>
      );
    }

    if (!originalText) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center text-gray-500 font-content">
            <div className="mb-4">
              <div className={cn(
                'w-16 h-16 rounded-xl',
                formatInfo.color,
                'flex items-center justify-center mx-auto opacity-50'
              )}>
                <span className="text-3xl">{formatInfo.icon}</span>
              </div>
            </div>
            <p className="text-lg">Enter text to see formatted output</p>
            <p className="text-sm text-gray-400 mt-2">
              Your formatted {formatType.replace('-', ' ')} will appear here
            </p>
          </div>
        </div>
      );
    }

    if (formattedOutput) {
      return (
        <div className="space-y-4">
          {/* Metadata Badges */}
          {formattedOutput.metadata && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                <Check className="w-3 h-3 mr-1" />
                Formatted
              </Badge>
              <ConfidenceBadge confidence={formattedOutput.metadata.confidence} />
              <Badge variant="outline">
                <TrendingUp className="w-3 h-3 mr-1" />
                {formattedOutput.metadata.itemCount} items
              </Badge>
              <Badge variant="outline">
                {formattedOutput.metadata.duration.toFixed(0)}ms
              </Badge>
            </div>
          )}

          {/* Formatted Content */}
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-content text-gray-900 bg-transparent border-none p-0">
              {formattedOutput.content}
            </pre>
          </div>

          {/* Warnings */}
          {formattedOutput.warnings && formattedOutput.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800 mb-1">Warnings:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {formattedOutput.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Analysis and Performance Metrics */}
          {showMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <AnalysisBreakdown output={formattedOutput} />
              <PerformanceMetrics
                duration={formattedOutput.metadata.duration}
                itemCount={formattedOutput.metadata.itemCount}
                linesProcessed={formattedOutput.metadata.stats.linesProcessed}
                showDetails={true}
              />
            </div>
          )}
        </div>
      );
    }

    // Preview mode (no formatted output yet)
    return (
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-semibold mb-1 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview Mode
          </p>
          <p className="text-xs text-blue-600">
            Click "Format" to process with {formatType.replace('-', ' ')} formatting
          </p>
        </div>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-content text-gray-700">
          {originalText}
        </pre>
      </div>
    );
  };

  return (
    <Card className={cn('border-orange-200/50 shadow-lg', className)}>
      <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-b border-orange-200/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-handwritten text-xl text-gray-900 flex items-center gap-2">
              Formatted Output
              <div className={cn(
                'w-6 h-6 rounded flex items-center justify-center text-sm',
                formatInfo.color
              )}>
                {formatInfo.icon}
              </div>
            </CardTitle>
            <CardDescription className="font-content">
              {formatType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} formatting
            </CardDescription>
          </div>

          {/* Comparison toggle */}
          {onToggleComparison && originalText && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleComparison}
              className="gap-2"
            >
              {showComparison ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide Compare
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Compare
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Main content area */}
        <div className={cn(
          'min-h-[400px] p-4 bg-white rounded-lg border border-gray-200',
          showComparison && 'grid grid-cols-2 gap-4 p-0 border-0'
        )}>
          {showComparison ? (
            <>
              {/* Original */}
              <div className="p-4 border-r border-gray-200">
                <h4 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  Original
                </h4>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-content text-gray-700">
                  {originalText}
                </pre>
              </div>
              {/* Formatted */}
              <div className="p-4">
                <h4 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  Formatted
                </h4>
                {formattedOutput ? (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-content text-gray-900">
                    {formattedOutput.content}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-500 italic">No formatted output yet</p>
                )}
              </div>
            </>
          ) : (
            renderFormattedContent()
          )}
        </div>

        {/* Actions Bar */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500 font-content">
            {formattedOutput ? 'Formatted successfully' : isProcessing ? 'Processing...' : originalText ? 'Ready to format' : 'Waiting for input'}
          </span>

          <div className="flex items-center gap-2">
            {(formattedOutput || originalText) && !isProcessing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={onExport}
                  disabled={!formattedOutput}
                  className="gap-2 bg-orange-500 hover:bg-orange-600"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Export Options */}
        {formattedOutput && (
          <div className="mt-4">
            <ExportOptions 
              content={formattedOutput}
              isOpen={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
