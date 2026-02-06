import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestPlay,
  createTestFormation,
  createTestGamePlan,
  createTestTeam,
  seedTestData,
  cleanupTestData,
  getTestDataStore,
  resetIdCounter,
} from '@/lib/testing/e2e-helpers';

describe('E2E Test Helpers', () => {
  beforeEach(() => {
    cleanupTestData();
  });

  // -----------------------------------------------------------------------
  // createTestPlay
  // -----------------------------------------------------------------------

  describe('createTestPlay', () => {
    it('creates a play with all required fields', () => {
      const play = createTestPlay();

      expect(play.id).toBeTruthy();
      expect(play.name).toBeTruthy();
      expect(play.formationId).toBeTruthy();
      expect(play.assignments).toEqual([]);
      expect(play.tags).toContain('test');
      expect(play.personnel).toBe('11');
      expect(play.teamId).toBe('team_default');
      expect(play.createdAt).toBeTruthy();
      expect(play.updatedAt).toBeTruthy();
    });

    it('allows overriding specific fields', () => {
      const play = createTestPlay({
        name: 'Custom Play',
        personnel: '12',
        category: 'pass',
        tags: ['custom', 'special'],
      });

      expect(play.name).toBe('Custom Play');
      expect(play.personnel).toBe('12');
      expect(play.category).toBe('pass');
      expect(play.tags).toEqual(['custom', 'special']);
    });

    it('generates unique IDs for each play', () => {
      const play1 = createTestPlay();
      const play2 = createTestPlay();
      expect(play1.id).not.toBe(play2.id);
    });

    it('respects id override', () => {
      const play = createTestPlay({ id: 'my-custom-id' });
      expect(play.id).toBe('my-custom-id');
    });
  });

  // -----------------------------------------------------------------------
  // createTestFormation
  // -----------------------------------------------------------------------

  describe('createTestFormation', () => {
    it('creates a formation with default players', () => {
      const formation = createTestFormation();

      expect(formation.id).toBeTruthy();
      expect(formation.name).toBeTruthy();
      expect(formation.side).toBe('offense');
      expect(formation.players.length).toBe(11);
      expect(formation.personnel).toBe('11');
      expect(formation.isCustom).toBe(false);
      expect(formation.teamId).toBe('team_default');
    });

    it('allows overriding fields', () => {
      const formation = createTestFormation({
        name: 'Shotgun Trips',
        personnel: '10',
        isCustom: true,
      });

      expect(formation.name).toBe('Shotgun Trips');
      expect(formation.personnel).toBe('10');
      expect(formation.isCustom).toBe(true);
    });

    it('includes players with valid positions and locations', () => {
      const formation = createTestFormation();
      formation.players.forEach((player) => {
        expect(player.id).toBeTruthy();
        expect(player.position).toBeTruthy();
        expect(player.location).toBeDefined();
        expect(typeof player.location.x).toBe('number');
        expect(typeof player.location.y).toBe('number');
        expect(player.side).toBe('offense');
      });
    });
  });

  // -----------------------------------------------------------------------
  // createTestGamePlan
  // -----------------------------------------------------------------------

  describe('createTestGamePlan', () => {
    it('creates a game plan with default section', () => {
      const gp = createTestGamePlan();

      expect(gp.id).toBeTruthy();
      expect(gp.name).toBeTruthy();
      expect(gp.opponent).toBeTruthy();
      expect(gp.week).toBe(1);
      expect(gp.season).toBe('2025');
      expect(gp.sections.length).toBe(1);
      expect(gp.sections[0].situation).toBe('1st & 10');
      expect(gp.teamId).toBe('team_default');
    });

    it('allows overriding game plan fields', () => {
      const gp = createTestGamePlan({
        name: 'Playoff Game Plan',
        week: 15,
        opponent: 'Rival Tigers',
      });

      expect(gp.name).toBe('Playoff Game Plan');
      expect(gp.week).toBe(15);
      expect(gp.opponent).toBe('Rival Tigers');
    });
  });

  // -----------------------------------------------------------------------
  // createTestTeam
  // -----------------------------------------------------------------------

  describe('createTestTeam', () => {
    it('creates a team with default values', () => {
      const team = createTestTeam();

      expect(team.id).toBeTruthy();
      expect(team.name).toBe('Test Eagles');
      expect(team.school).toBe('Test High School');
      expect(team.level).toBe('high_school');
      expect(team.primaryColor).toBe('#003366');
      expect(team.secondaryColor).toBe('#FFD700');
      expect(team.createdAt).toBeTruthy();
    });

    it('allows overriding team fields', () => {
      const team = createTestTeam({
        name: 'Pro Falcons',
        level: 'pro',
        school: undefined,
      });

      expect(team.name).toBe('Pro Falcons');
      expect(team.level).toBe('pro');
    });
  });

  // -----------------------------------------------------------------------
  // seedTestData
  // -----------------------------------------------------------------------

  describe('seedTestData', () => {
    it('generates the requested number of plays', () => {
      const { plays } = seedTestData(10);
      expect(plays.length).toBe(10);
    });

    it('generates formations shared among plays', () => {
      const { plays, formations } = seedTestData(9);
      expect(formations.length).toBeGreaterThan(0);
      expect(formations.length).toBeLessThanOrEqual(9);

      // Every play references a known formation
      const formationIds = new Set(formations.map((f) => f.id));
      plays.forEach((p) => {
        expect(formationIds.has(p.formationId)).toBe(true);
      });
    });

    it('assigns varied categories and hashes', () => {
      const { plays } = seedTestData(15);
      const categories = new Set(plays.map((p) => p.category));
      const hashes = new Set(plays.map((p) => p.hash));

      expect(categories.size).toBeGreaterThan(1);
      expect(hashes.size).toBeGreaterThan(1);
    });

    it('stores data in the internal test data store', () => {
      seedTestData(5);
      const dataStore = getTestDataStore();
      expect(dataStore.plays.length).toBe(5);
      expect(dataStore.formations.length).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------------
  // cleanupTestData
  // -----------------------------------------------------------------------

  describe('cleanupTestData', () => {
    it('clears all stored test data', () => {
      seedTestData(5);
      expect(getTestDataStore().plays.length).toBe(5);

      cleanupTestData();
      expect(getTestDataStore().plays.length).toBe(0);
      expect(getTestDataStore().formations.length).toBe(0);
    });

    it('resets the ID counter', () => {
      const play1 = createTestPlay();
      cleanupTestData();
      const play2 = createTestPlay();
      // After reset the counter starts fresh, so IDs should be based on counter 1
      expect(play2.id).toContain('_1_');
    });
  });
});
