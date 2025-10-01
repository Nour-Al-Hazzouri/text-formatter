/**
 * InputPane Component - Text input interface with paste, type, and upload
 * 
 * Features:
 * - Multi-source input (paste, type, file upload)
 * - Real-time character and word counting
 * - Text statistics display
 * - Clear and format actions
 * - Responsive design
 */

'use client';

import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TextStatistics {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
}

export interface InputPaneProps {
  value: string;
  onChange: (value: string) => void;
  onFormat?: () => void;
  isProcessing?: boolean;
  placeholder?: string;
  className?: string;
}

export function InputPane({
  value,
  onChange,
  onFormat,
  isProcessing = false,
  placeholder = 'Paste or type your text here to format it...',
  className,
}: InputPaneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate text statistics
  const stats: TextStatistics = {
    characters: value.length,
    words: value.trim() ? value.trim().split(/\s+/).length : 0,
    sentences: value ? value.split(/[.!?]+/).filter(s => s.trim()).length : 0,
    paragraphs: value ? value.split(/\n\s*\n/).filter(p => p.trim()).length : 0,
    lines: value ? value.split('\n').length : 0,
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = async (file: File) => {
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      try {
        const text = await file.text();
        onChange(text);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  /**
   * Copy text to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  /**
   * Clear input
   */
  const handleClear = () => {
    onChange('');
    textareaRef.current?.focus();
  };

  return (
    <Card
      className={cn(
        'border-orange-200/50 shadow-lg transition-all duration-200',
        isDragging && 'ring-2 ring-orange-400 border-orange-400',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-b border-orange-200/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-handwritten text-xl text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Input Text
            </CardTitle>
            <CardDescription className="font-content">
              Paste, type, or upload your text
            </CardDescription>
          </div>
          
          {/* Upload button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,text/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Textarea */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'min-h-[400px] resize-none font-content text-base leading-relaxed',
              'focus-visible:ring-orange-400',
              isDragging && 'opacity-50'
            )}
            disabled={isProcessing}
          />
          
          {/* Drag and drop overlay */}
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-orange-50/90 border-2 border-dashed border-orange-400 rounded-md">
              <div className="text-center">
                <Upload className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                <p className="text-orange-700 font-medium">Drop file here</p>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm">
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-gray-600 font-content">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-gray-900">{stats.characters}</span>
              chars
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-gray-900">{stats.words}</span>
              words
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-gray-900">{stats.lines}</span>
              lines
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {value && (
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
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              </>
            )}
            {onFormat && value && (
              <Button
                size="sm"
                onClick={onFormat}
                disabled={isProcessing}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isProcessing ? 'Processing...' : 'Format'}
              </Button>
            )}
          </div>
        </div>

        {/* Detailed Statistics (expandable) */}
        {value && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-lg text-orange-600">{stats.characters}</div>
                <div className="text-xs text-gray-600 font-content">Characters</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-orange-600">{stats.words}</div>
                <div className="text-xs text-gray-600 font-content">Words</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-orange-600">{stats.sentences}</div>
                <div className="text-xs text-gray-600 font-content">Sentences</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-orange-600">{stats.paragraphs}</div>
                <div className="text-xs text-gray-600 font-content">Paragraphs</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-orange-600">{stats.lines}</div>
                <div className="text-xs text-gray-600 font-content">Lines</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
