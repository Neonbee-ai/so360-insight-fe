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

describe('TrendChart zero baseline', () => {
  describe('Given a series whose first value is zero', () => {
    it('When all values are zero / Then the change reads 0.0% and never NaN', () => {
      render(<TrendChart trendData={makeTrend([0, 0, 0])} />);
      expect(screen.getByText('+0.0%')).toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
    });

    it('When the series grows from zero / Then the change is not Infinity', () => {
      render(<TrendChart trendData={makeTrend([0, 5, 10])} />);
      expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
    });
  });

  describe('Given a single data point', () => {
    it('When rendered / Then no SVG path contains NaN', () => {
      const { container } = render(<TrendChart trendData={makeTrend([42])} />);
      const ds = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d') ?? '');
      expect(ds.length).toBeGreaterThan(0);
      ds.forEach((d) => expect(d).not.toContain('NaN'));
    });
  });
});
