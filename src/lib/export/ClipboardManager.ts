/**
 * Clipboard Manager - Advanced clipboard operations
 * 
 * Handles clipboard operations with format preservation and rich text support
 */

import type { ClipboardExport } from '../../types/exports';
import type { FormattedOutput } from '../../types/formatting';

/**
 * Result of clipboard operation
 */
export interface ClipboardResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Clipboard Manager for copy/paste operations
 */
export class ClipboardManager {
  /**
   * Copy formatted text to clipboard with format preservation
   */
  async copyToClipboard(
    content: FormattedOutput,
    preserveFormatting: boolean = true
  ): Promise<ClipboardResult> {
    try {
      // Check if Clipboard API is available
      if (!navigator.clipboard) {
        return this.fallbackCopy(content.content);
      }
      
      if (preserveFormatting && typeof navigator.clipboard.write === 'function') {
        // Use advanced clipboard API for rich text
        return await this.copyRichText(content);
      } else {
        // Use simple text copy
        await navigator.clipboard.writeText(content.content);
        return {
          success: true,
          message: 'Content copied to clipboard'
        };
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      return {
        success: false,
        message: 'Failed to copy to clipboard',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Copy rich text with HTML formatting
   */
  private async copyRichText(content: FormattedOutput): Promise<ClipboardResult> {
    try {
      const html = this.generateHTMLForClipboard(content);
      const plainText = content.content;
      
      // Create blob items for clipboard
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      
      // Write to clipboard with multiple formats
      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      });
      
      await navigator.clipboard.write([clipboardItem]);
      
      return {
        success: true,
        message: 'Content copied with formatting'
      };
    } catch (error) {
      // Fallback to plain text if rich text fails
      console.warn('Rich text copy failed, falling back to plain text:', error);
      await navigator.clipboard.writeText(content.content);
      return {
        success: true,
        message: 'Content copied (formatting not preserved)'
      };
    }
  }
  
  /**
   * Fallback copy method for browsers without Clipboard API
   */
  private fallbackCopy(text: string): ClipboardResult {
    try {
      // Create temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      // Execute copy command
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        return {
          success: true,
          message: 'Content copied to clipboard'
        };
      } else {
        return {
          success: false,
          message: 'Copy command failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to copy to clipboard',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Generate HTML for clipboard with styling
   */
  private generateHTMLForClipboard(content: FormattedOutput): string {
    // Convert markdown-like content to HTML with basic styling
    let html = `<div style="font-family: 'Inter', sans-serif; line-height: 1.6; color: #1a1a1a;">`;
    
    // Process content line by line
    const lines = content.content.split('\n');
    let inList = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('# ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h1 style="color: #f97316; font-size: 24px; font-weight: 700; margin: 16px 0 8px 0; border-bottom: 2px solid #f97316; padding-bottom: 4px;">${trimmed.substring(2)}</h1>`;
      } else if (trimmed.startsWith('## ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h2 style="color: #f97316; font-size: 20px; font-weight: 600; margin: 14px 0 6px 0;">${trimmed.substring(3)}</h2>`;
      } else if (trimmed.startsWith('### ')) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<h3 style="color: #f97316; font-size: 18px; font-weight: 600; margin: 12px 0 6px 0;">${trimmed.substring(4)}</h3>`;
      }
      // Lists
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          html += '<ul style="margin: 8px 0; padding-left: 24px;">';
          inList = true;
        }
        const content = trimmed.substring(2);
        html += `<li style="margin: 4px 0;">${this.formatInlineStyles(content)}</li>`;
      } else if (trimmed.match(/^\d+\.\s/)) {
        if (!inList) {
          html += '<ol style="margin: 8px 0; padding-left: 24px;">';
          inList = true;
        }
        const content = trimmed.replace(/^\d+\.\s/, '');
        html += `<li style="margin: 4px 0;">${this.formatInlineStyles(content)}</li>`;
      }
      // Empty line
      else if (trimmed === '') {
        if (inList) {
          html += inList ? '</ul>' : '</ol>';
          inList = false;
        }
        html += '<br>';
      }
      // Regular paragraph
      else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<p style="margin: 8px 0;">${this.formatInlineStyles(trimmed)}</p>`;
      }
    }
    
    if (inList) {
      html += '</ul>';
    }
    
    html += '</div>';
    
    return html;
  }
  
  /**
   * Format inline styles (bold, italic, code)
   */
  private formatInlineStyles(text: string): string {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 700;">$1</strong>');
    text = text.replace(/__(.+?)__/g, '<strong style="font-weight: 700;">$1</strong>');
    
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>');
    text = text.replace(/_(.+?)_/g, '<em style="font-style: italic;">$1</em>');
    
    // Code
    text = text.replace(/`(.+?)`/g, '<code style="background: #fff5ed; padding: 2px 6px; border-radius: 3px; font-family: \'JetBrains Mono\', monospace; font-size: 0.9em;">$1</code>');
    
    // Links (preserve but add styling)
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #f97316; text-decoration: underline;">$1</a>');
    
    return text;
  }
  
  /**
   * Copy plain text only
   */
  async copyPlainText(text: string): Promise<ClipboardResult> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        return this.fallbackCopy(text);
      }
      
      return {
        success: true,
        message: 'Text copied to clipboard'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to copy text',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Read from clipboard
   */
  async readFromClipboard(): Promise<{
    success: boolean;
    text?: string;
    error?: string;
  }> {
    try {
      if (!navigator.clipboard) {
        return {
          success: false,
          error: 'Clipboard API not available'
        };
      }
      
      const text = await navigator.clipboard.readText();
      
      return {
        success: true,
        text
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Check if clipboard API is available
   */
  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.clipboard;
  }
  
  /**
   * Check if rich text clipboard is supported
   */
  supportsRichText(): boolean {
    return (
      this.isAvailable() &&
      typeof ClipboardItem !== 'undefined' &&
      typeof navigator.clipboard.write === 'function'
    );
  }
}

// Export singleton instance
export const clipboardManager = new ClipboardManager();
