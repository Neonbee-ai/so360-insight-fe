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
    getSignals: vi.fn(),
    resolveSignal: vi.fn(),
  },
}));

vi.mock('../components/SignalCard', () => ({
  SignalCard: (props: any) => (
    <div data-testid="signal-card">
      <span>{props.signal.title}</span>
      <button onClick={() => props.onResolve(props.signal.id)}>Resolve</button>
    </div>
  ),
}));

import { SignalsPage } from './SignalsPage';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

describe('SignalsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
  });

  describe('Given signals loading', () => {
    it('When loading / Then shows loading text', () => {
      mockApi.getSignals.mockReturnValue(new Promise(() => {}));
      render(<SignalsPage />);
      expect(screen.getByText('Loading signals...')).toBeInTheDocument();
    });
  });

  describe('Given signals loaded', () => {
    it('When signals exist / Then shows signal cards', async () => {
      mockApi.getSignals.mockResolvedValue({
        data: [{ id: 's1', title: 'Critical Alert', description: 'desc', severity: 'critical', created_at: '2024-01-01', module_code: 'module:crm' }],
      });
      render(<SignalsPage />);
      await waitFor(() => {
        expect(screen.getByText('Critical Alert')).toBeInTheDocument();
      });
    });

    it('When no signals / Then shows empty state', async () => {
      mockApi.getSignals.mockResolvedValue({ data: [] });
      render(<SignalsPage />);
      await waitFor(() => {
        expect(screen.getByText('No signals found')).toBeInTheDocument();
      });
    });

    it('When severity filter changed / Then refetches', async () => {
      mockApi.getSignals.mockResolvedValue({ data: [] });
      render(<SignalsPage />);
      await waitFor(() => {
        expect(mockApi.getSignals).toHaveBeenCalled();
      });
      const select = screen.getByDisplayValue('All');
      await userEvent.selectOptions(select, 'critical');
      await waitFor(() => {
        expect(mockApi.getSignals).toHaveBeenCalledWith(expect.objectContaining({ severity: 'critical' }));
      });
    });

    it('When unresolved filter toggled / Then shows all signals', async () => {
      mockApi.getSignals.mockResolvedValue({ data: [] });
      render(<SignalsPage />);
      await waitFor(() => {
        expect(screen.getByText('Unresolved')).toBeInTheDocument();
      });
      const allBtn = screen.getByRole('button', { name: 'All' });
      await userEvent.click(allBtn);
      await waitFor(() => {
        expect(mockApi.getSignals).toHaveBeenCalledWith(expect.objectContaining({ unresolved_only: false }));
      });
    });
  });

  describe('Given effectiveFlagsLoaded is false', () => {
    it('When flags are not yet resolved / Then signal cards and filter controls are absent', () => {
      mockShell = { effectiveFlagsLoaded: false, isFeatureEnabled: () => true };
      render(<SignalsPage />);
      // canAccessSignals is false → shows upgrade panel, not the live signals list
      expect(screen.queryByText('Loading signals...')).not.toBeInTheDocument();
      expect(screen.queryByTestId('signal-card')).not.toBeInTheDocument();
    });
  });

  describe('Given effectiveFlagsLoaded is true and signals feature is enabled', () => {
    it('When flags are resolved and feature is on / Then signals page content is visible', async () => {
      mockShell = { effectiveFlagsLoaded: true, isFeatureEnabled: () => true };
      mockApi.getSignals.mockResolvedValue({ data: [] });
      render(<SignalsPage />);
      await waitFor(() => {
        expect(screen.getByText('Signals')).toBeInTheDocument();
      });
    });
  });
});
