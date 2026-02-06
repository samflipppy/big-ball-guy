import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateReferralCode,
  applyReferral,
  getReferralStats,
  calculateReward,
  _resetStores,
  _getRecords,
} from '@/lib/referral';

describe('referral', () => {
  beforeEach(() => {
    _resetStores();
  });

  describe('generateReferralCode', () => {
    it('generates a referral code for a user', () => {
      const info = generateReferralCode('user-1');
      expect(info.code).toBeTruthy();
      expect(info.code.length).toBe(8);
      expect(info.userId).toBe('user-1');
    });

    it('generates a share URL containing the code', () => {
      const info = generateReferralCode('user-1');
      expect(info.shareUrl).toContain(`ref=${info.code}`);
      expect(info.shareUrl).toContain('/join');
    });

    it('returns the same code if called twice for the same user', () => {
      const info1 = generateReferralCode('user-1');
      const info2 = generateReferralCode('user-1');
      expect(info1.code).toBe(info2.code);
    });

    it('generates different codes for different users', () => {
      const info1 = generateReferralCode('user-1');
      const info2 = generateReferralCode('user-2');
      expect(info1.code).not.toBe(info2.code);
    });

    it('throws for empty user ID', () => {
      expect(() => generateReferralCode('')).toThrow('User ID is required');
    });

    it('sets createdAt timestamp', () => {
      const info = generateReferralCode('user-1');
      expect(info.createdAt).toBeDefined();
      const date = new Date(info.createdAt);
      expect(date.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('uses only non-ambiguous characters', () => {
      const info = generateReferralCode('user-1');
      // Should not contain O, 0, I, 1, L
      expect(info.code).not.toMatch(/[OIL01]/);
    });

    it('throws for whitespace-only user ID', () => {
      expect(() => generateReferralCode('   ')).toThrow('User ID is required');
    });
  });

  describe('applyReferral', () => {
    it('records a successful referral', () => {
      const { code } = generateReferralCode('referrer');
      const record = applyReferral(code, 'new-user');
      expect(record.referrerId).toBe('referrer');
      expect(record.referredUserId).toBe('new-user');
      expect(record.status).toBe('successful');
    });

    it('assigns a reward to the referral', () => {
      const { code } = generateReferralCode('referrer');
      const record = applyReferral(code, 'new-user');
      expect(record.reward).toBeDefined();
      expect(record.reward!.type).toBe('free-month');
    });

    it('throws for invalid referral code', () => {
      expect(() => applyReferral('INVALIDCODE', 'new-user')).toThrow('Invalid referral code');
    });

    it('throws when user tries to refer themselves', () => {
      const { code } = generateReferralCode('user-1');
      expect(() => applyReferral(code, 'user-1')).toThrow('Cannot use your own referral code');
    });

    it('throws when user has already been referred', () => {
      const { code: code1 } = generateReferralCode('referrer-1');
      const { code: code2 } = generateReferralCode('referrer-2');
      applyReferral(code1, 'new-user');
      expect(() => applyReferral(code2, 'new-user')).toThrow('already been referred');
    });

    it('throws for empty referral code', () => {
      expect(() => applyReferral('', 'new-user')).toThrow('Referral code is required');
    });

    it('throws for empty new user ID', () => {
      const { code } = generateReferralCode('referrer');
      expect(() => applyReferral(code, '')).toThrow('New user ID is required');
    });

    it('is case-insensitive for referral codes', () => {
      const { code } = generateReferralCode('referrer');
      const record = applyReferral(code.toLowerCase(), 'new-user');
      expect(record.referrerId).toBe('referrer');
    });
  });

  describe('getReferralStats', () => {
    it('returns zero stats for a user with no referrals', () => {
      const stats = getReferralStats('user-no-refs');
      expect(stats.totalReferrals).toBe(0);
      expect(stats.successfulReferrals).toBe(0);
      expect(stats.creditsEarned).toBe(0);
    });

    it('counts successful referrals', () => {
      const { code } = generateReferralCode('referrer');
      applyReferral(code, 'new-1');
      applyReferral(code, 'new-2');
      applyReferral(code, 'new-3');

      const stats = getReferralStats('referrer');
      expect(stats.totalReferrals).toBe(3);
      expect(stats.successfulReferrals).toBe(3);
    });

    it('calculates credits earned from free-month rewards', () => {
      const { code } = generateReferralCode('referrer');
      applyReferral(code, 'new-1');
      applyReferral(code, 'new-2');

      const stats = getReferralStats('referrer');
      expect(stats.creditsEarned).toBeGreaterThan(0);
    });

    it('includes rewards in the stats', () => {
      const { code } = generateReferralCode('referrer');
      applyReferral(code, 'new-1');

      const stats = getReferralStats('referrer');
      expect(stats.rewards.length).toBe(1);
      expect(stats.rewards[0].type).toBe('free-month');
    });

    it('throws for empty user ID', () => {
      expect(() => getReferralStats('')).toThrow('User ID is required');
    });
  });

  describe('calculateReward', () => {
    it('returns 0 value for no referrals', () => {
      const reward = calculateReward('free', 0);
      expect(reward.value).toBe(0);
    });

    it('returns 1 free month for 1-3 referrals', () => {
      expect(calculateReward('free', 1).type).toBe('free-month');
      expect(calculateReward('free', 1).value).toBe(1);
      expect(calculateReward('free', 3).value).toBe(1);
    });

    it('returns 2 free months for 4-9 referrals', () => {
      expect(calculateReward('free', 4).type).toBe('free-month');
      expect(calculateReward('free', 4).value).toBe(2);
      expect(calculateReward('free', 9).value).toBe(2);
    });

    it('returns 15% discount for 10+ referrals', () => {
      const reward = calculateReward('free', 10);
      expect(reward.type).toBe('discount');
      expect(reward.value).toBe(15);
    });

    it('includes a description for each reward tier', () => {
      expect(calculateReward('free', 1).description).toBeTruthy();
      expect(calculateReward('free', 5).description).toBeTruthy();
      expect(calculateReward('free', 10).description).toBeTruthy();
      expect(calculateReward('free', 0).description).toBeTruthy();
    });

    it('works with different tier strings', () => {
      const reward = calculateReward('pro', 2);
      expect(reward.type).toBe('free-month');
      expect(reward.value).toBe(1);
    });

    it('returns discount for large referral counts', () => {
      const reward = calculateReward('free', 50);
      expect(reward.type).toBe('discount');
      expect(reward.value).toBe(15);
    });

    it('handles boundary between tiers correctly', () => {
      // 3 => 1 free month, 4 => 2 free months
      expect(calculateReward('free', 3).value).toBe(1);
      expect(calculateReward('free', 4).value).toBe(2);
      // 9 => 2 free months, 10 => discount
      expect(calculateReward('free', 9).type).toBe('free-month');
      expect(calculateReward('free', 10).type).toBe('discount');
    });
  });
});
