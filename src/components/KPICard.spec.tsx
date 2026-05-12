import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KPICard } from './KPICard';
import type { KPI } from '../types/insight';

vi.mock('./charts/SparklineChart', () => ({
  SparklineChart: ({ data }: any) => <div data-testid="sparkline">{data.length} points</div>,
}));

const baseKPI: KPI = {
  kpi_code: 'revenue',
  kpi_name: 'Total Revenue',
  value: 50000,
  unit: 'USD',
  trend: 'up',
  trend_percentage: 12.5,
  category: 'critical',
  module_code: 'module:crm',
};

describe('KPICard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given a KPI with upward trend', () => {
    it('When rendered / Then shows the KPI name', () => {
      render(<KPICard kpi={baseKPI} />);
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });

    it('When rendered / Then shows the value and unit', () => {
      render(<KPICard kpi={baseKPI} />);
      expect(screen.getByText('50000')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('When rendered / Then shows the trend percentage with + prefix', () => {
      render(<KPICard kpi={baseKPI} />);
      expect(screen.getByText('+12.5% from last period')).toBeInTheDocument();
    });

    it('When rendered / Then shows the upward trend icon', () => {
      render(<KPICard kpi={baseKPI} />);
      expect(screen.getByTestId('icon-TrendingUp')).toBeInTheDocument();
    });
  });

  describe('Given a KPI with downward trend', () => {
    it('When rendered / Then shows minus prefix and red icon', () => {
      render(<KPICard kpi={{ ...baseKPI, trend: 'down', trend_percentage: 8 }} />);
      expect(screen.getByText('-8% from last period')).toBeInTheDocument();
      expect(screen.getByTestId('icon-TrendingDown')).toBeInTheDocument();
    });
  });

  describe('Given a KPI with stable trend', () => {
    it('When rendered / Then shows the Minus icon', () => {
      render(<KPICard kpi={{ ...baseKPI, trend: 'stable', trend_percentage: undefined }} />);
      expect(screen.getByTestId('icon-Minus')).toBeInTheDocument();
    });
  });

  describe('Given a KPI with sparkline data', () => {
    it('When data is present / Then renders the sparkline chart', () => {
      render(<KPICard kpi={{ ...baseKPI, sparkline_data: [{ date: '2026-01-01', value: 10 }, { date: '2026-01-02', value: 20 }] }} />);
      expect(screen.getByTestId('sparkline')).toHaveTextContent('2 points');
    });
  });

  describe('Given a KPI without sparkline data', () => {
    it('When sparkline_data is undefined / Then does not render sparkline', () => {
      render(<KPICard kpi={baseKPI} />);
      expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument();
    });
  });

  describe('Given a KPI category', () => {
    it('When rendered / Then shows the category text', () => {
      render(<KPICard kpi={baseKPI} />);
      expect(screen.getByText('critical')).toBeInTheDocument();
    });
  });
});
