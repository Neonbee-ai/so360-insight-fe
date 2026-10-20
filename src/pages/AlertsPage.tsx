import React, { useEffect, useState } from 'react';
import { AlertCircle, Filter } from 'lucide-react';
import { SegmentedControl, Select, toast } from '@so360/design-system';
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
            <div className="min-h-screen bg-bg p-6">
                <div className="max-w-2xl mx-auto mt-16 text-center">
                    <AlertCircle className="w-16 h-16 text-fg-subtle mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-fg mb-2">AI Alerts</h2>
                    <p className="text-fg-muted mb-6">
                        Intelligent anomaly detection and automated alerts are available on Growth plans and above.
                    </p>
                    <div className="inline-block px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary text-sm font-medium">
                        Upgrade to Growth to unlock Alerts
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg p-6">
            <div>
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-8 h-8 text-warning" />
                        <h1 className="text-3xl font-bold text-fg">Alerts</h1>
                    </div>
                    <p className="text-fg-muted">Manage and resolve intelligent alerts</p>
                </div>

                {/* Filters */}
                <div className="bg-surface/50 border border-line rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-fg-muted" />
                        <span className="text-sm text-fg-muted">Filters</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Select
                            name="severity"
                            label="Severity"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'critical', label: 'Critical' },
                                { value: 'warning', label: 'Warning' },
                                { value: 'info', label: 'Info' },
                            ]}
                        />
                        <div>
                            <span className="text-sm text-fg-muted block mb-2">Status</span>
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
                        </div>
                    </div>
                </div>

                {/* Alerts List */}
                {loading ? (
                    <div className="text-center text-fg-muted py-12">Loading alerts...</div>
                ) : visibleAlerts.length > 0 ? (
                    <div className="space-y-4">
                        {visibleAlerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} onResolve={handleResolveAlert} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-surface/50 border border-line rounded-lg p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-fg-subtle mx-auto mb-4" />
                        <p className="text-fg-muted text-lg mb-2">No alerts found</p>
                        <p className="text-fg-subtle text-sm">
                            {unresolvedOnly ? 'All alerts have been resolved!' : 'No alerts match the current filters.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
