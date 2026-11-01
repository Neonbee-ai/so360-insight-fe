import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabNavigation } from './TabNavigation';

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => <div {...props} />,
  },
}));

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'finance', label: 'Finance', icon: 'DollarSign' },
  { id: 'workforce', label: 'Workforce' },
];

describe('TabNavigation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given tabs are rendered', () => {
    it('When displayed / Then shows all tab labels', () => {
      render(<TabNavigation tabs={tabs} activeTab="overview" onChange={vi.fn()} />);
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Finance')).toBeInTheDocument();
      expect(screen.getByText('Workforce')).toBeInTheDocument();
    });
  });

  describe('Given an active tab', () => {
    it('When "overview" is active / Then it is marked selected', () => {
      render(<TabNavigation tabs={tabs} activeTab="overview" onChange={vi.fn()} />);
      expect(screen.getByRole('tab', { name: /Overview/ })).toHaveAttribute('aria-selected', 'true');
    });

    it('When "workforce" is not active / Then it is not marked selected', () => {
      render(<TabNavigation tabs={tabs} activeTab="overview" onChange={vi.fn()} />);
      expect(screen.getByRole('tab', { name: /Workforce/ })).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Given the user clicks a tab', () => {
    it('When "Finance" clicked / Then calls onChange with "finance"', async () => {
      const onChange = vi.fn();
      render(<TabNavigation tabs={tabs} activeTab="overview" onChange={onChange} />);
      await userEvent.click(screen.getByText('Finance'));
      expect(onChange).toHaveBeenCalledWith('finance');
    });
  });
});
