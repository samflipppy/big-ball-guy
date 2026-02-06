import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PLANS,
  getPlanLimits,
  isFeatureAvailable,
  formatPrice,
  getPlanIds,
  createCheckoutSession,
  createPortalSession,
  type PlanId,
  type PlanFeature,
} from '@/lib/stripe';

describe('stripe helpers', () => {
  describe('PLANS', () => {
    it('defines three plans: free, pro, team', () => {
      expect(Object.keys(PLANS)).toEqual(['free', 'pro', 'team']);
    });

    it('free plan has correct pricing', () => {
      expect(PLANS.free.monthlyPrice).toBe(0);
      expect(PLANS.free.annualPrice).toBe(0);
    });

    it('pro plan has $9.99/mo pricing', () => {
      expect(PLANS.pro.monthlyPrice).toBe(9.99);
    });

    it('team plan has $24.99/mo pricing', () => {
      expect(PLANS.team.monthlyPrice).toBe(24.99);
    });

    it('annual pricing gives roughly 2 months free', () => {
      // Pro: $9.99 * 10 / 12 ~ $8.33
      expect(PLANS.pro.annualPrice).toBeLessThan(PLANS.pro.monthlyPrice);
      // Team: $24.99 * 10 / 12 ~ $20.83
      expect(PLANS.team.annualPrice).toBeLessThan(PLANS.team.monthlyPrice);
    });

    it('free plan has no Stripe price IDs', () => {
      expect(PLANS.free.stripePriceIdMonthly).toBeNull();
      expect(PLANS.free.stripePriceIdAnnual).toBeNull();
    });

    it('paid plans have Stripe price IDs', () => {
      expect(PLANS.pro.stripePriceIdMonthly).toBeTruthy();
      expect(PLANS.pro.stripePriceIdAnnual).toBeTruthy();
      expect(PLANS.team.stripePriceIdMonthly).toBeTruthy();
      expect(PLANS.team.stripePriceIdAnnual).toBeTruthy();
    });
  });

  describe('getPlanLimits', () => {
    it('returns correct limits for free plan', () => {
      const limits = getPlanLimits('free');
      expect(limits.maxPlays).toBe(5);
      expect(limits.maxGamePlans).toBe(1);
      expect(limits.maxCoaches).toBe(1);
      expect(limits.canExport).toBe(false);
      expect(limits.canShare).toBe(false);
      expect(limits.realtimeCollab).toBe(false);
      expect(limits.prioritySupport).toBe(false);
    });

    it('returns correct limits for pro plan', () => {
      const limits = getPlanLimits('pro');
      expect(limits.maxPlays).toBe(-1);
      expect(limits.maxGamePlans).toBe(-1);
      expect(limits.maxCoaches).toBe(1);
      expect(limits.canExport).toBe(true);
      expect(limits.canShare).toBe(true);
      expect(limits.realtimeCollab).toBe(false);
      expect(limits.prioritySupport).toBe(false);
    });

    it('returns correct limits for team plan', () => {
      const limits = getPlanLimits('team');
      expect(limits.maxPlays).toBe(-1);
      expect(limits.maxGamePlans).toBe(-1);
      expect(limits.maxCoaches).toBe(10);
      expect(limits.canExport).toBe(true);
      expect(limits.canShare).toBe(true);
      expect(limits.realtimeCollab).toBe(true);
      expect(limits.prioritySupport).toBe(true);
    });
  });

  describe('isFeatureAvailable', () => {
    it('unlimited plays is not available on free', () => {
      expect(isFeatureAvailable('free', 'plays')).toBe(false);
    });

    it('unlimited plays is available on pro', () => {
      expect(isFeatureAvailable('pro', 'plays')).toBe(true);
    });

    it('unlimited plays is available on team', () => {
      expect(isFeatureAvailable('team', 'plays')).toBe(true);
    });

    it('export is not available on free', () => {
      expect(isFeatureAvailable('free', 'export')).toBe(false);
    });

    it('export is available on pro', () => {
      expect(isFeatureAvailable('pro', 'export')).toBe(true);
    });

    it('sharing is not available on free', () => {
      expect(isFeatureAvailable('free', 'share')).toBe(false);
    });

    it('sharing is available on pro', () => {
      expect(isFeatureAvailable('pro', 'share')).toBe(true);
    });

    it('multiple coaches is not available on free or pro', () => {
      expect(isFeatureAvailable('free', 'coaches')).toBe(false);
      expect(isFeatureAvailable('pro', 'coaches')).toBe(false);
    });

    it('multiple coaches is available on team', () => {
      expect(isFeatureAvailable('team', 'coaches')).toBe(true);
    });

    it('realtime collab is only available on team', () => {
      expect(isFeatureAvailable('free', 'realtimeCollab')).toBe(false);
      expect(isFeatureAvailable('pro', 'realtimeCollab')).toBe(false);
      expect(isFeatureAvailable('team', 'realtimeCollab')).toBe(true);
    });

    it('priority support is only available on team', () => {
      expect(isFeatureAvailable('free', 'prioritySupport')).toBe(false);
      expect(isFeatureAvailable('pro', 'prioritySupport')).toBe(false);
      expect(isFeatureAvailable('team', 'prioritySupport')).toBe(true);
    });

    it('unlimited game plans not available on free', () => {
      expect(isFeatureAvailable('free', 'gamePlans')).toBe(false);
    });

    it('unlimited game plans available on pro and team', () => {
      expect(isFeatureAvailable('pro', 'gamePlans')).toBe(true);
      expect(isFeatureAvailable('team', 'gamePlans')).toBe(true);
    });
  });

  describe('formatPrice', () => {
    it('returns "$0" for zero', () => {
      expect(formatPrice(0)).toBe('$0');
    });

    it('formats whole dollar amounts with two decimal places', () => {
      expect(formatPrice(9.99)).toBe('$9.99');
    });

    it('formats team price', () => {
      expect(formatPrice(24.99)).toBe('$24.99');
    });

    it('formats annual prices', () => {
      expect(formatPrice(8.33)).toBe('$8.33');
    });
  });

  describe('getPlanIds', () => {
    it('returns plan IDs in display order', () => {
      expect(getPlanIds()).toEqual(['free', 'pro', 'team']);
    });
  });

  describe('createCheckoutSession', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('calls the checkout API endpoint and redirects', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/session123' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      // Mock window.location.href
      const hrefSetter = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window.location, 'href', {
        set: hrefSetter,
        get: () => '',
        configurable: true,
      });

      await createCheckoutSession('pro', 'team-123', false);

      expect(mockFetch).toHaveBeenCalledWith('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'pro', teamId: 'team-123', annual: false }),
      });
    });

    it('throws on API error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false }),
      );

      await expect(createCheckoutSession('pro', 'team-123')).rejects.toThrow(
        'Failed to create checkout session',
      );
    });
  });

  describe('createPortalSession', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('calls the portal API endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ url: 'https://billing.stripe.com/portal123' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true,
      });

      await createPortalSession('team-456');

      expect(mockFetch).toHaveBeenCalledWith('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: 'team-456' }),
      });
    });

    it('throws on API error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false }),
      );

      await expect(createPortalSession('team-456')).rejects.toThrow(
        'Failed to create portal session',
      );
    });
  });
});
