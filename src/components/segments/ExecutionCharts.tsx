/**
 * Execution Optimizer Charts
 * Chart visualizations for Execution segment KPIs
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, Card, Grid, GridItem } from '@so360/design-system';
import {
    BarChartComponent,
    LineChartComponent,
    PieChartComponent,
    formatNumber,
    formatDate,
} from '../charts';
import { insightApi } from '../../services/insightApi';
import { useModules } from '@so360/shell-context';

interface ExecutionChartsProps {
    tenantId: string;
    orgId: string;
}

export const ExecutionCharts: React.FC<ExecutionChartsProps> = ({ tenantId, orgId }) => {
    const { isModuleEnabled } = useModules();
    const [taskCompletionData, setTaskCompletionData] = useState<any>(null);
    const [cycleTimeData, setCycleTimeData] = useState<any>(null);
    const [workflowStatusData, setWorkflowStatusData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChartData();
    }, [tenantId, orgId]);

    const fetchChartData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all execution charts
            const [taskRes, cycleRes, workflowRes] = await Promise.all([
                insightApi.getChartData('execution', 'task_completion'),
                insightApi.getChartData('execution', 'pr_cycle_time'),
                insightApi.getChartData('execution', 'workflow_status'),
            ]);

            setTaskCompletionData(taskRes.data?.data?.data || []);
            setCycleTimeData(cycleRes.data?.data?.data || []);
            setWorkflowStatusData(workflowRes.data?.data?.statuses || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load execution charts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="error" title="Failed to load charts">{error}</Alert>
        );
    }

    return (
        <Grid columns={12} gap="lg">
            {/* Task Completion (Stacked Bar) */}
            {isModuleEnabled('projects') && taskCompletionData && (
                <GridItem span={6}>
                    <Card title="Task Completion Status">
                        <p className="text-sm text-fg-muted">On-time vs delayed tasks by month</p>
                        <BarChartComponent
                            data={taskCompletionData}
                            xAxisKey="week"
                            series={[
                                { key: 'completed', name: 'Completed', color: '#10b981', stackId: 'stack' },
                                { key: 'planned', name: 'Planned', color: '#ef4444', stackId: 'stack' },
                            ]}
                            height={280}
                            segmentColor="execution"
                            formatValue={(value) => formatNumber(value)}
                        />
                    </Card>
                </GridItem>
            )}

            {/* PR to PO Cycle Time */}
            {isModuleEnabled('procurement') && cycleTimeData && (
                <GridItem span={6}>
                    <Card title="PR → PO Cycle Time">
                        <p className="text-sm text-fg-muted">Average days with 5-day target</p>
                        <LineChartComponent
                            data={cycleTimeData}
                            xAxisKey="month"
                            series={[
                                { key: 'avg_days', name: 'Avg Days', color: '#a855f7' },
                            ]}
                            height={280}
                            segmentColor="execution"
                            formatValue={(value) => `${formatNumber(value, 1)} days`}
                            formatXAxis={(value) => formatDate(value)}
                        />
                    </Card>
                </GridItem>
            )}

            {/* Workflow Status Distribution */}
            {isModuleEnabled('flow') && workflowStatusData && (
                <GridItem span={12}>
                    <Card title="Workflow Status Distribution">
                        <p className="text-sm text-fg-muted">Current workflow state breakdown</p>
                        <PieChartComponent
                            data={workflowStatusData || []}
                            height={320}
                            segmentColor="execution"
                            formatValue={(value) => formatNumber(value)}
                            colors={['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff']}
                        />
                    </Card>
                </GridItem>
            )}
        </Grid>
    );
};
