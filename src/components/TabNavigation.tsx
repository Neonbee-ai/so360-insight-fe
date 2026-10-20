import React from 'react';
import { Tabs } from '@so360/design-system';
import { getInsightIcon } from '../constants/iconMap';

export interface Tab {
    id: string;
    label: string;
    icon?: string;
}

interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onChange }) => {
    const getIcon = (iconName?: string) => {
        if (!iconName) return undefined;
        const IconComponent = getInsightIcon(iconName);
        if (!IconComponent) return undefined;
        return <IconComponent className="w-5 h-5" />;
    };

    return (
        <Tabs
            name="insight-segments"
            items={tabs.map((tab) => ({ id: tab.id, label: tab.label, icon: getIcon(tab.icon) }))}
            value={activeTab}
            onChange={onChange}
        />
    );
};
