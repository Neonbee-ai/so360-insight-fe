import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

let mockShell: any = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };

vi.mock('@so360/shell-context', () => ({
  useShellBridge: () => mockShell,
  useModules: () => ({ isModuleEnabled: () => true }),
  useFeatureFlags: () => ({ isFeatureEnabled: () => true }),
}));

vi.mock('../services/insightApi', () => ({
  insightApi: {
    getSegmentDetail: vi.fn(),
    getKPITrend: vi.fn(),
    resolveSignal: vi.fn(),
    getAuthHeaders: vi.fn(() => ({})),
  },
}));

vi.mock('./segments/RevenueCharts', () => ({
  RevenueCharts: () => <div data-testid="revenue-charts" />,
}));
vi.mock('./segments/ExecutionCharts', () => ({
  ExecutionCharts: () => <div data-testid="execution-charts" />,
}));
vi.mock('./segments/DeliveryCharts', () => ({
  DeliveryCharts: () => <div data-testid="delivery-charts" />,
}));
vi.mock('./segments/WorkforceCharts', () => ({
  WorkforceCharts: () => <div data-testid="workforce-charts" />,
}));
vi.mock('./segments/FinanceCharts', () => ({
  FinanceCharts: () => <div data-testid="finance-charts" />,
}));
vi.mock('./DataFreshnessIndicator', () => ({
  DataFreshnessIndicator: () => <div data-testid="freshness" />,
}));
vi.mock('./NeuraSummaryCard', () => ({
  NeuraSummaryCard: (props: any) => <div data-testid="neura-summary">{props.title}</div>,
}));
vi.mock('./KPICard', () => ({
  KPICard: (props: any) => <div data-testid="kpi-card">{props.kpi.kpi_name}</div>,
}));
vi.mock('./SignalCard', () => ({
  SignalCard: (props: any) => <div data-testid="signal-card">{props.signal.title}</div>,
}));
vi.mock('./TrendChart', () => ({
  TrendChart: (props: any) => <div data-testid="trend-chart">{props.trendData.kpi_name}</div>,
}));
vi.mock('./TimeRangeSelector', () => ({
  TimeRangeSelector: (props: any) => <button data-testid="time-range" onClick={() => props.onChange('7d')}>Range</button>,
  getDaysForRange: (r: string) => r === '7d' ? 7 : 30,
}));

import { SegmentTabContent } from './SegmentTabContent';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

const mockSegmentDetail = {
  segment_code: 'revenue',
  segment_name: 'Revenue',
  description: 'Revenue segment',
  icon_name: 'TrendingUp',
  color_scheme: { primary: 'green', secondary: 'green' },
  kpis: [{ kpi_code: 'k1', kpi_name: 'Total Revenue', value: 100, unit: 'USD', trend: 'up' as const, category: 'critical', module_code: 'crm' }],
  signals: [{ id: 's1', title: 'Revenue drop', description: 'desc', severity: 'warning', created_at: '2024-01-01', module_code: 'crm' }],
  trends: [{ kpi_code: 'k1', kpi_name: 'Total Revenue', data: [{ date: '2024-01-01', value: 100 }] }],
};

describe('SegmentTabContent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ summary: 'AI summary', sections: null, generated_at: '2024-01-01', cached: false }),
    }));
  });

  describe('Given loading state', () => {
    it('When data is being fetched / Then shows loading spinner', () => {
      mockApi.getSegmentDetail.mockReturnValue(new Promise(() => {}));
      render(<SegmentTabContent segmentCode="revenue" />);
      expect(screen.getByText('Loading segment details...')).toBeInTheDocument();
    });
  });

  describe('Given error state', () => {
    it('When API fails / Then shows error with retry', async () => {
      mockApi.getSegmentDetail.mockRejectedValue(new Error('Network error'));
      render(<SegmentTabContent segmentCode="revenue" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Segment')).toBeInTheDocument();
      });
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Given segment data loaded', () => {
    it('When rendered / Then shows segment header and KPIs', async () => {
      mockApi.getSegmentDetail.mockResolvedValue(mockSegmentDetail);
      mockApi.getKPITrend.mockResolvedValue({ kpi_code: 'k1', kpi_name: 'Total Revenue', data: [] });
      render(<SegmentTabContent segmentCode="revenue" />);
      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });
      expect(screen.getByText('Key Performance Indicators')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card')).toBeInTheDocument();
    });

    it('When segment is revenue / Then renders revenue charts', async () => {
      mockApi.getSegmentDetail.mockResolvedValue(mockSegmentDetail);
      mockApi.getKPITrend.mockResolvedValue({ kpi_code: 'k1', kpi_name: 'Total Revenue', data: [] });
      render(<SegmentTabContent segmentCode="revenue" />);
      await waitFor(() => {
        expect(screen.getByTestId('revenue-charts')).toBeInTheDocument();
      });
    });

    it('When segment has no KPIs / Then shows empty state', async () => {
      mockApi.getSegmentDetail.mockResolvedValue({ ...mockSegmentDetail, kpis: [], signals: [], trends: [] });
      render(<SegmentTabContent segmentCode="revenue" />);
      await waitFor(() => {
        expect(screen.getByText('No KPIs available for this segment')).toBeInTheDocument();
      });
    });

    it('When segment has unresolved signals / Then shows signal cards', async () => {
      mockApi.getSegmentDetail.mockResolvedValue(mockSegmentDetail);
      mockApi.getKPITrend.mockResolvedValue({ kpi_code: 'k1', kpi_name: 'Revenue', data: [] });
      render(<SegmentTabContent segmentCode="revenue" />);
      await waitFor(() => {
        expect(screen.getByTestId('signal-card')).toBeInTheDocument();
      });
    });
  });

  describe('Given effectiveFlagsLoaded is false', () => {
    it('When flags are not yet resolved / Then AI Insights section is absent', async () => {
      mockShell = { effectiveFlagsLoaded: false, isFeatureEnabled: () => true };
      mockApi.getSegmentDetail.mockResolvedValue(mockSegmentDetail);
      mockApi.getKPITrend.mockResolvedValue({ kpi_code: 'k1', kpi_name: 'Total Revenue', data: [] });
      render(<SegmentTabContent segmentCode="revenue" />);
      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('neura-summary')).not.toBeInTheDocument();
    });
  });

  describe('Given effectiveFlagsLoaded is true and ai_summary is enabled', () => {
    it('When flags are resolved and feature is on / Then AI Insights section is present', async () => {
      mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
      mockApi.getSegmentDetail.mockResolvedValue(mockSegmentDetail);
      mockApi.getKPITrend.mockResolvedValue({ kpi_code: 'k1', kpi_name: 'Total Revenue', data: [] });
      render(<SegmentTabContent segmentCode="revenue" />);
      await waitFor(() => {
        expect(screen.getByTestId('neura-summary')).toBeInTheDocument();
      });
    });
  });
});
