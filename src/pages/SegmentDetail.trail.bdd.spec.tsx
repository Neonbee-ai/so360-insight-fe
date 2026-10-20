import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CombScope } from '@so360/design-system';

vi.mock('../services/insightApi', () => ({ insightApi: { getSegmentDetail: vi.fn() } }));
vi.mock('../components/TrendChart', () => ({ TrendChart: () => <div data-testid="trend-chart" /> }));

import { SegmentDetailPage } from './SegmentDetail';
import { insightApi } from '../services/insightApi';

const detail = {
  segment_code: 'revenue', segment_name: 'Revenue', description: 'desc', icon_name: 'TrendingUp',
  color_scheme: { primary: 'green', secondary: 'green' }, kpis: [], signals: [], trends: [],
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/revenue']}>
      <CombScope module="insight" root={{ label: 'Insight', to: '/insight' }} navigate={() => undefined}>
        <Routes><Route path="/:segmentCode" element={<SegmentDetailPage />} /></Routes>
      </CombScope>
    </MemoryRouter>,
  );

describe('SegmentDetailPage trail', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('Given a loaded segment, When the page renders, Then it links back to its parent and shows the Insight root crumb', async () => {
    (insightApi as any).getSegmentDetail.mockResolvedValue(detail);
    renderPage();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Revenue'));
    expect(screen.getByText('Insight')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });
});
