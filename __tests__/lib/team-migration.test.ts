import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportInstall,
  importInstall,
  validatePackage,
  getMigrationPreview,
  addToStore,
  clearStore,
} from '@/lib/team-migration';
import type { InstallPackage } from '@/lib/team-migration';
import type {
  Formation,
  Play,
  Concept,
  GamePlan,
  BlockingScheme,
} from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEAM_A = 'team_a';
const TEAM_B = 'team_b';
const now = new Date().toISOString();

function makeFormation(overrides?: Partial<Formation>): Formation {
  return {
    id: 'f1',
    name: 'Shotgun Spread',
    side: 'offense',
    players: [],
    personnel: '11',
    tags: ['base'],
    isCustom: false,
    teamId: TEAM_A,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makePlay(overrides?: Partial<Play>): Play {
  return {
    id: 'p1',
    name: 'Power Right',
    formationId: 'f1',
    assignments: [],
    tags: ['run'],
    personnel: '11',
    teamId: TEAM_A,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeConcept(overrides?: Partial<Concept>): Concept {
  return {
    id: 'c1',
    name: 'Mesh',
    routes: [],
    tags: ['pass'],
    teamId: TEAM_A,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeGamePlan(overrides?: Partial<GamePlan>): GamePlan {
  return {
    id: 'gp1',
    name: 'Week 1 Plan',
    opponent: 'Rival Team',
    week: 1,
    season: '2025',
    sections: [
      {
        id: 's1',
        situation: '1st & 10',
        plays: [{ playId: 'p1', order: 0 }],
        order: 0,
      },
    ],
    teamId: TEAM_A,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeBlockingScheme(overrides?: Partial<BlockingScheme>): BlockingScheme {
  return {
    id: 'bs1',
    name: 'Inside Zone',
    type: 'run',
    description: 'Zone blocking scheme',
    rules: [],
    tags: ['zone'],
    teamId: TEAM_A,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function seedTeamA(): void {
  addToStore('formations', makeFormation());
  addToStore('plays', makePlay());
  addToStore('concepts', makeConcept());
  addToStore('gamePlans', makeGamePlan());
  addToStore('blockingSchemes', makeBlockingScheme());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Team Migration', () => {
  beforeEach(() => {
    clearStore();
  });

  // -----------------------------------------------------------------------
  // exportInstall
  // -----------------------------------------------------------------------

  describe('exportInstall', () => {
    it('exports all data for a given team', () => {
      seedTeamA();
      const pkg = exportInstall(TEAM_A);

      expect(pkg.version).toBe('1.0.0');
      expect(pkg.sourceTeamId).toBe(TEAM_A);
      expect(pkg.formations).toHaveLength(1);
      expect(pkg.plays).toHaveLength(1);
      expect(pkg.concepts).toHaveLength(1);
      expect(pkg.gamePlans).toHaveLength(1);
      expect(pkg.blockingSchemes).toHaveLength(1);
      expect(pkg.exportedAt).toBeTruthy();
    });

    it('only exports data for the specified team', () => {
      seedTeamA();
      addToStore('formations', makeFormation({ id: 'f_other', teamId: TEAM_B }));

      const pkg = exportInstall(TEAM_A);
      expect(pkg.formations).toHaveLength(1);
      expect(pkg.formations[0].teamId).toBe(TEAM_A);
    });

    it('returns empty arrays when team has no data', () => {
      const pkg = exportInstall('nonexistent_team');
      expect(pkg.formations).toHaveLength(0);
      expect(pkg.plays).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // validatePackage
  // -----------------------------------------------------------------------

  describe('validatePackage', () => {
    it('validates a well-formed package', () => {
      seedTeamA();
      const pkg = exportInstall(TEAM_A);
      const result = validatePackage(pkg);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects null', () => {
      const result = validatePackage(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects missing required fields', () => {
      const result = validatePackage({});
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('version'))).toBe(true);
      expect(result.errors.some((e: string) => e.includes('formations'))).toBe(true);
    });

    it('flags items without id or name', () => {
      const pkg = {
        version: '1.0.0',
        sourceTeamId: 'team_1',
        formations: [{ notAnId: true }],
        concepts: [],
        plays: [],
        gamePlans: [],
        blockingSchemes: [],
      };
      const result = validatePackage(pkg);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('formations[0]'))).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getMigrationPreview
  // -----------------------------------------------------------------------

  describe('getMigrationPreview', () => {
    it('returns counts and names for all entity types', () => {
      seedTeamA();
      const pkg = exportInstall(TEAM_A);
      const preview = getMigrationPreview(pkg);

      expect(preview.formationCount).toBe(1);
      expect(preview.playCount).toBe(1);
      expect(preview.conceptCount).toBe(1);
      expect(preview.gamePlanCount).toBe(1);
      expect(preview.blockingSchemeCount).toBe(1);
      expect(preview.totalItems).toBe(5);
      expect(preview.formationNames).toContain('Shotgun Spread');
      expect(preview.playNames).toContain('Power Right');
    });

    it('handles empty package', () => {
      const pkg = exportInstall('empty_team');
      const preview = getMigrationPreview(pkg);
      expect(preview.totalItems).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // importInstall
  // -----------------------------------------------------------------------

  describe('importInstall', () => {
    it('imports all data into the target team', () => {
      seedTeamA();
      const pkg = exportInstall(TEAM_A);
      clearStore();

      const result = importInstall(pkg, TEAM_B);

      expect(result.success).toBe(true);
      expect(result.imported.formationCount).toBe(1);
      expect(result.imported.playCount).toBe(1);
      expect(result.imported.conceptCount).toBe(1);
      expect(result.imported.gamePlanCount).toBe(1);
      expect(result.imported.blockingSchemeCount).toBe(1);
    });

    it('assigns new IDs to imported items', () => {
      seedTeamA();
      const pkg = exportInstall(TEAM_A);
      clearStore();

      importInstall(pkg, TEAM_B);

      // Re-export from team B and verify IDs are different
      const exported = exportInstall(TEAM_B);
      expect(exported.formations[0].id).not.toBe('f1');
      expect(exported.plays[0].id).not.toBe('p1');
    });

    it('re-maps formation references in plays', () => {
      seedTeamA();
      const pkg = exportInstall(TEAM_A);
      clearStore();

      importInstall(pkg, TEAM_B);

      const exported = exportInstall(TEAM_B);
      const importedPlay = exported.plays[0];
      const importedFormation = exported.formations[0];

      // The play's formationId should now point to the new formation ID
      expect(importedPlay.formationId).toBe(importedFormation.id);
    });

    it('re-maps play references in game plan sections', () => {
      seedTeamA();
      const pkg = exportInstall(TEAM_A);
      clearStore();

      importInstall(pkg, TEAM_B);

      const exported = exportInstall(TEAM_B);
      const importedGp = exported.gamePlans[0];
      const importedPlay = exported.plays[0];

      expect(importedGp.sections[0].plays[0].playId).toBe(importedPlay.id);
    });

    it('sets the target teamId on all imported items', () => {
      seedTeamA();
      const pkg = exportInstall(TEAM_A);
      clearStore();

      importInstall(pkg, TEAM_B);
      const exported = exportInstall(TEAM_B);

      expect(exported.formations[0].teamId).toBe(TEAM_B);
      expect(exported.plays[0].teamId).toBe(TEAM_B);
      expect(exported.concepts[0].teamId).toBe(TEAM_B);
      expect(exported.gamePlans[0].teamId).toBe(TEAM_B);
      expect(exported.blockingSchemes[0].teamId).toBe(TEAM_B);
    });

    it('fails gracefully for invalid packages', () => {
      const result = importInstall({} as InstallPackage, TEAM_B);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('handles multiple formations and plays', () => {
      addToStore('formations', makeFormation({ id: 'f1' }));
      addToStore('formations', makeFormation({ id: 'f2', name: 'I-Form' }));
      addToStore('plays', makePlay({ id: 'p1', formationId: 'f1' }));
      addToStore('plays', makePlay({ id: 'p2', formationId: 'f2', name: 'Sweep Left' }));

      const pkg = exportInstall(TEAM_A);
      clearStore();

      const result = importInstall(pkg, TEAM_B);
      expect(result.imported.formationCount).toBe(2);
      expect(result.imported.playCount).toBe(2);
    });
  });
});
