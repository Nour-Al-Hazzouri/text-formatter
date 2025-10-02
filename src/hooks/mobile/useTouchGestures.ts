/**
 * Touch Gestures Hooks - Mobile touch interaction handling
 * 
 * Features:
 * - Swipe gesture detection (up, down, left, right)
 * - Pull-to-refresh functionality
 * - Pinch-to-zoom handling
 * - Long press detection
 * - Touch feedback and haptics
 */

import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Touch gesture configuration
 */
interface TouchGestureConfig {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPullDown?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  threshold?: number;
  pullThreshold?: number;
  longPressDelay?: number;
}

/**
 * Swipe gesture configuration
 */
interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocity?: number;
}

/**
 * Touch point interface
 */
interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Main touch gestures hook
 */
export function useTouchGestures(config: TouchGestureConfig = {}) {
  const {
    onSwipeUp,
    onSwipeDown, 
    onSwipeLeft,
    onSwipeRight,
    onPullDown,
    onLongPress,
    onPinch,
    threshold = 50,
    pullThreshold = 100,
    longPressDelay = 500
  } = config;

  const startPoint = useRef<TouchPoint | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    startPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
        triggerHapticFeedback('medium');
      }, longPressDelay);
    }

    // Handle pinch start
    if (event.touches.length === 2 && onPinch) {
      // Pinch gesture handling would go here
    }
  }, [onLongPress, longPressDelay, onPinch]);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (!startPoint.current) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - startPoint.current.x;
    const deltaY = touch.clientY - startPoint.current.y;

    // Clear long press on movement
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Handle pull-to-refresh
    if (deltaY > 0 && Math.abs(deltaX) < 30 && window.scrollY === 0) {
      setIsPulling(true);
      setPullDistance(deltaY);
      
      if (deltaY > pullThreshold) {
        event.preventDefault();
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }

    // Handle pinch gesture
    if (event.touches.length === 2 && onPinch) {
      event.preventDefault();
      // Calculate pinch scale and call onPinch
    }
  }, [pullThreshold, onPinch]);

  const onTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!startPoint.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startPoint.current.x;
    const deltaY = touch.clientY - startPoint.current.y;
    const deltaTime = Date.now() - startPoint.current.timestamp;
    
    // Clear timers
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Handle pull-to-refresh
    if (isPulling && pullDistance > pullThreshold && onPullDown) {
      onPullDown();
      triggerHapticFeedback('light');
    }

    setIsPulling(false);
    setPullDistance(0);

    // Determine swipe direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    // Only trigger swipe if movement is significant and fast enough
    if ((absX > threshold || absY > threshold) && velocity > 0.3) {
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
          triggerHapticFeedback('light');
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
          triggerHapticFeedback('light');
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
          triggerHapticFeedback('light');
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
          triggerHapticFeedback('light');
        }
      }
    }

    startPoint.current = null;
  }, [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onPullDown, threshold, isPulling, pullDistance, pullThreshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isPulling,
    pullDistance
  };
}

/**
 * Simplified swipe gestures hook
 */
export function useSwipeGestures(config: SwipeGestureConfig = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocity = 0.3
  } = config;

  const startPoint = useRef<TouchPoint | null>(null);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    startPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
  }, []);

  const onTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!startPoint.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startPoint.current.x;
    const deltaY = touch.clientY - startPoint.current.y;
    const deltaTime = Date.now() - startPoint.current.timestamp;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const currentVelocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    if ((absX > threshold || absY > threshold) && currentVelocity > velocity) {
      if (absX > absY) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    startPoint.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocity]);

  return {
    onSwipeLeft: onTouchStart,
    onSwipeRight: onTouchEnd
  };
}

/**
 * Long press gesture hook
 */
export function useLongPress(
  onLongPress: () => void,
  delay = 500
) {
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();
    setIsPressed(true);
    
    timerRef.current = setTimeout(() => {
      onLongPress();
      triggerHapticFeedback('medium');
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback(() => {
    setIsPressed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    isPressed
  };
}

/**
 * Pull to refresh hook
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  threshold = 80
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef<number>(0);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = event.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return;

    const currentY = event.touches[0].clientY;
    const deltaY = currentY - startY.current;

    if (deltaY > 0) {
      setIsPulling(true);
      setPullDistance(Math.min(deltaY, threshold * 2));
      
      if (deltaY > threshold) {
        event.preventDefault();
      }
    }
  }, [threshold, isRefreshing]);

  const onTouchEnd = useCallback(async () => {
    if (isPulling && pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHapticFeedback('medium');
      
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
        }, 500);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isRefreshing,
    isPulling,
    pullDistance,
    shouldShowIndicator: isPulling && pullDistance > 20
  };
}

/**
 * Pinch to zoom hook
 */
export function usePinchToZoom(
  onZoom: (scale: number, center: { x: number; y: number }) => void,
  minScale = 0.5,
  maxScale = 3
) {
  const initialDistance = useRef<number>(0);
  const initialScale = useRef<number>(1);
  const [currentScale, setCurrentScale] = useState(1);

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: Touch, touch2: Touch) => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  });

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      const [touch1, touch2] = event.touches;
      initialDistance.current = getDistance(touch1, touch2);
      initialScale.current = currentScale;
    }
  }, [currentScale]);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      
      const [touch1, touch2] = event.touches;
      const distance = getDistance(touch1, touch2);
      const scale = Math.max(minScale, Math.min(maxScale, 
        (distance / initialDistance.current) * initialScale.current
      ));
      
      setCurrentScale(scale);
      onZoom(scale, getCenter(touch1, touch2));
      
      if (scale !== currentScale) {
        triggerHapticFeedback('selection');
      }
    }
  }, [onZoom, minScale, maxScale, currentScale]);

  return {
    onTouchStart,
    onTouchMove,
    currentScale,
    resetScale: () => setCurrentScale(1)
  };
}

/**
 * Haptic feedback utility
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'selection' = 'light'): void {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50],
      selection: [5]
    };
    
    navigator.vibrate(patterns[type]);
  }
}

/**
 * Device orientation hook
 */
export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

/**
 * Safe area hooks for notched devices
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0')
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}
