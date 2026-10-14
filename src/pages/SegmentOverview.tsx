import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { insightApi } from '../services/insightApi';
import type { SegmentSummary } from '../types/insight';
import { getInsightIcon } from '../constants/iconMap';
import { useFormatters } from '@so360/formatters';
import { useShell } from '@so360/shell-context';

const CURRENCY_UNITS = new Set(['$', '€', '£', '¥', '₹', 'USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'SGD', 'NZD', 'MXN', 'BRL', 'ZAR', 'OMR', 'KWD', 'BHD', 'QAR', 'EGP', 'NGN', 'KES']);
const isCurrencyUnit = (unit: string) => CURRENCY_UNITS.has(unit?.toUpperCase?.() ?? '');

export const SegmentOverview: React.FC = () => {
    const navigate = useNavigate();
    const [segments, setSegments] = useState<SegmentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { businessSettings } = useShell();
    const formatters = useFormatters({
        currency: businessSettings?.base_currency || 'USD',
        locale: businessSettings?.document_language || 'en-US',
        timezone: businessSettings?.timezone || 'UTC',
    });

    useEffect(() => {
        fetchSegments();
    }, []);

    const fetchSegments = async () => {
        try {
            setLoading(true);
            const data = await insightApi.getSegments();
            setSegments(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load segments');
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-5 h-5 text-success" />;
            case 'down':
                return <TrendingDown className="w-5 h-5 text-danger" />;
            default:
                return <Minus className="w-5 h-5 text-fg-muted" />;
        }
    };

    const getSegmentIcon = (iconName: string) => {
        const IconComponent = getInsightIcon(iconName);
        if (!IconComponent) return null;
        return <IconComponent className="w-8 h-8" />;
    };

    const getColorClass = (colorScheme: { primary: string }) => {
        const colorMap: Record<string, string> = {
            blue: 'border-primary/30 hover:border-primary',
            purple: 'border-purple-500/30 hover:border-purple-500',
            green: 'border-success/30 hover:border-success',
            orange: 'border-orange-500/30 hover:border-orange-500',
            red: 'border-danger/30 hover:border-danger',
        };
        return colorMap[colorScheme.primary] || 'border-line hover:border-line-strong';
    };

    const getIconColorClass = (colorScheme: { primary: string }) => {
        const colorMap: Record<string, string> = {
            blue: 'text-primary',
            purple: 'text-purple-400',
            green: 'text-success',
            orange: 'text-orange-400',
            red: 'text-danger',
        };
        return colorMap[colorScheme.primary] || 'text-fg-muted';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg p-8">
                <div>
                    <div className="animate-pulse">
                        <div className="h-10 bg-surface-raised rounded w-64 mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-48 bg-surface rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg p-8">
                <div>
                    <div className="bg-danger/20 border border-danger/30 rounded-lg p-6 flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-lg font-semibold text-danger mb-2">Failed to Load Segments</h3>
                            <p className="text-sm text-danger">{error}</p>
                            <button
                                onClick={fetchSegments}
                                className="mt-4 px-4 py-2 bg-danger/20 hover:bg-danger/30 text-danger rounded-lg text-sm font-medium transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg p-8">
            <div>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-fg mb-2">Business Intelligence</h1>
                    <p className="text-fg-muted">
                        Monitor key performance indicators across 5 business segments
                    </p>
                </div>

                {/* Segment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {segments.map((segment) => (
                        <button
                            key={segment.segment_code}
                            onClick={() => navigate(`/${segment.segment_code}`)}
                            className={`bg-surface/50 rounded-lg border ${getColorClass(
                                segment.color_scheme
                            )} p-6 text-left transition-all hover:shadow-lg hover:shadow-${
                                segment.color_scheme.primary
                            }-500/10 group`}
                        >
                            {/* Icon & Name */}
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${getIconColorClass(segment.color_scheme)}`}>
                                    {getSegmentIcon(segment.icon_name)}
                                </div>
                                <div className="flex items-center gap-2">
                                    {getTrendIcon(segment.trend)}
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold text-fg mb-2 group-hover:text-fg transition-colors">
                                {segment.segment_name}
                            </h3>
                            <p className="text-sm text-fg-muted mb-4 line-clamp-2">{segment.description}</p>

                            {/* Primary KPI */}
                            {segment.primary_kpi && (
                                <div className="bg-surface-raised/50 rounded-lg p-3 mb-4">
                                    <div className="text-xs text-fg-subtle mb-1">{segment.primary_kpi.kpi_name}</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-fg">
                                            {isCurrencyUnit(segment.primary_kpi.unit)
                                                ? formatters.formatCurrency(segment.primary_kpi.value)
                                                : segment.primary_kpi.value.toFixed(1)}
                                        </span>
                                        {!isCurrencyUnit(segment.primary_kpi.unit) && (
                                            <span className="text-sm text-fg-muted">{segment.primary_kpi.unit}</span>
                                        )}
                                    </div>
                                    {segment.primary_kpi.trend_percentage !== undefined && (
                                        <div
                                            className={`text-xs font-medium mt-1 ${
                                                segment.primary_kpi.trend === 'up'
                                                    ? 'text-success'
                                                    : segment.primary_kpi.trend === 'down'
                                                    ? 'text-danger'
                                                    : 'text-fg-muted'
                                            }`}
                                        >
                                            {segment.primary_kpi.trend === 'up' ? '+' : ''}
                                            {segment.primary_kpi.trend_percentage}% from last period
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center justify-between text-sm">
                                <div>
                                    <span className="text-fg-muted">{segment.kpi_count} KPIs</span>
                                </div>
                                {segment.signal_count > 0 && (
                                    <div className="flex items-center gap-1.5 text-warning">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{segment.signal_count} alerts</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Empty State */}
                {segments.length === 0 && (
                    <div className="text-center py-16">
                        <AlertCircle className="w-16 h-16 text-fg-subtle mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-fg-muted mb-2">No Segments Available</h3>
                        <p className="text-sm text-fg-subtle">Segment data will appear here once configured.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
