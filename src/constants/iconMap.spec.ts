import { describe, it, expect } from 'vitest';
import { INSIGHT_ICON_MAP, getInsightIcon } from './iconMap';

// Every icon name fed dynamically anywhere in the app must resolve to a real
// component, otherwise replacing the `import * as LucideIcons` namespace import
// with this explicit map would silently drop an icon (UI regression).
const ALL_DYNAMIC_ICON_NAMES = [
  // segment icon_name (insight-be migration 003 + app.module BarChart3 + local Factory)
  'TrendingUp', 'Zap', 'Truck', 'Users', 'DollarSign', 'BarChart3', 'Factory',
  // tab icons (InsightDashboard)
  'LayoutDashboard',
  // AI summary card icons (AtAGlanceView) + NeuraSummaryCard default
  'Briefcase', 'Package', 'Users2', 'Sparkles',
  // module coverage icons (ModuleCoveragePanel)
  'Calculator', 'ShoppingCart', 'FolderKanban', 'GitBranch', 'UserCheck', 'Clock', 'Store', 'Inbox',
];

describe('getInsightIcon', () => {
  describe('Given a known icon name', () => {
    it.each(ALL_DYNAMIC_ICON_NAMES)('When name is %s / Then resolves to a component', (name) => {
      expect(getInsightIcon(name)).toBeDefined();
      expect(INSIGHT_ICON_MAP[name]).toBeDefined();
    });
  });

  describe('Given an unknown icon name', () => {
    it('When name is not in the map / Then returns undefined (same as old null-fallback)', () => {
      expect(getInsightIcon('NotARealIcon')).toBeUndefined();
    });
  });

  describe('Given no icon name', () => {
    it('When name is undefined / Then returns undefined', () => {
      expect(getInsightIcon(undefined)).toBeUndefined();
    });

    it('When name is empty string / Then returns undefined', () => {
      expect(getInsightIcon('')).toBeUndefined();
    });
  });
});
