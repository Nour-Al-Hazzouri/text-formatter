/**
 * useAppState - Comprehensive application state management hooks
 * 
 * Provides high-level hooks that combine multiple contexts for common use cases
 * Optimized for React 18 concurrent features and performance
 */

import React, { useCallback, useMemo } from 'react';

// Import individual context hooks
import { useFormatting, useFormattingInput, useFormatSelection } from './FormattingContext';
import { useTheme, useThemeMode } from './ThemeContext';
import { useProcessing, useTextProcessor } from './ProcessingContext';
import { usePreferences, useFormatRecommendations } from './PreferencesContext';
import { useGlobalErrors } from './ErrorBoundary';

// Import types
import type { FormatType, ExportFormat } from '@/types/index';
import type { TextInput } from '@/types/formatting';

// ============================================================================
// Combined Application State Hook
// ============================================================================

/**
 * Main application state hook that provides access to all contexts
 */
export function useAppState() {
  const formatting = useFormatting();
  const theme = useTheme();
  const processing = useProcessing();
  const preferences = usePreferences();
  const errors = useGlobalErrors();
  
  return useMemo(() => ({
    // Context states
    formatting: formatting.state,
    theme: theme.state,
    processing: processing.state,
    preferences: preferences.state,
    errors: errors.errors,
    
    // Context actions
    actions: {
      formatting: formatting.actions,
      theme: theme.actions,
      processing: processing.actions,
      preferences: preferences.preferences,
      errors: {
        clear: errors.clearError,
        clearAll: errors.clearAllErrors,
      },
    },
    
    // Computed values
    computed: {
      formatting: formatting.computed,
      theme: theme.computed,
      processing: processing.computed,
    },
    
    // Concurrent features
    concurrent: formatting.concurrent,
  }), [formatting, theme, processing, preferences, errors]);
}

// ============================================================================
// Text Processing Workflow Hook
// ============================================================================

/**
 * Hook for managing the complete text processing workflow
 */
export function useTextWorkflow() {
  const { updateInput, textStats, isPending } = useFormattingInput();
  const { selectFormat, selectedFormat, detectedFormat, autoDetectEnabled } = useFormatSelection();
  const { processText, isReady } = useTextProcessor();
  const { recordUsage } = usePreferences().stats;
  const formatting = useFormatting();
  
  const processTextWithWorkflow = useCallback(async (
    text: string,
    format?: FormatType,
    options: any = {}
  ) => {
    try {
      // Update input
      updateInput(text, 'type');
      
      // Use provided format or selected format
      const targetFormat = format || selectedFormat || detectedFormat.format;
      if (!targetFormat) {
        throw new Error('No format selected or detected');
      }
      
      // Set processing state
      formatting.actions.setProcessingState({
        status: 'processing',
        currentStep: 'format-application',
        progress: 50,
        startedAt: new Date(),
      });
      
      // Process text
      const result = await processText(text, targetFormat, options);
      
      // Update output
      formatting.actions.setOutput(result);
      
      // Record usage statistics
      recordUsage(targetFormat, text.length);
      
      return result;
    } catch (error) {
      formatting.actions.setProcessingState({
        status: 'error',
        progress: 0,
      });
      throw error;
    }
  }, [
    updateInput, 
    selectFormat, 
    selectedFormat, 
    detectedFormat, 
    processText, 
    recordUsage,
    formatting.actions
  ]);
  
  return {
    // Input management
    updateInput,
    textStats,
    isPending,
    
    // Format management
    selectFormat,
    selectedFormat,
    detectedFormat,
    autoDetectEnabled,
    
    // Processing
    processText: processTextWithWorkflow,
    isReady,
    
    // State
    hasInput: formatting.computed.hasInput,
    hasOutput: formatting.computed.hasOutput,
    isProcessing: formatting.computed.isProcessing,
    confidence: formatting.computed.confidence,
  };
}

// ============================================================================
// User Experience Hook
// ============================================================================

/**
 * Hook for managing user experience preferences and settings
 */
export function useUserExperience() {
  const { state: themeState, actions: themeActions } = useTheme();
  const { state: preferencesState, preferences } = usePreferences();
  const { recommendedFormats, recentFormats, favoriteFormats } = useFormatRecommendations();
  
  const updatePreference = useCallback(<K extends keyof typeof preferencesState.preferences>(
    category: K,
    updates: Partial<typeof preferencesState.preferences[K]>
  ) => {
    preferences.update({
      [category]: { ...preferencesState.preferences[category], ...updates }
    });
  }, [preferences, preferencesState.preferences]);
  
  return {
    // Theme preferences
    theme: {
      mode: themeState.mode,
      accentColor: themeState.accentColor,
      fontSize: themeState.fontSize,
      compactMode: themeState.compactMode,
      notebook: themeState.notebook,
    },
    
    // User preferences
    preferences: preferencesState.preferences,
    
    // Format recommendations
    formats: {
      recommended: recommendedFormats,
      recent: recentFormats,
      favorites: favoriteFormats,
    },
    
    // Actions
    actions: {
      updateTheme: themeActions,
      updatePreference,
      resetPreferences: preferences.reset,
    },
  };
}

