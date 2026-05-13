import { describe, it, expect } from 'vitest';
import { SEGMENT_MODULE_DEPS } from './moduleMapping';

describe('SEGMENT_MODULE_DEPS', () => {
  describe('Given the segment mapping', () => {
    it('When revenue segment accessed / Then requires crm and accounting', () => {
      expect(SEGMENT_MODULE_DEPS.revenue).toContain('crm');
      expect(SEGMENT_MODULE_DEPS.revenue).toContain('accounting');
    });

    it('When execution segment accessed / Then requires projects', () => {
      expect(SEGMENT_MODULE_DEPS.execution).toContain('projects');
    });

    it('When delivery segment accessed / Then requires inventory', () => {
      expect(SEGMENT_MODULE_DEPS.delivery).toContain('inventory');
    });

    it('When workforce segment accessed / Then requires people and timesheet', () => {
      expect(SEGMENT_MODULE_DEPS.workforce).toContain('people');
      expect(SEGMENT_MODULE_DEPS.workforce).toContain('timesheet');
    });

    it('When finance segment accessed / Then requires accounting', () => {
      expect(SEGMENT_MODULE_DEPS.finance).toEqual(['accounting']);
    });
  });
});
