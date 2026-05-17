/**
 * BDD unit tests for insight type definitions.
 * These tests validate the runtime shape of type-compatible objects and
 * the SignalSeverity enum values that have a concrete JS representation.
 */
import { describe, it, expect } from 'vitest';
import { SignalSeverity } from './insight';
import type {
  KPI,
  Signal,
  SignalsSummary,
  Dashboard,
  ModuleInsights,
  SignalsResponse,
  SegmentSummary,
  SegmentDetail,
  TrendData,
  RecommendedAction,
} from './insight';

// ─── SignalSeverity enum ──────────────────────────────────────────────────────

describe('SignalSeverity', () => {
  describe('Given the SignalSeverity enum', () => {
    it('When INFO accessed / Then equals "info"', () => {
      expect(SignalSeverity.INFO).toBe('info');
    });

    it('When WARNING accessed / Then equals "warning"', () => {
      expect(SignalSeverity.WARNING).toBe('warning');
    });

    it('When CRITICAL accessed / Then equals "critical"', () => {
      expect(SignalSeverity.CRITICAL).toBe('critical');
    });

    it('When all values listed / Then has exactly three members', () => {
      const values = Object.values(SignalSeverity);
      expect(values).toHaveLength(3);
      expect(values).toContain('info');
      expect(values).toContain('warning');
      expect(values).toContain('critical');
    });
  });
});

// ─── KPI type (structural validation) ────────────────────────────────────────

describe('KPI type', () => {
  describe('Given a minimal valid KPI object', () => {
    const kpi: KPI = {
      kpi_code: 'total_revenue',
      kpi_name: 'Total Revenue',
      value: 125000,
      unit: 'USD',
      trend: 'up',
      trend_percentage: 8.5,
      category: 'critical',
      module_code: 'module:crm',
    };

    it('When constructed / Then kpi_code is a string', () => {
      expect(typeof kpi.kpi_code).toBe('string');
    });

    it('When constructed / Then value is a number', () => {
      expect(typeof kpi.value).toBe('number');
    });

    it('When constructed / Then trend is one of up/down/stable', () => {
      expect(['up', 'down', 'stable']).toContain(kpi.trend);
    });

    it('When sparkline_data is absent / Then property is undefined', () => {
      expect(kpi.sparkline_data).toBeUndefined();
    });
  });

  describe('Given a KPI with sparkline_data', () => {
    const kpi: KPI = {
      kpi_code: 'orders',
      kpi_name: 'Orders',
      value: 420,
      unit: 'count',
      trend: 'stable',
      category: 'info',
      module_code: 'module:inventory',
      sparkline_data: [
        { date: '2026-01-01', value: 100 },
        { date: '2026-01-02', value: 110 },
      ],
    };

    it('When sparkline_data provided / Then each point has date and value', () => {
      kpi.sparkline_data!.forEach((pt) => {
        expect(typeof pt.date).toBe('string');
        expect(typeof pt.value).toBe('number');
      });
    });
  });
});

// ─── Signal type ──────────────────────────────────────────────────────────────

describe('Signal type', () => {
  describe('Given a valid Signal object', () => {
    const signal: Signal = {
      id: 'sig-001',
      tenant_id: 'tenant-abc',
      org_id: 'org-xyz',
      title: 'Low Inventory Alert',
      description: 'Stock level below reorder point',
      severity: SignalSeverity.WARNING,
      module_code: 'module:inventory',
      created_at: '2026-05-17T10:00:00Z',
    };

    it('When constructed / Then id is a string', () => {
      expect(typeof signal.id).toBe('string');
    });

    it('When constructed / Then severity equals WARNING', () => {
      expect(signal.severity).toBe('warning');
    });

    it('When optional fields absent / Then resolved_at is undefined', () => {
      expect(signal.resolved_at).toBeUndefined();
    });

    it('When optional fields absent / Then recommended_actions is undefined', () => {
      expect(signal.recommended_actions).toBeUndefined();
    });
  });

  describe('Given a resolved Signal', () => {
    const signal: Signal = {
      id: 'sig-002',
      tenant_id: 'tenant-abc',
      org_id: 'org-xyz',
      title: 'Resolved Alert',
      description: 'Was resolved',
      severity: SignalSeverity.INFO,
      module_code: 'module:crm',
      created_at: '2026-05-10T08:00:00Z',
      resolved_at: '2026-05-10T09:00:00Z',
      resolved_by: 'user-001',
      resolution_note: 'Fixed manually',
    };

    it('When resolved_at set / Then it is a date string', () => {
      expect(typeof signal.resolved_at).toBe('string');
    });

    it('When resolved_by set / Then it contains user id', () => {
      expect(signal.resolved_by).toBe('user-001');
    });
  });
});

// ─── RecommendedAction type ───────────────────────────────────────────────────

describe('RecommendedAction type', () => {
  describe('Given a navigate action', () => {
    const action: RecommendedAction = {
      label: 'View Orders',
      path: '/inventory/orders',
      type: 'navigate',
    };

    it('When constructed / Then type is navigate', () => {
      expect(action.type).toBe('navigate');
    });

    it('When description absent / Then is undefined', () => {
      expect(action.description).toBeUndefined();
    });
  });

  describe('Given a trigger action', () => {
    const action: RecommendedAction = {
      label: 'Reorder Stock',
      path: '/inventory/reorder',
      type: 'trigger',
      description: 'Triggers an automatic reorder workflow',
    };

    it('When constructed / Then type is trigger', () => {
      expect(action.type).toBe('trigger');
    });

    it('When description provided / Then it is a string', () => {
      expect(typeof action.description).toBe('string');
    });
  });
});

