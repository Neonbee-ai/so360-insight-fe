import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { ManufacturingSegment } from './ManufacturingSegment';

describe('ManufacturingSegment', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given loading state', () => {
    it('When fetching / Then shows spinner', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
      render(<ManufacturingSegment />);
      expect(screen.getByTestId('icon-Loader2')).toBeInTheDocument();
    });
  });

  describe('Given error state', () => {
    it('When API fails / Then shows error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      render(<ManufacturingSegment />);
      await waitFor(() => {
        expect(screen.getByText('Manufacturing metrics unavailable')).toBeInTheDocument();
      });
    });
  });

  describe('Given data loaded', () => {
    it('When rendered / Then shows KPI tiles', async () => {
      const summary = {
        mo_total: 50, mo_in_progress: 10, mo_done: 30, mo_planned: 10,
        wo_open: 15, on_time_pct: 92, scrap_pct: 2.5, cost_variance_pct: 3,
        total_produced: 5000, total_scrap_qty: 125,
      };
      const util = [
        { work_center_id: 'wc1', code: 'WC01', name: 'Assembly', wos_total: 20, wos_done: 15, oee_pct: 85, target_pct: 80 },
      ];
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(summary) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(util) })
      );
      render(<ManufacturingSegment />);
      await waitFor(() => {
        expect(screen.getByText('Manufacturing')).toBeInTheDocument();
      });
      expect(screen.getByText('Open MOs')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Work Centre Utilisation (OEE)')).toBeInTheDocument();
      expect(screen.getByText('Assembly')).toBeInTheDocument();
    });
  });
});
