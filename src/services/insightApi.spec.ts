import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: mockGet,
      post: mockPost,
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    }),
  },
}));

import { insightApi } from './insightApi';

describe('insightApi', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  describe('Given setTenantId', () => {
    it('When called / Then does not throw', () => {
      expect(() => insightApi.setTenantId('t1')).not.toThrow();
    });
  });

  describe('Given setOrgId', () => {
    it('When called / Then does not throw', () => {
      expect(() => insightApi.setOrgId('o1')).not.toThrow();
    });
  });

  describe('Given setAccessToken', () => {
    it('When called / Then does not throw', () => {
      expect(() => insightApi.setAccessToken('tok')).not.toThrow();
    });
  });

  describe('Given getAuthHeaders', () => {
    it('When called / Then returns headers object', () => {
      const headers = insightApi.getAuthHeaders();
      expect(headers).toHaveProperty('Content-Type');
    });
  });

  describe('Given getDashboard', () => {
    it('When called / Then returns dashboard data', async () => {
      mockGet.mockResolvedValue({ data: { kpis: [], signals_summary: {} } });
      const result = await insightApi.getDashboard();
      expect(result).toEqual({ kpis: [], signals_summary: {} });
    });
  });

  describe('Given getModuleInsights', () => {
    it('When module provided / Then fetches module data', async () => {
      mockGet.mockResolvedValue({ data: { module_code: 'crm', kpis: [] } });
      const result = await insightApi.getModuleInsights('crm');
      expect(result.module_code).toBe('crm');
    });
  });

  describe('Given getSignals', () => {
    it('When filters provided / Then passes params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], total: 0 } });
      await insightApi.getSignals({ severity: 'critical', page: 1, limit: 10 });
      expect(mockGet).toHaveBeenCalledWith('/signals', { params: expect.objectContaining({ severity: 'critical' }) });
    });
  });

  describe('Given resolveSignal', () => {
    it('When called / Then sends POST', async () => {
      mockPost.mockResolvedValue({ data: { id: 's1', resolved_at: '2024-01-01' } });
      const result = await insightApi.resolveSignal('s1', 'Done');
      expect(result.resolved_at).toBeDefined();
    });
  });

  describe('Given getSegments', () => {
    it('When called / Then returns segments', async () => {
      mockGet.mockResolvedValue({ data: [{ segment_code: 'revenue' }] });
      const result = await insightApi.getSegments();
      expect(result[0].segment_code).toBe('revenue');
    });
  });

  describe('Given getSegmentDetail', () => {
    it('When code provided / Then fetches segment data', async () => {
      mockGet.mockResolvedValue({ data: { segment_code: 'revenue', kpis: [] } });
      const result = await insightApi.getSegmentDetail('revenue');
      expect(result.segment_code).toBe('revenue');
    });
  });

  describe('Given getKPITrend', () => {
    it('When called / Then returns trend data', async () => {
      mockGet.mockResolvedValue({ data: { kpi_code: 'rev', data: [] } });
      const result = await insightApi.getKPITrend('rev', 30);
      expect(result).toHaveProperty('kpi_code');
    });
  });

  describe('Given getChartData', () => {
    it('When segment and chart provided / Then fetches chart data', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      const result = await insightApi.getChartData('revenue', 'monthly_trend');
      expect(result).toBeDefined();
    });
  });

  describe('Given getDataFreshness', () => {
    it('When called / Then returns freshness data', async () => {
      mockGet.mockResolvedValue({ data: { last_computation: '2024-01-01' } });
      const result = await insightApi.getDataFreshness();
      expect(result).toHaveProperty('last_computation');
    });
  });

  describe('Given refreshInsight', () => {
    it('When called / Then returns refresh result', async () => {
      mockPost.mockResolvedValue({ data: { success: true, status: 'refreshed' } });
      const result = await insightApi.refreshInsight();
      expect(result.success).toBe(true);
    });
  });

  describe('Given getAiSummary', () => {
    it('When called / Then returns summary', async () => {
      mockGet.mockResolvedValue({ data: { summary: 'AI text', cached: true } });
      const result = await insightApi.getAiSummary('revenue');
      expect(result.summary).toBe('AI text');
    });
  });

  describe('Given regenerateAiSummary', () => {
    it('When called / Then returns new summary', async () => {
      mockPost.mockResolvedValue({ data: { summary: 'New AI text', cached: false } });
      const result = await insightApi.regenerateAiSummary('revenue');
      expect(result.cached).toBe(false);
    });
  });
});
