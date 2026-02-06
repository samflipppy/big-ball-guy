/**
 * Referral Program (#315)
 *
 * Generate referral codes, apply referrals, track stats, and calculate rewards.
 */

// ---- Types ----

export interface ReferralReward {
  type: 'free-month' | 'discount' | 'feature-unlock';
  value: number; // months for free-month, percentage for discount, 1 for feature-unlock
  description: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  status: 'pending' | 'successful' | 'expired';
  reward?: ReferralReward;
  createdAt: string;
  completedAt?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  creditsEarned: number; // total free months earned
  rewards: ReferralReward[];
}

export interface ReferralCodeInfo {
  code: string;
  userId: string;
  createdAt: string;
  shareUrl: string;
}

// ---- In-memory stores (simulates database) ----

const referralCodeStore = new Map<string, ReferralCodeInfo>();
const referralRecordStore = new Map<string, ReferralRecord>();

/** Reset stores -- exposed for testing */
export function _resetStores(): void {
  referralCodeStore.clear();
  referralRecordStore.clear();
}

/** Get records -- exposed for testing */
export function _getRecords(): ReferralRecord[] {
  return Array.from(referralRecordStore.values());
}

// ---- Helpers ----

function generateId(): string {
  return `ref_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://app.playbook.com';
}

// ---- Public API ----

/**
 * Generate a unique referral code for a user.
 * If the user already has a code, returns the existing one.
 */
export function generateReferralCode(userId: string): ReferralCodeInfo {
  if (!userId || userId.trim() === '') {
    throw new Error('User ID is required');
  }

  // Check if user already has a code
  for (const info of referralCodeStore.values()) {
    if (info.userId === userId) {
      return info;
    }
  }

  // Generate a unique code: 8-char alphanumeric
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const baseUrl = getBaseUrl();
  const info: ReferralCodeInfo = {
    code,
    userId,
    createdAt: new Date().toISOString(),
    shareUrl: `${baseUrl}/join?ref=${code}`,
  };

  referralCodeStore.set(code, info);

  return info;
}

/**
 * Apply a referral code for a new user. Records the referral.
 */
export function applyReferral(
  referralCode: string,
  newUserId: string,
): ReferralRecord {
  if (!referralCode || referralCode.trim() === '') {
    throw new Error('Referral code is required');
  }

  if (!newUserId || newUserId.trim() === '') {
    throw new Error('New user ID is required');
  }

  const codeInfo = referralCodeStore.get(referralCode.toUpperCase());
  if (!codeInfo) {
    throw new Error(`Invalid referral code: ${referralCode}`);
  }

  // Cannot refer yourself
  if (codeInfo.userId === newUserId) {
    throw new Error('Cannot use your own referral code');
  }

  // Check if this user was already referred
  for (const record of referralRecordStore.values()) {
    if (record.referredUserId === newUserId) {
      throw new Error('User has already been referred');
    }
  }

  const record: ReferralRecord = {
    id: generateId(),
    referrerId: codeInfo.userId,
    referredUserId: newUserId,
    referralCode: referralCode.toUpperCase(),
    status: 'successful',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  // Calculate reward for this referral
  const stats = getReferralStats(codeInfo.userId);
  const reward = calculateReward('free', stats.successfulReferrals + 1);
  record.reward = reward;

  referralRecordStore.set(record.id, record);

  return record;
}

/**
 * Get referral statistics for a user.
 */
export function getReferralStats(userId: string): ReferralStats {
  if (!userId || userId.trim() === '') {
    throw new Error('User ID is required');
  }

  const records: ReferralRecord[] = [];
  for (const record of referralRecordStore.values()) {
    if (record.referrerId === userId) {
      records.push(record);
    }
  }

  const successful = records.filter((r) => r.status === 'successful');
  const pending = records.filter((r) => r.status === 'pending');

  const rewards = successful
    .map((r) => r.reward)
    .filter((r): r is ReferralReward => r !== undefined);

  const creditsEarned = rewards
    .filter((r) => r.type === 'free-month')
    .reduce((sum, r) => sum + r.value, 0);

  return {
    totalReferrals: records.length,
    successfulReferrals: successful.length,
    pendingReferrals: pending.length,
    creditsEarned,
    rewards,
  };
}

/**
 * Calculate the reward for a referral based on the tier and number of referrals.
 *
 * Reward tiers:
 * - 1-3 referrals: 1 free month each
 * - 4-9 referrals: 2 free months each
 * - 10+ referrals: 15% discount + feature unlock
 */
export function calculateReward(
  tier: string,
  referralCount: number,
): ReferralReward {
  if (referralCount <= 0) {
    return {
      type: 'free-month',
      value: 0,
      description: 'No referrals yet',
    };
  }

  if (referralCount <= 3) {
    return {
      type: 'free-month',
      value: 1,
      description: '1 free month of Pro for your referral!',
    };
  }

  if (referralCount <= 9) {
    return {
      type: 'free-month',
      value: 2,
      description: '2 free months of Pro for being a super referrer!',
    };
  }

  // 10+ referrals
  return {
    type: 'discount',
    value: 15,
    description: '15% lifetime discount for being an elite referrer!',
  };
}
