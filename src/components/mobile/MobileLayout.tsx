'use client';

/**
 * Mobile Layout - Touch-optimized layout for mobile devices
 * 
 * Features:
 * - Mobile-first responsive design
 * - Touch-friendly interface elements
 * - Swipe gestures and mobile interactions
 * - Bottom sheet navigation
 * - Pull-to-refresh functionality
 * - Safe area handling for notched devices
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTouchGestures, useSwipeGestures } from '@/hooks/mobile/useTouchGestures';
import { usePWA } from '@/hooks/mobile/usePWA';
import type { FormatType } from '@/types';

interface MobileLayoutProps {
  /** Child components */
  children: React.ReactNode;
  
  /** Current page/section */
  currentPage?: string;
  
  /** Show mobile navigation */
  showNavigation?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Mobile navigation items
 */
const MOBILE_NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠', path: '/' },
  { id: 'format', label: 'Format', icon: '✨', path: '/format' },
  { id: 'history', label: 'History', icon: '📋', path: '/history' },
  { id: 'templates', label: 'Templates', icon: '📄', path: '/templates' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' }
];

/**
 * Format type cards for mobile interface
 */
const FORMAT_CARDS = [
  {
    type: 'meeting-notes' as FormatType,
    title: 'Meeting Notes',
    description: 'Organize meeting discussions and action items',
    icon: '📝',
    color: 'bg-blue-500'
  },
  {
    type: 'task-lists' as FormatType,
    title: 'Task Lists',
    description: 'Prioritize and organize your tasks',
    icon: '✅',
    color: 'bg-green-500'
  },
  {
    type: 'shopping-lists' as FormatType,
    title: 'Shopping Lists',
    description: 'Organize items by store category',
    icon: '🛒',
    color: 'bg-purple-500'
  },
  {
    type: 'journal-notes' as FormatType,
    title: 'Journal Notes',
    description: 'Process personal thoughts and experiences',
    icon: '📔',
    color: 'bg-orange-500'
  },
  {
    type: 'research-notes' as FormatType,
    title: 'Research Notes',
    description: 'Organize academic research and citations',
    icon: '📚',
    color: 'bg-indigo-500'
  },
  {
    type: 'study-notes' as FormatType,
    title: 'Study Notes',
    description: 'Create structured study materials',
    icon: '🎓',
    color: 'bg-pink-500'
  }
];

export function MobileLayout({ 
  children, 
  currentPage = 'home',
  showNavigation = true,
  className = '' 
}: MobileLayoutProps) {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState(currentPage);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { installApp, canInstall, isOnline, isRunningAsPWA } = usePWA();

  // Touch gesture handlers
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures({
    onSwipeUp: () => setShowBottomSheet(true),
    onSwipeDown: () => setShowBottomSheet(false),
    onPullDown: handlePullToRefresh
  });

  // Swipe gesture for navigation
  const { onSwipeLeft, onSwipeRight } = useSwipeGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 50
  });

  // Check for PWA install availability
  useEffect(() => {
    if (canInstall && !isRunningAsPWA) {
      setTimeout(() => setShowInstallPrompt(true), 2000);
    }
  }, [canInstall, isRunningAsPWA]);

  function handlePullToRefresh() {
    if (!isRefreshing) {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        // Trigger page refresh or data reload
        window.location.reload();
      }, 1500);
    }
  }

  function handleSwipeLeft() {
    // Navigate to next section
    const currentIndex = MOBILE_NAV_ITEMS.findIndex(item => item.id === activeNavItem);
    const nextIndex = (currentIndex + 1) % MOBILE_NAV_ITEMS.length;
    setActiveNavItem(MOBILE_NAV_ITEMS[nextIndex].id);
  }

  function handleSwipeRight() {
    // Navigate to previous section
    const currentIndex = MOBILE_NAV_ITEMS.findIndex(item => item.id === activeNavItem);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : MOBILE_NAV_ITEMS.length - 1;
    setActiveNavItem(MOBILE_NAV_ITEMS[prevIndex].id);
  }

  async function handleInstallApp() {
    const success = await installApp();
    if (success) {
      setShowInstallPrompt(false);
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`mobile-layout min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Safe area top */}
      <div className="safe-area-top bg-orange-500" />

      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-area-inset-top">
        {/* Pull to refresh indicator */}
        {isRefreshing && (
          <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 text-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Refreshing...
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-handwritten text-orange-600 dark:text-orange-400">
              Text Formatter
            </h1>
            {!isOnline && (
              <Badge variant="outline" className="text-xs text-red-500 border-red-500">
                Offline
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBottomSheet(true)}
              className="p-2"
              aria-label="Open menu"
            >
              <span className="text-lg">☰</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Install prompt banner */}
      {showInstallPrompt && (
        <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <div className="font-medium">Install App</div>
              <div className="text-sm opacity-90">Add to home screen for better experience</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInstallApp}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              Install
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstallPrompt(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <main 
        className="flex-1 pb-20 safe-area-inset-bottom"
        onTouchStart={onSwipeLeft}
        onTouchMove={onSwipeLeft}
        onTouchEnd={onSwipeRight}
      >
        {/* Format cards for home page */}
        {activeNavItem === 'home' && (
          <div className="p-4 space-y-4">
            <div className="text-center py-6">
              <h2 className="text-2xl font-handwritten text-gray-900 dark:text-gray-100 mb-2">
                Transform Your Text
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Choose a format type to get started
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FORMAT_CARDS.map((format) => (
                <Card 
                  key={format.type}
                  className="cursor-pointer transition-transform active:scale-95 hover:shadow-md"
                  onClick={() => {
                    // Navigate to format page
                    window.location.href = `/format/${format.type}`;
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${format.color} flex items-center justify-center text-white text-lg`}>
                        {format.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{format.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular content */}
        {activeNavItem !== 'home' && (
          <div className="p-4">
            {children}
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      {showNavigation && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom">
          <div className="flex items-center justify-around py-2">
            {MOBILE_NAV_ITEMS.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`flex flex-col items-center gap-1 p-2 min-w-0 ${
                  activeNavItem === item.id 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                onClick={() => {
                  setActiveNavItem(item.id);
                  if (item.path !== '#') {
                    window.location.href = item.path;
                  }
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            ))}
          </div>
        </nav>
      )}

      {/* Bottom sheet overlay */}
      {showBottomSheet && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowBottomSheet(false)}
        >
          <div 
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-xl p-6 safe-area-inset-bottom animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Quick Actions
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => {
                  setShowBottomSheet(false);
                  // Handle share
                }}
              >
                <span className="text-2xl">📤</span>
                <span>Share</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => {
                  setShowBottomSheet(false);
                  // Handle export
                }}
              >
                <span className="text-2xl">💾</span>
                <span>Export</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => {
                  setShowBottomSheet(false);
                  window.location.href = '/settings';
                }}
              >
                <span className="text-2xl">⚙️</span>
                <span>Settings</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => {
                  setShowBottomSheet(false);
                  // Handle feedback
                }}
              >
                <span className="text-2xl">💬</span>
                <span>Feedback</span>
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setShowBottomSheet(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Safe area bottom */}
      <div className="safe-area-bottom" />
    </div>
  );
}
