import { cache, CacheKeys } from '@/lib/cache';

/**
 * Unit tests for the offline cache layer.
 * Run with: npx jest tests/cache.test.ts
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach((k) => delete store[k]);
      return Promise.resolve();
    }),
  };
});

describe('Cache', () => {
  beforeEach(async () => {
    await cache.clear();
  });

  it('should store and retrieve data', async () => {
    await cache.set('test_key', { name: 'Couscous', price: 500 });
    const result = await cache.get<{ name: string; price: number }>('test_key');

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Couscous');
    expect(result?.price).toBe(500);
  });

  it('should return null for missing keys', async () => {
    const result = await cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should return null for expired entries', async () => {
    // Set with 0ms TTL (immediately expired)
    await cache.set('expired', { data: 'old' }, 0);

    // Wait a tick
    await new Promise((r) => setTimeout(r, 10));

    const result = await cache.get('expired');
    expect(result).toBeNull();
  });

  it('should remove specific entries', async () => {
    await cache.set('to_remove', { data: 'temp' });
    await cache.remove('to_remove');

    const result = await cache.get('to_remove');
    expect(result).toBeNull();
  });

  it('should fetch with cache (miss then hit)', async () => {
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount++;
      return { dishes: ['Couscous', 'Chorba'] };
    };

    // First call — cache miss
    const first = await cache.fetchWithCache('dishes', fetcher);
    expect(first.fromCache).toBe(false);
    expect(first.data.dishes).toHaveLength(2);
    expect(fetchCount).toBe(1);

    // Second call — cache hit
    const second = await cache.fetchWithCache('dishes', fetcher);
    expect(second.fromCache).toBe(true);
    expect(second.data.dishes).toHaveLength(2);
  });

  it('CacheKeys should generate correct keys', () => {
    expect(CacheKeys.POSTS_FEED).toBe('posts_feed');
    expect(CacheKeys.CHEF_PROFILE('abc')).toBe('chef_abc');
    expect(CacheKeys.ORDERS_ACTIVE).toBe('orders_active');
  });
});
