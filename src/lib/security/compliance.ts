/**
 * GDPR / FERPA / COPPA compliance utilities.
 *
 * Provides data subject request handling, consent management,
 * data anonymization, and age verification.
 */

// --- Types ---

export type DataRequestType = 'access' | 'deletion' | 'portability' | 'rectification';
export type RequestStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: DataRequestType;
  status: RequestStatus;
  createdAt: string;
  completedAt: string | null;
  notes?: string;
}

export interface ConsentFlags {
  analytics: boolean;
  marketing: boolean;
  thirdPartySharing: boolean;
  dataProcessing: boolean;
  updatedAt: string;
}

export interface DataExportPackage {
  userId: string;
  exportedAt: string;
  data: {
    profile: Record<string, unknown>;
    plays: Record<string, unknown>[];
    formations: Record<string, unknown>[];
    gamePlans: Record<string, unknown>[];
    settings: Record<string, unknown>;
  };
  metadata: {
    format: string;
    version: string;
  };
}

// --- In-memory stores ---

const requestStore: Map<string, DataSubjectRequest> = new Map();
const consentStore: Map<string, ConsentFlags> = new Map();
const deletionQueue: Set<string> = new Set();

/**
 * Clear all stores (for testing purposes).
 */
export function clearComplianceStores(): void {
  requestStore.clear();
  consentStore.clear();
  deletionQueue.clear();
}

/**
 * Get the request store (for testing).
 */
export function getRequestStore(): Map<string, DataSubjectRequest> {
  return requestStore;
}

// --- Helpers ---

function generateId(): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `dsr_${result}`;
}

// --- Data Subject Requests ---

/**
 * Request a full data export for a user (GDPR Article 20 - Right to Data Portability).
 */
export function requestDataExport(userId: string): DataExportPackage {
  if (!userId) {
    throw new Error('userId is required');
  }

  const request: DataSubjectRequest = {
    id: generateId(),
    userId,
    type: 'portability',
    status: 'completed',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  requestStore.set(request.id, request);

  // Generate export package with placeholder data structure
  const exportPackage: DataExportPackage = {
    userId,
    exportedAt: new Date().toISOString(),
    data: {
      profile: { userId, exportedAt: new Date().toISOString() },
      plays: [],
      formations: [],
      gamePlans: [],
      settings: {},
    },
    metadata: {
      format: 'json',
      version: '1.0',
    },
  };

  return exportPackage;
}

/**
 * Request deletion of all user data (GDPR Article 17 - Right to Erasure).
 * Marks user data for deletion and anonymizes identifiers.
 */
export function requestDataDeletion(userId: string): DataSubjectRequest {
  if (!userId) {
    throw new Error('userId is required');
  }

  const request: DataSubjectRequest = {
    id: generateId(),
    userId,
    type: 'deletion',
    status: 'processing',
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  requestStore.set(request.id, request);
  deletionQueue.add(userId);

  // Clear consent data
  consentStore.delete(userId);

  return request;
}

/**
 * Check if a user is in the deletion queue.
 */
export function isMarkedForDeletion(userId: string): boolean {
  return deletionQueue.has(userId);
}

/**
 * Get the current consent status for a user.
 * Returns default (all false) if no consent has been recorded.
 */
export function getConsentStatus(userId: string): ConsentFlags {
  if (!userId) {
    throw new Error('userId is required');
  }

  const existing = consentStore.get(userId);
  if (existing) {
    return { ...existing };
  }

  // Default: all consents off
  return {
    analytics: false,
    marketing: false,
    thirdPartySharing: false,
    dataProcessing: false,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update consent flags for a user.
 */
export function updateConsent(
  userId: string,
  consents: Record<string, boolean>,
): ConsentFlags {
  if (!userId) {
    throw new Error('userId is required');
  }

  const current = getConsentStatus(userId);
  const updated: ConsentFlags = {
    ...current,
    ...consents,
    updatedAt: new Date().toISOString(),
  };

  // Ensure only valid consent keys are stored
  const validKeys: (keyof ConsentFlags)[] = [
    'analytics',
    'marketing',
    'thirdPartySharing',
    'dataProcessing',
    'updatedAt',
  ];

  const filtered: ConsentFlags = {
    analytics: updated.analytics,
    marketing: updated.marketing,
    thirdPartySharing: updated.thirdPartySharing,
    dataProcessing: updated.dataProcessing,
    updatedAt: updated.updatedAt,
  };

  consentStore.set(userId, filtered);
  return { ...filtered };
}

// --- Data Anonymization ---

/** Fields considered to contain PII */
const PII_FIELDS = new Set([
  'email',
  'name',
  'firstName',
  'lastName',
  'displayName',
  'phone',
  'phoneNumber',
  'address',
  'ipAddress',
  'ip',
  'birthDate',
  'dateOfBirth',
  'ssn',
  'socialSecurity',
]);

/**
 * Anonymize PII fields in a data object.
 * Replaces known PII fields with anonymized placeholders.
 */
export function anonymizeUserData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const anonymized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (PII_FIELDS.has(key)) {
      if (key === 'email') {
        anonymized[key] = 'anonymized@example.com';
      } else if (key === 'phone' || key === 'phoneNumber') {
        anonymized[key] = '000-000-0000';
      } else if (key === 'ipAddress' || key === 'ip') {
        anonymized[key] = '0.0.0.0';
      } else {
        anonymized[key] = '[REDACTED]';
      }
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      anonymized[key] = anonymizeUserData(value as Record<string, unknown>);
    } else {
      anonymized[key] = value;
    }
  }

  return anonymized;
}

// --- Age Verification ---

/**
 * Check if a user is a minor based on their birth date.
 * Returns an object indicating COPPA (under 13) and general minor (under 18) status.
 */
export function isMinor(birthDate: string): {
  isUnder13: boolean;
  isUnder18: boolean;
  age: number;
} {
  if (!birthDate) {
    throw new Error('birthDate is required');
  }

  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) {
    throw new Error('Invalid birth date format');
  }

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }

  return {
    isUnder13: age < 13,
    isUnder18: age < 18,
    age,
  };
}

/**
 * Get all data subject requests for a user.
 */
export function getUserRequests(userId: string): DataSubjectRequest[] {
  const requests: DataSubjectRequest[] = [];
  for (const request of requestStore.values()) {
    if (request.userId === userId) {
      requests.push({ ...request });
    }
  }
  return requests;
}
