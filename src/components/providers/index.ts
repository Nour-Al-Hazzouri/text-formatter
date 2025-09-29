/**
 * Providers - Context providers and state management exports
 * 
 * Central export point for all application context providers and related utilities
 */

// Main provider composition
export { 
  AppProviders, 
  ProviderStatus,
  defaultAppConfig,
  createProviderConfig,
  withAppProviders 
} from './AppProviders';

// Individual context providers
export { FormattingProvider, useFormatting } from './FormattingContext';
export { ThemeProvider, useTheme } from './ThemeContext';
export { ProcessingProvider, useProcessing } from './ProcessingContext';
export { PreferencesProvider, usePreferences } from './PreferencesContext';

// Enhanced hooks from individual providers
export { 
  useFormattingInput,
  useFormatSelection,
  useProcessingState 
} from './FormattingContext';

export { 
  useNotebookTheme,
  useThemeMode,
  useThemeVariables 
} from './ThemeContext';

export { 
  useTextProcessor,
  useWorkerStats 
} from './ProcessingContext';

export { 
  useFormatRecommendations,
  useUserSettings 
} from './PreferencesContext';

// Error boundaries and error handling
export {
  GlobalErrorProvider,
  BaseErrorBoundary,
  ProcessingErrorBoundary,
  WorkerErrorBoundary,
  UIErrorBoundary,
  StorageErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  useGlobalErrors
} from './ErrorBoundary';

// Re-export types for convenience
export type { AppProvidersConfig } from './AppProviders';
