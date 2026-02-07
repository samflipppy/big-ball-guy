import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPlayerPlaybook,
  syncPlayerContent,
  recordQuizResult,
  getPlayerProgress,
  sendNotification,
  getPlayerNotifications,
  recordPlayViewed,
  setPlays,
  clearPlayerAppData,
} from '@/lib/player-app';
import type { PlayerAppConfig, PlayerQuizResult } from '@/lib/player-app';
import type { Play } from '@/types';

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    name: 'Test Play',
    formationId: 'form-1',
    assignments: [
      { playerId: 'p1', label: 'QB' },
      { playerId: 'p2', label: 'WR' },
    ],
    tags: [],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const fullAccessConfig: PlayerAppConfig = {
  teamId: 'team-1',
  playerId: 'player-1',
  position: 'QB',
  accessLevel: 'full',
  offlineEnabled: true,
  pushNotifications: true,
};

const positionOnlyConfig: PlayerAppConfig = {
  teamId: 'team-1',
  playerId: 'player-2',
  position: 'WR',
  accessLevel: 'position-only',
  offlineEnabled: false,
  pushNotifications: true,
};

describe('player-app', () => {
  beforeEach(() => {
    clearPlayerAppData();
  });

  describe('getPlayerPlaybook', () => {
    it('returns all team plays for full access', () => {
      setPlays([
        makePlay({ id: 'p1', teamId: 'team-1' }),
        makePlay({ id: 'p2', teamId: 'team-1' }),
      ]);
      const plays = getPlayerPlaybook(fullAccessConfig);
      expect(plays).toHaveLength(2);
    });

    it('filters by team', () => {
      setPlays([
        makePlay({ id: 'p1', teamId: 'team-1' }),
        makePlay({ id: 'p2', teamId: 'team-2' }),
      ]);
      const plays = getPlayerPlaybook(fullAccessConfig);
      expect(plays).toHaveLength(1);
      expect(plays[0].id).toBe('p1');
    });

    it('filters by position for position-only access', () => {
      setPlays([
        makePlay({
          id: 'p1',
          teamId: 'team-1',
          assignments: [{ playerId: 'x', label: 'WR' }],
        }),
        makePlay({
          id: 'p2',
          teamId: 'team-1',
          assignments: [{ playerId: 'x', label: 'RB' }],
        }),
      ]);
      const plays = getPlayerPlaybook(positionOnlyConfig);
      expect(plays).toHaveLength(1);
      expect(plays[0].id).toBe('p1');
    });

    it('returns empty array when no plays match', () => {
      setPlays([makePlay({ teamId: 'other-team' })]);
      const plays = getPlayerPlaybook(fullAccessConfig);
      expect(plays).toHaveLength(0);
    });
  });

  describe('syncPlayerContent', () => {
    it('returns new plays since last sync', () => {
      setPlays([
        makePlay({
          id: 'p1',
          teamId: 'team-1',
          createdAt: '2026-02-01T00:00:00Z',
          updatedAt: '2026-02-01T00:00:00Z',
        }),
      ]);
      const delta = syncPlayerContent(fullAccessConfig, '2026-01-15T00:00:00Z');
      expect(delta.newPlays).toHaveLength(1);
      expect(delta.syncedAt).toBeTruthy();
    });

    it('returns updated plays since last sync', () => {
      setPlays([
        makePlay({
          id: 'p1',
          teamId: 'team-1',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-02-01T00:00:00Z',
        }),
      ]);
      const delta = syncPlayerContent(fullAccessConfig, '2026-01-15T00:00:00Z');
      expect(delta.updatedPlays).toHaveLength(1);
    });

    it('returns empty delta when nothing changed', () => {
      setPlays([
        makePlay({
          id: 'p1',
          teamId: 'team-1',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      ]);
      const delta = syncPlayerContent(fullAccessConfig, '2026-02-01T00:00:00Z');
      expect(delta.newPlays).toHaveLength(0);
      expect(delta.updatedPlays).toHaveLength(0);
    });
  });

  describe('recordQuizResult', () => {
    it('stores a quiz result', () => {
      const result: PlayerQuizResult = {
        playerId: 'player-1',
        quizId: 'quiz-1',
        score: 8,
        totalQuestions: 10,
        completedAt: new Date().toISOString(),
      };
      const stored = recordQuizResult(result);
      expect(stored.score).toBe(8);
    });

    it('throws when score exceeds totalQuestions', () => {
      expect(() =>
        recordQuizResult({
          playerId: 'p1',
          quizId: 'q1',
          score: 11,
          totalQuestions: 10,
          completedAt: new Date().toISOString(),
        }),
      ).toThrow('Score must be between 0 and totalQuestions');
    });

    it('throws when totalQuestions is zero', () => {
      expect(() =>
        recordQuizResult({
          playerId: 'p1',
          quizId: 'q1',
          score: 0,
          totalQuestions: 0,
          completedAt: new Date().toISOString(),
        }),
      ).toThrow('totalQuestions must be positive');
    });
  });

  describe('getPlayerProgress', () => {
    it('returns progress metrics for a player', () => {
      recordPlayViewed('player-1', 'play-1');
      recordPlayViewed('player-1', 'play-2');
      recordQuizResult({
        playerId: 'player-1',
        quizId: 'q1',
        score: 8,
        totalQuestions: 10,
        completedAt: new Date().toISOString(),
      });

      const progress = getPlayerProgress('player-1');
      expect(progress.playerId).toBe('player-1');
      expect(progress.playsViewed).toBe(2);
      expect(progress.quizzesCompleted).toBe(1);
      expect(progress.averageQuizScore).toBe(80);
    });

    it('returns zero progress for unknown player', () => {
      const progress = getPlayerProgress('nobody');
      expect(progress.playsViewed).toBe(0);
      expect(progress.quizzesCompleted).toBe(0);
      expect(progress.averageQuizScore).toBe(0);
      expect(progress.streak).toBe(0);
    });

    it('does not double-count duplicate play views', () => {
      recordPlayViewed('player-1', 'play-1');
      recordPlayViewed('player-1', 'play-1');
      const progress = getPlayerProgress('player-1');
      expect(progress.playsViewed).toBe(1);
    });
  });

  describe('sendNotification', () => {
    it('queues a notification for a player', () => {
      const notif = sendNotification('player-1', 'new-play', 'New play added: Shotgun Split');
      expect(notif.id).toMatch(/^notif_/);
      expect(notif.playerId).toBe('player-1');
      expect(notif.type).toBe('new-play');
      expect(notif.read).toBe(false);
    });

    it('throws for empty message', () => {
      expect(() => sendNotification('player-1', 'quiz-due', '')).toThrow(
        'Notification message is required',
      );
    });
  });

  describe('getPlayerNotifications', () => {
    it('returns notifications sorted by date descending', () => {
      sendNotification('player-1', 'new-play', 'First notification');
      sendNotification('player-1', 'quiz-due', 'Second notification');
      const notifs = getPlayerNotifications('player-1');
      expect(notifs).toHaveLength(2);
      expect(
        new Date(notifs[0].createdAt).getTime(),
      ).toBeGreaterThanOrEqual(new Date(notifs[1].createdAt).getTime());
    });

    it('returns empty array for player with no notifications', () => {
      expect(getPlayerNotifications('nobody')).toEqual([]);
    });

    it('does not return other players notifications', () => {
      sendNotification('player-1', 'game-day', 'Game day!');
      sendNotification('player-2', 'new-play', 'New play');
      const notifs = getPlayerNotifications('player-1');
      expect(notifs).toHaveLength(1);
      expect(notifs[0].playerId).toBe('player-1');
    });
  });
});
