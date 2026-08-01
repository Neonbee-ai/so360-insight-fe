// Mirrors the REAL @so360/formatters contract (Intl-backed) rather than naive
// string interpolation, so component specs catch real formatting bugs (wrong
// currency decimals, percent scale mismatches) instead of masking them.
export const formatCurrency = (v: number, currency: string = 'USD', locale: string = 'en-US') => {
  if (v === null || v === undefined || isNaN(v)) return '-';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v);
};
export const formatDate = (d: string) => d;
export const formatNumber = (n: number, _locale?: string, opts?: { decimals?: number }) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: opts?.decimals ?? 0,
    maximumFractionDigits: opts?.decimals ?? 0,
  }).format(n);
export const formatPercent = (n: number) => `${n}%`;
// Real formatPercentage takes a FRACTION (0.15 -> "15%"), matching Intl's
// 'percent' style — callers (e.g. chartUtils' wrapper) divide 0-100 values by
// 100 before calling this.
export const formatPercentage = (value: number, locale: string = 'en-US', decimals: number = 0) => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};
export const formatDateTime = (d: string) => d;
export const useFormatters = (opts?: any) => {
  const currency = opts?.currency || 'USD';
  const locale = opts?.locale || 'en-US';
  return {
    formatCurrency: (v: number) => formatCurrency(v, currency, locale),
    formatDate,
    formatNumber: (n: number, fmtOpts?: { decimals?: number }) => formatNumber(n, locale, fmtOpts),
    formatPercent,
    formatPercentage: (v: number, decimals?: number) => formatPercentage(v, locale, decimals),
    formatDateTime,
  };
};
