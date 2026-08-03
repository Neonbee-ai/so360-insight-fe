import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockGet, mockPost, mockPut } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    }),
  },
}));

import { insightApi } from './insightApi';

describe('insightApi', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
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

  describe('Given getAlerts', () => {
    it('When filters provided / Then passes params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], total: 0 } });
      await insightApi.getAlerts({ severity: 'critical', page: 1, limit: 10 });
      expect(mockGet).toHaveBeenCalledWith('/alerts', { params: expect.objectContaining({ severity: 'critical' }) });
    });
  });

  describe('Given resolveAlert', () => {
    it('When called / Then sends POST', async () => {
      mockPost.mockResolvedValue({ data: { id: 's1', resolved_at: '2024-01-01' } });
      const result = await insightApi.resolveAlert('s1', 'Done');
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

  describe('Given getTargets', () => {
    it('When called / Then returns target rows', async () => {
      mockGet.mockResolvedValue({ data: [{ id: 't1', kpi_code: 'revenue', target_value: 100000 }] });
      const result = await insightApi.getTargets();
      expect(result[0].kpi_code).toBe('revenue');
    });
  });

  describe('Given setTarget', () => {
    it('When called / Then sends PUT with target_value body', async () => {
      mockPut.mockResolvedValue({ data: { id: 't1', kpi_code: 'revenue', target_value: 120000 } });
      const result = await insightApi.setTarget('revenue', 120000);
      expect(mockPut).toHaveBeenCalledWith('/targets/revenue', { target_value: 120000 });
      expect(result.target_value).toBe(120000);
    });

    it('When called / Then invalidates cached dashboard data so the next fetch refetches', async () => {
      mockGet.mockResolvedValue({ data: { kpis: [] } });
      await insightApi.getDashboard();

      mockPut.mockResolvedValue({ data: { id: 't1', kpi_code: 'revenue', target_value: 120000 } });
      await insightApi.setTarget('revenue', 120000);

      mockGet.mockReset();
      mockGet.mockResolvedValue({ data: { kpis: [{ kpi_code: 'revenue' }] } });
      await insightApi.getDashboard();
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('Given getCorrelations', () => {
    it('When called / Then returns correlation pairs', async () => {
      mockGet.mockResolvedValue({ data: [{ kpi_code_a: 'a', kpi_code_b: 'b', correlation: 0.8, direction: 'same' }] });
      const result = await insightApi.getCorrelations();
      expect(result[0].direction).toBe('same');
    });
  });

  describe('Given the bounded response cache', () => {
    beforeEach(async () => {
      // Isolate: clear the module-global cache between cases.
      mockPost.mockResolvedValue({ data: { status: 'refreshed' } });
      await insightApi.refreshInsight();
      mockGet.mockReset();
      mockPost.mockReset();
    });

    it('When the same key is read twice within TTL / Then the network is hit only once (cache-hit path)', async () => {
      mockGet.mockResolvedValue({ data: { kpis: [] } });
      await insightApi.getDashboard();
      await insightApi.getDashboard();
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('When refreshInsight() invalidates everything / Then the next read refetches', async () => {
      mockGet.mockResolvedValue({ data: { v: 1 } });
      await insightApi.getDashboard();

      mockPost.mockResolvedValue({ data: { status: 'refreshed' } });
      await insightApi.refreshInsight();

      mockGet.mockResolvedValue({ data: { v: 2 } });
      const after = await insightApi.getDashboard();
      expect(after).toEqual({ v: 2 });
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('When regenerateAiSummary() invalidates only its prefix / Then other cached keys survive', async () => {
      mockGet.mockResolvedValue({ data: { kind: 'ai' } });
      await insightApi.getAiSummary('a');
      mockGet.mockResolvedValue({ data: { kind: 'chart' } });
      await insightApi.getChartData('a', 'line');

      mockPost.mockResolvedValue({ data: { regenerated: true } });
      await insightApi.regenerateAiSummary('a');

      mockGet.mockReset();
      mockGet.mockResolvedValue({ data: { kind: 'ai2' } });
      // ai-summary:a was invalidated -> refetch hits the network
      await insightApi.getAiSummary('a');
      expect(mockGet).toHaveBeenCalledTimes(1);
      // chart:a:line was NOT invalidated -> still served from cache (no new call)
      await insightApi.getChartData('a', 'line');
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });
});
