import React from 'react';
import { Sparkles, AlertCircle, RefreshCw, Activity, AlertTriangle, Lightbulb, Zap } from 'lucide-react';
import { getInsightIcon } from '../constants/iconMap';
import type { AiSummarySections, Alert } from '../types/insight';
import { parseUtcDate } from '../utils/datetime';

interface NeuraSummaryCardProps {
    title: string;
    icon: string;
    color: 'blue' | 'green' | 'purple' | 'orange';
    summary: string | null;
    sections?: AiSummarySections | null;
    signals?: Alert[];
    generatedAt?: string | null;  // ISO timestamp of when summary was generated
    cached?: boolean;             // Whether this came from cache
    degraded?: boolean;           // True when Neura failed and this is stale data served as a fallback
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onRegenerate?: () => void;    // Force-refresh from Neura
    regenerating?: boolean;       // True while regeneration is in progress
}

export const NeuraSummaryCard: React.FC<NeuraSummaryCardProps> = ({
    title,
    icon,
    color,
    summary,
    sections,
    signals,
    generatedAt,
    cached,
    degraded = false,
    loading = false,
    error = null,
    onRetry,
    onRegenerate,
    regenerating = false,
}) => {
    const IconComponent = getInsightIcon(icon);

    // Color mappings
    const colorClasses = {
        blue: {
            gradient: 'from-blue-900/20 to-blue-800/10',
            border: 'border-primary/30',
            icon: 'text-primary',
            badge: 'bg-primary/20 text-primary',
            button: 'bg-primary hover:bg-primary-hover',
            regenerate: 'text-primary hover:text-primary hover:bg-primary/10',
        },
        green: {
            gradient: 'from-green-900/20 to-green-800/10',
            border: 'border-success/30',
            icon: 'text-success',
            badge: 'bg-green-500/20 text-success',
            button: 'bg-green-600 hover:bg-green-700',
            regenerate: 'text-success hover:text-success hover:bg-green-500/10',
        },
        purple: {
            gradient: 'from-purple-900/20 to-purple-800/10',
            border: 'border-purple-500/30',
            icon: 'text-purple-400',
            badge: 'bg-purple-500/20 text-purple-400',
            button: 'bg-purple-600 hover:bg-purple-700',
            regenerate: 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10',
        },
        orange: {
            gradient: 'from-orange-900/20 to-orange-800/10',
            border: 'border-orange-500/30',
            icon: 'text-orange-400',
            badge: 'bg-orange-500/20 text-orange-400',
            button: 'bg-orange-600 hover:bg-orange-700',
            regenerate: 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10',
        },
    };

    const colors = colorClasses[color];

    // Loading state
    if (loading) {
        return (
            <div
                className={`
                    bg-gradient-to-br ${colors.gradient}
                    border ${colors.border}
                    rounded-lg p-6 animate-pulse
                `}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="h-8 w-8 bg-line-strong rounded"></div>
                    <div className="h-6 w-12 bg-line-strong rounded-full"></div>
                </div>
                <div className="h-4 bg-line-strong rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-line-strong rounded w-full mb-2"></div>
                <div className="h-4 bg-line-strong rounded w-5/6"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div
                className={`
                    bg-gradient-to-br ${colors.gradient}
                    border ${colors.border}
                    rounded-lg p-6
                `}
            >
                <div className="flex items-center justify-between mb-4">
                    {IconComponent && <IconComponent className={`w-8 h-8 ${colors.icon}`} />}
                    <span className={`${colors.badge} px-2 py-1 text-xs rounded-full flex items-center gap-1`}>
                        <Sparkles className="w-3 h-3" />
                        AI
                    </span>
                </div>
                <h3 className="text-lg font-semibold text-fg mb-3">{title}</h3>
                <div className="flex items-start gap-2 text-danger text-sm mb-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>AI insights temporarily unavailable</p>
                </div>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className={`${colors.button} text-fg px-3 py-1.5 rounded text-sm transition-colors`}
                    >
                        Retry
                    </button>
                )}
            </div>
        );
    }

    // Render a single structured section row
    const renderSectionRow = (
        borderColor: string,
        bgColor: string,
        textColor: string,
        LabelIcon: React.ElementType,
        label: string,
        content: React.ReactNode,
    ) => (
        <div className={`border-l-2 ${borderColor} pl-3 py-2 ${bgColor} rounded-r-md mb-2`}>
            <div className="flex items-center gap-1.5 mb-1">
                <LabelIcon className={`w-3.5 h-3.5 ${textColor}`} />
                <span className={`text-xs font-semibold uppercase tracking-wide ${textColor}`}>{label}</span>
            </div>
            {content}
        </div>
    );

    // Main content state
    return (
        <div
            className={`
                bg-gradient-to-br ${colors.gradient}
                border ${colors.border}
                rounded-lg p-6 transition-all hover:shadow-lg
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {IconComponent && <IconComponent className={`w-8 h-8 ${colors.icon}`} />}
                </div>
                <div className="flex items-center gap-2">
                    {/* Regenerate button */}
                    {onRegenerate && (
                        <button
                            onClick={onRegenerate}
                            disabled={regenerating}
                            title="Regenerate AI summary"
                            className={`
                                ${colors.regenerate}
                                p-1.5 rounded transition-colors disabled:opacity-40
                            `}
                        >
                            <RefreshCw
                                className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`}
                            />
                        </button>
                    )}
                    <span className={`${colors.badge} px-2 py-1 text-xs rounded-full flex items-center gap-1`}>
                        <Sparkles className="w-3 h-3" />
                        AI
                    </span>
                </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-fg mb-3">{title}</h3>

            {/* Structured 4-section layout — shown when sections are available */}
            {sections ? (
                <div className="mb-4 space-y-1">
                    {renderSectionRow(
                        'border-l-slate-400',
                        'bg-line-strong/30',
                        'text-fg-muted',
                        Activity,
                        'Current Position',
                        <p className="text-sm text-fg-muted leading-relaxed">{sections.currentPosition}</p>,
                    )}

                    {renderSectionRow(
                        'border-l-red-400',
                        'bg-danger/8',
                        'text-danger',
                        AlertTriangle,
                        'Issue',
                        <p className="text-sm text-fg-muted leading-relaxed">{sections.issue}</p>,
                    )}

                    {renderSectionRow(
                        'border-l-emerald-400',
                        'bg-emerald-500/8',
                        'text-success',
                        Lightbulb,
                        'Suggested Solution',
                        <p className="text-sm text-fg-muted leading-relaxed">{sections.solution}</p>,
                    )}

                    {renderSectionRow(
                        'border-l-amber-400',
                        'bg-warning/8',
                        'text-warning',
                        Zap,
                        'Action Alerts',
                        <ActionAlertsContent signals={signals} />,
                    )}
                </div>
            ) : (
                /* Backward-compat: plain text fallback for old cached rows */
                summary && (
                    <div className="text-sm text-fg-muted mb-4 prose-sm max-w-none leading-relaxed">
                        {summary.split('\n').map((line, idx) => {
                            const parts = line.split(/\*\*(.*?)\*\*/g);
                            return (
                                <p key={idx} className="mb-2 last:mb-0">
                                    {parts.map((part, i) =>
                                        i % 2 === 0 ? (
                                            <span key={i}>{part}</span>
                                        ) : (
                                            <strong key={i} className="text-fg font-semibold">
                                                {part}
                                            </strong>
                                        )
                                    )}
                                </p>
                            );
                        })}
                    </div>
                )
            )}

            {/* Degraded banner: regeneration failed, this is stale data served as a fallback */}
            {degraded && (
                <div className="flex items-start gap-2 text-warning text-xs mt-3 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <p>AI regeneration failed — showing the last known summary instead.</p>
                </div>
            )}

            {/* Footer: generated timestamp */}
            {generatedAt && (
                <p className="text-xs text-fg-subtle mt-3">
                    {cached ? 'Cached' : 'Generated'} {formatRelativeTime(generatedAt)}
                </p>
            )}
        </div>
    );
};

const ActionAlertsContent: React.FC<{ signals?: Alert[] }> = ({ signals }) => {
    const items = (signals || []).slice(0, 2);

    if (items.length === 0) {
        return <p className="text-sm text-fg-subtle italic">No active alerts for this segment.</p>;
    }

    return (
        <div className="space-y-2">
            {items.map((signal) => (
                <div key={signal.id} className="flex flex-col gap-1">
                    <span className="text-sm text-fg-muted leading-snug">{signal.title}</span>
                    {signal.recommended_actions && signal.recommended_actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {signal.recommended_actions.slice(0, 2).map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (action.type === 'navigate' && action.path) {
                                            window.location.assign(action.path);
                                        }
                                    }}
                                    className="px-2 py-0.5 text-xs rounded bg-warning/15 text-warning hover:bg-warning/25 border border-warning/30 transition-colors"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

function formatRelativeTime(isoTimestamp: string): string {
    const diff = Math.floor((Date.now() - parseUtcDate(isoTimestamp).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
