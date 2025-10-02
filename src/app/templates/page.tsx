'use client';

/**
 * Templates Page - Template library and examples
 * 
 * Showcases all formatter capabilities with example templates and use cases
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { FormatType } from '@/types';

interface TemplateExample {
  id: string;
  title: string;
  description: string;
  format: FormatType;
  icon: string;
  sampleInput: string;
  expectedFeatures: string[];
}

const TEMPLATE_EXAMPLES: TemplateExample[] = [
  {
    id: 'meeting-notes-1',
    title: 'Team Standup Meeting',
    description: 'Daily standup with attendees, discussions, and action items',
    format: 'meeting-notes',
    icon: '📝',
    sampleInput: `Team Standup - March 15, 2024
Present: John Smith (Lead), Sarah Connor (Designer), Mike Johnson (Developer), Lisa Wang (PM)
Absent: Tom Wilson (sick leave)

John: Completed user authentication module, working on API integration today
Sarah: Finished mobile mockups, need feedback from Lisa before finalizing
Mike: Fixed 3 bugs yesterday, starting work on payment integration
Lisa: Sprint planning went well, coordinating with stakeholders

Issues:
- API documentation is outdated (Mike)
- Need approval for design changes (Sarah)
- Testing environment is slow (John)

Actions:
- Mike will update API docs by Friday
- Lisa to schedule design review with stakeholders by Tuesday
- John to contact DevOps about testing environment performance

Next meeting: Tomorrow 9 AM`,
    expectedFeatures: [
      'Attendee identification and roles',
      'Action item extraction with assignees and deadlines',
      'Issue tracking and categorization',
      'Meeting metadata (date, time, participants)',
      'Discussion point organization',
      'Next steps and follow-ups'
    ]
  },
  {
    id: 'task-lists-1',
    title: 'Personal Productivity',
    description: 'Mixed priority tasks with deadlines and categories',
    format: 'task-lists',
    icon: '✅',
    sampleInput: `Things to do this week:

URGENT - Submit tax documents by March 31st
Call dentist to schedule cleaning appointment
Buy groceries: milk, eggs, bread, apples
IMPORTANT: Prepare presentation for client meeting Thursday
Fix leaky faucet in kitchen
Schedule oil change for car (due soon)
HIGH PRIORITY - Review contract details before signing
Read 2 chapters of productivity book
Plan weekend trip with family
Reply to Sarah's email about project
LOW - Organize closet and donate old clothes
Update LinkedIn profile
Pay electric bill (due March 20th)
ASAP - Confirm dinner reservation for anniversary`,
    expectedFeatures: [
      'Priority level detection (URGENT, HIGH, LOW, ASAP)',
      'Deadline extraction and parsing',
      'Task categorization (personal, work, errands)',
      'Actionable item identification',
      'Sub-task breakdown for complex items',
      'Due date highlighting and sorting'
    ]
  },
  {
    id: 'shopping-lists-1',
    title: 'Weekly Grocery Run',
    description: 'Comprehensive shopping list with quantities and store organization',
    format: 'shopping-lists',
    icon: '🛒',
    sampleInput: `Weekly Shopping List

Need for recipes this week:
2 lbs ground beef for tacos
1 bag whole wheat tortillas
2 cans black beans
Shredded cheese (cheddar and monterey jack)
1 large onion
3 bell peppers (red, yellow, green)
Cilantro and lime

Pantry staples:
Olive oil
Salt and black pepper
Garlic powder
Rice (jasmine, 5 lb bag)
Pasta (penne and spaghetti)
Canned tomatoes (3 cans)

Fresh produce:
Bananas (bunch)
Apples (gala, 3 lbs)
Spinach (organic bag)
Carrots (2 lbs)
Avocados (4 ripe)
Lemons (6 count)

Dairy and eggs:
Milk (2% gallon)
Greek yogurt (vanilla, large container)
Butter (unsalted)
Eggs (18 count)
Cream cheese

Meat and seafood:
Chicken breast (3 lbs)
Salmon fillets (4 pieces)
Turkey deli meat (honey roasted)

Frozen:
Frozen berries for smoothies
Ice cream (vanilla)
Frozen vegetables (broccoli mix)

Household:
Laundry detergent
Paper towels (6 pack)
Toilet paper
Dish soap`,
    expectedFeatures: [
      'Store section categorization (Produce, Dairy, Meat, etc.)',
      'Quantity parsing and standardization',
      'Duplicate item consolidation',
      'Brand and specification recognition',
      'Recipe ingredient grouping',
      'Shopping route optimization by store layout'
    ]
  },
  {
    id: 'journal-notes-1',
    title: 'Personal Reflection',
    description: 'Stream-of-consciousness journal with emotions and insights',
    format: 'journal-notes',
    icon: '📔',
    sampleInput: `March 15th, 2024

Woke up feeling really anxious about the presentation today. Had that familiar knot in my stomach that I get before big meetings. But you know what? I think I'm getting better at recognizing these feelings instead of just letting them overwhelm me.

The presentation actually went really well! Sarah said my slides were clear and engaging. I've been working so hard on public speaking and it's finally paying off. "Success is not final, failure is not fatal: it is the courage to continue that counts" - that Churchill quote kept running through my head.

Realized something important today - I've been so focused on being perfect that I forget to celebrate small wins. Like today, I spoke up in the meeting when I disagreed with Tom's approach. Old me would have stayed quiet. That's growth, right?

Feeling grateful for:
- My supportive team
- The confidence I'm building 
- Having a job I actually enjoy (most days)

Tomorrow I want to reach out to Mom, haven't talked to her in a week. Also need to remember to take breaks between meetings. I noticed I was rushing from one thing to the next without breathing.

#growth #confidence #gratitude #selfcare

The sunset tonight was incredible - reminded me to slow down and notice beauty in ordinary moments.`,
    expectedFeatures: [
      'Timestamp detection and organization',
      'Emotional tone analysis (anxious, grateful, confident)',
      'Quote extraction and attribution',
      'Insight and learning identification',
      'Topic and hashtag recognition',
      'Paragraph organization from stream-of-consciousness',
      'Mood tracking and progression'
    ]
  },
  {
    id: 'research-notes-1',
    title: 'Academic Research',
    description: 'Research notes with citations, sources, and academic structure',
    format: 'research-notes',
    icon: '📚',
    sampleInput: `Climate Change Impact on Agriculture - Research Notes
March 15, 2024

Literature Review Findings:

According to Smith et al. (2023), "climate change is fundamentally altering agricultural productivity patterns across temperate regions" (p. 145). This finding is particularly significant given the 15% increase in temperature variability observed over the past decade.

Key Studies:
1. Johnson & Williams (2022) - "Drought Effects on Corn Yields in Midwest"
   - Sample size: 500 farms across 5 states
   - Methodology: 10-year longitudinal study
   - Key finding: 23% yield reduction during extreme drought years
   - Limitation: Did not account for irrigation technology improvements

2. Zhang, Li, & Brown (2023) - "Adaptation Strategies in Rice Production"
   - Published in Journal of Agricultural Science, Vol. 45, Issue 3
   - DOI: 10.1234/jas.2023.0567
   - Notable quote: "Traditional farming methods show remarkable resilience when combined with modern climate monitoring" (Zhang et al., 2023, p. 78)

Research Questions Emerging:
- How do small-scale vs. industrial farms differ in climate adaptation?
- What role does government policy play in farmer adaptation decisions?
- Can technology bridge the gap between traditional and modern approaches?

Methodology for Primary Research:
- Mixed methods approach
- Survey of 200 farmers in three climate regions
- In-depth interviews with 30 participants
- Statistical analysis using SPSS

Sources to Follow Up:
- Martinez (2024) - upcoming publication on soil health
- Conference proceedings from AgTech Summit 2023
- IPCC Report Chapter 7 on regional impacts

Personal Insights:
The connection between climate variability and food security is more nuanced than initially assumed. Need to explore the intersection of technology adoption and traditional knowledge systems.`,
    expectedFeatures: [
      'Citation parsing and formatting (APA, MLA, Chicago)',
      'Source organization and bibliography generation',
      'Quote extraction with attribution',
      'Research question identification',
      'Methodology section recognition',
      'Academic terminology and jargon handling',
      'Reference linking and cross-referencing',
      'Topic categorization and tagging'
    ]
  },
  {
    id: 'study-notes-1',
    title: 'Biology Study Session',
    description: 'Comprehensive study notes with concepts, definitions, and review questions',
    format: 'study-notes',
    icon: '🎓',
    sampleInput: `Biology 101 - Chapter 7: Cell Division
Study Session: March 15, 2024

MAIN TOPICS:
Mitosis vs Meiosis
Cell Cycle Regulation
Cancer and Cell Division

IMPORTANT DEFINITIONS:
Mitosis = process where one cell divides to produce two genetically identical diploid cells
Meiosis = process that produces four genetically different haploid gametes from one diploid cell
Chromosome = structure containing DNA and proteins
Chromatid = one half of a duplicated chromosome

KEY CONCEPTS TO REMEMBER:
1. Mitosis phases: Prophase, Metaphase, Anaphase, Telophase (PMAT)
2. Meiosis has TWO divisions: Meiosis I (reduction) and Meiosis II (similar to mitosis)
3. Crossing over occurs in Prophase I of meiosis - creates genetic diversity
4. Cell cycle checkpoints prevent damaged cells from dividing

IMPORTANT FACTS:
- Humans have 46 chromosomes (23 pairs)
- Gametes have 23 chromosomes (haploid)
- Cancer occurs when cell cycle checkpoints fail
- Tumor suppressor genes like p53 are crucial for preventing cancer

FORMULAS/CALCULATIONS:
If organism has diploid number 2n = 16, then:
- Haploid number n = 8
- Gametes will have 8 chromosomes
- After fertilization: 8 + 8 = 16 chromosomes restored

REVIEW QUESTIONS:
Q: What would happen if crossing over didn't occur in meiosis?
A: Genetic diversity would be greatly reduced, offspring would be more similar to parents

Q: Why is mitosis important for multicellular organisms?
A: Growth, repair, replacement of damaged cells, asexual reproduction

Q: How do cancer cells differ from normal cells in terms of cell division?
A: Cancer cells ignore checkpoints, divide uncontrollably, don't respond to growth inhibition signals

STUDY TIPS:
- Draw diagrams of mitosis and meiosis phases
- Practice calculating chromosome numbers
- Make flashcards for key terms
- Connect concepts to real-world examples (cancer, reproduction)

EXAM PREPARATION:
Focus areas for next exam:
1. Diagram labeling (phases of cell division)
2. Comparing mitosis vs meiosis table
3. Problem solving with chromosome numbers
4. Essay question on cancer development

Need to review:
- Specific proteins involved in cell cycle regulation
- Examples of tumor suppressor genes
- Relationship between DNA damage and cell cycle arrest`,
    expectedFeatures: [
      'Topic extraction and hierarchical organization',
      'Definition identification and formatting',
      'Key concept highlighting and categorization',
      'Formula and calculation recognition',
      'Q&A pair extraction and formatting',
      'Study tip and strategy identification',
      'Exam preparation section organization',
      'Cross-reference and connection mapping'
    ]
  }
];

export default function TemplatesPage() {
  const [selectedExample, setSelectedExample] = useState<TemplateExample | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);

  const handleTryExample = async (example: TemplateExample) => {
    setSelectedExample(example);
    setIsFormatting(true);
    
    // Simulate formatting process
    setTimeout(() => {
      setIsFormatting(false);
      // In a real implementation, this would navigate to the formatter with the example
      window.location.href = `/format/${example.format}?example=${example.id}`;
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-handwritten text-orange-900 dark:text-orange-100 mb-4">
            📄 Template Examples & Use Cases
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore comprehensive examples showcasing all formatter capabilities. 
            Each template demonstrates the full range of features and intelligent processing for different content types.
          </p>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {TEMPLATE_EXAMPLES.map((example) => (
            <Card key={example.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{example.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{example.title}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {example.format.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {example.description}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Features showcase */}
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Demonstrates:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {example.expectedFeatures.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {example.expectedFeatures.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{example.expectedFeatures.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Preview:
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs text-gray-700 dark:text-gray-300 font-mono max-h-20 overflow-hidden">
                      {example.sampleInput.substring(0, 150)}...
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleTryExample(example)}
                    disabled={isFormatting}
                    className="w-full"
                  >
                    {isFormatting && selectedExample?.id === example.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Try This Example'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed View */}
        {selectedExample && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-2xl">{selectedExample.icon}</span>
                {selectedExample.title} - Detailed View
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  All Features Demonstrated:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedExample.expectedFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Complete Sample Input:
                </h4>
                <Textarea
                  value={selectedExample.sampleInput}
                  readOnly
                  className="font-mono text-sm min-h-[300px]"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => handleTryExample(selectedExample)}
                  disabled={isFormatting}
                >
                  Format This Example
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedExample(null)}
                >
                  Close Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
