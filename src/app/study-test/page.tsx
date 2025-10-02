'use client';

/**
 * Study Notes Formatter Test Page
 * 
 * Test page for the study notes formatter with various educational input examples
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { StudyDisplay } from '@/components/formatters/StudyDisplay';
import { StudyNotesFormatter } from '@/lib/formatting/StudyNotesFormatter';
import type { FormattedOutput, StudyNotesData } from '@/types/formatting';

const SAMPLE_INPUTS = [
  {
    title: "Biology Class Notes",
    content: `# Cell Biology

## Cell Structure
The cell is the basic unit of life. All living organisms are made up of one or more cells.

Cell Membrane: A thin barrier that surrounds the cell and controls what enters and leaves the cell.

Nucleus: The control center of the cell that contains DNA and controls cellular activities.

Mitochondria: Often called the "powerhouse of the cell" because they produce energy (ATP) for cellular processes.

## Cell Division
Mitosis is the process by which cells divide to create two identical daughter cells.

What is the purpose of mitosis?
Mitosis allows organisms to grow and repair damaged tissues.

Phases of Mitosis:
1. Prophase - Chromosomes condense and become visible
2. Metaphase - Chromosomes align at the cell's center
3. Anaphase - Chromosomes separate and move to opposite ends
4. Telophase - Nuclear membranes reform around each set of chromosomes

Important: Understanding cell division is crucial for understanding growth and healing.

Key terms to remember:
- DNA: Deoxyribonucleic acid - genetic material
- ATP: Adenosine triphosphate - cellular energy currency
- Chromosome: Structure containing DNA and proteins`
  },
  {
    title: "History Study Guide",
    content: `World War II Overview

## Major Events

### 1939-1941: War Begins
- September 1939: Germany invades Poland
- Britain and France declare war on Germany
- Blitzkrieg: Lightning war tactics used by Germany

### 1941-1943: War Expands
Pearl Harbor Attack: December 7, 1941 - Japan attacks US naval base, bringing America into the war.

What was the significance of Pearl Harbor?
It marked the entry of the United States into World War II, significantly changing the balance of power.

### 1943-1945: Allied Victory
D-Day: June 6, 1944 - Allied forces launch massive invasion of Nazi-occupied France.

Important Leaders:
- Winston Churchill: Prime Minister of Britain
- Franklin D. Roosevelt: US President during most of the war
- Adolf Hitler: Dictator of Nazi Germany
- Joseph Stalin: Leader of Soviet Union

Key Concepts:
Holocaust: The systematic persecution and murder of six million Jews by Nazi Germany.
Blitzkrieg: Fast-moving warfare combining aircraft, tanks, and motorized troops.
Rationing: Government control of food and material distribution during wartime.

Why was WWII considered a "total war"?
Because it involved entire populations and economies, not just military forces.`
  },
  {
    title: "Chemistry Fundamentals",
    content: `# Introduction to Chemistry

## Atomic Structure

Atom: The smallest unit of matter that retains the properties of an element.

### Subatomic Particles
- Proton: Positively charged particle in the nucleus
- Neutron: Neutral particle in the nucleus  
- Electron: Negatively charged particle orbiting the nucleus

Atomic Number: The number of protons in an atom's nucleus - this defines the element.

What determines an element's chemical properties?
The number and arrangement of electrons, particularly in the outermost shell.

## Chemical Bonding

### Types of Bonds
1. Ionic Bond: Transfer of electrons between atoms
2. Covalent Bond: Sharing of electrons between atoms
3. Metallic Bond: Sea of electrons shared among metal atoms

Important: Ionic compounds typically form between metals and non-metals.

### Examples
Salt Formation: Sodium (Na) loses an electron to Chlorine (Cl) forming NaCl - an ionic compound.

Water Formation: Two hydrogen atoms share electrons with one oxygen atom forming H2O - a covalent compound.

## Chemical Reactions

Chemical Equation: A representation of a chemical reaction using symbols and formulas.

Balancing Equations: The number of atoms of each element must be equal on both sides of the equation.

What is the law of conservation of mass?
Matter cannot be created or destroyed in a chemical reaction, only rearranged.

Types of Reactions:
- Synthesis: A + B → AB
- Decomposition: AB → A + B
- Single Replacement: A + BC → AC + B
- Double Replacement: AB + CD → AD + CB`
  },
  {
    title: "Literature Analysis Notes",
    content: `## Shakespeare's Romeo and Juliet

### Plot Summary
Romeo and Juliet is a tragedy about two young lovers from feuding families in Verona.

### Main Characters
Romeo Montague: Young man from the Montague family who falls in love with Juliet.
Juliet Capulet: Young woman from the Capulet family who secretly marries Romeo.
Friar Lawrence: Priest who marries Romeo and Juliet in secret.

### Major Themes

Love vs. Hate: The play contrasts the pure love between Romeo and Juliet with the hatred between their families.

What is the central conflict in Romeo and Juliet?
The conflict between the young lovers' desire to be together and their families' ancient feud.

Fate vs. Free Will: Are the lovers doomed by fate or do their choices lead to tragedy?

Youth vs. Age: The impulsive actions of the young contrast with the rigid traditions of the older generation.

### Literary Devices

Metaphor: Romeo calls Juliet "the sun" - comparing her beauty and importance to the sun.

Foreshadowing: Early hints about the tragic ending, such as Romeo's dream about dying.

Dramatic Irony: The audience knows Juliet isn't really dead, but Romeo doesn't.

What is a soliloquy?
A speech given by a character alone on stage, revealing their inner thoughts to the audience.

### Key Quotes
"A rose by any other name would smell as sweet" - Juliet questioning the importance of names and family identity.

Important: The balcony scene (Act 2, Scene 2) is one of the most famous romantic scenes in literature.

Why is Romeo and Juliet still relevant today?
It explores timeless themes of love, family conflict, and the consequences of hatred that remain relevant in modern society.`
  }
];

export default function StudyTestPage() {
  const [input, setInput] = useState(SAMPLE_INPUTS[0].content);
  const [result, setResult] = useState<FormattedOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'outline' | 'flashcards' | 'quiz' | 'topics'>('outline');

  const handleFormat = useCallback(async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formatted = await StudyNotesFormatter.format({
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

  const handleItemComplete = useCallback((itemId: string, type: 'definition' | 'question' | 'section') => {
    console.log('Item completed:', itemId, type);
    // Could implement progress tracking or analytics
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-handwritten text-orange-900 dark:text-orange-100 mb-2">
            📚 Study Notes Formatter Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Transform linear notes into structured study materials with outlines, Q&A, and flashcards
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
                  📝 Study Notes Input
                </span>
                <Button 
                  onClick={handleFormat}
                  disabled={isProcessing || !input.trim()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isProcessing ? 'Processing...' : 'Create Study Guide'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your class notes, textbook content, or study materials here..."
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

                  {/* Study Data Summary */}
                  {result.data.formatSpecific && (
                    <div className="grid grid-cols-4 gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {(result.data.formatSpecific as StudyNotesData).outline?.length || 0}
                        </div>
                        <div className="text-xs">Sections</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-purple-600 dark:text-purple-400">
                          {(result.data.formatSpecific as StudyNotesData).definitions?.length || 0}
                        </div>
                        <div className="text-xs">Definitions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600 dark:text-green-400">
                          {(result.data.formatSpecific as StudyNotesData).qaPairs?.length || 0}
                        </div>
                        <div className="text-xs">Questions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600 dark:text-orange-400">
                          {(result.data.formatSpecific as StudyNotesData).topics?.length || 0}
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
                  <p>Process some study notes to see the formatted output here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interactive Study Materials */}
        {result && (
          <div className="mt-8">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="font-handwritten text-orange-900 dark:text-orange-100">
                    🎨 Interactive Study Materials
                  </span>
                  
                  <div className="flex gap-2 flex-wrap">
                    {(['outline', 'flashcards', 'quiz', 'topics'] as const).map(mode => (
                      <Button
                        key={mode}
                        variant={displayMode === mode ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDisplayMode(mode)}
                        className="bg-orange-500 hover:bg-orange-600 capitalize"
                      >
                        {mode === 'flashcards' ? 'Flash Cards' : mode === 'topics' ? 'Topics' : mode}
                      </Button>
                    ))}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StudyDisplay 
                  data={result.data.formatSpecific as StudyNotesData}
                  displayMode={displayMode}
                  interactive={true}
                  onItemComplete={handleItemComplete}
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
                📋 Outline Creation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Converts linear notes into hierarchical outlines with sections and subsections
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-800 dark:text-purple-200 text-sm">
                🃏 Flashcards
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Extracts definitions and creates interactive flashcards for memorization
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800 dark:text-green-200 text-sm">
                ❓ Quiz Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-green-700 dark:text-green-300">
                Automatically generates Q&A pairs with difficulty levels for self-testing
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-800 dark:text-orange-200 text-sm">
                🎯 Priority Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Identifies and prioritizes key topics based on importance indicators
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
