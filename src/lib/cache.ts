const DEFAULT_MAX_SIZE = 500;

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

const store = new Map<string, CacheEntry>();

function evictLRU(): void {
  if (store.size <= DEFAULT_MAX_SIZE) return;

  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of store) {
    if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed;
      oldestKey = key;
    }
  }

  if (oldestKey) store.delete(oldestKey);
}

export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  entry.lastAccessed = Date.now();
  return entry.value as T;
}

export function setCache(key: string, value: any, ttlMs: number): void {
  evictLRU();
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
    lastAccessed: Date.now(),
  });
}

export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
