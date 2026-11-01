/**
 * Chart Export Component
 * Allows exporting charts as PNG images or CSV data
 */

import React, { useState } from 'react';
import { Download, FileImage, FileSpreadsheet } from 'lucide-react';
import { Button, IconButton, toast } from '@so360/design-system';

interface ChartExportProps {
    chartId: string;
    chartTitle: string;
    data: any[];
    onExportPNG?: () => void;
    onExportCSV?: () => void;
}

export const ChartExport: React.FC<ChartExportProps> = ({
    chartTitle,
    data,
    onExportPNG,
    onExportCSV,
}) => {
    const [showMenu, setShowMenu] = useState(false);

    const handleExportCSV = () => {
        if (onExportCSV) {
            onExportCSV();
        } else {
            // Default CSV export implementation
            const csv = convertToCSV(data);
            downloadCSV(csv, `${chartTitle}.csv`);
        }
        setShowMenu(false);
    };

    const handleExportPNG = () => {
        if (onExportPNG) {
            onExportPNG();
        } else {
            // Default PNG export would require html2canvas library
            // For now, just show a message
            toast.info('PNG export requires html2canvas library. Install it to enable this feature.');
        }
        setShowMenu(false);
    };

    const convertToCSV = (data: any[]): string => {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const rows = data.map((row) =>
            headers.map((header) => {
                const value = row[header];
                // Escape commas and quotes in CSV
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    };

    const downloadCSV = (csv: string, filename: string) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="relative">
            <IconButton
                label="Export chart"
                onClick={() => setShowMenu(!showMenu)}
                icon={<Download className="w-4 h-4" />}
            />

            {showMenu && (
                <>
                    {/* comb-exception: invisible click-away layer for the export menu (no DS popover wraps this IconButton) */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-line rounded-lg shadow-overlay z-20">
                        <div className="py-1">
                            <Button
                                variant="ghost"
                                className="w-full !justify-start"
                                onClick={handleExportPNG}
                            >
                                <FileImage className="w-4 h-4" />
                                Export as PNG
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full !justify-start"
                                onClick={handleExportCSV}
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Export as CSV
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
