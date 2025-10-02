/**
 * File Exporter - Multi-format export generation
 * 
 * Handles export of formatted content to various file formats
 */

import type { 
  ExportRequest, 
  ExportResponse, 
  ExportOptions,
  ExportedFile,
  ExportStats,
  ExportMetadata
} from '../../types/exports';
import type { ExportFormat } from '../../types/index';
import type { FormattedOutput } from '../../types/formatting';

/**
 * File Exporter for generating exports in multiple formats
 */
export class FileExporter {
  private readonly appName = 'Text Formatter';
  
  /**
   * Export formatted content to specified format
   */
  async export(
    content: FormattedOutput,
    format: ExportFormat,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResponse> {
    const startTime = performance.now();
    const requestId = this.generateRequestId();
    
    try {
      // Merge with default options
      const fullOptions = this.getDefaultOptions(options);
      
      // Generate file based on format
      const file = await this.generateFile(content, format, fullOptions);
      
      // Calculate statistics
      const processingTime = performance.now() - startTime;
      const stats: ExportStats = {
        processingTime,
        content: {
          originalSize: content.content.length,
          exportedSize: file.size,
          compressionRatio: file.size / content.content.length
        },
        performance: {
          fileGenerationTime: processingTime
        }
      };
      
      return {
        requestId,
        success: true,
        file,
        stats,
        completedAt: new Date()
      };
    } catch (error) {
      const processingTime = performance.now() - startTime;
      
      return {
        requestId,
        success: false,
        error: {
          code: 'FILE_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown export error',
          details: error instanceof Error ? error.stack : undefined,
          suggestions: [
            'Check content format and size',
            'Verify export format is supported',
            'Try a different export format'
          ]
        },
        stats: {
          processingTime,
          content: {
            originalSize: content.content.length,
            exportedSize: 0
          },
          performance: {}
        },
        completedAt: new Date()
      };
    }
  }
  
  /**
   * Generate file in specified format
   */
  private async generateFile(
    content: FormattedOutput,
    format: ExportFormat,
    options: ExportOptions
  ): Promise<ExportedFile> {
    let fileContent: string;
    let mimeType: string;
    let extension: string;
    
    switch (format) {
      case 'plain-text':
        fileContent = this.generatePlainText(content, options);
        mimeType = 'text/plain';
        extension = 'txt';
        break;
        
      case 'markdown':
        fileContent = this.generateMarkdown(content, options);
        mimeType = 'text/markdown';
        extension = 'md';
        break;
        
      case 'html':
        fileContent = this.generateHTML(content, options);
        mimeType = 'text/html';
        extension = 'html';
        break;
        
      case 'json':
        fileContent = this.generateJSON(content, options);
        mimeType = 'application/json';
        extension = 'json';
        break;
        
      default:
        throw new Error(`Export format "${format}" is not yet implemented`);
    }
    
    // Create blob
    const blob = new Blob([fileContent], { type: mimeType });
    
    // Generate filename
    const fileName = this.generateFileName(content.format, extension);
    
    return {
      name: fileName,
      size: blob.size,
      mimeType,
      content: blob,
      downloadUrl: URL.createObjectURL(blob),
      metadata: {
        createdAt: new Date(),
        formatVersion: '1.0',
        encoding: 'UTF-8'
      }
    };
  }
  
  /**
   * Generate plain text export
   */
  private generatePlainText(content: FormattedOutput, options: ExportOptions): string {
    let output = '';
    
    // Add metadata header if requested
    if (options.includeMetadata) {
      output += this.generateMetadataHeader(content);
      output += '\n' + '='.repeat(80) + '\n\n';
    }
    
    // Add main content
    output += content.content;
    
    // Add statistics if requested
    if (options.includeStats && content.metadata?.stats) {
      output += '\n\n' + '-'.repeat(80) + '\n';
      output += 'PROCESSING STATISTICS\n';
      output += '-'.repeat(80) + '\n';
      output += `Lines Processed: ${content.metadata.stats.linesProcessed}\n`;
      output += `Patterns Matched: ${content.metadata.stats.patternsMatched}\n`;
      output += `Items Extracted: ${content.metadata.stats.itemsExtracted}\n`;
      output += `Changes Applied: ${content.metadata.stats.changesApplied}\n`;
      
      if (content.metadata.duration) {
        output += `Processing Time: ${content.metadata.duration}ms\n`;
      }
    }
    
    // Add confidence score if requested
    if (options.includeConfidence && content.metadata?.confidence !== undefined) {
      output += `\nConfidence Score: ${(content.metadata.confidence * 100).toFixed(1)}%\n`;
    }
    
    return output;
  }
  
  /**
   * Generate Markdown export
   */
  private generateMarkdown(content: FormattedOutput, options: ExportOptions): string {
    let output = '';
    
    // Add front matter if metadata is included
    if (options.includeMetadata) {
      output += '---\n';
      output += `title: Formatted ${this.getFormatName(content.format)}\n`;
      output += `format: ${content.format}\n`;
      output += `generated: ${new Date().toISOString()}\n`;
      if (options.includeConfidence && content.metadata?.confidence !== undefined) {
        output += `confidence: ${(content.metadata.confidence * 100).toFixed(1)}%\n`;
      }
      output += `app: ${this.appName}\n`;
      output += '---\n\n';
    }
    
    // Add main content (already in markdown format)
    output += content.content;
    
    // Add statistics section if requested
    if (options.includeStats && content.metadata?.stats) {
      output += '\n\n## Processing Statistics\n\n';
      output += '| Metric | Value |\n';
      output += '|--------|-------|\n';
      output += `| Lines Processed | ${content.metadata.stats.linesProcessed} |\n`;
      output += `| Patterns Matched | ${content.metadata.stats.patternsMatched} |\n`;
      output += `| Items Extracted | ${content.metadata.stats.itemsExtracted} |\n`;
      output += `| Changes Applied | ${content.metadata.stats.changesApplied} |\n`;
      
      if (content.metadata.duration) {
        output += `| Processing Time | ${content.metadata.duration}ms |\n`;
      }
    }
    
    return output;
  }
  
  /**
   * Generate HTML export
   */
  private generateHTML(content: FormattedOutput, options: ExportOptions): string {
    const title = `Formatted ${this.getFormatName(content.format)}`;
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="generator" content="${this.appName}">
  ${options.includeMetadata ? `<meta name="format" content="${content.format}">` : ''}
  <style>
    :root {
      --orange-50: hsl(24, 100%, 97%);
      --orange-500: hsl(24, 100%, 50%);
      --orange-600: hsl(24, 100%, 45%);
      --orange-900: hsl(24, 100%, 10%);
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: var(--orange-50);
      color: var(--orange-900);
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: var(--orange-600);
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    
    h1 { font-size: 2em; border-bottom: 3px solid var(--orange-500); padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 2px solid var(--orange-500); padding-bottom: 0.3em; }
    
    pre {
      background: white;
      border: 1px solid var(--orange-500);
      border-left: 4px solid var(--orange-500);
      padding: 1rem;
      overflow-x: auto;
      border-radius: 4px;
    }
    
    code {
      background: white;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      font-size: 0.9em;
    }
    
    blockquote {
      border-left: 4px solid var(--orange-500);
      padding-left: 1rem;
      margin-left: 0;
      color: var(--orange-900);
      font-style: italic;
    }
    
    ul, ol {
      padding-left: 2rem;
    }
    
    li {
      margin: 0.5em 0;
    }
    
    .metadata {
      background: white;
      border: 2px solid var(--orange-500);
      padding: 1rem;
      margin-bottom: 2rem;
      border-radius: 8px;
    }
    
    .metadata h3 {
      margin-top: 0;
      color: var(--orange-600);
    }
    
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    
    .stats-table th,
    .stats-table td {
      padding: 0.5rem;
      text-align: left;
      border-bottom: 1px solid var(--orange-500);
    }
    
    .stats-table th {
      background: var(--orange-500);
      color: white;
      font-weight: 600;
    }
    
    .confidence-badge {
      display: inline-block;
      background: var(--orange-500);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    @media print {
      body {
        background: white;
        max-width: none;
        padding: 1cm;
      }
    }
  </style>
</head>
<body>
`;
    
    // Add metadata section
    if (options.includeMetadata) {
      html += `  <div class="metadata">
    <h3>Document Information</h3>
    <p><strong>Format:</strong> ${this.getFormatName(content.format)}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
`;
      if (options.includeConfidence && content.metadata?.confidence !== undefined) {
        const confidencePercent = (content.metadata.confidence * 100).toFixed(1);
        html += `    <p><strong>Confidence:</strong> <span class="confidence-badge">${confidencePercent}%</span></p>
`;
      }
      html += `  </div>
`;
    }
    
    // Add main content
    html += `  <div class="content">
${this.markdownToHTML(content.content)}
  </div>
`;
    
    // Add statistics section
    if (options.includeStats && content.metadata?.stats) {
      html += `
  <div class="statistics">
    <h2>Processing Statistics</h2>
    <table class="stats-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Lines Processed</td>
          <td>${content.metadata.stats.linesProcessed}</td>
        </tr>
        <tr>
          <td>Patterns Matched</td>
          <td>${content.metadata.stats.patternsMatched}</td>
        </tr>
        <tr>
          <td>Items Extracted</td>
          <td>${content.metadata.stats.itemsExtracted}</td>
        </tr>
        <tr>
          <td>Changes Applied</td>
          <td>${content.metadata.stats.changesApplied}</td>
        </tr>
`;
      if (content.metadata.duration) {
        html += `        <tr>
          <td>Processing Time</td>
          <td>${content.metadata.duration}ms</td>
        </tr>
`;
      }
      html += `      </tbody>
    </table>
  </div>
`;
    }
    
    html += `
</body>
</html>`;
    
    return html;
  }
  
  /**
   * Generate JSON export
   */
  private generateJSON(content: FormattedOutput, options: ExportOptions): string {
    const data: Record<string, unknown> = {
      format: content.format,
      content: content.content,
      generatedAt: new Date().toISOString(),
      application: this.appName
    };
    
    if (options.includeMetadata && content.metadata) {
      data.metadata = content.metadata;
    }
    
    if (options.includeConfidence && content.metadata?.confidence !== undefined) {
      data.confidence = content.metadata.confidence;
    }
    
    if (options.includeStats && content.metadata?.stats) {
      data.statistics = content.metadata.stats;
    }
    
    if (content.data) {
      data.extractedData = content.data;
    }
    
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * Convert markdown to basic HTML
   */
  private markdownToHTML(markdown: string): string {
    let html = markdown;
    
    // Headers (must be done before other replacements)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Lists (unordered)
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    
    // Wrap consecutive list items in ul tags
    html = html.replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>\n${match}</ul>\n`);
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
  }
  
  /**
   * Generate metadata header for plain text
   */
  private generateMetadataHeader(content: FormattedOutput): string {
    let header = '';
    header += `${this.appName.toUpperCase()} - FORMATTED OUTPUT\n`;
    header += `Format: ${this.getFormatName(content.format)}\n`;
    header += `Generated: ${new Date().toLocaleString()}\n`;
    
    if (content.metadata?.confidence !== undefined) {
      header += `Confidence: ${(content.metadata.confidence * 100).toFixed(1)}%\n`;
    }
    
    if (content.metadata?.itemCount !== undefined) {
      header += `Items Found: ${content.metadata.itemCount}\n`;
    }
    
    return header;
  }
  
  /**
   * Get human-readable format name
   */
  private getFormatName(format: string): string {
    const names: Record<string, string> = {
      'meeting-notes': 'Meeting Notes',
      'task-lists': 'Task Lists',
      'journal-notes': 'Journal Notes',
      'shopping-lists': 'Shopping Lists',
      'research-notes': 'Research Notes',
      'study-notes': 'Study Notes'
    };
    return names[format] || format;
  }
  
  /**
   * Generate filename
   */
  private generateFileName(format: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const formatSlug = format.replace(/\s+/g, '-').toLowerCase();
    return `formatted-${formatSlug}-${timestamp}.${extension}`;
  }
  
  /**
   * Get default export options
   */
  private getDefaultOptions(partial: Partial<ExportOptions>): ExportOptions {
    return {
      includeMetadata: partial.includeMetadata ?? true,
      preserveFormatting: partial.preserveFormatting ?? true,
      includeConfidence: partial.includeConfidence ?? true,
      includeStats: partial.includeStats ?? false,
      formatSpecific: partial.formatSpecific ?? {},
      ...partial
    } as ExportOptions;
  }
  
  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const fileExporter = new FileExporter();
