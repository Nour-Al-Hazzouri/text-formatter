'use client'

/**
 * Task Lists Formatter Test Page
 * 
 * This page tests the task list formatting functionality with various input formats
 */

import { useState } from 'react';
import { TaskListsFormatter } from '@/lib/formatting';
import { TaskListDisplay } from '@/components/formatters';
import { Button } from '@/components/ui';
import type { FormattedOutput } from '@/types/formatting';

// Test inputs for different task list formats
const testInputs = {
  basic: `Call dentist
Pick up groceries
- Milk
- Bread
- Eggs
Finish project report
Call mom`,
  
  priorities: `URGENT: Fix server issue
Important: Review contract
- Send email to client
- Update website
Low priority: Clean desk
Maybe: Organize files`,

  withDates: `Call client by tomorrow
Meeting prep for Oct 3rd
- Review agenda
- Prepare slides
Shopping today:
- Milk
- Bread
Email report due 2024-10-05`,

  categorized: `Work:
- Finish project report
- Call client about proposal
- Review budget

Personal:
- Doctor appointment
- Call mom
- Pick up dry cleaning

Errands:
- Grocery shopping
- Post office
- Bank deposit`,

  mixed: `URGENT: Server maintenance tonight
Work tasks:
- Review code tomorrow
- Meeting prep for Oct 5th
- Email client about contract (high priority)

Personal stuff:
- Call dentist
- Pick up prescriptions due today
- Maybe go to gym

Shopping list:
- Milk
- Bread 
- Coffee (important!)
- Optional: cookies`
};

export default function TaskTestPage() {
  const [selectedTest, setSelectedTest] = useState<keyof typeof testInputs>('basic');
  const [formattedOutput, setFormattedOutput] = useState<FormattedOutput | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTest = async (testKey: keyof typeof testInputs) => {
    setSelectedTest(testKey);
    setIsProcessing(true);
    
    try {
      const result = await TaskListsFormatter.format({
        content: testInputs[testKey],
        metadata: {
          source: 'type',
          timestamp: new Date(),
          size: testInputs[testKey].length,
        },
      });
      
      setFormattedOutput(result);
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-handwritten font-bold text-gray-900 mb-4">
            Task List Formatter Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the task list formatting with various input formats
          </p>
        </div>

        {/* Test Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Test Case:</h2>
          <div className="flex flex-wrap gap-2">
            {Object.keys(testInputs).map((testKey) => (
              <Button
                key={testKey}
                variant={selectedTest === testKey ? 'default' : 'outline'}
                onClick={() => handleTest(testKey as keyof typeof testInputs)}
                disabled={isProcessing}
              >
                {testKey.charAt(0).toUpperCase() + testKey.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Input Text:</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4 h-64 overflow-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {testInputs[selectedTest]}
              </pre>
            </div>
          </div>

          {/* Output */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Formatted Output:</h3>
            {isProcessing ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4 h-64 flex items-center justify-center">
                <div className="text-gray-500">Processing...</div>
              </div>
            ) : formattedOutput ? (
              <div className="h-64 overflow-auto">
                <TaskListDisplay output={formattedOutput} />
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-4 h-64 flex items-center justify-center">
                <div className="text-gray-500">Select a test case to see results</div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Display */}
        {formattedOutput && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Processing Details:</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-500">Confidence:</div>
                  <div className="text-lg">{Math.round(formattedOutput.metadata.confidence * 100)}%</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Items Found:</div>
                  <div className="text-lg">{formattedOutput.metadata.itemCount}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Processing Time:</div>
                  <div className="text-lg">{Math.round(formattedOutput.metadata.duration)}ms</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Lines Processed:</div>
                  <div className="text-lg">{formattedOutput.metadata.stats.linesProcessed}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Raw Output */}
        {formattedOutput && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Raw Formatted Text:</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {formattedOutput.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
