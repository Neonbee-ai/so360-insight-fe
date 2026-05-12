import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignalCard } from './SignalCard';
import { SignalSeverity } from '../types/insight';

const baseSignal = {
  id: 's1',
  tenant_id: 't1',
  org_id: 'o1',
  title: 'Low inventory alert',
  description: 'Widget A stock is below reorder point',
  severity: SignalSeverity.CRITICAL,
  module_code: 'module:inventory',
  created_at: '2026-01-01T12:00:00Z',
};

describe('SignalCard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given a critical signal', () => {
    it('When rendered / Then shows the title', () => {
      render(<SignalCard signal={baseSignal} onResolve={vi.fn()} />);
      expect(screen.getByText('Low inventory alert')).toBeInTheDocument();
    });

    it('When rendered / Then shows the description', () => {
      render(<SignalCard signal={baseSignal} onResolve={vi.fn()} />);
      expect(screen.getByText('Widget A stock is below reorder point')).toBeInTheDocument();
    });

    it('When rendered / Then shows CRITICAL badge', () => {
      render(<SignalCard signal={baseSignal} onResolve={vi.fn()} />);
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    });

    it('When rendered / Then shows Resolve button', () => {
      render(<SignalCard signal={baseSignal} onResolve={vi.fn()} />);
      expect(screen.getByText('Resolve')).toBeInTheDocument();
    });
  });

  describe('Given the Resolve button is clicked', () => {
    it('When clicked / Then calls onResolve with signal id', async () => {
      const onResolve = vi.fn();
      render(<SignalCard signal={baseSignal} onResolve={onResolve} />);
      await userEvent.click(screen.getByText('Resolve'));
      expect(onResolve).toHaveBeenCalledWith('s1');
    });
  });

  describe('Given a resolved signal', () => {
    it('When resolved_at is set / Then shows Resolved text instead of button', () => {
      render(<SignalCard signal={{ ...baseSignal, resolved_at: '2026-01-02T00:00:00Z' }} onResolve={vi.fn()} />);
      expect(screen.getByText('Resolved')).toBeInTheDocument();
      expect(screen.queryByText('Resolve')).not.toBeInTheDocument();
    });
  });

  describe('Given a signal with recommended actions', () => {
    it('When actions are present / Then renders action buttons', () => {
      const signal = {
        ...baseSignal,
        recommended_actions: [{ label: 'Reorder', path: '/inventory/reorder', type: 'navigate' as const }],
      };
      render(<SignalCard signal={signal} onResolve={vi.fn()} />);
      expect(screen.getByText('Reorder')).toBeInTheDocument();
    });
  });
});
