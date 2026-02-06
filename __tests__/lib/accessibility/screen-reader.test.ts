import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  announceToScreenReader,
  generatePlayDescription,
  generateFormationDescription,
  getCanvasAltText,
  srOnly,
  SR_ONLY_CLASS,
  SR_ONLY_STYLES,
} from '@/lib/accessibility/screen-reader';
import type { Play, Formation } from '@/types';

describe('screen-reader', () => {
  beforeEach(() => {
    // Clean up any live regions from previous tests
    document.querySelectorAll('[id^="sr-live-region"]').forEach((el) => el.remove());
  });

  afterEach(() => {
    document.querySelectorAll('[id^="sr-live-region"]').forEach((el) => el.remove());
  });

  describe('announceToScreenReader', () => {
    it('creates an aria-live region in the DOM', () => {
      announceToScreenReader('Test message');

      const region = document.getElementById('sr-live-region-polite');
      expect(region).not.toBeNull();
      expect(region?.getAttribute('aria-live')).toBe('polite');
    });

    it('creates an assertive region when priority is assertive', () => {
      announceToScreenReader('Urgent message', 'assertive');

      const region = document.getElementById('sr-live-region-assertive');
      expect(region).not.toBeNull();
      expect(region?.getAttribute('aria-live')).toBe('assertive');
      expect(region?.getAttribute('role')).toBe('alert');
    });

    it('region is visually hidden', () => {
      announceToScreenReader('Hidden message');

      const region = document.getElementById('sr-live-region-polite');
      expect(region).not.toBeNull();
      expect(region?.style.position).toBe('absolute');
      expect(region?.style.width).toBe('1px');
      expect(region?.style.height).toBe('1px');
      expect(region?.style.overflow).toBe('hidden');
    });

    it('reuses existing live region', () => {
      announceToScreenReader('First');
      announceToScreenReader('Second');

      const regions = document.querySelectorAll('#sr-live-region-polite');
      expect(regions.length).toBe(1);
    });

    it('defaults to polite priority', () => {
      announceToScreenReader('Default priority');

      const politeRegion = document.getElementById('sr-live-region-polite');
      expect(politeRegion).not.toBeNull();
    });
  });

  describe('generatePlayDescription', () => {
    const basePlay: Play = {
      id: 'play-1',
      name: 'Mesh Concept',
      formationId: 'form-1',
      assignments: [],
      tags: [],
      personnel: '11',
      teamId: 'team-1',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    it('includes the play name', () => {
      const desc = generatePlayDescription(basePlay);
      expect(desc).toContain('Play: Mesh Concept.');
    });

    it('includes personnel info', () => {
      const desc = generatePlayDescription(basePlay);
      expect(desc).toContain('Personnel: 11.');
    });

    it('includes category when present', () => {
      const play = { ...basePlay, category: 'Pass' };
      const desc = generatePlayDescription(play);
      expect(desc).toContain('Category: Pass.');
    });

    it('includes hash when present', () => {
      const play = { ...basePlay, hash: 'left' as const };
      const desc = generatePlayDescription(play);
      expect(desc).toContain('Hash: left.');
    });

    it('describes route assignments', () => {
      const play: Play = {
        ...basePlay,
        assignments: [
          {
            playerId: 'x',
            label: 'X',
            route: {
              id: 'r1',
              name: 'Slant',
              type: 'slant',
              points: [{ x: 0, y: 0, type: 'line' }],
            },
          },
        ],
      };
      const desc = generatePlayDescription(play);
      expect(desc).toContain('X runs a slant route');
    });

    it('describes blocking assignments count', () => {
      const play: Play = {
        ...basePlay,
        assignments: [
          {
            playerId: 'lt',
            blocking: {
              id: 'b1',
              blockerId: 'lt',
              blockType: 'drive',
            },
          },
          {
            playerId: 'lg',
            blocking: {
              id: 'b2',
              blockerId: 'lg',
              blockType: 'drive',
            },
          },
        ],
      };
      const desc = generatePlayDescription(play);
      expect(desc).toContain('2 blocking assignments.');
    });

    it('describes motion assignments', () => {
      const play: Play = {
        ...basePlay,
        assignments: [
          {
            playerId: 'h',
            label: 'H',
            motion: {
              startPosition: { x: 0, y: 0 },
              endPosition: { x: 100, y: 0 },
              timing: 'pre-snap',
            },
          },
        ],
      };
      const desc = generatePlayDescription(play);
      expect(desc).toContain('H in pre-snap motion');
    });

    it('includes tags when present', () => {
      const play = { ...basePlay, tags: ['red-zone', 'quick-game'] };
      const desc = generatePlayDescription(play);
      expect(desc).toContain('Tags: red-zone, quick-game.');
    });

    it('includes notes when present', () => {
      const play = { ...basePlay, notes: 'Hot route against Cover 3' };
      const desc = generatePlayDescription(play);
      expect(desc).toContain('Notes: Hot route against Cover 3.');
    });
  });

  describe('generateFormationDescription', () => {
    const baseFormation: Formation = {
      id: 'form-1',
      name: 'Singleback',
      side: 'offense',
      players: [
        { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
        { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 330 }, side: 'offense' },
        { id: 'lt', position: 'LT', label: 'LT', location: { x: 310, y: 248 }, side: 'offense' },
      ],
      personnel: '11',
      tags: [],
      isCustom: false,
      teamId: 'team-1',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    it('includes the formation name', () => {
      const desc = generateFormationDescription(baseFormation);
      expect(desc).toContain('Formation: Singleback.');
    });

    it('includes the side', () => {
      const desc = generateFormationDescription(baseFormation);
      expect(desc).toContain('Side: offense.');
    });

    it('includes personnel info', () => {
      const desc = generateFormationDescription(baseFormation);
      expect(desc).toContain('Personnel: 11.');
    });

    it('includes total player count', () => {
      const desc = generateFormationDescription(baseFormation);
      expect(desc).toContain('Total players: 3.');
    });

    it('groups skill positions', () => {
      const desc = generateFormationDescription(baseFormation);
      expect(desc).toContain('Skill Positions: QB, RB.');
    });

    it('groups offensive line', () => {
      const desc = generateFormationDescription(baseFormation);
      expect(desc).toContain('Offensive Line: LT.');
    });
  });

  describe('getCanvasAltText', () => {
    const basePlay: Play = {
      id: 'play-1',
      name: 'Power Right',
      formationId: 'form-1',
      assignments: [],
      tags: [],
      personnel: '22',
      teamId: 'team-1',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    it('includes the play name', () => {
      const alt = getCanvasAltText(basePlay);
      expect(alt).toContain('Diagram of play "Power Right"');
    });

    it('includes personnel info', () => {
      const alt = getCanvasAltText(basePlay);
      expect(alt).toContain('22 personnel');
    });

    it('includes route count when routes exist', () => {
      const play: Play = {
        ...basePlay,
        assignments: [
          {
            playerId: 'x',
            route: { id: 'r1', name: 'Go', type: 'streak', points: [] },
          },
          {
            playerId: 'z',
            route: { id: 'r2', name: 'Slant', type: 'slant', points: [] },
          },
        ],
      };
      const alt = getCanvasAltText(play);
      expect(alt).toContain('2 routes');
    });

    it('includes defensive overlay info', () => {
      const play: Play = {
        ...basePlay,
        defensiveOverlay: {
          front: '4-3',
          coverage: 'Cover 2',
          players: [],
        },
      };
      const alt = getCanvasAltText(play);
      expect(alt).toContain('against 4-3 Cover 2');
    });

    it('ends with a period', () => {
      const alt = getCanvasAltText(basePlay);
      expect(alt.endsWith('.')).toBe(true);
    });
  });

  describe('srOnly', () => {
    it('returns the text unchanged', () => {
      expect(srOnly('hidden label')).toBe('hidden label');
    });
  });

  describe('SR_ONLY_CLASS', () => {
    it('is a non-empty string', () => {
      expect(typeof SR_ONLY_CLASS).toBe('string');
      expect(SR_ONLY_CLASS.length).toBeGreaterThan(0);
    });

    it('contains visually-hidden class keywords', () => {
      expect(SR_ONLY_CLASS).toContain('absolute');
      expect(SR_ONLY_CLASS).toContain('overflow-hidden');
    });
  });

  describe('SR_ONLY_STYLES', () => {
    it('has position absolute', () => {
      expect(SR_ONLY_STYLES.position).toBe('absolute');
    });

    it('has 1px dimensions', () => {
      expect(SR_ONLY_STYLES.width).toBe('1px');
      expect(SR_ONLY_STYLES.height).toBe('1px');
    });

    it('has overflow hidden', () => {
      expect(SR_ONLY_STYLES.overflow).toBe('hidden');
    });
  });
});
