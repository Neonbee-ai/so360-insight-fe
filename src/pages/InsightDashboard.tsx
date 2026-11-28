import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { DashboardPageTemplate, Cluster, EmptyState } from '@so360/design-system';
import type { Tab } from '../components/TabNavigation';
import { getInsightIcon } from '../constants/iconMap';
import { AtAGlanceView } from '../components/AtAGlanceView';
import { SegmentTabContent } from '../components/SegmentTabContent';
import { ManufacturingSegment } from '../components/segments/ManufacturingSegment';
import { DataFreshnessIndicator } from '../components/DataFreshnessIndicator';
import { insightApi } from '../services/insightApi';
import type { SegmentSummary } from '../types/insight';
import { useModules, useFeatureFlags, useShellBridge } from '@so360/shell-context';
import { SEGMENT_MODULE_DEPS } from '../constants/moduleMapping';

const KNOWN_SEGMENT_TABS = ['revenue', 'execution', 'manufacturing', 'delivery', 'workforce', 'finance'];

interface InsightDashboardProps {
    initialTab?: string;
}

const formatCooldown = (s: number) =>
    Math.floor(s / 60) > 0 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

export const InsightDashboard: React.FC<InsightDashboardProps> = ({ initialTab }) => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    // Deep links such as /insight?tab=revenue (written by handleTabChange) must restore the tab.
    const requestedTab = initialTab || searchParams.get('tab') || undefined;
    const [activeTab, setActiveTab] = useState<string>(requestedTab || 'at-a-glance');
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

    // Seconds remaining at render time. No 1 Hz tick: one timer re-renders once when the cooldown ends.
    const [, setCooldownTick] = useState(0);
    useEffect(() => {
        const ms = cooldownUntil - Date.now();
        if (ms <= 0) return;
        const timer = setTimeout(() => setCooldownTick((n) => n + 1), ms + 50);
        return () => clearTimeout(timer);
    }, [cooldownUntil]);
    const initialCooldownSeconds = cooldownUntil > Date.now()
        ? Math.ceil((cooldownUntil - Date.now()) / 1000)
        : 0;

    // Canonical URL of a tab is the path the Shell sidebar links to (/insight, /insight/revenue, ...), so the
    // sidebar highlight, URL, title and content move together and back/forward/refresh restore the same page.
    // The module prefix is read from the live location, never hard-coded.
    const goToTab = (tabId: string, replace = false) => {
        const trimmed = location.pathname.replace(/\/+$/, '');
        const base = initialTab ? trimmed.replace(/\/[^/]+$/, '') : trimmed;
        navigate(tabId === 'at-a-glance' ? (base || '/') : `${base}/${tabId}`, { replace });
    };

    // Legacy /insight?tab=revenue links land on the canonical path (the sidebar then highlights the right item).
    useEffect(() => {
        const legacy = searchParams.get('tab');
        if (!initialTab && legacy && legacy !== 'at-a-glance' && KNOWN_SEGMENT_TABS.includes(legacy)) goToTab(legacy, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        goToTab(tabId);
    };

    const handleSegmentClick = (segmentCode: string) => {
        setActiveTab(segmentCode);
        goToTab(segmentCode);
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
    // A segment route (sidebar -> /insight/workforce) whose tab is hidden by permission/module
    // must say so; silently rendering the Overview made the sidebar and content disagree.
    const requestedHidden = Boolean(
        initialTab && initialTab !== 'at-a-glance' && !tabs.some(t => t.id === initialTab),
    );
    const pageTitle = requestedHidden
        ? (allSegmentTabs.find(t => t.id === initialTab)?.label ?? 'Insight')
        : (allSegmentTabs.find(t => t.id === effectiveActiveTab)?.label ?? 'Insight Dashboard');
    const pageDescription = effectiveActiveTab === 'at-a-glance' && !requestedHidden
        ? 'Monitor key metrics across all business segments'
        : `${pageTitle} metrics for your organization`;

    if (error) {
        return (
            <DashboardPageTemplate trail={[]}
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
        <DashboardPageTemplate trail={[]}
            title={pageTitle}
            description={pageDescription}
            meta={
                <Cluster gap="tight">
                    <DataFreshnessIndicator key={freshnessKey.current} />
                    {!canRefresh && <span className="text-xs text-fg-subtle italic">Upgrade to refresh on demand</span>}
                    {refreshError && <span className="text-xs text-danger">{refreshError}</span>}
                </Cluster>
            }
            moreActions={canRefresh ? [{
                id: 'refresh',
                label: isRefreshing ? 'Refreshing…' : 'Refresh',
                kind: 'refresh',
                icon: <RefreshCw className={isRefreshing ? 'animate-spin' : undefined} />,
                onSelect: handleRefresh,
                disabled: isRefreshing || initialCooldownSeconds > 0,
                disabledReason: initialCooldownSeconds > 0 ? `Refresh available in ${formatCooldown(initialCooldownSeconds)}` : undefined,
            }] : undefined}
            tabs={{
                name: 'insight-segments',
                items: tabs.map((tab) => {
                    const IconComponent = tab.icon ? getInsightIcon(tab.icon) : undefined;
                    return { id: tab.id, label: tab.label, icon: IconComponent ? <IconComponent className="w-5 h-5" /> : undefined };
                }),
                value: effectiveActiveTab,
                onChange: handleTabChange,
                maxVisible: 5,
            }}
            bottom={
                <AnimatePresence mode="wait">
                    <motion.div
                        key={effectiveActiveTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {requestedHidden ? (
                            <EmptyState
                                icon={AlertCircle}
                                title={`${pageTitle} is not available`}
                                description="This section is turned off for your organization or your role does not include access to it."
                            />
                        ) : effectiveActiveTab === 'at-a-glance' ? (
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
