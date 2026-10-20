import React from 'react';
export const Button = ({ children, ...props }: any) => React.createElement('button', props, children);
export const Input = ({ ...props }: any) => React.createElement('input', props);
export const Select = ({ children, options, onValueChange, onChange, placeholder, label, ...props }: any) =>
  React.createElement(
    'select',
    { ...props, 'aria-label': props['aria-label'] ?? label, onChange: (e: any) => { onChange?.(e); onValueChange?.(e.target.value); } },
    options
      ? [
          placeholder ? React.createElement('option', { key: '__ph', value: '' }, placeholder) : null,
          ...options.map((o: any) => React.createElement('option', { key: o.value, value: o.value }, o.label)),
        ]
      : children,
  );
export const IconButton = ({ label, icon, variant: _v, size: _s, ...props }: any) =>
  React.createElement('button', { type: 'button', 'aria-label': label, title: label, ...props }, icon);
export const TextField = ({ label: _l, size: _s, ...props }: any) => React.createElement('input', props);
export const Tabs = ({ items = [], value, onChange, name, variant: _v, ...props }: any) =>
  React.createElement(
    'div',
    { role: 'tablist', 'data-name': name, ...props },
    items.map((it: any) =>
      React.createElement(
        'button',
        { key: it.id, role: 'tab', type: 'button', 'aria-selected': it.id === value, disabled: it.disabled, onClick: () => onChange?.(it.id) },
        it.icon, it.label,
      ),
    ),
  );
export const SegmentedControl = ({ options = [], value, onChange, name, ...props }: any) =>
  React.createElement(
    'div',
    { role: 'radiogroup', 'aria-label': props['aria-label'] },
    options.map((o: any) =>
      React.createElement(
        'button',
        { key: o.value, role: 'radio', type: 'button', 'aria-checked': o.value === value, onClick: () => onChange?.(o.value) },
        o.label,
      ),
    ),
  );
export const Modal = ({ children, ...props }: any) => React.createElement('div', props, children);
export const Card = ({ children, title, actions, footer, padding: _p, onClick, ...props }: any) =>
  React.createElement(
    'div',
    { ...props, onClick, role: onClick ? 'button' : undefined },
    title ? React.createElement('h3', null, title) : null,
    actions ?? null,
    children,
    footer ?? null,
  );
export const Badge = ({ children, ...props }: any) => React.createElement('span', props, children);
export const Spinner = (props: any) => React.createElement('div', props);
export const Tooltip = ({ children, ...props }: any) => React.createElement('div', props, children);
export const PeopleSelector = ({ children, ...props }: any) => React.createElement('div', props, children);
export const UserSelector = ({ children, ...props }: any) => React.createElement('div', props, children);
export const DepartmentSelector = ({ children, ...props }: any) => React.createElement('div', props, children);
export const LeaveCalendar = (props: any) => React.createElement('div', props);
export const ReviewForm = ({ children, ...props }: any) => React.createElement('div', props, children);
export const QuotaBar = (props: any) => React.createElement('div', props);
export const QuotaGate = ({ children }: any) => React.createElement(React.Fragment, null, children);

/**
 * FeatureGate — inline widget gating. Mirrors the real component's 5-state model.
 */
export const FeatureGate = ({ state, loading, children, fallback = null }: any): any => {
  if (loading) return null;
  if (state === 'hidden') return React.createElement(React.Fragment, null, fallback);
  if (state === 'enabled') return React.createElement(React.Fragment, null, children);
  // read_only / disabled / locked — render children (inert wrapper not needed in tests)
  return React.createElement(React.Fragment, null, children);
};

/**
 * FeatureRoute — route-level gating. Mirrors the real component's 5-state model exactly
 * so App.spec.tsx SegmentRoute tests pass without mocking @so360/design-system.
 */
export const FeatureRoute = ({ state, loading, children, hiddenFallback = null, lockedFallback, disabledFallback }: any): any => {
  if (loading) return null;
  if (state === 'hidden') return React.createElement(React.Fragment, null, hiddenFallback ?? null);
  if (state === 'locked') return React.createElement(React.Fragment, null, lockedFallback ?? children);
  if (state === 'disabled') {
    return React.createElement(React.Fragment, null, disabledFallback !== undefined ? disabledFallback : children);
  }
  // enabled / read_only
  return React.createElement(React.Fragment, null, children);
};

