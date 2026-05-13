import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockSetTenantId = vi.fn();
const mockSetOrgId = vi.fn();
const mockSetAccessToken = vi.fn();

vi.mock('../services/insightApi', () => ({
  insightApi: {
    setTenantId: (...args: any[]) => mockSetTenantId(...args),
    setOrgId: (...args: any[]) => mockSetOrgId(...args),
    setAccessToken: (...args: any[]) => mockSetAccessToken(...args),
  },
}));

let mockShellBridge: any = {};

vi.mock('@so360/shell-context', () => ({
  useShellBridge: () => mockShellBridge,
}));

import { MfeShellInitializer } from './MfeShellInitializer';

describe('MfeShellInitializer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockShellBridge = {};
  });

  describe('Given no shell context', () => {
    it('When tenant/org missing / Then shows initializing message', () => {
      mockShellBridge = { currentTenant: null, currentOrg: null };
      render(<MfeShellInitializer><div>child</div></MfeShellInitializer>);
      expect(screen.getByText('Initializing Insight module...')).toBeInTheDocument();
      expect(screen.queryByText('child')).not.toBeInTheDocument();
    });
  });

  describe('Given shell context available', () => {
    it('When tenant and org present / Then syncs and renders children', async () => {
      mockShellBridge = {
        currentTenant: { id: 't1' },
        currentOrg: { id: 'o1' },
        accessToken: 'tok123',
      };
      render(<MfeShellInitializer><div>child content</div></MfeShellInitializer>);
      await waitFor(() => {
        expect(screen.getByText('child content')).toBeInTheDocument();
      });
      expect(mockSetTenantId).toHaveBeenCalledWith('t1');
      expect(mockSetOrgId).toHaveBeenCalledWith('o1');
      expect(mockSetAccessToken).toHaveBeenCalledWith('tok123');
    });

    it('When no accessToken / Then still syncs tenant and org', async () => {
      mockShellBridge = {
        currentTenant: { id: 't1' },
        currentOrg: { id: 'o1' },
        accessToken: null,
      };
      render(<MfeShellInitializer><div>child</div></MfeShellInitializer>);
      await waitFor(() => {
        expect(screen.getByText('child')).toBeInTheDocument();
      });
      expect(mockSetTenantId).toHaveBeenCalledWith('t1');
      expect(mockSetAccessToken).not.toHaveBeenCalled();
    });
  });
});
