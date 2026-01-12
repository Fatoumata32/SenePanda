/**
 * Utilitaires d'optimisation des performances
 */

import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Debounce - Limite le nombre d'appels d'une fonction
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle - Limite la fréquence d'exécution d'une fonction
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Hook pour exécuter une tâche après les interactions
 * Utile pour les animations et transitions
 */
export function useInteractionManager(callback: () => void, deps: any[] = []) {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      callback();
    });

    return () => task.cancel();
  }, deps);
}

/**
 * Hook pour un debounce
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour throttle
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useRef<T>(
    throttle(callback, delay) as T
  );

  useEffect(() => {
    throttledCallback.current = throttle(callback, delay) as T;
  }, [callback, delay]);

  return throttledCallback.current;
}

/**
 * Cache simple avec expiration
 */
class SimpleCache<T> {
  private cache: Map<string, { data: T; timestamp: number }> = new Map();
  private ttl: number;

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Export d'instances de cache pour différents usages
export const profileCache = new SimpleCache(10); // 10 minutes
export const productsCache = new SimpleCache(5); // 5 minutes
export const statsCache = new SimpleCache(2); // 2 minutes

/**
 * Optimisation d'images
 */
export const getOptimizedImageUri = (uri: string, width: number): string => {
  if (!uri) return uri;

  // Si c'est une URL Supabase
  if (uri.includes('supabase.co/storage')) {
    // Ajouter des paramètres de transformation d'image
    const url = new URL(uri);
    url.searchParams.set('width', width.toString());
    url.searchParams.set('quality', '80');
    return url.toString();
  }

  // Si c'est UI Avatars, optimiser la taille
  if (uri.includes('ui-avatars.com')) {
    return uri.replace(/size=\d+/, `size=${width}`);
  }

  return uri;
};

/**
 * Batch les requêtes Supabase
 */
export class BatchQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private batchSize: number;
  private delay: number;

  constructor(batchSize: number = 5, delayMs: number = 100) {
    this.batchSize = batchSize;
    this.delay = delayMs;
  }

  add(request: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      await Promise.all(batch.map(req => req()));

      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }

    this.processing = false;
  }
}

// Instance globale de batch queue
export const supabaseBatch = new BatchQueue(10, 50);

/**
 * Optimisation de liste - Calcule la hauteur d'item
 */
export const getItemLayout = (
  data: any[] | null | undefined,
  index: number,
  itemHeight: number
) => ({
  length: itemHeight,
  offset: itemHeight * index,
  index,
});

/**
 * Hook pour pagination optimisée
 */
export function usePagination<T>(
  items: T[],
  itemsPerPage: number = 20
) {
  const [currentPage, setCurrentPage] = React.useState(0);

  const paginatedItems = React.useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(0, end);
  }, [items, currentPage, itemsPerPage]);

  const loadMore = useCallback(() => {
    if (paginatedItems.length < items.length) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginatedItems.length, items.length]);

  const reset = useCallback(() => {
    setCurrentPage(0);
  }, []);

  return {
    items: paginatedItems,
    loadMore,
    reset,
    hasMore: paginatedItems.length < items.length,
  };
}

/**
 * Mesure de performance
 */
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();

  static start(label: string): void {
    this.marks.set(label, Date.now());
  }

  static end(label: string): number {
    const start = this.marks.get(label);
    if (!start) {
      console.warn(`Performance mark "${label}" not found`);
      return 0;
    }

    const duration = Date.now() - start;
    this.marks.delete(label);

    if (__DEV__) {
      console.log(`⏱️ [Performance] ${label}: ${duration}ms`);
    }

    return duration;
  }

  static measure(label: string, fn: () => any): any {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }

  static async measureAsync(label: string, fn: () => Promise<any>): Promise<any> {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

/**
 * Préchargement d'images
 */
import { Image } from 'react-native';

export const preloadImages = async (uris: string[]): Promise<void> => {
  const promises = uris.map(uri => {
    return Image.prefetch(uri).catch(err => {
      console.warn('Failed to preload image:', uri, err);
    });
  });

  await Promise.all(promises);
};

/**
 * Hook pour charger les données après le rendu initial
 */
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  deps: any[] = []
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Attendre que les interactions soient terminées
        await new Promise(resolve => {
          InteractionManager.runAfterInteractions(resolve);
        });

        if (!cancelled) {
          const result = await loadFn();
          if (!cancelled) {
            setData(result);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error };
}

// Import React pour les hooks
import React from 'react';

export default {
  debounce,
  throttle,
  useDebounce,
  useThrottle,
  useInteractionManager,
  usePagination,
  useLazyLoad,
  getOptimizedImageUri,
  getItemLayout,
  profileCache,
  productsCache,
  statsCache,
  supabaseBatch,
  PerformanceMonitor,
  preloadImages,
};
