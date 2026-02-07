// ============================================================
// #343 — Staging Environment Config
// Environment detection, configuration, and feature flags
// for development / staging / production environments.
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: Environment;
  supabaseUrl: string;
  supabaseKey: string;
  stripeKey: string;
  analyticsId?: string;
  features: string[];
}

export interface EnvironmentBadge {
  label: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Environment Configs
// ---------------------------------------------------------------------------

export const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  development: {
    name: 'development',
    supabaseUrl: 'http://localhost:54321',
    supabaseKey: 'dev-anon-key',
    stripeKey: 'sk_test_dev',
    features: [
      'debug-panel',
      'mock-data',
      'hot-reload',
      'ai-analysis',
      'pdf-export',
      'advanced-scouting',
      'multi-sport',
      'voice-recognition',
    ],
  },
  staging: {
    name: 'staging',
    supabaseUrl: 'https://staging.supabase.co',
    supabaseKey: 'staging-anon-key',
    stripeKey: 'sk_test_staging',
    analyticsId: 'G-STAGING123',
    features: [
      'ai-analysis',
      'pdf-export',
      'advanced-scouting',
      'multi-sport',
      'voice-recognition',
    ],
  },
  production: {
    name: 'production',
    supabaseUrl: 'https://prod.supabase.co',
    supabaseKey: 'prod-anon-key',
    stripeKey: 'sk_live_prod',
    analyticsId: 'G-PROD456',
    features: [
      'ai-analysis',
      'pdf-export',
      'advanced-scouting',
    ],
  },
};

// ---------------------------------------------------------------------------
// getCurrentEnvironment
// ---------------------------------------------------------------------------

/**
 * Detect the current environment from the NEXT_PUBLIC_ENV variable,
 * hostname, or fall back to 'development'.
 */
export function getCurrentEnvironment(): Environment {
  // 1. Explicit env variable
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ENV) {
    const env = process.env.NEXT_PUBLIC_ENV as string;
    if (env === 'production' || env === 'staging' || env === 'development') {
      return env;
    }
  }

  // 2. Hostname detection (browser)
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    if (hostname.includes('staging') || hostname.includes('preview')) {
      return 'staging';
    }
    // Any other hostname is treated as production
    return 'production';
  }

  return 'development';
}

// ---------------------------------------------------------------------------
// isFeatureEnabled
// ---------------------------------------------------------------------------

/**
 * Check if a given feature flag is enabled for the specified environment.
 */
export function isFeatureEnabled(feature: string, env: Environment): boolean {
  const config = ENVIRONMENT_CONFIGS[env];
  if (!config) return false;
  return config.features.includes(feature);
}

// ---------------------------------------------------------------------------
// getEnvironmentBadge
// ---------------------------------------------------------------------------

/**
 * Return a display-friendly badge (label + color) for the given environment.
 */
export function getEnvironmentBadge(env: Environment): EnvironmentBadge {
  switch (env) {
    case 'development':
      return { label: 'Development', color: '#22c55e' }; // green
    case 'staging':
      return { label: 'Staging', color: '#f59e0b' }; // amber
    case 'production':
      return { label: 'Production', color: '#ef4444' }; // red
    default:
      return { label: 'Unknown', color: '#6b7280' }; // gray
  }
}
