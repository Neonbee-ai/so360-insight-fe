import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSyncExternalStoreWithSelector } from './useSyncExternalStoreWithSelector';

describe('useSyncExternalStoreWithSelector', () => {
  describe('Given a store', () => {
    it('When subscribed / Then returns selected value', () => {
      let value = { count: 5 };
      const subscribe = (cb: () => void) => { return () => {}; };
      const getSnapshot = () => value;
      const selector = (s: typeof value) => s.count;

      const { result } = renderHook(() =>
        useSyncExternalStoreWithSelector(subscribe, getSnapshot, undefined, selector)
      );
      expect(result.current).toBe(5);
    });

    it('When isEqual provided and values are equal / Then returns memoized value', () => {
      let value = { items: [1, 2, 3] };
      const subscribe = (cb: () => void) => { return () => {}; };
      const getSnapshot = () => value;
      const selector = (s: typeof value) => s.items;
      const isEqual = (a: number[], b: number[]) => a.length === b.length;

      const { result } = renderHook(() =>
        useSyncExternalStoreWithSelector(subscribe, getSnapshot, undefined, selector, isEqual)
      );
      expect(result.current).toEqual([1, 2, 3]);
    });

    it('When getServerSnapshot provided / Then does not throw', () => {
      const subscribe = (cb: () => void) => { return () => {}; };
      const getSnapshot = () => 42;
      const getServerSnapshot = () => 42;
      const selector = (s: number) => s * 2;

      const { result } = renderHook(() =>
        useSyncExternalStoreWithSelector(subscribe, getSnapshot, getServerSnapshot, selector)
      );
      expect(result.current).toBe(84);
    });
  });
});
