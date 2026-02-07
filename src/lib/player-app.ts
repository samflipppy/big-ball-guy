/**
 * Team Playbook App for Players (#405)
 *
 * Manages player access to team playbooks, content syncing,
 * quiz tracking, progress metrics, and notifications.
 */

import type { Play, PlayerPosition } from '@/types';

// ---- Types ----

export interface PlayerAppConfig {
  teamId: string;
  playerId: string;
  position: PlayerPosition;
  accessLevel: 'full' | 'position-only';
  offlineEnabled: boolean;
  pushNotifications: boolean;
}

export interface PlayerQuizResult {
  playerId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export type NotificationType = 'new-play' | 'quiz-due' | 'game-day';

export interface PlayerNotification {
  id: string;
  playerId: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface PlayerProgress {
  playerId: string;
  playsViewed: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  streak: number;
  lastActive: string;
}

export interface SyncDelta {
  newPlays: Play[];
  updatedPlays: Play[];
  removedPlayIds: string[];
  syncedAt: string;
}

// ---- In-memory stores ----

let allPlays: Play[] = [];
let quizResults: PlayerQuizResult[] = [];
let notifications: PlayerNotification[] = [];
let viewedPlays: Record<string, Set<string>> = {}; // playerId -> Set of playIds

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ---- Helpers ----

/**
 * Check whether a play is relevant to a player's position.
 */
function isPlayRelevantToPosition(play: Play, position: PlayerPosition): boolean {
  return play.assignments.some((a) => {
    // Check if any player in the play has this position
    // The assignment's playerId could match the position label
    return a.label?.toUpperCase() === position;
  });
}

// ---- Public API ----

/**
 * Get the playbook filtered for a specific player's position and access level.
 */
export function getPlayerPlaybook(config: PlayerAppConfig): Play[] {
  const teamPlays = allPlays.filter((p) => p.teamId === config.teamId);

  if (config.accessLevel === 'full') {
    return teamPlays;
  }

  // Position-only: return plays where the player's position has an assignment
  return teamPlays.filter((play) => isPlayRelevantToPosition(play, config.position));
}

/**
 * Get content changes since the last sync time.
 */
export function syncPlayerContent(
  config: PlayerAppConfig,
  lastSync: string,
): SyncDelta {
  const lastSyncDate = new Date(lastSync);
  const playbook = getPlayerPlaybook(config);

  const newPlays = playbook.filter(
    (p) => new Date(p.createdAt) > lastSyncDate,
  );
  const updatedPlays = playbook.filter(
    (p) =>
      new Date(p.updatedAt) > lastSyncDate &&
      new Date(p.createdAt) <= lastSyncDate,
  );

  return {
    newPlays,
    updatedPlays,
    removedPlayIds: [], // would compare against previous sync state in production
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Record a quiz result.
 */
export function recordQuizResult(result: PlayerQuizResult): PlayerQuizResult {
  if (result.score < 0 || result.score > result.totalQuestions) {
    throw new Error('Score must be between 0 and totalQuestions');
  }
  if (result.totalQuestions <= 0) {
    throw new Error('totalQuestions must be positive');
  }
  quizResults.push(result);
  return result;
}

/**
 * Get progress metrics for a player.
 */
export function getPlayerProgress(playerId: string): PlayerProgress {
  const playerQuizzes = quizResults.filter((q) => q.playerId === playerId);
  const viewed = viewedPlays[playerId]?.size ?? 0;

  const averageQuizScore =
    playerQuizzes.length > 0
      ? Math.round(
          (playerQuizzes.reduce(
            (sum, q) => sum + (q.score / q.totalQuestions) * 100,
            0,
          ) /
            playerQuizzes.length) *
            10,
        ) / 10
      : 0;

  // Calculate streak: consecutive days with quiz activity
  const streak = calculateStreak(playerQuizzes);

  const lastQuiz = playerQuizzes
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    )[0];

  return {
    playerId,
    playsViewed: viewed,
    quizzesCompleted: playerQuizzes.length,
    averageQuizScore,
    streak,
    lastActive: lastQuiz?.completedAt ?? '',
  };
}

/**
 * Calculate the number of consecutive days with quiz activity.
 */
function calculateStreak(quizzes: PlayerQuizResult[]): number {
  if (quizzes.length === 0) return 0;

  const uniqueDays = new Set(
    quizzes.map((q) => new Date(q.completedAt).toISOString().slice(0, 10)),
  );
  const sortedDays = Array.from(uniqueDays).sort().reverse();

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);

  // Start from today or yesterday
  const startDate = sortedDays[0] === today ? today : sortedDays[0];
  if (!startDate) return 0;

  let current = new Date(startDate);
  for (const day of sortedDays) {
    const expected = current.toISOString().slice(0, 10);
    if (day === expected) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Queue a notification for a player.
 */
export function sendNotification(
  playerId: string,
  type: NotificationType,
  message: string,
): PlayerNotification {
  if (!message.trim()) {
    throw new Error('Notification message is required');
  }

  const notification: PlayerNotification = {
    id: generateId('notif'),
    playerId,
    type,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  };
  notifications.push(notification);
  return notification;
}

/**
 * Get unread notifications for a player.
 */
export function getPlayerNotifications(playerId: string): PlayerNotification[] {
  return notifications
    .filter((n) => n.playerId === playerId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

/**
 * Record that a player viewed a play.
 */
export function recordPlayViewed(playerId: string, playId: string): void {
  if (!viewedPlays[playerId]) {
    viewedPlays[playerId] = new Set();
  }
  viewedPlays[playerId].add(playId);
}

/**
 * Set plays data (for testing).
 */
export function setPlays(plays: Play[]): void {
  allPlays = [...plays];
}

/**
 * Clear all player app data (for testing).
 */
export function clearPlayerAppData(): void {
  allPlays = [];
  quizResults = [];
  notifications = [];
  viewedPlays = {};
}
