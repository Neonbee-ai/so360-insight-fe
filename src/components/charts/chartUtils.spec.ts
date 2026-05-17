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

    it('When value is exactly at 20% boundary / Then returns slate-700', () => {
      // normalized = 0.2 → falls through first branch, hits second
      expect(getHeatmapColor(20, 0, 100)).toBe('#334155');
    });

    it('When value is at minimum / Then returns darkest tier', () => {
      expect(getHeatmapColor(0, 0, 100)).toBe('#1e293b');
    });

    it('When value equals max / Then returns lightest tier', () => {
      expect(getHeatmapColor(100, 0, 100)).toBe('#94a3b8');
    });
  });
});

import {
  THEME_COLORS,
  formatDateTime,
  getResponsiveContainerProps,
  getLegendStyle,
  generateLabels,
  getMinMaxValues,
} from './chartUtils';

describe('THEME_COLORS', () => {
  describe('Given the theme color palette', () => {
    it('When accessed / Then has background and border', () => {
      expect(THEME_COLORS.background).toBeDefined();
      expect(THEME_COLORS.border).toBeDefined();
    });

    it('When accessed / Then has text sub-object with primary/secondary/tertiary', () => {
      expect(THEME_COLORS.text.primary).toBeDefined();
      expect(THEME_COLORS.text.secondary).toBeDefined();
      expect(THEME_COLORS.text.tertiary).toBeDefined();
    });

    it('When accessed / Then has tooltip sub-object', () => {
      expect(THEME_COLORS.tooltip.background).toBeDefined();
      expect(THEME_COLORS.tooltip.border).toBeDefined();
      expect(THEME_COLORS.tooltip.text).toBeDefined();
    });
  });
});

describe('formatDateTime', () => {
  describe('Given a Date string', () => {
    it('When called with ISO string / Then returns a formatted string', () => {
      const result = formatDateTime('2024-03-15T14:30:00Z');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('When called with a Date object / Then returns a formatted string', () => {
      const result = formatDateTime(new Date('2024-06-01T09:00:00Z'));
      expect(typeof result).toBe('string');
    });
  });
});

describe('getResponsiveContainerProps', () => {
  describe('Given default height', () => {
    it('When called without arguments / Then returns width 100% and height 300', () => {
      const props = getResponsiveContainerProps();
      expect(props.width).toBe('100%');
      expect(props.height).toBe(300);
    });

    it('When called with custom height / Then returns that height', () => {
      const props = getResponsiveContainerProps(450);
      expect(props.height).toBe(450);
    });
  });
});

describe('getLegendStyle', () => {
  describe('Given legend style', () => {
    it('When called / Then returns iconSize, fontSize, and color', () => {
      const style = getLegendStyle();
      expect(style.iconSize).toBeDefined();
      expect(style.fontSize).toBeDefined();
      expect(style.color).toBeDefined();
    });
  });
});

describe('generateLabels', () => {
  describe('Given an array of data objects', () => {
    it('When called with key / Then returns array of label strings', () => {
      const data = [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }];
      const labels = generateLabels(data, 'name');
      expect(labels).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    it('When data is empty / Then returns empty array', () => {
      expect(generateLabels([], 'name')).toEqual([]);
    });
  });
});

describe('getMinMaxValues', () => {
  describe('Given numeric data', () => {
    it('When called / Then returns correct min and max', () => {
      const data = [{ val: 10 }, { val: 45 }, { val: 3 }, { val: 99 }];
      const result = getMinMaxValues(data, 'val');
      expect(result.min).toBe(3);
      expect(result.max).toBe(99);
    });

    it('When single item / Then min equals max', () => {
      const data = [{ val: 42 }];
      const result = getMinMaxValues(data, 'val');
      expect(result.min).toBe(42);
      expect(result.max).toBe(42);
    });
  });
});
