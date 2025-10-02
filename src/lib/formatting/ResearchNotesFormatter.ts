/**
 * Research Notes Formatter - Transforms academic notes into structured research format
 * 
 * Features:
 * - Citation detection and formatting (APA, MLA, Chicago, Harvard)
 * - Source extraction and organization
 * - Topic-based section creation
 * - Quote formatting with proper attribution
 * - Reference list generation
 * - Academic writing style enforcement
 */

import type { TextInput, FormattedOutput, ExtractedData, ProcessingStats } from '@/types/formatting';

/**
 * Research entry structure
 */
interface ParsedResearchEntry {
  topic: string;
  content: string;
  citations: ParsedCitation[];
  quotes: ParsedQuote[];
  sources: ParsedSource[];
  notes: string[];
  originalLines: string[];
}

/**
 * Citation structure
 */
interface ParsedCitation {
  id: string;
  text: string;
  format: 'apa' | 'mla' | 'chicago' | 'harvard' | 'custom';
  source: {
    title: string;
    author?: string;
    year?: number;
    publication?: string;
    url?: string;
  };
}

/**
 * Quote structure
 */
interface ParsedQuote {
  id: string;
  text: string;
  author?: string;
  source?: string;
  location?: string;
  notes?: string;
}

/**
 * Source structure
 */
interface ParsedSource {
  id: string;
  title: string;
  type: 'book' | 'article' | 'website' | 'journal' | 'report' | 'other';
  metadata: Record<string, string>;
}

/**
 * Organized research content
 */
interface OrganizedResearch {
  entries: ParsedResearchEntry[];
  allCitations: ParsedCitation[];
  allQuotes: ParsedQuote[];
  allSources: ParsedSource[];
  topics: string[];
  totalEntries: number;
  confidence: number;
}

/**
 * Citation patterns for different academic formats
 */
const CITATION_PATTERNS = {
  // APA: (Author, Year) or Author (Year)
  apa: [
    /\(([^,()]+),\s*(\d{4}[a-z]?)\)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\((\d{4}[a-z]?)\)/g,
  ],
  // MLA: (Author Page) or (Author, Page)
  mla: [
    /\(([^,()]+)\s+(\d+)\)/g,
    /\(([^,()]+),\s*(\d+)\)/g,
  ],
  // Chicago: (Author Year, Page)
  chicago: [
    /\(([^,()]+)\s+(\d{4}[a-z]?),\s*(\d+)\)/g,
  ],
  // Harvard: (Author, Year: Page)
  harvard: [
    /\(([^,()]+),\s*(\d{4}[a-z]?):\s*(\d+)\)/g,
  ],
  // Generic citation patterns
  generic: [
    /\[(\d+)\]/g, // [1], [2], etc.
    /\(([^()]+)\)/g, // Any parenthetical
  ]
};

/**
 * Quote patterns for academic text
 */
const QUOTE_PATTERNS = [
  // Direct quotes with attribution
  /"([^"]+)"\s*[-–—]\s*([^,\n]+)(?:,\s*([^,\n]+))?/g,
  // Block quotes (indented or prefixed)
  /^[\s>]*"([^"]+)"[\s]*$/gm,
  // Academic quotes with page numbers
  /"([^"]+)"\s*\(([^)]+)\)/g,
  // Simple quoted text
  /"([^"]{20,})"/g,
];

/**
 * Source patterns for bibliographic information
 */
const SOURCE_PATTERNS = [
  // DOI URLs
  /(?:doi:|DOI:)\s*(10\.\d+\/[^\s]+)/gi,
  // Academic URLs
  /https?:\/\/(?:www\.)?(?:jstor|pubmed|scholar\.google|researchgate|academia\.edu)[^\s]+/gi,
  // ISBN patterns
  /ISBN:?\s*([\d-]+)/gi,
  // Journal patterns
  /([A-Z][^.]+)\.\s*([A-Z][^,]+),?\s*(\d+)(?:\((\d+)\))?,?\s*(\d+[-–—]\d+)/g,
];

