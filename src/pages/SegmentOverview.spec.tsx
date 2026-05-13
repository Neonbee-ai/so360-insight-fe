import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/insightApi', () => ({
  insightApi: {
    getSegments: vi.fn(),
  },
}));

import { SegmentOverview } from './SegmentOverview';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

const segments = [
  {
    segment_code: 'revenue',
    segment_name: 'Revenue',
    description: 'Revenue overview',
    icon_name: 'TrendingUp',
    color_scheme: { primary: 'green', secondary: 'green' },
    primary_kpi: { kpi_code: 'r1', kpi_name: 'Total Revenue', value: 50000, unit: 'USD', trend: 'up' as const, trend_percentage: 12, category: 'critical', module_code: 'crm' },
    kpi_count: 5,
    signal_count: 2,
    trend: 'up' as const,
  },
  {
    segment_code: 'execution',
    segment_name: 'Execution',
    description: 'Execution overview',
    icon_name: 'Zap',
    color_scheme: { primary: 'purple', secondary: 'purple' },
    primary_kpi: null,
    kpi_count: 3,
    signal_count: 0,
    trend: 'stable' as const,
  },
];

const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('SegmentOverview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given loading state', () => {
    it('When data is being fetched / Then shows skeleton', () => {
      mockApi.getSegments.mockReturnValue(new Promise(() => {}));
      wrap(<SegmentOverview />);
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Given error state', () => {
    it('When API fails / Then shows error', async () => {
      mockApi.getSegments.mockRejectedValue(new Error('Server error'));
      wrap(<SegmentOverview />);
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Segments')).toBeInTheDocument();
      });
    });
  });

  describe('Given segments loaded', () => {
    it('When rendered / Then shows segment cards', async () => {
      mockApi.getSegments.mockResolvedValue(segments);
      wrap(<SegmentOverview />);
      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('Execution')).toBeInTheDocument();
      });
    });

    it('When segment has primary KPI / Then displays value', async () => {
      mockApi.getSegments.mockResolvedValue(segments);
      wrap(<SegmentOverview />);
      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });
    });

    it('When segment has signals / Then shows signal count', async () => {
      mockApi.getSegments.mockResolvedValue(segments);
      wrap(<SegmentOverview />);
      await waitFor(() => {
        expect(screen.getByText('2 signals')).toBeInTheDocument();
      });
    });
  });

  describe('Given empty segments', () => {
    it('When no segments / Then shows empty state', async () => {
      mockApi.getSegments.mockResolvedValue([]);
      wrap(<SegmentOverview />);
      await waitFor(() => {
        expect(screen.getByText('No Segments Available')).toBeInTheDocument();
      });
    });
  });
});
