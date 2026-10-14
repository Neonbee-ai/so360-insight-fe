import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, ArrowRight } from 'lucide-react';
import type { Alert } from '../types/insight';
import { useFormatters } from '@so360/formatters';
import { useShell } from '@so360/shell-context';

interface AlertCardProps {
    alert: Alert;
    onResolve: (alertId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onResolve }) => {
    const { businessSettings } = useShell();
    const formatters = useFormatters({
        currency: businessSettings?.base_currency || 'USD',
        locale: businessSettings?.document_language || 'en-US',
        timezone: businessSettings?.timezone || 'UTC',
    });

    const getSeverityIcon = () => {
        switch (alert.severity) {
            case 'critical':
                return <AlertCircle className="w-5 h-5 text-danger" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-warning" />;
            case 'info':
                return <Info className="w-5 h-5 text-primary" />;
        }
    };

    const getSeverityColor = () => {
        switch (alert.severity) {
            case 'critical':
                return 'border-danger/30 bg-danger/5';
            case 'warning':
                return 'border-warning/30 bg-warning/5';
            case 'info':
                return 'border-primary/30 bg-primary/5';
        }
    };

    const getSeverityBadgeColor = () => {
        switch (alert.severity) {
            case 'critical':
                return 'bg-danger/20 text-danger';
            case 'warning':
                return 'bg-warning/20 text-warning';
            case 'info':
                return 'bg-primary/20 text-primary';
        }
    };

    const hasActions = alert.recommended_actions && alert.recommended_actions.length > 0;

    const handleNavigate = (path: string) => {
        window.location.href = path;
    };

    return (
        <div className={`border rounded-lg p-4 ${getSeverityColor()}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon()}
                    <div className="flex-1">
                        <h3 className="text-fg font-semibold mb-1">{alert.title}</h3>
                        <p className="text-sm text-fg-muted">{alert.description}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeColor()}`}>
                    {alert.severity.toUpperCase()}
                </span>
            </div>

            {/* Recommended Actions */}
            {hasActions && !alert.resolved_at && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {alert.recommended_actions!.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleNavigate(action.path)}
                            title={action.description}
                            className="flex items-center gap-1.5 px-2.5 py-1 border border-line-strong hover:border-line-strong text-fg-muted hover:text-fg text-xs rounded transition-colors bg-surface-raised/50 hover:bg-line-strong/50"
                        >
                            {action.label}
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-fg-subtle">
                    {formatters.formatDateTime(alert.created_at)}
                </div>

                {!alert.resolved_at ? (
                    <button
                        onClick={() => onResolve(alert.id)}
                        className="px-3 py-1 bg-primary hover:bg-primary-hover text-primary-fg text-sm rounded transition-colors"
                    >
                        Resolve
                    </button>
                ) : (
                    <div className="flex items-center gap-1 text-success text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Resolved
                    </div>
                )}
            </div>
        </div>
    );
};
