/**
 * Lazy Loader - Dynamic code splitting and component lazy loading
 * 
 * Features:
 * - Format-specific component lazy loading
 * - Dynamic formatter imports
 * - Progressive loading strategies
 * - Bundle size optimization
 * - Loading state management
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';
import type { FormatType } from '@/types';

/**
 * Lazy loading configuration
 */
interface LazyLoadConfig {
  /** Loading timeout in milliseconds */
  timeout: number;
  
  /** Retry attempts on failure */
  retryAttempts: number;
  
  /** Preload priority formats */
  preloadFormats: FormatType[];
  
  /** Enable progressive loading */
  progressiveLoading: boolean;
}

/**
 * Component loading state
 */
interface LoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Lazy loader class for managing dynamic imports
 */
export class LazyLoader {
  private config: LazyLoadConfig;
  private loadedComponents = new Map<string, ComponentType<any>>();
  private loadingStates = new Map<string, LoadingState>();
  private loadedFormatters = new Map<FormatType, any>();
  private preloadPromises = new Map<string, Promise<any>>();

  constructor(config?: Partial<LazyLoadConfig>) {
    this.config = {
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      preloadFormats: ['meeting-notes', 'task-lists'], // Most common formats
      progressiveLoading: true,
      ...config
    };

    // Start preloading priority components
    this.preloadPriorityComponents();
  }

  /**
   * Create lazy-loaded display components
   */
  createLazyDisplayComponents(): Record<string, LazyExoticComponent<ComponentType<any>>> {
    return {
      TaskListDisplay: this.createLazyComponent(
        () => import('@/components/formatters/TaskListDisplay'),
        'TaskListDisplay'
      ),
      ShoppingListDisplay: this.createLazyComponent(
        () => import('@/components/formatters/ShoppingListDisplay'),
        'ShoppingListDisplay'
      ),
      JournalDisplay: this.createLazyComponent(
        () => import('@/components/formatters/JournalDisplay'),
        'JournalDisplay'
      ),
      ResearchDisplay: this.createLazyComponent(
        () => import('@/components/formatters/ResearchDisplay'),
        'ResearchDisplay'
      ),
      StudyDisplay: this.createLazyComponent(
        () => import('@/components/formatters/StudyDisplay'),
        'StudyDisplay'
      ),
      HistoryDashboard: this.createLazyComponent(
        () => import('@/components/history/HistoryDashboard'),
        'HistoryDashboard'
      ),
      TemplateLibrary: this.createLazyComponent(
        () => import('@/components/templates/TemplateLibrary'),
        'TemplateLibrary'
      )
    };
  }

  /**
   * Create lazy-loaded formatter modules
   */
  async loadFormatter(format: FormatType): Promise<any> {
    // Return cached formatter if already loaded
    if (this.loadedFormatters.has(format)) {
      return this.loadedFormatters.get(format);
    }

    // Check if already loading
    const loadingKey = `formatter-${format}`;
    if (this.preloadPromises.has(loadingKey)) {
      return this.preloadPromises.get(loadingKey);
    }

    // Start loading
    this.updateLoadingState(loadingKey, { isLoading: true, isLoaded: false, error: null, retryCount: 0 });

    const loadPromise = this.loadFormatterWithRetry(format);
    this.preloadPromises.set(loadingKey, loadPromise);

    try {
      const formatter = await loadPromise;
      this.loadedFormatters.set(format, formatter);
      this.updateLoadingState(loadingKey, { isLoading: false, isLoaded: true, error: null, retryCount: 0 });
      return formatter;
    } catch (error) {
      this.updateLoadingState(loadingKey, { isLoading: false, isLoaded: false, error: error as Error, retryCount: 0 });
      throw error;
    } finally {
      this.preloadPromises.delete(loadingKey);
    }
  }

