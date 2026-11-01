import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast, Button, Card, Grid, Stack, EmptyState } from '@so360/design-system';
import { getInsightIcon } from '../constants/iconMap';
import { KPICard } from './KPICard';
import { AlertCard } from './AlertCard';
import { TrendChart } from './TrendChart';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';
import { TimeRangeSelector, TimeRange, getDaysForRange } from './TimeRangeSelector';
import { RevenueCharts } from './segments/RevenueCharts';
import { ExecutionCharts } from './segments/ExecutionCharts';
import { DeliveryCharts } from './segments/DeliveryCharts';
import { WorkforceCharts } from './segments/WorkforceCharts';
import { FinanceCharts } from './segments/FinanceCharts';
import { NeuraSummaryCard } from './NeuraSummaryCard';
import { insightApi } from '../services/insightApi';
import { useModules, useFeatureFlags, useShellBridge } from '@so360/shell-context';
import type { SegmentDetail, AiSummarySections } from '../types/insight';

// Modules that must have at least one enabled for the AI summary to be shown/fetched
const SEGMENT_MODULE_DEPS: Record<string, string[]> = {
    finance:   ['accounting'],
    revenue:   ['crm', 'accounting', 'dailystore'],
    execution: ['projects', 'flow', 'procurement'],
    delivery:  ['inventory', 'procurement', 'dailystore'],
    workforce: ['people', 'timesheet'],
};

interface SegmentTabContentProps {
    segmentCode: string;
}

const SEGMENT_CHART_TYPES: Record<string, string[]> = {
    finance: ['cash_flow_waterfall', 'burn_rate_projection', 'expense_variance'],
    revenue: ['revenue_trend', 'conversion_funnel', 'aging_buckets'],
    execution: ['task_completion', 'pr_cycle_time', 'workflow_status'],
    delivery: ['delivery_rate', 'inventory_turnover', 'backorder_analysis'],
    workforce: ['utilization_trend', 'overtime_distribution', 'compliance_gauge'],
};

