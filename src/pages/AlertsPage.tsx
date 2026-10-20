import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { EmptyState, ListPageTemplate, SegmentedControl, Select, Stack, toast } from '@so360/design-system';
import { insightApi } from '../services/insightApi';
import { AlertCard } from '../components/AlertCard';
import type { Alert } from '../types/insight';
import { useModules, useFeatureFlags, useShellBridge } from '@so360/shell-context';

const MODULE_CODE_TO_ID: Record<string, string> = {
    'module:crm': 'crm',
    'module:accounting': 'accounting',
    'module:projects': 'projects',
    'module:inventory': 'inventory',
    'module:procurement': 'procurement',
    'module:timesheet': 'timesheet',
    'module:people': 'people',
    'module:flow': 'flow',
    'module:dailystore': 'dailystore',
};

export const AlertsPage: React.FC = () => {
    const { isModuleEnabled } = useModules();
    const { isFeatureEnabled } = useFeatureFlags();
    const shell = useShellBridge();
    const flagsLoaded = shell?.effectiveFlagsLoaded;
    const canAccessAlerts = flagsLoaded && (isFeatureEnabled('submodule:insight:signals') ?? true);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [unresolvedOnly, setUnresolvedOnly] = useState(true);

    useEffect(() => {
        if (canAccessAlerts) {
            loadAlerts();
        }
    }, [severityFilter, unresolvedOnly, canAccessAlerts]);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const response = await insightApi.getAlerts({
                severity: severityFilter !== 'all' ? severityFilter : undefined,
                unresolved_only: unresolvedOnly,
                limit: 50,
            });
            setAlerts(response.data);
        } catch (err) {
            console.error('Failed to load alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            await insightApi.resolveAlert(alertId, 'Resolved from alerts page');
            toast.success('Alert resolved');
            loadAlerts();
        } catch (err) {
            console.error('Failed to resolve alert:', err);
        }
    };

    const visibleAlerts = alerts.filter(alert => {
        if (!alert.module_code) return true;
        const moduleId = MODULE_CODE_TO_ID[alert.module_code];
        return !moduleId || isModuleEnabled(moduleId);
    });

    if (!canAccessAlerts) {
        return (
            <ListPageTemplate trail={[]} title="AI Alerts">
                <EmptyState
                    icon={AlertCircle}
                    title="AI Alerts"
                    description="Intelligent anomaly detection and automated alerts are available on Growth plans and above. Upgrade to Growth to unlock Alerts"
                />
            </ListPageTemplate>
        );
    }

    return (
        <ListPageTemplate trail={[]}
            title="Alerts"
            description="Manage and resolve intelligent alerts"
            views={
                <SegmentedControl
                    name="alert-status"
                    aria-label="Alert status"
                    value={unresolvedOnly ? 'unresolved' : 'all'}
                    onChange={(v) => setUnresolvedOnly(v === 'unresolved')}
                    options={[
                        { value: 'unresolved', label: 'Unresolved' },
                        { value: 'all', label: 'All' },
                    ]}
                />
            }
            toolbarEnd={
                <Select
                    name="severity"
                    aria-label="Severity"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    options={[
                        { value: 'all', label: 'All' },
                        { value: 'critical', label: 'Critical' },
                        { value: 'warning', label: 'Warning' },
                        { value: 'info', label: 'Info' },
                    ]}
                />
            }
        >
            {loading ? (
                <div className="text-center text-fg-muted py-12">Loading alerts...</div>
            ) : visibleAlerts.length > 0 ? (
                <Stack gap="tight">
                    {visibleAlerts.map((alert) => (
                        <AlertCard key={alert.id} alert={alert} onResolve={handleResolveAlert} />
                    ))}
                </Stack>
            ) : (
                <EmptyState
                    icon={AlertCircle}
                    title="No alerts found"
                    description={unresolvedOnly ? 'All alerts have been resolved!' : 'No alerts match the current filters.'}
                />
            )}
        </ListPageTemplate>
    );
};
