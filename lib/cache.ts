import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@homechef_cache:';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Offline-first cache layer using AsyncStorage.
 * Stores API responses locally so the app works without internet.
 */
export const cache = {
  /**
   * Get cached data. Returns null if expired or missing.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      const isExpired = Date.now() - entry.timestamp > entry.ttl;

      if (isExpired) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  },

  /**
   * Store data with optional TTL (default 5 minutes).
   */
  async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {
      // Silently fail — cache is best-effort
    }
  },

  /**
   * Remove specific cache entry.
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch {}
  },

  /**
   * Clear all HomeChef cache entries.
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch {}
  },

  /**
   * Fetch with cache — tries cache first, falls back to API.
   * On success, updates the cache for next time.
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = DEFAULT_TTL,
  ): Promise<{ data: T; fromCache: boolean }> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      // Refresh in background (stale-while-revalidate)
      fetcher().then((fresh) => this.set(key, fresh, ttl)).catch(() => {});
      return { data: cached, fromCache: true };
    }

    // No cache — fetch from API
    try {
      const data = await fetcher();
      await this.set(key, data, ttl);
      return { data, fromCache: false };
    } catch (error) {
      throw error;
    }
  },
};

// Pre-defined cache keys for consistency
export const CacheKeys = {
  POSTS_FEED: 'posts_feed',
  POSTS_TRENDING: 'posts_trending',
  CHEF_PROFILE: (id: string) => `chef_${id}`,
  ORDERS_ACTIVE: 'orders_active',
  ORDERS_PAST: 'orders_past',
  NOTIFICATIONS: 'notifications',
  SAVED_ITEMS: 'saved_items',
  SEARCH_RECENT: 'search_recent',
  USER_PROFILE: 'user_profile',
} as const;
