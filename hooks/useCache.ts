import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@senepanda_cache_';
const DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export function useCache<T>(key: string, fetchFn: () => Promise<T>, expiry: number = DEFAULT_EXPIRY) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cacheKey = CACHE_PREFIX + key;

  useEffect(() => {
    loadData();
  }, [key]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const cacheItem: CacheItem<T> = JSON.parse(cached);
        const now = Date.now();

        if (now - cacheItem.timestamp < cacheItem.expiry) {
          // Cache is valid
          setData(cacheItem.data);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const freshData = await fetchFn();
      setData(freshData);

      // Save to cache
      const cacheItem: CacheItem<T> = {
        data: freshData,
        timestamp: Date.now(),
        expiry,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (err) {
      setError(err as Error);
      console.error('Cache error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const freshData = await fetchFn();
      setData(freshData);

      const cacheItem: CacheItem<T> = {
        data: freshData,
        timestamp: Date.now(),
        expiry,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const invalidate = async () => {
    try {
      await AsyncStorage.removeItem(cacheKey);
    } catch (err) {
      console.error('Error invalidating cache:', err);
    }
  };

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
  };
}

// Utility function to clear all cache
export async function clearAllCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}
