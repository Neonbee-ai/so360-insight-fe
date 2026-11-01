import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Factory, AlertCircle, RefreshCw } from 'lucide-react';
import { formatNumber } from '../charts/chartUtils';
import { useShell } from '@so360/shell-context';
import { Button, Grid, KpiCard } from '@so360/design-system';
import {
    manufacturingApi,
    buildManufacturingHeaders,
    MANUFACTURING_UNAVAILABLE_MESSAGE,
    type MfgSummary,
    type WcUtil,
} from '../../services/manufacturingApi';

/**
 * Manufacturing segment for the Insight Dashboard.
 *
 * Fetches live data from manufacturing-be through `manufacturingApi`, which resolves
 * the backend base URL per environment and validates responses before parsing.
 * Renders KPIs (open MOs, on-time %, scrap %, cost variance, output) and a work-centre
 * OEE bar list. No write paths — read-only widgets.
 *
 * Failures degrade to a business-friendly state with a Retry action; technical detail
 * is logged by the API client and never rendered. The 30s poll keeps running, so the
 * metrics reappear on their own once the service recovers.
 *
 * The Manufacturing module currently aggregates its own metrics (insight-be does not
 * yet have a manufacturing segment). When insight-be adds one, this component can
 * be replaced with the standard `SegmentTabContent` flow.
 */

const NO_ORG_MESSAGE = 'Select an organization to view Manufacturing metrics.';

const fmtPct = (n: number) => `${(n ?? 0).toFixed(1)}%`;
const fmtNum = (n: number) => formatNumber(n ?? 0);

export const ManufacturingSegment: React.FC = () => {
    const { currentOrg, accessToken } = useShell();
    const [summary, setSummary] = useState<MfgSummary | null>(null);
    const [util, setUtil] = useState<WcUtil[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [reloadKey, setReloadKey] = useState(0);
    const retry = useCallback(() => setReloadKey((k) => k + 1), []);

    useEffect(() => {
        if (!currentOrg?.id) {
            setLoading(false);
            setError(NO_ORG_MESSAGE);
            return;
        }
        const headers = buildManufacturingHeaders(currentOrg.tenant_id || '', currentOrg.id, accessToken);
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                const [s, u] = await Promise.all([
                    manufacturingApi.getSummary(headers),
                    manufacturingApi.getWorkCenterUtilisation(headers),
                ]);
                if (cancelled) return;
                setSummary(s);
                setUtil(Array.isArray(u) ? u : []);
                // Service recovered — clear the failure state so the poll self-heals.
                setError(null);
            } catch {
                // Detail is already logged by manufacturingApi; the UI only ever
                // shows the business-friendly message.
                if (!cancelled) setError(MANUFACTURING_UNAVAILABLE_MESSAGE);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        const t = setInterval(load, 30_000);
        return () => { cancelled = true; clearInterval(t); };
    }, [currentOrg?.id, currentOrg?.tenant_id, accessToken, reloadKey]);

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 text-success animate-spin" />
            </div>
        );
    }
    // Only take over the panel when there is nothing to show. If a later poll fails
    // while data is already on screen, the tiles stay and a slim banner appears.
    if (error && !summary) {
        const isNoOrg = error === NO_ORG_MESSAGE;
        return (
            <div className="m-8 p-6 bg-surface/50 border border-line rounded-lg flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-warning mt-0.5 shrink-0" />
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-fg mb-1">Manufacturing metrics unavailable</h3>
                    <p className="text-sm text-fg-muted">{error}</p>
                    {!isNoOrg && (
                        <Button variant="secondary" size="sm" onClick={retry}>
                                <RefreshCw className="w-4 h-4" />
                                Retry
                        </Button>
                    )}
                </div>
            </div>
        );
    }
    if (!summary) return null;

    const variance = summary.cost_variance_pct;
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
                    <Factory className="w-5 h-5 text-success" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-fg">Manufacturing</h2>
                    <p className="text-sm text-fg-muted">Production execution KPIs · refreshed every 30s</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-surface/50 border border-line rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-warning shrink-0" />
                    <p className="text-sm text-fg-muted flex-1">
                        Showing the last available figures. {error}
                    </p>
                    <Button variant="secondary" size="sm" onClick={retry}>
                            <RefreshCw className="w-4 h-4" />
                            Retry
                    </Button>
                </div>
            )}

            <Grid columns={4} gap="md">
                <KpiCard label="Open MOs" value={summary.mo_in_progress + summary.mo_planned} hint={`${summary.mo_total} total · ${summary.mo_done} done`} />
                <KpiCard label="In Progress" value={summary.mo_in_progress} hint={`${summary.wo_open} work orders open`} />
                <KpiCard label="On-time %" value={fmtPct(summary.on_time_pct)} hint="MOs delivered by planned end" />
                <KpiCard label="Cost Variance" value={fmtPct(variance)} hint={variance > 0 ? 'Actual over standard' : 'Actual under standard'} />
                <KpiCard label="Total Produced" value={fmtNum(summary.total_produced)} hint="units (life-to-date)" />
                <KpiCard label="Scrap" value={fmtPct(summary.scrap_pct)} hint={`${fmtNum(summary.total_scrap_qty)} units scrapped`} />
                <KpiCard label="MOs Planned" value={summary.mo_planned} hint="awaiting start" />
                <KpiCard label="MOs Completed" value={summary.mo_done} hint="lifetime" />
            </Grid>

            {util.length > 0 && (
                <div className="bg-surface/50 border border-line rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-fg">Work Centre Utilisation (OEE)</h3>
                        <span className="text-xs text-fg-subtle">{util.length} centres</span>
                    </div>
                    <div className="space-y-4">
                        {util.map((wc) => {
                            const onTarget = wc.oee_pct >= wc.target_pct;
                            return (
                                <div key={wc.work_center_id}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div>
                                            <span className="text-sm text-fg">{wc.name}</span>
                                            <span className="text-xs text-fg-subtle ml-2 font-mono">{wc.code}</span>
                                        </div>
                                        <div className="text-sm tabular-nums">
                                            <span className={onTarget ? 'text-success' : 'text-warning'}>
                                                {fmtPct(wc.oee_pct)}
                                            </span>
                                            <span className="text-fg-subtle"> / {wc.target_pct}%</span>
                                            <span className="text-xs text-fg-subtle ml-3">{wc.wos_done}/{wc.wos_total} WO</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                                        <div className={`h-full transition-all ${onTarget ? 'bg-success' : 'bg-warning'}`}
                                             style={{ width: `${Math.min(wc.oee_pct, 100)}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="text-xs text-fg-subtle text-center pt-2">
                Source: Manufacturing module · live polling
            </div>
        </div>
    );
};
