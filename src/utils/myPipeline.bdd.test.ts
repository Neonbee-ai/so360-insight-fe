import { describe, it, expect } from 'vitest';
import { forecastMonthLabel, coveragePct, overdueCount, sortBuckets } from './myPipeline';

describe('myPipeline utils', () => {
    it('Given a YYYY-MM key, When labelled, Then a short month and year is returned', () => {
        expect(forecastMonthLabel('2026-11')).toBe('Nov 2026');
    });
    it('Given the unscheduled key, When labelled, Then it reads "No close date"', () => {
        expect(forecastMonthLabel('unscheduled')).toBe('No close date');
    });
    it('Given a malformed key, When labelled, Then it is returned unchanged', () => {
        expect(forecastMonthLabel('garbage')).toBe('garbage');
    });
    it('Given weighted and total, When coverage computed, Then it is a rounded percentage', () => {
        expect(coveragePct(860, 1400)).toBe(61);
    });
    it('Given zero pipeline, When coverage computed, Then null', () => {
        expect(coveragePct(0, 0)).toBeNull();
    });
    it('Given deals with overdue flags, When counted, Then only overdue ones count', () => {
        expect(overdueCount([{ overdue: true } as any, { overdue: false } as any, { overdue: true } as any])).toBe(2);
    });
    it('Given mixed buckets, When sorted, Then months ascend and unscheduled is last', () => {
        const out = sortBuckets([{ month: 'unscheduled' } as any, { month: '2026-12' } as any, { month: '2026-10' } as any]);
        expect(out.map(b => b.month)).toEqual(['2026-10', '2026-12', 'unscheduled']);
    });
});
