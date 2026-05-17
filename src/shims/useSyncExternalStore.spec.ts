import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSyncExternalStore } from './useSyncExternalStore';
import { useSyncExternalStore as reactUseSyncExternalStore } from 'react';

describe('useSyncExternalStore shim', () => {
  describe('Given the shim module', () => {
    it('When imported / Then re-exports the native React useSyncExternalStore', () => {
      expect(useSyncExternalStore).toBe(reactUseSyncExternalStore);
    });

    it('When imported / Then is a function', () => {
      expect(typeof useSyncExternalStore).toBe('function');
    });
  });

  describe('Given a simple external store', () => {
    it('When subscribed / Then returns the current snapshot', () => {
      let state = 42;
      const subscribe = (_cb: () => void) => () => {};
      const getSnapshot = () => state;

      const { result } = renderHook(() =>
        useSyncExternalStore(subscribe, getSnapshot)
      );

      expect(result.current).toBe(42);
    });

    it('When store updates and re-renders / Then returns new snapshot', () => {
      let state = 0;
      let listener: (() => void) | null = null;

      const subscribe = (cb: () => void) => {
        listener = cb;
        return () => { listener = null; };
      };
      const getSnapshot = () => state;

      const { result } = renderHook(() =>
        useSyncExternalStore(subscribe, getSnapshot)
      );

      expect(result.current).toBe(0);

      act(() => {
        state = 99;
        listener?.();
      });

      expect(result.current).toBe(99);
    });

    it('When string snapshot / Then returns string value', () => {
      const subscribe = (_cb: () => void) => () => {};
      const getSnapshot = () => 'hello';

      const { result } = renderHook(() =>
        useSyncExternalStore(subscribe, getSnapshot)
      );

      expect(result.current).toBe('hello');
    });

    it('When object snapshot / Then returns object', () => {
      const store = { name: 'Insight', count: 5 };
      const subscribe = (_cb: () => void) => () => {};
      const getSnapshot = () => store;

      const { result } = renderHook(() =>
        useSyncExternalStore(subscribe, getSnapshot)
      );

      expect(result.current).toEqual({ name: 'Insight', count: 5 });
    });

    it('When getServerSnapshot provided / Then does not throw during render', () => {
      const subscribe = (_cb: () => void) => () => {};
      const getSnapshot = () => 10;
      const getServerSnapshot = () => 10;

      expect(() => {
        renderHook(() =>
          useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
        );
      }).not.toThrow();
    });
  });
});