/**
 * Topic/heading patterns
 */
const TOPIC_PATTERNS = [
  /^#{1,3}\s+(.+)$/gm,           // Markdown headers
  /^(.+):\s*$/gm,                // Lines ending with colon
  /^[A-Z][A-Z\s]{3,20}$/gm,      // ALL CAPS headers
  /^\d+\.\s+([^.]+)$/gm,         // Numbered sections
];

export class ResearchNotesFormatter {
  /**
   * Format research notes from unstructured text
   */
  static async format(input: TextInput): Promise<FormattedOutput> {
    const startTime = performance.now();
    const lines = input.content.split('\n');
    
    // Organize research content
    const organized = this.organizeResearch(lines);
    
    // Build formatted output
    const formattedText = this.buildFormattedOutput(organized);
    
    // Calculate statistics
    const stats = this.calculateStats(input.content, organized);
    const duration = performance.now() - startTime;

    // Extract research-specific data
    const extractedData = this.extractResearchData(organized);

    return {
      format: 'research-notes',
      content: formattedText,
      metadata: {
        processedAt: new Date(),
        duration,
        confidence: organized.confidence,
        itemCount: organized.totalEntries,
        stats,
      },
      data: extractedData,
    };
  }

  /**
   * Organize research content from raw lines
   */
  private static organizeResearch(lines: string[]): OrganizedResearch {
    const entries: ParsedResearchEntry[] = [];
    let currentEntry: Partial<ParsedResearchEntry> | null = null;
    let currentTopic = 'Introduction';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        continue;
      }

      // Check if line is a topic/heading
      const detectedTopic = this.detectTopic(trimmed);
      if (detectedTopic) {
        // Save current entry if exists
        if (currentEntry && currentEntry.content) {
          this.finalizeEntry(currentEntry);
          entries.push(currentEntry as ParsedResearchEntry);
        }
        
        // Start new entry with new topic
        currentTopic = detectedTopic;
        currentEntry = {
          topic: currentTopic,
          content: '',
          citations: [],
          quotes: [],
          sources: [],
          notes: [],
          originalLines: []
        };
        continue;
      }

      // Initialize entry if needed
      if (!currentEntry) {
        currentEntry = {
          topic: currentTopic,
          content: '',
          citations: [],
          quotes: [],
          sources: [],
          notes: [],
          originalLines: []
        };
      }

      // Add line to current entry
      currentEntry.originalLines?.push(line);
      
      // Check if line contains citations, quotes, or sources
      const citationsInLine = this.extractCitations(trimmed);
      const quotesInLine = this.extractQuotes(trimmed);
      const sourcesInLine = this.extractSources(trimmed);

      if (citationsInLine.length > 0) {
        currentEntry.citations?.push(...citationsInLine);
      }
      
      if (quotesInLine.length > 0) {
        currentEntry.quotes?.push(...quotesInLine);
      }
      
      if (sourcesInLine.length > 0) {
        currentEntry.sources?.push(...sourcesInLine);
      }

