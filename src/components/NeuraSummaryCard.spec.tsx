import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NeuraSummaryCard } from './NeuraSummaryCard';

describe('NeuraSummaryCard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given the card is loading', () => {
    it('When loading is true / Then renders skeleton pulse', () => {
      const { container } = render(
        <NeuraSummaryCard title="Finance" icon="DollarSign" color="blue" summary={null} loading={true} />
      );
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Given an error state', () => {
    it('When error is set / Then shows error message', () => {
      render(
        <NeuraSummaryCard title="Finance" icon="DollarSign" color="blue" summary={null} error="Timeout" />
      );
      expect(screen.getByText('AI insights temporarily unavailable')).toBeInTheDocument();
    });

    it('When onRetry is provided / Then shows Retry button', async () => {
      const onRetry = vi.fn();
      render(
        <NeuraSummaryCard title="Finance" icon="DollarSign" color="blue" summary={null} error="Timeout" onRetry={onRetry} />
      );
      await userEvent.click(screen.getByText('Retry'));
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Given a summary with plain text', () => {
    it('When rendered / Then shows the title and summary content', () => {
      render(
        <NeuraSummaryCard title="Revenue Overview" icon="TrendingUp" color="green" summary="Revenue is up **10%** this quarter." />
      );
      expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
    });
  });

  describe('Given a summary with sections', () => {
    it('When sections provided / Then shows Current Position, Issue, and Solution', () => {
      const sections = {
        currentPosition: 'Revenue at $50k',
        issue: 'Churn rate increasing',
        solution: 'Launch retention campaign',
      };
      render(
        <NeuraSummaryCard title="Revenue" icon="TrendingUp" color="green" summary={null} sections={sections} />
      );
      expect(screen.getByText('Current Position')).toBeInTheDocument();
      expect(screen.getByText('Revenue at $50k')).toBeInTheDocument();
      expect(screen.getByText('Churn rate increasing')).toBeInTheDocument();
      expect(screen.getByText('Launch retention campaign')).toBeInTheDocument();
    });
  });

  describe('Given a regenerate button', () => {
    it('When onRegenerate is provided / Then shows regenerate icon button', () => {
      render(
        <NeuraSummaryCard title="Finance" icon="DollarSign" color="blue" summary="test" onRegenerate={vi.fn()} />
      );
      expect(screen.getByTitle('Regenerate AI summary')).toBeInTheDocument();
    });
  });

  describe('Given a generated timestamp', () => {
    it('When generatedAt is provided / Then shows relative time text', () => {
      render(
        <NeuraSummaryCard title="Finance" icon="DollarSign" color="blue" summary="test" generatedAt={new Date().toISOString()} />
      );
      expect(screen.getByText(/just now/)).toBeInTheDocument();
    });
  });
});
