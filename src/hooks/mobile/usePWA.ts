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
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : false);
  const [updateInfo, setUpdateInfo] = useState<PWAUpdateInfo | null>(null);

  // Initialize PWA manager and setup listeners
  useEffect(() => {
    if (pwaManager) {
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
    }
  }, []);

  // Install app
  const installApp = useCallback(async (): Promise<boolean> => {
    return pwaManager ? await pwaManager.installApp() : false;
  }, []);

  // Update app
  const updateApp = useCallback(async (): Promise<void> => {
    if (pwaManager) await pwaManager.updateApp();
  }, []);

  // Request persistent storage
  const requestPersistentStorage = useCallback(async (): Promise<boolean> => {
    return pwaManager ? await pwaManager.requestPersistentStorage() : false;
  }, []);

  // Get storage estimate
  const getStorageEstimate = useCallback(async (): Promise<StorageEstimate | null> => {
    return pwaManager ? await pwaManager.getStorageEstimate() : null;
  }, []);

  // Register background sync
  const registerBackgroundSync = useCallback(async (tag: string): Promise<void> => {
    if (pwaManager) await pwaManager.registerBackgroundSync(tag);
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    return pwaManager ? await pwaManager.requestNotificationPermission() : 'denied';
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    return pwaManager ? await pwaManager.subscribeToPush() : null;
  }, []);

  return {
    canInstall,
    isRunningAsPWA: pwaManager ? pwaManager.isRunningAsPWA() : false,
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
