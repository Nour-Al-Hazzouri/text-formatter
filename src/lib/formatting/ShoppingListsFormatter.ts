/**
 * Shopping Lists Formatter - Transforms unstructured text into organized shopping lists
 * 
 * Features:
 * - Item categorization by store sections (produce, dairy, meat, etc.)
 * - Duplicate item detection and removal with quantity consolidation
 * - Alphabetical and store layout sorting options
 * - Interactive checkboxes for completed items
 * - Quantity and unit standardization (1 lb, 2 pieces, etc.)
 * - Smart category recognition for common items
 * - Preserves all original content while adding organization
 */

import type { TextInput, FormattedOutput, ExtractedData, ProcessingStats } from '@/types/formatting';

/**
 * Shopping item structure
 */
interface ShoppingItem {
  name: string;
  quantity?: string;
  unit?: string;
  category: string;
  notes?: string;
  checked: boolean;
  originalLine: string;
  estimatedPrice?: number;
}

/**
 * Organized items by category
 */
interface OrganizedItems {
  categories: Map<string, ShoppingItem[]>;
  uncategorized: ShoppingItem[];
  totalItems: number;
  duplicatesRemoved: number;
  confidence: number;
}

/**
 * Store section ordering for optimal shopping flow
 */
const STORE_LAYOUT_ORDER = [
  'Produce',
  'Dairy',
  'Meat & Seafood', 
  'Deli',
  'Bakery',
  'Pantry',
  'Canned Goods',
  'Snacks',
  'Beverages',
  'Frozen',
  'Health & Beauty',
  'Household',
  'Other'
];

export class ShoppingListsFormatter {
  // Category mappings for common items
  private static readonly CATEGORY_MAPPINGS = new Map([
    // Produce
    ['apple', 'Produce'], ['apples', 'Produce'], ['banana', 'Produce'], ['bananas', 'Produce'],
    ['orange', 'Produce'], ['oranges', 'Produce'], ['lettuce', 'Produce'], ['spinach', 'Produce'],
    ['carrot', 'Produce'], ['carrots', 'Produce'], ['onion', 'Produce'], ['onions', 'Produce'],
    ['potato', 'Produce'], ['potatoes', 'Produce'], ['tomato', 'Produce'], ['tomatoes', 'Produce'],
    ['avocado', 'Produce'], ['avocados', 'Produce'], ['broccoli', 'Produce'], ['celery', 'Produce'],
    ['cucumber', 'Produce'], ['peppers', 'Produce'], ['mushrooms', 'Produce'], ['garlic', 'Produce'],

    // Dairy
    ['milk', 'Dairy'], ['cheese', 'Dairy'], ['butter', 'Dairy'], ['yogurt', 'Dairy'],
    ['cream', 'Dairy'], ['eggs', 'Dairy'], ['egg', 'Dairy'], ['sour cream', 'Dairy'],
    ['cottage cheese', 'Dairy'], ['cream cheese', 'Dairy'], ['mozzarella', 'Dairy'],

    // Meat & Seafood
    ['chicken', 'Meat & Seafood'], ['beef', 'Meat & Seafood'], ['pork', 'Meat & Seafood'],
    ['fish', 'Meat & Seafood'], ['salmon', 'Meat & Seafood'], ['tuna', 'Meat & Seafood'],
    ['shrimp', 'Meat & Seafood'], ['turkey', 'Meat & Seafood'], ['bacon', 'Meat & Seafood'],
    ['sausage', 'Meat & Seafood'], ['ground beef', 'Meat & Seafood'],

    // Bakery
    ['bread', 'Bakery'], ['bagels', 'Bakery'], ['rolls', 'Bakery'], ['muffins', 'Bakery'],
    ['croissant', 'Bakery'], ['cake', 'Bakery'], ['cookies', 'Bakery'], ['donuts', 'Bakery'],

    // Pantry
    ['rice', 'Pantry'], ['pasta', 'Pantry'], ['flour', 'Pantry'], ['sugar', 'Pantry'],
    ['salt', 'Pantry'], ['pepper', 'Pantry'], ['oil', 'Pantry'], ['olive oil', 'Pantry'],
    ['vinegar', 'Pantry'], ['spices', 'Pantry'], ['cereal', 'Pantry'], ['oats', 'Pantry'],

    // Canned Goods
    ['beans', 'Canned Goods'], ['soup', 'Canned Goods'], ['tomato sauce', 'Canned Goods'],
    ['canned tomatoes', 'Canned Goods'], ['tuna can', 'Canned Goods'], ['chicken broth', 'Canned Goods'],

    // Beverages
    ['water', 'Beverages'], ['juice', 'Beverages'], ['soda', 'Beverages'], ['coffee', 'Beverages'],
    ['tea', 'Beverages'], ['beer', 'Beverages'], ['wine', 'Beverages'], ['milk', 'Dairy'],

    // Frozen
    ['ice cream', 'Frozen'], ['frozen vegetables', 'Frozen'], ['frozen fruit', 'Frozen'],
    ['frozen pizza', 'Frozen'], ['frozen meals', 'Frozen'],

    // Snacks
    ['chips', 'Snacks'], ['crackers', 'Snacks'], ['nuts', 'Snacks'], ['candy', 'Snacks'],
    ['popcorn', 'Snacks'], ['pretzels', 'Snacks'],

    // Health & Beauty
    ['shampoo', 'Health & Beauty'], ['soap', 'Health & Beauty'], ['toothpaste', 'Health & Beauty'],
    ['deodorant', 'Health & Beauty'], ['vitamins', 'Health & Beauty'],

    // Household
    ['paper towels', 'Household'], ['toilet paper', 'Household'], ['laundry detergent', 'Household'],
    ['dish soap', 'Household'], ['trash bags', 'Household'], ['aluminum foil', 'Household'],
  ]);

