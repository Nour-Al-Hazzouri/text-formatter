/**
 * PWA Manager - Progressive Web App functionality
 * 
 * Features:
 * - Service worker registration and management
 * - Install prompt handling
 * - Offline detection and management
 * - Background sync coordination
 * - Push notification management
 * - App update handling
 */

/**
 * PWA installation prompt event
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/**
 * PWA update notification types
 */
export type PWAUpdateType = 'available' | 'ready' | 'error';

export interface PWAUpdateInfo {
  type: PWAUpdateType;
  message: string;
  registration?: ServiceWorkerRegistration;
  error?: Error;
}

/**
 * PWA Manager class
 */
export class PWAManager {
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private updateCallbacks: ((info: PWAUpdateInfo) => void)[] = [];
  private installCallbacks: ((canInstall: boolean) => void)[] = [];
  private onlineCallbacks: ((isOnline: boolean) => void)[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.setupEventListeners();
    this.registerServiceWorker();
  }

  /**
   * Setup PWA event listeners
   */
  private setupEventListeners(): void {
    // Install prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as BeforeInstallPromptEvent;
      this.notifyInstallAvailable(true);
    });

    // App installation detection
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was installed');
      this.installPrompt = null;
      this.notifyInstallAvailable(false);
    });

    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyOnlineStatus(true);
      this.triggerBackgroundSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyOnlineStatus(false);
    });

    // Handle service worker messages
    navigator.serviceWorker?.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.registration = registration;
      console.log('[PWA] Service Worker registered successfully');

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          this.handleServiceWorkerUpdate(newWorker);
        }
      });

      // Check for waiting service worker
      if (registration.waiting) {
        this.notifyUpdate({
          type: 'ready',
          message: 'New version ready to install',
          registration
        });
      }

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      this.notifyUpdate({
        type: 'error',
        message: 'Failed to register service worker',
        error: error as Error
      });
    }
  }

  /**
   * Handle service worker updates
   */
  private handleServiceWorkerUpdate(worker: ServiceWorker): void {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New update available
          this.notifyUpdate({
            type: 'available',
            message: 'New version available',
            registration: this.registration!
          });
        } else {
          // First install
          this.notifyUpdate({
            type: 'ready',
            message: 'App ready for offline use',
            registration: this.registration!
          });
        }
      }
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('[PWA] Cache updated:', data.payload);
        break;
      case 'OFFLINE_READY':
        console.log('[PWA] App ready for offline use');
        break;
      case 'SYNC_COMPLETED':
        console.log('[PWA] Background sync completed');
        break;
    }
  }

  /**
   * Trigger app installation
   */
  async installApp(): Promise<boolean> {
    if (!this.installPrompt) {
      console.log('[PWA] Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        this.installPrompt = null;
        return true;
      } else {
        console.log('[PWA] User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Update the app to latest version
   */
  async updateApp(): Promise<void> {
    if (!this.registration?.waiting) {
      console.log('[PWA] No update available');
      return;
    }

    // Send skip waiting message
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload page after control is claimed
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return this.installPrompt !== null;
  }

  /**
   * Check if app is running as PWA
   */
  isRunningAsPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  /**
   * Get online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log('[PWA] Persistent storage:', persistent ? 'granted' : 'denied');
        return persistent;
      } catch (error) {
        console.error('[PWA] Persistent storage request failed:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Get storage estimate
   */
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        console.log('[PWA] Storage estimate:', estimate);
        return estimate;
      } catch (error) {
        console.error('[PWA] Storage estimate failed:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Register for background sync
   */
  async registerBackgroundSync(tag: string): Promise<void> {
    if (!this.registration?.sync) {
      console.log('[PWA] Background Sync not supported');
      return;
    }

    try {
      await this.registration.sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
    }
  }

  /**
   * Trigger background sync manually
   */
  private triggerBackgroundSync(): void {
    this.registerBackgroundSync('format-sync');
    this.registerBackgroundSync('history-sync');
  }

  /**
   * Request push notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration?.pushManager) {
      console.log('[PWA] Push messaging not supported');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'YOUR_VAPID_PUBLIC_KEY' // Replace with actual VAPID key
        )
      });
      
      console.log('[PWA] Push subscription created');
      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return null;
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Event subscription methods
   */
  onUpdateAvailable(callback: (info: PWAUpdateInfo) => void): void {
    this.updateCallbacks.push(callback);
  }

  onInstallAvailable(callback: (canInstall: boolean) => void): void {
    this.installCallbacks.push(callback);
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void): void {
    this.onlineCallbacks.push(callback);
  }

  /**
   * Notification methods
   */
  private notifyUpdate(info: PWAUpdateInfo): void {
    this.updateCallbacks.forEach(callback => callback(info));
  }

  private notifyInstallAvailable(canInstall: boolean): void {
    this.installCallbacks.forEach(callback => callback(canInstall));
  }

  private notifyOnlineStatus(isOnline: boolean): void {
    this.onlineCallbacks.forEach(callback => callback(isOnline));
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.updateCallbacks = [];
    this.installCallbacks = [];
    this.onlineCallbacks = [];
  }
}

/**
 * Default PWA manager instance
 */
export const pwaManager = new PWAManager();
