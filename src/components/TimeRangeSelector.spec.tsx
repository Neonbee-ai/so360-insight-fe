import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeRangeSelector, getDaysForRange } from './TimeRangeSelector';

describe('TimeRangeSelector', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given the selector is rendered', () => {
    it('When displayed / Then shows all five range options', () => {
      render(<TimeRangeSelector selected="30d" onChange={vi.fn()} />);
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 days')).toBeInTheDocument();
      expect(screen.getByText('Last 6 months')).toBeInTheDocument();
      expect(screen.getByText('Last 12 months')).toBeInTheDocument();
    });
  });

  describe('Given a range is selected', () => {
    it('When "Last 30 days" is active / Then it has the active styling class', () => {
      render(<TimeRangeSelector selected="30d" onChange={vi.fn()} />);
      const btn = screen.getByText('Last 30 days');
      expect(btn.className).toContain('bg-blue-500');
    });
  });

  describe('Given the user clicks a different range', () => {
    it('When "Last 7 days" clicked / Then calls onChange with "7d"', async () => {
      const onChange = vi.fn();
      render(<TimeRangeSelector selected="30d" onChange={onChange} />);
      await userEvent.click(screen.getByText('Last 7 days'));
      expect(onChange).toHaveBeenCalledWith('7d');
    });

    it('When "Last 12 months" clicked / Then calls onChange with "1y"', async () => {
      const onChange = vi.fn();
      render(<TimeRangeSelector selected="30d" onChange={onChange} />);
      await userEvent.click(screen.getByText('Last 12 months'));
      expect(onChange).toHaveBeenCalledWith('1y');
    });
  });
});

describe('getDaysForRange', () => {
  it('When called with "7d" / Then returns 7', () => {
    expect(getDaysForRange('7d')).toBe(7);
  });

  it('When called with "1y" / Then returns 365', () => {
    expect(getDaysForRange('1y')).toBe(365);
  });

  it('When called with unknown value / Then returns 30 as default', () => {
    expect(getDaysForRange('unknown' as any)).toBe(30);
  });
});
