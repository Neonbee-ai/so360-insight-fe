/**
 * Timezone BDD Tests — so360-insight-fe
 *
 * Verifies that date/time values are rendered through the real Intl.DateTimeFormat
 * pipeline for:
 *   - DataFreshnessIndicator → uses useBusinessSettings directly, formats via Intl
 *   - SegmentDetailPage      → signals[].created_at rendered via hardcoded
 *                              Intl.DateTimeFormat('en-US', {..., timeZone: 'UTC'})
 *
 * With timezone: 'UTC', locale: 'en-US':
 *   formatDate('2025-06-01T10:00:00Z') → 'Jun 1, 2025'
 *   formatTimestamp for a past (non-today) date → 'Jun 1, 10:00 AM' (month/day/time)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Override shell-context stub to include timezone
// ---------------------------------------------------------------------------
vi.mock('@so360/shell-context', () => ({
  useBusinessSettings: () => ({
    settings: { base_currency: 'USD', document_language: 'en-US', timezone: 'UTC' },
  }),
  useShell: () => ({
    businessSettings: { base_currency: 'USD', document_language: 'en-US', timezone: 'UTC' },
    isModuleEnabled: () => true,
  }),
  useShellBridge: () => ({
    effectiveFlagsLoaded: true,
    isFeatureEnabled: () => true,
    isFeatureHidden: () => false,
    getFeatureState: () => 'enabled',
  }),
  useActivity: () => ({ recordActivity: async () => {} }),
  ShellContext: React.createContext<any>({}),
}));

// Override formatters alias-stub with real Intl implementations
vi.mock('@so360/formatters', () => {
  const realFormatDate = (date: Date | string | null | undefined, _opts?: any): string => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '-';
      return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d);
    } catch {
      return String(date);
    }
  };
  return {
    useFormatters: (_cfg?: any) => ({
      formatDate: realFormatDate,
      formatDateTime: realFormatDate,
      formatCurrency: (v: number) => `$${v}`,
      formatNumber: (n: number) => String(n),
      formatPercentage: (n: number) => `${n}%`,
      getCurrencySymbol: () => '$',
      formatCompactCurrency: (v: number) => `$${v}`,
      formatRelativeTime: () => 'just now',
      currency: 'USD',
      locale: 'en-US',
      timezone: 'UTC',
    }),
    formatDate: realFormatDate,
    formatCurrency: (v: number) => `$${v}`,
  };
});

// ---------------------------------------------------------------------------
// Service mocks
// ---------------------------------------------------------------------------
vi.mock('../services/insightApi', () => ({
  insightApi: {
    getDataFreshness: vi.fn(),
    getSegmentDetail: vi.fn(),
    setTenantId: vi.fn(),
    setOrgId: vi.fn(),
    setAccessToken: vi.fn(),
  },
}));

// Stub TrendChart to avoid canvas errors
vi.mock('../components/TrendChart', () => ({
  TrendChart: () => <div data-testid="trend-chart" />,
}));

import { DataFreshnessIndicator } from '../components/DataFreshnessIndicator';
import { SegmentDetailPage } from '../pages/SegmentDetail';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

const UTC_TS = '2025-06-01T10:00:00Z';
// DataFreshnessIndicator uses: isToday check → if not today → 'Jun 1, 10:00 AM'
// The signal date uses hardcoded Intl with year → 'Jun 1, 2025'
const EXPECTED_DATE = 'Jun 1, 2025';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// DataFreshnessIndicator — last_refreshed_at / last_computation
// ---------------------------------------------------------------------------
describe('Given a freshness object with UTC last_refreshed_at', () => {
  it('When rendered / Then time shows formatted in configured timezone', async () => {
    mockApi.getDataFreshness.mockResolvedValue({
      last_computation: UTC_TS,
      next_scheduled_refresh: null,
      is_stale: false,
    });

    render(<DataFreshnessIndicator />);
    await waitFor(() => expect(mockApi.getDataFreshness).toHaveBeenCalled());

    // DataFreshnessIndicator.formatTimestamp: if not today → 'Jun 1, 10:00 AM'
    // Uses Intl.DateTimeFormat(locale, { month:'short', day:'numeric', hour:'numeric',
    //   minute:'2-digit', hour12:true, timeZone: timezone })
    await waitFor(() => {
      // 2025-06-01T10:00:00Z is not today (2026+) so it shows 'Jun 1, ...'
      const el = screen.getByText(/Jun 1/);
      expect(el).toBeInTheDocument();
    });
  });
});

describe('Given a freshness object with UTC next_scheduled_refresh', () => {
  it('When rendered / Then shows formatted (tooltip title contains the time)', async () => {
    mockApi.getDataFreshness.mockResolvedValue({
      last_computation: UTC_TS,
      next_scheduled_refresh: UTC_TS,
      is_stale: false,
    });

    const { container } = render(<DataFreshnessIndicator />);
    await waitFor(() => expect(mockApi.getDataFreshness).toHaveBeenCalled());

    await waitFor(() => {
      // The tooltip title contains next_scheduled_refresh time
      const wrapper = container.querySelector('[title]');
      expect(wrapper).not.toBeNull();
      // Tooltip: 'Next scheduled refresh: 10:00 AM UTC' (in UTC)
      expect(wrapper?.getAttribute('title')).toMatch(/10:00 AM/);
    });
  });
});

// ---------------------------------------------------------------------------
// SegmentDetailPage — signals[].created_at
// ---------------------------------------------------------------------------
describe('Given signals with UTC created_at', () => {
  beforeEach(() => {
    mockApi.getSegmentDetail.mockResolvedValue({
      segment_code: 'revenue',
      segment_name: 'Revenue',
      description: 'Revenue metrics',
      icon_name: 'TrendingUp',
      color_scheme: { primary: 'blue', secondary: 'blue' },
      kpis: [],
      trends: [],
      signals: [
        {
          id: 'sig-1',
          tenant_id: 'tenant-1',
          org_id: 'org-1',
          title: 'Revenue dropped',
          description: 'MoM revenue declined by 15%',
          severity: 'warning',
          module_code: 'crm',
          created_at: UTC_TS,
        },
      ],
    });
  });

  it('When SegmentDetailPage renders / Then signal date shows "Jun 1, 2025"', async () => {
    render(
      <MemoryRouter initialEntries={['/insight/segment/revenue']}>
        <Routes>
          <Route path="/insight/segment/:segmentCode" element={<SegmentDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(mockApi.getSegmentDetail).toHaveBeenCalledWith('revenue'));

    // The signal date is rendered via:
    // new Intl.DateTimeFormat('en-US', { year:'numeric', month:'short', day:'numeric',
    //   timeZone: 'UTC' }).format(new Date(signal.created_at))
    // → 'Jun 1, 2025'
    await waitFor(() => {
      const el = screen.getByText(EXPECTED_DATE);
      expect(el).toBeInTheDocument();
    });
  });

  it('When SegmentDetailPage renders / Then signal title is shown', async () => {
    render(
      <MemoryRouter initialEntries={['/insight/segment/revenue']}>
        <Routes>
          <Route path="/insight/segment/:segmentCode" element={<SegmentDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Revenue dropped')).toBeInTheDocument();
    });
  });
});
