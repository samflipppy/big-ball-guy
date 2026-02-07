// ============================================================
// #342 — CI/CD Pipeline Config
// Defines pipeline stages, generates GitHub Actions YAML,
// and validates pipeline configuration.
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineStage {
  name: string;
  commands: string[];
  dependsOn?: string[];
  timeout?: number; // minutes
  environment?: string;
}

export type PipelineStatusState = 'pending' | 'running' | 'passed' | 'failed';

export interface PipelineStatus {
  stage: string;
  status: PipelineStatusState;
  duration?: number; // ms
  error?: string;
}

// ---------------------------------------------------------------------------
// Pipeline Stages
// ---------------------------------------------------------------------------

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    name: 'lint',
    commands: ['npm run lint'],
    timeout: 5,
  },
  {
    name: 'typecheck',
    commands: ['npm run typecheck'],
    timeout: 5,
  },
  {
    name: 'unit-test',
    commands: ['npm run test -- --run --coverage'],
    dependsOn: ['lint', 'typecheck'],
    timeout: 15,
  },
  {
    name: 'build',
    commands: ['npm run build'],
    dependsOn: ['unit-test'],
    timeout: 10,
  },
  {
    name: 'e2e-test',
    commands: ['npx playwright install --with-deps', 'npm run test:e2e'],
    dependsOn: ['build'],
    timeout: 20,
  },
  {
    name: 'deploy-preview',
    commands: ['npx vercel deploy --prebuilt'],
    dependsOn: ['e2e-test'],
    timeout: 10,
    environment: 'staging',
  },
  {
    name: 'deploy-production',
    commands: ['npx vercel deploy --prebuilt --prod'],
    dependsOn: ['deploy-preview'],
    timeout: 10,
    environment: 'production',
  },
];

// ---------------------------------------------------------------------------
// generateGitHubActionsYAML
// ---------------------------------------------------------------------------

/**
 * Generate a GitHub Actions workflow YAML string from a list of pipeline stages.
 */
export function generateGitHubActionsYAML(stages: PipelineStage[]): string {
  const lines: string[] = [];

  lines.push('name: CI/CD Pipeline');
  lines.push('');
  lines.push('on:');
  lines.push('  push:');
  lines.push('    branches: [main]');
  lines.push('  pull_request:');
  lines.push('    branches: [main]');
  lines.push('');
  lines.push('jobs:');

  for (const stage of stages) {
    lines.push(`  ${stage.name}:`);
    lines.push(`    runs-on: ubuntu-latest`);

    if (stage.dependsOn && stage.dependsOn.length > 0) {
      lines.push(`    needs: [${stage.dependsOn.join(', ')}]`);
    }

    if (stage.timeout) {
      lines.push(`    timeout-minutes: ${stage.timeout}`);
    }

    if (stage.environment) {
      lines.push(`    environment: ${stage.environment}`);
    }

    lines.push('    steps:');
    lines.push('      - uses: actions/checkout@v4');
    lines.push('      - uses: actions/setup-node@v4');
    lines.push('        with:');
    lines.push("          node-version: '20'");
    lines.push('          cache: npm');
    lines.push('      - run: npm ci');

    for (const cmd of stage.commands) {
      lines.push(`      - run: ${cmd}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// getDeploymentChecklist
// ---------------------------------------------------------------------------

/**
 * Return a pre-deployment verification checklist.
 */
export function getDeploymentChecklist(): { item: string; critical: boolean }[] {
  return [
    { item: 'All tests passing', critical: true },
    { item: 'No TypeScript errors', critical: true },
    { item: 'No lint warnings', critical: false },
    { item: 'Database migrations applied', critical: true },
    { item: 'Environment variables configured', critical: true },
    { item: 'Feature flags reviewed', critical: false },
    { item: 'Performance benchmarks within thresholds', critical: false },
    { item: 'Security audit passed', critical: true },
    { item: 'Changelog updated', critical: false },
    { item: 'Rollback plan documented', critical: true },
  ];
}

// ---------------------------------------------------------------------------
// validatePipelineConfig
// ---------------------------------------------------------------------------

/**
 * Validate a pipeline configuration for issues such as circular dependencies,
 * missing dependency references, and duplicate stage names.
 */
export function validatePipelineConfig(
  stages: PipelineStage[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const stageNames = new Set(stages.map((s) => s.name));

  // Check for duplicate names
  if (stageNames.size !== stages.length) {
    const counts = new Map<string, number>();
    for (const s of stages) {
      counts.set(s.name, (counts.get(s.name) || 0) + 1);
    }
    for (const [name, count] of counts) {
      if (count > 1) {
        errors.push(`Duplicate stage name: '${name}' appears ${count} times`);
      }
    }
  }

  // Check for missing dependencies
  for (const stage of stages) {
    if (stage.dependsOn) {
      for (const dep of stage.dependsOn) {
        if (!stageNames.has(dep)) {
          errors.push(`Stage '${stage.name}' depends on unknown stage '${dep}'`);
        }
      }
    }
  }

  // Check for circular dependencies
  const circularError = detectCircularDeps(stages);
  if (circularError) {
    errors.push(circularError);
  }

  // Check for empty commands
  for (const stage of stages) {
    if (stage.commands.length === 0) {
      errors.push(`Stage '${stage.name}' has no commands`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectCircularDeps(stages: PipelineStage[]): string | null {
  const graph = new Map<string, string[]>();
  for (const s of stages) {
    graph.set(s.name, s.dependsOn ?? []);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string, path: string[]): string | null {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat(node);
      return `Circular dependency detected: ${cycle.join(' -> ')}`;
    }
    if (visited.has(node)) return null;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    const deps = graph.get(node) || [];
    for (const dep of deps) {
      const result = dfs(dep, [...path]);
      if (result) return result;
    }

    inStack.delete(node);
    return null;
  }

  for (const name of graph.keys()) {
    const result = dfs(name, []);
    if (result) return result;
  }

  return null;
}
