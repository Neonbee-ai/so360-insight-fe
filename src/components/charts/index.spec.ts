import { describe, it, expect } from 'vitest';
import * as ChartExports from './index';

describe('Chart barrel exports', () => {
  describe('Given the index module', () => {
    it('When imported / Then exports SparklineChart', () => {
      expect(ChartExports.SparklineChart).toBeDefined();
      expect(typeof ChartExports.SparklineChart).toBe('function');
    });

    it('When imported / Then exports LineChartComponent', () => {
      expect(ChartExports.LineChartComponent).toBeDefined();
      expect(typeof ChartExports.LineChartComponent).toBe('function');
    });

    it('When imported / Then exports AreaChartComponent', () => {
      expect(ChartExports.AreaChartComponent).toBeDefined();
      expect(typeof ChartExports.AreaChartComponent).toBe('function');
    });

    it('When imported / Then exports BarChartComponent', () => {
      expect(ChartExports.BarChartComponent).toBeDefined();
      expect(typeof ChartExports.BarChartComponent).toBe('function');
    });

    it('When imported / Then exports PieChartComponent', () => {
      expect(ChartExports.PieChartComponent).toBeDefined();
      expect(typeof ChartExports.PieChartComponent).toBe('function');
    });

    it('When imported / Then exports FunnelChartComponent', () => {
      expect(ChartExports.FunnelChartComponent).toBeDefined();
      expect(typeof ChartExports.FunnelChartComponent).toBe('function');
    });

    it('When imported / Then exports GaugeChartComponent', () => {
      expect(ChartExports.GaugeChartComponent).toBeDefined();
      expect(typeof ChartExports.GaugeChartComponent).toBe('function');
    });

    it('When imported / Then exports WaterfallChartComponent', () => {
      expect(ChartExports.WaterfallChartComponent).toBeDefined();
      expect(typeof ChartExports.WaterfallChartComponent).toBe('function');
    });

    it('When imported / Then exports ChartContainer', () => {
      expect(ChartExports.ChartContainer).toBeDefined();
      expect(typeof ChartExports.ChartContainer).toBe('function');
    });

    it('When imported / Then exports ChartExport', () => {
      expect(ChartExports.ChartExport).toBeDefined();
      expect(typeof ChartExports.ChartExport).toBe('function');
    });

    it('When imported / Then exports formatCompactNumber utility', () => {
      expect(ChartExports.formatCompactNumber).toBeDefined();
      expect(typeof ChartExports.formatCompactNumber).toBe('function');
    });

    it('When imported / Then exports STATUS_COLORS constant', () => {
      expect(ChartExports.STATUS_COLORS).toBeDefined();
      expect(ChartExports.STATUS_COLORS).toHaveProperty('positive');
      expect(ChartExports.STATUS_COLORS).toHaveProperty('negative');
    });

    it('When imported / Then exports SEGMENT_COLORS constant', () => {
      expect(ChartExports.SEGMENT_COLORS).toBeDefined();
      expect(ChartExports.SEGMENT_COLORS).toHaveProperty('revenue');
    });

    it('When imported / Then exports calculateTrendPercentage utility', () => {
      expect(ChartExports.calculateTrendPercentage).toBeDefined();
      expect(ChartExports.calculateTrendPercentage(110, 100)).toBe(10);
    });

    it('When imported / Then exports getTrendDirection utility', () => {
      expect(ChartExports.getTrendDirection).toBeDefined();
      expect(ChartExports.getTrendDirection(5)).toBe('up');
    });

    it('When imported / Then exports getHeatmapColor utility', () => {
      expect(ChartExports.getHeatmapColor).toBeDefined();
    });

    it('When imported / Then exports getTooltipStyle utility', () => {
      expect(ChartExports.getTooltipStyle).toBeDefined();
      expect(typeof ChartExports.getTooltipStyle).toBe('function');
    });
  });
});
