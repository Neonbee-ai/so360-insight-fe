import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../services/insightApi', () => ({ insightApi: { getMyPipeline: vi.fn() } }));

import { MyPipelinePage } from './MyPipelinePage';
import { insightApi } from '../services/insightApi';

const api = insightApi as any;

const payload = {
    owner_user_id: 'u1',
    open_deals: 2,
    total_pipeline: 1400,
    weighted_forecast: 860,
    won_this_month: 300,
    deals: [
        { id: 'd1', name: 'Acme rollout', amount: 1000, stage: 'Proposal', probability: 50, weighted_amount: 500, expected_close_date: '2026-11-05', overdue: false },
        { id: 'd2', name: 'Globex renewal', amount: 400, stage: 'Negotiation', probability: 90, weighted_amount: 360, expected_close_date: '2026-10-01', overdue: true },
    ],
    forecast: [
        { month: '2026-10', amount: 400, weighted_amount: 360, deals: 1 },
        { month: '2026-11', amount: 1000, weighted_amount: 500, deals: 1 },
    ],
};

describe('MyPipelinePage', () => {
    beforeEach(() => vi.resetAllMocks());

    it('Given open deals, When loaded, Then KPIs, forecast rows and deal rows render', async () => {
        api.getMyPipeline.mockResolvedValue(payload);
        render(<MyPipelinePage />);
        await waitFor(() => expect(screen.getByText('Acme rollout')).toBeInTheDocument());
        expect(screen.getByText('Globex renewal')).toBeInTheDocument();
        expect(screen.getByText(/Open pipeline/)).toBeInTheDocument();
        expect(screen.getByText(/Weighted forecast.*\$860\.00/)).toBeInTheDocument();
        expect(screen.getByText('Nov 2026')).toBeInTheDocument();
        expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('Given no open deals, When loaded, Then an empty state shows', async () => {
        api.getMyPipeline.mockResolvedValue({ ...payload, open_deals: 0, deals: [], forecast: [], total_pipeline: 0, weighted_forecast: 0 });
        render(<MyPipelinePage />);
        await waitFor(() => expect(screen.getByText('No open deals')).toBeInTheDocument());
    });

    it('Given the API fails, When loaded, Then an error alert shows', async () => {
        api.getMyPipeline.mockRejectedValue(new Error('down'));
        render(<MyPipelinePage />);
        await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    });
});
