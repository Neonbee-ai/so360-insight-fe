import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../services/insightApi', () => ({
  insightApi: {
    getChartData: vi.fn(),
  },
}));

vi.mock('../charts', () => ({
  LineChartComponent: (props: any) => <div data-testid="line-chart" />,
  BarChartComponent: (props: any) => <div data-testid="bar-chart" />,
  AreaChartComponent: (props: any) => <div data-testid="area-chart" />,
  PieChartComponent: (props: any) => <div data-testid="pie-chart" />,
  FunnelChartComponent: (props: any) => <div data-testid="funnel-chart" />,
  GaugeChartComponent: (props: any) => <div data-testid="gauge-chart" />,
  WaterfallChartComponent: (props: any) => <div data-testid="waterfall-chart" />,
  formatCurrency: (v: number) => `$${v}`,
  formatNumber: (v: number) => String(v),
  formatPercentage: (v: number) => `${v}%`,
  formatDate: (d: string) => d,
}));

vi.mock('../charts/ChartContainer', () => ({
  ChartContainer: ({ children, title }: any) => <div data-testid="chart-container"><span>{title}</span>{children}</div>,
}));

import { RevenueCharts } from './RevenueCharts';
import { ExecutionCharts } from './ExecutionCharts';
import { DeliveryCharts } from './DeliveryCharts';
import { WorkforceCharts } from './WorkforceCharts';
import { FinanceCharts } from './FinanceCharts';
import { insightApi } from '../../services/insightApi';

const mockApi = insightApi as any;

describe('RevenueCharts', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  describe('Given loading', () => {
    it('When fetching / Then shows spinner', () => {
      mockApi.getChartData.mockReturnValue(new Promise(() => {}));
      render(<RevenueCharts tenantId="t1" orgId="o1" />);
      expect(screen.getByTestId('icon-Loader2')).toBeInTheDocument();
    });
  });

  describe('Given error', () => {
    it('When API fails / Then shows error', async () => {
      mockApi.getChartData.mockRejectedValue(new Error('fail'));
      render(<RevenueCharts tenantId="t1" orgId="o1" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Charts')).toBeInTheDocument();
      });
    });
  });

  describe('Given data loaded', () => {
    it('When rendered / Then shows charts', async () => {
      mockApi.getChartData.mockResolvedValue({ data: { data: { data: [{ date: '2024-01', actual: 100, target: 90 }], stages: [{ name: 'Lead', value: 100 }], buckets: [{ name: '0-30', value: 50 }] } } });
      render(<RevenueCharts tenantId="t1" orgId="o1" />);
      await waitFor(() => {
        expect(screen.getByText('Revenue vs Target')).toBeInTheDocument();
      });
    });
  });
});

describe('ExecutionCharts', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  describe('Given loading', () => {
    it('When fetching / Then shows spinner', () => {
      mockApi.getChartData.mockReturnValue(new Promise(() => {}));
      render(<ExecutionCharts tenantId="t1" orgId="o1" />);
      expect(screen.getByTestId('icon-Loader2')).toBeInTheDocument();
    });
  });

  describe('Given error', () => {
    it('When API fails / Then shows error', async () => {
      mockApi.getChartData.mockRejectedValue(new Error('fail'));
      render(<ExecutionCharts tenantId="t1" orgId="o1" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Charts')).toBeInTheDocument();
      });
    });
  });

  describe('Given data loaded', () => {
    it('When rendered / Then shows charts', async () => {
      mockApi.getChartData.mockResolvedValue({ data: { data: { data: [{ week: 'W1', completed: 5, planned: 3 }], statuses: [{ name: 'Active', value: 10 }] } } });
      render(<ExecutionCharts tenantId="t1" orgId="o1" />);
      await waitFor(() => {
        expect(screen.getByText('Task Completion Status')).toBeInTheDocument();
      });
    });
  });
});

describe('DeliveryCharts', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  describe('Given loading', () => {
    it('When fetching / Then shows spinner', () => {
      mockApi.getChartData.mockReturnValue(new Promise(() => {}));
      render(<DeliveryCharts tenantId="t1" orgId="o1" />);
      expect(screen.getByTestId('icon-Loader2')).toBeInTheDocument();
    });
  });

  describe('Given error', () => {
    it('When API fails / Then shows error', async () => {
      mockApi.getChartData.mockRejectedValue(new Error('fail'));
      render(<DeliveryCharts tenantId="t1" orgId="o1" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Charts')).toBeInTheDocument();
      });
    });
  });

  describe('Given data loaded', () => {
    it('When rendered / Then shows charts', async () => {
      mockApi.getChartData.mockResolvedValue({ data: { data: { data: [{ month: '2024-01', on_time: 85 }] } } });
      render(<DeliveryCharts tenantId="t1" orgId="o1" />);
      await waitFor(() => {
        expect(screen.getByText('On-Time Delivery Rate')).toBeInTheDocument();
      });
    });
  });
});

describe('WorkforceCharts', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  describe('Given loading', () => {
    it('When fetching / Then shows spinner', () => {
      mockApi.getChartData.mockReturnValue(new Promise(() => {}));
      render(<WorkforceCharts tenantId="t1" orgId="o1" />);
      expect(screen.getByTestId('icon-Loader2')).toBeInTheDocument();
    });
  });

  describe('Given error', () => {
    it('When API fails / Then shows error', async () => {
      mockApi.getChartData.mockRejectedValue(new Error('fail'));
      render(<WorkforceCharts tenantId="t1" orgId="o1" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Charts')).toBeInTheDocument();
      });
    });
  });

  describe('Given data loaded', () => {
    it('When rendered / Then shows charts', async () => {
      mockApi.getChartData.mockResolvedValue({ data: { data: { data: [{ month: '2024-01', utilization: 75 }], overall_score: 92, departments: [{ name: 'Eng', overtime_hours: 20 }] } } });
      render(<WorkforceCharts tenantId="t1" orgId="o1" />);
      await waitFor(() => {
        expect(screen.getByText('Team Utilization Rate')).toBeInTheDocument();
      });
    });
  });
});

describe('FinanceCharts', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  describe('Given loading', () => {
    it('When fetching / Then shows spinner', () => {
      mockApi.getChartData.mockReturnValue(new Promise(() => {}));
      render(<FinanceCharts tenantId="t1" orgId="o1" />);
      expect(screen.getByTestId('icon-Loader2')).toBeInTheDocument();
    });
  });

  describe('Given error', () => {
    it('When API fails / Then shows error', async () => {
      mockApi.getChartData.mockRejectedValue(new Error('fail'));
      render(<FinanceCharts tenantId="t1" orgId="o1" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Charts')).toBeInTheDocument();
      });
    });
  });

  describe('Given data loaded', () => {
    it('When rendered / Then shows charts', async () => {
      mockApi.getChartData.mockResolvedValue({ data: { data: { data: [{ name: 'Revenue', value: 10000 }] } } });
      render(<FinanceCharts tenantId="t1" orgId="o1" />);
      await waitFor(() => {
        expect(screen.getByText('Cash Flow Waterfall')).toBeInTheDocument();
      });
    });
  });
});
