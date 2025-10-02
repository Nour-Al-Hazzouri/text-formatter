'use client';

/**
 * Export Options Component
 * 
 * Provides comprehensive export and sharing options for formatted content
 */

import { useState } from 'react';
import { 
  Download, 
  Copy, 
  Printer, 
  Check,
  FileText,
  Code,
  Globe,
  Database,
  Loader2,
  Share2
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import type { FormattedOutput } from '../../types/formatting';
import type { ExportFormat } from '../../types/index';
import { fileExporter } from '../../lib/export/FileExporter';
import { clipboardManager } from '../../lib/export/ClipboardManager';
import { printManager } from '../../lib/export/PrintManager';

/**
 * Export options component props
 */
export interface ExportOptionsProps {
  /** Formatted content to export */
  content: FormattedOutput | null;
  
  /** Whether export options are visible */
  isOpen?: boolean;
  
  /** Callback when export completes */
  onExportComplete?: (format: ExportFormat) => void;
  
  /** Callback when copy completes */
  onCopyComplete?: () => void;
}

/**
 * Available export formats with metadata
 */
const EXPORT_FORMATS: Array<{
  id: ExportFormat;
  name: string;
  description: string;
  icon: typeof FileText;
  implemented: boolean;
}> = [
  {
    id: 'plain-text',
    name: 'Plain Text',
    description: 'Simple .txt file',
    icon: FileText,
    implemented: true
  },
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'GitHub-flavored .md',
    icon: FileText,
    implemented: true
  },
  {
    id: 'html',
    name: 'HTML',
    description: 'Styled web page',
    icon: Globe,
    implemented: true
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'Structured data',
    icon: Database,
    implemented: true
  }
];

/**
 * Export Options Component
 */
export function ExportOptions({
  content,
  isOpen = true,
  onExportComplete,
  onCopyComplete
}: ExportOptionsProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [copying, setCopying] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  
  // Handle export to file
  const handleExport = async (format: ExportFormat) => {
    if (!content) return;
    
    setExporting(format);
    setExportMessage('');
    
    try {
      const response = await fileExporter.export(content, format, {
        includeMetadata: true,
        preserveFormatting: true,
        includeConfidence: true,
        includeStats: false
      });
      
      if (response.success && response.file) {
        // Trigger download
        const link = document.createElement('a');
        link.href = response.file.downloadUrl || '';
        link.download = response.file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        if (response.file?.downloadUrl) {
          setTimeout(() => {
            if (response.file?.downloadUrl) {
              URL.revokeObjectURL(response.file.downloadUrl);
            }
          }, 100);
        }
        
        setExportMessage(`✓ Downloaded as ${response.file.name}`);
        onExportComplete?.(format);
      } else {
        setExportMessage(`✗ Export failed: ${response.error?.message}`);
      }
    } catch (error) {
      setExportMessage(`✗ Export error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(null);
      setTimeout(() => setExportMessage(''), 5000);
    }
  };
  
  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!content) return;
    
    setCopying(true);
    setCopied(false);
    
    try {
      const result = await clipboardManager.copyToClipboard(content, true);
      
      if (result.success) {
        setCopied(true);
        onCopyComplete?.();
        setTimeout(() => setCopied(false), 3000);
      } else {
        setExportMessage(`✗ Copy failed: ${result.message}`);
        setTimeout(() => setExportMessage(''), 5000);
      }
    } catch (error) {
      setExportMessage(`✗ Copy error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setExportMessage(''), 5000);
    } finally {
      setCopying(false);
    }
  };
  
  // Handle print
  const handlePrint = async () => {
    if (!content) return;
    
    setPrinting(true);
    
    try {
      await printManager.print(content, {
        includeMetadata: true,
        includeStats: false
      });
    } catch (error) {
      setExportMessage(`✗ Print error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setExportMessage(''), 5000);
    } finally {
      setPrinting(false);
    }
  };
  
  if (!isOpen || !content) return null;
  
  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="text-lg font-handwritten flex items-center gap-2">
          <Share2 className="h-5 w-5 text-orange-600" />
          Export & Share
        </CardTitle>
        <CardDescription>
          Download, copy, or print your formatted content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            disabled={copying || !content}
            className="flex-1 min-w-[120px]"
          >
            {copying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : copied ? (
              <Check className="h-4 w-4 mr-2 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            disabled={printing || !content}
            className="flex-1 min-w-[120px]"
          >
            {printing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            Print
          </Button>
        </div>
        
        {/* Export Formats */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-orange-900">
            Download As:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {EXPORT_FORMATS.map((format) => {
              const Icon = format.icon;
              const isExporting = exporting === format.id;
              
              return (
                <Button
                  key={format.id}
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport(format.id)}
                  disabled={!format.implemented || isExporting || !content}
                  className="justify-start h-auto py-2 px-3"
                >
                  <div className="flex items-start gap-2 text-left w-full">
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mt-0.5 animate-spin flex-shrink-0" />
                    ) : (
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{format.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {format.description}
                      </div>
                    </div>
                    {!format.implemented && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        Soon
                      </Badge>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Status Message */}
        {exportMessage && (
          <div className={`text-sm p-2 rounded ${
            exportMessage.startsWith('✓')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {exportMessage}
          </div>
        )}
        
        {/* Format Info */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>
            <strong>Tip:</strong> HTML and Markdown exports preserve formatting.
            Plain text and JSON are best for data processing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
