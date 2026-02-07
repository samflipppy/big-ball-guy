import { describe, it, expect } from 'vitest';
import {
  getSharedPlayData,
  generateOpenGraphImage,
  generateSharePageMeta,
  renderStaticPlayDiagram,
} from '@/lib/ssr/shared-play-renderer';
import type { Play } from '@/types';
import type { SharedPlayPageData, MetaTag } from '@/lib/ssr/shared-play-renderer';

// Helper: minimal Play object
function makeMockPlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play_1',
    name: 'Mesh Concept',
    formationId: 'formation_spread',
    assignments: [],
    tags: ['passing'],
    personnel: '11',
    teamId: 'team_1',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
    ...overrides,
  };
}

describe('shared-play-renderer', () => {
  // ---- getSharedPlayData ----
  describe('getSharedPlayData', () => {
    it('returns play data for a valid token', async () => {
      const data = await getSharedPlayData('abcdefgh12345');
      expect(data).not.toBeNull();
      expect(data!.play).toBeDefined();
      expect(data!.author).toBeTruthy();
      expect(data!.teamName).toBeTruthy();
      expect(data!.sharedAt).toBeTruthy();
    });

    it('returns null for a token shorter than 8 characters', async () => {
      const data = await getSharedPlayData('short');
      expect(data).toBeNull();
    });

    it('returns null for an empty token', async () => {
      const data = await getSharedPlayData('');
      expect(data).toBeNull();
    });

    it('includes the token in the mock play id', async () => {
      const data = await getSharedPlayData('testtoken123');
      expect(data!.play.id).toContain('testtoken123');
    });
  });

  // ---- generateOpenGraphImage ----
  describe('generateOpenGraphImage', () => {
    it('returns an object with url, width, height, alt', () => {
      const play = makeMockPlay();
      const og = generateOpenGraphImage(play, 1200, 630);
      expect(og.url).toContain(play.id);
      expect(og.width).toBe(1200);
      expect(og.height).toBe(630);
      expect(og.alt).toContain(play.name);
    });

    it('encodes the play name in the URL', () => {
      const play = makeMockPlay({ name: 'Red Zone Slant & Go' });
      const og = generateOpenGraphImage(play, 800, 400);
      expect(og.url).toContain(encodeURIComponent('Red Zone Slant & Go'));
    });

    it('includes dimensions as query params', () => {
      const og = generateOpenGraphImage(makeMockPlay(), 1000, 500);
      expect(og.url).toContain('w=1000');
      expect(og.url).toContain('h=500');
    });
  });

  // ---- generateSharePageMeta ----
  describe('generateSharePageMeta', () => {
    const mockData: SharedPlayPageData = {
      play: makeMockPlay(),
      author: 'Coach Jones',
      teamName: 'Eagles',
      sharedAt: '2026-01-20T12:00:00Z',
    };

    it('returns an array of meta tags', () => {
      const tags = generateSharePageMeta(mockData);
      expect(tags.length).toBeGreaterThan(5);
    });

    it('includes og:title with the play name', () => {
      const tags = generateSharePageMeta(mockData);
      const ogTitle = tags.find((t) => t.property === 'og:title');
      expect(ogTitle).toBeDefined();
      expect(ogTitle!.content).toBe('Mesh Concept');
    });

    it('includes twitter:card tag', () => {
      const tags = generateSharePageMeta(mockData);
      const twitterCard = tags.find((t) => t.name === 'twitter:card');
      expect(twitterCard).toBeDefined();
      expect(twitterCard!.content).toBe('summary_large_image');
    });

    it('includes author meta tag', () => {
      const tags = generateSharePageMeta(mockData);
      const authorTag = tags.find((t) => t.name === 'author');
      expect(authorTag).toBeDefined();
      expect(authorTag!.content).toBe('Coach Jones');
    });

    it('includes description with team name and author', () => {
      const tags = generateSharePageMeta(mockData);
      const desc = tags.find((t) => t.name === 'description');
      expect(desc).toBeDefined();
      expect(desc!.content).toContain('Coach Jones');
      expect(desc!.content).toContain('Eagles');
    });
  });

  // ---- renderStaticPlayDiagram ----
  describe('renderStaticPlayDiagram', () => {
    it('returns a valid SVG string', () => {
      const play = makeMockPlay();
      const svg = renderStaticPlayDiagram(play);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('includes the field background rectangle', () => {
      const svg = renderStaticPlayDiagram(makeMockPlay());
      expect(svg).toContain('<rect');
      expect(svg).toContain('fill=');
    });

    it('includes the line of scrimmage', () => {
      const svg = renderStaticPlayDiagram(makeMockPlay());
      expect(svg).toContain('stroke-dasharray');
    });

    it('renders route paths when assignments have routes', () => {
      const play = makeMockPlay({
        assignments: [
          {
            playerId: 'p1',
            route: {
              id: 'r1',
              name: 'Slant',
              type: 'slant',
              points: [
                { x: 400, y: 250, type: 'line' },
                { x: 420, y: 200, type: 'line' },
              ],
            },
          },
        ],
      });
      const svg = renderStaticPlayDiagram(play);
      expect(svg).toContain('<path');
      expect(svg).toContain('M 400 250');
    });
  });
});
