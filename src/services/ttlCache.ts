/**
 * Bounded TTL cache.
 *
 * Entries expire after `ttlMs`. Critically, the map is ALSO hard-capped at
 * `maxEntries`: expired entries are reclaimed lazily (only on read of that key),
 * so a long-lived session that fetches many distinct keys — segments × charts ×
 * KPI codes × signal-filter permutations — would otherwise retain every key (and
 * its full API payload) for the whole session, growing memory without limit.
 *
 * `now` is injectable so time-based behaviour is deterministically testable.
 */
export interface BoundedTtlCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  invalidate(prefix?: string): void;
  size(): number;
}

export function createTtlCache<T>(opts: {
  ttlMs: number;
  maxEntries: number;
  now?: () => number;
}): BoundedTtlCache<T> {
  const { ttlMs, maxEntries } = opts;
  const now = opts.now ?? (() => Date.now());
  const store = new Map<string, { value: T; expiresAt: number }>();

  function prune(): void {
    const t = now();
    // Drop expired entries first — they are dead weight regardless of size.
    for (const [key, entry] of store) {
      if (entry.expiresAt <= t) store.delete(key);
    }
    // If still over the ceiling, evict oldest. Map preserves insertion order,
    // so the first key is the oldest.
    while (store.size > maxEntries) {
      const oldest = store.keys().next().value;
      if (oldest === undefined) break;
      store.delete(oldest);
    }
  }

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: T): void {
      store.set(key, { value, expiresAt: now() + ttlMs });
      prune();
    },
    invalidate(prefix?: string): void {
      if (!prefix) {
        store.clear();
        return;
      }
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
      }
    },
    size(): number {
      return store.size;
    },
  };
}
