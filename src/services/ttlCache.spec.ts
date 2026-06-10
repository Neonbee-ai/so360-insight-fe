/**
 * BDD spec — createTtlCache (bounded TTL cache used by insightApi)
 *
 * Guards the memory-leak fix: the cache must (a) expire entries after the TTL,
 * (b) reclaim expired entries, and (c) NEVER exceed maxEntries — otherwise a long
 * session that fetches many distinct keys grows the map (and its payloads) without
 * limit for the whole session.
 */
import { describe, it, expect } from 'vitest';
import { createTtlCache } from './ttlCache';

describe('createTtlCache', () => {
  describe('Given a fresh cache', () => {
    it('When a value is set / Then it can be read back before expiry', () => {
      let t = 0;
      const cache = createTtlCache<number>({ ttlMs: 100, maxEntries: 10, now: () => t });
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });

    it('When a key was never set / Then get returns undefined', () => {
      const cache = createTtlCache<number>({ ttlMs: 100, maxEntries: 10 });
      expect(cache.get('missing')).toBeUndefined();
    });
  });

  describe('Given an entry past its TTL', () => {
    it('When read after expiry / Then it returns undefined and is removed', () => {
      let t = 0;
      const cache = createTtlCache<string>({ ttlMs: 100, maxEntries: 10, now: () => t });
      cache.set('a', 'x');
      t = 101;
      expect(cache.get('a')).toBeUndefined();
      expect(cache.size()).toBe(0);
    });
  });

  describe('Given the cache is at capacity', () => {
    it('When more distinct keys are added / Then size never exceeds maxEntries', () => {
      let t = 0;
      const cache = createTtlCache<number>({ ttlMs: 1_000_000, maxEntries: 5, now: () => t });
      for (let i = 0; i < 50; i++) {
        t += 1; // keep entries unexpired but ordered
        cache.set(`k${i}`, i);
      }
      expect(cache.size()).toBe(5);
    });

    it('When over capacity / Then the OLDEST entries are evicted first', () => {
      let t = 0;
      const cache = createTtlCache<number>({ ttlMs: 1_000_000, maxEntries: 3, now: () => t });
      ['k0', 'k1', 'k2', 'k3', 'k4'].forEach((k, i) => {
        t += 1;
        cache.set(k, i);
      });
      // k0,k1 evicted; k2,k3,k4 retained
      expect(cache.get('k0')).toBeUndefined();
      expect(cache.get('k1')).toBeUndefined();
      expect(cache.get('k2')).toBe(2);
      expect(cache.get('k4')).toBe(4);
    });

    it('When expired entries exist / Then they are pruned before evicting live ones', () => {
      let t = 0;
      const cache = createTtlCache<number>({ ttlMs: 100, maxEntries: 3, now: () => t });
      cache.set('old', 0); // expires at 100
      t = 50;
      cache.set('a', 1);
      cache.set('b', 2);
      t = 150; // 'old' is now expired
      cache.set('c', 3); // triggers prune: 'old' removed, size back to 3
      expect(cache.get('old')).toBeUndefined();
      expect(cache.size()).toBe(3);
      expect(cache.get('a')).toBe(1);
      expect(cache.get('c')).toBe(3);
    });
  });

  describe('Given a populated cache', () => {
    it('When invalidate(prefix) is called / Then only matching keys are removed', () => {
      const cache = createTtlCache<number>({ ttlMs: 1_000_000, maxEntries: 100 });
      cache.set('ai-summary:revenue', 1);
      cache.set('ai-summary:ops', 2);
      cache.set('chart:revenue:line', 3);
      cache.invalidate('ai-summary:');
      expect(cache.get('ai-summary:revenue')).toBeUndefined();
      expect(cache.get('ai-summary:ops')).toBeUndefined();
      expect(cache.get('chart:revenue:line')).toBe(3);
    });

    it('When invalidate() is called with no prefix / Then the whole cache clears', () => {
      const cache = createTtlCache<number>({ ttlMs: 1_000_000, maxEntries: 100 });
      cache.set('a', 1);
      cache.set('b', 2);
      cache.invalidate();
      expect(cache.size()).toBe(0);
    });
  });
});
