'use client';

/**
 * Accessibility Settings - User preference controls for accessibility features
 * 
 * Features:
 * - High contrast mode toggle
 * - Font size adjustment
 * - Motion reduction preferences
 * - Screen reader optimizations
 * - Keyboard navigation enhancements
 * - Accessibility validation dashboard
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAccessibility, useAccessibilityValidation } from '@/hooks/accessibility/useAccessibility';
import type { AccessibilityPreferences } from '@/lib/accessibility/AccessibilityManager';

interface AccessibilitySettingsProps {
  /** Additional CSS classes */
  className?: string;
  
  /** Whether to show advanced settings */
  showAdvanced?: boolean;
}

/**
 * Font size options
 */
const FONT_SIZE_OPTIONS: { value: AccessibilityPreferences['fontSize']; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra Large' }
];

export function AccessibilitySettings({ 
  className = '',
  showAdvanced = false 
}: AccessibilitySettingsProps) {
  const { 
    preferences, 
    updatePreference, 
    toggleHighContrast, 
    announce, 
    isReady 
  } = useAccessibility();
  
  const { 
    validationResult, 
    isValidating, 
    runValidation 
  } = useAccessibilityValidation();

  const [showValidationDetails, setShowValidationDetails] = useState(false);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading accessibility settings...</div>
        </div>
      </div>
    );
  }

  const handlePreferenceChange = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    updatePreference(key, value);
    announce(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleFontSizeChange = (fontSize: AccessibilityPreferences['fontSize']) => {
    updatePreference('fontSize', fontSize);
    announce(`Font size changed to ${fontSize}`);
  };

  const handleValidation = async () => {
    await runValidation();
    announce('Accessibility validation completed');
  };

  const getValidationScoreColor = (score: number): string => {
    if (score >= 95) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'serious': return 'bg-orange-100 text-orange-700';
      case 'moderate': return 'bg-yellow-100 text-yellow-700';
      case 'minor': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`accessibility-settings space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-handwritten text-orange-900 dark:text-orange-100 mb-2">
          ♿ Accessibility Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Customize your accessibility preferences for better usability
        </p>
      </div>

      {/* Visual Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>👁️ Visual Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="high-contrast" className="font-medium">
                High Contrast Mode
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enhance contrast for better visibility
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={preferences.highContrast}
              onCheckedChange={(checked: boolean) => {
                if (checked) {
                  toggleHighContrast();
                } else {
                  handlePreferenceChange('highContrast', false);
                }
              }}
              aria-describedby="high-contrast-description"
            />
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <Label className="font-medium">Font Size</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {FONT_SIZE_OPTIONS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={preferences.fontSize === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFontSizeChange(value)}
                  className={`${preferences.fontSize === value ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                  aria-pressed={preferences.fontSize === value}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="reduced-motion" className="font-medium">
                Reduce Motion
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              id="reduced-motion"
              checked={preferences.reducedMotion}
              onCheckedChange={(checked: boolean) => handlePreferenceChange('reducedMotion', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⌨️ Navigation Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Keyboard Navigation */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enhanced-keyboard" className="font-medium">
                Enhanced Keyboard Navigation
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Improved keyboard shortcuts and navigation
              </p>
            </div>
            <Switch
              id="enhanced-keyboard"
              checked={preferences.enhancedKeyboardNavigation}
              onCheckedChange={(checked: boolean) => handlePreferenceChange('enhancedKeyboardNavigation', checked)}
            />
          </div>

          {/* Enhanced Focus Indicators */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enhanced-focus" className="font-medium">
                Enhanced Focus Indicators
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stronger visual focus indicators
              </p>
            </div>
            <Switch
              id="enhanced-focus"
              checked={preferences.enhancedFocusIndicators}
              onCheckedChange={(checked: boolean) => handlePreferenceChange('enhancedFocusIndicators', checked)}
            />
          </div>

          {/* Skip Links */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="skip-links" className="font-medium">
                Skip Links
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quick navigation links for keyboard users
              </p>
            </div>
            <Switch
              id="skip-links"
              checked={preferences.skipLinks}
              onCheckedChange={(checked: boolean) => handlePreferenceChange('skipLinks', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Screen Reader Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔊 Screen Reader Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Screen Reader Optimized */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="screen-reader" className="font-medium">
                Screen Reader Optimizations
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enhanced announcements and descriptions
              </p>
            </div>
            <Switch
              id="screen-reader"
              checked={preferences.screenReaderOptimized}
              onCheckedChange={(checked: boolean) => handlePreferenceChange('screenReaderOptimized', checked)}
            />
          </div>

          {/* Audio Descriptions */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="audio-descriptions" className="font-medium">
                Audio Descriptions
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Audio descriptions for visual content
              </p>
            </div>
            <Switch
              id="audio-descriptions"
              checked={preferences.audioDescriptions}
              onCheckedChange={(checked: boolean) => handlePreferenceChange('audioDescriptions', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>🔍 Accessibility Validation</span>
            <Button
              onClick={handleValidation}
              disabled={isValidating}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isValidating ? 'Validating...' : 'Run Validation'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validationResult ? (
            <div className="space-y-4">
              {/* Validation Score */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Accessibility Score
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Last checked: {validationResult.timestamp.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getValidationScoreColor(validationResult.score)}`}>
                    {validationResult.score}%
                  </div>
                  <Badge className={getValidationScoreColor(validationResult.score)}>
                    WCAG {validationResult.wcagLevel}
                  </Badge>
                </div>
              </div>

              {/* Issues Summary */}
              {validationResult.issues.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Issues Found ({validationResult.issues.length})
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowValidationDetails(!showValidationDetails)}
                    >
                      {showValidationDetails ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </div>

                  {showValidationDetails && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {validationResult.issues.map((issue, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-medium text-sm">{issue.description}</div>
                            <Badge className={getImpactColor(issue.impact)}>
                              {issue.impact}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Guideline: {issue.guideline}
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            {issue.suggestion}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {validationResult.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {validationResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <div>Run validation to check accessibility compliance</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>⌨️ Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Skip to main content</span>
                <Badge variant="outline">Alt + S</Badge>
              </div>
              <div className="flex justify-between">
                <span>Toggle high contrast</span>
                <Badge variant="outline">Alt + H</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Increase font size</span>
                <Badge variant="outline">Ctrl + =</Badge>
              </div>
              <div className="flex justify-between">
                <span>Decrease font size</span>
                <Badge variant="outline">Ctrl + -</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handlePreferenceChange('highContrast', true);
                handlePreferenceChange('enhancedFocusIndicators', true);
                handlePreferenceChange('screenReaderOptimized', true);
                announce('Applied accessibility-focused preset');
              }}
            >
              🎯 Accessibility Focused
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handlePreferenceChange('reducedMotion', true);
                handlePreferenceChange('fontSize', 'large');
                announce('Applied low vision preset');
              }}
            >
              👁️ Low Vision
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handlePreferenceChange('enhancedKeyboardNavigation', true);
                handlePreferenceChange('skipLinks', true);
                announce('Applied keyboard navigation preset');
              }}
            >
              ⌨️ Keyboard Only
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
