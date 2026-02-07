import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ENVIRONMENT_CONFIGS,
  getCurrentEnvironment,
  isFeatureEnabled,
  getEnvironmentBadge,
} from '@/lib/ci/environment-config';
import type { Environment, EnvironmentConfig, EnvironmentBadge } from '@/lib/ci/environment-config';

describe('environment-config', () => {
  // ---- ENVIRONMENT_CONFIGS ----
  describe('ENVIRONMENT_CONFIGS', () => {
    it('defines configs for all three environments', () => {
      expect(ENVIRONMENT_CONFIGS.development).toBeDefined();
      expect(ENVIRONMENT_CONFIGS.staging).toBeDefined();
      expect(ENVIRONMENT_CONFIGS.production).toBeDefined();
    });

    it('each config has the required fields', () => {
      for (const env of ['development', 'staging', 'production'] as Environment[]) {
        const config = ENVIRONMENT_CONFIGS[env];
        expect(config.name).toBe(env);
        expect(config.supabaseUrl).toBeTruthy();
        expect(config.supabaseKey).toBeTruthy();
        expect(config.stripeKey).toBeTruthy();
        expect(Array.isArray(config.features)).toBe(true);
      }
    });

    it('development has the most features enabled', () => {
      const devCount = ENVIRONMENT_CONFIGS.development.features.length;
      const stagingCount = ENVIRONMENT_CONFIGS.staging.features.length;
      const prodCount = ENVIRONMENT_CONFIGS.production.features.length;
      expect(devCount).toBeGreaterThanOrEqual(stagingCount);
      expect(stagingCount).toBeGreaterThanOrEqual(prodCount);
    });

    it('production uses live stripe key prefix', () => {
      expect(ENVIRONMENT_CONFIGS.production.stripeKey).toMatch(/^sk_live/);
    });

    it('staging has an analytics ID', () => {
      expect(ENVIRONMENT_CONFIGS.staging.analyticsId).toBeTruthy();
    });
  });

  // ---- getCurrentEnvironment ----
  describe('getCurrentEnvironment', () => {
    const originalEnv = process.env.NEXT_PUBLIC_ENV;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_ENV = originalEnv;
      } else {
        delete process.env.NEXT_PUBLIC_ENV;
      }
    });

    it('returns environment from NEXT_PUBLIC_ENV when set', () => {
      process.env.NEXT_PUBLIC_ENV = 'staging';
      expect(getCurrentEnvironment()).toBe('staging');
    });

    it('returns development when NEXT_PUBLIC_ENV is not set (jsdom localhost)', () => {
      delete process.env.NEXT_PUBLIC_ENV;
      // jsdom defaults window.location.hostname to 'localhost'
      expect(getCurrentEnvironment()).toBe('development');
    });

    it('returns production for NEXT_PUBLIC_ENV=production', () => {
      process.env.NEXT_PUBLIC_ENV = 'production';
      expect(getCurrentEnvironment()).toBe('production');
    });
  });

  // ---- isFeatureEnabled ----
  describe('isFeatureEnabled', () => {
    it('returns true for debug-panel in development', () => {
      expect(isFeatureEnabled('debug-panel', 'development')).toBe(true);
    });

    it('returns false for debug-panel in production', () => {
      expect(isFeatureEnabled('debug-panel', 'production')).toBe(false);
    });

    it('returns true for ai-analysis in all environments', () => {
      expect(isFeatureEnabled('ai-analysis', 'development')).toBe(true);
      expect(isFeatureEnabled('ai-analysis', 'staging')).toBe(true);
      expect(isFeatureEnabled('ai-analysis', 'production')).toBe(true);
    });

    it('returns false for a nonexistent feature', () => {
      expect(isFeatureEnabled('nonexistent-feature', 'development')).toBe(false);
    });
  });

  // ---- getEnvironmentBadge ----
  describe('getEnvironmentBadge', () => {
    it('returns green for development', () => {
      const badge = getEnvironmentBadge('development');
      expect(badge.label).toBe('Development');
      expect(badge.color).toBe('#22c55e');
    });

    it('returns amber for staging', () => {
      const badge = getEnvironmentBadge('staging');
      expect(badge.label).toBe('Staging');
      expect(badge.color).toBe('#f59e0b');
    });

    it('returns red for production', () => {
      const badge = getEnvironmentBadge('production');
      expect(badge.label).toBe('Production');
      expect(badge.color).toBe('#ef4444');
    });
  });
});
