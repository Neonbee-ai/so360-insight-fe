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
  InsightDashboard: () => <div>InsightDashboard</div>,
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
      };
      render(<MemoryRouter initialEntries={['/signals']}><App /></MemoryRouter>);
      await waitFor(() => {
        expect(screen.getByText('SignalsPage')).toBeInTheDocument();
      });
    });
  });
});