// ─── SignalsSummary type ──────────────────────────────────────────────────────

describe('SignalsSummary type', () => {
  describe('Given a valid summary', () => {
    const summary: SignalsSummary = { total: 10, critical: 2, warning: 5, info: 3 };

    it('When constructed / Then total equals sum of severities', () => {
      expect(summary.total).toBe(summary.critical + summary.warning + summary.info);
    });

    it('When constructed / Then all fields are numbers', () => {
      expect(typeof summary.total).toBe('number');
      expect(typeof summary.critical).toBe('number');
      expect(typeof summary.warning).toBe('number');
      expect(typeof summary.info).toBe('number');
    });
  });
});

// ─── Dashboard type ───────────────────────────────────────────────────────────

describe('Dashboard type', () => {
  describe('Given a valid Dashboard', () => {
    const dashboard: Dashboard = {
      kpis: [],
      signals_summary: { total: 0, critical: 0, warning: 0, info: 0 },
      computed_at: '2026-05-17T00:00:00Z',
    };

    it('When constructed / Then kpis is an array', () => {
      expect(Array.isArray(dashboard.kpis)).toBe(true);
    });

    it('When constructed / Then computed_at is a string', () => {
      expect(typeof dashboard.computed_at).toBe('string');
    });
  });
});

// ─── ModuleInsights type ──────────────────────────────────────────────────────

describe('ModuleInsights type', () => {
  describe('Given a valid ModuleInsights', () => {
    const insights: ModuleInsights = {
      module_code: 'module:crm',
      kpis: [],
      active_signals: [],
      computed_at: '2026-05-17T00:00:00Z',
    };

    it('When constructed / Then module_code is a string', () => {
      expect(typeof insights.module_code).toBe('string');
    });

    it('When constructed / Then active_signals is an array', () => {
      expect(Array.isArray(insights.active_signals)).toBe(true);
    });
  });
});

// ─── SignalsResponse type ─────────────────────────────────────────────────────

describe('SignalsResponse type', () => {
  describe('Given a paginated response', () => {
    const response: SignalsResponse = {
      data: [],
      total: 42,
      page: 1,
      limit: 10,
      total_pages: 5,
    };

    it('When constructed / Then total_pages matches total/limit', () => {
      expect(response.total_pages).toBe(Math.ceil(response.total / response.limit));
    });

    it('When constructed / Then page is a positive integer', () => {
      expect(response.page).toBeGreaterThanOrEqual(1);
    });
  });
});

// ─── SegmentSummary type ──────────────────────────────────────────────────────

describe('SegmentSummary type', () => {
  describe('Given a valid SegmentSummary', () => {
    const seg: SegmentSummary = {
      segment_code: 'revenue',
      segment_name: 'Revenue',
      description: 'Revenue analytics',
      icon_name: 'TrendingUp',
      color_scheme: { primary: '#3b82f6', secondary: '#60a5fa' },
      primary_kpi: null,
      kpi_count: 6,
      signal_count: 2,
      trend: 'up',
    };

    it('When primary_kpi is null / Then it is null', () => {
      expect(seg.primary_kpi).toBeNull();
    });

    it('When trend is set / Then it is one of up/down/stable', () => {
      expect(['up', 'down', 'stable']).toContain(seg.trend);
    });

    it('When color_scheme set / Then has primary and secondary', () => {
      expect(seg.color_scheme.primary).toBeDefined();
      expect(seg.color_scheme.secondary).toBeDefined();
    });
  });
});

// ─── SegmentDetail type ───────────────────────────────────────────────────────

describe('SegmentDetail type', () => {
  describe('Given a valid SegmentDetail', () => {
    const detail: SegmentDetail = {
      segment_code: 'execution',
      segment_name: 'Execution',
      description: 'Execution analytics',
      icon_name: 'Zap',
      color_scheme: { primary: '#a855f7', secondary: '#c084fc' },
      kpis: [],
      signals: [],
      trends: [],
    };

    it('When constructed / Then kpis is an array', () => {
      expect(Array.isArray(detail.kpis)).toBe(true);
    });

    it('When constructed / Then signals is an array', () => {
      expect(Array.isArray(detail.signals)).toBe(true);
    });

    it('When constructed / Then trends is an array', () => {
      expect(Array.isArray(detail.trends)).toBe(true);
    });
  });
});

// ─── TrendData type ───────────────────────────────────────────────────────────

describe('TrendData type', () => {
  describe('Given a TrendData object', () => {
    const trend: TrendData = {
      kpi_code: 'total_revenue',
      kpi_name: 'Total Revenue',
      data: [
        { date: '2026-05-01', value: 50000 },
        { date: '2026-05-02', value: 52000 },
        { date: '2026-05-03', value: 51000 },
      ],
    };

    it('When data has items / Then each has date and value', () => {
      trend.data.forEach((pt) => {
        expect(typeof pt.date).toBe('string');
        expect(typeof pt.value).toBe('number');
      });
    });

    it('When constructed / Then kpi_name is a string', () => {
      expect(typeof trend.kpi_name).toBe('string');
    });

    it('When data has three points / Then length is 3', () => {
      expect(trend.data).toHaveLength(3);
    });
  });
});
