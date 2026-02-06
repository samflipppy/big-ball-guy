import { describe, it, expect, beforeEach } from 'vitest';
import type { Formation } from '@/types';
import {
  publishLibrary,
  importLibrary,
  searchLibraries,
  rateLibrary,
  _resetStores,
  _getLibrary,
  type ShareableLibrary,
} from '@/lib/shareable-library';

// ---- Test helpers ----

function makeFormation(overrides: Partial<Formation> = {}): Formation {
  return {
    id: `form_${Math.random().toString(36).substring(2, 8)}`,
    name: 'Shotgun Spread',
    side: 'offense',
    players: [],
    personnel: '11',
    tags: ['spread'],
    isCustom: false,
    teamId: 'team-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeLibrary(overrides: Partial<ShareableLibrary> = {}): ShareableLibrary {
  return {
    id: `lib_test_${Math.random().toString(36).substring(2, 8)}`,
    name: 'Test Library',
    description: 'A test formation library',
    formations: [makeFormation()],
    author: 'Coach Smith',
    isPublic: false,
    downloads: 0,
    tags: ['spread', 'offense'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('shareable-library', () => {
  beforeEach(() => {
    _resetStores();
  });

  describe('publishLibrary', () => {
    it('marks a library as public', () => {
      const lib = makeLibrary({ isPublic: false });
      const result = publishLibrary(lib);
      expect(result.library.isPublic).toBe(true);
    });

    it('generates a share URL containing the library id', () => {
      const lib = makeLibrary();
      const result = publishLibrary(lib);
      expect(result.shareUrl).toContain(`/library/${result.library.id}`);
    });

    it('assigns an id if none is provided', () => {
      const lib = makeLibrary({ id: '' });
      const result = publishLibrary(lib);
      expect(result.library.id).toBeTruthy();
      expect(result.library.id.startsWith('lib_')).toBe(true);
    });

    it('throws when name is empty', () => {
      const lib = makeLibrary({ name: '' });
      expect(() => publishLibrary(lib)).toThrow('Library name is required');
    });

    it('throws when formations array is empty', () => {
      const lib = makeLibrary({ formations: [] });
      expect(() => publishLibrary(lib)).toThrow('Library must contain at least one formation');
    });

    it('stores the library so it can be retrieved', () => {
      const lib = makeLibrary();
      const result = publishLibrary(lib);
      const stored = _getLibrary(result.library.id);
      expect(stored).toBeDefined();
      expect(stored!.name).toBe(lib.name);
    });

    it('updates the updatedAt timestamp', () => {
      const oldDate = '2020-01-01T00:00:00.000Z';
      const lib = makeLibrary({ updatedAt: oldDate });
      const result = publishLibrary(lib);
      expect(result.library.updatedAt).not.toBe(oldDate);
    });

    it('preserves existing tags', () => {
      const lib = makeLibrary({ tags: ['run', 'goal-line'] });
      const result = publishLibrary(lib);
      expect(result.library.tags).toEqual(['run', 'goal-line']);
    });
  });

  describe('importLibrary', () => {
    it('returns copied formations with new ids', () => {
      const lib = makeLibrary();
      const { library: published } = publishLibrary(lib);
      const result = importLibrary(published.id);
      expect(result.formations.length).toBe(published.formations.length);
      expect(result.formations[0].id).not.toBe(published.formations[0].id);
    });

    it('increments the download counter', () => {
      const lib = makeLibrary({ downloads: 5 });
      const { library: published } = publishLibrary(lib);
      importLibrary(published.id);
      const stored = _getLibrary(published.id);
      expect(stored!.downloads).toBe(6);
    });

    it('returns the library name', () => {
      const lib = makeLibrary({ name: 'Wing-T Formations' });
      const { library: published } = publishLibrary(lib);
      const result = importLibrary(published.id);
      expect(result.libraryName).toBe('Wing-T Formations');
    });

    it('throws when library is not found', () => {
      expect(() => importLibrary('nonexistent')).toThrow('Library not found');
    });

    it('throws when library is not public', () => {
      const lib = makeLibrary();
      // Store directly as private
      const { library: published } = publishLibrary(lib);
      published.isPublic = false;
      expect(() => importLibrary(published.id)).toThrow('Library is not public');
    });

    it('marks imported formations as custom', () => {
      const lib = makeLibrary();
      const { library: published } = publishLibrary(lib);
      const result = importLibrary(published.id);
      expect(result.formations[0].isCustom).toBe(true);
    });
  });

  describe('searchLibraries', () => {
    it('finds libraries by name', () => {
      publishLibrary(makeLibrary({ name: 'Spread Offense Pack', tags: ['air-raid'] }));
      publishLibrary(makeLibrary({ name: 'Power Run Collection', tags: ['power'] }));

      const results = searchLibraries('spread');
      expect(results.libraries.length).toBe(1);
      expect(results.libraries[0].name).toBe('Spread Offense Pack');
    });

    it('finds libraries by description', () => {
      publishLibrary(makeLibrary({ description: 'Best RPO formations for college' }));
      const results = searchLibraries('RPO');
      expect(results.libraries.length).toBe(1);
    });

    it('finds libraries by tag', () => {
      publishLibrary(makeLibrary({ tags: ['shotgun', 'passing'] }));
      publishLibrary(makeLibrary({ tags: ['i-formation', 'running'] }));

      const results = searchLibraries('', ['shotgun']);
      expect(results.libraries.length).toBe(1);
    });

    it('returns empty results for no matches', () => {
      publishLibrary(makeLibrary({ name: 'Trips Right' }));
      const results = searchLibraries('nonexistent-xyz');
      expect(results.libraries.length).toBe(0);
      expect(results.total).toBe(0);
    });

    it('sorts by downloads descending', () => {
      publishLibrary(makeLibrary({ name: 'Low Downloads', downloads: 5, tags: ['popular'] }));
      publishLibrary(makeLibrary({ name: 'High Downloads', downloads: 100, tags: ['popular'] }));

      const results = searchLibraries('', ['popular']);
      expect(results.libraries[0].name).toBe('High Downloads');
      expect(results.libraries[1].name).toBe('Low Downloads');
    });

    it('only returns public libraries', () => {
      const { library } = publishLibrary(makeLibrary({ name: 'Public Lib' }));
      library.isPublic = false; // simulate making it private after publishing
      const results = searchLibraries('Public Lib');
      expect(results.libraries.length).toBe(0);
    });

    it('searches by author name', () => {
      publishLibrary(makeLibrary({ author: 'Coach Johnson' }));
      const results = searchLibraries('Johnson');
      expect(results.libraries.length).toBe(1);
    });

    it('returns total count', () => {
      publishLibrary(makeLibrary({ name: 'Lib A', tags: ['set'] }));
      publishLibrary(makeLibrary({ name: 'Lib B', tags: ['set'] }));
      publishLibrary(makeLibrary({ name: 'Lib C', tags: ['set'] }));

      const results = searchLibraries('', ['set']);
      expect(results.total).toBe(3);
    });
  });

  describe('rateLibrary', () => {
    it('records a rating and returns the average', () => {
      const { library } = publishLibrary(makeLibrary());
      const result = rateLibrary(library.id, 4, 'user-1');
      expect(result.averageRating).toBe(4);
      expect(result.ratingCount).toBe(1);
    });

    it('averages multiple ratings', () => {
      const { library } = publishLibrary(makeLibrary());
      rateLibrary(library.id, 5, 'user-1');
      rateLibrary(library.id, 3, 'user-2');
      const result = rateLibrary(library.id, 4, 'user-3');
      expect(result.averageRating).toBe(4);
      expect(result.ratingCount).toBe(3);
    });

    it('updates existing rating from same user', () => {
      const { library } = publishLibrary(makeLibrary());
      rateLibrary(library.id, 2, 'user-1');
      const result = rateLibrary(library.id, 5, 'user-1');
      expect(result.averageRating).toBe(5);
      expect(result.ratingCount).toBe(1);
    });

    it('throws when library is not found', () => {
      expect(() => rateLibrary('nonexistent', 5, 'user-1')).toThrow('Library not found');
    });

    it('throws for invalid rating value', () => {
      const { library } = publishLibrary(makeLibrary());
      expect(() => rateLibrary(library.id, 0 as never, 'user-1')).toThrow('Rating must be an integer between 1 and 5');
      expect(() => rateLibrary(library.id, 6 as never, 'user-1')).toThrow('Rating must be an integer between 1 and 5');
    });

    it('updates the library rating and ratingCount fields', () => {
      const { library } = publishLibrary(makeLibrary());
      rateLibrary(library.id, 4, 'user-1');
      const stored = _getLibrary(library.id);
      expect(stored!.rating).toBe(4);
      expect(stored!.ratingCount).toBe(1);
    });
  });
});
