/**
 * Content Security Policy (CSP) and security header utilities.
 *
 * Generates CSP headers for different environments and provides
 * recommended security headers for the application.
 */

// --- Types ---

export type Environment = 'development' | 'production';

export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'connect-src': string[];
  'font-src': string[];
  'object-src': string[];
  'media-src': string[];
  'frame-src': string[];
  'frame-ancestors': string[];
  'base-uri': string[];
  'form-action': string[];
  'upgrade-insecure-requests'?: boolean;
}

export interface SecurityHeadersMap {
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
  'X-XSS-Protection': string;
}

export interface CSPValidationResult {
  valid: boolean;
  directives: string[];
  errors: string[];
  warnings: string[];
}

// --- Constants ---

const VALID_DIRECTIVES = new Set([
  'default-src',
  'script-src',
  'style-src',
  'img-src',
  'connect-src',
  'font-src',
  'object-src',
  'media-src',
  'frame-src',
  'frame-ancestors',
  'base-uri',
  'form-action',
  'upgrade-insecure-requests',
  'block-all-mixed-content',
  'worker-src',
  'child-src',
  'manifest-src',
  'prefetch-src',
  'navigate-to',
  'report-uri',
  'report-to',
  'require-trusted-types-for',
  'trusted-types',
  'sandbox',
]);

// --- Security Headers ---

/**
 * Recommended security headers for all responses.
 */
export const SecurityHeaders: SecurityHeadersMap = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block',
};

// --- CSP Generation ---

/**
 * Get CSP directives for a given environment.
 */
function getDirectives(environment: Environment, nonce?: string): CSPDirectives {
  const nonceDirective = nonce ? `'nonce-${nonce}'` : '';

  if (environment === 'production') {
    return {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        ...(nonceDirective ? [nonceDirective] : []),
        "'strict-dynamic'",
      ],
      'style-src': [
        "'self'",
        ...(nonceDirective ? [nonceDirective] : []),
      ],
      'img-src': ["'self'", 'data:', 'blob:'],
      'connect-src': [
        "'self'",
        'https://*.supabase.co',
        'https://*.supabase.in',
      ],
      'font-src': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'frame-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': true,
    };
  }

  // Development: relaxed for hot reload and dev tools
  return {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'http://localhost:*'],
    'connect-src': [
      "'self'",
      'http://localhost:*',
      'ws://localhost:*',
      'https://*.supabase.co',
      'https://*.supabase.in',
    ],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'self'"],
    'frame-ancestors': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };
}

/**
 * Convert directives object to a CSP header string.
 */
function directivesToString(directives: CSPDirectives): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(directives)) {
    if (key === 'upgrade-insecure-requests' && value === true) {
      parts.push('upgrade-insecure-requests');
    } else if (Array.isArray(value)) {
      parts.push(`${key} ${value.join(' ')}`);
    }
  }

  return parts.join('; ');
}

/**
 * Generate a Content Security Policy header string for the given environment.
 */
export function generateCSPHeader(
  environment: Environment,
  nonce?: string,
): string {
  if (environment !== 'development' && environment !== 'production') {
    throw new Error(`Invalid environment: ${environment}`);
  }

  const directives = getDirectives(environment, nonce);
  return directivesToString(directives);
}

// --- Nonce Generation ---

/**
 * Generate a random nonce for inline script/style tags.
 */
export function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

// --- CSP Validation ---

/**
 * Parse and validate a CSP string.
 */
export function validateCSP(csp: string): CSPValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const directives: string[] = [];

  if (!csp || csp.trim().length === 0) {
    return {
      valid: false,
      directives: [],
      errors: ['CSP string is empty'],
      warnings: [],
    };
  }

  const parts = csp.split(';').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const tokens = part.split(/\s+/);
    const directiveName = tokens[0];

    if (!directiveName) {
      continue;
    }

    directives.push(directiveName);

    if (!VALID_DIRECTIVES.has(directiveName)) {
      errors.push(`Unknown directive: ${directiveName}`);
    }

    // Check for unsafe directives in script-src
    if (directiveName === 'script-src') {
      if (tokens.includes("'unsafe-inline'")) {
        warnings.push("script-src contains 'unsafe-inline' which weakens CSP");
      }
      if (tokens.includes("'unsafe-eval'")) {
        warnings.push("script-src contains 'unsafe-eval' which weakens CSP");
      }
    }

    // Check for wildcard sources
    if (tokens.includes('*')) {
      warnings.push(`${directiveName} contains wildcard (*) source`);
    }
  }

  // Check for missing critical directives
  if (!directives.includes('default-src')) {
    warnings.push("Missing 'default-src' directive (recommended fallback)");
  }
  if (!directives.includes('script-src') && !directives.includes('default-src')) {
    warnings.push("No 'script-src' or 'default-src' directive found");
  }

  return {
    valid: errors.length === 0,
    directives,
    errors,
    warnings,
  };
}
