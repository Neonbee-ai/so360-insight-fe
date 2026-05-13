import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../services/insightApi', () => ({
  insightApi: {
    getDashboard: vi.fn(),
    getSignals: vi.fn(),
    resolveSignal: vi.fn(),
  },
}));

vi.mock('../components/KPICard', () => ({
  KPICard: (props: any) => <div data-testid="kpi-card">{props.kpi.kpi_name}</div>,
}));
vi.mock('../components/SignalCard', () => ({
  SignalCard: (props: any) => <div data-testid="signal-card">{props.signal.title}</div>,
}));

import { Dashboard } from './Dashboard';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

const dashboardData = {
  kpis: [{ kpi_code: 'k1', kpi_name: 'Revenue', value: 1000, unit: 'USD', trend: 'up', category: 'critical', module_code: 'crm' }],
  signals_summary: { total: 10, critical: 2, warning: 5, info: 3 },
  computed_at: '2024-01-01T00:00:00Z',
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given loading state', () => {
    it('When data is being fetched / Then shows loading', () => {
      mockApi.getDashboard.mockReturnValue(new Promise(() => {}));
      mockApi.getSignals.mockReturnValue(new Promise(() => {}));
      render(<Dashboard />);
      expect(screen.getByText('Loading insights...')).toBeInTheDocument();
    });
  });

  describe('Given error state', () => {
    it('When API fails / Then shows error', async () => {
      mockApi.getDashboard.mockRejectedValue(new Error('Server down'));
      mockApi.getSignals.mockResolvedValue({ data: [] });
      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Error: Server down/)).toBeInTheDocument();
      });
    });
  });

  describe('Given data loaded', () => {
    it('When rendered / Then shows signals summary and KPIs', async () => {
      mockApi.getDashboard.mockResolvedValue(dashboardData);
      mockApi.getSignals.mockResolvedValue({ data: [] });
      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByText('Insight Dashboard')).toBeInTheDocument();
      });
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card')).toBeInTheDocument();
    });

    it('When no signals / Then shows no active signals message', async () => {
      mockApi.getDashboard.mockResolvedValue(dashboardData);
      mockApi.getSignals.mockResolvedValue({ data: [] });
      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Everything looks good/)).toBeInTheDocument();
      });
    });

    it('When signals exist / Then renders signal cards', async () => {
      mockApi.getDashboard.mockResolvedValue(dashboardData);
      mockApi.getSignals.mockResolvedValue({ data: [{ id: 's1', title: 'Alert', description: 'desc', severity: 'warning', created_at: '2024-01-01' }] });
      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('signal-card')).toBeInTheDocument();
      });
    });
  });
});
