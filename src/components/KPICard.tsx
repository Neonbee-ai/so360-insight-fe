import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Pencil, Check, X } from 'lucide-react';
import { SparklineChart } from './charts/SparklineChart';
import type { KPI } from '../types/insight';
import { useFormatters } from '@so360/formatters';
import { useShell, useFeatureFlags, useShellBridge } from '@so360/shell-context';
import { classifyKpiUnit, formatNumber, formatPercentage } from './charts/chartUtils';
import { insightApi } from '../services/insightApi';
import { IconButton, KpiCard, TextField } from '@so360/design-system';

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
        if (kpi.trend === 'up') return <TrendingUp className="w-5 h-5 text-success" />;
        if (kpi.trend === 'down') return <TrendingDown className="w-5 h-5 text-danger" />;
        return <Minus className="w-5 h-5 text-fg-muted" />;
    };

    const getTrendColor = () => {
        if (kpi.trend === 'up') return 'text-success';
        if (kpi.trend === 'down') return 'text-danger';
        return 'text-fg-muted';
    };

    const targetLine = !isCounter && effectiveTargetValue !== undefined && !isEditingTarget ? (
        <div
            className={`text-xs mt-1 ${
                effectiveVariance === null || effectiveVariance === undefined
                    ? 'text-fg-muted'
                    : effectiveVariance >= 0
                        ? 'text-success'
                        : 'text-danger'
            }`}
        >
            Target: {formatValueFor(effectiveTargetValue)}
            {effectiveVariance !== null && effectiveVariance !== undefined && (
                <> · {effectiveVariance >= 0 ? '+' : ''}{formatNumber(effectiveVariance, 1)}% vs target</>
            )}
        </div>
    ) : null;

    const hint = (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <span className="text-fg-subtle">
                    {kpi.category}
                    {displayUnit && <span className="ml-2 text-fg-muted">{displayUnit}</span>}
                </span>
                {!isCounter && getTrendIcon()}
            </div>

            {!isCounter && kpi.trend_percentage !== undefined && (
                <div className={`text-sm ${getTrendColor()}`}>
                    {kpi.trend === 'up' ? '+' : kpi.trend === 'down' ? '-' : ''}
                    {formatNumber(Math.abs(kpi.trend_percentage), 1)}% from last period
                </div>
            )}

            {targetLine}

            {/* Inline target editor */}
            {!isCounter && isEditingTarget && (
                <div className="flex items-center gap-1 mt-1" data-testid="target-editor">
                    <TextField
                        name="kpi-target"
                        type="number"
                        size="sm"
                        aria-label="Target value"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        placeholder="Target value"
                        className="w-24"
                        autoFocus
                    />
                    <IconButton
                        label="Save target"
                        size="sm"
                        onClick={saveTarget}
                        disabled={savingTarget}
                        icon={<Check className="w-3.5 h-3.5 text-success" />}
                    />
                    <IconButton
                        label="Cancel"
                        size="sm"
                        onClick={cancelEditingTarget}
                        disabled={savingTarget}
                        icon={<X className="w-3.5 h-3.5" />}
                    />
                </div>
            )}

            {/* 7-Day Sparkline */}
            {!isCounter && kpi.sparkline_data && kpi.sparkline_data.length > 0 && (
                <div className="mt-2 pt-2 border-t border-line">
                    <p className="text-xs text-fg-subtle mb-1">Last 7 days</p>
                    <SparklineChart
                        data={kpi.sparkline_data}
                        trend={kpi.trend}
                        height={24}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div className="relative h-full">
            <KpiCard
                name={kpi.kpi_code}
                label={kpi.kpi_name}
                value={formatValue()}
                hint={hint}
                className="h-full pr-10"
            />
            {!isCounter && canEditTargets && !isEditingTarget && (
                <IconButton
                    label="Set target"
                    size="sm"
                    className="absolute top-3 right-3"
                    onClick={startEditingTarget}
                    icon={<Pencil className="w-3.5 h-3.5" />}
                />
            )}
        </div>
    );
};

KPICardInner.displayName = 'KPICard';
export const KPICard = React.memo(KPICardInner);
