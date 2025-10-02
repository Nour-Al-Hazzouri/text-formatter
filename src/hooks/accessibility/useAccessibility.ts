/**
 * Accessibility Hook - React integration for accessibility features
 * 
 * Provides React-friendly interface for accessibility management
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AccessibilityManager, 
  AccessibilityPreferences, 
  AccessibilityValidationResult,
  FocusManager 
} from '@/lib/accessibility/AccessibilityManager';

/**
 * Hook options
 */
export interface UseAccessibilityOptions {
  /** Auto-load saved preferences */
  autoLoadPreferences?: boolean;
  
  /** Enable automatic validation */
  enableAutoValidation?: boolean;
  
  /** Validation interval in milliseconds */
  validationInterval?: number;
}

/**
 * Hook return type
 */
export interface UseAccessibilityResult {
  /** Current accessibility preferences */
  preferences: AccessibilityPreferences;
  
  /** Update a preference */
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K, 
    value: AccessibilityPreferences[K]
  ) => void;
  
  /** Toggle high contrast mode */
  toggleHighContrast: () => void;
  
  /** Focus manager instance */
  focusManager: FocusManager;
  
  /** Announce message to screen readers */
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  
  /** Create focus trap */
  createFocusTrap: (container: HTMLElement) => () => void;
  
  /** Set focus with accessibility features */
  setFocus: (element: HTMLElement, announce?: boolean) => void;
  
  /** Restore previous focus */
  restoreFocus: () => void;
  
  /** Run accessibility validation */
  validateAccessibility: () => Promise<AccessibilityValidationResult>;
  
  /** Latest validation result */
  validationResult: AccessibilityValidationResult | null;
  
  /** Whether accessibility manager is ready */
  isReady: boolean;
}

/**
 * Accessibility hook
 */
export function useAccessibility(
  options: UseAccessibilityOptions = {}
): UseAccessibilityResult {
  const {
    autoLoadPreferences = true,
    enableAutoValidation = false,
    validationInterval = 30000 // 30 seconds
  } = options;

  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium',
    screenReaderOptimized: false,
    enhancedKeyboardNavigation: true,
    enhancedFocusIndicators: true,
    audioDescriptions: false,
    skipLinks: true
  });

  const [validationResult, setValidationResult] = useState<AccessibilityValidationResult | null>(null);
  const [isReady, setIsReady] = useState(false);

  const accessibilityManagerRef = useRef<AccessibilityManager | null>(null);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize accessibility manager
  useEffect(() => {
    const initializeManager = async () => {
      try {
        accessibilityManagerRef.current = new AccessibilityManager();
        
        if (autoLoadPreferences) {
          accessibilityManagerRef.current.loadPreferences();
          setPreferences(accessibilityManagerRef.current.getPreferences());
        }

        setIsReady(true);

        // Setup auto-validation if enabled
        if (enableAutoValidation) {
          validationIntervalRef.current = setInterval(async () => {
            if (accessibilityManagerRef.current) {
              const result = await accessibilityManagerRef.current.validateAccessibility();
              setValidationResult(result);
            }
          }, validationInterval);
        }

      } catch (error) {
        console.error('Failed to initialize accessibility manager:', error);
      }
    };

    initializeManager();

    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
    };
  }, [autoLoadPreferences, enableAutoValidation, validationInterval]);

  // Update preference
  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K, 
    value: AccessibilityPreferences[K]
  ) => {
    if (accessibilityManagerRef.current) {
      accessibilityManagerRef.current.updatePreference(key, value);
      setPreferences(accessibilityManagerRef.current.getPreferences());
    }
  }, []);

  // Toggle high contrast
  const toggleHighContrast = useCallback(() => {
    if (accessibilityManagerRef.current) {
      accessibilityManagerRef.current.toggleHighContrast();
      setPreferences(accessibilityManagerRef.current.getPreferences());
    }
  }, []);

  // Get focus manager
  const focusManager = useCallback(() => {
    return accessibilityManagerRef.current?.getFocusManager();
  }, []);

  // Announce to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (accessibilityManagerRef.current) {
      accessibilityManagerRef.current.announceToScreenReader(message, priority);
    }
  }, []);

  // Create focus trap
  const createFocusTrap = useCallback((container: HTMLElement) => {
    const manager = focusManager();
    return manager ? manager.createFocusTrap(container) : () => {};
  }, [focusManager]);

  // Set focus
  const setFocus = useCallback((element: HTMLElement, announceChange = true) => {
    const manager = focusManager();
    if (manager) {
      manager.setFocus(element, announceChange);
    }
  }, [focusManager]);

  // Restore focus
  const restoreFocus = useCallback(() => {
    const manager = focusManager();
    if (manager) {
      manager.restoreFocus();
    }
  }, [focusManager]);

  // Validate accessibility
  const validateAccessibility = useCallback(async (): Promise<AccessibilityValidationResult> => {
    if (!accessibilityManagerRef.current) {
      throw new Error('Accessibility manager not initialized');
    }

    const result = await accessibilityManagerRef.current.validateAccessibility();
    setValidationResult(result);
    return result;
  }, []);

  return {
    preferences,
    updatePreference,
    toggleHighContrast,
    focusManager: focusManager()!,
    announce,
    createFocusTrap,
    setFocus,
    restoreFocus,
    validateAccessibility,
    validationResult,
    isReady
  };
}

