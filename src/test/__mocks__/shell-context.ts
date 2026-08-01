import React from 'react';
export const useShell = () => ({
  isModuleEnabled: () => false,
  isFeatureHidden: () => false,
  isFeatureEnabled: () => true,
  currentOrg: { id: 'mock-org-id', tenant_id: 'mock-tenant-id', name: 'Mock Org' },
});
export const useBusinessSettings = () => ({ settings: { base_currency: 'USD', document_language: 'en-US' } });
export const useNotify = () => ({ emitNotification: async () => {} });
export const useActivity = () => ({ recordActivity: async () => {} });
export const useShellBridge = () => ({
  isFeatureEnabled: () => true,
  isFeatureHidden: () => false,
});
export const usePeople = () => ({ people: [] });
export const useModules = () => ({
  isModuleEnabled: () => true,
});
export const useFeatureFlags = () => ({
  isFeatureEnabled: () => true,
});
export const ShellContext = React.createContext<any>({ user: { id: 'mock-user-id', email: 'test@test.com' } });
