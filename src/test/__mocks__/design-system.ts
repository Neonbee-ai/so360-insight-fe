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
        { key: it.id, role: 'tab', type: 'button', 'data-testid': `tab-${it.id}`, 'aria-selected': it.id === value, disabled: it.disabled, onClick: () => onChange?.(it.id) },
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
export const KpiCard = ({ label, value, hint, onClick, icon: _i, loading: _l, delta: _d, deltaLabel: _dl, name: _n, className: _c, ...props }: any) =>
  React.createElement('div', { 'data-testid': props['data-testid'] ?? 'kpi-card-ds', ...(onClick ? { role: 'button', onClick } : {}) },
    React.createElement('span', null, label), ' ',
    React.createElement('span', null, value),
    hint != null ? React.createElement('span', null, hint) : null);
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
/** CombScope mirror: provides module/root/navigate; page trails prepend the root crumb like resolveTrail. */
const CombScopeCtx = React.createContext<any>(null);
export const CombScope = ({ children, ...scope }: any) =>
  React.createElement(CombScopeCtx.Provider, { value: scope }, children);
export const useCombScope = () => React.useContext(CombScopeCtx);
const TrailNav = ({ trail = [] }: { trail?: any[] }) => {
  const scope = React.useContext(CombScopeCtx);
  const root = scope?.root;
  const items = root && trail[0]?.label !== root.label ? [root, ...trail] : trail;
  if (!items.length) return null;
  return React.createElement(
    'nav',
    { 'aria-label': 'Breadcrumb' },
    items.map((t: any) =>
      React.createElement('button', { key: t.label, type: 'button', onClick: t.onClick ?? (t.to ? () => scope?.navigate?.(t.to) : undefined) }, t.label),
    ),
  );
};
// ── Title area v2 helpers: PageAction objects render as buttons (disabled -> aria-disabled, like the DS Button); legacy nodes pass through ──
const v2IsPlain = (v: any) => v && typeof v === 'object' && !React.isValidElement(v) && !Array.isArray(v);
const v2IsAction = (a: any) => v2IsPlain(a) && typeof a.id === 'string' && typeof a.label === 'string';
const v2Gate = (a: any, node: any) => {
  let n = node;
  if (a.gate?.quota) n = React.createElement(QuotaGate, a.gate.quota, n);
  if (a.gate?.feature) n = React.createElement(FeatureGate, a.gate.feature, n);
  return React.createElement(React.Fragment, { key: a.id }, n);
};
const v2Actions = (items: any): any[] | null => {
  if (!items) return null;
  return (Array.isArray(items) ? items : [items]).map((a: any, i: number) => v2IsAction(a)
    ? v2Gate(a, React.createElement('button', { key: a.id, type: 'button', 'aria-disabled': a.disabled ? 'true' : undefined, onClick: () => { if (!a.disabled) a.onSelect?.(); } }, a.label))
    : React.createElement(React.Fragment, { key: a?.key ?? `n${i}` }, a));
};
const v2Search = (sp: any) => (v2IsPlain(sp)
  ? React.createElement('input', { type: 'search', 'aria-label': String(sp.placeholder || 'Search').replace(/…$/, ''), placeholder: sp.placeholder, value: sp.value ?? '', onChange: (e: any) => sp.onChange?.(e.target.value) })
  : sp ?? null);
const v2Kpis = (k: any) => (Array.isArray(k) && k.length && v2IsPlain(k[0]) && 'id' in k[0] && 'label' in k[0]
  ? React.createElement('div', { 'data-slot': 'kpis' }, k.map((x: any) => React.createElement('div', { key: x.id }, React.createElement('span', null, x.label), React.createElement('span', null, x.value), x.hint ?? null)))
  : k ?? null);