/**
 * Hook for focus management in components
 */
export function useFocusManagement() {
  const { focusManager, setFocus, restoreFocus, createFocusTrap } = useAccessibility();

  // Focus trap for modals
  const useFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      if (containerRef.current && focusManager) {
        cleanupRef.current = createFocusTrap(containerRef.current);
      }

      return () => {
        if (cleanupRef.current) {
          cleanupRef.current();
        }
      };
    }, [containerRef, focusManager, createFocusTrap]);

    return cleanupRef.current;
  };

  // Auto-focus on mount
  const useAutoFocus = (elementRef: React.RefObject<HTMLElement>, enabled = true) => {
    useEffect(() => {
      if (enabled && elementRef.current) {
        setFocus(elementRef.current);
      }
    }, [elementRef, enabled, setFocus]);
  };

  // Focus restoration
  const useFocusRestore = () => {
    useEffect(() => {
      return () => {
        restoreFocus();
      };
    }, [restoreFocus]);
  };

  return {
    useFocusTrap,
    useAutoFocus,
    useFocusRestore,
    setFocus,
    restoreFocus
  };
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(
  handlers: Record<string, (event: KeyboardEvent) => void>,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const combination = [
        event.ctrlKey && 'ctrl',
        event.altKey && 'alt', 
        event.shiftKey && 'shift',
        key
      ].filter(Boolean).join('+');

      if (handlers[key]) {
        handlers[key](event);
      } else if (handlers[combination]) {
        handlers[combination](event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers, ...deps]);
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReader() {
  const { announce, preferences } = useAccessibility();

  const announceNavigation = useCallback((message: string) => {
    if (preferences.screenReaderOptimized) {
      announce(`Navigation: ${message}`, 'polite');
    }
  }, [announce, preferences.screenReaderOptimized]);

  const announceAction = useCallback((message: string) => {
    announce(`Action: ${message}`, 'polite');
  }, [announce]);

  const announceError = useCallback((message: string) => {
    announce(`Error: ${message}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`, 'polite');
  }, [announce]);

  const announceStatus = useCallback((message: string) => {
    announce(`Status: ${message}`, 'polite');
  }, [announce]);

  return {
    announce,
    announceNavigation,
    announceAction,
    announceError,
    announceSuccess,
    announceStatus
  };
}

/**
 * Hook for accessibility validation
 */
export function useAccessibilityValidation(autoValidate = false) {
  const { validateAccessibility, validationResult } = useAccessibility();
  const [isValidating, setIsValidating] = useState(false);

  const runValidation = useCallback(async () => {
    setIsValidating(true);
    try {
      await validateAccessibility();
    } finally {
      setIsValidating(false);
    }
  }, [validateAccessibility]);

  useEffect(() => {
    if (autoValidate) {
      runValidation();
    }
  }, [autoValidate, runValidation]);

  return {
    validationResult,
    isValidating,
    runValidation
  };
}
