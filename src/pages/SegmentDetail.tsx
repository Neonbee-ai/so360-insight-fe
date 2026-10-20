import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Card, DetailPageTemplate, EmptyState, Grid, Stack, Cluster } from '@so360/design-system';
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
            purple: 'text-accent',
            green: 'text-success',
            orange: 'text-warning',
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
                return 'bg-primary/20 border-primary/30 text-primary';
        }
    };

    const trail = [{ label: 'Overview', onClick: () => navigate('/') }];

    if (loading) {
        return (
            <DetailPageTemplate trail={trail} title="Segment" loading>
                <div className="flex flex-col items-center gap-4 py-12">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-fg-muted">Loading segment details...</p>
                </div>
            </DetailPageTemplate>
        );
    }

    if (error || !segment) {
        return (
            <DetailPageTemplate trail={trail} title="Segment">
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
            </DetailPageTemplate>
        );
    }

    return (
        <DetailPageTemplate
            trail={trail}
            title={segment.segment_name}
            meta={
                <Cluster gap="tight">
                    <span className={getIconColorClass(segment.color_scheme)}>{getSegmentIcon(segment.icon_name)}</span>
                    <span className="text-fg-muted">{segment.description}</span>
                </Cluster>
            }
        >
            <Stack gap="region">
                <Card title="Key Performance Indicators">
                    {segment.kpis.length === 0 ? (
                        <EmptyState title="No KPIs available for this segment" />
                    ) : (
                        <Grid>
                            {segment.kpis.map((kpi) => (
                                <Grid.Item key={kpi.kpi_code} span={4}>
                                    <Card padding="sm">
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
                                    </Card>
                                </Grid.Item>
                            ))}
                        </Grid>
                    )}
                </Card>

                {segment.trends && segment.trends.length > 0 && (
                    <Card title="30-Day Trends">
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
                    </Card>
                )}

                {segment.signals && segment.signals.length > 0 ? (
                    <Card title="Active Alerts">
                        <Stack gap="tight">
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
                                <Button variant="secondary" onClick={() => navigate('/alerts')}>
                                    View all {segment.signals.length} alerts →
                                </Button>
                            )}
                        </Stack>
                    </Card>
                ) : (
                    <EmptyState title="No active alerts for this segment" />
                )}
            </Stack>
        </DetailPageTemplate>
    );
};
