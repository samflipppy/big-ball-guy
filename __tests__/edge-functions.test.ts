import { describe, it, expect } from 'vitest';
import {
  EDGE_FUNCTIONS,
  invokeEdgeFunction,
  getEdgeFunctionStatus,
  estimateComputeTime,
} from '@/lib/edge/edge-functions';
import type { EdgeFunctionConfig, EdgeFunctionResult, EdgeFunctionHealth } from '@/lib/edge/edge-functions';

describe('edge-functions', () => {
  // ---- EDGE_FUNCTIONS config ----
  describe('EDGE_FUNCTIONS', () => {
    it('defines all four expected edge functions', () => {
      expect(EDGE_FUNCTIONS['blocking-auto-assign']).toBeDefined();
      expect(EDGE_FUNCTIONS['matrix-generation']).toBeDefined();
      expect(EDGE_FUNCTIONS['pdf-generation']).toBeDefined();
      expect(EDGE_FUNCTIONS['play-analysis']).toBeDefined();
    });

    it('each config has the required shape', () => {
      for (const [key, config] of Object.entries(EDGE_FUNCTIONS)) {
        expect(config.name).toBe(key);
        expect(config.route).toMatch(/^\/functions\/v1\//);
        expect(config.maxDuration).toBeGreaterThan(0);
        expect(config.memory).toBeGreaterThan(0);
        expect(config.regions.length).toBeGreaterThan(0);
      }
    });

    it('pdf-generation has the highest memory allocation', () => {
      const memories = Object.values(EDGE_FUNCTIONS).map((c) => c.memory);
      expect(EDGE_FUNCTIONS['pdf-generation'].memory).toBe(Math.max(...memories));
    });
  });

  // ---- invokeEdgeFunction ----
  describe('invokeEdgeFunction', () => {
    it('returns success for a known function', async () => {
      const result = await invokeEdgeFunction('blocking-auto-assign', { playId: '123' });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.region).toBe(EDGE_FUNCTIONS['blocking-auto-assign'].regions[0]);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('returns an error for an unknown function', async () => {
      const result = await invokeEdgeFunction('nonexistent', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown edge function');
      expect(result.duration).toBe(0);
      expect(result.region).toBe('unknown');
    });

    it('includes payload info in the mock response data', async () => {
      const payload = { teamId: 'team_1', plays: [1, 2, 3] };
      const result = await invokeEdgeFunction('play-analysis', payload);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.functionName).toBe('play-analysis');
      expect(data.input).toEqual(payload);
    });

    it('reports a positive duration for successful calls', async () => {
      const result = await invokeEdgeFunction('matrix-generation', { size: 10 });
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  // ---- getEdgeFunctionStatus ----
  describe('getEdgeFunctionStatus', () => {
    it('returns healthy status for a known function', async () => {
      const status = await getEdgeFunctionStatus('pdf-generation');
      expect(status.name).toBe('pdf-generation');
      expect(status.healthy).toBe(true);
      expect(status.latency).toBeGreaterThanOrEqual(0);
      expect(status.region).toBe(EDGE_FUNCTIONS['pdf-generation'].regions[0]);
      expect(status.lastChecked).toBeTruthy();
    });

    it('returns unhealthy status for an unknown function', async () => {
      const status = await getEdgeFunctionStatus('unknown-fn');
      expect(status.healthy).toBe(false);
      expect(status.latency).toBe(-1);
      expect(status.region).toBe('unknown');
    });
  });

  // ---- estimateComputeTime ----
  describe('estimateComputeTime', () => {
    it('returns base time for zero input size', () => {
      const time = estimateComputeTime('blocking-auto-assign', 0);
      expect(time).toBe(200); // base cost
    });

    it('scales linearly with input size', () => {
      const time10 = estimateComputeTime('play-analysis', 10);
      const time20 = estimateComputeTime('play-analysis', 20);
      // play-analysis: base 300 + 25*n
      expect(time10).toBe(300 + 25 * 10);
      expect(time20).toBe(300 + 25 * 20);
      expect(time20 - time10).toBe(25 * 10);
    });

    it('caps at maxDuration', () => {
      const time = estimateComputeTime('blocking-auto-assign', 100_000);
      expect(time).toBe(EDGE_FUNCTIONS['blocking-auto-assign'].maxDuration);
    });

    it('returns -1 for an unknown function', () => {
      expect(estimateComputeTime('no-such-fn', 5)).toBe(-1);
    });
  });
});
