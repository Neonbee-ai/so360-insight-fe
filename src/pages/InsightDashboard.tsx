import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button, DashboardPageTemplate, Cluster, EmptyState } from '@so360/design-system';
import { TabNavigation, type Tab } from '../components/TabNavigation';
import { AtAGlanceView } from '../components/AtAGlanceView';
import { SegmentTabContent } from '../components/SegmentTabContent';
import { ManufacturingSegment } from '../components/segments/ManufacturingSegment';
import { DataFreshnessIndicator } from '../components/DataFreshnessIndicator';
import { insightApi } from '../services/insightApi';
import type { SegmentSummary } from '../types/insight';
import { useModules, useFeatureFlags, useShellBridge } from '@so360/shell-context';
import { SEGMENT_MODULE_DEPS } from '../constants/moduleMapping';

interface InsightDashboardProps {
    initialTab?: string;
}

const formatCooldown = (s: number) =>
    Math.floor(s / 60) > 0 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

/**
 * Isolated refresh button + cooldown countdown.
 *
 * The per-second countdown state lives entirely inside this tiny component, so
 * the 1Hz `setCooldownSeconds(prev - 1)` tick re-renders ONLY this button — not
 * the whole dashboard tree (KPIs, charts, segment cards). Behavior is identical:
 * same label text, same disabled state, same spinner, same click handler.
 */
