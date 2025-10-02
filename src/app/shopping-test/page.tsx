'use client';

/**
 * Shopping List Formatter Test Page
 * 
 * Test page for the shopping list formatter with various input examples
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ShoppingListDisplay } from '@/components/formatters/ShoppingListDisplay';
import { ShoppingListsFormatter } from '@/lib/formatting/ShoppingListsFormatter';
import type { FormattedOutput, ShoppingListsData } from '@/types/formatting';

const SAMPLE_INPUTS = [
  {
    title: "Mixed Unorganized List",
    content: `milk
2 lbs apples
bread
eggs dozen
chicken breast 1 lb
cheese
bananas 3 lbs
toilet paper
shampoo
carrots
onions 2 lbs
pasta
tomato sauce
ice cream
2 bottles wine`
  },
  {
    title: "List with Categories",
    content: `Produce:
- apples 3 lbs
- bananas bunch
- carrots 2 lbs
- spinach bag

Dairy:
- milk gallon
- cheese block
- yogurt 4 pack
- butter

Meat:
- chicken breast 2 lbs
- ground beef 1 lb

Household:
- toilet paper 12 pack
- paper towels
- laundry detergent`
  },
  {
    title: "List with Duplicates and Notes",
    content: `milk (whole milk)
apples 3 lbs
bread (whole wheat)
milk (2%)
apples (green ones)
cheese (cheddar)
bananas
bananas (for smoothies)
eggs dozen
chicken 2 lbs (organic)
rice bag
pasta box
tomatoes (Roma)
onions 1 lb (yellow)
garlic
olive oil bottle`
  },
  {
    title: "Bullet Point Format",
    content: `• 2 gallons milk
• 1 dozen eggs
• 3 lbs ground beef
• bread loaf
• 2 lbs apples (Honeycrisp)
• bananas bunch
• 1 lb carrots
• spinach bag
• cheese block (sharp cheddar)
• yogurt cups 6-pack
• chicken breast 3 lbs
• pasta 2 boxes
• tomato sauce 3 cans
• rice 5 lb bag
• onions 2 lbs
• garlic head
• olive oil
• paper towels 6-pack
• toilet paper 12-pack
• dish soap`
  }
];

export default function ShoppingTestPage() {
  const [inputText, setInputText] = useState(SAMPLE_INPUTS[0].content);
  const [formattedOutput, setFormattedOutput] = useState<FormattedOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Format the shopping list
   */
  const handleFormat = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await ShoppingListsFormatter.format({
        content: inputText,
        metadata: {
          source: 'type',
          timestamp: new Date(),
          size: inputText.length,
        },
      });

      setFormattedOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to format shopping list');
    } finally {
      setIsProcessing(false);
    }
  }, [inputText]);

  /**
   * Load a sample input
   */
  const loadSample = useCallback((sample: typeof SAMPLE_INPUTS[0]) => {
    setInputText(sample.content);
    setFormattedOutput(null);
    setError(null);
  }, []);

  /**
   * Handle item toggle in the display
   */
  const handleItemToggle = useCallback((itemId: string, checked: boolean) => {
    console.log(`Item ${itemId} ${checked ? 'checked' : 'unchecked'}`);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-handwritten text-orange-900 dark:text-orange-100 mb-2">
            🛒 Shopping List Formatter Test
          </h1>
          <p className="text-orange-700 dark:text-orange-300">
            Test the shopping list formatter with various input formats
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                  📝 Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sample buttons */}
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_INPUTS.map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => loadSample(sample)}
                      className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      {sample.title}
                    </Button>
                  ))}
                </div>

                {/* Input textarea */}
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter your shopping list items here..."
                  className="min-h-[300px] font-mono text-sm"
                />

                {/* Format button */}
                <Button
                  onClick={handleFormat}
                  disabled={!inputText.trim() || isProcessing}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {isProcessing ? 'Formatting...' : 'Format Shopping List'}
                </Button>

                {/* Error display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <strong>Error:</strong> {error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing Stats */}
            {formattedOutput && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-900 dark:text-orange-100">
                    📊 Processing Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <Badge variant="outline">
                          {formattedOutput.metadata.confidence}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Items:</span>
                        <span>{formattedOutput.metadata.itemCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{formattedOutput.metadata.duration.toFixed(1)}ms</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Lines processed:</span>
                        <span>{formattedOutput.metadata.stats.linesProcessed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duplicates removed:</span>
                        <span>{formattedOutput.metadata.stats.duplicatesRemoved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Categories:</span>
                        <span>{formattedOutput.metadata.stats.changesApplied}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Output Section */}
          <div>
            {formattedOutput ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                    📋 Formatted Shopping List
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ShoppingListDisplay
                    data={formattedOutput.data.formatSpecific as ShoppingListsData}
                    interactive={true}
                    onItemToggle={handleItemToggle}
                    displayMode="store-layout"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-4">🛒</div>
                  <p>Enter a shopping list and click "Format Shopping List" to see the results</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Raw Output (for debugging) */}
        {formattedOutput && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-orange-900 dark:text-orange-100">
                📄 Raw Formatted Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                {formattedOutput.content}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
