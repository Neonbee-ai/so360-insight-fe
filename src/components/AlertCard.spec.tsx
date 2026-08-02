import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlertCard } from './AlertCard';
import { AlertSeverity } from '../types/insight';

const baseAlert = {
  id: 's1',
  tenant_id: 't1',
  org_id: 'o1',
  title: 'Low inventory alert',
  description: 'Widget A stock is below reorder point',
  severity: AlertSeverity.CRITICAL,
  module_code: 'module:inventory',
  created_at: '2026-01-01T12:00:00Z',
};

describe('AlertCard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given a critical alert', () => {
    it('When rendered / Then shows the title', () => {
      render(<AlertCard alert={baseAlert} onResolve={vi.fn()} />);
      expect(screen.getByText('Low inventory alert')).toBeInTheDocument();
    });

    it('When rendered / Then shows the description', () => {
      render(<AlertCard alert={baseAlert} onResolve={vi.fn()} />);
      expect(screen.getByText('Widget A stock is below reorder point')).toBeInTheDocument();
    });

    it('When rendered / Then shows CRITICAL badge', () => {
      render(<AlertCard alert={baseAlert} onResolve={vi.fn()} />);
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    });

    it('When rendered / Then shows Resolve button', () => {
      render(<AlertCard alert={baseAlert} onResolve={vi.fn()} />);
      expect(screen.getByText('Resolve')).toBeInTheDocument();
    });
  });

  describe('Given the Resolve button is clicked', () => {
    it('When clicked / Then calls onResolve with alert id', async () => {
      const onResolve = vi.fn();
      render(<AlertCard alert={baseAlert} onResolve={onResolve} />);
      await userEvent.click(screen.getByText('Resolve'));
      expect(onResolve).toHaveBeenCalledWith('s1');
    });
  });

  describe('Given a resolved alert', () => {
    it('When resolved_at is set / Then shows Resolved text instead of button', () => {
      render(<AlertCard alert={{ ...baseAlert, resolved_at: '2026-01-02T00:00:00Z' }} onResolve={vi.fn()} />);
      expect(screen.getByText('Resolved')).toBeInTheDocument();
      expect(screen.queryByText('Resolve')).not.toBeInTheDocument();
    });
  });

  describe('Given an alert with recommended actions', () => {
    it('When actions are present / Then renders action buttons', () => {
      const alert = {
        ...baseAlert,
        recommended_actions: [{ label: 'Reorder', path: '/inventory/reorder', type: 'navigate' as const }],
      };
      render(<AlertCard alert={alert} onResolve={vi.fn()} />);
      expect(screen.getByText('Reorder')).toBeInTheDocument();
    });
  });
});
