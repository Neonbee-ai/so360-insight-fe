/**
 * Delivery Optimizer Charts
 * Chart visualizations for Delivery segment KPIs
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, Card, Grid, GridItem } from '@so360/design-system';
import {
    AreaChartComponent,
    LineChartComponent,
    BarChartComponent,
    formatNumber,
    formatPercentage,
    formatDate,
} from '../charts';
import { insightApi } from '../../services/insightApi';
import { useModules } from '@so360/shell-context';

interface DeliveryChartsProps {
    tenantId: string;
    orgId: string;
}

export const DeliveryCharts: React.FC<DeliveryChartsProps> = ({ tenantId, orgId }) => {
    const { isModuleEnabled } = useModules();
    const [deliveryRateData, setDeliveryRateData] = useState<any>(null);
    const [turnoverData, setTurnoverData] = useState<any>(null);
    const [backorderData, setBackorderData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChartData();
    }, [tenantId, orgId]);

    const fetchChartData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [rateRes, turnoverRes, backorderRes] = await Promise.all([
                insightApi.getChartData('delivery', 'delivery_rate'),
                insightApi.getChartData('delivery', 'inventory_turnover'),
                insightApi.getChartData('delivery', 'backorder_analysis'),
            ]);

            setDeliveryRateData(rateRes.data?.data?.data || []);
            setTurnoverData(turnoverRes.data?.data?.data || []);
            setBackorderData(backorderRes.data?.data?.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load delivery charts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-success animate-spin" />
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
            {/* On-Time Delivery Rate */}
            {isModuleEnabled('procurement') && deliveryRateData && (
                <GridItem span={12}>
                    <Card title="On-Time Delivery Rate">
                        <p className="text-sm text-fg-muted">Trend with 80% target band</p>
                        <AreaChartComponent
                            data={deliveryRateData}
                            xAxisKey="month"
                            yAxisKey="on_time"
                            height={280}
                            segmentColor="delivery"
                            formatValue={(value) => formatPercentage(value)}
                            formatXAxis={(value) => formatDate(value)}
                            targetLine={{ value: 80, label: '80% Target', color: '#f59e0b' }}
                        />
                    </Card>
                </GridItem>
            )}

            {/* Inventory Turnover */}
            {isModuleEnabled('inventory') && turnoverData && (
                <GridItem span={6}>
                    <Card title="Inventory Turnover">
                        <p className="text-sm text-fg-muted">Top categories comparison</p>
                        <LineChartComponent
                            data={turnoverData}
                            xAxisKey="category"
                            series={[{ key: 'turnover', name: 'Inventory Turnover', color: '#10b981' }]}
                            height={280}
                            segmentColor="delivery"
                            formatValue={(value) => formatNumber(value, 1)}
                        />
                    </Card>
                </GridItem>
            )}

            {/* Backorder Analysis */}
            {(isModuleEnabled('procurement') || isModuleEnabled('inventory')) && backorderData && (
                <GridItem span={6}>
                    <Card title="Backorders by Category">
                        <p className="text-sm text-fg-muted">Items on backorder</p>
                        <BarChartComponent
                            data={backorderData}
                            xAxisKey="week"
                            series={[{ key: 'backorders', name: 'Backorders', color: '#ef4444' }]}
                            height={280}
                            segmentColor="delivery"
                            formatValue={(value) => formatNumber(value)}
                            layout="horizontal"
                        />
                    </Card>
                </GridItem>
            )}
        </Grid>
    );
};
