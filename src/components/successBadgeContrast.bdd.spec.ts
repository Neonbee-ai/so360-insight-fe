import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Success badges contrast (WCAG AA 4.5:1)', () => {
    for (const file of ['NeuraSummaryCard.tsx', 'ModuleCoveragePanel.tsx']) {
        it(`given ${file}, when the success badge is styled, then it uses the container/on-container pair instead of text-success over bg-success/20`, () => {
            const src = readFileSync(join(__dirname, file), 'utf8');
            expect(src).not.toMatch(/bg-success\/20 text-success/);
            // Either the raw container/on-container pair, or the DS Badge success tone
            // (which renders that same pair) once the file adopted Comb.
            const usesPair = src.includes('bg-success-container text-success-on-container');
            const usesDsBadge = /<Badge[^>]*tone=\{?[^>]*'success'/.test(src);
            expect(usesPair || usesDsBadge).toBe(true);
        });
    }
});
