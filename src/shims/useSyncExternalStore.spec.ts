import { describe, it, expect } from 'vitest';
import { useSyncExternalStore } from './useSyncExternalStore';
import { useSyncExternalStore as reactUseSyncExternalStore } from 'react';

describe('useSyncExternalStore shim', () => {
  describe('Given the shim', () => {
    it('When imported / Then re-exports React useSyncExternalStore', () => {
      expect(useSyncExternalStore).toBe(reactUseSyncExternalStore);
    });
  });
});
