/**
 * Smart caching system for optimizing data fetching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.expiresIn;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, expiresIn: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.expiresIn) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const cache = new CacheManager();

// Run cleanup every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

/**
 * Cache decorator for async functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: { key: string; ttl?: number } = { key: '' }
): T {
  return (async (...args: any[]) => {
    const cacheKey = options.key || `${fn.name}_${JSON.stringify(args)}`;

    // Try to get from cache
    const cachedData = cache.get(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }

    // Fetch fresh data
    const data = await fn(...args);

    // Store in cache
    cache.set(cacheKey, data, options.ttl);

    return data;
  }) as T;
}

/**
 * Cache keys constants
 */
export const CacheKeys = {
  // Products
  PRODUCTS_LIST: 'products:list',
  PRODUCT_DETAIL: (id: string) => `products:${id}`,
  PRODUCTS_BY_CATEGORY: (category: string) => `products:category:${category}`,
  PRODUCTS_BY_SELLER: (sellerId: string) => `products:seller:${sellerId}`,

  // User
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_ORDERS: (userId: string) => `user:orders:${userId}`,
  USER_FAVORITES: (userId: string) => `user:favorites:${userId}`,

  // Cart
  CART: (userId: string) => `cart:${userId}`,

  // Shop
  SHOP_DETAILS: (shopId: string) => `shop:${shopId}`,

  // Stats
  SELLER_STATS: (sellerId: string) => `stats:seller:${sellerId}`,
} as const;

/**
 * Cache TTL constants (in milliseconds)
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;