      // Add to content (clean academic formatting)
      const cleanedLine = this.cleanAcademicText(trimmed);
      if (cleanedLine) {
        currentEntry.content = currentEntry.content 
          ? `${currentEntry.content}\n\n${cleanedLine}` 
          : cleanedLine;
      }
    }

    // Finalize the last entry
    if (currentEntry && currentEntry.content) {
      this.finalizeEntry(currentEntry);
      entries.push(currentEntry as ParsedResearchEntry);
    }

    // Collect all citations, quotes, and sources
    const allCitations = entries.flatMap(entry => entry.citations || []);
    const allQuotes = entries.flatMap(entry => entry.quotes || []);
    const allSources = entries.flatMap(entry => entry.sources || []);
    const topics = [...new Set(entries.map(entry => entry.topic))];

    const confidence = this.calculateConfidence(entries, allCitations, allQuotes);

    return {
      entries,
      allCitations,
      allQuotes,
      allSources,
      topics,
      totalEntries: entries.length,
      confidence,
    };
  }

  /**
   * Detect topic/heading from line
   */
  private static detectTopic(line: string): string | undefined {
    for (const pattern of TOPIC_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Extract the topic text (remove markdown, numbers, etc.)
        let topic = match[1] || match[0];
        topic = topic.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '').trim();
        
        if (topic.length > 2 && topic.length < 100) {
          return this.capitalizeTitle(topic);
        }
      }
    }

    // Check for lines that look like section headers
    if (this.isLikelyTopic(line)) {
      return this.capitalizeTitle(line);
    }

    return undefined;
  }

  /**
   * Check if line is likely a topic header
   */
  private static isLikelyTopic(line: string): boolean {
    // Short lines that might be headers
    if (line.length < 60 && line.length > 5) {
      // Contains title-case words
      const titleCaseWords = line.split(' ').filter(word => 
        /^[A-Z][a-z]+/.test(word) || 
        ['and', 'or', 'the', 'of', 'in', 'on', 'at', 'to'].includes(word.toLowerCase())
      );
      
      if (titleCaseWords.length >= line.split(' ').length * 0.7) {
        return true;
      }
    }

    return false;
  }

  /**
   * Capitalize title properly
   */
  private static capitalizeTitle(title: string): string {
    const words = title.toLowerCase().split(' ');
    return words.map((word, index) => {
      // Always capitalize first and last word
      if (index === 0 || index === words.length - 1) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      // Don't capitalize small words unless they're first/last
      const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'];
      if (smallWords.includes(word)) {
        return word;
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  /**
   * Extract citations from text
   */
  private static extractCitations(text: string): ParsedCitation[] {
    const citations: ParsedCitation[] = [];

    // Try each citation format
    for (const [format, patterns] of Object.entries(CITATION_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = Array.from(text.matchAll(pattern));
        
        for (const match of matches) {
          const citation: ParsedCitation = {
            id: `cite-${citations.length + 1}`,
            text: match[0],
            format: format as any,
            source: {
              title: 'Unknown',
              author: match[1]?.trim(),
              year: match[2] ? parseInt(match[2]) : undefined,
            }
          };

          // Extract additional info based on format
          if (format === 'mla' && match[2]) {
            citation.source.title = `Page ${match[2]}`;
          } else if (format === 'chicago' && match[3]) {
            citation.source.title = `Page ${match[3]}`;
          }

          citations.push(citation);
        }
      }
    }

    return citations;
  }

  /**
   * Extract quotes from text
   */
  private static extractQuotes(text: string): ParsedQuote[] {
    const quotes: ParsedQuote[] = [];

    for (const pattern of QUOTE_PATTERNS) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        const quoteText = match[1]?.trim();
        if (quoteText && quoteText.length > 10) {
          const quote: ParsedQuote = {
            id: `quote-${quotes.length + 1}`,
            text: quoteText,
            author: match[2]?.trim(),
            source: match[3]?.trim(),
            location: this.extractLocation(match[0]),
          };

          quotes.push(quote);
        }
      }
    }

    return quotes;
  }

  /**
   * Extract location info from quote context
   */
  private static extractLocation(context: string): string | undefined {
    const locationPatterns = [
      /p\.\s*(\d+)/i,        // p. 123
      /page\s+(\d+)/i,       // page 123
      /pp\.\s*(\d+-\d+)/i,   // pp. 123-125
      /\((\d+)\)/,           // (123)
    ];

    for (const pattern of locationPatterns) {
      const match = context.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract sources from text
   */
  private static extractSources(text: string): ParsedSource[] {
    const sources: ParsedSource[] = [];

    for (const pattern of SOURCE_PATTERNS) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        let source: ParsedSource;

        if (match[0].includes('doi:') || match[0].includes('DOI:')) {
          source = {
            id: `source-${sources.length + 1}`,
            title: `DOI: ${match[1]}`,
            type: 'article',
            metadata: { doi: match[1] }
          };
        } else if (match[0].includes('http')) {
          const domain = this.extractDomain(match[0]);
          source = {
            id: `source-${sources.length + 1}`,
            title: `${domain} Resource`,
            type: 'website',
            metadata: { url: match[0], domain }
          };
        } else if (match[0].includes('ISBN')) {
          source = {
            id: `source-${sources.length + 1}`,
            title: `Book (ISBN: ${match[1]})`,
            type: 'book',
            metadata: { isbn: match[1] }
          };
        } else {
          // Journal pattern
          source = {
            id: `source-${sources.length + 1}`,
            title: match[1] || 'Academic Source',
            type: 'journal',
            metadata: {
              journal: match[2] || '',
              volume: match[3] || '',
              issue: match[4] || '',
              pages: match[5] || ''
            }
          };
        }

        sources.push(source);
      }
    }

    return sources;
  }

  /**
   * Extract domain from URL
   */
  private static extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Clean academic text formatting
   */
  private static cleanAcademicText(text: string): string {
    return text
      .replace(/^\s*[-*•]\s+/, '') // Remove bullet points
      .replace(/^\s*\d+\.\s+/, '') // Remove numbered lists
      .replace(/^\s*>\s+/, '')     // Remove block quote markers
      .trim();
  }

  /**
   * Finalize entry processing
   */
  private static finalizeEntry(entry: Partial<ParsedResearchEntry>): void {
    // Clean up content
    if (entry.content) {
      // Remove excessive line breaks
      entry.content = entry.content.replace(/\n{3,}/g, '\n\n');
      
      // Add research notes if content is very short
      if (entry.content.length < 50 && entry.originalLines && entry.originalLines.length > 0) {
        entry.notes = entry.originalLines.filter(line => line.trim().length > 0);
      }
    }

    // Ensure arrays are initialized
    entry.citations = entry.citations || [];
    entry.quotes = entry.quotes || [];
    entry.sources = entry.sources || [];
    entry.notes = entry.notes || [];
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(entries: ParsedResearchEntry[], citations: ParsedCitation[], quotes: ParsedQuote[]): number {
    if (entries.length === 0) return 0;

    let score = 40; // Base score for organizing content

    // Boost for citations
    if (citations.length > 0) {
      score += Math.min(30, citations.length * 5);
    }

    // Boost for quotes
    if (quotes.length > 0) {
      score += Math.min(20, quotes.length * 3);
    }

    // Boost for multiple topics
    const topics = [...new Set(entries.map(e => e.topic))];
    if (topics.length > 1) {
      score += Math.min(15, topics.length * 3);
    }

    // Boost for academic structure
    const hasAcademicStructure = entries.some(e => 
      e.content.length > 100 && (e.citations.length > 0 || e.quotes.length > 0)
    );
    if (hasAcademicStructure) {
      score += 10;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Build formatted output
   */
  private static buildFormattedOutput(organized: OrganizedResearch): string {
    const sections: string[] = [];
    
    // Add header
    sections.push('# 📚 Research Notes\n');
    
    // Add research entries by topic
    organized.entries.forEach((entry, index) => {
      sections.push(this.formatResearchEntry(entry, index + 1));
    });
    
    // Add citations section
    if (organized.allCitations.length > 0) {
      sections.push('\n## 📖 Citations\n');
      organized.allCitations.forEach((citation, index) => {
        sections.push(`${index + 1}. ${citation.text} - ${citation.source.author || 'Unknown Author'} (${citation.source.year || 'n.d.'})`);
      });
      sections.push('');
    }
    
    // Add references section
    if (organized.allSources.length > 0) {
      sections.push('## 📚 References\n');
      organized.allSources.forEach((source, index) => {
        sections.push(`${index + 1}. ${source.title} (${source.type})`);
        if (Object.keys(source.metadata).length > 0) {
          const metadata = Object.entries(source.metadata)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          sections.push(`   *${metadata}*`);
        }
      });
      sections.push('');
    }
    
    // Add summary
    const totalCitations = organized.allCitations.length;
    const totalQuotes = organized.allQuotes.length;
    const totalSources = organized.allSources.length;
    
    sections.push(`\n---\n**Summary:** ${organized.totalEntries} research sections • ${totalCitations} citations • ${totalQuotes} quotes • ${totalSources} sources`);
    
    return sections.join('\n');
  }

  /**
   * Format a single research entry
   */
  private static formatResearchEntry(entry: ParsedResearchEntry, entryNumber: number): string {
    const lines: string[] = [];
    
    // Entry header
    lines.push(`## ${entry.topic}\n`);
    
    // Main content
    if (entry.content) {
      lines.push(entry.content);
      lines.push('');
    }
    
    // Quotes section
    if (entry.quotes.length > 0) {
      lines.push('### Key Quotes\n');
      entry.quotes.forEach(quote => {
        const attribution = quote.author 
          ? ` — ${quote.author}${quote.source ? `, ${quote.source}` : ''}`
          : '';
        const location = quote.location ? ` (${quote.location})` : '';
        lines.push(`> "${quote.text}"${attribution}${location}`);
        lines.push('');
      });
    }
    
    // Citations section
    if (entry.citations.length > 0) {
      lines.push('### Citations\n');
      entry.citations.forEach(citation => {
        lines.push(`- ${citation.text}`);
      });
      lines.push('');
    }
    
    // Notes section
    if (entry.notes.length > 0) {
      lines.push('### Research Notes\n');
      entry.notes.forEach(note => {
        if (note.trim()) {
          lines.push(`- ${note.trim()}`);
        }
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }

  /**
   * Calculate processing statistics
   */
  private static calculateStats(originalText: string, organized: OrganizedResearch): ProcessingStats {
    const originalLines = originalText.split('\n').filter(line => line.trim()).length;
    const totalCitations = organized.allCitations.length;
    const totalQuotes = organized.allQuotes.length;
    const totalSources = organized.allSources.length;
    
    return {
      linesProcessed: originalLines,
      patternsMatched: organized.totalEntries,
      itemsExtracted: totalCitations + totalQuotes + totalSources,
      duplicatesRemoved: 0, // Not applicable for research notes
      changesApplied: organized.entries.length + (totalCitations > 0 ? 1 : 0) + (totalSources > 0 ? 1 : 0),
    };
  }

  /**
   * Extract research-specific data
   */
  private static extractResearchData(organized: OrganizedResearch): ExtractedData {
    const researchData = {
      citations: organized.allCitations.map(citation => ({
        id: citation.id,
        text: citation.text,
        format: citation.format,
        source: citation.source,
      })),
      quotes: organized.allQuotes.map(quote => ({
        text: quote.text,
        author: quote.author,
        source: quote.source,
        location: quote.location,
        notes: quote.notes,
      })),
      topics: organized.topics.map((topic, index) => ({
        name: topic,
        description: `Research section: ${topic}`,
        citationIds: organized.entries
          .filter(e => e.topic === topic)
          .flatMap(e => e.citations.map(c => c.id)),
        quoteIds: organized.entries
          .filter(e => e.topic === topic)
          .flatMap(e => e.quotes.map(q => q.id)),
      })),
      sources: organized.allSources.map(source => ({
        id: source.id,
        title: source.title,
        type: source.type,
        metadata: source.metadata,
      })),
    };

    // Extract URLs from sources
    const urls = organized.allSources
      .filter(source => source.metadata.url)
      .map(source => ({
        originalText: source.metadata.url,
        url: source.metadata.url,
        domain: source.metadata.domain || 'unknown',
        title: source.title,
      }));

    return {
      common: {
        dates: [], // Research notes don't typically have date extraction
        urls,
        emails: [],
        phoneNumbers: [],
        mentions: organized.allCitations
          .map(c => c.source.author)
          .filter(Boolean) as string[],
        hashtags: organized.topics.map(topic => `#${topic.replace(/\s+/g, '')}`),
      },
      formatSpecific: researchData,
    };
  }
}
