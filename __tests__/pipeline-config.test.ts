import { describe, it, expect } from 'vitest';
import {
  PIPELINE_STAGES,
  generateGitHubActionsYAML,
  getDeploymentChecklist,
  validatePipelineConfig,
} from '@/lib/ci/pipeline-config';
import type { PipelineStage, PipelineStatus } from '@/lib/ci/pipeline-config';

describe('pipeline-config', () => {
  // ---- PIPELINE_STAGES ----
  describe('PIPELINE_STAGES', () => {
    it('defines all 7 required stages', () => {
      const names = PIPELINE_STAGES.map((s) => s.name);
      expect(names).toEqual([
        'lint',
        'typecheck',
        'unit-test',
        'build',
        'e2e-test',
        'deploy-preview',
        'deploy-production',
      ]);
    });

    it('every stage has at least one command', () => {
      for (const stage of PIPELINE_STAGES) {
        expect(stage.commands.length).toBeGreaterThan(0);
      }
    });

    it('deploy stages have an environment set', () => {
      const deploys = PIPELINE_STAGES.filter((s) => s.name.startsWith('deploy-'));
      for (const d of deploys) {
        expect(d.environment).toBeTruthy();
      }
    });

    it('unit-test depends on lint and typecheck', () => {
      const unitTest = PIPELINE_STAGES.find((s) => s.name === 'unit-test');
      expect(unitTest!.dependsOn).toContain('lint');
      expect(unitTest!.dependsOn).toContain('typecheck');
    });
  });

  // ---- generateGitHubActionsYAML ----
  describe('generateGitHubActionsYAML', () => {
    it('generates a valid YAML structure', () => {
      const yaml = generateGitHubActionsYAML(PIPELINE_STAGES);
      expect(yaml).toContain('name: CI/CD Pipeline');
      expect(yaml).toContain('on:');
      expect(yaml).toContain('jobs:');
    });

    it('includes all stage names as job keys', () => {
      const yaml = generateGitHubActionsYAML(PIPELINE_STAGES);
      for (const stage of PIPELINE_STAGES) {
        expect(yaml).toContain(`  ${stage.name}:`);
      }
    });

    it('includes needs for stages with dependencies', () => {
      const yaml = generateGitHubActionsYAML(PIPELINE_STAGES);
      expect(yaml).toContain('needs: [lint, typecheck]');
    });

    it('includes timeout-minutes when specified', () => {
      const yaml = generateGitHubActionsYAML(PIPELINE_STAGES);
      expect(yaml).toContain('timeout-minutes:');
    });

    it('includes environment for deploy stages', () => {
      const yaml = generateGitHubActionsYAML(PIPELINE_STAGES);
      expect(yaml).toContain('environment: staging');
      expect(yaml).toContain('environment: production');
    });

    it('includes checkout and setup-node steps', () => {
      const yaml = generateGitHubActionsYAML(PIPELINE_STAGES);
      expect(yaml).toContain('actions/checkout@v4');
      expect(yaml).toContain('actions/setup-node@v4');
    });
  });

  // ---- getDeploymentChecklist ----
  describe('getDeploymentChecklist', () => {
    it('returns a non-empty checklist', () => {
      const checklist = getDeploymentChecklist();
      expect(checklist.length).toBeGreaterThan(5);
    });

    it('includes critical items', () => {
      const checklist = getDeploymentChecklist();
      const critical = checklist.filter((c) => c.critical);
      expect(critical.length).toBeGreaterThan(0);
      const items = critical.map((c) => c.item);
      expect(items).toContain('All tests passing');
      expect(items).toContain('Database migrations applied');
    });
  });

  // ---- validatePipelineConfig ----
  describe('validatePipelineConfig', () => {
    it('validates the default PIPELINE_STAGES as valid', () => {
      const result = validatePipelineConfig(PIPELINE_STAGES);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects duplicate stage names', () => {
      const stages: PipelineStage[] = [
        { name: 'lint', commands: ['npm run lint'] },
        { name: 'lint', commands: ['npm run lint:fix'] },
      ];
      const result = validatePipelineConfig(stages);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
    });

    it('detects missing dependencies', () => {
      const stages: PipelineStage[] = [
        { name: 'build', commands: ['npm run build'], dependsOn: ['nonexistent'] },
      ];
      const result = validatePipelineConfig(stages);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('unknown stage'))).toBe(true);
    });

    it('detects circular dependencies', () => {
      const stages: PipelineStage[] = [
        { name: 'a', commands: ['echo a'], dependsOn: ['b'] },
        { name: 'b', commands: ['echo b'], dependsOn: ['a'] },
      ];
      const result = validatePipelineConfig(stages);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Circular'))).toBe(true);
    });

    it('detects stages with empty commands', () => {
      const stages: PipelineStage[] = [
        { name: 'empty', commands: [] },
      ];
      const result = validatePipelineConfig(stages);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('no commands'))).toBe(true);
    });
  });
});
