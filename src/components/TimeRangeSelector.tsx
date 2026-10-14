/**
 * Time Range Selector Component
 * Allows users to select different time ranges for trend analysis
 */

import React from 'react';
import { Calendar } from 'lucide-react';

export type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y';

interface TimeRangeOption {
    value: TimeRange;
    label: string;
    days: number;
}

interface TimeRangeSelectorProps {
    selected: TimeRange;
    onChange: (range: TimeRange) => void;
}

const TIME_RANGES: TimeRangeOption[] = [
    { value: '7d', label: 'Last 7 days', days: 7 },
    { value: '30d', label: 'Last 30 days', days: 30 },
    { value: '90d', label: 'Last 90 days', days: 90 },
    { value: '6m', label: 'Last 6 months', days: 180 },
    { value: '1y', label: 'Last 12 months', days: 365 },
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ selected, onChange }) => {
    return (
        <div className="flex items-center gap-2 bg-surface/50 rounded-lg border border-line p-1">
            <Calendar className="w-4 h-4 text-fg-muted ml-2" />
            {TIME_RANGES.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`
                        px-3 py-1.5 rounded-md text-sm font-medium transition-all
                        ${
                            selected === option.value
                                ? 'bg-primary text-primary-fg shadow-lg shadow-primary/25'
                                : 'text-fg-muted hover:text-fg hover:bg-surface-raised/50'
                        }
                    `}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export const getDaysForRange = (range: TimeRange): number => {
    const option = TIME_RANGES.find((r) => r.value === range);
    return option?.days || 30;
};
