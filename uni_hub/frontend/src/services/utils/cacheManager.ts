/**
 * Unified cache management for frontend services
 * Handles both memory and localStorage caching with expiration
 */

// Type for the memory cache entry
interface MemoryCacheEntry<T> {
  data: T | null;
  timestamp: number;
  expiresIn: number;
}

// Memory cache for fast access
class MemoryCache {
  private cache: Record<string, MemoryCacheEntry<unknown>> = {};

  /**
   * Set a value in the memory cache
   * @param key Cache key
   * @param data Data to cache
   * @param expiresIn Expiration time in milliseconds (default: 60 seconds)
   */
  set<T>(key: string, data: T, expiresIn: number = 60000): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      expiresIn
    };
  }

  /**
   * Get a value from the memory cache
   * @param key Cache key
   * @returns Cached data or null if expired or not found
   */
  get<T>(key: string): T | null {
    const entry = this.cache[key];
    if (!entry) return null;

    const isValid = entry.data !== null && 
                    Date.now() - entry.timestamp < entry.expiresIn;
                    
    return isValid ? (entry.data as T | null) : null;
  }

  /**
   * Check if a key exists and is valid in the cache
   * @param key Cache key
   * @returns Whether the cache entry is valid
   */
  isValid(key: string): boolean {
    const entry = this.cache[key];
    if (!entry) return false;
    
    return entry.data !== null && 
           Date.now() - entry.timestamp < entry.expiresIn;
  }

  /**
   * Clear a specific key from the cache
   * @param key Cache key to clear
   */
  clear(key: string): void {
    if (this.cache[key]) {
      this.cache[key].data = null;
      this.cache[key].timestamp = 0;
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache = {};
  }
}

// LocalStorage cache with expiration times
class LocalStorageCache {
  /**
   * Get an item with time validation
   * @param key Storage key
   * @param expiryMs Expiration time in milliseconds (default: 5 minutes)
   * @returns Cached data or null if expired or not found
   */
  getWithExpiry<T>(key: string, expiryMs: number = 5 * 60 * 1000): T | null {
    // Check if running in browser environment
    if (typeof window === 'undefined') return null;
    
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      const now = new Date();
      
      // Check if the cache has expired
      if (!item._cacheTime || now.getTime() - item._cacheTime > expiryMs) {
        localStorage.removeItem(key);
        return null;
      }
      
      // Return the data without the cache timestamp
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _cacheTime: _, ...data } = item;
      return data as T;
    } catch (error) {
      console.error(`Error getting cached item ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Sets an item with timestamp
   * @param key Storage key
   * @param value Data to cache
   */
  setWithExpiry<T>(key: string, value: T): void {
    // Check if running in browser environment
    if (typeof window === 'undefined') return;
    
    try {
      const item = {
        ...value,
        _cacheTime: new Date().getTime()
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.error(`Error caching item ${key}:`, e);
    }
  }
  
  /**
   * Clear an item from localStorage
   * @param key Storage key to clear
   */
  clear(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error clearing cached item ${key}:`, e);
    }
  }
  
  /**
   * Clears all expired items with a specific prefix
   * @param prefix Prefix for keys to check (e.g. 'community_')
   * @param expiryMs Expiration time in milliseconds (default: 1 hour)
   */
  clearExpired(prefix: string, expiryMs: number = 60 * 60 * 1000): void {
    // Check if running in browser environment
    if (typeof window === 'undefined') return;
    
    try {
      const keysToCheck = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToCheck.push(key);
        }
      }
      
      const now = new Date().getTime();
      
      keysToCheck.forEach(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (!item._cacheTime || now - item._cacheTime > expiryMs) {
            localStorage.removeItem(key);
            console.log(`Cleared expired cache for ${key}`);
          }
        } catch {
          // If we can't parse it, just remove it
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error(`Error cleaning cache with prefix ${prefix}:`, error);
    }
  }
}

// Create instances to export
const memoryCache = new MemoryCache();
const localStorageCache = new LocalStorageCache();

/**
 * Initialize cache cleanup (should be called on app initialization)
 * Safely handles SSR by checking for browser environment
 */
export const initializeCacheCleanup = (): void => {
  // Only run in browser environment
  if (typeof window !== 'undefined') {
    console.log('Initializing local cache cleanup');
    // Timeout to make sure it runs after the component is mounted
    setTimeout(() => {
      localStorageCache.clearExpired('community_');
    }, 1000);
  }
};

export { memoryCache, localStorageCache }; 