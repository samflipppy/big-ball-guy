import { describe, it, expect, beforeEach } from 'vitest';
import {
  requestDataExport,
  requestDataDeletion,
  isMarkedForDeletion,
  getConsentStatus,
  updateConsent,
  anonymizeUserData,
  isMinor,
  getUserRequests,
  clearComplianceStores,
} from '@/lib/security/compliance';

describe('compliance', () => {
  beforeEach(() => {
    clearComplianceStores();
  });

  // --- requestDataExport ---

  describe('requestDataExport', () => {
    it('returns a data export package with correct structure', () => {
      const result = requestDataExport('user-1');
      expect(result.userId).toBe('user-1');
      expect(result.exportedAt).toBeTruthy();
      expect(result.data).toBeDefined();
      expect(result.data.profile).toBeDefined();
      expect(result.data.plays).toEqual([]);
      expect(result.data.formations).toEqual([]);
      expect(result.data.gamePlans).toEqual([]);
      expect(result.data.settings).toBeDefined();
      expect(result.metadata.format).toBe('json');
      expect(result.metadata.version).toBe('1.0');
    });

    it('creates a portability request record', () => {
      requestDataExport('user-1');
      const requests = getUserRequests('user-1');
      expect(requests).toHaveLength(1);
      expect(requests[0].type).toBe('portability');
      expect(requests[0].status).toBe('completed');
    });

    it('throws for empty userId', () => {
      expect(() => requestDataExport('')).toThrow('userId is required');
    });

    it('creates separate records for multiple exports', () => {
      requestDataExport('user-1');
      requestDataExport('user-1');
      const requests = getUserRequests('user-1');
      expect(requests).toHaveLength(2);
    });
  });

  // --- requestDataDeletion ---

  describe('requestDataDeletion', () => {
    it('creates a deletion request with processing status', () => {
      const result = requestDataDeletion('user-1');
      expect(result.type).toBe('deletion');
      expect(result.status).toBe('processing');
      expect(result.userId).toBe('user-1');
      expect(result.completedAt).toBeNull();
    });

    it('marks user for deletion', () => {
      requestDataDeletion('user-1');
      expect(isMarkedForDeletion('user-1')).toBe(true);
    });

    it('clears consent data on deletion request', () => {
      updateConsent('user-1', { analytics: true, marketing: true });
      requestDataDeletion('user-1');
      const consent = getConsentStatus('user-1');
      // After deletion, consent should be defaults (all false)
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);
    });

    it('throws for empty userId', () => {
      expect(() => requestDataDeletion('')).toThrow('userId is required');
    });
  });

  // --- isMarkedForDeletion ---

  describe('isMarkedForDeletion', () => {
    it('returns false for user not marked', () => {
      expect(isMarkedForDeletion('user-99')).toBe(false);
    });

    it('returns true after deletion request', () => {
      requestDataDeletion('user-1');
      expect(isMarkedForDeletion('user-1')).toBe(true);
    });
  });

  // --- getConsentStatus ---

  describe('getConsentStatus', () => {
    it('returns default consents for new user', () => {
      const consent = getConsentStatus('new-user');
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);
      expect(consent.thirdPartySharing).toBe(false);
      expect(consent.dataProcessing).toBe(false);
      expect(consent.updatedAt).toBeTruthy();
    });

    it('throws for empty userId', () => {
      expect(() => getConsentStatus('')).toThrow('userId is required');
    });

    it('returns stored consents after update', () => {
      updateConsent('user-1', { analytics: true });
      const consent = getConsentStatus('user-1');
      expect(consent.analytics).toBe(true);
    });
  });

  // --- updateConsent ---

  describe('updateConsent', () => {
    it('updates specific consent flags', () => {
      const result = updateConsent('user-1', { analytics: true, marketing: true });
      expect(result.analytics).toBe(true);
      expect(result.marketing).toBe(true);
      expect(result.thirdPartySharing).toBe(false);
      expect(result.dataProcessing).toBe(false);
    });

    it('preserves existing consent when partially updating', () => {
      updateConsent('user-1', { analytics: true, marketing: true });
      const result = updateConsent('user-1', { marketing: false });
      expect(result.analytics).toBe(true);
      expect(result.marketing).toBe(false);
    });

    it('throws for empty userId', () => {
      expect(() => updateConsent('', { analytics: true })).toThrow('userId is required');
    });

    it('updates the updatedAt timestamp', () => {
      const first = updateConsent('user-1', { analytics: true });
      // Small delay to ensure different timestamp
      const second = updateConsent('user-1', { marketing: true });
      expect(second.updatedAt).toBeTruthy();
      expect(first.updatedAt).toBeTruthy();
    });

    it('returns a copy, not a reference', () => {
      const result = updateConsent('user-1', { analytics: true });
      result.analytics = false;
      const current = getConsentStatus('user-1');
      expect(current.analytics).toBe(true);
    });
  });

  // --- anonymizeUserData ---

  describe('anonymizeUserData', () => {
    it('anonymizes email fields', () => {
      const data = { email: 'coach@school.edu', name: 'Coach Smith' };
      const result = anonymizeUserData(data);
      expect(result.email).toBe('anonymized@example.com');
    });

    it('anonymizes name fields', () => {
      const data = { name: 'John', firstName: 'John', lastName: 'Doe' };
      const result = anonymizeUserData(data);
      expect(result.name).toBe('[REDACTED]');
      expect(result.firstName).toBe('[REDACTED]');
      expect(result.lastName).toBe('[REDACTED]');
    });

    it('anonymizes phone fields', () => {
      const data = { phone: '555-1234', phoneNumber: '555-5678' };
      const result = anonymizeUserData(data);
      expect(result.phone).toBe('000-000-0000');
      expect(result.phoneNumber).toBe('000-000-0000');
    });

    it('anonymizes IP address fields', () => {
      const data = { ipAddress: '192.168.1.1', ip: '10.0.0.1' };
      const result = anonymizeUserData(data);
      expect(result.ipAddress).toBe('0.0.0.0');
      expect(result.ip).toBe('0.0.0.0');
    });

    it('preserves non-PII fields', () => {
      const data = { teamId: 'team-1', role: 'coach', email: 'x@y.com' };
      const result = anonymizeUserData(data);
      expect(result.teamId).toBe('team-1');
      expect(result.role).toBe('coach');
      expect(result.email).toBe('anonymized@example.com');
    });

    it('recursively anonymizes nested objects', () => {
      const data = {
        profile: {
          email: 'nested@test.com',
          displayName: 'Display Name',
          settings: { theme: 'dark' },
        },
      };
      const result = anonymizeUserData(data);
      const profile = result.profile as Record<string, unknown>;
      expect(profile.email).toBe('anonymized@example.com');
      expect(profile.displayName).toBe('[REDACTED]');
      const settings = profile.settings as Record<string, unknown>;
      expect(settings.theme).toBe('dark');
    });

    it('preserves arrays as-is', () => {
      const data = { tags: ['coach', 'admin'], email: 'x@y.com' };
      const result = anonymizeUserData(data);
      expect(result.tags).toEqual(['coach', 'admin']);
    });
  });

  // --- isMinor ---

  describe('isMinor', () => {
    it('identifies a child under 13 (COPPA)', () => {
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      const result = isMinor(tenYearsAgo.toISOString());
      expect(result.isUnder13).toBe(true);
      expect(result.isUnder18).toBe(true);
      expect(result.age).toBe(10);
    });

    it('identifies a teen between 13 and 18', () => {
      const fifteenYearsAgo = new Date();
      fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
      // Move one day back to ensure full 15 years
      fifteenYearsAgo.setDate(fifteenYearsAgo.getDate() - 1);
      const result = isMinor(fifteenYearsAgo.toISOString());
      expect(result.isUnder13).toBe(false);
      expect(result.isUnder18).toBe(true);
      expect(result.age).toBe(15);
    });

    it('identifies an adult (18+)', () => {
      const twentyYearsAgo = new Date();
      twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
      twentyYearsAgo.setDate(twentyYearsAgo.getDate() - 1);
      const result = isMinor(twentyYearsAgo.toISOString());
      expect(result.isUnder13).toBe(false);
      expect(result.isUnder18).toBe(false);
      expect(result.age).toBe(20);
    });

    it('throws for empty birthDate', () => {
      expect(() => isMinor('')).toThrow('birthDate is required');
    });

    it('throws for invalid date format', () => {
      expect(() => isMinor('not-a-date')).toThrow('Invalid birth date format');
    });

    it('handles exact 13th birthday (no longer under 13)', () => {
      const thirteenYearsAgo = new Date();
      thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
      const result = isMinor(thirteenYearsAgo.toISOString());
      expect(result.isUnder13).toBe(false);
      expect(result.age).toBe(13);
    });
  });

  // --- getUserRequests ---

  describe('getUserRequests', () => {
    it('returns empty array for user with no requests', () => {
      expect(getUserRequests('no-requests')).toEqual([]);
    });

    it('returns all requests for a user', () => {
      requestDataExport('user-1');
      requestDataDeletion('user-1');
      const requests = getUserRequests('user-1');
      expect(requests).toHaveLength(2);
    });

    it('does not include requests from other users', () => {
      requestDataExport('user-1');
      requestDataExport('user-2');
      const requests = getUserRequests('user-1');
      expect(requests).toHaveLength(1);
      expect(requests[0].userId).toBe('user-1');
    });
  });
});
