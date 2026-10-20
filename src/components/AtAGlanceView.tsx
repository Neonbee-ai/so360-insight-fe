import React, { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { getInsightIcon } from '../constants/iconMap';
import { KPICard } from './KPICard';
import { AlertCard } from './AlertCard';
import { NeuraSummaryCard } from './NeuraSummaryCard';
import { ModuleCoveragePanel } from './ModuleCoveragePanel';
import { toast, Card, Grid, Stack, EmptyState, Skeleton } from '@so360/design-system';
import { insightApi } from '../services/insightApi';
import { manufacturingApi, buildManufacturingHeaders } from '../services/manufacturingApi';
import type { SegmentSummary, KPI, Alert, AiSummarySections, CorrelationPair } from '../types/insight';
import { useModules, useFeatureFlags, useShellBridge, useShell } from '@so360/shell-context';
import { SEGMENT_MODULE_DEPS } from '../constants/moduleMapping';
import { Factory } from 'lucide-react';

// Compact Manufacturing card for At-a-Glance — fetches summary directly from
// manufacturing-be (insight-be doesn't yet aggregate manufacturing metrics).
const ManufacturingAtAGlanceCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const { currentOrg, accessToken } = useShell();
    const [data, setData] = useState<any>(null);
    useEffect(() => {
        if (!currentOrg?.id) return;
        const headers = buildManufacturingHeaders(currentOrg.tenant_id || '', currentOrg.id, accessToken);
        manufacturingApi.getSummary(headers)
            .then(setData)
            // Detail is logged by manufacturingApi; the card just stays in its
            // neutral placeholder state and recovers on the next mount/poll.
            .catch(() => setData(null));
    }, [currentOrg?.id, currentOrg?.tenant_id, accessToken]);
    return (
        <Card
            padding="sm"
            onClick={onClick}
            aria-label="Manufacturing"
            className="border-success/20 hover:border-success/40"
        >
            <Stack gap="tight">
                <Factory className="w-5 h-5 text-success" />
                <h3 className="text-sm font-semibold text-fg">Manufacturing</h3>
                {data ? (
                    <>
                        <div className="text-lg font-bold text-fg">
                            {data.mo_in_progress + data.mo_planned}
                            <span className="text-xs text-fg-muted ml-1">open MOs</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-fg-muted">{data.wo_open} WOs open</span>
                            {data.scrap_pct > 3 && (
                                <span className="text-warning">scrap {data.scrap_pct.toFixed(1)}%</span>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-xs text-fg-subtle">Connecting…</div>
                )}
            </Stack>
        </Card>
    );
};

// All possible AI summary cards with their required modules
// Card appears only if at least one required module is enabled
const ALL_SUMMARY_CARD_CONFIGS = [
    { code: 'finance',   title: 'Financial Overview',  icon: 'DollarSign', color: 'blue'   as const, requiredModules: ['accounting'] },
    { code: 'revenue',   title: 'Revenue Overview',    icon: 'TrendingUp', color: 'green'  as const, requiredModules: ['crm', 'accounting', 'dailystore', 'inbox'] },
    { code: 'execution', title: 'Execution Overview',  icon: 'Briefcase',  color: 'purple' as const, requiredModules: ['projects', 'flow', 'procurement', 'dailystore'] },
    { code: 'delivery',  title: 'Delivery Overview',   icon: 'Package',    color: 'orange' as const, requiredModules: ['inventory', 'procurement', 'dailystore'] },
    { code: 'workforce', title: 'Workforce Overview',  icon: 'Users2',     color: 'blue'   as const, requiredModules: ['people', 'timesheet'] },
];

interface AtAGlanceViewProps {
    segments: SegmentSummary[];
    onSegmentClick: (segmentCode: string) => void;
}

interface NeuraSummary {
    type: string;
    segmentCode: string;
    title: string;
    icon: string;
    color: 'blue' | 'green' | 'purple' | 'orange';
    summary: string | null;
    sections: AiSummarySections | null;
    generatedAt: string | null;
    cached: boolean;
    degraded?: boolean;
    loading: boolean;
    regenerating: boolean;
    error: string | null;
}

export const AtAGlanceView: React.FC<AtAGlanceViewProps> = ({ segments, onSegmentClick }) => {
    const { isModuleEnabled } = useModules();
    const { isFeatureEnabled } = useFeatureFlags();
    const shell = useShellBridge();
    const flagsLoaded = shell?.effectiveFlagsLoaded;
    const canShowAiSummary = flagsLoaded && (isFeatureEnabled('action:insight:ai_summary') ?? true);
    const canRegenerate = flagsLoaded && (isFeatureEnabled('action:insight:ai_summary_regenerate') ?? true);
    const canShowCorrelations = flagsLoaded && (isFeatureEnabled('submodule:insight:analytics') ?? true);
    const stripPrefix = (code: string) => code.replace('module:', '');
    const [topKPIs, setTopKPIs] = useState<KPI[]>([]);
    const [kpiNameMap, setKpiNameMap] = useState<Map<string, string>>(new Map());
    const [criticalAlerts, setCriticalAlerts] = useState<Alert[]>([]);
    const [correlations, setCorrelations] = useState<CorrelationPair[]>([]);
    const [loading, setLoading] = useState(true);

    // Determine which summary cards to show based on enabled modules
    const visibleCardConfigs = useMemo(
        () => ALL_SUMMARY_CARD_CONFIGS.filter(card =>
            card.requiredModules.some(mod => isModuleEnabled(mod))
        ),
        [isModuleEnabled]
    );

    const [neuraSummaries, setNeuraSummaries] = useState<NeuraSummary[]>(() =>
        visibleCardConfigs.map(cfg => ({
            type: cfg.code,
            segmentCode: cfg.code,
            title: cfg.title,
            icon: cfg.icon,
            color: cfg.color,
            summary: null,
            sections: null,
            generatedAt: null,
            cached: false,
            loading: true,
            regenerating: false,
            error: null,
        }))
    );

    // Re-initialize summaries when visible cards change (module toggled)
    useEffect(() => {
        setNeuraSummaries(
            visibleCardConfigs.map(cfg => ({
                type: cfg.code,
                segmentCode: cfg.code,
                title: cfg.title,
                icon: cfg.icon,
                color: cfg.color,
                summary: null,
                sections: null,
                generatedAt: null,
                cached: false,
                loading: true,
                regenerating: false,
                error: null,
            }))
        );
    }, [visibleCardConfigs.map(c => c.code).join(',')]);

    useEffect(() => {
        fetchAtAGlanceData();
        if (canShowAiSummary) {
            fetchNeuraSummaries();
        }
    }, [canShowAiSummary]);

    useEffect(() => {
        if (!canShowCorrelations) return;
        insightApi.getCorrelations()
            .then(setCorrelations)
            .catch((err) => console.error('Failed to fetch correlations:', err));
    }, [canShowCorrelations]);

    const fetchAtAGlanceData = async () => {
        try {
            setLoading(true);

            // Fetch critical alerts
            const alertsResponse = await insightApi.getAlerts({
                severity: 'critical,warning',
                unresolved_only: true,
                limit: 10,
            });
            setCriticalAlerts(
                alertsResponse.data.filter((s: any) => isModuleEnabled(stripPrefix(s.module_code || '')))
            );

            // Only fetch segments whose required modules are enabled
            const enabledSegments = segments.filter(s => {
                const deps = SEGMENT_MODULE_DEPS[s.segment_code];
                if (!deps) return true;
                return deps.some(mod => isModuleEnabled(mod));
            });

            // Fetch full details for enabled segments to get KPIs
            const segmentDetails = await Promise.all(
                enabledSegments.map((s) => insightApi.getSegmentDetail(s.segment_code))
            );

            // Collect KPIs from enabled segments, filtered by enabled module
            const allKPIs = segmentDetails
                .flatMap((segment) => segment.kpis)
                .filter((kpi: any) => isModuleEnabled(stripPrefix(kpi.module_code || '')));

            // Build kpi_code -> kpi_name lookup for the correlations panel (Related
            // Movements), reusing the KPI list already loaded here rather than
            // fetching names separately.
            setKpiNameMap(new Map(allKPIs.map((kpi) => [kpi.kpi_code, kpi.kpi_name])));

            // Filter to important KPIs (critical trends or high priority)
            const importantKPIs = allKPIs
                .filter(
                    (kpi) =>
                        kpi.trend !== 'stable' || // Include trending KPIs
                        kpi.category === 'critical' // Include critical category
                )
                .sort((a, b) => {
                    // Sort by: critical first, then by trend percentage
                    if (a.category === 'critical' && b.category !== 'critical') return -1;
                    if (b.category === 'critical' && a.category !== 'critical') return 1;
                    return Math.abs(b.trend_percentage || 0) - Math.abs(a.trend_percentage || 0);
                })
                .slice(0, 12); // Top 12 most important

            setTopKPIs(importantKPIs.length > 0 ? importantKPIs : allKPIs.slice(0, 12));
        } catch (err) {
            console.error('Failed to fetch at-a-glance data:', err);
            // Fallback to primary KPIs if full fetch fails
            const allPrimaryKPIs = segments
                .map((s) => s.primary_kpi)
                .filter((kpi): kpi is KPI => kpi !== null);
            setTopKPIs(allPrimaryKPIs.slice(0, 12));
        } finally {
            setLoading(false);
        }
    };

    const fetchNeuraSummaries = () => {
        // Fetch each visible summary independently for progressive loading
        visibleCardConfigs.forEach((cfg, index) => {
            fetchSingleNeuraSummary(cfg.code, index);
        });
    };

    const fetchSingleNeuraSummary = async (segmentCode: string, index: number) => {
        try {
            // Fetch from Insight BE via insightApi client (correct baseURL for all environments)
            const data = await insightApi.getAiSummary(segmentCode);

            setNeuraSummaries((prev) => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    summary: data.summary || null,
                    sections: data.sections || null,
                    generatedAt: data.generated_at || null,
                    cached: data.cached ?? false,
                    degraded: data.degraded ?? false,
                    loading: false,
                    error: null,
                };
                return updated;
            });
        } catch (err) {
            console.error(`Failed to fetch AI summary (${segmentCode}):`, err);
            setNeuraSummaries((prev) => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    summary: null,
                    sections: null,
                    generatedAt: null,
                    cached: false,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Failed to load AI insights',
                };
                return updated;
            });
        }
    };

    const retryNeuraSummary = (index: number) => {
        setNeuraSummaries((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], loading: true, error: null };
            return updated;
        });
        fetchSingleNeuraSummary(neuraSummaries[index].segmentCode, index);
    };

    const regenerateNeuraSummary = async (index: number) => {
        const segmentCode = neuraSummaries[index].segmentCode;

        // Mark as regenerating (spinner on button, keep old summary visible)
        setNeuraSummaries((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], regenerating: true, error: null };
            return updated;
        });

        try {
            const data = await insightApi.regenerateAiSummary(segmentCode);

            setNeuraSummaries((prev) => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    summary: data.summary || null,
                    sections: data.sections || null,
                    generatedAt: data.generated_at || null,
                    cached: false,
                    degraded: data.degraded ?? false,
                    regenerating: false,
                    error: null,
                };
                return updated;
            });
        } catch (err) {
            console.error(`Failed to regenerate AI summary (${segmentCode}):`, err);
            setNeuraSummaries((prev) => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    regenerating: false,
                    error: err instanceof Error ? err.message : 'Regeneration failed',
                };
                return updated;
            });
        }
    };

    const getSegmentIcon = (iconName: string) => {
        const IconComponent = getInsightIcon(iconName);
        if (!IconComponent) return null;
        return <IconComponent className="w-8 h-8" />;
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

    const getBorderColorClass = (colorScheme: { primary: string }) => {
        const colorMap: Record<string, string> = {
            blue: 'border-primary/30 hover:border-primary',
            purple: 'border-accent/30 hover:border-accent',
            green: 'border-success/30 hover:border-success',
            orange: 'border-warning/30 hover:border-warning',
            red: 'border-danger/30 hover:border-danger',
        };
        return colorMap[colorScheme.primary] || 'border-line hover:border-line-strong';
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4 text-success" />;
            case 'down':
                return <TrendingDown className="w-4 h-4 text-danger" />;
            default:
                return <Minus className="w-4 h-4 text-fg-muted" />;
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            await insightApi.resolveAlert(alertId);
            toast.success('Alert resolved');
            setCriticalAlerts((prev) => prev.filter((s) => s.id !== alertId));
        } catch (err) {
            console.error('Failed to resolve alert:', err);
        }
    };

    if (loading) {
        return (
            <Stack gap="region">
                <Grid>
                    {Array.from({ length: visibleCardConfigs.length || 4 }, (_, i) => (
                        <Grid.Item key={i} span={6}>
                            <Skeleton variant="rect" className="h-48" />
                        </Grid.Item>
                    ))}
                </Grid>
                <Grid>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Grid.Item key={i} span={4}>
                            <Skeleton variant="rect" className="h-32" />
                        </Grid.Item>
                    ))}
                </Grid>
                <Grid>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Grid.Item key={i} span={3}>
                            <Skeleton variant="rect" className="h-40" />
                        </Grid.Item>
                    ))}
                </Grid>
            </Stack>
        );
    }

    return (
        <Stack gap="region">
            {/* Section 1: AI Executive Summary — hidden until flags resolve */}
            {flagsLoaded !== false && (canShowAiSummary ? (
                <Card title="AI Executive Summary">
                    <Grid>
                        {neuraSummaries.map((summary, index) => {
                            const cfg = visibleCardConfigs[index];
                            const segmentAlerts = cfg
                                ? criticalAlerts.filter(s =>
                                    cfg.requiredModules.some(mod =>
                                        (s.module_code || '').replace('module:', '') === mod
                                    )
                                  ).slice(0, 3)
                                : [];
                            return (
                                <Grid.Item key={summary.type} span={6}>
                                    <NeuraSummaryCard
                                        title={summary.title}
                                        icon={summary.icon}
                                        color={summary.color}
                                        summary={summary.summary}
                                        sections={summary.sections}
                                        signals={segmentAlerts}
                                        generatedAt={summary.generatedAt}
                                        cached={summary.cached}
                                        degraded={summary.degraded}
                                        loading={summary.loading}
                                        regenerating={summary.regenerating}
                                        error={summary.error}
                                        onRetry={() => retryNeuraSummary(index)}
                                        onRegenerate={canRegenerate ? () => regenerateNeuraSummary(index) : undefined}
                                    />
                                </Grid.Item>
                            );
                        })}
                    </Grid>
                </Card>
            ) : (
                <EmptyState
                    title="AI Executive Summary"
                    description="AI-powered executive summaries are available on Growth plans and above. Upgrade to Growth to unlock AI Summaries"
                />
            ))}

            {/* Section 2: Segment Summary Cards */}
            <Card title="Business Segments">
                <Grid>
                    {segments.filter(s => {
                        const deps = SEGMENT_MODULE_DEPS[s.segment_code];
                        if (!deps) return true;
                        return deps.some(mod => isModuleEnabled(mod));
                    }).map((segment) => (
                        <Grid.Item key={segment.segment_code} span={4}>
                            <Card
                                padding="sm"
                                onClick={() => onSegmentClick(segment.segment_code)}
                                aria-label={segment.segment_name}
                                className={getBorderColorClass(segment.color_scheme)}
                            >
                                <Stack gap="tight">
                                    <div className="flex items-start justify-between">
                                        <div className={getIconColorClass(segment.color_scheme)}>
                                            {getSegmentIcon(segment.icon_name)}
                                        </div>
                                        {getTrendIcon(segment.trend)}
                                    </div>
                                    <h3 className="text-sm font-semibold text-fg">{segment.segment_name}</h3>
                                    {segment.primary_kpi && (
                                        <div className="text-lg font-bold text-fg">
                                            {segment.primary_kpi.value.toFixed(1)}
                                            <span className="text-xs text-fg-muted ml-1">
                                                {segment.primary_kpi.unit}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-fg-muted">{segment.kpi_count} KPIs</span>
                                        {segment.signal_count > 0 && (
                                            <span className="text-warning">{segment.signal_count} alerts</span>
                                        )}
                                    </div>
                                </Stack>
                            </Card>
                        </Grid.Item>
                    ))}
                    {/* Manufacturing — composed locally; not yet served by insight-be */}
                    <Grid.Item span={4}>
                        <ManufacturingAtAGlanceCard onClick={() => onSegmentClick('manufacturing')} />
                    </Grid.Item>
                </Grid>
            </Card>

            {/* Section 3: Important KPIs Across All Segments */}
            {topKPIs.length > 0 && (
                <Card title="Important KPIs Across All Segments">
                    <Grid>
                        {topKPIs.map((kpi) => (
                            <Grid.Item key={kpi.kpi_code} span={3}>
                                <KPICard kpi={kpi} />
                            </Grid.Item>
                        ))}
                    </Grid>
                </Card>
            )}

            {/* Section 3b: Related Movements (cross-KPI correlations) — bonus insight, no empty state */}
            {canShowCorrelations && correlations.length > 0 && (
                <Card title="Related Movements">
                    <Stack gap="tight">
                        {correlations.map((pair) => {
                            const nameA = kpiNameMap.get(pair.kpi_code_a) || pair.kpi_code_a;
                            const nameB = kpiNameMap.get(pair.kpi_code_b) || pair.kpi_code_b;
                            const arrow = pair.direction === 'same' ? '↑↑' : '↕';
                            return (
                                <p key={`${pair.kpi_code_a}:${pair.kpi_code_b}`} className="text-sm text-fg-muted">
                                    {nameA} {arrow} moved with {nameB} (r={pair.correlation.toFixed(2)}, {pair.direction})
                                </p>
                            );
                        })}
                    </Stack>
                </Card>
            )}

            {/* Section 4: Critical Alerts */}
            {criticalAlerts.length > 0 ? (
                <Card title={`Critical Alerts (${criticalAlerts.length})`}>
                    <Stack gap="tight" className="max-h-96 overflow-y-auto">
                        {criticalAlerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} onResolve={handleResolveAlert} />
                        ))}
                    </Stack>
                </Card>
            ) : (
                <EmptyState icon={AlertCircle} title="No critical alerts at this time" />
            )}

            {/* Section 5: Module Coverage */}
            <ModuleCoveragePanel />
        </Stack>
    );
};
