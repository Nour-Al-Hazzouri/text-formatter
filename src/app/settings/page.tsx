'use client';

/**
 * Settings Page - Application settings and preferences
 * 
 * Basic settings page structure for future configuration options
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AccessibilitySettings } from '@/components/accessibility/AccessibilitySettings';
import { useState } from 'react';

const SETTING_CATEGORIES = [
  {
    id: 'accessibility',
    title: 'Accessibility',
    description: 'Screen reader, keyboard navigation, and visual preferences',
    icon: '♿',
    available: true
  },
  {
    id: 'formatting',
    title: 'Formatting Preferences',
    description: 'Default settings for text formatting and output styles',
    icon: '⚙️',
    available: false
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    description: 'Data storage, history retention, and privacy controls',
    icon: '🔒',
    available: false
  },
  {
    id: 'performance',
    title: 'Performance',
    description: 'Worker pool settings, caching, and optimization preferences',
    icon: '⚡',
    available: false
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Theme, colors, and visual customization options',
    icon: '🎨',
    available: false
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Push notifications, alerts, and update preferences',
    icon: '🔔',
    available: false
  }
];

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-handwritten text-orange-900 dark:text-orange-100 mb-4">
            ⚙️ Settings & Preferences
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your text formatting experience
          </p>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {SETTING_CATEGORIES.map((category) => (
            <Card 
              key={category.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeCategory === category.id ? 'ring-2 ring-orange-500' : ''
              } ${!category.available ? 'opacity-60' : ''}`}
              onClick={() => category.available && setActiveCategory(category.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {category.title}
                      {!category.available && (
                        <Badge variant="outline" className="text-xs">
                          Coming Soon
                        </Badge>
                      )}
                      {category.available && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          Available
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {category.description}
                </p>
                {category.available && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCategory(category.id);
                    }}
                  >
                    Configure
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Settings Panel */}
        {activeCategory === 'accessibility' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-handwritten text-orange-900 dark:text-orange-100">
                ♿ Accessibility Settings
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveCategory(null)}
              >
                Close
              </Button>
            </div>
            <AccessibilitySettings showAdvanced={true} />
          </div>
        )}

        {/* Coming Soon Features */}
        <Card>
          <CardHeader>
            <CardTitle>🚧 Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Formatting Preferences
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Default confidence thresholds</li>
                  <li>• Custom formatting templates</li>
                  <li>• Output format preferences</li>
                  <li>• Language and region settings</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Privacy & Data
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• History retention policies</li>
                  <li>• Data export and deletion</li>
                  <li>• Analytics opt-out options</li>
                  <li>• Local vs cloud storage</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Performance
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Worker pool configuration</li>
                  <li>• Cache management settings</li>
                  <li>• Processing timeout limits</li>
                  <li>• Memory usage optimization</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Appearance
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Custom color themes</li>
                  <li>• Font family and size options</li>
                  <li>• Layout customization</li>
                  <li>• Animation preferences</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📱 Application Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">Version</div>
                <div className="text-gray-600 dark:text-gray-400">1.0.0 (Phase 3 Complete)</div>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">Build</div>
                <div className="text-gray-600 dark:text-gray-400">Next.js 15.5 + TypeScript</div>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">Features</div>
                <div className="text-gray-600 dark:text-gray-400">6 Formatters, PWA, Accessibility</div>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">Status</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Production Ready</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