// ===== Universal toast (Phase 3 toast standardization) =====
export const toast = {
  success: (_message: any, _opts?: any) => 'toast-id',
  error: (_message: any, _opts?: any) => 'toast-id',
  warning: (_message: any, _opts?: any) => 'toast-id',
  info: (_message: any, _opts?: any) => 'toast-id',
  promise: <T,>(p: Promise<T> | (() => Promise<T>), _msgs?: any) => (typeof p === 'function' ? (p as () => Promise<T>)() : p),
  dismiss: (_id?: string) => {},
};
export const useToast = () => toast;
export const getErrorMessage = (_e: any, fallback?: string) => fallback ?? 'error';
export const attachToastErrorHandler = (_client?: any, _opts?: any) => 0;
export const toastBus = { subscribe: () => () => {}, getToasts: () => [], dismiss: (_id?: string) => {} };
export const ToastViewport = () => null;
export const ToastProvider = ({ children }: any) => React.createElement(React.Fragment, null, children);

// ===== Comb layout stubs (slots render inline so specs can assert on content) =====
const passthrough = (tag = 'div') => ({ children, ...props }: any) => React.createElement(tag, { 'data-testid': props['data-testid'] }, children);
export const Grid: any = passthrough();
export const GridItem: any = passthrough();
Grid.Item = GridItem;
export const Stack: any = passthrough();
export const Cluster: any = passthrough();
export const Split: any = passthrough();
export const KpiCard = ({ label, value, hint, ...props }: any) =>
  React.createElement('div', { 'data-testid': props['data-testid'] ?? 'kpi-card-ds' }, label, ' ', value, hint ?? null);
export const EmptyState = ({ title, description, action }: any) =>
  React.createElement(
    'div',
    null,
    React.createElement('p', null, title),
    description ? React.createElement('p', null, description) : null,
    action ? React.createElement('button', { type: 'button', onClick: action.onClick }, action.label) : null,
  );
export const Banner = ({ title, children, action }: any) =>
  React.createElement('div', { role: 'alert' }, title ? React.createElement('strong', null, title) : null, children,
    action ? React.createElement('button', { type: 'button', onClick: action.onClick }, action.label) : null);
const trailNode = (trail: any[] = []) =>
  trail.length
    ? React.createElement(
        'nav',
        { 'aria-label': 'Breadcrumb' },
        trail.map((t: any) =>
          React.createElement('button', { key: t.label, type: 'button', onClick: t.onClick }, t.label),
        ),
      )
    : null;
const pageShell = (testid: string) => ({
  title, description, trail, meta, status, filters, toolbarEnd, secondaryActions, headerSecondaryActions, primaryAction,
  kpis, primary, secondary, bottom, views, search, tabs, activeTab, onTabChange, sidePanel, children, loading,
}: any) =>
  React.createElement(
    'section',
    { 'data-testid': testid },
    trailNode(trail),
    React.createElement('h1', null, title),
    description ? React.createElement('p', null, description) : null,
    status ?? null,
    meta ?? null,
    secondaryActions ?? null,
    headerSecondaryActions ?? null,
    primaryAction ?? null,
    views ?? null,
    search ?? null,
    filters ?? null,
    toolbarEnd ?? null,
    tabs && tabs.length
      ? React.createElement(Tabs, { items: tabs, value: activeTab, onChange: onTabChange, name: 'Sections' })
      : null,
    kpis ?? null,
    primary ?? null,
    secondary ?? null,
    bottom ?? null,
    loading ? null : children,
    sidePanel ?? null,
  );
export const DashboardPageTemplate = pageShell('dashboard-page-template');
export const DetailPageTemplate = pageShell('detail-page-template');
export const ListPageTemplate = pageShell('list-page-template');
export const Skeleton = ({ className = '', ...props }: any) =>
  React.createElement('div', { 'data-testid': props['data-testid'] ?? 'skeleton', className: `animate-pulse ${className}` });
export const Alert = ({ title, children, variant: _v, action }: any) =>
  React.createElement('div', { role: 'alert' }, title ? React.createElement('strong', null, title) : null, children,
    action ? React.createElement('button', { type: 'button', onClick: action.onClick }, action.label) : null);
