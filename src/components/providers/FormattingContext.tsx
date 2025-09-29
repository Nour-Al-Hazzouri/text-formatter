'use client';

/**
 * FormattingContext - Global state management for text formatting operations
 * 
 * Manages current text input, processing state, formatted output, and format selection
 * Integrates with React 18 concurrent features for non-blocking UI updates
 */

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useCallback, 
  useMemo, 
  useTransition, 
  useDeferredValue,
  type ReactNode 
} from 'react';

// Import types
import type { 
  ProcessingState, 
  FormatType 
} from '@/types/index';
import type { 
  TextInput,
  FormattedOutput,
  FormatDefinition,
  ProcessingStats 
} from '@/types/formatting';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface FormattingState {
  /** Current input text */
  input: TextInput | null;
  
  /** Current formatted output */
  output: FormattedOutput | null;
  
  /** Currently selected format type */
  selectedFormat: FormatType | null;
  
  /** Auto-detected format with confidence */
  detectedFormat: {
    format: FormatType | null;
    confidence: number;
  };
  
  /** Current processing state */
  processing: ProcessingState;
  
  /** Available format definitions */
  availableFormats: FormatDefinition[];
  
  /** Processing history for current session */
  processingHistory: FormattedOutput[];
  
  /** Whether auto-detection is enabled */
  autoDetectEnabled: boolean;
  
  /** Current text statistics */
  textStats: {
    characterCount: number;
    wordCount: number;
    lineCount: number;
    estimatedReadTime: number;
  };
}

type FormattingAction = 
  | { type: 'SET_INPUT'; payload: TextInput }
  | { type: 'SET_OUTPUT'; payload: FormattedOutput }
  | { type: 'SET_SELECTED_FORMAT'; payload: FormatType }
  | { type: 'SET_DETECTED_FORMAT'; payload: { format: FormatType; confidence: number } }
  | { type: 'SET_PROCESSING_STATE'; payload: Partial<ProcessingState> }
  | { type: 'SET_AUTO_DETECT'; payload: boolean }
  | { type: 'ADD_TO_HISTORY'; payload: FormattedOutput }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'UPDATE_TEXT_STATS'; payload: FormattingState['textStats'] }
  | { type: 'RESET_STATE' };

interface FormattingContextType {
  /** Current formatting state */
  state: FormattingState;
  
  /** Actions for updating state */
  actions: {
    setInput: (input: TextInput) => void;
    setOutput: (output: FormattedOutput) => void;
    setSelectedFormat: (format: FormatType) => void;
    setDetectedFormat: (format: FormatType, confidence: number) => void;
    setProcessingState: (state: Partial<ProcessingState>) => void;
    toggleAutoDetect: () => void;
    addToHistory: (output: FormattedOutput) => void;
    clearHistory: () => void;
    resetState: () => void;
  };
  
  /** React 18 concurrent features */
  concurrent: {
    isPending: boolean;
    startTransition: (callback: () => void) => void;
    deferredInput: TextInput | null;
  };
  
  /** Derived state and computed values */
  computed: {
    isProcessing: boolean;
    hasOutput: boolean;
    hasInput: boolean;
    processingProgress: number;
    confidence: number;
    isAutoDetected: boolean;
  };
}

// ============================================================================
// Initial State and Reducer
// ============================================================================

const initialState: FormattingState = {
  input: null,
  output: null,
  selectedFormat: null,
  detectedFormat: {
    format: null,
    confidence: 0,
  },
  processing: {
    status: 'idle',
    currentStep: null,
    progress: 0,
    startedAt: null,
    duration: null,
    warnings: [],
  },
  availableFormats: [],
  processingHistory: [],
  autoDetectEnabled: true,
  textStats: {
    characterCount: 0,
    wordCount: 0,
    lineCount: 0,
    estimatedReadTime: 0,
  },
};

