/**
 * Shareable Formation Library (#286)
 *
 * Allows users to publish, import, search, and rate shared formation libraries.
 */

import type { Formation } from '@/types';

// ---- Types ----

export interface ShareableLibrary {
  id: string;
  name: string;
  description: string;
  formations: Formation[];
  author: string;
  isPublic: boolean;
  downloads: number;
  tags: string[];
  rating?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LibrarySearchResult {
  libraries: ShareableLibrary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LibraryRating {
  libraryId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

// ---- In-memory store (simulates database) ----

const libraryStore = new Map<string, ShareableLibrary>();
const ratingStore = new Map<string, LibraryRating[]>();

/** Reset stores -- exposed for testing */
export function _resetStores(): void {
  libraryStore.clear();
  ratingStore.clear();
}

/** Get a library by id -- exposed for testing */
export function _getLibrary(id: string): ShareableLibrary | undefined {
  return libraryStore.get(id);
}

// ---- Helpers ----

function generateId(): string {
  return `lib_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

function generateShareUrl(libraryId: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://app.playbook.com';
  return `${baseUrl}/library/${libraryId}`;
}

// ---- Public API ----

/**
 * Publish a library -- marks it as public and generates a share URL.
 * If the library has no id, one is assigned.
 */
export function publishLibrary(
  library: ShareableLibrary,
): { library: ShareableLibrary; shareUrl: string } {
  if (!library.name || library.name.trim() === '') {
    throw new Error('Library name is required');
  }

  if (library.formations.length === 0) {
    throw new Error('Library must contain at least one formation');
  }

  const published: ShareableLibrary = {
    ...library,
    id: library.id || generateId(),
    isPublic: true,
    updatedAt: new Date().toISOString(),
  };

  libraryStore.set(published.id, published);

  return {
    library: published,
    shareUrl: generateShareUrl(published.id),
  };
}

/**
 * Import a library by id -- copies formations to the caller's account.
 * Returns the copied formations with new ids.
 */
export function importLibrary(
  libraryId: string,
): { formations: Formation[]; libraryName: string } {
  const library = libraryStore.get(libraryId);

  if (!library) {
    throw new Error(`Library not found: ${libraryId}`);
  }

  if (!library.isPublic) {
    throw new Error('Library is not public');
  }

  // Increment download count
  library.downloads += 1;
  libraryStore.set(libraryId, library);

  // Deep-copy formations with new ids
  const copiedFormations = library.formations.map((f) => ({
    ...f,
    id: `imported_${f.id}_${Date.now()}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return {
    formations: copiedFormations,
    libraryName: library.name,
  };
}

/**
 * Search public libraries by query string and optional tags.
 */
export function searchLibraries(
  query: string,
  tags?: string[],
): LibrarySearchResult {
  const lowerQuery = query.toLowerCase();

  const results: ShareableLibrary[] = [];

  libraryStore.forEach((lib) => {
    if (!lib.isPublic) return;

    const matchesQuery =
      lowerQuery === '' ||
      lib.name.toLowerCase().includes(lowerQuery) ||
      lib.description.toLowerCase().includes(lowerQuery) ||
      lib.author.toLowerCase().includes(lowerQuery) ||
      lib.tags.some((t) => t.toLowerCase().includes(lowerQuery));

    const matchesTags =
      !tags ||
      tags.length === 0 ||
      tags.some((tag) =>
        lib.tags.some((lt) => lt.toLowerCase() === tag.toLowerCase()),
      );

    if (matchesQuery && matchesTags) {
      results.push(lib);
    }
  });

  // Sort by downloads descending (popularity)
  results.sort((a, b) => b.downloads - a.downloads);

  return {
    libraries: results,
    total: results.length,
    page: 1,
    pageSize: results.length,
  };
}

/**
 * Rate a library. Each user can only rate once; subsequent calls update the rating.
 * Returns the updated average rating.
 */
export function rateLibrary(
  libraryId: string,
  rating: 1 | 2 | 3 | 4 | 5,
  userId: string = 'anonymous',
): { averageRating: number; ratingCount: number } {
  const library = libraryStore.get(libraryId);

  if (!library) {
    throw new Error(`Library not found: ${libraryId}`);
  }

  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new Error('Rating must be an integer between 1 and 5');
  }

  const ratings = ratingStore.get(libraryId) || [];

  // Check if user already rated -- update if so
  const existingIdx = ratings.findIndex((r) => r.userId === userId);
  if (existingIdx >= 0) {
    ratings[existingIdx].rating = rating;
  } else {
    ratings.push({
      libraryId,
      userId,
      rating,
      createdAt: new Date().toISOString(),
    });
  }

  ratingStore.set(libraryId, ratings);

  // Calculate average
  const total = ratings.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = Math.round((total / ratings.length) * 10) / 10;
  const ratingCount = ratings.length;

  // Update library
  library.rating = averageRating;
  library.ratingCount = ratingCount;
  libraryStore.set(libraryId, library);

  return { averageRating, ratingCount };
}
