import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast, Card, DashboardPageTemplate, EmptyState, Grid, KpiCard, Stack } from '@so360/design-system';
import { insightApi } from '../services/insightApi';
import { KPICard } from '../components/KPICard';
import { AlertCard } from '../components/AlertCard';
import type { Dashboard as DashboardType, Alert } from '../types/insight';
import { useFormatters } from '@so360/formatters';
import { useShell } from '@so360/shell-context';

export const Dashboard: React.FC = () => {
    const [dashboard, setDashboard] = useState<DashboardType | null>(null);
    const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { businessSettings } = useShell();
    const formatters = useFormatters({
        currency: businessSettings?.base_currency || 'USD',
        locale: businessSettings?.document_language || 'en-US',
        timezone: businessSettings?.timezone || 'UTC',
    });

    useEffect(() => {
        loadDashboard();
        loadRecentAlerts();

        // Auto-refresh every 5 minutes so stale KPI data is updated without user interaction
        const pollInterval = setInterval(() => {
            loadDashboard();
            loadRecentAlerts();
        }, 5 * 60 * 1000);

        return () => clearInterval(pollInterval);
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const data = await insightApi.getDashboard();
            setDashboard(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load dashboard:', err);
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const loadRecentAlerts = async () => {
        try {
            const response = await insightApi.getAlerts({ unresolved_only: true, limit: 5 });
            setRecentAlerts(response.data);
        } catch (err) {
            console.error('Failed to load alerts:', err);
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            await insightApi.resolveAlert(alertId, 'Resolved from dashboard');
            toast.success('Alert resolved');
            loadRecentAlerts();
            loadDashboard();
        } catch (err) {
            console.error('Failed to resolve alert:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-fg-muted">Loading insights...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-danger">Error: {error}</div>
            </div>
        );
    }

    const summary = dashboard?.signals_summary;
    const kpiTiles = summary
        ? [
              <KpiCard key="total" label="Total Alerts" value={summary.total} icon={AlertCircle} />,
              <KpiCard key="critical" label="Critical" value={summary.critical} icon={AlertCircle} />,
              <KpiCard key="warning" label="Warning" value={summary.warning} icon={AlertCircle} />,
              <KpiCard key="info" label="Info" value={summary.info} icon={AlertCircle} />,
          ]
        : undefined;

    return (
        <DashboardPageTemplate
            title="Insight Dashboard"
            description="Real-time KPIs and intelligent alerts across all modules"
            meta={<span>Last updated: {dashboard ? formatters.formatDateTime(dashboard.computed_at) : 'N/A'}</span>}
            kpis={kpiTiles}
        >
            <Stack gap="region">
                <Card title="Key Performance Indicators">
                    <Grid>
                        {dashboard?.kpis.map((kpi) => (
                            <Grid.Item key={kpi.kpi_code} span={4}>
                                <KPICard kpi={kpi} />
                            </Grid.Item>
                        ))}
                    </Grid>
                </Card>

                <Card title="Active Alerts">
                    {recentAlerts.length > 0 ? (
                        <Stack gap="tight">
                            {recentAlerts.map((alert) => (
                                <AlertCard key={alert.id} alert={alert} onResolve={handleResolveAlert} />
                            ))}
                        </Stack>
                    ) : (
                        <EmptyState title="No active alerts. Everything looks good!" />
                    )}
                </Card>
            </Stack>
        </DashboardPageTemplate>
    );
};
