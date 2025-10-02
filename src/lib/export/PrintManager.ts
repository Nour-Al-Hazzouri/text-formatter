/**
 * Print Manager - Print functionality with styling
 * 
 * Handles printing of formatted content with proper page layout and styling
 */

import type { FormattedOutput } from '../../types/formatting';
import type { PageLayout } from '../../types/exports';

/**
 * Print options configuration
 */
export interface PrintOptions {
  /** Include metadata header */
  includeMetadata?: boolean;
  
  /** Include statistics footer */
  includeStats?: boolean;
  
  /** Custom page layout */
  layout?: Partial<PageLayout>;
  
  /** Custom CSS styling */
  customCSS?: string;
}

/**
 * Print Manager for printing formatted content
 */
export class PrintManager {
  private readonly defaultLayout: PageLayout = {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    }
  };
  
  /**
   * Print formatted content
   */
  async print(content: FormattedOutput, options: PrintOptions = {}): Promise<void> {
    const html = this.generatePrintHTML(content, options);
    
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    try {
      const doc = iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Could not access iframe document');
      }
      
      doc.open();
      doc.write(html);
      doc.close();
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Print
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    } catch (error) {
      document.body.removeChild(iframe);
      throw error;
    }
  }
  
  /**
   * Generate HTML for printing
   */
  private generatePrintHTML(content: FormattedOutput, options: PrintOptions): string {
    const layout = { ...this.defaultLayout, ...options.layout };
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Print - ${this.getFormatName(content.format)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: ${layout.pageSize} ${layout.orientation};
      margin: ${layout.margins.top}mm ${layout.margins.right}mm ${layout.margins.bottom}mm ${layout.margins.left}mm;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
    }
    
    /* Headers */
    h1, h2, h3, h4, h5, h6 {
      color: #f97316;
      margin-top: 1em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
    }
    
    h1 {
      font-size: 20pt;
      border-bottom: 2pt solid #f97316;
      padding-bottom: 0.2em;
      margin-bottom: 0.8em;
    }
    
    h2 {
      font-size: 16pt;
      border-bottom: 1pt solid #f97316;
      padding-bottom: 0.2em;
    }
    
    h3 {
      font-size: 14pt;
    }
    
    /* Paragraphs */
    p {
      margin: 0.5em 0;
      orphans: 3;
      widows: 3;
    }
    
    /* Lists */
    ul, ol {
      margin: 0.5em 0;
      padding-left: 2em;
    }
    
    li {
      margin: 0.25em 0;
      page-break-inside: avoid;
    }
    
    /* Code and pre-formatted text */
    code {
      background: #f5f5f5;
      padding: 0.1em 0.3em;
      border-radius: 2px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9em;
    }
    
    pre {
      background: #f5f5f5;
      border: 1pt solid #ddd;
      border-left: 3pt solid #f97316;
      padding: 0.5em;
      overflow-x: auto;
      page-break-inside: avoid;
      margin: 0.5em 0;
    }
    
    /* Blockquotes */
    blockquote {
      border-left: 3pt solid #f97316;
      padding-left: 1em;
      margin: 0.5em 0;
      font-style: italic;
      page-break-inside: avoid;
    }
    
    /* Links */
    a {
      color: #f97316;
      text-decoration: none;
    }
    
    a[href]::after {
      content: " (" attr(href) ")";
      font-size: 0.8em;
      color: #666;
    }
    
    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.5em 0;
      page-break-inside: avoid;
    }
    
    th, td {
      border: 1pt solid #ddd;
      padding: 0.3em 0.5em;
      text-align: left;
    }
    
    th {
      background: #f97316;
      color: #fff;
      font-weight: 600;
    }
    
    /* Metadata section */
    .metadata {
      border: 2pt solid #f97316;
      padding: 1em;
      margin-bottom: 2em;
      page-break-inside: avoid;
      background: #fff5ed;
    }
    
    .metadata h2 {
      margin-top: 0;
      border-bottom: none;
    }
    
    .metadata-item {
      margin: 0.3em 0;
    }
    
    .metadata-label {
      font-weight: 600;
      color: #f97316;
    }
    
    /* Statistics section */
    .statistics {
      margin-top: 2em;
      padding-top: 1em;
      border-top: 2pt solid #ddd;
      page-break-before: avoid;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5em;
      margin-top: 0.5em;
    }
    
    .stat-item {
      padding: 0.5em;
      border: 1pt solid #ddd;
      background: #f9f9f9;
    }
    
    .stat-label {
      font-size: 0.9em;
      color: #666;
    }
    
    .stat-value {
      font-size: 1.2em;
      font-weight: 600;
      color: #f97316;
    }
    
    /* Page breaks */
    .page-break {
      page-break-after: always;
    }
    
    /* Hide screen-only elements */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    
    ${options.customCSS || ''}
  </style>
