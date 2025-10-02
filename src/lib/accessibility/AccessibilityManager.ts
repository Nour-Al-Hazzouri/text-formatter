/**
 * Accessibility Manager - WCAG 2.1 AA compliance implementation
 * 
 * Features:
 * - Keyboard navigation management
 * - Screen reader optimization
 * - Focus management and indication
 * - High contrast mode support
 * - Accessibility testing and validation
 * - ARIA attributes management
 */

/**
 * Accessibility preferences
 */
export interface AccessibilityPreferences {
  /** High contrast mode enabled */
  highContrast: boolean;
  
  /** Reduced motion preference */
  reducedMotion: boolean;
  
  /** Font size preference */
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  
  /** Screen reader optimizations */
  screenReaderOptimized: boolean;
  
  /** Keyboard navigation enhanced */
  enhancedKeyboardNavigation: boolean;
  
  /** Focus indicators enhanced */
  enhancedFocusIndicators: boolean;
  
  /** Audio descriptions enabled */
  audioDescriptions: boolean;
  
  /** Skip links enabled */
  skipLinks: boolean;
}

/**
 * Accessibility validation result
 */
export interface AccessibilityValidationResult {
  /** Overall compliance score (0-100) */
  score: number;
  
  /** WCAG level achieved */
  wcagLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant';
  
  /** Issues found */
  issues: AccessibilityIssue[];
  
  /** Recommendations */
  recommendations: string[];
  
  /** Test timestamp */
  timestamp: Date;
}

/**
 * Accessibility issue details
 */
export interface AccessibilityIssue {
  /** Issue severity */
  severity: 'error' | 'warning' | 'info';
  
  /** WCAG guideline reference */
  guideline: string;
  
  /** Issue description */
  description: string;
  
  /** Element selector or description */
  element?: string;
  
  /** Suggested fix */
  suggestion: string;
  
  /** Impact level */
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

/**
 * Keyboard navigation configuration
 */
export interface KeyboardNavigationConfig {
  /** Custom key bindings */
  keyBindings: Record<string, string>;
  
  /** Tab order override */
  tabOrder?: string[];
  
  /** Skip link targets */
  skipTargets: Array<{
    label: string;
    target: string;
  }>;
  
  /** Escape key handling */
  escapeHandling: boolean;
  
  /** Arrow key navigation */
  arrowKeyNavigation: boolean;
}

/**
 * Focus management system
 */
export class FocusManager {
  private focusStack: HTMLElement[] = [];
  private focusTraps: Set<HTMLElement> = new Set();
  private focusHistoryEnabled = true;

  /**
   * Set focus with accessibility announcements
   */
  setFocus(element: HTMLElement, announce = true): void {
    if (!element || !element.focus) return;

    // Store previous focus for history
    if (this.focusHistoryEnabled && document.activeElement instanceof HTMLElement) {
      this.focusStack.push(document.activeElement);
    }

    element.focus();

    // Announce focus change for screen readers
    if (announce) {
      this.announceFocusChange(element);
    }
  }

  /**
   * Restore previous focus
   */
  restoreFocus(): void {
    const previousElement = this.focusStack.pop();
    if (previousElement && document.contains(previousElement)) {
      this.setFocus(previousElement, false);
    }
  }

  /**
   * Create focus trap for modals and dialogs
   */
  createFocusTrap(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab (backward)
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (forward)
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    this.focusTraps.add(container);

    // Set initial focus
    firstElement.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      this.focusTraps.delete(container);
    };
  }

  /**
   * Get all focusable elements within container
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(element => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }) as HTMLElement[];
  }

  /**
   * Announce focus change for screen readers
   */
  private announceFocusChange(element: HTMLElement): void {
    const announcement = this.getFocusAnnouncement(element);
    if (announcement) {
      this.announceToScreenReader(announcement);
    }
  }