function formattingReducer(state: FormattingState, action: FormattingAction): FormattingState {
  switch (action.type) {
    case 'SET_INPUT':
      return {
        ...state,
        input: action.payload,
        // Reset output when input changes
        output: null,
        processing: {
          ...state.processing,
          status: 'idle',
          progress: 0,
        },
      };
      
    case 'SET_OUTPUT':
      return {
        ...state,
        output: action.payload,
        processing: {
          ...state.processing,
          status: 'completed',
          progress: 100,
          duration: action.payload.metadata.duration,
        },
      };
      
    case 'SET_SELECTED_FORMAT':
      return {
        ...state,
        selectedFormat: action.payload,
      };
      
    case 'SET_DETECTED_FORMAT':
      return {
        ...state,
        detectedFormat: {
          format: action.payload.format,
          confidence: action.payload.confidence,
        },
      };
      
    case 'SET_PROCESSING_STATE':
      return {
        ...state,
        processing: {
          ...state.processing,
          ...action.payload,
        },
      };
      
    case 'SET_AUTO_DETECT':
      return {
        ...state,
        autoDetectEnabled: action.payload,
      };
      
    case 'ADD_TO_HISTORY':
      return {
        ...state,
        processingHistory: [action.payload, ...state.processingHistory].slice(0, 50), // Keep last 50 items
      };
      
    case 'CLEAR_HISTORY':
      return {
        ...state,
        processingHistory: [],
      };
      
    case 'UPDATE_TEXT_STATS':
      return {
        ...state,
        textStats: action.payload,
      };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
}

// ============================================================================
// Context Creation
// ============================================================================

const FormattingContext = createContext<FormattingContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface FormattingProviderProps {
  children: ReactNode;
  initialFormats?: FormatDefinition[];
}

export function FormattingProvider({ children, initialFormats = [] }: FormattingProviderProps) {
  const [state, dispatch] = useReducer(formattingReducer, {
    ...initialState,
    availableFormats: initialFormats,
  });
  
  // React 18 concurrent features
  const [isPending, startTransition] = useTransition();
  const deferredInput = useDeferredValue(state.input);
  
  // Actions
  const actions = useMemo(() => ({
    setInput: (input: TextInput) => {
      // Use startTransition for non-urgent state updates
      startTransition(() => {
        dispatch({ type: 'SET_INPUT', payload: input });
        
        // Update text statistics
        const stats = calculateTextStats(input.content);
        dispatch({ type: 'UPDATE_TEXT_STATS', payload: stats });
      });
    },
    
    setOutput: (output: FormattedOutput) => {
      dispatch({ type: 'SET_OUTPUT', payload: output });
      dispatch({ type: 'ADD_TO_HISTORY', payload: output });
    },
    
    setSelectedFormat: (format: FormatType) => {
      dispatch({ type: 'SET_SELECTED_FORMAT', payload: format });
    },
    
    setDetectedFormat: (format: FormatType, confidence: number) => {
      dispatch({ type: 'SET_DETECTED_FORMAT', payload: { format, confidence } });
    },
    
    setProcessingState: (processingState: Partial<ProcessingState>) => {
      dispatch({ type: 'SET_PROCESSING_STATE', payload: processingState });
    },
    
    toggleAutoDetect: () => {
      dispatch({ type: 'SET_AUTO_DETECT', payload: !state.autoDetectEnabled });
    },
    
    addToHistory: (output: FormattedOutput) => {
      dispatch({ type: 'ADD_TO_HISTORY', payload: output });
    },
    
    clearHistory: () => {
      dispatch({ type: 'CLEAR_HISTORY' });
    },
    
    resetState: () => {
      dispatch({ type: 'RESET_STATE' });
    },
  }), [state.autoDetectEnabled]);
  
  // Computed values
  const computed = useMemo(() => ({
    isProcessing: state.processing.status === 'analyzing' || state.processing.status === 'processing',
    hasOutput: state.output !== null,
    hasInput: state.input !== null && state.input.content.trim().length > 0,
    processingProgress: state.processing.progress,
    confidence: state.output?.metadata.confidence || state.detectedFormat.confidence,
    isAutoDetected: state.selectedFormat === state.detectedFormat.format,
  }), [state]);
  
  const contextValue: FormattingContextType = useMemo(() => ({
    state,
    actions,
    concurrent: {
      isPending,
      startTransition,
      deferredInput,
    },
    computed,
  }), [state, actions, isPending, startTransition, deferredInput, computed]);
  
  return (
    <FormattingContext.Provider value={contextValue}>
      {children}
    </FormattingContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

export function useFormatting() {
  const context = useContext(FormattingContext);
  
  if (context === undefined) {
    throw new Error('useFormatting must be used within a FormattingProvider');
  }
  
  return context;
}

// ============================================================================
// Utility Functions
// ============================================================================

function calculateTextStats(content: string): FormattingState['textStats'] {
  const characterCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content.split('\n').length;
  const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute average
  
  return {
    characterCount,
    wordCount,
    lineCount,
    estimatedReadTime,
  };
}

// ============================================================================
// Enhanced Custom Hooks for Specific Use Cases
// ============================================================================

/**
 * Hook for managing text input with debounced processing
 */
export function useFormattingInput() {
  const { state, actions, concurrent } = useFormatting();
  
  const updateInput = useCallback((content: string, source: TextInput['metadata']['source'] = 'type') => {
    const input: TextInput = {
      content,
      metadata: {
        source,
        timestamp: new Date(),
        size: content.length,
      },
    };
    
    actions.setInput(input);
  }, [actions]);
  
  return {
    input: state.input,
    deferredInput: concurrent.deferredInput,
    updateInput,
    textStats: state.textStats,
    isPending: concurrent.isPending,
  };
}

/**
 * Hook for managing format selection and detection
 */
export function useFormatSelection() {
  const { state, actions, computed } = useFormatting();
  
  const selectFormat = useCallback((format: FormatType) => {
    actions.setSelectedFormat(format);
  }, [actions]);
  
  return {
    selectedFormat: state.selectedFormat,
    detectedFormat: state.detectedFormat,
    availableFormats: state.availableFormats,
    autoDetectEnabled: state.autoDetectEnabled,
    isAutoDetected: computed.isAutoDetected,
    selectFormat,
    toggleAutoDetect: actions.toggleAutoDetect,
  };
}

/**
 * Hook for managing processing state and feedback
 */
export function useProcessingState() {
  const { state, actions, computed } = useFormatting();
  
  return {
    processing: state.processing,
    isProcessing: computed.isProcessing,
    progress: computed.processingProgress,
    confidence: computed.confidence,
    setProcessingState: actions.setProcessingState,
  };
}
