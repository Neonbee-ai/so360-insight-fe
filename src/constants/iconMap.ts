/**
 * Explicit lucide-react icon map.
 *
 * Components render icons by a runtime string name (segment `icon_name`, tab
 * icon, summary-card icon, module icon). Previously every such component did
 * `import * as LucideIcons from 'lucide-react'` and looked up
 * `(LucideIcons as any)[name]`, which pulls the ENTIRE lucide library into the
 * bundle.
 *
 * This map imports only the icons the app actually feeds in, so the bundle no
 * longer includes the whole library. Lookup semantics are identical: an unknown
 * name resolves to `undefined`, and callers already render `null` in that case.
 *
 * The set below is the union of every dynamic icon name used across the app:
 *   - Segment `icon_name` from insight-be (TrendingUp, Zap, Truck, Users,
 *     DollarSign, BarChart3) plus the locally-composed Manufacturing card
 *     (Factory).
 *   - Tab icons (InsightDashboard): TrendingUp, Zap, Factory, Truck, Users,
 *     DollarSign, LayoutDashboard.
 *   - AI summary card icons (AtAGlanceView): DollarSign, TrendingUp, Briefcase,
 *     Package, Users2; NeuraSummaryCard default icon Sparkles.
 *   - Module coverage icons (ModuleCoveragePanel): Users, Calculator, Package,
 *     ShoppingCart, FolderKanban, GitBranch, UserCheck, Clock, Store, Inbox.
 */
import type { LucideIcon } from 'lucide-react';
import {
    TrendingUp,
    Zap,
    Truck,
    Users,
    Users2,
    DollarSign,
    BarChart3,
    Factory,
    LayoutDashboard,
    Briefcase,
    Package,
    Sparkles,
    Calculator,
    ShoppingCart,
    FolderKanban,
    GitBranch,
    UserCheck,
    Clock,
    Store,
    Inbox,
} from 'lucide-react';

export const INSIGHT_ICON_MAP: Record<string, LucideIcon> = {
    TrendingUp,
    Zap,
    Truck,
    Users,
    Users2,
    DollarSign,
    BarChart3,
    Factory,
    LayoutDashboard,
    Briefcase,
    Package,
    Sparkles,
    Calculator,
    ShoppingCart,
    FolderKanban,
    GitBranch,
    UserCheck,
    Clock,
    Store,
    Inbox,
};

/** Resolve an icon component by name; returns undefined for unknown names. */
export const getInsightIcon = (name?: string): LucideIcon | undefined =>
    name ? INSIGHT_ICON_MAP[name] : undefined;
