import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/insightApi', () => ({
  insightApi: {
    getSegmentDetail: vi.fn(),
  },
}));

vi.mock('../components/TrendChart', () => ({
  TrendChart: () => <div data-testid="trend-chart" />,
}));

import { SegmentDetailPage } from './SegmentDetail';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

const segmentDetail = {
  segment_code: 'revenue',
  segment_name: 'Revenue',
  description: 'Revenue segment description',
  icon_name: 'TrendingUp',
  color_scheme: { primary: 'green', secondary: 'green' },
  kpis: [{ kpi_code: 'k1', kpi_name: 'Revenue', value: 1000, unit: 'USD', trend: 'up' as const, trend_percentage: 10, category: 'critical', module_code: 'crm' }],
  signals: [{ id: 's1', title: 'Alert', description: 'desc', severity: 'warning', created_at: '2024-01-01', module_code: 'crm' }],
  trends: [{ kpi_code: 'k1', kpi_name: 'Revenue', data: [{ date: '2024-01-01', value: 100 }, { date: '2024-01-02', value: 110 }] }],
};

const wrap = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/:segmentCode" element={<SegmentDetailPage />} />
    </Routes>
  </MemoryRouter>
);

describe('SegmentDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given loading state', () => {
    it('When data is being fetched / Then shows loading spinner', () => {
      mockApi.getSegmentDetail.mockReturnValue(new Promise(() => {}));
      wrap('/revenue');
      expect(screen.getByText('Loading segment details...')).toBeInTheDocument();
    });
  });

  describe('Given error state', () => {
    it('When API fails / Then shows error', async () => {
      mockApi.getSegmentDetail.mockRejectedValue(new Error('Not found'));
      wrap('/revenue');
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Segment')).toBeInTheDocument();
      });
    });
  });

  describe('Given segment loaded', () => {
    it('When rendered / Then shows segment name and KPIs', async () => {
      mockApi.getSegmentDetail.mockResolvedValue(segmentDetail);
      wrap('/revenue');
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Revenue');
      });
      expect(screen.getByText('Key Performance Indicators')).toBeInTheDocument();
    });

    it('When trends exist / Then shows trend charts', async () => {
      mockApi.getSegmentDetail.mockResolvedValue(segmentDetail);
      wrap('/revenue');
      await waitFor(() => {
        expect(screen.getByText('30-Day Trends')).toBeInTheDocument();
      });
    });

    it('When signals exist / Then shows active signals', async () => {
      mockApi.getSegmentDetail.mockResolvedValue(segmentDetail);
      wrap('/revenue');
      await waitFor(() => {
        expect(screen.getByText('Active Signals')).toBeInTheDocument();
      });
    });

    it('When no signals / Then shows no active signals message', async () => {
      mockApi.getSegmentDetail.mockResolvedValue({ ...segmentDetail, signals: [] });
      wrap('/revenue');
      await waitFor(() => {
        expect(screen.getByText('No active signals for this segment')).toBeInTheDocument();
      });
    });
  });
});
