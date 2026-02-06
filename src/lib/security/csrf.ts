/**
 * CSRF (Cross-Site Request Forgery) protection.
 *
 * Implements the double-submit cookie pattern: a CSRF token is stored
 * in a cookie and must also be sent in a request header. State-changing
 * requests (POST, PUT, PATCH, DELETE) are validated.
 */

// --- Types ---

export interface CSRFValidationResult {
  valid: boolean;
  reason?: string;
}

export interface CSRFMiddlewareRequest {
  method: string;
  headers: Record<string, string | undefined>;
  cookies?: Record<string, string | undefined>;
}

export interface CSRFMiddlewareResponse {
  allowed: boolean;
  reason?: string;
}

// --- Constants ---

export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_TOKEN_LENGTH = 32;

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// --- Token store (in-memory, maps token -> sessionToken) ---

const tokenStore = new Map<string, string>();

// --- Helpers ---

/**
 * Generate a cryptographically random string of the given length.
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

// --- Public API ---

/**
 * Generate a CSRF token and associate it with the given session token.
 * The CSRF token should be stored in a cookie and also sent via a header.
 */
export function generateCSRFToken(sessionToken?: string): string {
  const csrfToken = generateRandomString(CSRF_TOKEN_LENGTH);
  const session = sessionToken || generateRandomString(16);
  tokenStore.set(csrfToken, session);
  return csrfToken;
}

/**
 * Validate a CSRF token against a session token.
 * Both must be present and the CSRF token must be associated with the session.
 */
export function validateCSRFToken(
  token: string,
  sessionToken: string,
): CSRFValidationResult {
  if (!token) {
    return { valid: false, reason: 'CSRF token is missing' };
  }

  if (!sessionToken) {
    return { valid: false, reason: 'Session token is missing' };
  }

  const storedSession = tokenStore.get(token);

  if (!storedSession) {
    return { valid: false, reason: 'CSRF token not found' };
  }

  if (storedSession !== sessionToken) {
    return { valid: false, reason: 'CSRF token does not match session' };
  }

  return { valid: true };
}

/**
 * CSRF middleware function that checks the X-CSRF-Token header
 * on state-changing requests (POST, PUT, PATCH, DELETE).
 *
 * Safe methods (GET, HEAD, OPTIONS) are always allowed through.
 */
export function CSRFMiddleware(request: CSRFMiddlewareRequest): CSRFMiddlewareResponse {
  const method = request.method.toUpperCase();

  // Safe methods don't need CSRF validation
  if (SAFE_METHODS.has(method)) {
    return { allowed: true };
  }

  // State-changing methods require CSRF token
  if (!STATE_CHANGING_METHODS.has(method)) {
    return { allowed: true };
  }

  const headerToken = request.headers[CSRF_HEADER_NAME];
  const cookieToken = request.cookies?.[CSRF_COOKIE_NAME];

  if (!headerToken) {
    return { allowed: false, reason: 'Missing CSRF token in header' };
  }

  if (!cookieToken) {
    return { allowed: false, reason: 'Missing CSRF token in cookie' };
  }

  // Double-submit pattern: header token must match cookie token
  if (headerToken !== cookieToken) {
    return { allowed: false, reason: 'CSRF token mismatch between header and cookie' };
  }

  // Also verify the token exists in our store
  const storedSession = tokenStore.get(headerToken);
  if (!storedSession) {
    return { allowed: false, reason: 'CSRF token is invalid' };
  }

  return { allowed: true };
}

/**
 * Revoke a CSRF token (e.g., on logout).
 */
export function revokeCSRFToken(token: string): boolean {
  return tokenStore.delete(token);
}

/**
 * Clear all CSRF tokens (for testing).
 */
export function clearCSRFTokens(): void {
  tokenStore.clear();
}
