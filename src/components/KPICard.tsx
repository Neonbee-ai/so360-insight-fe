import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Pencil, Check, X } from 'lucide-react';
import { SparklineChart } from './charts/SparklineChart';
import type { KPI } from '../types/insight';
import { useFormatters } from '@so360/formatters';
import { useShell, useFeatureFlags, useShellBridge } from '@so360/shell-context';
import { classifyKpiUnit, formatNumber, formatPercentage } from './charts/chartUtils';
import { insightApi } from '../services/insightApi';

interface KPICardProps {
    kpi: KPI;
}

// Pure presentational card (props-only, no context) — memoized so the KPI grid
// does not re-render on unrelated dashboard state changes (e.g. cooldown tick).
const KPICardInner: React.FC<KPICardProps> = ({ kpi }) => {
    const { businessSettings } = useShell();
    const { isFeatureEnabled } = useFeatureFlags();
    const shell = useShellBridge();
    const flagsLoaded = shell?.effectiveFlagsLoaded;
    const canEditTargets = flagsLoaded && (isFeatureEnabled('submodule:insight:targets') ?? true);

    const formatters = useFormatters({
        currency: businessSettings?.base_currency || 'USD',
        locale: businessSettings?.document_language || 'en-US',
        timezone: businessSettings?.timezone || 'UTC',
    });

    // Local optimistic override so the target/variance line updates immediately
    // after a save, without requiring KPICard's callers (AtAGlanceView,
    // SegmentTabContent) to thread a refetch callback through every call site.
    const [targetOverride, setTargetOverride] = useState<{ value: number; variance: number | null } | null>(null);
    const [isEditingTarget, setIsEditingTarget] = useState(false);
    const [targetInput, setTargetInput] = useState('');
    const [savingTarget, setSavingTarget] = useState(false);

    const effectiveTargetValue = targetOverride ? targetOverride.value : kpi.target_value;
    const effectiveVariance = targetOverride ? targetOverride.variance : kpi.target_variance_percentage;

    const formatValueFor = (value: number): string => {
        const kind = classifyKpiUnit(kpi.unit);
        switch (kind) {
            case 'currency':
                return formatters.formatCurrency(value);
            case 'percentage':
                return formatPercentage(value, 1);
            case 'time':
                return `${formatNumber(value, 1)} ${kpi.unit}`;
            default:
                return formatNumber(value);
        }
    };

    const formatValue = (): string => formatValueFor(kpi.value);

    const startEditingTarget = () => {
        setTargetInput(effectiveTargetValue !== undefined ? String(effectiveTargetValue) : '');
        setIsEditingTarget(true);
    };

    const cancelEditingTarget = () => {
        setIsEditingTarget(false);
        setTargetInput('');
    };

    const saveTarget = async () => {
        const parsed = Number(targetInput);
        if (targetInput.trim() === '' || Number.isNaN(parsed)) return;
        setSavingTarget(true);
        try {
            const updated = await insightApi.setTarget(kpi.kpi_code, parsed);
            const variance = updated.target_value === 0
                ? null
                : Math.round(((kpi.value - updated.target_value) / updated.target_value) * 1000) / 10;
            setTargetOverride({ value: updated.target_value, variance });
            setIsEditingTarget(false);
        } catch (err) {
            console.error('Failed to save KPI target:', err);
        } finally {
            setSavingTarget(false);
        }
    };

    const displayUnit = classifyKpiUnit(kpi.unit) === 'count' ? kpi.unit : '';
    const isCounter = kpi.kpi_type === 'counter';

    const getTrendIcon = () => {
        if (kpi.trend === 'up') return <TrendingUp className="w-5 h-5 text-green-500" />;
        if (kpi.trend === 'down') return <TrendingDown className="w-5 h-5 text-red-500" />;
        return <Minus className="w-5 h-5 text-slate-400" />;
    };

    const getTrendColor = () => {
        if (kpi.trend === 'up') return 'text-green-500';
        if (kpi.trend === 'down') return 'text-red-500';
        return 'text-slate-400';
    };

    return (
        <div className="relative bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:bg-slate-900/70 transition-all">
            {!isCounter && canEditTargets && !isEditingTarget && (
                <button
                    type="button"
                    aria-label="Set target"
                    onClick={startEditingTarget}
                    className="absolute top-3 right-3 p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
            )}

            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-sm text-slate-400 mb-1">{kpi.kpi_name}</p>
                    <p className="text-xs text-slate-500">{kpi.category}</p>
                </div>
                {!isCounter && getTrendIcon()}
            </div>

            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-100">{formatValue()}</span>
                {displayUnit && <span className="text-sm text-slate-400">{displayUnit}</span>}
            </div>

            {!isCounter && kpi.trend_percentage !== undefined && (
                <div className={`text-sm ${getTrendColor()}`}>
                    {kpi.trend === 'up' ? '+' : kpi.trend === 'down' ? '-' : ''}
                    {formatNumber(Math.abs(kpi.trend_percentage), 1)}% from last period
                </div>
            )}

            {/* Target / variance line */}
            {!isCounter && effectiveTargetValue !== undefined && !isEditingTarget && (
                <div
                    className={`text-xs mt-1 ${
                        effectiveVariance === null || effectiveVariance === undefined
                            ? 'text-slate-400'
                            : effectiveVariance >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                    }`}
                >
                    Target: {formatValueFor(effectiveTargetValue)}
                    {effectiveVariance !== null && effectiveVariance !== undefined && (
                        <> · {effectiveVariance >= 0 ? '+' : ''}{formatNumber(effectiveVariance, 1)}% vs target</>
                    )}
                </div>
            )}

            {/* Inline target editor */}
            {!isCounter && isEditingTarget && (
                <div className="flex items-center gap-1 mt-1" data-testid="target-editor">
                    <input
                        type="number"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        placeholder="Target value"
                        className="w-24 text-xs bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-100"
                        autoFocus
                    />
                    <button
                        type="button"
                        aria-label="Save target"
                        onClick={saveTarget}
                        disabled={savingTarget}
                        className="p-1 rounded text-green-500 hover:bg-slate-800 disabled:opacity-50"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Cancel"
                        onClick={cancelEditingTarget}
                        disabled={savingTarget}
                        className="p-1 rounded text-slate-500 hover:bg-slate-800 disabled:opacity-50"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* 7-Day Sparkline */}
            {!isCounter && kpi.sparkline_data && kpi.sparkline_data.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Last 7 days</p>
                    <SparklineChart
                        data={kpi.sparkline_data}
                        trend={kpi.trend}
                        height={24}
                    />
                </div>
            )}
        </div>
    );
};

KPICardInner.displayName = 'KPICard';
export const KPICard = React.memo(KPICardInner);
