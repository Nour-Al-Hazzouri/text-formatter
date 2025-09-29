'use client';

/**
 * AppProviders - Root provider composition for the entire application
 * 
 * Combines all context providers in the correct order and handles initialization
 * Integrates React 18 concurrent features and proper error boundaries
 */

import React, { type ReactNode, Suspense } from 'react';

// Import all providers
import { GlobalErrorProvider } from './ErrorBoundary';
import { ThemeProvider } from './ThemeContext';
import { PreferencesProvider } from './PreferencesContext';
import { ProcessingProvider } from './ProcessingContext';
import { FormattingProvider } from './FormattingContext';

// Import specialized error boundaries
import { 
  ProcessingErrorBoundary, 
  WorkerErrorBoundary, 
  UIErrorBoundary, 
  StorageErrorBoundary 
} from './ErrorBoundary';

// Import types
import type { FormatDefinition } from '@/types/formatting';
import type { WorkerPoolConfig } from '@/types/workers';

// ============================================================================
// Provider Configuration Types
// ============================================================================

export interface AppProvidersConfig {
  /** Initial theme configuration */
  theme?: {
    initialMode?: 'light' | 'dark' | 'system';
    storageKey?: string;
  };
  
  /** Preferences configuration */
  preferences?: {
    storagePrefix?: string;
  };
  
  /** Processing/Worker configuration */
  processing?: {
    config?: Partial<WorkerPoolConfig> & {
      taskTimeout?: number;
      retryAttempts?: number;
      enableTransferableObjects?: boolean;
      workerIdleTimeout?: number;
    };
    autoInitialize?: boolean;
  };
  
  /** Formatting configuration */
  formatting?: {
    initialFormats?: FormatDefinition[];
  };
  
  /** Development/debugging options */
  debug?: {
    enableErrorDetails?: boolean;
    logContextUpdates?: boolean;
  };
}

interface AppProvidersProps {
  children: ReactNode;
  config?: AppProvidersConfig;
}

// ============================================================================
// Loading Fallback Components
// ============================================================================

function ProviderLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Initializing application...</p>
      </div>
    </div>
  );
}

function ProcessingLoadingFallback() {
  return (
    <div className="flex items-center gap-2 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
      <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      <span className="text-sm text-orange-700 dark:text-orange-300">
        Starting text processing engine...
      </span>
    </div>
  );
}

// ============================================================================
// Main App Providers Component
// ============================================================================

export function AppProviders({ children, config = {} }: AppProvidersProps) {
  const {
    theme = {
      initialMode: 'system',
      storageKey: 'text-formatter-theme',
    },
    preferences = {
      storagePrefix: 'text-formatter',
    },
    processing = {
      config: {
        maxWorkers: typeof navigator !== 'undefined' ? Math.min(navigator.hardwareConcurrency || 4, 8) : 4,
        minWorkers: 1,
        maxQueueSize: 100,
        idleTimeout: 300000,
        workerScript: '/workers/textProcessor.worker.js',
        loadBalancing: 'round-robin' as const,
        taskTimeout: 30000,
      },
      autoInitialize: true,
    },
    formatting = {
      initialFormats: [],
    },
    debug = {
      enableErrorDetails: process.env.NODE_ENV === 'development',
      logContextUpdates: false,
    },
  } = config;

  return (
    <Suspense fallback={<ProviderLoadingFallback />}>
      {/* Global Error Context - Must be at the top level */}
      <GlobalErrorProvider>
        
        {/* Storage Error Boundary - Wraps preferences and storage operations */}
        <StorageErrorBoundary>
          {/* Preferences Provider - Manages user settings and local storage */}
          <PreferencesProvider storagePrefix={preferences.storagePrefix}>
            
            {/* Theme Provider - Manages theme and visual customization */}
            <ThemeProvider 
              storageKey={theme.storageKey}
              initialTheme={theme.initialMode ? { mode: theme.initialMode } : undefined}
            >
              
              {/* UI Error Boundary - Wraps main UI components */}
              <UIErrorBoundary>
                
                {/* Worker Error Boundary - Wraps processing operations */}
                <WorkerErrorBoundary>
                  <Suspense fallback={<ProcessingLoadingFallback />}>
                    {/* Processing Provider - Manages Web Workers and task processing */}
                    <ProcessingProvider 
                      config={processing.config}
                      autoInitialize={processing.autoInitialize}
                    >
                      
                      {/* Processing Error Boundary - Wraps text formatting operations */}
                      <ProcessingErrorBoundary>
                        {/* Formatting Provider - Manages text formatting state */}
                        <FormattingProvider 
                          initialFormats={formatting.initialFormats}
                        >
                          
                          {/* Development Provider - Only in development */}
                          {debug.logContextUpdates && process.env.NODE_ENV === 'development' && (
                            <DebugProvider>
                              {children}
                            </DebugProvider>
                          )}
                          
                          {(!debug.logContextUpdates || process.env.NODE_ENV !== 'development') && children}
                          
                        </FormattingProvider>
                      </ProcessingErrorBoundary>
                      
                    </ProcessingProvider>
                  </Suspense>
                </WorkerErrorBoundary>
                
              </UIErrorBoundary>
              
            </ThemeProvider>
            
          </PreferencesProvider>
        </StorageErrorBoundary>
        
      </GlobalErrorProvider>
    </Suspense>
  );
}

