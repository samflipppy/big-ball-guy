/**
 * Free Tier Limits and Upgrade Prompts (#311)
 *
 * Defines per-plan limits, checks usage against them, and determines
 * when to show upgrade prompts.
 */

import type { PlanId } from '@/lib/stripe';

// ---- Types ----

export interface TierLimits {
  maxPlays: number;           // -1 = unlimited
  maxFormations: number;      // -1 = unlimited
  maxGamePlans: number;       // -1 = unlimited
  canExport: boolean;
  canShare: boolean;
  canCollaborate: boolean;
  canCustomBrand: boolean;
  maxCoaches: number;         // -1 = unlimited
}

export interface LimitCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  upgradeMessage?: string;
}

export interface FeatureMatrix {
  tier: string;
  limits: TierLimits;
  features: Record<string, boolean | number>;
}

// ---- Plan limit definitions ----

export const TIER_LIMITS: Record<PlanId, TierLimits> = {
  free: {
    maxPlays: 5,
    maxFormations: 1,
    maxGamePlans: 1,
    canExport: false,
    canShare: false,
    canCollaborate: false,
    canCustomBrand: false,
    maxCoaches: 1,
  },
  pro: {
    maxPlays: -1,
    maxFormations: -1,
    maxGamePlans: -1,
    canExport: true,
    canShare: true,
    canCollaborate: false,
    canCustomBrand: false,
    maxCoaches: 1,
  },
  team: {
    maxPlays: -1,
    maxFormations: -1,
    maxGamePlans: -1,
    canExport: true,
    canShare: true,
    canCollaborate: true,
    canCustomBrand: true,
    maxCoaches: 10,
  },
};

// ---- Upgrade messages ----

const UPGRADE_MESSAGES: Record<string, Record<string, string>> = {
  free: {
    plays: 'Upgrade to Pro for unlimited plays. You\'ve reached the free plan limit of 5 plays.',
    formations: 'Upgrade to Pro to create unlimited formations.',
    gamePlans: 'Upgrade to Pro for unlimited game plans.',
    export: 'Upgrade to Pro to export plays as PDF and images.',
    share: 'Upgrade to Pro to share plays with shareable links.',
    collaborate: 'Upgrade to Team to collaborate with your coaching staff in real-time.',
    customBrand: 'Upgrade to Team to add custom branding to your playbook.',
    coaches: 'Upgrade to Team to invite additional coaches.',
  },
  pro: {
    collaborate: 'Upgrade to Team to collaborate with your coaching staff in real-time.',
    customBrand: 'Upgrade to Team to add custom branding to your playbook.',
    coaches: 'Upgrade to Team to invite up to 10 coaches.',
  },
};

// ---- Feature-to-limit mapping ----

const NUMERIC_FEATURES: Record<string, keyof TierLimits> = {
  plays: 'maxPlays',
  formations: 'maxFormations',
  gamePlans: 'maxGamePlans',
  coaches: 'maxCoaches',
};

const BOOLEAN_FEATURES: Record<string, keyof TierLimits> = {
  export: 'canExport',
  share: 'canShare',
  collaborate: 'canCollaborate',
  customBrand: 'canCustomBrand',
};

// ---- Public API ----

/**
 * Check whether a user has reached the limit for a given feature.
 */
export function checkLimit(
  _userId: string,
  feature: string,
  currentCount: number,
  tier: PlanId = 'free',
): LimitCheckResult {
  const limits = TIER_LIMITS[tier];
  if (!limits) {
    throw new Error(`Unknown tier: ${tier}`);
  }

  // Boolean feature check
  const booleanKey = BOOLEAN_FEATURES[feature];
  if (booleanKey) {
    const allowed = limits[booleanKey] as boolean;
    return {
      allowed,
      limit: allowed ? 1 : 0,
      current: currentCount,
      upgradeMessage: allowed ? undefined : UPGRADE_MESSAGES[tier]?.[feature],
    };
  }

  // Numeric feature check
  const numericKey = NUMERIC_FEATURES[feature];
  if (numericKey) {
    const limit = limits[numericKey] as number;
    const isUnlimited = limit === -1;
    const allowed = isUnlimited || currentCount < limit;

    return {
      allowed,
      limit,
      current: currentCount,
      upgradeMessage: allowed ? undefined : UPGRADE_MESSAGES[tier]?.[feature],
    };
  }

  // Unknown feature -- allow by default
  return {
    allowed: true,
    limit: -1,
    current: currentCount,
  };
}

/**
 * Get the full feature matrix for a given tier.
 */
export function getFeatureAccess(tier: string): FeatureMatrix {
  const planId = tier as PlanId;
  const limits = TIER_LIMITS[planId];

  if (!limits) {
    throw new Error(`Unknown tier: ${tier}`);
  }

  const features: Record<string, boolean | number> = {
    maxPlays: limits.maxPlays,
    maxFormations: limits.maxFormations,
    maxGamePlans: limits.maxGamePlans,
    canExport: limits.canExport,
    canShare: limits.canShare,
    canCollaborate: limits.canCollaborate,
    canCustomBrand: limits.canCustomBrand,
    maxCoaches: limits.maxCoaches,
  };

  return { tier, limits, features };
}

/**
 * Determine whether an upgrade prompt should be shown for a given feature on the given tier.
 */
export function shouldShowUpgradePrompt(tier: string, feature: string): boolean {
  const planId = tier as PlanId;
  const limits = TIER_LIMITS[planId];

  if (!limits) {
    return false;
  }

  // Team plan is the highest -- never show upgrade prompts
  if (planId === 'team') {
    return false;
  }

  // Check boolean features
  const booleanKey = BOOLEAN_FEATURES[feature];
  if (booleanKey) {
    return !(limits[booleanKey] as boolean);
  }

  // Check numeric features -- show prompt if not unlimited
  const numericKey = NUMERIC_FEATURES[feature];
  if (numericKey) {
    return (limits[numericKey] as number) !== -1;
  }

  return false;
}
