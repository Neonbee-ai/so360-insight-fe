/**
 * Data Freshness Indicator
 * Shows when data was last updated by batch computation
 */

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useBusinessSettings } from '@so360/shell-context';
import { insightApi } from '../services/insightApi';

export const DataFreshnessIndicator: React.FC = () => {
    const { settings } = useBusinessSettings();
    const locale = settings?.document_language || 'en-US';
    const timezone = settings?.timezone || 'UTC';
    const [freshness, setFreshness] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFreshness();
        // Refresh every 5 minutes
        const interval = setInterval(fetchFreshness, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchFreshness = async () => {
        try {
            const data = await insightApi.getDataFreshness();
            setFreshness(data);
        } catch (err) {
            console.error('Failed to fetch data freshness:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !freshness) {
        return null;
    }

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        if (isToday) {
            return `Today at ${new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone }).format(date)}`;
        }

        return new Intl.DateTimeFormat(locale, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone,
        }).format(date);
    };

    const getStatusIcon = () => {
        if (freshness.is_stale) {
            return <AlertTriangle className="w-4 h-4 text-amber-500" />;
        }
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    };

    const getStatusColor = () => {
        if (freshness.is_stale) {
            return 'text-amber-400';
        }
        return 'text-green-400';
    };

    const tooltipTitle = freshness.next_scheduled_refresh
        ? `Next scheduled refresh: ${new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone }).format(new Date(freshness.next_scheduled_refresh))} UTC`
        : 'Refreshes every 6 hours';

    return (
        <div
            className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900/30 rounded-lg px-3 py-2 border border-slate-800"
            title={tooltipTitle}
        >
            <Clock className="w-4 h-4" />
            <span>Data updated:</span>
            {freshness.last_computation ? (
                <>
                    <span className={`font-medium ${getStatusColor()}`}>
                        {formatTimestamp(freshness.last_computation)}
                    </span>
                    {getStatusIcon()}
                </>
            ) : (
                <span className="text-amber-400 font-medium">No data — click Refresh</span>
            )}
        </div>
    );
};
