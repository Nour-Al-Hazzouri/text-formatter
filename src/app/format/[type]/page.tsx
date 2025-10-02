'use client';

/**
 * Dynamic Format Page - Individual formatter pages
 * 
 * Handles all format types with their specific engines and display components
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { InputPane, OutputPane } from '@/components/formatter';
import { 
  MeetingNotesFormatter, 
  TaskListsFormatter,
  ShoppingListsFormatter,
  JournalNotesFormatter,
  ResearchNotesFormatter,
  StudyNotesFormatter
} from '@/lib/formatting';
import type { FormatType } from '@/types';
import type { FormattedOutput } from '@/types/formatting';

// Template examples for pre-loading
const TEMPLATE_EXAMPLES: Record<string, string> = {
  'meeting-notes-1': `Team Standup - March 15, 2024
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
  
  'task-lists-1': `Things to do this week:

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

  'shopping-lists-1': `Weekly Shopping List

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

  'journal-notes-1': `March 15th, 2024

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

  'research-notes-1': `Climate Change Impact on Agriculture - Research Notes
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

  'study-notes-1': `Biology 101 - Chapter 7: Cell Division
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
- Relationship between DNA damage and cell cycle arrest`
};

const FORMAT_INFO = {
  'meeting-notes': {
    title: 'Meeting Notes',
    description: 'Transform meeting discussions into organized notes with attendees, action items, and key decisions',
    icon: '📝'
  },
  'task-lists': {
    title: 'Task Lists', 
    description: 'Organize tasks by priority, category, and deadlines for better productivity',
    icon: '✅'
  },
  'shopping-lists': {
    title: 'Shopping Lists',
    description: 'Organize shopping items by store category and consolidate quantities',
    icon: '🛒'
  },
  'journal-notes': {
    title: 'Journal Notes',
    description: 'Process personal reflections with mood analysis and insight extraction',
    icon: '📔'
  },
  'research-notes': {
    title: 'Research Notes',
    description: 'Organize academic research with citations, sources, and structured analysis',
    icon: '📚'
  },
  'study-notes': {
    title: 'Study Notes',
    description: 'Create structured study materials with concepts, definitions, and review questions',
    icon: '🎓'
  }
};

export default function FormatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formatType = params?.type as FormatType;
  const exampleId = searchParams?.get('example');

  const [inputText, setInputText] = useState<string>('');
  const [formattedOutput, setFormattedOutput] = useState<FormattedOutput | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Load example template if specified
  useEffect(() => {
    if (exampleId && TEMPLATE_EXAMPLES[exampleId]) {
      setInputText(TEMPLATE_EXAMPLES[exampleId]);
    }
  }, [exampleId]);

  /**
   * Handle text formatting
   */
  const handleFormat = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    try {
      const inputPayload = {
        content: inputText,
        metadata: {
          source: 'type' as const,
          timestamp: new Date(),
          size: inputText.length,
        },
      };

      let result: FormattedOutput;

      // Format based on type
      switch (formatType) {
        case 'meeting-notes':
          result = await MeetingNotesFormatter.format(inputPayload);
          break;
        case 'task-lists':
          result = await TaskListsFormatter.format(inputPayload);
          break;
        case 'shopping-lists':
          result = await ShoppingListsFormatter.format(inputPayload);
          break;
        case 'journal-notes':
          result = await JournalNotesFormatter.format(inputPayload);
          break;
        case 'research-notes':
          result = await ResearchNotesFormatter.format(inputPayload);
          break;
        case 'study-notes':
          result = await StudyNotesFormatter.format(inputPayload);
          break;
        default:
          throw new Error(`Unknown format type: ${formatType}`);
      }
      
      setFormattedOutput(result);
    } catch (error) {
      console.error('Formatting error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, formatType]);

  /**
   * Handle export
   */
  const handleExport = () => {
    if (!formattedOutput) return;
    
    const blob = new Blob([formattedOutput.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted-${formatType}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatInfo = FORMAT_INFO[formatType];

  if (!formatInfo) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Format Type</h1>
          <p className="text-gray-600">The format type "{formatType}" is not supported.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showSidebar={false}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">{formatInfo.icon}</span>
            <h1 className="text-3xl font-handwritten font-bold text-gray-900">
              {formatInfo.title}
            </h1>
          </div>
          <p className="text-lg font-content text-gray-600 max-w-2xl mx-auto">
            {formatInfo.description}
          </p>
          {exampleId && (
            <div className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg inline-block">
              📋 Template example loaded - click "Format Text" to see the results!
            </div>
          )}
        </div>

        {/* Dual-Pane Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Pane */}
          <InputPane
            value={inputText}
            onChange={setInputText}
            onFormat={handleFormat}
            isProcessing={isProcessing}
            placeholder={`Enter your ${formatType.replace('-', ' ')} here...`}
          />

          {/* Output Pane */}
          <OutputPane
            formatType={formatType}
            formattedOutput={formattedOutput}
            originalText={inputText}
            isProcessing={isProcessing}
            showComparison={showComparison}
            onToggleComparison={() => setShowComparison(!showComparison)}
            onExport={handleExport}
          />
        </div>
      </div>
    </MainLayout>
  );
}
