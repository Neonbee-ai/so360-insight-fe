import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../services/insightApi', () => ({
  insightApi: {
    getSegments: vi.fn(),
    refreshInsight: vi.fn(),
  },
}));

vi.mock('../components/TabNavigation', () => ({
  TabNavigation: (props: any) => (
    <div data-testid="tab-nav">
      {props.tabs.map((t: any) => (
        <button key={t.id} data-testid={`tab-${t.id}`} onClick={() => props.onChange(t.id)}>{t.label}</button>
      ))}
    </div>
  ),
}));
vi.mock('../components/AtAGlanceView', () => ({
  AtAGlanceView: () => <div data-testid="at-a-glance" />,
}));
vi.mock('../components/SegmentTabContent', () => ({
  SegmentTabContent: (props: any) => <div data-testid="segment-tab">{props.segmentCode}</div>,
}));
vi.mock('../components/segments/ManufacturingSegment', () => ({
  ManufacturingSegment: () => <div data-testid="manufacturing" />,
}));
vi.mock('../components/DataFreshnessIndicator', () => ({
  DataFreshnessIndicator: () => <div data-testid="freshness" />,
}));

import { InsightDashboard } from './InsightDashboard';
import { insightApi } from '../services/insightApi';

const mockApi = insightApi as any;

const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('InsightDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Given loading state', () => {
    it('When segments are being fetched / Then shows skeleton', () => {
      mockApi.getSegments.mockReturnValue(new Promise(() => {}));
      wrap(<InsightDashboard />);
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Given error state', () => {
    it('When API fails / Then shows error with retry', async () => {
      mockApi.getSegments.mockRejectedValue(new Error('Failed'));
      wrap(<InsightDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Dashboard')).toBeInTheDocument();
      });
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Given segments loaded', () => {
    it('When rendered / Then shows tab navigation and at-a-glance view', async () => {
      mockApi.getSegments.mockResolvedValue([]);
      wrap(<InsightDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Insight Dashboard')).toBeInTheDocument();
      });
      expect(screen.getByTestId('tab-nav')).toBeInTheDocument();
      expect(screen.getByTestId('at-a-glance')).toBeInTheDocument();
    });

    it('When initialTab is revenue / Then shows segment tab content', async () => {
      mockApi.getSegments.mockResolvedValue([]);
      wrap(<InsightDashboard initialTab="revenue" />);
      await waitFor(() => {
        expect(screen.getByTestId('segment-tab')).toBeInTheDocument();
      });
    });

    it('When initialTab is manufacturing / Then shows manufacturing segment', async () => {
      mockApi.getSegments.mockResolvedValue([]);
      wrap(<InsightDashboard initialTab="manufacturing" />);
      await waitFor(() => {
        expect(screen.getByTestId('manufacturing')).toBeInTheDocument();
      });
    });
  });
});
