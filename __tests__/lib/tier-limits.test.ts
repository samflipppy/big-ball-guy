import { describe, it, expect } from 'vitest';
import {
  TIER_LIMITS,
  checkLimit,
  getFeatureAccess,
  shouldShowUpgradePrompt,
} from '@/lib/tier-limits';

describe('tier-limits', () => {
  describe('TIER_LIMITS', () => {
    it('defines limits for free, pro, and team tiers', () => {
      expect(TIER_LIMITS.free).toBeDefined();
      expect(TIER_LIMITS.pro).toBeDefined();
      expect(TIER_LIMITS.team).toBeDefined();
    });

    it('free tier has 5 plays, 1 formation, no export', () => {
      expect(TIER_LIMITS.free.maxPlays).toBe(5);
      expect(TIER_LIMITS.free.maxFormations).toBe(1);
      expect(TIER_LIMITS.free.canExport).toBe(false);
    });

    it('pro tier has unlimited plays and all formations', () => {
      expect(TIER_LIMITS.pro.maxPlays).toBe(-1);
      expect(TIER_LIMITS.pro.maxFormations).toBe(-1);
      expect(TIER_LIMITS.pro.canExport).toBe(true);
    });

    it('team tier has everything plus collaboration', () => {
      expect(TIER_LIMITS.team.maxPlays).toBe(-1);
      expect(TIER_LIMITS.team.maxFormations).toBe(-1);
      expect(TIER_LIMITS.team.canExport).toBe(true);
      expect(TIER_LIMITS.team.canCollaborate).toBe(true);
    });

    it('free tier does not allow sharing', () => {
      expect(TIER_LIMITS.free.canShare).toBe(false);
    });

    it('pro tier allows sharing but not collaboration', () => {
      expect(TIER_LIMITS.pro.canShare).toBe(true);
      expect(TIER_LIMITS.pro.canCollaborate).toBe(false);
    });

    it('team tier has 10 max coaches', () => {
      expect(TIER_LIMITS.team.maxCoaches).toBe(10);
    });

    it('free and pro tiers have 1 max coach', () => {
      expect(TIER_LIMITS.free.maxCoaches).toBe(1);
      expect(TIER_LIMITS.pro.maxCoaches).toBe(1);
    });
  });

  describe('checkLimit', () => {
    it('allows plays under the free limit', () => {
      const result = checkLimit('user-1', 'plays', 3, 'free');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.current).toBe(3);
    });

    it('blocks plays at the free limit', () => {
      const result = checkLimit('user-1', 'plays', 5, 'free');
      expect(result.allowed).toBe(false);
      expect(result.upgradeMessage).toBeDefined();
      expect(result.upgradeMessage).toContain('Pro');
    });

    it('allows unlimited plays on pro', () => {
      const result = checkLimit('user-1', 'plays', 1000, 'pro');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
    });

    it('blocks export on free tier', () => {
      const result = checkLimit('user-1', 'export', 0, 'free');
      expect(result.allowed).toBe(false);
      expect(result.upgradeMessage).toContain('export');
    });

    it('allows export on pro tier', () => {
      const result = checkLimit('user-1', 'export', 0, 'pro');
      expect(result.allowed).toBe(true);
    });

    it('blocks collaboration on pro tier', () => {
      const result = checkLimit('user-1', 'collaborate', 0, 'pro');
      expect(result.allowed).toBe(false);
      expect(result.upgradeMessage).toContain('Team');
    });

    it('allows collaboration on team tier', () => {
      const result = checkLimit('user-1', 'collaborate', 0, 'team');
      expect(result.allowed).toBe(true);
    });

    it('allows unknown features by default', () => {
      const result = checkLimit('user-1', 'unknown-feature', 0, 'free');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
    });

    it('throws for unknown tier', () => {
      expect(() => checkLimit('user-1', 'plays', 0, 'enterprise' as never)).toThrow('Unknown tier');
    });

    it('checks formations limit on free tier', () => {
      const result = checkLimit('user-1', 'formations', 1, 'free');
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(1);
    });
  });

  describe('getFeatureAccess', () => {
    it('returns the full feature matrix for free tier', () => {
      const matrix = getFeatureAccess('free');
      expect(matrix.tier).toBe('free');
      expect(matrix.features.maxPlays).toBe(5);
      expect(matrix.features.canExport).toBe(false);
      expect(matrix.features.canCollaborate).toBe(false);
    });

    it('returns the full feature matrix for pro tier', () => {
      const matrix = getFeatureAccess('pro');
      expect(matrix.tier).toBe('pro');
      expect(matrix.features.maxPlays).toBe(-1);
      expect(matrix.features.canExport).toBe(true);
    });

    it('returns the full feature matrix for team tier', () => {
      const matrix = getFeatureAccess('team');
      expect(matrix.tier).toBe('team');
      expect(matrix.features.canCollaborate).toBe(true);
      expect(matrix.features.canCustomBrand).toBe(true);
    });

    it('includes the limits object', () => {
      const matrix = getFeatureAccess('free');
      expect(matrix.limits).toEqual(TIER_LIMITS.free);
    });

    it('throws for unknown tier', () => {
      expect(() => getFeatureAccess('enterprise')).toThrow('Unknown tier');
    });
  });

  describe('shouldShowUpgradePrompt', () => {
    it('shows upgrade prompt for export on free tier', () => {
      expect(shouldShowUpgradePrompt('free', 'export')).toBe(true);
    });

    it('does not show upgrade prompt for export on pro tier', () => {
      expect(shouldShowUpgradePrompt('pro', 'export')).toBe(false);
    });

    it('shows upgrade prompt for collaboration on free tier', () => {
      expect(shouldShowUpgradePrompt('free', 'collaborate')).toBe(true);
    });

    it('shows upgrade prompt for collaboration on pro tier', () => {
      expect(shouldShowUpgradePrompt('pro', 'collaborate')).toBe(true);
    });

    it('never shows upgrade prompt on team tier', () => {
      expect(shouldShowUpgradePrompt('team', 'export')).toBe(false);
      expect(shouldShowUpgradePrompt('team', 'collaborate')).toBe(false);
      expect(shouldShowUpgradePrompt('team', 'plays')).toBe(false);
    });

    it('shows upgrade prompt for plays on free tier', () => {
      expect(shouldShowUpgradePrompt('free', 'plays')).toBe(true);
    });

    it('does not show upgrade prompt for plays on pro tier', () => {
      expect(shouldShowUpgradePrompt('pro', 'plays')).toBe(false);
    });

    it('returns false for unknown tier', () => {
      expect(shouldShowUpgradePrompt('enterprise', 'export')).toBe(false);
    });

    it('returns false for unknown features', () => {
      expect(shouldShowUpgradePrompt('free', 'nonexistent')).toBe(false);
    });
  });
});