  /**
   * Load formatter with retry logic
   */
  private async loadFormatterWithRetry(format: FormatType, attempt: number = 0): Promise<any> {
    try {
      switch (format) {
        case 'meeting-notes':
          const meetingFormatter = await import('@/lib/formatting/MeetingNotesFormatter');
          return meetingFormatter.MeetingNotesFormatter;
          
        case 'task-lists':
          const taskFormatter = await import('@/lib/formatting/TaskListsFormatter');
          return taskFormatter.TaskListsFormatter;
          
        case 'shopping-lists':
          const shoppingFormatter = await import('@/lib/formatting/ShoppingListsFormatter');
          return shoppingFormatter.ShoppingListsFormatter;
          
        case 'journal-notes':
          const journalFormatter = await import('@/lib/formatting/JournalNotesFormatter');
          return journalFormatter.JournalNotesFormatter;
          
        case 'research-notes':
          const researchFormatter = await import('@/lib/formatting/ResearchNotesFormatter');
          return researchFormatter.ResearchNotesFormatter;
          
        case 'study-notes':
          const studyFormatter = await import('@/lib/formatting/StudyNotesFormatter');
          return studyFormatter.StudyNotesFormatter;
          
        default:
          throw new Error(`Unknown format type: ${format}`);
      }
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await this.sleep(delay);
        return this.loadFormatterWithRetry(format, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Create lazy component with loading states
   */
  private createLazyComponent(
    importFn: () => Promise<{ [key: string]: ComponentType<any> }>,
    componentName: string
  ): LazyExoticComponent<ComponentType<any>> {
    return lazy(async () => {
      this.updateLoadingState(componentName, { isLoading: true, isLoaded: false, error: null, retryCount: 0 });
      
      try {
        const module = await this.withTimeout(importFn(), this.config.timeout);
        
        // Extract the component (handle both default and named exports)
        const Component = module.default || module[componentName];
        if (!Component) {
          throw new Error(`Component ${componentName} not found in module`);
        }
        
        this.loadedComponents.set(componentName, Component);
        this.updateLoadingState(componentName, { isLoading: false, isLoaded: true, error: null, retryCount: 0 });
        
        return { default: Component };
      } catch (error) {
        this.updateLoadingState(componentName, { isLoading: false, isLoaded: false, error: error as Error, retryCount: 0 });
        throw error;
      }
    });
  }

  /**
   * Preload priority components in background
   */
  private preloadPriorityComponents(): void {
    if (!this.config.progressiveLoading) return;

    // Preload formatters for priority formats
    this.config.preloadFormats.forEach(format => {
      // Don't await - let it load in background
      this.loadFormatter(format).catch(error => {
        console.warn(`Failed to preload formatter ${format}:`, error);
      });
    });

    // Preload commonly used display components
    const priorityComponents = ['TaskListDisplay', 'JournalDisplay'];
    priorityComponents.forEach(componentName => {
      // Trigger lazy loading but don't wait
      setTimeout(() => {
        const importFn = this.getImportFunction(componentName);
        if (importFn) {
          importFn().catch(error => {
            console.warn(`Failed to preload component ${componentName}:`, error);
          });
        }
      }, 2000); // Delay to not block initial load
    });
  }

  /**
   * Get import function for component name
   */
  private getImportFunction(componentName: string): (() => Promise<any>) | null {
    const importMap: Record<string, () => Promise<any>> = {
      TaskListDisplay: () => import('@/components/formatters/TaskListDisplay'),
      ShoppingListDisplay: () => import('@/components/formatters/ShoppingListDisplay'),
      JournalDisplay: () => import('@/components/formatters/JournalDisplay'),
      ResearchDisplay: () => import('@/components/formatters/ResearchDisplay'),
      StudyDisplay: () => import('@/components/formatters/StudyDisplay'),
      HistoryDashboard: () => import('@/components/history/HistoryDashboard'),
      TemplateLibrary: () => import('@/components/templates/TemplateLibrary')
    };

    return importMap[componentName] || null;
  }

  /**
   * Update loading state for component
   */
  private updateLoadingState(key: string, state: LoadingState): void {
    this.loadingStates.set(key, state);
  }

  /**
   * Get loading state for component
   */
  getLoadingState(key: string): LoadingState | null {
    return this.loadingStates.get(key) || null;
  }

  /**
   * Check if component is loaded
   */
  isComponentLoaded(componentName: string): boolean {
    return this.loadedComponents.has(componentName);
  }

  /**
   * Check if formatter is loaded
   */
  isFormatterLoaded(format: FormatType): boolean {
    return this.loadedFormatters.has(format);
  }

  /**
   * Get loaded component count
   */
  getLoadedComponentsCount(): number {
    return this.loadedComponents.size;
  }

  /**
   * Get loaded formatters count
   */
  getLoadedFormattersCount(): number {
    return this.loadedFormatters.size;
  }

  /**
   * Preload specific components
   */
  async preloadComponents(componentNames: string[]): Promise<void> {
    const promises = componentNames.map(name => {
      const importFn = this.getImportFunction(name);
      return importFn ? importFn() : Promise.resolve();
    });

    await Promise.allSettled(promises);
  }

  /**
   * Preload specific formatters
   */
  async preloadFormatters(formats: FormatType[]): Promise<void> {
    const promises = formats.map(format => this.loadFormatter(format));
    await Promise.allSettled(promises);
  }

  /**
   * Clear loaded components cache
   */
  clearCache(): void {
    this.loadedComponents.clear();
    this.loadedFormatters.clear();
    this.loadingStates.clear();
    this.preloadPromises.clear();
  }

  /**
   * Get bundle loading statistics
   */
  getLoadingStats() {
    const totalComponents = Object.keys(this.createLazyDisplayComponents()).length;
    const totalFormatters = 6; // Number of format types
    
    return {
      components: {
        total: totalComponents,
        loaded: this.loadedComponents.size,
        loading: Array.from(this.loadingStates.values()).filter(s => s.isLoading).length,
        failed: Array.from(this.loadingStates.values()).filter(s => s.error).length
      },
      formatters: {
        total: totalFormatters,
        loaded: this.loadedFormatters.size,
        loading: this.preloadPromises.size
      }
    };
  }

  /**
   * Utility methods
   */
  private withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Loading timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Default lazy loader instance
 */
export const defaultLazyLoader = new LazyLoader();

/**
 * Loading fallback configuration
 */
export interface LoadingFallbackProps {
  message?: string;
}

/**
 * Error boundary configuration  
 */
export interface LazyLoadErrorBoundaryProps {
  error: Error;
  retry: () => void;
  componentName?: string;
}

/**
 * Create loading fallback component (to be used in .tsx files)
 */
export const createLoadingFallback = (props: LoadingFallbackProps) => ({
  type: 'LoadingFallback',
  props: { message: props.message || 'Loading...' }
});

/**
 * Create error boundary component (to be used in .tsx files)
 */
export const createLazyLoadErrorBoundary = (props: LazyLoadErrorBoundaryProps) => ({
  type: 'LazyLoadErrorBoundary', 
  props
});