  /**
   * Get appropriate announcement for focused element
   */
  private getFocusAnnouncement(element: HTMLElement): string {
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const tagName = element.tagName.toLowerCase();

    if (ariaLabel) return ariaLabel;

    switch (tagName) {
      case 'button':
        return `Button: ${element.textContent?.trim() || 'Unlabeled button'}`;
      case 'input':
        const inputType = (element as HTMLInputElement).type;
        return `${inputType} input: ${(element as HTMLInputElement).value || 'Empty'}`;
      case 'select':
        return `Dropdown: ${element.textContent?.trim() || 'Select option'}`;
      default:
        if (role) {
          return `${role}: ${element.textContent?.trim() || ''}`;
        }
        return element.textContent?.trim() || '';
    }
  }

  /**
   * Announce text to screen readers
   */
  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.getElementById('screen-reader-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }
}

/**
 * Accessibility Manager class
 */
export class AccessibilityManager {
  private preferences: AccessibilityPreferences;
  private focusManager: FocusManager;
  private keyboardNavigation: KeyboardNavigationConfig;
  private validationResults: AccessibilityValidationResult[] = [];

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.focusManager = new FocusManager();
    this.keyboardNavigation = this.getDefaultKeyboardConfig();
    
    this.initializeAccessibility();
  }

  /**
   * Initialize accessibility features
   */
  private initializeAccessibility(): void {
    this.setupScreenReaderAnnouncer();
    this.setupKeyboardNavigation();
    this.applyUserPreferences();
    this.setupSkipLinks();
    this.monitorAccessibilityFeatures();
  }

