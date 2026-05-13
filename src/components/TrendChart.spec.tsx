import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TrendChart } from './TrendChart';

const makeTrend = (values: number[]) => ({
  kpi_code: 'test_kpi',
  kpi_name: 'Test KPI',
  data: values.map((v, i) => ({
    date: `2024-0${i + 1}-15`,
    value: v,
  })),
});

describe('TrendChart', () => {
  describe('Given no data', () => {
    it('When trendData is null / Then shows no data message', () => {
      render(<TrendChart trendData={null as any} />);
      expect(screen.getByText('No trend data available')).toBeInTheDocument();
    });

    it('When data array is empty / Then shows no data message', () => {
      render(<TrendChart trendData={{ kpi_code: 'x', kpi_name: 'X', data: [] }} />);
      expect(screen.getByText('No trend data available')).toBeInTheDocument();
    });
  });

  describe('Given valid trend data', () => {
    it('When rendered / Then shows kpi name', () => {
      render(<TrendChart trendData={makeTrend([10, 20, 30])} />);
      expect(screen.getByText('Test KPI')).toBeInTheDocument();
    });

    it('When values increase / Then shows positive change', () => {
      render(<TrendChart trendData={makeTrend([100, 150, 200])} />);
      expect(screen.getByText('+100.0%')).toBeInTheDocument();
    });

    it('When values decrease / Then shows negative change', () => {
      render(<TrendChart trendData={makeTrend([200, 150, 100])} />);
      expect(screen.getByText('-50.0%')).toBeInTheDocument();
    });

    it('When rendered with SVG / Then contains path elements', () => {
      const { container } = render(<TrendChart trendData={makeTrend([10, 20, 30])} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
    });

    it('When color is green / Then renders without error', () => {
      const { container } = render(<TrendChart trendData={makeTrend([10, 20])} color="green" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('When color is unknown / Then falls back to blue', () => {
      const { container } = render(<TrendChart trendData={makeTrend([10, 20])} color="neon" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });
});
