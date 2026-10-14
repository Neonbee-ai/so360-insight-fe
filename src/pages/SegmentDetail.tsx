import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2 } from 'lucide-react';
import { insightApi } from '../services/insightApi';
import { TrendChart } from '../components/TrendChart';
import type { SegmentDetail } from '../types/insight';
import { getInsightIcon } from '../constants/iconMap';
import { useFormatters } from '@so360/formatters';
import { useShell } from '@so360/shell-context';
import { parseUtcDate } from '../utils/datetime';

const CURRENCY_UNITS = new Set(['$', '€', '£', '¥', '₹', 'USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'SGD', 'NZD', 'MXN', 'BRL', 'ZAR', 'OMR', 'KWD', 'BHD', 'QAR', 'EGP', 'NGN', 'KES']);
const isCurrencyUnit = (unit: string) => CURRENCY_UNITS.has(unit?.toUpperCase?.() ?? '');

export const SegmentDetailPage: React.FC = () => {
    const { segmentCode } = useParams<{ segmentCode: string }>();
    const navigate = useNavigate();
    const [segment, setSegment] = useState<SegmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { businessSettings } = useShell();
    const formatters = useFormatters({
        currency: businessSettings?.base_currency || 'USD',
        locale: businessSettings?.document_language || 'en-US',
        timezone: businessSettings?.timezone || 'UTC',
    });

    useEffect(() => {
        if (segmentCode) {
            fetchSegmentDetail();
        }
    }, [segmentCode]);

    const fetchSegmentDetail = async () => {
        if (!segmentCode) return;

        try {
            setLoading(true);
            const data = await insightApi.getSegmentDetail(segmentCode);
            setSegment(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load segment details');
        } finally {
            setLoading(false);
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
            purple: 'text-purple-400',
            green: 'text-success',
            orange: 'text-orange-400',
            red: 'text-danger',
        };
        return colorMap[colorScheme.primary] || 'text-fg-muted';
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

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-danger/20 border-danger/30 text-danger';
            case 'warning':
                return 'bg-warning/20 border-warning/30 text-warning';
            default:
                return 'bg-blue-900/20 border-primary/30 text-primary';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-fg-muted">Loading segment details...</p>
                </div>
            </div>
        );
    }

    if (error || !segment) {
        return (
            <div className="min-h-screen bg-bg p-8">
                <div>
                    <button
                        onClick={() => navigate('/')}
                        className="mb-6 flex items-center gap-2 text-fg-muted hover:text-fg-muted transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Overview
                    </button>

                    <div className="bg-danger/20 border border-danger/30 rounded-lg p-6 flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-lg font-semibold text-danger mb-2">Failed to Load Segment</h3>
                            <p className="text-sm text-danger">{error || 'Segment not found'}</p>
                            <button
                                onClick={fetchSegmentDetail}
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
                    <button
                        onClick={() => navigate('/')}
                        className="mb-4 flex items-center gap-2 text-fg-muted hover:text-fg-muted transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Overview
                    </button>

                    <div className="flex items-start gap-6">
                        <div className={`${getIconColorClass(segment.color_scheme)}`}>
                            {getSegmentIcon(segment.icon_name)}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-fg mb-2">{segment.segment_name}</h1>
                            <p className="text-fg-muted max-w-3xl">{segment.description}</p>
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-fg mb-4">Key Performance Indicators</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {segment.kpis.map((kpi) => (
                            <div
                                key={kpi.kpi_code}
                                className="bg-surface/50 rounded-lg border border-line p-6 hover:border-line transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-sm font-medium text-fg-muted">{kpi.kpi_name}</h3>
                                    {getTrendIcon(kpi.trend)}
                                </div>

                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl font-bold text-fg">
                                        {isCurrencyUnit(kpi.unit) ? formatters.formatCurrency(kpi.value) : kpi.value.toFixed(1)}
                                    </span>
                                    {!isCurrencyUnit(kpi.unit) && <span className="text-sm text-fg-muted">{kpi.unit}</span>}
                                </div>

                                {kpi.trend_percentage !== undefined && (
                                    <div
                                        className={`text-sm font-medium ${
                                            kpi.trend === 'up'
                                                ? 'text-success'
                                                : kpi.trend === 'down'
                                                ? 'text-danger'
                                                : 'text-fg-muted'
                                        }`}
                                    >
                                        {kpi.trend === 'up' ? '+' : ''}
                                        {kpi.trend_percentage}%
                                        <span className="text-fg-subtle ml-1">from last period</span>
                                    </div>
                                )}

                                <div className="mt-3 pt-3 border-t border-line">
                                    <div className="text-xs text-fg-subtle">{kpi.category}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {segment.kpis.length === 0 && (
                        <div className="text-center py-12 bg-surface/30 rounded-lg border border-line">
                            <p className="text-fg-subtle">No KPIs available for this segment</p>
                        </div>
                    )}
                </div>

                {/* Trend Charts */}
                {segment.trends && segment.trends.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-fg mb-4">30-Day Trends</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {segment.trends.map((trend) => (
                                <TrendChart
                                    key={trend.kpi_code}
                                    trendData={trend}
                                    color={segment.color_scheme.primary}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Alerts */}
                {segment.signals && segment.signals.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold text-fg mb-4">Active Alerts</h2>
                        <div className="space-y-4">
                            {segment.signals.slice(0, 5).map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`rounded-lg border p-4 ${getSeverityColor(alert.severity)}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold">{alert.title}</h3>
                                        <span className="text-xs uppercase font-medium px-2 py-1 bg-surface/50 rounded">
                                            {alert.severity}
                                        </span>
                                    </div>
                                    <p className="text-sm opacity-90">{alert.description}</p>
                                    <div className="mt-3 flex items-center gap-4 text-xs opacity-75">
                                        <span>{new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(parseUtcDate(alert.created_at))}</span>
                                        {alert.module_code && <span>{alert.module_code}</span>}
                                    </div>
                                </div>
                            ))}

                            {segment.signals.length > 5 && (
                                <button
                                    onClick={() => navigate('/alerts')}
                                    className="w-full py-3 bg-surface-raised/50 hover:bg-surface-raised text-fg-muted rounded-lg transition-colors text-sm font-medium"
                                >
                                    View all {segment.signals.length} alerts →
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {(!segment.signals || segment.signals.length === 0) && (
                    <div className="text-center py-12 bg-surface/30 rounded-lg border border-line">
                        <p className="text-fg-subtle">No active alerts for this segment</p>
                    </div>
                )}
            </div>
        </div>
    );
};
