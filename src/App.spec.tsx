import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

let mockShellBridge: any = {};

vi.mock('@so360/shell-context', () => ({
  useShellBridge: () => mockShellBridge,
  useModules: () => ({ isModuleEnabled: () => true }),
  useFeatureFlags: () => ({ isFeatureEnabled: () => true }),
  useShell: () => ({ businessSettings: { base_currency: 'USD', document_language: 'en-US', timezone: 'UTC' } }),
}));

vi.mock('./services/insightApi', () => ({
  insightApi: {
    setTenantId: vi.fn(),
    setOrgId: vi.fn(),
    setAccessToken: vi.fn(),
  },
}));

vi.mock('./pages/InsightDashboard', () => ({
  InsightDashboard: ({ initialTab }: { initialTab?: string }) => (
    <div data-testid="insight-dash" data-tab={initialTab ?? ''}>InsightDashboard</div>
  ),
}));
vi.mock('./pages/SignalsPage', () => ({
  SignalsPage: () => <div>SignalsPage</div>,
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockShellBridge = {};
  });

  describe('Given no shell context', () => {
    it('When not synced / Then shows initializing', () => {
      mockShellBridge = { currentTenant: null, currentOrg: null };
      render(<MemoryRouter><App /></MemoryRouter>);
      expect(screen.getByText('Initializing Insight module...')).toBeInTheDocument();
    });
  });

  describe('Given shell context', () => {
    it('When synced / Then renders dashboard', async () => {
      mockShellBridge = {
        currentTenant: { id: 't1' },
        currentOrg: { id: 'o1' },
        accessToken: 'tok',
        effectiveFlagsLoaded: true,
      };
      render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('InsightDashboard')).toBeInTheDocument();
      });
    });

    it('When navigating to signals / Then renders signals page', async () => {
      mockShellBridge = {
        currentTenant: { id: 't1' },
        currentOrg: { id: 'o1' },
        accessToken: 'tok',
        effectiveFlagsLoaded: true,
      };
      render(<MemoryRouter initialEntries={['/signals']}><App /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('SignalsPage')).toBeInTheDocument();
      });
    });
  });

  describe('Given SegmentRoute with SEGMENT_FLAG_MAP', () => {
    const syncedBridge = (overrides: Record<string, any> = {}) => ({
      currentTenant: { id: 't1' },
      currentOrg: { id: 'o1' },
      accessToken: 'tok',
      effectiveFlagsLoaded: true,
      ...overrides,
    });

    describe('When navigating to /finance and action:insight:export is hidden', () => {
      it('Then redirects to overview (InsightDashboard at root, no initialTab)', async () => {
        mockShellBridge = syncedBridge({
          getFeatureState: (key: string) => (key === 'action:insight:export' ? 'hidden' : 'enabled'),
        });
        render(<MemoryRouter initialEntries={['/finance']}><App /></MemoryRouter>);
        await waitFor(() => {
          const dash = screen.getByTestId('insight-dash');
          expect(dash).toBeInTheDocument();
          expect(dash.getAttribute('data-tab')).toBe('');
        });
      });
    });

    describe('When navigating to /finance and action:insight:export is enabled', () => {
      it('Then renders InsightDashboard with initialTab=finance', async () => {
        mockShellBridge = syncedBridge({ getFeatureState: () => 'enabled' });
        render(<MemoryRouter initialEntries={['/finance']}><App /></MemoryRouter>);
        await waitFor(() => {
          const dash = screen.getByTestId('insight-dash');
          expect(dash).toBeInTheDocument();
          expect(dash.getAttribute('data-tab')).toBe('finance');
        });
      });
    });

    describe('When navigating to /finance and action:insight:export is locked', () => {
      it('Then shows the upgrade prompt instead of the dashboard', async () => {
        mockShellBridge = syncedBridge({ getFeatureState: () => 'locked' });
        render(<MemoryRouter initialEntries={['/finance']}><App /></MemoryRouter>);
        await waitFor(() => {
          expect(screen.getByText(/upgrade plan/i)).toBeInTheDocument();
        });
        expect(screen.queryByTestId('insight-dash')).not.toBeInTheDocument();
      });
    });

    describe('When navigating to /finance and action:insight:export is disabled', () => {
      it('Then shows the unavailable panel and NO upgrade prompt', async () => {
        mockShellBridge = syncedBridge({ getFeatureState: () => 'disabled' });
        render(<MemoryRouter initialEntries={['/finance']}><App /></MemoryRouter>);
        await waitFor(() => {
          expect(screen.getByText(/feature unavailable/i)).toBeInTheDocument();
        });
        expect(screen.queryByText(/upgrade plan/i)).not.toBeInTheDocument();
        expect(screen.queryByTestId('insight-dash')).not.toBeInTheDocument();
      });
    });

    describe('When navigating to /revenue (not in SEGMENT_FLAG_MAP)', () => {
      it('Then renders InsightDashboard with initialTab=revenue without any flag check', async () => {
        mockShellBridge = syncedBridge({ getFeatureState: () => 'hidden' });
        render(<MemoryRouter initialEntries={['/revenue']}><App /></MemoryRouter>);
        await waitFor(() => {
          const dash = screen.getByTestId('insight-dash');
          expect(dash).toBeInTheDocument();
          expect(dash.getAttribute('data-tab')).toBe('revenue');
        });
      });
    });

    describe('When navigating to a segment with no getFeatureState on the bridge', () => {
      it('Then SegmentRoute fails open to enabled and renders InsightDashboard', async () => {
        mockShellBridge = syncedBridge({ getFeatureState: undefined });
        render(<MemoryRouter initialEntries={['/finance']}><App /></MemoryRouter>);
        await waitFor(() => {
          const dash = screen.getByTestId('insight-dash');
          expect(dash.getAttribute('data-tab')).toBe('finance');
        });
      });
    });
  });
});
