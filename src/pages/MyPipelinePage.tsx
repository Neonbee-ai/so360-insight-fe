import React, { useEffect, useState } from 'react';
import { DollarSign, Target, TrendingUp, Clock } from 'lucide-react';
import {
    DashboardPageTemplate, DataTable, Skeleton, KpiCard, Card, Stack, Badge, EmptyState, Alert,
    getErrorMessage, type DataTableColumn,
} from '@so360/design-system';
import { useFormatters } from '@so360/formatters';
import { useShell } from '@so360/shell-context';
import { insightApi } from '../services/insightApi';
import type { MyPipeline, MyPipelineDeal, MyPipelineForecastBucket } from '../types/insight';
import { coveragePct, forecastMonthLabel, overdueCount, sortBuckets } from '../utils/myPipeline';

/**
 * "My pipeline": the signed-in rep's open deals and a probability-weighted
 * sales forecast by expected close month. Currency/format come from Core
 * business settings. Route is gated by submodule:insight:my_pipeline.
 */
export const MyPipelinePage: React.FC = () => {
    const { businessSettings } = useShell();
    const formatters = useFormatters({
        currency: businessSettings?.base_currency || 'USD',
        locale: businessSettings?.document_language || 'en-US',
        timezone: businessSettings?.timezone || 'UTC',
    });

    const [data, setData] = useState<MyPipeline | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let live = true;
        (async () => {
            try {
                const result = await insightApi.getMyPipeline();
                if (live) { setData(result); setError(null); }
            } catch (e) {
                if (live) setError(getErrorMessage(e, 'Failed to load your pipeline'));
            } finally {
                if (live) setLoading(false);
            }
        })();
        return () => { live = false; };
    }, []);

    const money = (v: number) => formatters.formatCurrency(v);
    const deals = data?.deals ?? [];
    const coverage = data ? coveragePct(data.weighted_forecast, data.total_pipeline) : null;

    const kpis = data
        ? [
              <KpiCard key="pipeline" label="Open pipeline" value={money(data.total_pipeline)} hint={`${data.open_deals} open deals`} icon={DollarSign} />,
              <KpiCard key="forecast" label="Weighted forecast" value={money(data.weighted_forecast)} hint={coverage === null ? undefined : `${coverage}% of pipeline`} icon={TrendingUp} />,
              <KpiCard key="won" label="Won this month" value={money(data.won_this_month)} icon={Target} />,
              <KpiCard key="overdue" label="Past close date" value={overdueCount(deals)} hint="Open deals to update" icon={Clock} />,
          ]
        : undefined;

    const dealColumns: DataTableColumn<MyPipelineDeal>[] = [
        { key: 'name', header: 'Deal', render: (d) => d.name },
        { key: 'stage', header: 'Stage', render: (d) => <Badge>{d.stage}</Badge> },
        { key: 'amount', header: 'Amount', render: (d) => money(d.amount) },
        { key: 'probability', header: 'Probability', render: (d) => (d.probability === null ? '—' : `${d.probability}%`) },
        { key: 'weighted', header: 'Weighted', render: (d) => money(d.weighted_amount) },
        {
            key: 'close',
            header: 'Expected close',
            render: (d) => (d.expected_close_date
                ? <>{formatters.formatDate(d.expected_close_date)}{d.overdue && <Badge tone="danger">Overdue</Badge>}</>
                : '—'),
        },
    ];

    const forecastColumns: DataTableColumn<MyPipelineForecastBucket>[] = [
        { key: 'month', header: 'Close month', render: (b) => forecastMonthLabel(b.month, businessSettings?.document_language || 'en-US') },
        { key: 'deals', header: 'Deals', render: (b) => b.deals },
        { key: 'amount', header: 'Pipeline', render: (b) => money(b.amount) },
        { key: 'weighted', header: 'Forecast', render: (b) => money(b.weighted_amount) },
    ];

    return (
        <DashboardPageTemplate
            title="My pipeline"
            description="Your open deals and expected revenue by close month"
            kpis={kpis}
        >
            <Stack gap="region">
                {loading && <Skeleton variant="rect" />}
                {error && <Alert variant="error">{error}</Alert>}
                {!error && !loading && deals.length === 0 && (
                    <EmptyState title="No open deals" description="Deals you own will show up here with a forecast." />
                )}
                {!error && deals.length > 0 && (
                    <>
                        <Card title="Sales forecast">
                            <DataTable
                                data-testid="my-pipeline-forecast"
                                columns={forecastColumns}
                                rows={sortBuckets(data?.forecast ?? [])}
                                rowKey={(b: MyPipelineForecastBucket) => b.month}
                            />
                        </Card>
                        <Card title="Open deals">
                            <DataTable
                                data-testid="my-pipeline-deals"
                                columns={dealColumns}
                                rows={deals}
                                rowKey={(d: MyPipelineDeal) => d.id}
                            />
                        </Card>
                    </>
                )}
            </Stack>
        </DashboardPageTemplate>
    );
};

export default MyPipelinePage;
