/**
 * Workforce Optimizer Charts
 * Chart visualizations for Workforce segment KPIs
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, Card, Grid, GridItem } from '@so360/design-system';
import {
    LineChartComponent,
    GaugeChartComponent,
    BarChartComponent,
    formatNumber,
    formatPercentage,
    formatDate,
} from '../charts';
import { insightApi } from '../../services/insightApi';
import { useModules } from '@so360/shell-context';

interface WorkforceChartsProps {
    tenantId: string;
    orgId: string;
}

export const WorkforceCharts: React.FC<WorkforceChartsProps> = ({ tenantId, orgId }) => {
    const { isModuleEnabled } = useModules();
    const [utilizationData, setUtilizationData] = useState<any>(null);
    const [complianceData, setComplianceData] = useState<any>(null);
    const [overtimeData, setOvertimeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChartData();
    }, [tenantId, orgId]);

    const fetchChartData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [utilizationRes, complianceRes, overtimeRes] = await Promise.all([
                insightApi.getChartData('workforce', 'utilization_trend'),
                insightApi.getChartData('workforce', 'compliance_gauge'),
                insightApi.getChartData('workforce', 'overtime_distribution'),
            ]);

            setUtilizationData(utilizationRes.data?.data?.data || []);
            setComplianceData(complianceRes.data?.data || {});
            setOvertimeData(overtimeRes.data?.data?.departments || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load workforce charts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-warning animate-spin" />
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
            {/* Utilization Rate Trend */}
            {isModuleEnabled('people') && utilizationData && (
                <GridItem span={6}>
                    <Card title="Team Utilization Rate">
                        <p className="text-sm text-fg-muted">Average team capacity usage</p>
                        <LineChartComponent
                            data={utilizationData}
                            xAxisKey="month"
                            series={[{ key: 'utilization', name: 'Utilization %', color: '#f97316' }]}
                            height={280}
                            segmentColor="workforce"
                            formatValue={(value) => formatPercentage(value)}
                            formatXAxis={(value) => formatDate(value)}
                        />
                    </Card>
                </GridItem>
            )}

            {/* Timesheet Compliance Gauge */}
            {isModuleEnabled('timesheet') && complianceData && (
                <GridItem span={6}>
                    <Card title="Timesheet Compliance">
                        <p className="text-sm text-fg-muted">Current compliance rate</p>
                        <GaugeChartComponent
                            value={complianceData.overall_score || 0}
                            title="Compliance"
                            height={250}
                            segmentColor="workforce"
                            thresholds={{ low: 70, medium: 85, high: 100 }}
                        />
                    </Card>
                </GridItem>
            )}

            {/* Overtime Distribution */}
            {isModuleEnabled('timesheet') && overtimeData && (
                <GridItem span={12}>
                    <Card title="Overtime Distribution">
                        <p className="text-sm text-fg-muted">Employee count by weekly hours</p>
                        <BarChartComponent
                            data={overtimeData}
                            xAxisKey="name"
                            series={[{ key: 'overtime_hours', name: 'Employees', color: '#f97316' }]}
                            height={280}
                            segmentColor="workforce"
                            formatValue={(value) => formatNumber(value)}
                        />
                    </Card>
                </GridItem>
            )}
        </Grid>
    );
};
