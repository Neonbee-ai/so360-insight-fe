import { describe, it, expect } from 'vitest';
import * as ChartExports from './index';

describe('Chart barrel exports', () => {
  describe('Given the index module', () => {
    it('When imported / Then exports all chart components', () => {
      expect(ChartExports.SparklineChart).toBeDefined();
      expect(ChartExports.LineChartComponent).toBeDefined();
      expect(ChartExports.BarChartComponent).toBeDefined();
      expect(ChartExports.PieChartComponent).toBeDefined();
      expect(ChartExports.FunnelChartComponent).toBeDefined();
      expect(ChartExports.GaugeChartComponent).toBeDefined();
      expect(ChartExports.WaterfallChartComponent).toBeDefined();
      expect(ChartExports.ChartContainer).toBeDefined();
      expect(ChartExports.ChartExport).toBeDefined();
    });

    it('When imported / Then exports chart utilities', () => {
      expect(ChartExports.formatCompactNumber).toBeDefined();
      expect(ChartExports.STATUS_COLORS).toBeDefined();
    });
  });
});
