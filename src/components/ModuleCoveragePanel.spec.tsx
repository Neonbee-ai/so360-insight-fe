import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModuleCoveragePanel } from './ModuleCoveragePanel';

const mockIsModuleEnabled = vi.fn();
vi.mock('@so360/shell-context', () => ({
  useModules: () => ({
    isModuleEnabled: mockIsModuleEnabled,
  }),
}));

describe('ModuleCoveragePanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockIsModuleEnabled.mockReturnValue(true);
  });

  describe('Given all modules are enabled', () => {
    it('When rendered / Then shows "Module Coverage" heading', () => {
      render(<ModuleCoveragePanel />);
      expect(screen.getByText('Module Coverage')).toBeInTheDocument();
    });

    it('When rendered / Then shows "15 of 15 modules active"', () => {
      render(<ModuleCoveragePanel />);
      expect(screen.getByText(/15 of 15 modules active/)).toBeInTheDocument();
    });

    it('When rendered / Then shows module names', () => {
      render(<ModuleCoveragePanel />);
      expect(screen.getByText('CRM')).toBeInTheDocument();
      expect(screen.getByText('Accounting')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('When rendered / Then shows the newly integrated modules', () => {
      render(<ModuleCoveragePanel />);
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Sign')).toBeInTheDocument();
      expect(screen.getByText('Forms')).toBeInTheDocument();
      expect(screen.getByText('Fulfillment')).toBeInTheDocument();
    });

    it('When all enabled / Then all modules show "Active" badge', () => {
      render(<ModuleCoveragePanel />);
      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBe(15);
    });
  });

  describe('Given some modules are disabled', () => {
    it('When crm is disabled / Then shows "Inactive" for CRM', () => {
      mockIsModuleEnabled.mockImplementation((id: string) => id !== 'crm');
      render(<ModuleCoveragePanel />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByText(/14 of 15 modules active/)).toBeInTheDocument();
    });
  });
});