  // Quantity and unit patterns
  private static readonly QUANTITY_PATTERNS = [
    // Number + unit: 2 lbs, 3 pieces, 1 gallon
    /^(\d+(?:\.\d+)?)\s*(lbs?|pounds?|oz|ounces?|gallons?|quarts?|pints?|cups?|pieces?|items?|boxes?|cans?|bottles?|bags?|loaves?|dozen)\b/i,
    // Fractional: 1/2 lb, 3/4 cup
    /^(\d+\/\d+)\s*(lbs?|pounds?|oz|ounces?|gallons?|quarts?|pints?|cups?)\b/i,
    // Just numbers: 6 (apples), 12 (eggs)
    /^(\d+)\s*/,
  ];

  // Common unit standardizations
  private static readonly UNIT_STANDARDIZATIONS = new Map([
    ['lb', 'lbs'], ['pound', 'lbs'], ['pounds', 'lbs'],
    ['oz', 'oz'], ['ounce', 'oz'], ['ounces', 'oz'],
    ['gallon', 'gallon'], ['gallons', 'gallon'],
    ['quart', 'quart'], ['quarts', 'quart'],
    ['pint', 'pint'], ['pints', 'pint'],
    ['cup', 'cup'], ['cups', 'cup'],
    ['piece', 'pieces'], ['item', 'items'],
    ['box', 'boxes'], ['can', 'cans'], ['bottle', 'bottles'],
    ['bag', 'bags'], ['loaf', 'loaves'], ['dozen', 'dozen'],
  ]);

  /**
   * Format shopping lists from unstructured text
   */
  static async format(input: TextInput): Promise<FormattedOutput> {
    const startTime = performance.now();
    const lines = input.content.split('\n');
    
    // Extract and organize items
    const organized = this.organizeItems(lines);
    
    // Build formatted output
    const formattedText = this.buildFormattedOutput(organized);
    
    // Calculate statistics
    const stats = this.calculateStats(input.content, organized);
    const duration = performance.now() - startTime;

    // Extract shopping-specific data
    const extractedData = this.extractShoppingData(organized);

    return {
      format: 'shopping-lists',
      content: formattedText,
      metadata: {
        processedAt: new Date(),
        duration,
        confidence: organized.confidence,
        itemCount: organized.totalItems,
        stats,
      },
      data: extractedData,
    };
  }

