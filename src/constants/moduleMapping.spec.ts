import { describe, it, expect } from 'vitest';
import { SEGMENT_MODULE_DEPS } from './moduleMapping';

describe('SEGMENT_MODULE_DEPS', () => {
  describe('Given the segment mapping', () => {
    it('When revenue segment accessed / Then requires crm and accounting', () => {
      expect(SEGMENT_MODULE_DEPS.revenue).toContain('crm');
      expect(SEGMENT_MODULE_DEPS.revenue).toContain('accounting');
    });

    it('When revenue segment accessed / Then also requires dailystore and inbox', () => {
      expect(SEGMENT_MODULE_DEPS.revenue).toContain('dailystore');
      expect(SEGMENT_MODULE_DEPS.revenue).toContain('inbox');
    });

    it('When execution segment accessed / Then requires projects', () => {
      expect(SEGMENT_MODULE_DEPS.execution).toContain('projects');
    });

    it('When execution segment accessed / Then also requires flow, procurement, and dailystore', () => {
      expect(SEGMENT_MODULE_DEPS.execution).toContain('flow');
      expect(SEGMENT_MODULE_DEPS.execution).toContain('procurement');
      expect(SEGMENT_MODULE_DEPS.execution).toContain('dailystore');
    });

    it('When delivery segment accessed / Then requires inventory', () => {
      expect(SEGMENT_MODULE_DEPS.delivery).toContain('inventory');
    });

    it('When delivery segment accessed / Then also requires procurement and dailystore', () => {
      expect(SEGMENT_MODULE_DEPS.delivery).toContain('procurement');
      expect(SEGMENT_MODULE_DEPS.delivery).toContain('dailystore');
    });

    it('When workforce segment accessed / Then requires people and timesheet', () => {
      expect(SEGMENT_MODULE_DEPS.workforce).toContain('people');
      expect(SEGMENT_MODULE_DEPS.workforce).toContain('timesheet');
    });

    it('When workforce segment accessed / Then has exactly two dependencies', () => {
      expect(SEGMENT_MODULE_DEPS.workforce).toHaveLength(2);
    });

    it('When finance segment accessed / Then requires only accounting', () => {
      expect(SEGMENT_MODULE_DEPS.finance).toEqual(['accounting']);
    });

    it('When all segments accessed / Then five segment keys are present', () => {
      const keys = Object.keys(SEGMENT_MODULE_DEPS);
      expect(keys).toContain('revenue');
      expect(keys).toContain('execution');
      expect(keys).toContain('delivery');
      expect(keys).toContain('workforce');
      expect(keys).toContain('finance');
      expect(keys).toHaveLength(5);
    });

    it('When manufacturing key accessed / Then returns undefined (not gated here)', () => {
      expect(SEGMENT_MODULE_DEPS['manufacturing']).toBeUndefined();
    });
  });
});
