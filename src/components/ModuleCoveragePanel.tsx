import React from 'react';
import { getInsightIcon } from '../constants/iconMap';
import { useModules } from '@so360/shell-context';

const MODULE_REGISTRY = [
    { id: 'crm',         name: 'CRM',          icon: 'Users',         color: 'blue',   kpis: 6, alerts: 2 },
    { id: 'accounting',  name: 'Accounting',   icon: 'Calculator',    color: 'green',  kpis: 7, alerts: 4 },
    { id: 'inventory',   name: 'Inventory',    icon: 'Package',       color: 'orange', kpis: 3, alerts: 3 },
    { id: 'procurement', name: 'Procurement',  icon: 'ShoppingCart',  color: 'purple', kpis: 2, alerts: 2 },
    { id: 'projects',    name: 'Projects',     icon: 'FolderKanban',  color: 'sky',    kpis: 3, alerts: 2 },
    { id: 'flow',        name: 'Flow',         icon: 'GitBranch',     color: 'indigo', kpis: 2, alerts: 1 },
    { id: 'people',      name: 'People',       icon: 'UserCheck',     color: 'pink',   kpis: 3, alerts: 1 },
    { id: 'timesheet',   name: 'Timesheet',    icon: 'Clock',         color: 'yellow', kpis: 2, alerts: 2 },
    { id: 'dailystore',  name: 'Daily Store',  icon: 'Store',         color: 'teal',   kpis: 5, alerts: 0 },
    { id: 'inbox',       name: 'Inbox',        icon: 'Inbox',         color: 'cyan',   kpis: 6, alerts: 2 },
    { id: 'fulfillment', name: 'Fulfillment',  icon: 'Truck',         color: 'lime',   kpis: 6, alerts: 0 },
    { id: 'support',     name: 'Support',      icon: 'Headset',       color: 'red',    kpis: 5, alerts: 1 },
    { id: 'documents',   name: 'Documents',    icon: 'FileText',      color: 'slate',  kpis: 2, alerts: 0 },
    { id: 'sign',        name: 'Sign',         icon: 'FileSignature', color: 'violet', kpis: 2, alerts: 0 },
    { id: 'forms',       name: 'Forms',        icon: 'ClipboardList', color: 'amber',  kpis: 3, alerts: 0 },
];

export const ModuleCoveragePanel: React.FC = () => {
    const { isModuleEnabled } = useModules();

    const activeCount = MODULE_REGISTRY.filter(m => isModuleEnabled(m.id)).length;
    const totalKpis = MODULE_REGISTRY.filter(m => isModuleEnabled(m.id)).reduce((s, m) => s + m.kpis, 0);
    const totalAlerts = MODULE_REGISTRY.filter(m => isModuleEnabled(m.id)).reduce((s, m) => s + m.alerts, 0);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-fg">Module Coverage</h2>
                <span className="text-sm text-fg-muted">
                    {activeCount} of {MODULE_REGISTRY.length} modules active
                    &nbsp;·&nbsp;{totalKpis} KPIs&nbsp;·&nbsp;{totalAlerts} alerts
                </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {MODULE_REGISTRY.map(mod => {
                    const enabled = isModuleEnabled(mod.id);
                    const Icon = getInsightIcon(mod.icon);
                    return (
                        <div key={mod.id} className={`
                            rounded-lg border p-3 flex flex-col gap-1.5
                            ${enabled
                                ? 'bg-surface/60 border-line'
                                : 'bg-surface/20 border-line opacity-50'}
                        `}>
                            <div className="flex items-center justify-between">
                                {Icon && <Icon className={`w-4 h-4 ${enabled ? 'text-fg-muted' : 'text-fg-subtle'}`} />}
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                    enabled
                                        ? 'bg-success/20 text-success'
                                        : 'bg-surface-raised text-fg-subtle'
                                }`}>
                                    {enabled ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className={`text-sm font-semibold ${enabled ? 'text-fg' : 'text-fg-subtle'}`}>
                                {mod.name}
                            </p>
                            <p className={`text-xs ${enabled ? 'text-fg-subtle' : 'text-fg-subtle'}`}>
                                {mod.kpis} KPIs · {mod.alerts} alerts
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
