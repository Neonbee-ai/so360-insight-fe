/**
 * Financial Control Charts
 * Chart visualizations for Finance segment KPIs
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, Card, Grid, GridItem } from '@so360/design-system';
import {
    WaterfallChartComponent,
    LineChartComponent,
    BarChartComponent,
    formatCurrency,
} from '../charts';
import { insightApi } from '../../services/insightApi';
import { useModules } from '@so360/shell-context';

interface FinanceChartsProps {
    tenantId: string;
    orgId: string;
}

export const FinanceCharts: React.FC<FinanceChartsProps> = ({ tenantId, orgId }) => {
    const { isModuleEnabled } = useModules();
    const [cashFlowData, setCashFlowData] = useState<any>(null);
    const [burnRateData, setBurnRateData] = useState<any>(null);
    const [expenseData, setExpenseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChartData();
    }, [tenantId, orgId]);

    const fetchChartData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [cashFlowRes, burnRateRes, expenseRes] = await Promise.all([
                insightApi.getChartData('finance', 'cash_flow_waterfall'),
                insightApi.getChartData('finance', 'burn_rate_projection'),
                insightApi.getChartData('finance', 'expense_variance'),
            ]);

            setCashFlowData(cashFlowRes.data?.data?.data || []);
            setBurnRateData(burnRateRes.data?.data?.data || []);
            setExpenseData(expenseRes.data?.data?.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load finance charts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-danger animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="error" title="Failed to load charts">{error}</Alert>
        );
    }

    return (
        <Grid columns={12} gap="lg">
            {/* Cash Flow Waterfall */}
            {isModuleEnabled('accounting') && cashFlowData && (
                <GridItem span={12}>
                    <Card title="Cash Flow Waterfall">
                        <p className="text-sm text-fg-muted">Receivables, payables, and net position</p>
                        <WaterfallChartComponent
                            data={cashFlowData}
                            height={320}
                            formatValue={(value) => formatCurrency(value)}
                        />
                    </Card>
                </GridItem>
            )}

            {/* Burn Rate with Projection */}
            {isModuleEnabled('accounting') && burnRateData && (
                <GridItem span={6}>
                    <Card title="Burn Rate & Projection">
                        <p className="text-sm text-fg-muted">Historical and forecasted burn</p>
                        <LineChartComponent
                            data={burnRateData}
                            xAxisKey="month"
                            series={[
                                { key: 'actual', name: 'Actual Burn', color: '#ef4444' },
                                { key: 'projected', name: 'Projected', color: '#f87171' },
                            ]}
                            height={280}
                            segmentColor="finance"
                            formatValue={(value) => formatCurrency(value)}
                        />
                    </Card>
                </GridItem>
            )}

            {/* Expense Variance */}
            {isModuleEnabled('accounting') && expenseData && (
                <GridItem span={6}>
                    <Card title="Expense Variance">
                        <p className="text-sm text-fg-muted">Budget vs actual by category</p>
                        <BarChartComponent
                            data={expenseData}
                            xAxisKey="category"
                            series={[
                                { key: 'budgeted', name: 'Budget', color: '#94a3b8' },
                                { key: 'actual', name: 'Actual', color: '#ef4444' },
                            ]}
                            height={280}
                            segmentColor="finance"
                            formatValue={(value) => formatCurrency(value)}
                        />
                    </Card>
                </GridItem>
            )}
        </Grid>
    );
};
