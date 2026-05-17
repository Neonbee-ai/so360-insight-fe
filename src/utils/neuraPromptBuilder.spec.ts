import { describe, it, expect } from 'vitest';
import { buildEnrichedPrompt } from './neuraPromptBuilder';

describe('buildEnrichedPrompt', () => {
  describe('Given known segment code', () => {
    it('When finance / Then returns exact financial summary prompt', () => {
      const result = buildEnrichedPrompt('finance');
      expect(result).toBe('Generate a financial summary report');
    });

    it('When revenue / Then returns exact sales overview prompt', () => {
      const result = buildEnrichedPrompt('revenue');
      expect(result).toBe('Generate a sales overview report');
    });

    it('When execution / Then returns exact project status prompt', () => {
      const result = buildEnrichedPrompt('execution');
      expect(result).toBe('Generate a project status report');
    });

    it('When delivery / Then returns exact inventory status prompt', () => {
      const result = buildEnrichedPrompt('delivery');
      expect(result).toBe('Generate an inventory status report');
    });

    it('When workforce / Then returns exact workforce utilization prompt', () => {
      const result = buildEnrichedPrompt('workforce');
      expect(result).toBe('Generate a workforce utilization report');
    });
  });

  describe('Given unknown segment code', () => {
    it('When unknown string / Then returns generic business performance prompt', () => {
      const result = buildEnrichedPrompt('unknown_segment');
      expect(result).toBe('Generate a business performance summary report');
    });

    it('When empty string / Then returns generic prompt', () => {
      const result = buildEnrichedPrompt('');
      expect(result).toBe('Generate a business performance summary report');
    });

    it('When manufacturing / Then returns generic prompt (not yet in map)', () => {
      const result = buildEnrichedPrompt('manufacturing');
      expect(result).toBe('Generate a business performance summary report');
    });

    it('When uppercase variant / Then returns generic prompt (case-sensitive)', () => {
      const result = buildEnrichedPrompt('Finance');
      expect(result).toBe('Generate a business performance summary report');
    });
  });

  describe('Given context parameter', () => {
    it('When context provided alongside segment / Then returns same prompt (context ignored)', () => {
      const withCtx = buildEnrichedPrompt('revenue', { orgId: 'o1', tenantId: 't1' });
      const withoutCtx = buildEnrichedPrompt('revenue');
      expect(withCtx).toBe(withoutCtx);
    });
  });

  describe('Given return type', () => {
    it('When called / Then always returns a non-empty string', () => {
      for (const code of ['finance', 'revenue', 'execution', 'delivery', 'workforce', 'noop']) {
        const result = buildEnrichedPrompt(code);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });
});