export const SegmentTabContent: React.FC<SegmentTabContentProps> = ({ segmentCode }) => {
    const { isModuleEnabled } = useModules();
    const { isFeatureEnabled } = useFeatureFlags();
    const shell = useShellBridge();
    const flagsLoaded = shell?.effectiveFlagsLoaded;
    const canShowAiSummaryFeature = flagsLoaded && (isFeatureEnabled('action:insight:ai_summary') ?? true);
    const canRegenerate = flagsLoaded && (isFeatureEnabled('action:insight:ai_summary_regenerate') ?? true);
    const [segment, setSegment] = useState<SegmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [loadingTrends, setLoadingTrends] = useState(false);
    const [neuraLoading, setNeuraLoading] = useState(true);
    const [neuraSummary, setNeuraSummary] = useState<string | null>(null);
    const [neuraSections, setNeuraSections] = useState<AiSummarySections | null>(null);
    const [neuraGeneratedAt, setNeuraGeneratedAt] = useState<string | null>(null);
    const [neuraCached, setNeuraCached] = useState(false);
    const [neuraDegraded, setNeuraDegraded] = useState(false);
    const [neuraRegenerating, setNeuraRegenerating] = useState(false);
    const [neuraError, setNeuraError] = useState<string | null>(null);

    // AI summary requires both: feature flag enabled AND at least one required module enabled
    const summaryModules = SEGMENT_MODULE_DEPS[segmentCode] ?? [];
    const hasRequiredModules = summaryModules.length === 0 || summaryModules.some(m => isModuleEnabled(m));
    const canShowAiSummary = canShowAiSummaryFeature && hasRequiredModules;

    const trendsCustomRef = useRef(false);
    const cancelPollRef = useRef<(() => void) | null>(null);

    useEffect(() => () => { cancelPollRef.current?.(); }, [segmentCode]);

    useEffect(() => {
        trendsCustomRef.current = false;
        fetchSegmentDetail();
        // Warm the chart endpoints in parallel with the detail call (cachedGet shares in-flight
        // requests) so charts do not wait behind the segment detail round trip.
        (SEGMENT_CHART_TYPES[segmentCode] ?? []).forEach((t) => {
            insightApi.getChartData(segmentCode, t).catch(() => undefined);
        });
        if (canShowAiSummary) {
            fetchNeuraInsight();
        } else {
            setNeuraLoading(false);
        }
    }, [segmentCode, canShowAiSummary]);

    useEffect(() => {
        // The segment detail already carries 30d trends; refetching one call per KPI on mount is a
        // duplicate N+1. Only refetch once the user picks a different range.
        if (timeRange !== '30d') trendsCustomRef.current = true;
        if (segment && (timeRange !== '30d' || trendsCustomRef.current)) {
            fetchTrendsForRange();
        }
    }, [timeRange, segment?.segment_code]);

    const fetchNeuraInsight = async () => {
        try {
            setNeuraLoading(true);
            setNeuraError(null);
            const data = await insightApi.getAiSummary(segmentCode);
            setNeuraSummary(data.summary || null);
            setNeuraSections(data.sections || null);
            setNeuraGeneratedAt(data.generated_at || null);
            setNeuraCached(data.cached ?? false);
            setNeuraDegraded(data.degraded ?? false);
            if (data.generating) {
                cancelPollRef.current?.();
                cancelPollRef.current = insightApi.pollAiSummary(segmentCode, (d) => {
                    setNeuraSummary(d.summary || null);
                    setNeuraSections(d.sections || null);
                    setNeuraGeneratedAt(d.generated_at || null);
                    setNeuraCached(d.cached ?? false);
                    setNeuraDegraded(d.degraded ?? false);
                });
            }
        } catch (err) {
            setNeuraError(err instanceof Error ? err.message : 'Failed to load AI insights');
        } finally {
            setNeuraLoading(false);
        }
    };

    const handleNeuraRegenerate = async () => {
        try {
            setNeuraRegenerating(true);
            setNeuraError(null);
            const data = await insightApi.regenerateAiSummary(segmentCode);
            setNeuraSummary(data.summary || null);
            setNeuraSections(data.sections || null);
            setNeuraGeneratedAt(data.generated_at || null);
            setNeuraCached(false);
            setNeuraDegraded(data.degraded ?? false);
        } catch (err) {
            setNeuraError(err instanceof Error ? err.message : 'Regeneration failed');
        } finally {
            setNeuraRegenerating(false);
        }
    };

    const fetchSegmentDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await insightApi.getSegmentDetail(segmentCode);
            setSegment(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load segment details');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendsForRange = async () => {
        if (!segment) return;

        try {
            setLoadingTrends(true);
            const days = getDaysForRange(timeRange);

            // Fetch trends for each KPI with the selected time range
            const trendPromises = segment.kpis.map((kpi) =>
                insightApi.getKPITrend(kpi.kpi_code, days)
            );

            const trends = await Promise.all(trendPromises);

            // Update segment with new trends
            setSegment({
                ...segment,
                trends: trends.filter((t) => t !== null),
            });
        } catch (err) {
            console.error('Failed to fetch trends:', err);
        } finally {
            setLoadingTrends(false);
        }
    };

    const getSegmentIcon = (iconName: string) => {
        const IconComponent = getInsightIcon(iconName);
        if (!IconComponent) return null;
        return <IconComponent className="w-10 h-10" />;
    };

    const getIconColorClass = (colorScheme: { primary: string }) => {
        const colorMap: Record<string, string> = {
            blue: 'text-primary',
            purple: 'text-accent',
            green: 'text-success',
            orange: 'text-warning',
            red: 'text-danger',
        };
        return colorMap[colorScheme.primary] || 'text-fg-muted';
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            await insightApi.resolveAlert(alertId);
            toast.success('Alert resolved');
            if (segment) {
                setSegment({
                    ...segment,
                    signals: segment.signals.filter((s) => s.id !== alertId),
                });
            }
        } catch (err) {
            console.error('Failed to resolve alert:', err);
        }
    };

    const renderSegmentCharts = () => {
        if (!segment) return null;

        const chartComponents: Record<string, React.ComponentType<any>> = {
            revenue: RevenueCharts,
            execution: ExecutionCharts,
            delivery: DeliveryCharts,
            workforce: WorkforceCharts,
            finance: FinanceCharts,
        };

        const ChartComponent = chartComponents[segmentCode];

        if (!ChartComponent) {
            return null;
        }

        // Pass dummy tenant/org IDs - charts will use global context from insightApi
        return <ChartComponent tenantId="" orgId="" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-fg-muted">Loading segment details...</p>
                </div>
            </div>
        );
    }

    if (error || !segment) {
        return (
            <div className="bg-danger/20 border border-danger/30 rounded-lg p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-lg font-semibold text-danger mb-2">Failed to Load Segment</h3>
                    <p className="text-sm text-danger">{error || 'Segment not found'}</p>
                    <Button variant="secondary" size="sm" className="mt-4" onClick={fetchSegmentDetail}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    const unresolvedAlerts = segment.signals.filter((s) => !s.resolved_at);

    return (
        <Stack gap="region">
            {/* Section 1: Segment Header (page title is owned by the page template) */}
            <Card
                title={segment.segment_name}
                actions={<DataFreshnessIndicator />}
            >
                <div className="flex items-start gap-4">
                    <div className={getIconColorClass(segment.color_scheme)}>
                        {getSegmentIcon(segment.icon_name)}
                    </div>
                    <div className="flex-1 min-w-0 break-words">
                        <p className="text-fg-muted max-w-3xl">{segment.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="text-fg-subtle">{segment.kpis.length} KPIs</span>
                            <span className="text-fg-subtle">•</span>
                            <span className="text-fg-subtle">{unresolvedAlerts.length} Active Alerts</span>
                        </div>
                    </div>
                </div>
            </Card>
            {/* Section 1.5: Neura AI Insights — only shown when at least one required module is enabled */}
            {canShowAiSummary && (() => {
                const segmentColors: Record<string, 'blue' | 'green' | 'purple' | 'orange'> = {
                    revenue: 'green',
                    execution: 'purple',
                    delivery: 'orange',
                    workforce: 'blue',
                    finance: 'blue',
                };
                const unresolvedForCard = segment.signals.filter((s) => !s.resolved_at).slice(0, 3);
                return (
                    <NeuraSummaryCard
                        title={`${segment.segment_name} AI Insights`}
                        icon="Sparkles"
                        color={segmentColors[segmentCode] ?? 'blue'}
                        summary={neuraSummary}
                        sections={neuraSections}
                        signals={unresolvedForCard}
                        generatedAt={neuraGeneratedAt}
                        cached={neuraCached}
                        degraded={neuraDegraded}
                        loading={neuraLoading}
                        regenerating={neuraRegenerating}
                        error={neuraError}
                        onRetry={fetchNeuraInsight}
                        onRegenerate={canRegenerate ? handleNeuraRegenerate : undefined}
                    />
                );
            })()}

            {/* Section 2: KPIs Grid */}
            {segment.kpis.length > 0 && (
                <Card title="Key performance indicators">
                    <Grid>
                        {segment.kpis.map((kpi) => (
                            <Grid.Item key={kpi.kpi_code} span={4}>
                                <KPICard kpi={kpi} />
                            </Grid.Item>
                        ))}
                    </Grid>
                </Card>
            )}

            {/* Section 2.5: Rich Chart Gallery */}
            {(() => {
                const charts = renderSegmentCharts();
                return charts ? (
                    <Card title="Analytics dashboard">{charts}</Card>
                ) : null;
            })()}

            {/* Section 3: Trend Charts with Time Range Selector */}
            {segment.trends && segment.trends.length > 0 && (
                <Card
                    title="Historical Trends"
                    actions={<TimeRangeSelector selected={timeRange} onChange={setTimeRange} />}
                >
                    {loadingTrends ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : (
                        <Grid>
                            {segment.trends.map((trend) => (
                                <Grid.Item key={trend.kpi_code} span={4}>
                                    <TrendChart
                                        trendData={trend}
                                        color={segment.color_scheme.primary}
                                    />
                                </Grid.Item>
                            ))}
                        </Grid>
                    )}
                </Card>
            )}

            {/* Section 4: Active Alerts */}
            {unresolvedAlerts.length > 0 && (
                <Card title={`Active Alerts (${unresolvedAlerts.length})`}>
                    <Stack gap="tight">
                        {unresolvedAlerts.slice(0, 10).map((alert) => (
                            <AlertCard key={alert.id} alert={alert} onResolve={handleResolveAlert} />
                        ))}
                        {unresolvedAlerts.length > 10 && (
                            <p className="text-sm text-fg-muted text-center">
                                Showing first 10 of {unresolvedAlerts.length} alerts
                            </p>
                        )}
                    </Stack>
                </Card>
            )}

            {/* Empty States */}
            {segment.kpis.length === 0 && (
                <EmptyState title="No KPIs available for this segment" />
            )}

            {unresolvedAlerts.length === 0 && segment.kpis.length > 0 && (
                <EmptyState icon={AlertCircle} title="No active alerts for this segment" />
            )}
        </Stack>
    );
};
