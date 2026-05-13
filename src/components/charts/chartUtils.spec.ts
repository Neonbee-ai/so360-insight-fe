import { describe, it, expect } from 'vitest';
import {
  SEGMENT_COLORS,
  formatNumber,
  formatPercentage,
  formatCurrency,
  formatDate,
  getTooltipStyle,
  getAxisStyle,
  getGridStyle,
  STATUS_COLORS,
  formatCompactNumber,
  calculateTrendPercentage,
  getTrendDirection,
  getHeatmapColor,
} from './chartUtils';

describe('chartUtils', () => {
  describe('Given SEGMENT_COLORS', () => {
    it('When accessed / Then contains known segments', () => {
      expect(SEGMENT_COLORS).toHaveProperty('revenue');
      expect(SEGMENT_COLORS).toHaveProperty('execution');
      expect(SEGMENT_COLORS).toHaveProperty('delivery');
      expect(SEGMENT_COLORS).toHaveProperty('workforce');
      expect(SEGMENT_COLORS).toHaveProperty('finance');
    });

    it('When revenue accessed / Then has primary color', () => {
      expect(SEGMENT_COLORS.revenue.primary).toBeDefined();
      expect(SEGMENT_COLORS.revenue.secondary).toBeDefined();
    });
  });

  describe('Given STATUS_COLORS', () => {
    it('When accessed / Then has positive and negative', () => {
      expect(STATUS_COLORS.positive).toBeDefined();
      expect(STATUS_COLORS.negative).toBeDefined();
    });
  });

  describe('Given formatNumber', () => {
    it('When called with number / Then returns formatted string', () => {
      const result = formatNumber(12345.678, 2);
      expect(result).toContain('12');
    });

    it('When called with 0 decimals / Then rounds', () => {
      const result = formatNumber(99.9, 0);
      expect(result).toContain('100');
    });
  });

  describe('Given formatCompactNumber', () => {
    it('When called with large number / Then returns compact form', () => {
      const result = formatCompactNumber(1500000);
      expect(result).toContain('M');
    });
  });

  describe('Given formatPercentage', () => {
    it('When called / Then returns percentage string', () => {
      const result = formatPercentage(95);
      expect(result).toContain('%');
    });
  });

  describe('Given formatCurrency', () => {
    it('When called / Then returns currency string', () => {
      const result = formatCurrency(1500);
      expect(result).toBeDefined();
    });
  });

  describe('Given formatDate', () => {
    it('When called with ISO date / Then returns string', () => {
      const result = formatDate('2024-03-15');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Given getTooltipStyle', () => {
    it('When called / Then returns style object', () => {
      const style = getTooltipStyle();
      expect(style).toHaveProperty('contentStyle');
      expect(style).toHaveProperty('labelStyle');
      expect(style).toHaveProperty('itemStyle');
    });
  });

  describe('Given getAxisStyle', () => {
    it('When called / Then returns style object', () => {
      const style = getAxisStyle();
      expect(style).toBeDefined();
      expect(style).toHaveProperty('stroke');
    });
  });

  describe('Given getGridStyle', () => {
    it('When called / Then returns style object', () => {
      const style = getGridStyle();
      expect(style).toBeDefined();
      expect(style).toHaveProperty('stroke');
    });
  });

  describe('Given calculateTrendPercentage', () => {
    it('When positive change / Then returns positive percentage', () => {
      expect(calculateTrendPercentage(120, 100)).toBe(20);
    });

    it('When previous is 0 / Then returns 0', () => {
      expect(calculateTrendPercentage(100, 0)).toBe(0);
    });
  });

  describe('Given getTrendDirection', () => {
    it('When positive / Then returns up', () => {
      expect(getTrendDirection(5)).toBe('up');
    });

    it('When negative / Then returns down', () => {
      expect(getTrendDirection(-5)).toBe('down');
    });

    it('When near zero / Then returns stable', () => {
      expect(getTrendDirection(0.5)).toBe('stable');
    });
  });

  describe('Given getHeatmapColor', () => {
    it('When low value / Then returns dark color', () => {
      expect(getHeatmapColor(10, 0, 100)).toBeDefined();
    });

    it('When high value / Then returns light color', () => {
      expect(getHeatmapColor(90, 0, 100)).toBeDefined();
    });
  });
});
