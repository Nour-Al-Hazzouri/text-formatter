'use client';

/**
 * Shopping List Display Component - Interactive shopping list with checkboxes
 * 
 * Features:
 * - Interactive checkboxes for item completion
 * - Organized by store sections
 * - Quantity and unit display
 * - Item notes and categorization
 * - Modern orange theme styling
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { ShoppingListsData, ShoppingItem, ShoppingCategory } from '@/types/formatting';

interface ShoppingListDisplayProps {
  /** Shopping list data from formatter */
  data: ShoppingListsData;
  
  /** Whether the list is interactive */
  interactive?: boolean;
  
  /** Callback when item is checked/unchecked */
  onItemToggle?: (itemId: string, checked: boolean) => void;
  
  /** Display mode: store layout or alphabetical */
  displayMode?: 'store-layout' | 'alphabetical';
  
  /** Additional CSS classes */
  className?: string;
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

/**
 * Category icons for visual organization
 */
const CATEGORY_ICONS: Record<string, string> = {
  'Produce': '🥬',
  'Dairy': '🥛',
  'Meat & Seafood': '🥩',
  'Deli': '🧀',
  'Bakery': '🍞',
  'Pantry': '🌾',
  'Canned Goods': '🥫',
  'Snacks': '🍿',
  'Beverages': '🥤',
  'Frozen': '🧊',
  'Health & Beauty': '🧴',
  'Household': '🧽',
  'Other': '📦'
};

export function ShoppingListDisplay({
  data,
  interactive = true,
  onItemToggle,
  displayMode = 'store-layout',
  className = ''
}: ShoppingListDisplayProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set(data.items.filter(item => item.checked).map(item => item.id))
  );

  /**
   * Handle item check/uncheck
   */
  const handleItemToggle = useCallback((itemId: string, checked: boolean) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });

    onItemToggle?.(itemId, checked);
  }, [onItemToggle]);

  /**
   * Sort categories based on display mode
   */
  const sortedCategories = [...data.categories].sort((a, b) => {
    if (displayMode === 'store-layout') {
      const orderA = STORE_LAYOUT_ORDER.indexOf(a.name);
      const orderB = STORE_LAYOUT_ORDER.indexOf(b.name);
      
      // Put categories in store layout order, unknown categories at end
      if (orderA === -1 && orderB === -1) return a.name.localeCompare(b.name);
      if (orderA === -1) return 1;
      if (orderB === -1) return -1;
      
      return orderA - orderB;
    } else {
      // Alphabetical
      return a.name.localeCompare(b.name);
    }
  });

  /**
   * Get items for a category, sorted appropriately
   */
  const getCategoryItems = (category: ShoppingCategory): ShoppingItem[] => {
    const items = category.itemIds
      .map(id => data.items.find(item => item.id === id))
      .filter(Boolean) as ShoppingItem[];

    return items.sort((a, b) => a.name.localeCompare(b.name));
  };

  /**
   * Calculate completion stats
   */
  const completionStats = {
    total: data.stats.totalItems,
    completed: checkedItems.size,
    percentage: data.stats.totalItems > 0 
      ? Math.round((checkedItems.size / data.stats.totalItems) * 100) 
      : 0
  };

  return (
    <div className={`shopping-list-display ${className}`}>
      {/* Header with stats */}
      <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-handwritten text-orange-900 dark:text-orange-100 mb-1">
              🛒 Shopping List
            </h2>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {completionStats.total} items across {data.stats.totalCategories} categories
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {completionStats.percentage}%
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              {completionStats.completed} / {completionStats.total} complete
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full bg-orange-200 dark:bg-orange-900 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${completionStats.percentage}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {sortedCategories.map((category) => {
          const items = getCategoryItems(category);
          const categoryIcon = CATEGORY_ICONS[category.name] || CATEGORY_ICONS['Other'];
          const completedInCategory = items.filter(item => checkedItems.has(item.id)).length;
          
          return (
            <Card key={category.name} className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-orange-900 dark:text-orange-100">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{categoryIcon}</span>
                    <span className="font-handwritten">{category.name}</span>
                  </div>
                  
                  <div className="text-sm font-content text-orange-600 dark:text-orange-400">
                    {completedInCategory} / {items.length}
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2">
                  {items.map((item) => {
                    const isChecked = checkedItems.has(item.id);
                    
                    return (
                      <div 
                        key={item.id}
                        className={`flex items-center gap-3 p-2 rounded-md transition-all duration-200 ${
                          isChecked 
                            ? 'bg-orange-50 dark:bg-orange-950/30 opacity-60' 
                            : 'hover:bg-orange-50 dark:hover:bg-orange-950/20'
                        }`}
                      >
                        {/* Checkbox */}
                        <Checkbox
                          id={item.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => 
                            handleItemToggle(item.id, checked as boolean)
                          }
                          disabled={!interactive}
                          className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />

                        {/* Item content */}
                        <label 
                          htmlFor={item.id} 
                          className={`flex-1 cursor-pointer ${
                            isChecked ? 'line-through' : ''
                          }`}
                        >
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                              {/* Quantity and unit */}
                              {(item.quantity || item.unit) && (
                                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                  {item.quantity} {item.unit}
                                </span>
                              )}
                              
                              {/* Item name */}
                              <span className="text-gray-900 dark:text-gray-100">
                                {item.name}
                              </span>
                            </div>

                            {/* Estimated price */}
                            {item.estimatedPrice && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ${item.estimatedPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Notes */}
                          {item.notes && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                              {item.notes}
                            </div>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer with helpful tips */}
      <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-1">
          💡 <strong>Shopping Tips:</strong>
        </p>
        <ul className="space-y-1 text-xs ml-4">
          <li>• Items are organized by store layout for efficient shopping</li>
          <li>• Check off items as you shop to track progress</li>
          <li>• Quantities and notes help ensure you get exactly what you need</li>
        </ul>
      </div>
    </div>
  );
}