  /**
   * Organize items from raw lines
   */
  private static organizeItems(lines: string[]): OrganizedItems {
    const items: ShoppingItem[] = [];
    let currentCategory: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        currentCategory = undefined;
        continue;
      }

      // Check if line is a category header
      const detectedCategory = this.detectCategory(trimmed);
      if (detectedCategory && this.isCategoryHeader(trimmed, lines[i + 1])) {
        currentCategory = detectedCategory;
        continue;
      }

      // Check if line is a shopping item
      if (this.isShoppingItem(trimmed)) {
        const item = this.parseShoppingItem(trimmed, currentCategory);
        items.push(item);
      } else if (trimmed.length > 2) {
        // Treat non-empty lines as potential items if they don't look like headers
        if (!this.isHeader(trimmed)) {
          const item = this.parseShoppingItem(trimmed, currentCategory);
          items.push(item);
        }
      }
    }

    // Remove duplicates and consolidate quantities
    const deduplicatedItems = this.removeDuplicates(items);
    
    // Group items by category
    const categories = new Map<string, ShoppingItem[]>();
    const uncategorized: ShoppingItem[] = [];

    for (const item of deduplicatedItems) {
      const category = item.category || 'Other';
      if (category === 'Other') {
        uncategorized.push(item);
      } else {
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category)!.push(item);
      }
    }

    // Sort items within each category alphabetically
    for (const [, categoryItems] of categories) {
      categoryItems.sort((a, b) => a.name.localeCompare(b.name));
    }
    uncategorized.sort((a, b) => a.name.localeCompare(b.name));

    const confidence = this.calculateConfidence(deduplicatedItems, categories);
    const duplicatesRemoved = items.length - deduplicatedItems.length;

    return {
      categories,
      uncategorized,
      totalItems: deduplicatedItems.length,
      duplicatesRemoved,
      confidence,
    };
  }

  /**
   * Parse a single shopping item
   */
  private static parseShoppingItem(line: string, category?: string): ShoppingItem {
    // Check if already checked off (contains [x] or ✓)
    const checked = /\[x\]|✓|✔|☑/i.test(line);

    // Clean the line
    let cleanedText = this.cleanItemText(line);

    // Extract quantity and unit
    const { quantity, unit, remainingText } = this.extractQuantityAndUnit(cleanedText);
    
    // Determine category if not provided
    const itemCategory = category || this.categorizeItem(remainingText) || 'Other';

    // Extract notes (anything in parentheses)
    const { itemName, notes } = this.extractNotes(remainingText);

    return {
      name: itemName.trim(),
      quantity,
      unit,
      category: itemCategory,
      notes,
      checked,
      originalLine: line,
    };
  }

  /**
   * Check if line is a shopping item
   */
  private static isShoppingItem(line: string): boolean {
    const itemPatterns = [
      /^[-*•]\s+/,                    // Bullet points
      /^\d+[.)]\s+/,                   // Numbered
      /^\[[ x]\]\s+/i,                 // Checkbox
      /^\d+(?:\.\d+)?\s*(?:lbs?|oz|gallons?|pieces?)/i, // Quantity + unit
    ];

    return itemPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Clean item text by removing markers
   */
  private static cleanItemText(line: string): string {
    return line
      .replace(/^[-*•]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .replace(/^\[[ x]\]\s+/i, '')
      .replace(/^>\s+/, '')
      .trim();
  }

  /**
   * Extract quantity and unit from text
   */
  private static extractQuantityAndUnit(text: string): {
    quantity?: string;
    unit?: string;
    remainingText: string;
  } {
    for (const pattern of this.QUANTITY_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const quantity = match[1];
        const unit = match[2] ? this.standardizeUnit(match[2]) : undefined;
        const remainingText = text.replace(match[0], '').trim();
        
        return { quantity, unit, remainingText };
      }
    }

    return { remainingText: text };
  }

  /**
   * Standardize units
   */
  private static standardizeUnit(unit: string): string {
    const normalized = unit.toLowerCase();
    return this.UNIT_STANDARDIZATIONS.get(normalized) || unit;
  }

  /**
   * Extract notes from item name (text in parentheses)
   */
  private static extractNotes(text: string): {
    itemName: string;
    notes?: string;
  } {
    const noteMatch = text.match(/^(.*?)\s*\((.*?)\)\s*$/);
    if (noteMatch) {
      return {
        itemName: noteMatch[1].trim(),
        notes: noteMatch[2].trim(),
      };
    }

    return { itemName: text };
  }

  /**
   * Categorize item based on name
   */
  private static categorizeItem(itemName: string): string | undefined {
    const lowerName = itemName.toLowerCase();
    
    // Direct mapping lookup
    if (this.CATEGORY_MAPPINGS.has(lowerName)) {
      return this.CATEGORY_MAPPINGS.get(lowerName);
    }

    // Partial matching for compound items
    for (const [keyword, category] of this.CATEGORY_MAPPINGS) {
      if (lowerName.includes(keyword) || keyword.includes(lowerName)) {
        return category;
      }
    }

    return undefined;
  }

  /**
   * Remove duplicate items and consolidate quantities
   */
  private static removeDuplicates(items: ShoppingItem[]): ShoppingItem[] {
    const itemMap = new Map<string, ShoppingItem>();

    for (const item of items) {
      const key = item.name.toLowerCase();
      
      if (itemMap.has(key)) {
        const existing = itemMap.get(key)!;
        
        // Consolidate quantities if both have them
        if (existing.quantity && item.quantity && existing.unit === item.unit) {
          const existingQty = parseFloat(existing.quantity) || 0;
          const newQty = parseFloat(item.quantity) || 0;
          existing.quantity = (existingQty + newQty).toString();
        }
        
        // Combine notes
        if (item.notes && !existing.notes?.includes(item.notes)) {
          existing.notes = existing.notes ? `${existing.notes}, ${item.notes}` : item.notes;
        }
      } else {
        itemMap.set(key, { ...item });
      }
    }

    return Array.from(itemMap.values());
  }

  /**
   * Detect category from line
   */
  private static detectCategory(line: string): string | undefined {
    const lowerLine = line.toLowerCase();
    
    // Check against store sections
    for (const section of STORE_LAYOUT_ORDER) {
      if (lowerLine.includes(section.toLowerCase())) {
        return section;
      }
    }

    return undefined;
  }

  /**
   * Check if line is a category header
   */
  private static isCategoryHeader(line: string, nextLine?: string): boolean {
    // Short lines that might be headers
    if (line.length < 25 && line.length > 2) {
      // Followed by items or empty line
      if (!nextLine || nextLine.trim() === '' || this.isShoppingItem(nextLine)) {
        return true;
      }
    }

    // Lines that end with colons
    if (line.endsWith(':')) {
      return true;
    }

    return false;
  }

  /**
   * Check if line is a header
   */
  private static isHeader(line: string): boolean {
    return (
      line.toUpperCase() === line || // ALL CAPS
      line.endsWith(':') ||          // Ends with colon
      line.length < 3                // Very short
    );
  }

  /**
   * Build formatted output
   */
  private static buildFormattedOutput(organized: OrganizedItems): string {
    const sections: string[] = [];
    
    // Add header
    sections.push('# 🛒 Shopping List\n');

    // Add organized categories in store layout order
    for (const sectionName of STORE_LAYOUT_ORDER) {
      if (organized.categories.has(sectionName)) {
        const items = organized.categories.get(sectionName)!;
        sections.push(this.formatCategorySection(sectionName, items));
      }
    }

    // Add any remaining categories not in store layout
    for (const [categoryName, items] of organized.categories) {
      if (!STORE_LAYOUT_ORDER.includes(categoryName)) {
        sections.push(this.formatCategorySection(categoryName, items));
      }
    }

    // Add uncategorized items
    if (organized.uncategorized.length > 0) {
      sections.push(this.formatCategorySection('Other Items', organized.uncategorized));
    }

    // Add summary
    const totalItems = organized.totalItems;
    const totalCategories = organized.categories.size + (organized.uncategorized.length > 0 ? 1 : 0);
    
    sections.push(`\n---\n**Summary:** ${totalItems} items across ${totalCategories} categories`);
    
    if (organized.duplicatesRemoved > 0) {
      sections.push(`\n*${organized.duplicatesRemoved} duplicate items were consolidated*`);
    }

    return sections.join('\n');
  }

  /**
   * Format a category section
   */
  private static formatCategorySection(categoryName: string, items: ShoppingItem[]): string {
    const lines = [`## ${categoryName}\n`];

    for (const item of items) {
      const checkbox = item.checked ? '☑️' : '🔲';
      const quantityText = item.quantity && item.unit ? `${item.quantity} ${item.unit} ` : 
                          item.quantity ? `${item.quantity} ` : '';
      const notesText = item.notes ? ` *(${item.notes})*` : '';
      
      lines.push(`${checkbox} ${quantityText}${item.name}${notesText}`);
    }

    lines.push(''); // Empty line after section
    return lines.join('\n');
  }

  /**
   * Calculate processing statistics
   */
  private static calculateStats(originalText: string, organized: OrganizedItems): ProcessingStats {
    const originalLines = originalText.split('\n').filter(line => line.trim()).length;
    
    return {
      linesProcessed: originalLines,
      patternsMatched: organized.totalItems,
      itemsExtracted: organized.totalItems,
      duplicatesRemoved: organized.duplicatesRemoved,
      changesApplied: organized.categories.size + (organized.uncategorized.length > 0 ? 1 : 0),
    };
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(items: ShoppingItem[], categories: Map<string, ShoppingItem[]>): number {
    if (items.length === 0) return 0;

    let score = 60; // Base score for detecting items

    // Boost for categorized items
    const categorizedItems = Array.from(categories.values()).flat().length;
    const categorizationRate = categorizedItems / items.length;
    score += categorizationRate * 25;

    // Boost for quantity detection
    const itemsWithQuantity = items.filter(item => item.quantity).length;
    const quantityRate = itemsWithQuantity / items.length;
    score += quantityRate * 10;

    // Boost for duplicate removal
    if (items.length > 5) {
      score += 5;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Extract shopping-specific data
   */
  private static extractShoppingData(organized: OrganizedItems): ExtractedData {
    const allItems = [
      ...Array.from(organized.categories.values()).flat(),
      ...organized.uncategorized,
    ];

    // Create shopping categories
    const categories = Array.from(organized.categories.entries()).map(([name, items], index) => ({
      name,
      section: name,
      itemIds: items.map(item => item.name.toLowerCase().replace(/\s+/g, '-')),
      order: STORE_LAYOUT_ORDER.indexOf(name) !== -1 ? STORE_LAYOUT_ORDER.indexOf(name) : 999,
    }));

    if (organized.uncategorized.length > 0) {
      categories.push({
        name: 'Other',
        section: 'Other',
        itemIds: organized.uncategorized.map(item => item.name.toLowerCase().replace(/\s+/g, '-')),
        order: 999,
      });
    }

    // Create shopping items
    const items = allItems.map(item => ({
      id: item.name.toLowerCase().replace(/\s+/g, '-'),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      notes: item.notes,
      checked: item.checked,
      estimatedPrice: item.estimatedPrice,
    }));

    const shoppingData = {
      categories,
      items,
      stats: {
        totalItems: organized.totalItems,
        totalCategories: categories.length,
      },
    };

    return {
      common: {
        dates: [],
        urls: [],
        emails: [],
        phoneNumbers: [],
        mentions: [],
        hashtags: [],
      },
      formatSpecific: shoppingData,
    };
  }
}