// ============================================================================
// Application Performance Hook
// ============================================================================

/**
 * Hook for monitoring application performance and health
 */
export function useAppPerformance() {
  const { state: processingState, computed: processingComputed } = useProcessing();
  const { state: preferencesState } = usePreferences();
  const errors = useGlobalErrors();
  
  const performanceMetrics = useMemo(() => ({
    // Processing metrics
    processing: {
      workerCount: Object.keys(processingState.workers).length,
      activeWorkers: processingState.stats.activeWorkers,
      queueLength: processingState.stats.queuedTasks,
      averageTaskTime: processingComputed.averageTaskTime,
      successRate: processingComputed.successRate,
      workerUtilization: processingComputed.workerUtilization,
    },
    
    // Storage metrics
    storage: preferencesState.storage,
    
    // Error metrics
    errors: {
      total: errors.errors.length,
      byType: errors.errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recent: errors.errors.slice(0, 5),
    },
    
    // Usage statistics
    usage: preferencesState.stats,
  }), [processingState, processingComputed, preferencesState, errors]);
  
  return {
    metrics: performanceMetrics,
    isHealthy: performanceMetrics.errors.total === 0 && 
               performanceMetrics.processing.successRate > 90,
    warnings: getPerformanceWarnings(performanceMetrics),
  };
}

// ============================================================================
// Export Management Hook
// ============================================================================

/**
 * Hook for managing export functionality across contexts
 */
export function useExportWorkflow() {
  const formatting = useFormatting();
  const preferences = usePreferences();
  
  const exportCurrentResult = useCallback(async (
    format: ExportFormat,
    options: any = {}
  ) => {
    const { output } = formatting.state;
    if (!output) {
      throw new Error('No formatted output to export');
    }
    
    const exportData = {
      content: output.content,
      format: output.format,
      metadata: {
        ...output.metadata,
        exportedAt: new Date(),
        exportFormat: format,
        ...options,
      },
    };
    
    // Add to history if preferences allow
    if (preferences.state.preferences.history.enabled) {
      preferences.history.add({
        input: formatting.state.input!,
        output,
        tags: options.tags || [],
        favorite: false,
        title: options.title,
      });
    }
    
    return exportData;
  }, [formatting.state, preferences]);
  
  const exportHistory = useCallback((
    ids?: string[],
    format: ExportFormat = 'json'
  ) => {
    return preferences.history.export(ids);
  }, [preferences.history]);
  
  const exportTemplates = useCallback((
    ids?: string[],
    format: ExportFormat = 'json'
  ) => {
    return preferences.templates.export(ids);
  }, [preferences.templates]);
  
  return {
    exportCurrentResult,
    exportHistory,
    exportTemplates,
    hasExportableContent: formatting.computed.hasOutput,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function getPerformanceWarnings(metrics: any): string[] {
  const warnings: string[] = [];
  
  if (metrics.processing.successRate < 90) {
    warnings.push('Low processing success rate detected');
  }
  
  if (metrics.processing.averageTaskTime > 5000) {
    warnings.push('Processing tasks taking longer than expected');
  }
  
  if (metrics.storage.quotaExceeded) {
    warnings.push('Storage quota exceeded');
  }
  
  if (metrics.errors.total > 10) {
    warnings.push('High error count detected');
  }
  
  return warnings;
}

// ============================================================================
// Convenience Hooks for Common Patterns
// ============================================================================

/**
 * Hook for components that need to react to format changes
 */
export function useFormatChangeEffect(callback: (format: FormatType | null) => void) {
  const { selectedFormat } = useFormatSelection();
  
  React.useEffect(() => {
    callback(selectedFormat);
  }, [selectedFormat, callback]);
}

/**
 * Hook for components that need to react to theme changes
 */
export function useThemeChangeEffect(callback: (theme: any) => void) {
  const { computed } = useTheme();
  
  React.useEffect(() => {
    callback(computed);
  }, [computed, callback]);
}

/**
 * Hook for getting current application health status
 */
export function useAppHealth() {
  const performance = useAppPerformance();
  const processing = useProcessing();
  const formatting = useFormatting();
  
  return useMemo(() => ({
    overall: performance.isHealthy ? 'healthy' : 'warning',
    processing: processing.computed.isReady ? 'ready' : 'initializing',
    formatting: formatting.computed.isProcessing ? 'busy' : 'idle',
    warnings: performance.warnings,
  }), [performance, processing, formatting]);
}
