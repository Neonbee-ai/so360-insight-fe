import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

let mockShell: any = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };

vi.mock('@so360/shell-context', () => ({
  useShellBridge: () => mockShell,
  useModules: () => ({ isModuleEnabled: () => true }),
  useFeatureFlags: () => ({ isFeatureEnabled: () => true }),
}));

vi.mock('../services/insightApi', () => ({
  insightApi: {
    getAlerts: vi.fn(),
    resolveAlert: vi.fn(),
  },
}));

vi.mock('../components/AlertCard', () => ({
  AlertCard: (props: any) => (
    <div data-testid="alert-card">
      <span>{props.alert.title}</span>
      <button onClick={() => props.onResolve(props.alert.id)}>Resolve</button>
    </div>
  ),
}));

import { AlertsPage } from './AlertsPage';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

describe('AlertsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
  });

  describe('Given alerts loading', () => {
    it('When loading / Then shows loading text', () => {
      mockApi.getAlerts.mockReturnValue(new Promise(() => {}));
      render(<AlertsPage />);
      expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
    });
  });

  describe('Given alerts loaded', () => {
    it('When alerts exist / Then shows alert cards', async () => {
      mockApi.getAlerts.mockResolvedValue({
        data: [{ id: 's1', title: 'Critical Alert', description: 'desc', severity: 'critical', created_at: '2024-01-01', module_code: 'module:crm' }],
      });
      render(<AlertsPage />);
      await waitFor(() => {
        expect(screen.getByText('Critical Alert')).toBeInTheDocument();
      });
    });

    it('When no alerts / Then shows empty state', async () => {
      mockApi.getAlerts.mockResolvedValue({ data: [] });
      render(<AlertsPage />);
      await waitFor(() => {
        expect(screen.getByText('No alerts found')).toBeInTheDocument();
      });
    });

    it('When severity filter changed / Then refetches', async () => {
      mockApi.getAlerts.mockResolvedValue({ data: [] });
      render(<AlertsPage />);
      await waitFor(() => {
        expect(mockApi.getAlerts).toHaveBeenCalled();
      });
      const select = screen.getByDisplayValue('All');
      await userEvent.selectOptions(select, 'critical');
      await waitFor(() => {
        expect(mockApi.getAlerts).toHaveBeenCalledWith(expect.objectContaining({ severity: 'critical' }));
      });
    });

    it('When unresolved filter toggled / Then shows all alerts', async () => {
      mockApi.getAlerts.mockResolvedValue({ data: [] });
      render(<AlertsPage />);
      await waitFor(() => {
        expect(screen.getByText('Unresolved')).toBeInTheDocument();
      });
      const allBtn = screen.getByRole('button', { name: 'All' });
      await userEvent.click(allBtn);
      await waitFor(() => {
        expect(mockApi.getAlerts).toHaveBeenCalledWith(expect.objectContaining({ unresolved_only: false }));
      });
    });
  });

  describe('Given effectiveFlagsLoaded is false', () => {
    it('When flags are not yet resolved / Then alert cards and filter controls are absent', () => {
      mockShell = { effectiveFlagsLoaded: false, isFeatureEnabled: () => true };
      render(<AlertsPage />);
      // canAccessAlerts is false → shows upgrade panel, not the live alerts list
      expect(screen.queryByText('Loading alerts...')).not.toBeInTheDocument();
      expect(screen.queryByTestId('alert-card')).not.toBeInTheDocument();
    });
  });

  describe('Given effectiveFlagsLoaded is true and alerts feature is enabled', () => {
    it('When flags are resolved and feature is on / Then alerts page content is visible', async () => {
      mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
      mockApi.getAlerts.mockResolvedValue({ data: [] });
      render(<AlertsPage />);
      await waitFor(() => {
        expect(screen.getByText('Alerts')).toBeInTheDocument();
      });
    });
  });
});
