/**
 * Specs for the four untested Insight segment chart components:
 * DeliveryCharts, ExecutionCharts, FinanceCharts, RevenueCharts, WorkforceCharts
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mock recharts ────────────────────────────────────────────────────────────
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="rc">{children}</div>,
    AreaChart: ({ children }: any) => <div>{children}</div>,
    Area: () => <div />,
    BarChart: ({ children }: any) => <div>{children}</div>,
    Bar: () => <div />,
    LineChart: ({ children }: any) => <div>{children}</div>,
    Line: () => <div />,
    PieChart: ({ children }: any) => <div>{children}</div>,
    Pie: ({ children }: any) => <div>{children}</div>,
    Cell: () => <div />,
    FunnelChart: ({ children }: any) => <div>{children}</div>,
    Funnel: ({ children }: any) => <div>{children}</div>,
    LabelList: () => <div />,
    RadialBarChart: ({ children }: any) => <div>{children}</div>,
    RadialBar: () => <div />,
    PolarAngleAxis: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
    ReferenceLine: () => <div />,
}));

// ─── Mock @so360/shell-context ────────────────────────────────────────────────
vi.mock('@so360/shell-context', () => ({
    useModules: () => ({ isModuleEnabled: () => true }),
    useShellContext: () => ({ tenantId: 'tenant-1', orgId: 'org-1' }),
    useFeatureFlags: () => ({ isFeatureEnabled: () => true, isEnabled: () => true }),
    useShellBridge: () => null,
}));

// ─── Mock insightApi ─────────────────────────────────────────────────────────
const mockGetChartData = vi.fn();
vi.mock('../../services/insightApi', () => ({
    insightApi: {
        getChartData: (...args: any[]) => mockGetChartData(...args),
    },
}));

const chartData = [{ date: '2026-01', value: 100 }];
const chartResponse = (data: any = chartData) => ({
    data: { data: { data } },
});

import { DeliveryCharts } from './DeliveryCharts';
import { ExecutionCharts } from './ExecutionCharts';
import { FinanceCharts } from './FinanceCharts';
import { RevenueCharts } from './RevenueCharts';
import { WorkforceCharts } from './WorkforceCharts';

// ─── Shared props ─────────────────────────────────────────────────────────────
const props = { tenantId: 'tenant-1', orgId: 'org-1' };

beforeEach(() => {
    vi.resetAllMocks();
});

// ─── Shared error heading in all chart components ─────────────────────────────
const ERROR_HEADING = /failed to load charts/i;

// =============================================================================
// DeliveryCharts
// =============================================================================

describe('DeliveryCharts', () => {
    describe('Given chart data loads successfully', () => {
        beforeEach(() => {
            mockGetChartData.mockResolvedValue(chartResponse());
        });

        it('When rendered / Then shows chart containers', async () => {
            render(<DeliveryCharts {...props} />);
            await waitFor(() =>
                expect(screen.getAllByTestId('rc').length).toBeGreaterThan(0),
            );
        });
    });

    describe('Given API throws error', () => {
        beforeEach(() => {
            mockGetChartData.mockRejectedValue(new Error('Network error'));
        });

        it('When error occurs / Then shows Failed to Load Charts heading', async () => {
            render(<DeliveryCharts {...props} />);
            await waitFor(() =>
                expect(screen.getByText(ERROR_HEADING)).toBeInTheDocument(),
            );
        });

        it('When error occurs / Then shows the error message text', async () => {
            render(<DeliveryCharts {...props} />);
            await waitFor(() =>
                expect(screen.getByText(/Network error/i)).toBeInTheDocument(),
            );
        });
    });

    describe('Given loading state', () => {
        it('When data is pending / Then shows spinner', () => {
            mockGetChartData.mockReturnValue(new Promise(() => {}));
            render(<DeliveryCharts {...props} />);
            const spinners = document.querySelectorAll('.animate-spin');
            expect(spinners.length).toBeGreaterThan(0);
        });
    });
});

// =============================================================================
// ExecutionCharts
// =============================================================================

describe('ExecutionCharts', () => {
    describe('Given chart data loads successfully', () => {
        beforeEach(() => {
            mockGetChartData.mockImplementation(async (_segment: string, metric: string) => {
                if (metric === 'workflow_status') {
                    return { data: { data: { statuses: [{ name: 'Done', count: 10 }] } } };
                }
                return chartResponse();
            });
        });

        it('When rendered / Then shows chart containers', async () => {
            render(<ExecutionCharts {...props} />);
            await waitFor(() =>
                expect(screen.getAllByTestId('rc').length).toBeGreaterThan(0),
            );
        });
    });

    describe('Given API throws error', () => {
        beforeEach(() => {
            mockGetChartData.mockRejectedValue(new Error('Execution fetch failed'));
        });

        it('When error occurs / Then shows error state', async () => {
            render(<ExecutionCharts {...props} />);
            await waitFor(() =>
                expect(screen.getByText(ERROR_HEADING)).toBeInTheDocument(),
            );
        });
    });
});

// =============================================================================
// FinanceCharts
// =============================================================================

describe('FinanceCharts', () => {
    describe('Given chart data loads successfully', () => {
        beforeEach(() => {
            mockGetChartData.mockResolvedValue(chartResponse());
        });

        it('When rendered / Then shows chart containers', async () => {
            render(<FinanceCharts {...props} />);
            await waitFor(() =>
                expect(screen.getAllByTestId('rc').length).toBeGreaterThan(0),
            );
        });
    });

    describe('Given API throws error', () => {
        beforeEach(() => {
            mockGetChartData.mockRejectedValue(new Error('Finance fetch failed'));
        });

        it('When error occurs / Then shows error state', async () => {
            render(<FinanceCharts {...props} />);
            await waitFor(() =>
                expect(screen.getByText(ERROR_HEADING)).toBeInTheDocument(),
            );
        });
    });
});

// =============================================================================
// RevenueCharts
// =============================================================================

describe('RevenueCharts', () => {
    describe('Given chart data loads successfully', () => {
        beforeEach(() => {
            mockGetChartData.mockImplementation(async (_segment: string, metric: string) => {
                if (metric === 'conversion_funnel') {
                    return { data: { data: { stages: [{ name: 'Lead', value: 100 }] } } };
                }
                if (metric === 'aging_buckets') {
                    return { data: { data: { buckets: [{ range: '0-30', amount: 5000 }] } } };
                }
                return chartResponse();
            });
        });

        it('When rendered / Then shows chart containers', async () => {
            render(<RevenueCharts {...props} />);
            await waitFor(() =>
                expect(screen.getAllByTestId('rc').length).toBeGreaterThan(0),
            );
        });
    });

    describe('Given API throws error', () => {
        beforeEach(() => {
            mockGetChartData.mockRejectedValue(new Error('Revenue fetch failed'));
        });

        it('When error occurs / Then shows error state', async () => {
            render(<RevenueCharts {...props} />);
            await waitFor(() =>
                expect(screen.getByText(ERROR_HEADING)).toBeInTheDocument(),
            );
        });
    });
});

// =============================================================================
// WorkforceCharts
// =============================================================================

describe('WorkforceCharts', () => {
    describe('Given chart data loads successfully', () => {
        beforeEach(() => {
            mockGetChartData.mockImplementation(async (_segment: string, metric: string) => {
                if (metric === 'compliance_gauge') {
                    return { data: { data: { score: 92, label: 'Compliance' } } };
                }
                if (metric === 'overtime_distribution') {
                    return { data: { data: { departments: [{ name: 'Eng', hours: 40 }] } } };
                }
                return chartResponse();
            });
        });

        it('When rendered / Then shows chart containers', async () => {
            render(<WorkforceCharts {...props} />);
            await waitFor(() =>
                expect(screen.getAllByTestId('rc').length).toBeGreaterThan(0),
            );
        });
    });

    describe('Given API throws error', () => {
        beforeEach(() => {
            mockGetChartData.mockRejectedValue(new Error('Workforce fetch failed'));
        });

        it('When error occurs / Then shows error state', async () => {
            render(<WorkforceCharts {...props} />);
            await waitFor(() =>
                expect(screen.getByText(ERROR_HEADING)).toBeInTheDocument(),
            );
        });
    });

    describe('Given loading state', () => {
        it('When data is pending / Then shows spinner', () => {
            mockGetChartData.mockReturnValue(new Promise(() => {}));
            render(<WorkforceCharts {...props} />);
            const spinners = document.querySelectorAll('.animate-spin');
            expect(spinners.length).toBeGreaterThan(0);
        });
    });
});
