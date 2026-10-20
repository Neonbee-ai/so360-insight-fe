/**
 * Chart Container Component
 * Wraps charts with a consistent header, description, and export functionality
 */

import React from 'react';
import { Card } from '@so360/design-system';
import { ChartExport } from './ChartExport';
import { useFeatureFlags, useShellBridge } from '@so360/shell-context';

interface ChartContainerProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    chartId: string;
    exportData?: any[];
    onExportPNG?: () => void;
    onExportCSV?: () => void;
    className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
    title,
    description,
    children,
    chartId,
    exportData = [],
    onExportPNG,
    onExportCSV,
    className = '',
}) => {
    const { isFeatureEnabled } = useFeatureFlags();
    const shell = useShellBridge();
    const flagsLoaded = shell?.effectiveFlagsLoaded;
    const canExport = (shell?.permissionsLoaded === true) && (shell?.hasPermission?.('analytics.export') ?? false) && flagsLoaded && (isFeatureEnabled('action:insight:chart_export') ?? true);

    const exportAction = canExport && exportData.length > 0 ? (
        <ChartExport
            chartId={chartId}
            chartTitle={title}
            data={exportData}
            onExportPNG={onExportPNG}
            onExportCSV={onExportCSV}
        />
    ) : undefined;

    return (
        <Card title={title} actions={exportAction} className={className}>
            {description && <p className="text-sm text-fg-muted">{description}</p>}
            <div id={chartId}>{children}</div>
        </Card>
    );
};
