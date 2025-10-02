'use client';

/**
 * Journal Notes Formatter Test Page
 * 
 * Test page for the journal notes formatter with various input examples
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { JournalDisplay } from '@/components/formatters/JournalDisplay';
import { JournalNotesFormatter } from '@/lib/formatting/JournalNotesFormatter';
import type { FormattedOutput, JournalNotesData } from '@/types/formatting';

const SAMPLE_INPUTS = [
  {
    title: "Stream of Consciousness",
    content: `Today was really overwhelming at work I had so many meetings and deadlines I realized I need to be better at saying no when people ask me to take on more projects I'm feeling grateful for my team though they really supported me when I was stressed out about the presentation Tomorrow I want to focus on the Johnson project it's been on my mind all week I learned that taking breaks actually makes me more productive not less productive like I used to think`
  },
  {
    title: "Journal with Timestamps",
    content: `January 15, 2024
My Morning Reflection

Woke up feeling anxious about the presentation today. I keep thinking "what if I forget what to say?" But then I remembered what Sarah told me last week: "you always over-prepare anyway, just trust yourself." 

I realized I've been putting too much pressure on myself lately. Need to remember that perfectionism is just fear in disguise.

3:30 PM
The presentation went amazing! I was worried for nothing. Got great feedback from the client and my boss said it was one of the best pitches she's seen. I'm learning to trust my abilities more.

Evening thoughts:
Feeling grateful and accomplished. This morning feels like a lifetime ago. I should celebrate these wins more often instead of immediately jumping to the next challenge.`
  },
  {
    title: "Mixed Emotions Entry",
    content: `Therapy Session Notes - March 8th

Talked about the conflict with mom today. I'm frustrated that she still treats me like a child but I also understand she's coming from a place of love. Dr. Martinez said something important: "you can appreciate someone's intentions while still setting boundaries about their behavior."

I feel sad that our relationship is complicated but hopeful that we can work through it. The homework is to have an honest conversation with her this weekend.

Key insight: I've been avoiding difficult conversations because I'm afraid of hurting people's feelings, but avoiding them hurts more in the long run.

Things I'm grateful for today:
- Having a therapist who really gets it
- My brother's support through all this family stuff
- The sunny weather after weeks of rain`
  },
  {
    title: "Goal Setting & Reflection",
    content: `New Year Reflections 2024

Looking back at 2023 - what a year! Started the year feeling lost in my career and ended it with a promotion and clear direction. The key was taking that UX course in April and finally admitting I wanted to switch from marketing to design.

"The best time to plant a tree was 20 years ago. The second best time is now" - this quote from that podcast really stuck with me.

Goals for 2024:
- Build a stronger portfolio
- Network with other designers  
- Take better care of my mental health
- Travel somewhere new (thinking Portugal?)
- Learn Spanish finally

I've realized that I'm much happier when I'm creating things rather than just analyzing them. Going to make this the year of making instead of just planning.

#goals #career #design #2024`
  }
];

export default function JournalTestPage() {
  const [input, setInput] = useState(SAMPLE_INPUTS[0].content);
  const [result, setResult] = useState<FormattedOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormat = useCallback(async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formatted = await JournalNotesFormatter.format({
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-handwritten text-orange-900 dark:text-orange-100 mb-2">
            📓 Journal Notes Formatter Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Transform stream-of-consciousness text into organized journal entries
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
                  📝 Input Text
                </span>
                <Button 
                  onClick={handleFormat}
                  disabled={isProcessing || !input.trim()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isProcessing ? 'Processing...' : 'Format Journal'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your journal text or stream-of-consciousness writing here..."
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
                      <span className="font-semibold">Entries:</span> {result.metadata.itemCount}
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
                  <p>Process some journal text to see the formatted output here</p>
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
                <CardTitle className="font-handwritten text-orange-900 dark:text-orange-100">
                  🎨 Interactive Journal Display
                </CardTitle>
              </CardHeader>
              <CardContent>
                <JournalDisplay 
                  data={result.data.formatSpecific as JournalNotesData}
                  interactive={true}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800 dark:text-green-200 text-sm">
                📅 Timestamp Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-green-700 dark:text-green-300">
                Automatically detects dates and times in various formats
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-800 dark:text-blue-200 text-sm">
                📝 Content Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Structures rambling text into readable paragraphs and sections
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-800 dark:text-purple-200 text-sm">
                😊 Mood Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Analyzes emotional tone and sentiment throughout entries
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-800 dark:text-orange-200 text-sm">
                💡 Insight Extraction
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Identifies key insights, quotes, and learning moments
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