</head>
<body>
`;
    
    // Add metadata if requested
    if (options.includeMetadata) {
      html += this.generateMetadataSection(content);
    }
    
    // Add main content
    html += `
  <div class="content">
${this.formatContentForPrint(content.content)}
  </div>
`;
    
    // Add statistics if requested
    if (options.includeStats && content.metadata?.stats) {
      html += this.generateStatsSection(content);
    }
    
    html += `
</body>
</html>`;
    
    return html;
  }
  
  /**
   * Generate metadata section
   */
  private generateMetadataSection(content: FormattedOutput): string {
    const parts: string[] = [];
    
    parts.push(`
  <div class="metadata">
    <h2>Document Information</h2>
    <div class="metadata-item">
      <span class="metadata-label">Format:</span>
      <span>${this.getFormatName(content.format)}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Generated:</span>
      <span>${new Date().toLocaleString()}</span>
    </div>
`);
    
    if (content.metadata?.confidence !== undefined) {
      parts.push(`
    <div class="metadata-item">
      <span class="metadata-label">Confidence:</span>
      <span>${(content.metadata.confidence * 100).toFixed(1)}%</span>
    </div>
`);
    }
    
    if (content.metadata?.itemCount !== undefined) {
      parts.push(`
    <div class="metadata-item">
      <span class="metadata-label">Items:</span>
      <span>${content.metadata.itemCount}</span>
    </div>
`);
    }
    
    parts.push(`
  </div>
`);
    
    return parts.join('');
  }
  
  /**
   * Generate statistics section
   */
  private generateStatsSection(content: FormattedOutput): string {
    if (!content.metadata?.stats) return '';
    
    const stats = content.metadata.stats;
    
    let html = `
  <div class="statistics">
    <h2>Processing Statistics</h2>
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">Lines Processed</div>
        <div class="stat-value">${stats.linesProcessed}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Patterns Matched</div>
        <div class="stat-value">${stats.patternsMatched}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Items Extracted</div>
        <div class="stat-value">${stats.itemsExtracted}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Changes Applied</div>
        <div class="stat-value">${stats.changesApplied}</div>
      </div>
`;
    
    if (content.metadata.duration) {
      html += `
      <div class="stat-item">
        <div class="stat-label">Processing Time</div>
        <div class="stat-value">${content.metadata.duration}ms</div>
      </div>
`;
    }
    
    html += `
    </div>
  </div>
`;
    
    return html;
  }
  
  /**
   * Format content for print (keep markdown-like formatting)
   */
  private formatContentForPrint(content: string): string {
    // Simple conversion - keep content mostly as is since it's already formatted
    // Just ensure proper HTML escaping where needed
    let output = '';
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Preserve empty lines
      if (!trimmed) {
        output += '<br>';
        continue;
      }
      
      // Keep lines as paragraphs if they don't start with special characters
      if (!trimmed.match(/^[#\-*\d]/)) {
        output += `<p>${line}</p>`;
      } else {
        output += line;
      }
      output += '\n';
    }
    
    return output;
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
}

// Export singleton instance
export const printManager = new PrintManager();
