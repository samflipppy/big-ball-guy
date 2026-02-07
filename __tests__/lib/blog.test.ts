import { describe, it, expect } from 'vitest';
import {
  BLOG_CATEGORIES,
  generateSlug,
  calculateReadTime,
  searchPosts,
  getRelatedPosts,
} from '@/lib/blog';
import type { BlogPost } from '@/lib/blog';

function makePost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'post-1',
    slug: 'test-post',
    title: 'Test Post',
    excerpt: 'A test post excerpt',
    content: 'The full content of the test post goes here.',
    author: 'Coach Smith',
    tags: ['offense', 'strategy'],
    category: 'coaching-tips',
    publishedAt: '2026-01-15T00:00:00Z',
    readTimeMinutes: 3,
    ...overrides,
  };
}

describe('blog', () => {
  describe('BLOG_CATEGORIES', () => {
    it('contains 6 categories', () => {
      expect(BLOG_CATEGORIES).toHaveLength(6);
    });

    it('includes coaching-tips and formations', () => {
      expect(BLOG_CATEGORIES).toContain('coaching-tips');
      expect(BLOG_CATEGORIES).toContain('formations');
      expect(BLOG_CATEGORIES).toContain('game-planning');
      expect(BLOG_CATEGORIES).toContain('drill-ideas');
      expect(BLOG_CATEGORIES).toContain('technology');
      expect(BLOG_CATEGORIES).toContain('success-stories');
    });
  });

  describe('generateSlug', () => {
    it('converts title to lowercase hyphenated slug', () => {
      expect(generateSlug('My Great Blog Post')).toBe('my-great-blog-post');
    });

    it('removes special characters', () => {
      expect(generateSlug('How to Win: A Coach\'s Guide!')).toBe('how-to-win-a-coachs-guide');
    });

    it('collapses multiple spaces and hyphens', () => {
      expect(generateSlug('Play   Design -- Tips')).toBe('play-design-tips');
    });

    it('trims leading and trailing whitespace', () => {
      expect(generateSlug('  spaced out  ')).toBe('spaced-out');
    });

    it('handles empty strings', () => {
      expect(generateSlug('')).toBe('');
    });

    it('handles already-slugified text', () => {
      expect(generateSlug('already-slugified')).toBe('already-slugified');
    });
  });

  describe('calculateReadTime', () => {
    it('returns 1 minute for short content', () => {
      expect(calculateReadTime('A few words.')).toBe(1);
    });

    it('returns 1 minute for empty content', () => {
      expect(calculateReadTime('')).toBe(1);
    });

    it('estimates read time based on word count', () => {
      // 400 words -> 2 minutes at 200 WPM
      const words = Array(400).fill('word').join(' ');
      expect(calculateReadTime(words)).toBe(2);
    });

    it('rounds up to next minute', () => {
      // 250 words -> 1.25 minutes -> rounds to 2
      const words = Array(250).fill('word').join(' ');
      expect(calculateReadTime(words)).toBe(2);
    });
  });

  describe('searchPosts', () => {
    const posts: BlogPost[] = [
      makePost({ id: 'p1', title: 'Spread Offense Basics', content: 'Learn the spread offense', tags: ['offense'] }),
      makePost({ id: 'p2', title: 'Zone Defense', content: 'Mastering zone coverage', tags: ['defense'] }),
      makePost({ id: 'p3', title: 'Red Zone Play Design', content: 'Scoring in the red zone', tags: ['offense', 'red-zone'] }),
    ];

    it('finds posts matching query in title', () => {
      const results = searchPosts('spread', posts);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('p1');
    });

    it('finds posts matching query in content', () => {
      const results = searchPosts('zone coverage', posts);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('p2');
    });

    it('finds posts matching query in tags', () => {
      const results = searchPosts('red-zone', posts);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('p3');
    });

    it('returns empty array for empty query', () => {
      expect(searchPosts('', posts)).toEqual([]);
    });

    it('returns empty array when no posts match', () => {
      expect(searchPosts('basketball', posts)).toEqual([]);
    });

    it('is case insensitive', () => {
      const results = searchPosts('OFFENSE', posts);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getRelatedPosts', () => {
    const post = makePost({ id: 'main', category: 'coaching-tips', tags: ['offense', 'strategy'] });
    const allPosts: BlogPost[] = [
      post,
      makePost({ id: 'related-1', category: 'coaching-tips', tags: ['offense', 'strategy'] }),
      makePost({ id: 'related-2', category: 'coaching-tips', tags: ['defense'] }),
      makePost({ id: 'unrelated', category: 'technology', tags: ['software'] }),
      makePost({ id: 'tag-match', category: 'formations', tags: ['offense'] }),
    ];

    it('returns related posts sorted by relevance', () => {
      const related = getRelatedPosts(post, allPosts);
      expect(related.length).toBeGreaterThan(0);
      // Most related should be the post sharing category + tags
      expect(related[0].id).toBe('related-1');
    });

    it('excludes the source post', () => {
      const related = getRelatedPosts(post, allPosts, 10);
      expect(related.find((p) => p.id === 'main')).toBeUndefined();
    });

    it('respects the limit parameter', () => {
      const related = getRelatedPosts(post, allPosts, 2);
      expect(related.length).toBeLessThanOrEqual(2);
    });

    it('excludes posts with zero relevance', () => {
      const related = getRelatedPosts(post, allPosts, 10);
      expect(related.find((p) => p.id === 'unrelated')).toBeUndefined();
    });

    it('returns empty array when no posts are related', () => {
      const isolated = makePost({ id: 'alone', category: 'technology', tags: ['unique-tag'] });
      const others = [makePost({ id: 'other', category: 'formations', tags: ['different'] })];
      expect(getRelatedPosts(isolated, others)).toEqual([]);
    });
  });
});
