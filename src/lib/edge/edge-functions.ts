// ============================================================
// #141 — Edge Function Setup
// Configuration and invocation helpers for Supabase Edge Functions
// used by the playbook builder (blocking auto-assign, matrix
// generation, PDF generation, play analysis).
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EdgeFunctionConfig {
  name: string;
  route: string;
  maxDuration: number; // ms
  memory: number; // MB
  regions: string[];
}

export interface EdgeFunctionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration: number; // ms
  region: string;
}

export interface EdgeFunctionHealth {
  name: string;
  healthy: boolean;
  latency: number;
  region: string;
  lastChecked: string;
}

// ---------------------------------------------------------------------------
// Edge Function Configs
// ---------------------------------------------------------------------------

export const EDGE_FUNCTIONS: Record<string, EdgeFunctionConfig> = {
  'blocking-auto-assign': {
    name: 'blocking-auto-assign',
    route: '/functions/v1/blocking-auto-assign',
    maxDuration: 10_000,
    memory: 256,
    regions: ['us-east-1', 'us-west-2'],
  },
  'matrix-generation': {
    name: 'matrix-generation',
    route: '/functions/v1/matrix-generation',
    maxDuration: 30_000,
    memory: 512,
    regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
  },
  'pdf-generation': {
    name: 'pdf-generation',
    route: '/functions/v1/pdf-generation',
    maxDuration: 60_000,
    memory: 1024,
    regions: ['us-east-1'],
  },
  'play-analysis': {
    name: 'play-analysis',
    route: '/functions/v1/play-analysis',
    maxDuration: 15_000,
    memory: 512,
    regions: ['us-east-1', 'us-west-2'],
  },
};

// ---------------------------------------------------------------------------
// invokeEdgeFunction
// ---------------------------------------------------------------------------

/**
 * Invoke an edge function by name with an arbitrary JSON payload.
 * Currently returns a mock result; in production this would call the
 * Supabase Edge Functions API.
 */
export async function invokeEdgeFunction(
  name: string,
  payload: Record<string, unknown>,
): Promise<EdgeFunctionResult> {
  const config = EDGE_FUNCTIONS[name];

  if (!config) {
    return {
      success: false,
      error: `Unknown edge function: ${name}`,
      duration: 0,
      region: 'unknown',
    };
  }

  const start = Date.now();

  // --- Mock implementation (simulates network latency) ---
  const simulatedLatency = Math.min(50 + Object.keys(payload).length * 10, config.maxDuration);

  await new Promise((resolve) => setTimeout(resolve, Math.min(simulatedLatency, 100)));

  const duration = Date.now() - start;
  const region = config.regions[0];

  return {
    success: true,
    data: { functionName: name, input: payload, processedAt: new Date().toISOString() },
    duration,
    region,
  };
}

// ---------------------------------------------------------------------------
// getEdgeFunctionStatus
// ---------------------------------------------------------------------------

/**
 * Return health-check data for a given edge function.
 * In production this would ping the function's health endpoint.
 */
export async function getEdgeFunctionStatus(name: string): Promise<EdgeFunctionHealth> {
  const config = EDGE_FUNCTIONS[name];

  if (!config) {
    return {
      name,
      healthy: false,
      latency: -1,
      region: 'unknown',
      lastChecked: new Date().toISOString(),
    };
  }

  // Mock: always healthy with a small latency
  return {
    name,
    healthy: true,
    latency: Math.floor(Math.random() * 50) + 5,
    region: config.regions[0],
    lastChecked: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// estimateComputeTime
// ---------------------------------------------------------------------------

/**
 * Estimate the compute time for an edge function given the input size.
 * Uses a linear model per function based on expected workload.
 */
export function estimateComputeTime(functionName: string, inputSize: number): number {
  const config = EDGE_FUNCTIONS[functionName];
  if (!config) return -1;

  // Base latency (ms) + per-item cost
  const costModels: Record<string, { base: number; perUnit: number }> = {
    'blocking-auto-assign': { base: 200, perUnit: 15 },
    'matrix-generation': { base: 500, perUnit: 50 },
    'pdf-generation': { base: 1000, perUnit: 100 },
    'play-analysis': { base: 300, perUnit: 25 },
  };

  const model = costModels[functionName];
  if (!model) return -1;

  const estimated = model.base + model.perUnit * inputSize;
  return Math.min(estimated, config.maxDuration);
}
