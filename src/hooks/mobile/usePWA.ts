/**
 * PWA Hook - Progressive Web App functionality integration
 * 
 * React hook wrapper for PWA Manager functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { pwaManager } from '@/lib/mobile/PWAManager';
import type { PWAUpdateInfo } from '@/lib/mobile/PWAManager';

/**
 * PWA hook return type
 */
export interface UsePWAResult {
  /** Whether the app can be installed */
  canInstall: boolean;
  
  /** Whether app is running as PWA */
  isRunningAsPWA: boolean;
  
  /** Whether device is online */
  isOnline: boolean;
  
  /** Available app update info */
  updateInfo: PWAUpdateInfo | null;
  
  /** Install the app */
  installApp: () => Promise<boolean>;
  
  /** Update the app to latest version */
  updateApp: () => Promise<void>;
  
  /** Request persistent storage */
  requestPersistentStorage: () => Promise<boolean>;
  
  /** Get storage estimate */
  getStorageEstimate: () => Promise<StorageEstimate | null>;
  
  /** Register for background sync */
  registerBackgroundSync: (tag: string) => Promise<void>;
  
  /** Request notification permission */
  requestNotificationPermission: () => Promise<NotificationPermission>;
  
  /** Subscribe to push notifications */
  subscribeToPush: () => Promise<PushSubscription | null>;
}

/**
 * PWA functionality hook
 */
export function usePWA(): UsePWAResult {
  const [canInstall, setCanInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateInfo, setUpdateInfo] = useState<PWAUpdateInfo | null>(null);

  // Initialize PWA manager and setup listeners
  useEffect(() => {
    // Set initial states
    setCanInstall(pwaManager.canInstall());
    setIsOnline(pwaManager.getOnlineStatus());

    // Setup event listeners
    pwaManager.onInstallAvailable(setCanInstall);
    pwaManager.onOnlineStatusChange(setIsOnline);
    pwaManager.onUpdateAvailable(setUpdateInfo);

    // Cleanup
    return () => {
      pwaManager.destroy();
    };
  }, []);

  // Install app
  const installApp = useCallback(async (): Promise<boolean> => {
    return await pwaManager.installApp();
  }, []);

  // Update app
  const updateApp = useCallback(async (): Promise<void> => {
    await pwaManager.updateApp();
  }, []);

  // Request persistent storage
  const requestPersistentStorage = useCallback(async (): Promise<boolean> => {
    return await pwaManager.requestPersistentStorage();
  }, []);

  // Get storage estimate
  const getStorageEstimate = useCallback(async (): Promise<StorageEstimate | null> => {
    return await pwaManager.getStorageEstimate();
  }, []);

  // Register background sync
  const registerBackgroundSync = useCallback(async (tag: string): Promise<void> => {
    await pwaManager.registerBackgroundSync(tag);
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    return await pwaManager.requestNotificationPermission();
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    return await pwaManager.subscribeToPush();
  }, []);

  return {
    canInstall,
    isRunningAsPWA: pwaManager.isRunningAsPWA(),
    isOnline,
    updateInfo,
    installApp,
    updateApp,
    requestPersistentStorage,
    getStorageEstimate,
    registerBackgroundSync,
    requestNotificationPermission,
    subscribeToPush
  };
}