const V2Drawer = ({ cfg }: any) => {
  const [open, setOpen] = React.useState(false);
  return React.createElement(React.Fragment, null,
    React.createElement('button', { type: 'button', onClick: () => setOpen(true) }, 'Filters'),
    open ? React.createElement('div', { role: 'dialog', 'aria-label': 'Filters' },
      ...(cfg.fields ?? []).map((f: any) => f.type === 'segment'
        ? React.createElement('div', { key: f.key, role: 'radiogroup', 'aria-label': f.label },
          ...(f.options ?? []).map((o: any) => React.createElement('button', { key: o.value, type: 'button', role: 'radio', 'aria-checked': (cfg.values?.[f.key] ?? f.default) === o.value, onClick: () => cfg.onChange({ ...cfg.values, [f.key]: o.value }) }, o.label)))
        : f.type === 'switch' || f.type === 'boolean'
          ? React.createElement('label', { key: f.key }, f.label, React.createElement('input', { type: 'checkbox', role: 'switch', checked: !!cfg.values?.[f.key], onChange: (e: any) => cfg.onChange({ ...cfg.values, [f.key]: e.target.checked }) }))
          : React.createElement('select', {
            key: f.key, 'aria-label': f.label, value: cfg.values?.[f.key] ?? '',
            onChange: (e: any) => cfg.onChange({ ...cfg.values, [f.key]: e.target.value }),
          }, React.createElement('option', { value: '' }, `All ${f.label}`), ...(f.options ?? []).map((o: any) => React.createElement('option', { key: o.value, value: o.value }, o.label)))),
      React.createElement('button', { type: 'button', onClick: () => cfg.onClear?.() }, 'Clear')) : null);
};
const v2Filters = (f: any) => (v2IsPlain(f) && Array.isArray(f.fields) ? React.createElement(V2Drawer, { cfg: f }) : f ?? null);
const trailNode = (trail: any[] = []) => React.createElement(TrailNav, { trail });
const pageShell = (testid: string) => ({
  title, description, trail, meta, status, filters, toolbarEnd, secondaryActions, moreActions, headerSecondaryActions, primaryAction,
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
    v2Actions(secondaryActions),
    v2Actions(moreActions),
    headerSecondaryActions ?? null,
    v2Actions(primaryAction),
    views ?? null,
    v2Search(search),
    v2Filters(filters),
    toolbarEnd ?? null,
    tabs && !Array.isArray(tabs) && Array.isArray(tabs.items)
      ? React.createElement(Tabs, { items: tabs.items, value: tabs.value, onChange: tabs.onChange, name: tabs.name ?? 'Sections' })
      : tabs && tabs.length
        ? React.createElement(Tabs, { items: tabs, value: activeTab, onChange: onTabChange, name: 'Sections' })
        : null,
    v2Kpis(kpis),
    primary ?? null,
    secondary ?? null,
    bottom ?? null,
    // Real Comb templates swap children for a busy skeleton while loading.
    loading ? React.createElement('div', { 'data-slot': 'loading', 'aria-busy': 'true' }, React.createElement('span', { className: 'sr-only' }, 'Loading…')) : children,
    sidePanel ?? null,
  );
export const DashboardPageTemplate = pageShell('dashboard-page-template');
export const DetailPageTemplate = pageShell('detail-page-template');
export const ListPageTemplate = pageShell('list-page-template');
const SkeletonBase = ({ className = '', ...props }: any) =>
  React.createElement('div', { 'data-testid': props['data-testid'] ?? 'skeleton', className: `animate-pulse ${className}` });
const skeletonPreset = (props: any) =>
  React.createElement('div', { 'data-testid': props['data-testid'] ?? 'skeleton', 'aria-busy': true }, React.createElement('span', { className: 'sr-only' }, 'Loading…'));
export const Skeleton = Object.assign(SkeletonBase, Object.fromEntries(
  ['Page', 'Header', 'Toolbar', 'List', 'Dashboard', 'Fields', 'Settings', 'Canvas', 'Form', 'Detail', 'Table', 'Cards', 'Kpis'].map((k) => [k, skeletonPreset])));
export const Alert = ({ title, children, variant: _v, action }: any) =>
  React.createElement('div', { role: 'alert' }, title ? React.createElement('strong', null, title) : null, children,
    action ? React.createElement('button', { type: 'button', onClick: action.onClick }, action.label) : null);
export const DataTable = ({ columns = [], rows = [], rowKey, ...props }: any) =>
  React.createElement('div', { 'data-testid': props['data-testid'] ?? 'data-table' },
    rows.map((r: any, i: number) =>
      React.createElement('div', { key: rowKey ? rowKey(r) : i, role: 'row' },
        columns.map((c: any) => React.createElement('span', { key: c.key, 'data-col': c.key }, c.render ? c.render(r) : r[c.key])))));
