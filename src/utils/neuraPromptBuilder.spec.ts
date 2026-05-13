import { describe, it, expect } from 'vitest';
import { buildEnrichedPrompt } from './neuraPromptBuilder';

describe('buildEnrichedPrompt', () => {
  describe('Given known segment code', () => {
    it('When finance / Then returns financial summary prompt', () => {
      const result = buildEnrichedPrompt('finance');
      expect(result).toContain('financial summary');
    });

    it('When revenue / Then returns sales overview prompt', () => {
      const result = buildEnrichedPrompt('revenue');
      expect(result).toContain('sales overview');
    });

    it('When execution / Then returns project status prompt', () => {
      const result = buildEnrichedPrompt('execution');
      expect(result).toContain('project status');
    });

    it('When delivery / Then returns inventory status prompt', () => {
      const result = buildEnrichedPrompt('delivery');
      expect(result).toContain('inventory status');
    });

    it('When workforce / Then returns workforce prompt', () => {
      const result = buildEnrichedPrompt('workforce');
      expect(result).toContain('workforce');
    });
  });

  describe('Given unknown segment code', () => {
    it('When unknown / Then returns generic prompt', () => {
      const result = buildEnrichedPrompt('unknown_segment');
      expect(result).toContain('business performance');
    });
  });
});
