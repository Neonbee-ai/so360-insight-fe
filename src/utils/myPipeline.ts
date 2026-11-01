import type { MyPipelineDeal, MyPipelineForecastBucket } from '../types/insight';

/** Label for a forecast bucket key (YYYY-MM or 'unscheduled'). */
export function forecastMonthLabel(month: string, locale = 'en-US'): string {
    if (month === 'unscheduled') return 'No close date';
    const [y, m] = month.split('-').map(Number);
    if (!y || !m) return month;
    return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** Weighted forecast as a share of total pipeline (0-100), null when no pipeline. */
export function coveragePct(weighted: number, total: number): number | null {
    if (!total) return null;
    return Math.round((weighted / total) * 100);
}

export function overdueCount(deals: MyPipelineDeal[]): number {
    return deals.filter(d => d.overdue).length;
}

/** Forecast buckets in order, with scheduled months first and 'unscheduled' last. */
export function sortBuckets(buckets: MyPipelineForecastBucket[]): MyPipelineForecastBucket[] {
    return [...buckets].sort((a, b) =>
        a.month === 'unscheduled' ? 1 : b.month === 'unscheduled' ? -1 : a.month.localeCompare(b.month));
}
