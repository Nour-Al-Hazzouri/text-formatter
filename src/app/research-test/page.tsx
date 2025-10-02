'use client';

/**
 * Research Notes Formatter Test Page
 * 
 * Test page for the research notes formatter with various academic input examples
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ResearchDisplay } from '@/components/formatters/ResearchDisplay';
import { ResearchNotesFormatter } from '@/lib/formatting/ResearchNotesFormatter';
import type { FormattedOutput, ResearchNotesData } from '@/types/formatting';

const SAMPLE_INPUTS = [
  {
    title: "Literature Review Notes",
    content: `# Climate Change Impacts on Agriculture

The effects of climate change on agricultural productivity have been extensively studied. Smith et al. (2023) found that "rising temperatures and changing precipitation patterns significantly affect crop yields across different regions" (Smith, 2023, p. 45). This finding is supported by Johnson (2022) who noted similar trends in European agriculture.

DOI: 10.1234/climate.2023.001

## Adaptation Strategies

According to Davis (2024), farmers are implementing various adaptation strategies including:
- Drought-resistant crop varieties
- Improved irrigation systems
- Seasonal timing adjustments

"The key to successful adaptation lies in combining traditional knowledge with modern technology" - Martinez et al. (2023)

Key insight: Early adoption of climate-smart practices leads to better outcomes (Brown, 2024).

References:
1. Smith, J. (2023). Climate Impacts on Global Agriculture. Environmental Science Journal, 45(3), 123-145.
2. Johnson, M. (2022). European Agricultural Adaptation. Agricultural Policy Review, 12(1), 67-89.`
  },
  {
    title: "Research Paper Citations",
    content: `Machine Learning in Healthcare Research

Recent advances in machine learning have revolutionized healthcare diagnostics (Chen et al., 2024). The application of deep learning algorithms shows promising results in medical imaging analysis.

According to Wang (2023): "AI-powered diagnostic tools can achieve accuracy rates exceeding 95% in certain medical conditions" (p. 234).

## Key Studies

Thompson and Lee (2024) conducted a comprehensive meta-analysis of ML applications in radiology. Their findings indicate significant improvements in diagnostic accuracy when AI is used as a decision support tool.

https://www.nature.com/articles/ml-healthcare-2024

ISBN: 978-0-123456-78-9

The integration challenge was noted by Rodriguez (2023): "While AI shows great promise, integration with existing clinical workflows remains a significant barrier" (Rodriguez, 2023: 156).

Future research directions include:
- Explainable AI in medical decision-making
- Ethical considerations in AI diagnostics
- Regulatory frameworks for AI medical devices`
  },
  {
    title: "Academic Conference Notes",
    content: `## ICML 2024 Conference Notes

### Keynote: "Future of AI in Scientific Discovery"
Dr. Sarah Peterson presented groundbreaking work on automated hypothesis generation. 

"The next breakthrough in AI will come from systems that can formulate novel scientific hypotheses independently" (Peterson, 2024).

Key points:
- Current AI systems are primarily pattern recognition tools
- Need for causal reasoning capabilities
- Integration with domain expertise

### Session: Natural Language Processing

Notable presentation by Kumar et al. (2024) on transformer architectures:
- Attention mechanisms in scientific text analysis
- Multi-modal learning approaches
- Performance benchmarks on scientific corpora

"Large language models represent a paradigm shift in how we process scientific literature" - Kumar presentation slides.

DOI: 10.1145/icml.2024.nlp

### Networking Notes

Discussed collaboration opportunities with:
- MIT AI Lab (contact: Dr. James Wilson)
- Stanford NLP Group (Prof. Lisa Chang)
- Google Research (meeting scheduled for next month)

Research gaps identified:
1. Bias in scientific AI systems
2. Reproducibility in ML research
3. Computational resource accessibility`
  },
  {
    title: "Thesis Research Compilation",
    content: `# Chapter 3: Methodology

## Data Collection Framework

The research methodology follows a mixed-methods approach as outlined by Creswell (2018). Primary data collection involves structured interviews with industry professionals.

"Qualitative research provides depth and context that quantitative methods alone cannot capture" (Patton, 2015, p. 14).

Sample size calculation based on Cohen (1988) power analysis:
- Effect size: 0.5
- Power: 0.80
- Significance level: 0.05
- Required sample: n = 64

## Analysis Techniques

Statistical analysis will employ SPSS version 28. Thematic analysis follows Braun and Clarke (2006) six-phase approach:

1. Data familiarization
2. Initial code generation
3. Theme identification
4. Theme review
5. Theme definition
6. Report writing

https://journals.sage.com/qualitative-methods

Validation strategies include:
- Member checking with participants
- Peer debriefing sessions
- Triangulation of data sources

Critical consideration from Maxwell (2013): "Validity in qualitative research is not about truth but about the credibility of interpretations" (Maxwell, 2013: 122).

## Ethical Considerations

IRB approval obtained (Protocol #2024-789). All participants provided informed consent following university guidelines.

References consulted:
- APA Ethics Code (2017)
- Institutional Review Board protocols
- Data protection regulations (GDPR compliance)`
  }
];

export default function ResearchTestPage() {
  const [input, setInput] = useState(SAMPLE_INPUTS[0].content);
  const [result, setResult] = useState<FormattedOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'topics' | 'citations' | 'sources'>('topics');

  const handleFormat = useCallback(async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formatted = await ResearchNotesFormatter.format({
        content: input,
        metadata: {
          source: 'type',
          timestamp: new Date(),
          size: input.length,
        },
      });

      setResult(formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [input]);

  const loadSample = useCallback((sample: typeof SAMPLE_INPUTS[0]) => {
    setInput(sample.content);
    setResult(null);
    setError(null);
  }, []);

  const handleCitationClick = useCallback((citationId: string) => {
    console.log('Citation clicked:', citationId);
    // Could implement citation detail modal or navigation
  }, []);

  const handleSourceClick = useCallback((sourceId: string) => {
    console.log('Source clicked:', sourceId);
    // Could implement source detail view or external link navigation
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-handwritten text-orange-900 dark:text-orange-100 mb-2">
            📚 Research Notes Formatter Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Transform academic notes into structured research format with citations and sources
          </p>
        </div>

        {/* Sample buttons */}
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          {SAMPLE_INPUTS.map((sample, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => loadSample(sample)}
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              {sample.title}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="font-handwritten text-orange-900 dark:text-orange-100">
                  📝 Academic Text Input
                </span>
                <Button 
                  onClick={handleFormat}
                  disabled={isProcessing || !input.trim()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isProcessing ? 'Processing...' : 'Format Research'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your research notes, literature review, or academic text here..."
                className="min-h-[400px] font-content resize-none"
              />
              
              {input && (
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {input.length} characters • {input.split(/\s+/).filter(w => w).length} words
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="font-handwritten text-orange-900 dark:text-orange-100">
                📖 Formatted Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                    <div>
                      <span className="font-semibold">Confidence:</span>{' '}
                      <Badge variant={result.metadata.confidence > 80 ? 'default' : 'secondary'}>
                        {result.metadata.confidence}%
                      </Badge>
                    </div>
                    <div>
                      <span className="font-semibold">Processing:</span> {result.metadata.duration.toFixed(1)}ms
                    </div>
                    <div>
                      <span className="font-semibold">Sections:</span> {result.metadata.itemCount}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
                    <div>
                      <span className="font-semibold">Lines Processed:</span> {result.metadata.stats.linesProcessed}
                    </div>
                    <div>
                      <span className="font-semibold">Patterns Matched:</span> {result.metadata.stats.patternsMatched}
                    </div>
                    <div>
                      <span className="font-semibold">Items Extracted:</span> {result.metadata.stats.itemsExtracted}
                    </div>
                    <div>
                      <span className="font-semibold">Changes Applied:</span> {result.metadata.stats.changesApplied}
                    </div>
                  </div>

                  {/* Research Data Summary */}
                  {result.data.formatSpecific && (
                    <div className="grid grid-cols-4 gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {(result.data.formatSpecific as ResearchNotesData).citations?.length || 0}
                        </div>
                        <div className="text-xs">Citations</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-purple-600 dark:text-purple-400">
                          {(result.data.formatSpecific as ResearchNotesData).quotes?.length || 0}
                        </div>
                        <div className="text-xs">Quotes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600 dark:text-green-400">
                          {(result.data.formatSpecific as ResearchNotesData).sources?.length || 0}
                        </div>
                        <div className="text-xs">Sources</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600 dark:text-orange-400">
                          {(result.data.formatSpecific as ResearchNotesData).topics?.length || 0}
                        </div>
                        <div className="text-xs">Topics</div>
                      </div>
                    </div>
                  )}

                  {/* Formatted Text Preview */}
                  <div className="p-4 bg-white dark:bg-gray-800 border rounded-lg max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-content text-gray-800 dark:text-gray-200">
                      {result.content}
                    </pre>
                  </div>
                </div>
              )}

              {!result && !error && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>Process some research text to see the formatted output here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interactive Display */}
        {result && (
          <div className="mt-8">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="font-handwritten text-orange-900 dark:text-orange-100">
                    🎨 Interactive Research Display
                  </span>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={displayMode === 'topics' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDisplayMode('topics')}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Topics
                    </Button>
                    <Button
                      variant={displayMode === 'citations' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDisplayMode('citations')}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Citations
                    </Button>
                    <Button
                      variant={displayMode === 'sources' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDisplayMode('sources')}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Sources
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResearchDisplay 
                  data={result.data.formatSpecific as ResearchNotesData}
                  displayMode={displayMode}
                  interactive={true}
                  onCitationClick={handleCitationClick}
                  onSourceClick={handleSourceClick}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-800 dark:text-blue-200 text-sm">
                📖 Citation Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Automatically detects APA, MLA, Chicago, and Harvard citation formats
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-800 dark:text-purple-200 text-sm">
                💬 Quote Extraction
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Identifies and formats quotes with proper attribution and page references
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800 dark:text-green-200 text-sm">
                📚 Source Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-green-700 dark:text-green-300">
                Extracts DOIs, URLs, ISBNs and organizes sources by type
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-800 dark:text-orange-200 text-sm">
                📝 Topic Structuring
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Creates logical sections based on academic structure and headers
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
