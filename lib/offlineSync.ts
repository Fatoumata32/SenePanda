/**
 * Offline Sync Manager
 * Handles offline data storage and synchronization
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';

const SYNC_QUEUE_KEY = '@senepanda_sync_queue';
const OFFLINE_DATA_KEY = '@senepanda_offline_data';
const LAST_SYNC_KEY = '@senepanda_last_sync';

export type SyncAction =
  | 'create'
  | 'update'
  | 'delete';

export interface SyncQueueItem {
  id: string;
  table: string;
  action: SyncAction;
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface OfflineData {
  [key: string]: any;
}

class OfflineSyncManager {
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;
  private isOnline = true;
  private listeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Load sync queue from storage
    await this.loadSyncQueue();

    // Monitor network status
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners
      this.listeners.forEach(listener => listener(this.isOnline));

      // If we just came back online, sync
      if (!wasOnline && this.isOnline) {
        this.syncAll();
      }
    });
  }

  /**
   * Add a listener for online status changes
   */
  public addOnlineListener(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue() {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Add item to sync queue
   */
  public async addToQueue(
    table: string,
    action: SyncAction,
    data: any
  ): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: `${Date.now()}-${Math.random()}`,
      table,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(queueItem);
    await this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncAll();
    }
  }

  /**
   * Sync all pending items
   */
  public async syncAll(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    try {
      const itemsToSync = [...this.syncQueue];
      const successfulItems: string[] = [];

      for (const item of itemsToSync) {
        try {
          await this.syncItem(item);
          successfulItems.push(item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);

          // Increment retry count
          item.retryCount++;

          // Remove item if it has been retried too many times
          if (item.retryCount >= 5) {
            console.warn(`Removing item ${item.id} after 5 failed attempts`);
            successfulItems.push(item.id);
          }
        }
      }

      // Remove successfully synced items from queue
      this.syncQueue = this.syncQueue.filter(
        item => !successfulItems.includes(item.id)
      );
      await this.saveSyncQueue();

      // Update last sync timestamp
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const { table, action, data } = item;

    switch (action) {
      case 'create':
        await supabase.from(table).insert(data);
        break;

      case 'update':
        await supabase.from(table).update(data).eq('id', data.id);
        break;

      case 'delete':
        await supabase.from(table).delete().eq('id', data.id);
        break;
    }
  }

  /**
   * Get offline data for a specific key
   */
  public async getOfflineData<T = any>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(`${OFFLINE_DATA_KEY}_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  /**
   * Save data for offline use
   */
  public async saveOfflineData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${OFFLINE_DATA_KEY}_${key}`,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  /**
   * Clear offline data for a specific key
   */
  public async clearOfflineData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${OFFLINE_DATA_KEY}_${key}`);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }

  /**
   * Get queue size
   */
  public getQueueSize(): number {
    return this.syncQueue.length;
  }

  /**
   * Check if online
   */
  public getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get last sync timestamp
   */
  public async getLastSyncTime(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Clear all sync data
   */
  public async clearAll(): Promise<void> {
    this.syncQueue = [];
    await AsyncStorage.multiRemove([
      SYNC_QUEUE_KEY,
      LAST_SYNC_KEY,
    ]);
  }
}

// Singleton instance
export const offlineSync = new OfflineSyncManager();

/**
 * Hook for using offline sync in components
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = React.useState(offlineSync.getIsOnline());
  const [queueSize, setQueueSize] = React.useState(offlineSync.getQueueSize());

  React.useEffect(() => {
    const unsubscribe = offlineSync.addOnlineListener((online) => {
      setIsOnline(online);
      setQueueSize(offlineSync.getQueueSize());
    });

    // Update queue size periodically
    const interval = setInterval(() => {
      setQueueSize(offlineSync.getQueueSize());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    queueSize,
    addToQueue: offlineSync.addToQueue.bind(offlineSync),
    syncAll: offlineSync.syncAll.bind(offlineSync),
    getOfflineData: offlineSync.getOfflineData.bind(offlineSync),
    saveOfflineData: offlineSync.saveOfflineData.bind(offlineSync),
    clearOfflineData: offlineSync.clearOfflineData.bind(offlineSync),
    getLastSyncTime: offlineSync.getLastSyncTime.bind(offlineSync),
  };
}

export default offlineSync;
