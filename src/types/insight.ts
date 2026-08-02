export enum AlertSeverity {
    INFO = 'info',
    WARNING = 'warning',
    CRITICAL = 'critical',
}

export interface KPI {
    kpi_code: string;
    kpi_name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    trend_percentage?: number;
    category: string;
    module_code: string;
    kpi_type?: 'performance' | 'counter';
    sparkline_data?: Array<{
        date: string;
        value: number;
    }>;
}

export interface RecommendedAction {
    label: string;
    path: string;
    type: 'navigate' | 'trigger';
    description?: string;
}

export interface Alert {
    id: string;
    tenant_id: string;
    org_id: string;
    title: string;
    description: string;
    severity: AlertSeverity;
    module_code: string;
    entity_type?: string;
    entity_id?: string;
    metadata?: any;
    created_at: string;
    resolved_at?: string;
    resolved_by?: string;
    resolution_note?: string;
    recommended_actions?: RecommendedAction[];
}

export interface AlertsSummary {
    total: number;
    critical: number;
    warning: number;
    info: number;
}

export interface Dashboard {
    kpis: KPI[];
    signals_summary: AlertsSummary;
    computed_at: string;
}

export interface ModuleInsights {
    module_code: string;
    kpis: KPI[];
    active_signals: Alert[];
    computed_at: string;
}

export interface AlertsResponse {
    data: Alert[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

// ===== SEGMENT SYSTEM TYPES =====

export interface SegmentSummary {
    segment_code: string;
    segment_name: string;
    description: string;
    icon_name: string;
    color_scheme: {
        primary: string;
        secondary: string;
    };
    primary_kpi: KPI | null;
    kpi_count: number;
    signal_count: number;
    trend: 'up' | 'down' | 'stable';
}

export interface SegmentDetail {
    segment_code: string;
    segment_name: string;
    description: string;
    icon_name: string;
    color_scheme: {
        primary: string;
        secondary: string;
    };
    kpis: KPI[];
    signals: Alert[];
    trends: TrendData[];
}

export interface TrendData {
    kpi_code: string;
    kpi_name: string;
    data: Array<{
        date: string;
        value: number;
    }>;
}

export interface AiSummarySections {
    currentPosition: string;
    issue: string;
    solution: string;
}
