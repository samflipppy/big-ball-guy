/**
 * Content Marketing Blog Engine (#317)
 *
 * Blog post types, slug generation, read-time calculation,
 * full-text search, and related post discovery.
 */

// ---- Types ----

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  category: BlogCategory;
  publishedAt: string;
  coverImage?: string;
  readTimeMinutes: number;
}

export type BlogCategory =
  | 'coaching-tips'
  | 'formations'
  | 'game-planning'
  | 'drill-ideas'
  | 'technology'
  | 'success-stories';

// ---- Constants ----

export const BLOG_CATEGORIES: BlogCategory[] = [
  'coaching-tips',
  'formations',
  'game-planning',
  'drill-ideas',
  'technology',
  'success-stories',
];

/** Average words-per-minute for reading speed estimation. */
const WORDS_PER_MINUTE = 200;

// ---- Public API ----

/**
 * Generate a URL-safe slug from a title.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove non-word chars (except spaces and hyphens)
    .replace(/\s+/g, '-')        // spaces to hyphens
    .replace(/-+/g, '-')         // collapse multiple hyphens
    .replace(/^-|-$/g, '');      // trim leading/trailing hyphens
}

/**
 * Estimate reading time in minutes based on word count.
 * Returns a minimum of 1 minute.
 */
export function calculateReadTime(content: string): number {
  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

/**
 * Full-text search across posts.
 * Searches title, excerpt, content, tags, and author fields.
 */
export function searchPosts(query: string, posts: BlogPost[]): BlogPost[] {
  if (!query.trim()) return [];

  const terms = query.toLowerCase().split(/\s+/);

  return posts.filter((post) => {
    const searchable = [
      post.title,
      post.excerpt,
      post.content,
      post.author,
      post.category,
      ...post.tags,
    ]
      .join(' ')
      .toLowerCase();

    return terms.every((term) => searchable.includes(term));
  });
}

/**
 * Find related posts based on shared tags and category.
 * Returns up to `limit` posts sorted by relevance score.
 */
export function getRelatedPosts(
  post: BlogPost,
  allPosts: BlogPost[],
  limit = 3,
): BlogPost[] {
  const candidates = allPosts.filter((p) => p.id !== post.id);

  const scored = candidates.map((candidate) => {
    let score = 0;

    // Category match is worth 2 points
    if (candidate.category === post.category) {
      score += 2;
    }

    // Each shared tag is worth 1 point
    for (const tag of candidate.tags) {
      if (post.tags.includes(tag)) {
        score += 1;
      }
    }

    return { post: candidate, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.post);
}
