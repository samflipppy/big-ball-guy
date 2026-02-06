/**
 * Stripe subscription helpers.
 *
 * Client-side utilities for managing Stripe-based subscriptions.
 * The actual Stripe API calls are proxied through Next.js API routes;
 * these helpers prepare the requests and define plan metadata.
 */

// ---- Plan types ----

export type PlanId = 'free' | 'pro' | 'team';

export interface PlanDetails {
  id: PlanId;
  name: string;
  monthlyPrice: number;   // dollars, 0 for free
  annualPrice: number;     // dollars per month when billed annually (2 months free)
  stripePriceIdMonthly: string | null;
  stripePriceIdAnnual: string | null;
  description: string;
  features: string[];
  limits: PlanLimits;
}

export interface PlanLimits {
  maxPlays: number;        // -1 = unlimited
  maxGamePlans: number;    // -1 = unlimited
  maxCoaches: number;      // -1 = unlimited
  canExport: boolean;
  canShare: boolean;
  realtimeCollab: boolean;
  prioritySupport: boolean;
}

export type PlanFeature =
  | 'plays'
  | 'gamePlans'
  | 'export'
  | 'share'
  | 'coaches'
  | 'realtimeCollab'
  | 'prioritySupport';

// ---- Plan definitions ----

export const PLANS: Record<PlanId, PlanDetails> = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    description: 'Get started with the basics',
    features: [
      'Up to 5 plays',
      '1 game plan',
      'Basic formations',
      'Community support',
    ],
    limits: {
      maxPlays: 5,
      maxGamePlans: 1,
      maxCoaches: 1,
      canExport: false,
      canShare: false,
      realtimeCollab: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 9.99,
    annualPrice: 8.33,  // ~$99.90/year = $8.33/mo (2 months free)
    stripePriceIdMonthly: 'price_pro_monthly',
    stripePriceIdAnnual: 'price_pro_annual',
    description: 'Everything you need to build a winning playbook',
    features: [
      'Unlimited plays',
      'Unlimited game plans',
      'PDF & image export',
      'Play sharing links',
      'Advanced formations',
      'Email support',
    ],
    limits: {
      maxPlays: -1,
      maxGamePlans: -1,
      maxCoaches: 1,
      canExport: true,
      canShare: true,
      realtimeCollab: false,
      prioritySupport: false,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    monthlyPrice: 24.99,
    annualPrice: 20.83,  // ~$249.90/year = $20.83/mo (2 months free)
    stripePriceIdMonthly: 'price_team_monthly',
    stripePriceIdAnnual: 'price_team_annual',
    description: 'Collaborate with your entire coaching staff',
    features: [
      'Everything in Pro',
      'Up to 10 coaches',
      'Real-time collaboration',
      'Priority support',
      'Team analytics',
      'Custom branding',
    ],
    limits: {
      maxPlays: -1,
      maxGamePlans: -1,
      maxCoaches: 10,
      canExport: true,
      canShare: true,
      realtimeCollab: true,
      prioritySupport: true,
    },
  },
};

// ---- Helper functions ----

/**
 * Redirect the user to a Stripe Checkout session for the given plan.
 * In production this calls a Next.js API route that creates the session server-side.
 */
export async function createCheckoutSession(
  planId: PlanId,
  teamId: string,
  annual = false,
): Promise<void> {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, teamId, annual }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const { url } = await response.json();
  window.location.href = url;
}

/**
 * Open the Stripe billing portal so the user can manage their subscription.
 */
export async function createPortalSession(teamId: string): Promise<void> {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId }),
  });

  if (!response.ok) {
    throw new Error('Failed to create portal session');
  }

  const { url } = await response.json();
  window.location.href = url;
}

/**
 * Get the limits for a given plan.
 */
export function getPlanLimits(plan: PlanId): PlanLimits {
  return PLANS[plan].limits;
}

/**
 * Check whether a specific feature is available on the given plan.
 */
export function isFeatureAvailable(plan: PlanId, feature: PlanFeature): boolean {
  const limits = PLANS[plan].limits;

  switch (feature) {
    case 'plays':
      return limits.maxPlays === -1;
    case 'gamePlans':
      return limits.maxGamePlans === -1;
    case 'export':
      return limits.canExport;
    case 'share':
      return limits.canShare;
    case 'coaches':
      return limits.maxCoaches > 1;
    case 'realtimeCollab':
      return limits.realtimeCollab;
    case 'prioritySupport':
      return limits.prioritySupport;
    default:
      return false;
  }
}

/**
 * Format a price for display. Returns "$0" for free, "$9.99" for paid plans.
 */
export function formatPrice(amount: number): string {
  if (amount === 0) return '$0';
  return `$${amount.toFixed(2)}`;
}

/**
 * Get all plan IDs in display order.
 */
export function getPlanIds(): PlanId[] {
  return ['free', 'pro', 'team'];
}