  /**
   * Setup screen reader announcer element
   */
  private setupScreenReaderAnnouncer(): void {
    if (document.getElementById('screen-reader-announcer')) return;

    const announcer = document.createElement('div');
    announcer.id = 'screen-reader-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      top: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(announcer);
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', this.handleGlobalKeyDown.bind(this));
    
    // Add focus-visible polyfill behavior
    document.addEventListener('mousedown', () => {
      document.body.classList.add('using-mouse');
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.remove('using-mouse');
      }
    });
  }

  /**
   * Handle global keyboard navigation
   */
  private handleGlobalKeyDown(event: KeyboardEvent): void {
    const { key, ctrlKey, altKey, shiftKey } = event;

    // Handle skip links
    if (key === 'Tab' && !shiftKey && document.activeElement === document.body) {
      this.showSkipLinks();
    }

    // Handle escape key globally
    if (key === 'Escape') {
      this.handleEscapeKey(event);
    }

    // Handle custom key bindings
    const combination = this.getKeyCombination(event);
    const binding = this.keyboardNavigation.keyBindings[combination];
    
    if (binding) {
      event.preventDefault();
      this.executeKeyBinding(binding);
    }
  }

  /**
   * Get key combination string
   */
  private getKeyCombination(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    parts.push(event.key.toLowerCase());
    
    return parts.join('+');
  }

  /**
   * Execute key binding action
   */
  private executeKeyBinding(binding: string): void {
    switch (binding) {
      case 'skip-to-main':
        this.skipToMain();
        break;
      case 'toggle-high-contrast':
        this.toggleHighContrast();
        break;
      case 'increase-font-size':
        this.increaseFontSize();
        break;
      case 'decrease-font-size':
        this.decreaseFontSize();
        break;
      default:
        const element = document.querySelector(`[data-kb-target="${binding}"]`) as HTMLElement;
        if (element) {
          this.focusManager.setFocus(element);
        }
    }
  }

  /**
   * Handle escape key globally
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    // Close modals, dropdowns, etc.
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
    if (modal) {
      const closeButton = modal.querySelector('[aria-label*="close"], [data-close]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
      return;
    }

    // Close dropdowns
    const dropdown = document.querySelector('[aria-expanded="true"]') as HTMLElement;
    if (dropdown) {
      dropdown.setAttribute('aria-expanded', 'false');
      dropdown.focus();
    }
  }

  /**
   * Setup skip links
   */
  private setupSkipLinks(): void {
    if (document.getElementById('skip-links')) return;

    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.id = 'skip-links';
    skipLinksContainer.style.cssText = `
      position: absolute;
      top: -100px;
      left: 0;
      z-index: 9999;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      transition: top 0.3s;
    `;

    this.keyboardNavigation.skipTargets.forEach(({ label, target }) => {
      const link = document.createElement('a');
      link.href = `#${target}`;
      link.textContent = label;
      link.style.cssText = `
        display: block;
        color: #fff;
        text-decoration: none;
        padding: 4px 8px;
        margin: 2px 0;
      `;
      
      link.addEventListener('focus', () => {
        skipLinksContainer.style.top = '0';
      });
      
      link.addEventListener('blur', () => {
        skipLinksContainer.style.top = '-100px';
      });
      
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetElement = document.getElementById(target);
        if (targetElement) {
          this.focusManager.setFocus(targetElement);
        }
      });

      skipLinksContainer.appendChild(link);
    });

    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  /**
   * Show skip links
   */
  private showSkipLinks(): void {
    const skipLinks = document.getElementById('skip-links');
    if (skipLinks) {
      const firstLink = skipLinks.querySelector('a') as HTMLElement;
      if (firstLink) {
        firstLink.focus();
      }
    }
  }

  /**
   * Apply user accessibility preferences
   */
  private applyUserPreferences(): void {
    const { highContrast, reducedMotion, fontSize, enhancedFocusIndicators } = this.preferences;

    // Apply high contrast
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    }

    // Apply reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    }

    // Apply font size
    document.documentElement.setAttribute('data-font-size', fontSize);

    // Apply enhanced focus indicators
    if (enhancedFocusIndicators) {
      document.documentElement.classList.add('enhanced-focus');
    }
  }

  /**
   * Monitor accessibility features
   */
  private monitorAccessibilityFeatures(): void {
    // Monitor media queries for user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');

    prefersReducedMotion.addEventListener('change', (e) => {
      this.updatePreference('reducedMotion', e.matches);
    });

    prefersHighContrast.addEventListener('change', (e) => {
      this.updatePreference('highContrast', e.matches);
    });
  }

  /**
   * Skip to main content
   */
  private skipToMain(): void {
    const main = document.querySelector('main, [role="main"], #main-content') as HTMLElement;
    if (main) {
      this.focusManager.setFocus(main);
      this.focusManager.announceToScreenReader('Skipped to main content');
    }
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(): void {
    const newValue = !this.preferences.highContrast;
    this.updatePreference('highContrast', newValue);
    this.focusManager.announceToScreenReader(
      `High contrast mode ${newValue ? 'enabled' : 'disabled'}`
    );
  }

  /**
   * Increase font size
   */
  private increaseFontSize(): void {
    const sizes: AccessibilityPreferences['fontSize'][] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.preferences.fontSize);
    const nextIndex = Math.min(currentIndex + 1, sizes.length - 1);
    
    this.updatePreference('fontSize', sizes[nextIndex]);
    this.focusManager.announceToScreenReader(`Font size: ${sizes[nextIndex]}`);
  }

  /**
   * Decrease font size
   */
  private decreaseFontSize(): void {
    const sizes: AccessibilityPreferences['fontSize'][] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.preferences.fontSize);
    const nextIndex = Math.max(currentIndex - 1, 0);
    
    this.updatePreference('fontSize', sizes[nextIndex]);
    this.focusManager.announceToScreenReader(`Font size: ${sizes[nextIndex]}`);
  }

  /**
   * Update accessibility preference
   */
  updatePreference<K extends keyof AccessibilityPreferences>(
    key: K, 
    value: AccessibilityPreferences[K]
  ): void {
    this.preferences[key] = value;
    this.applyUserPreferences();
    this.savePreferences();
  }

  /**
   * Validate accessibility compliance
   */
  async validateAccessibility(): Promise<AccessibilityValidationResult> {
    const issues: AccessibilityIssue[] = [];
    let score = 100;

    // Check for missing alt text
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.getAttribute('alt')) {
        issues.push({
          severity: 'error',
          guideline: 'WCAG 1.1.1',
          description: 'Image missing alt text',
          element: `img:nth-child(${index + 1})`,
          suggestion: 'Add descriptive alt text to image',
          impact: 'serious'
        });
        score -= 10;
      }
    });

    // Check for missing form labels
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const hasLabel = input.getAttribute('aria-label') || 
                     input.getAttribute('aria-labelledby') ||
                     document.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        issues.push({
          severity: 'error',
          guideline: 'WCAG 1.3.1',
          description: 'Form control missing label',
          element: `${input.tagName.toLowerCase()}:nth-child(${index + 1})`,
          suggestion: 'Add label or aria-label to form control',
          impact: 'serious'
        });
        score -= 8;
      }
    });

    // Check color contrast (simplified)
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const style = getComputedStyle(button);
      const bgColor = style.backgroundColor;
      const textColor = style.color;
      
      // Simplified contrast check (would need more sophisticated algorithm)
      if (bgColor === textColor) {
        issues.push({
          severity: 'warning',
          guideline: 'WCAG 1.4.3',
          description: 'Insufficient color contrast',
          element: `button:nth-child(${index + 1})`,
          suggestion: 'Ensure sufficient color contrast ratio',
          impact: 'moderate'
        });
        score -= 5;
      }
    });

    // Check for heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level - lastLevel > 1) {
        issues.push({
          severity: 'warning',
          guideline: 'WCAG 1.3.1',
          description: 'Heading hierarchy not logical',
          element: `${heading.tagName.toLowerCase()}:nth-child(${index + 1})`,
          suggestion: 'Ensure proper heading hierarchy',
          impact: 'moderate'
        });
        score -= 3;
      }
      lastLevel = level;
    });

    const wcagLevel = score >= 95 ? 'AAA' : score >= 80 ? 'AA' : score >= 60 ? 'A' : 'Non-compliant';

    const result: AccessibilityValidationResult = {
      score: Math.max(0, score),
      wcagLevel,
      issues,
      recommendations: this.generateRecommendations(issues),
      timestamp: new Date()
    };

    this.validationResults.push(result);
    return result;
  }

  /**
   * Generate accessibility recommendations
   */
  private generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(issue => issue.guideline.includes('1.1.1'))) {
      recommendations.push('Add descriptive alternative text to all images');
    }
    
    if (issues.some(issue => issue.guideline.includes('1.3.1'))) {
      recommendations.push('Ensure proper form labels and heading hierarchy');
    }
    
    if (issues.some(issue => issue.guideline.includes('1.4.3'))) {
      recommendations.push('Check and improve color contrast ratios');
    }
    
    recommendations.push('Test with keyboard navigation');
    recommendations.push('Test with screen reader software');
    recommendations.push('Consider user testing with people with disabilities');
    
    return recommendations;
  }

  /**
   * Get default accessibility preferences
   */
  private getDefaultPreferences(): AccessibilityPreferences {
    return {
      highContrast: false,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      fontSize: 'medium',
      screenReaderOptimized: false,
      enhancedKeyboardNavigation: true,
      enhancedFocusIndicators: true,
      audioDescriptions: false,
      skipLinks: true
    };
  }

  /**
   * Get default keyboard navigation config
   */
  private getDefaultKeyboardConfig(): KeyboardNavigationConfig {
    return {
      keyBindings: {
        'alt+s': 'skip-to-main',
        'alt+h': 'toggle-high-contrast',
        'ctrl+=': 'increase-font-size',
        'ctrl+-': 'decrease-font-size'
      },
      skipTargets: [
        { label: 'Skip to main content', target: 'main-content' },
        { label: 'Skip to navigation', target: 'navigation' },
        { label: 'Skip to footer', target: 'footer' }
      ],
      escapeHandling: true,
      arrowKeyNavigation: true
    };
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Could not save accessibility preferences:', error);
    }
  }

  /**
   * Load preferences from localStorage
   */
  loadPreferences(): void {
    try {
      const saved = localStorage.getItem('accessibility-preferences');
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
        this.applyUserPreferences();
      }
    } catch (error) {
      console.warn('Could not load accessibility preferences:', error);
    }
  }

  /**
   * Public API methods
   */
  getPreferences(): AccessibilityPreferences {
    return { ...this.preferences };
  }

  getFocusManager(): FocusManager {
    return this.focusManager;
  }

  getValidationResults(): AccessibilityValidationResult[] {
    return [...this.validationResults];
  }

  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.focusManager.announceToScreenReader(message, priority);
  }
}