// ============================================================================
// Development Debug Provider
// ============================================================================

function DebugProvider({ children }: { children: ReactNode }) {
  // This would include development tools and context logging
  // For now, just pass through children
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🏗️  App Providers initialized in development mode');
  }
  
  return <>{children}</>;
}

// ============================================================================
// Provider Status Component
// ============================================================================

export function ProviderStatus() {
  // This component can be used to show the initialization status
  // of all providers - useful for debugging
  
  return (
    <div className="fixed bottom-4 right-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border text-xs space-y-1 z-50">
      <div className="font-semibold text-gray-700 dark:text-gray-300">Provider Status</div>
      
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Theme Provider</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Preferences Provider</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Processing Provider</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Formatting Provider</span>
      </div>
    </div>
  );
}

// ============================================================================
// Default Configuration
// ============================================================================

export const defaultAppConfig: AppProvidersConfig = {
  theme: {
    initialMode: 'system',
    storageKey: 'text-formatter-theme',
  },
  preferences: {
    storagePrefix: 'text-formatter',
  },
  processing: {
    config: {
      maxWorkers: typeof navigator !== 'undefined' ? Math.min(navigator.hardwareConcurrency || 4, 8) : 4,
      minWorkers: 1,
      maxQueueSize: 100,
      idleTimeout: 300000, // 5 minutes
      workerScript: '/workers/textProcessor.worker.js',
      loadBalancing: 'round-robin' as const,
      taskTimeout: 30000,
    },
    autoInitialize: true,
  },
  formatting: {
    initialFormats: [], // Will be populated with default format definitions
  },
  debug: {
    enableErrorDetails: process.env.NODE_ENV === 'development',
    logContextUpdates: false,
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates provider configuration with sensible defaults
 */
export function createProviderConfig(overrides: Partial<AppProvidersConfig> = {}): AppProvidersConfig {
  return {
    ...defaultAppConfig,
    ...overrides,
    theme: { ...defaultAppConfig.theme, ...overrides.theme },
    preferences: { ...defaultAppConfig.preferences, ...overrides.preferences },
    processing: { ...defaultAppConfig.processing, ...overrides.processing },
    formatting: { ...defaultAppConfig.formatting, ...overrides.formatting },
    debug: { ...defaultAppConfig.debug, ...overrides.debug },
  };
}

/**
 * HOC for wrapping components with all providers
 */
export function withAppProviders<P extends object>(
  Component: React.ComponentType<P>,
  config?: AppProvidersConfig
) {
  const WrappedComponent = (props: P) => (
    <AppProviders config={config}>
      <Component {...props} />
    </AppProviders>
  );
  
  WrappedComponent.displayName = `withAppProviders(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