interface RefreshButtonProps {
    onRefresh: () => void;
    isRefreshing: boolean;
    initialCooldownSeconds: number;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
    onRefresh,
    isRefreshing,
    initialCooldownSeconds,
}) => {
    const [cooldownSeconds, setCooldownSeconds] = useState(initialCooldownSeconds);

    // Re-seed the countdown whenever the parent reports a new cooldown window
    // (e.g. after a refresh returns a fresh `cooldown_seconds_remaining`).
    useEffect(() => {
        setCooldownSeconds(initialCooldownSeconds);
    }, [initialCooldownSeconds]);

    // Cooldown countdown timer — ticks isolated to this component only.
    useEffect(() => {
        if (cooldownSeconds <= 0) return;
        const timer = setInterval(() => {
            setCooldownSeconds(prev => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldownSeconds]);

    const disabled = isRefreshing || cooldownSeconds > 0;

    return (
        <Button variant="secondary" size="sm" onClick={onRefresh} disabled={disabled}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing
                ? 'Refreshing...'
                : cooldownSeconds > 0
                    ? `Refresh in ${formatCooldown(cooldownSeconds)}`
                    : 'Refresh'}
        </Button>
    );
};

export const InsightDashboard: React.FC<InsightDashboardProps> = ({ initialTab }) => {
    const [, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<string>(initialTab || 'at-a-glance');
    const [segments, setSegments] = useState<SegmentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Cooldown is tracked as an absolute deadline timestamp (ms) on the parent.
    // The per-second countdown lives in <RefreshButton>; the parent only stores
    // the window so its click guard can reject early — no 1Hz parent re-render.
    const [cooldownUntil, setCooldownUntil] = useState(0);
    const cooldownUntilRef = useRef(0);
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const freshnessKey = useRef(0);
    const { isModuleEnabled } = useModules();
    const { isFeatureEnabled } = useFeatureFlags();
    const shell = useShellBridge();
    const flagsLoaded = shell?.effectiveFlagsLoaded;
    const canRefresh = flagsLoaded && (isFeatureEnabled('action:insight:refresh_on_demand') ?? true);

    // Sync active tab when navigating between segment routes (e.g. /insight/revenue → /insight/execution)
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    // Fetch segments on mount
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

    const startCooldown = useCallback((seconds: number) => {
        const until = Date.now() + seconds * 1000;
        cooldownUntilRef.current = until;
        setCooldownUntil(until);
    }, []);

    const handleRefresh = useCallback(async () => {
        if (isRefreshing || cooldownUntilRef.current > Date.now()) return;
        setIsRefreshing(true);
        setRefreshError(null);
        try {
            const result = await insightApi.refreshInsight();
            if (result.status === 'cooldown') {
                startCooldown(result.cooldown_seconds_remaining || 900);
            } else if (result.success) {
                startCooldown(result.cooldown_seconds_remaining || 900);
                freshnessKey.current += 1;
                await fetchSegments();
            } else {
                setRefreshError('Refresh completed with errors.');
            }
        } catch (err: any) {
            setRefreshError(err.message || 'Refresh failed.');
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing, startCooldown]);

    // Seconds remaining at render time — passed once to <RefreshButton>, which
    // owns the per-second ticking so the dashboard tree does not re-render.
    const initialCooldownSeconds = cooldownUntil > Date.now()
        ? Math.ceil((cooldownUntil - Date.now()) / 1000)
        : 0;

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        // Update URL param
        setSearchParams({ tab: tabId });
    };

    const handleSegmentClick = (segmentCode: string) => {
        setActiveTab(segmentCode);
        setSearchParams({ tab: segmentCode });
    };

    // All segment tabs with their required modules
    const allSegmentTabs: Tab[] = [
        { id: 'revenue',       label: 'Revenue',       icon: 'TrendingUp' },
        { id: 'execution',     label: 'Execution',     icon: 'Zap' },
        { id: 'manufacturing', label: 'Manufacturing', icon: 'Factory' },
        { id: 'delivery',      label: 'Delivery',      icon: 'Truck' },
        { id: 'workforce',     label: 'Workforce',     icon: 'Users' },
        { id: 'finance',       label: 'Finance',       icon: 'DollarSign' },
    ];

    // Fail CLOSED. The `!hasPermCheck ? true : …` lead-in meant that whenever the
    // shell bridge could not be resolved — this MFE mounted standalone, or the
    // host context was still undefined — the ABSENCE of a permission system was
    // read as full clearance, and the finance and workforce segment tabs rendered
    // org-wide revenue and headcount for anyone. Unknown must mean denied.
    //
    // The sibling MFE dashboards (projects-fe, people-connect-fe, timesheet-fe)
    // already use this shape; Insight was the outlier.
    const canViewFinancials =
        ((shell as any)?.isAdmin === true) ||
        Boolean((shell as any)?.hasAnyPermission && (shell as any).hasAnyPermission('dashboard.financial_kpis', 'reports.view', 'invoices.read', 'journal.read')) ||
        Boolean((shell as any)?.hasPermission && ((shell as any).hasPermission('dashboard.financial_kpis') || (shell as any).hasPermission('reports.view') || (shell as any).hasPermission('invoices.read')));

    const canViewWorkforce =
        ((shell as any)?.isAdmin === true) ||
        Boolean((shell as any)?.hasAnyPermission && (shell as any).hasAnyPermission('dashboard.workforce_kpis', 'employees.read', 'users.read')) ||
        Boolean((shell as any)?.hasPermission && ((shell as any).hasPermission('dashboard.workforce_kpis') || (shell as any).hasPermission('employees.read')));

    // Filter segment tabs: show only if at least one required module is enabled AND user has permission
    const visibleSegmentTabs = allSegmentTabs.filter(tab => {
        if (tab.id === 'finance' || tab.id === 'revenue') {
            if (!canViewFinancials) return false;
        }
        if (tab.id === 'workforce') {
            if (!canViewWorkforce) return false;
        }
        const deps = SEGMENT_MODULE_DEPS[tab.id];
        if (!deps) return true;
        return deps.some(mod => isModuleEnabled(mod));
    });

    // Build final tabs: "At a Glance" always first, then visible segment tabs
    const tabs: Tab[] = [
        { id: 'at-a-glance', label: 'At a Glance', icon: 'LayoutDashboard' },
        ...visibleSegmentTabs,
    ];

    // If active tab is no longer visible (module was disabled), fall back to at-a-glance
    const effectiveActiveTab = tabs.some(t => t.id === activeTab) ? activeTab : 'at-a-glance';

    if (error) {
        return (
            <DashboardPageTemplate
                title="Insight Dashboard"
                description="Monitor key metrics across all business segments"
                bottom={
                    <EmptyState
                        icon={AlertCircle}
                        title="Failed to Load Dashboard"
                        description={error}
                        action={{ label: 'Retry', onClick: fetchSegments }}
                    />
                }
            />
        );
    }

    return (
        <DashboardPageTemplate
            title="Insight Dashboard"
            description="Monitor key metrics across all business segments"
            meta={
                <Cluster gap="tight">
                    <DataFreshnessIndicator key={freshnessKey.current} />
                    {!canRefresh && <span className="text-xs text-fg-subtle italic">Upgrade to refresh on demand</span>}
                    {refreshError && <span className="text-xs text-danger">{refreshError}</span>}
                </Cluster>
            }
            secondaryActions={
                canRefresh ? (
                    <RefreshButton
                        onRefresh={handleRefresh}
                        isRefreshing={isRefreshing}
                        initialCooldownSeconds={initialCooldownSeconds}
                    />
                ) : undefined
            }
            filters={<TabNavigation tabs={tabs} activeTab={effectiveActiveTab} onChange={handleTabChange} />}
            bottom={
                <AnimatePresence mode="wait">
                    <motion.div
                        key={effectiveActiveTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {effectiveActiveTab === 'at-a-glance' ? (
                            loading ? (
                                <div className="min-h-48" />
                            ) : (
                                <AtAGlanceView segments={segments} onSegmentClick={handleSegmentClick} />
                            )
                        ) : effectiveActiveTab === 'manufacturing' ? (
                            <ManufacturingSegment />
                        ) : (
                            <SegmentTabContent segmentCode={effectiveActiveTab} />
                        )}
                    </motion.div>
                </AnimatePresence>
            }
        />
    );
};
