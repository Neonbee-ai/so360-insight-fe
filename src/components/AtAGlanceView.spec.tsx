import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../services/insightApi', () => ({
  insightApi: {
    getSignals: vi.fn(),
    getSegmentDetail: vi.fn(),
    resolveSignal: vi.fn(),
    getAiSummary: vi.fn(),
    regenerateAiSummary: vi.fn(),
  },
}));

vi.mock('./KPICard', () => ({
  KPICard: (props: any) => <div data-testid="kpi-card">{props.kpi.kpi_name}</div>,
}));
vi.mock('./SignalCard', () => ({
  SignalCard: (props: any) => <div data-testid="signal-card">{props.signal.title}</div>,
}));
vi.mock('./NeuraSummaryCard', () => ({
  NeuraSummaryCard: (props: any) => <div data-testid="neura-card">{props.title}</div>,
}));
vi.mock('./ModuleCoveragePanel', () => ({
  ModuleCoveragePanel: () => <div data-testid="module-coverage" />,
}));

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ mo_in_progress: 5, mo_planned: 3, wo_open: 2, scrap_pct: 1 }),
}));

import { AtAGlanceView } from './AtAGlanceView';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

const mockSegments = [
  {
    segment_code: 'revenue',
    segment_name: 'Revenue',
    description: 'Revenue segment',
    icon_name: 'TrendingUp',
    color_scheme: { primary: 'green', secondary: 'green' },
    primary_kpi: { kpi_code: 'r1', kpi_name: 'Total Revenue', value: 50000, unit: 'USD', trend: 'up' as const, category: 'critical', module_code: 'crm' },
    kpi_count: 5,
    signal_count: 2,
    trend: 'up' as const,
  },
];

describe('AtAGlanceView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockApi.getSignals.mockResolvedValue({ data: [] });
    mockApi.getSegmentDetail.mockResolvedValue({
      kpis: [{ kpi_code: 'r1', kpi_name: 'Total Revenue', value: 50000, unit: 'USD', trend: 'up', category: 'critical', module_code: 'module:crm' }],
    });
    mockApi.getAiSummary.mockResolvedValue({ summary: 'AI text', sections: null, generated_at: '2024-01-01', cached: false });
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ mo_in_progress: 5, mo_planned: 3, wo_open: 2, scrap_pct: 1 }),
    });
  });

  describe('Given loading state', () => {
    it('When data is being fetched / Then shows skeleton', () => {
      mockApi.getSignals.mockReturnValue(new Promise(() => {}));
      const { container } = render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Given data loaded', () => {
    it('When rendered / Then shows business segments section', async () => {
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('Business Segments')).toBeInTheDocument();
      });
    });

    it('When segments provided / Then shows segment cards', async () => {
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });
    });

    it('When AI summary enabled / Then shows AI Executive Summary', async () => {
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('AI Executive Summary')).toBeInTheDocument();
      });
    });

    it('When no critical signals / Then shows no signals message', async () => {
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('No critical signals at this time')).toBeInTheDocument();
      });
    });

    it('When KPIs available / Then shows important KPIs section', async () => {
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={vi.fn()} />);
      await waitFor(() => {
        expect(screen.getByText('Important KPIs Across All Segments')).toBeInTheDocument();
      });
    });
  });

  describe('Given segment click', () => {
    it('When segment button clicked / Then calls onSegmentClick', async () => {
      const onClick = vi.fn();
      render(<AtAGlanceView segments={mockSegments} onSegmentClick={onClick} />);
      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });
      screen.getByText('Revenue').closest('button')?.click();
      expect(onClick).toHaveBeenCalledWith('revenue');
    });
  });
});
