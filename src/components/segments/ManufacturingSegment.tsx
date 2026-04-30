import React, { useEffect, useState } from 'react';
import { Loader2, Factory, AlertCircle } from 'lucide-react';

/**
 * Manufacturing segment for the Insight Dashboard.
 *
 * Fetches live data from manufacturing-be (port 3034) via the Shell `/manufacturing-api`
 * proxy. Renders KPIs (open MOs, on-time %, scrap %, cost variance, output) and a
 * work-centre OEE bar list. No write paths — read-only widgets.
 *
 * The Manufacturing module currently aggregates its own metrics (insight-be does not
 * yet have a manufacturing segment). When insight-be adds one, this component can
 * be replaced with the standard `SegmentTabContent` flow.
 */

const TENANT = '3cf1c619-c8f6-49ac-9207-447418d5beee';
const ORG = '8317fe18-6ac4-4ac4-b71d-dc13122a905d';

interface MfgSummary {
    mo_total: number;
    mo_in_progress: number;
    mo_done: number;
    mo_planned: number;
    wo_open: number;
    on_time_pct: number;
    scrap_pct: number;
    cost_variance_pct: number;
    total_produced: number;
    total_scrap_qty: number;
}
interface WcUtil {
    work_center_id: string;
    code: string;
    name: string;
    wos_total: number;
    wos_done: number;
    oee_pct: number;
    target_pct: number;
}

const headers = { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT, 'X-Org-Id': ORG };

const fmtPct = (n: number) => `${(n ?? 0).toFixed(1)}%`;
const fmtNum = (n: number) => (n ?? 0).toLocaleString();

const Tile: React.FC<{ label: string; value: React.ReactNode; sub?: string; tone?: 'default' | 'pos' | 'neg' }> =
    ({ label, value, sub, tone = 'default' }) => {
        const colour = tone === 'pos' ? 'text-emerald-300' : tone === 'neg' ? 'text-rose-300' : 'text-slate-100';
        return (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:bg-slate-900/70 transition-all">
                <p className="text-sm text-slate-400 mb-3">{label}</p>
                <div className={`text-3xl font-bold ${colour}`}>{value}</div>
                {sub && <div className="text-xs text-slate-500 mt-2">{sub}</div>}
            </div>
        );
    };

export const ManufacturingSegment: React.FC = () => {
    const [summary, setSummary] = useState<MfgSummary | null>(null);
    const [util, setUtil] = useState<WcUtil[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true); setError(null);
                const [sumRes, utilRes] = await Promise.all([
                    fetch('/manufacturing-api/v1/manufacturing/reports/summary', { headers }),
                    fetch('/manufacturing-api/v1/manufacturing/reports/work-center-utilisation', { headers }),
                ]);
                if (!sumRes.ok) throw new Error(`Summary HTTP ${sumRes.status}`);
                if (!utilRes.ok) throw new Error(`WC util HTTP ${utilRes.status}`);
                const [s, u] = await Promise.all([sumRes.json(), utilRes.json()]);
                if (cancelled) return;
                setSummary(s);
                setUtil(u);
            } catch (e: any) {
                if (!cancelled) setError(e.message || 'Failed to load Manufacturing metrics');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        const t = setInterval(load, 30_000);
        return () => { cancelled = true; clearInterval(t); };
    }, []);

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
        );
    }
    if (error) {
        return (
            <div className="m-8 p-6 bg-rose-900/20 border border-rose-500/30 rounded-lg flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-rose-400 mt-0.5" />
                <div>
                    <h3 className="text-lg font-semibold text-rose-400 mb-1">Manufacturing metrics unavailable</h3>
                    <p className="text-sm text-rose-300">{error}</p>
                    <p className="text-xs text-rose-300/60 mt-2">
                        Ensure the Manufacturing backend is running on port 3034.
                    </p>
                </div>
            </div>
        );
    }
    if (!summary) return null;

    const variance = summary.cost_variance_pct;
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Factory className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-100">Manufacturing</h2>
                    <p className="text-sm text-slate-400">Production execution KPIs · refreshed every 30s</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Tile label="Open MOs" value={summary.mo_in_progress + summary.mo_planned} sub={`${summary.mo_total} total · ${summary.mo_done} done`} />
                <Tile label="In Progress" value={summary.mo_in_progress} tone="pos" sub={`${summary.wo_open} work orders open`} />
                <Tile label="On-time %" value={fmtPct(summary.on_time_pct)} tone={summary.on_time_pct >= 90 ? 'pos' : 'neg'} sub="MOs delivered by planned end" />
                <Tile label="Cost Variance" value={fmtPct(variance)} tone={variance > 5 ? 'neg' : variance < -5 ? 'pos' : 'default'} sub={variance > 0 ? 'Actual over standard' : 'Actual under standard'} />
                <Tile label="Total Produced" value={fmtNum(summary.total_produced)} sub="units (life-to-date)" />
                <Tile label="Scrap" value={fmtPct(summary.scrap_pct)} tone={summary.scrap_pct > 3 ? 'neg' : 'default'} sub={`${fmtNum(summary.total_scrap_qty)} units scrapped`} />
                <Tile label="MOs Planned" value={summary.mo_planned} sub="awaiting start" />
                <Tile label="MOs Completed" value={summary.mo_done} tone="pos" sub="lifetime" />
            </div>

            {util.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-slate-100">Work Centre Utilisation (OEE)</h3>
                        <span className="text-xs text-slate-500">{util.length} centres</span>
                    </div>
                    <div className="space-y-4">
                        {util.map((wc) => {
                            const onTarget = wc.oee_pct >= wc.target_pct;
                            return (
                                <div key={wc.work_center_id}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div>
                                            <span className="text-sm text-slate-200">{wc.name}</span>
                                            <span className="text-xs text-slate-500 ml-2 font-mono">{wc.code}</span>
                                        </div>
                                        <div className="text-sm tabular-nums">
                                            <span className={onTarget ? 'text-emerald-300' : 'text-amber-300'}>
                                                {fmtPct(wc.oee_pct)}
                                            </span>
                                            <span className="text-slate-500"> / {wc.target_pct}%</span>
                                            <span className="text-xs text-slate-500 ml-3">{wc.wos_done}/{wc.wos_total} WO</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all ${onTarget ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                             style={{ width: `${Math.min(wc.oee_pct, 100)}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="text-xs text-slate-500 text-center pt-2">
                Source: <code className="text-slate-400">manufacturing-be</code> on port 3034 · live polling
            </div>
        </div>
    );
};
