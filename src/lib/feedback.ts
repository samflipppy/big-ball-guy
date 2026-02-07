/**
 * Customer Feedback System (#314)
 *
 * Stores and retrieves user feedback entries including bug reports,
 * feature requests, and general comments with ratings.
 */

// ---- Types ----

export type FeedbackType = 'bug' | 'feature' | 'general';

export interface FeedbackEntry {
  id: string;
  userId: string;
  type: FeedbackType;
  rating: 1 | 2 | 3 | 4 | 5;
  message: string;
  screenshot?: string;
  page: string;
  timestamp: string;
}

export interface FeedbackFilters {
  type?: FeedbackType;
  rating?: number;
  since?: string;
}

// ---- In-memory store ----

let feedbackEntries: FeedbackEntry[] = [];

function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ---- Public API ----

/**
 * Submit a feedback entry. Automatically generates an id and timestamp.
 */
export function submitFeedback(
  entry: Omit<FeedbackEntry, 'id' | 'timestamp'>,
): FeedbackEntry {
  if (!entry.message || entry.message.trim().length === 0) {
    throw new Error('Feedback message is required');
  }
  if (entry.rating < 1 || entry.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const full: FeedbackEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  feedbackEntries.push(full);
  return full;
}

/**
 * Retrieve feedback entries with optional filters.
 */
export function getFeedbackEntries(filters?: FeedbackFilters): FeedbackEntry[] {
  let results = [...feedbackEntries];

  if (filters?.type) {
    results = results.filter((e) => e.type === filters.type);
  }
  if (filters?.rating !== undefined) {
    results = results.filter((e) => e.rating >= filters.rating!);
  }
  if (filters?.since) {
    const since = new Date(filters.since);
    results = results.filter((e) => new Date(e.timestamp) >= since);
  }

  return results.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/**
 * Get average rating across all entries (or filtered).
 */
export function getAverageRating(filters?: FeedbackFilters): number {
  const entries = getFeedbackEntries(filters);
  if (entries.length === 0) return 0;
  const sum = entries.reduce((acc, e) => acc + e.rating, 0);
  return Math.round((sum / entries.length) * 10) / 10;
}

/**
 * Clear all feedback entries (for testing).
 */
export function clearFeedback(): void {
  feedbackEntries = [];
}
