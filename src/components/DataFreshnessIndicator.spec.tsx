import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../services/insightApi', () => ({
  insightApi: {
    getDataFreshness: vi.fn(),
  },
}));

import { DataFreshnessIndicator } from './DataFreshnessIndicator';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

describe('DataFreshnessIndicator', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given loading state', () => {
    it('When data is being fetched / Then renders nothing', () => {
      mockApi.getDataFreshness.mockReturnValue(new Promise(() => {}));
      const { container } = render(<DataFreshnessIndicator />);
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Given fresh data', () => {
    it('When last_computation is today / Then shows today timestamp', async () => {
      const now = new Date();
      mockApi.getDataFreshness.mockResolvedValue({
        last_computation: now.toISOString(),
        is_stale: false,
        next_scheduled_refresh: null,
      });
      render(<DataFreshnessIndicator />);
      await waitFor(() => {
        expect(screen.getByText('Data updated:')).toBeInTheDocument();
      });
    });

    it('When not stale / Then shows check icon', async () => {
      mockApi.getDataFreshness.mockResolvedValue({
        last_computation: new Date().toISOString(),
        is_stale: false,
      });
      render(<DataFreshnessIndicator />);
      await waitFor(() => {
        expect(screen.getByTestId('icon-CheckCircle')).toBeInTheDocument();
      });
    });
  });

  describe('Given stale data', () => {
    it('When is_stale is true / Then shows warning icon', async () => {
      mockApi.getDataFreshness.mockResolvedValue({
        last_computation: '2024-01-01T00:00:00Z',
        is_stale: true,
      });
      render(<DataFreshnessIndicator />);
      await waitFor(() => {
        expect(screen.getByTestId('icon-AlertTriangle')).toBeInTheDocument();
      });
    });
  });

  describe('Given no computation data', () => {
    it('When last_computation is null / Then shows no data message', async () => {
      mockApi.getDataFreshness.mockResolvedValue({
        last_computation: null,
        is_stale: false,
      });
      render(<DataFreshnessIndicator />);
      await waitFor(() => {
        expect(screen.getByText(/No data/)).toBeInTheDocument();
      });
    });
  });

  describe('Given next_scheduled_refresh', () => {
    it('When set / Then shows tooltip with next refresh', async () => {
      mockApi.getDataFreshness.mockResolvedValue({
        last_computation: new Date().toISOString(),
        is_stale: false,
        next_scheduled_refresh: '2025-01-01T12:00:00Z',
      });
      render(<DataFreshnessIndicator />);
      await waitFor(() => {
        const el = screen.getByText('Data updated:').closest('div');
        expect(el?.getAttribute('title')).toContain('Next scheduled refresh');
      });
    });
  });

  describe('Given API failure', () => {
    it('When getDataFreshness throws / Then renders nothing', async () => {
      mockApi.getDataFreshness.mockRejectedValue(new Error('fail'));
      const { container } = render(<DataFreshnessIndicator />);
      await waitFor(() => {
        expect(mockApi.getDataFreshness).toHaveBeenCalled();
      });
      expect(container.querySelector('[data-testid="icon-Clock"]')).toBeNull();
    });
  });

  describe('Given the 5 minute refresh interval', () => {
    const setHidden = (hidden: boolean) =>
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    afterEach(() => { setHidden(false); vi.useRealTimers(); });

    it('When the tab is hidden at the tick / Then no request is made', async () => {
      vi.useFakeTimers();
      mockApi.getDataFreshness.mockResolvedValue({ last_computation: null, is_stale: false, next_scheduled_refresh: null });
      render(<DataFreshnessIndicator />);
      await act(async () => { await Promise.resolve(); });
      expect(mockApi.getDataFreshness).toHaveBeenCalledTimes(1);
      setHidden(true);
      await act(async () => { vi.advanceTimersByTime(5 * 60 * 1000); });
      expect(mockApi.getDataFreshness).toHaveBeenCalledTimes(1);
    });

    it('When the tab is visible at the tick / Then it refreshes', async () => {
      vi.useFakeTimers();
      mockApi.getDataFreshness.mockResolvedValue({ last_computation: null, is_stale: false, next_scheduled_refresh: null });
      render(<DataFreshnessIndicator />);
      await act(async () => { await Promise.resolve(); });
      setHidden(false);
      await act(async () => { vi.advanceTimersByTime(5 * 60 * 1000); });
      expect(mockApi.getDataFreshness).toHaveBeenCalledTimes(2);
    });
  });
});
