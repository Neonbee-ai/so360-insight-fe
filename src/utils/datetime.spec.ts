import { describe, it, expect } from 'vitest';
import { parseUtcDate } from './datetime';

describe('parseUtcDate', () => {
  describe('Given a naive timezone-less timestamp (Postgres "timestamp without time zone")', () => {
    it('When in T form "2026-06-03T14:54:00" / Then it is interpreted as UTC', () => {
      const result = parseUtcDate('2026-06-03T14:54:00');
      expect(result.getTime()).toBe(Date.UTC(2026, 5, 3, 14, 54, 0));
    });

    it('When in space form "2026-06-03 14:54:00" / Then it is interpreted as UTC', () => {
      const result = parseUtcDate('2026-06-03 14:54:00');
      expect(result.getTime()).toBe(Date.UTC(2026, 5, 3, 14, 54, 0));
    });
  });

  describe('Given a timestamp already carrying timezone info', () => {
    it('When trailing Z "2026-06-03T14:54:00Z" / Then it is left unchanged', () => {
      const result = parseUtcDate('2026-06-03T14:54:00Z');
      expect(result.getTime()).toBe(Date.UTC(2026, 5, 3, 14, 54, 0));
    });

    it('When +05:30 offset "2026-06-03T14:54:00+05:30" / Then no Z is appended and offset is honored', () => {
      const result = parseUtcDate('2026-06-03T14:54:00+05:30');
      // 14:54 IST == 09:24 UTC
      expect(result.getTime()).toBe(Date.UTC(2026, 5, 3, 9, 24, 0));
    });
  });

  describe('Given a non-string value', () => {
    it('When a Date object / Then the same Date is returned as-is', () => {
      const d = new Date('2026-06-03T14:54:00Z');
      expect(parseUtcDate(d)).toBe(d);
    });

    it('When an epoch number / Then it is wrapped directly', () => {
      const epoch = Date.UTC(2026, 5, 3, 14, 54, 0);
      expect(parseUtcDate(epoch).getTime()).toBe(epoch);
    });

    it('When null or undefined / Then an invalid Date is returned', () => {
      expect(Number.isNaN(parseUtcDate(null).getTime())).toBe(true);
      expect(Number.isNaN(parseUtcDate(undefined).getTime())).toBe(true);
    });
  });

  describe('Given a date-only string', () => {
    it('When "2026-06-03" / Then it parses to UTC midnight (untouched)', () => {
      const result = parseUtcDate('2026-06-03');
      expect(result.getTime()).toBe(Date.UTC(2026, 5, 3, 0, 0, 0));
    });
  });
});
