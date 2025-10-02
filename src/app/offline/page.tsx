'use client';

/**
 * Offline Page - Fallback page when user is offline
 * 
 * Features:
 * - Offline-first design
 * - Available offline functionality
 * - Network status detection
 * - Cached content access
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileLayout } from '@/components/mobile/MobileLayout';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Monitor online status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.href = '/';
    } else {
      // Try to refresh the page
      window.location.reload();
    }
  };

  const availableOfflineFeatures = [
    {
      title: 'Basic Text Formatting',
      description: 'Simple text organization and basic formatting',
      icon: '✨',
      available: true
    },
    {
      title: 'Cached Templates',
      description: 'Previously saved templates and configurations',
      icon: '📄',
      available: true
    },
    {
      title: 'Local History',
      description: 'Recently formatted text from local storage',
      icon: '📋',
      available: true
    },
    {
      title: 'Settings & Preferences',
      description: 'App settings and accessibility preferences',
      icon: '⚙️',
      available: true
    }
  ];

  const unavailableFeatures = [
    {
      title: 'Advanced AI Processing',
      description: 'Complex pattern recognition and analysis',
      icon: '🧠',
      available: false
    },
    {
      title: 'Cloud Sync',
      description: 'Synchronize data across devices',
      icon: '☁️',
      available: false
    },
    {
      title: 'Template Sharing',
      description: 'Share and discover community templates',
      icon: '🤝',
      available: false
    },
    {
      title: 'Performance Analytics',
      description: 'Real-time performance monitoring',
      icon: '📊',
      available: false
    }
  ];

  return (
    <MobileLayout currentPage="offline" showNavigation={false}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Status Header */}
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-2xl font-handwritten text-gray-900 dark:text-gray-100 mb-2">
            You're Offline
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Some features are still available while offline
          </p>
          
          <div className="flex items-center justify-center gap-2">
            <Badge 
              variant={isOnline ? "default" : "destructive"}
              className={isOnline ? "bg-green-500" : "bg-red-500"}
            >
              {isOnline ? 'Back Online!' : 'Offline Mode'}
            </Badge>
            {lastSync && (
              <span className="text-sm text-gray-500">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{isOnline ? '🟢' : '🔴'}</span>
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isOnline ? (
              <div className="space-y-3">
                <p className="text-green-600 dark:text-green-400 font-medium">
                  ✅ Connection restored!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All features are now available. Any offline changes will be synchronized.
                </p>
                <Button onClick={handleRetry} className="w-full">
                  Return to App
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-red-600 dark:text-red-400 font-medium">
                  ❌ No internet connection
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Check your network connection and try again. You can still use basic features below.
                </p>
                <Button onClick={handleRetry} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Offline Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>✅</span>
              Available Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableOfflineFeatures.map((feature) => (
                <div 
                  key={feature.title}
                  className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <div className="font-medium text-green-800 dark:text-green-200">
                      {feature.title}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {feature.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Unavailable Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>⚠️</span>
              Requires Internet Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unavailableFeatures.map((feature) => (
                <div 
                  key={feature.title}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-60"
                >
                  <span className="text-2xl grayscale">{feature.icon}</span>
                  <div>
                    <div className="font-medium text-gray-600 dark:text-gray-400">
                      {feature.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      {feature.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => window.location.href = '/format/meeting-notes'}
              >
                <span className="text-2xl">📝</span>
                <span className="text-sm">Basic Format</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => window.location.href = '/history'}
              >
                <span className="text-2xl">📋</span>
                <span className="text-sm">View History</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => window.location.href = '/templates'}
              >
                <span className="text-2xl">📄</span>
                <span className="text-sm">Templates</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => window.location.href = '/settings'}
              >
                <span className="text-2xl">⚙️</span>
                <span className="text-sm">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips for Offline Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>💡</span>
              Offline Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Your offline work will automatically sync when you reconnect</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Basic text formatting works without internet</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Previously cached templates remain available</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Settings and preferences are stored locally</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          <p>Text Formatter PWA • Version 1.0.0</p>
          <p>Optimized for offline use</p>
        </div>
      </div>
    </MobileLayout>
  );
}
