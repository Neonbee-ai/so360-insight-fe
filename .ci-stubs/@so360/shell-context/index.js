export const useShellBridge = () => null;
export const useShell = () => ({});
export const useModules = () => ({ modules: [], isModuleEnabled: () => true });
export const useFeatureFlags = () => ({ isFeatureEnabled: () => true });
export const ShellContext = null;
export const ShellContextType = null;
export const eventBus = { publish: () => {}, subscribe: () => () => {} };
export default {};
