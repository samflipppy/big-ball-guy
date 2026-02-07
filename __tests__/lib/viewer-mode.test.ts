import { describe, it, expect, beforeEach } from 'vitest';
import {
  createViewerLink,
  validateViewerAccess,
  filterContentForViewer,
  isViewerMode,
  enterViewerMode,
  exitViewerMode,
  getViewerConfig,
  VIEWER_SECTIONS,
  _resetViewerState,
} from '@/lib/viewer-mode';
import type { ViewerConfig } from '@/lib/viewer-mode';

// ---- Setup ----

beforeEach(() => {
  _resetViewerState();
});

// ---- Helpers ----

function makeConfig(overrides: Partial<ViewerConfig> = {}): ViewerConfig {
  return {
    allowedSections: ['roster', 'schedule'],
    watermark: true,
    teamName: 'Test Eagles',
    ...overrides,
  };
}

// ---- VIEWER_SECTIONS ----

describe('VIEWER_SECTIONS', () => {
  it('contains the expected sections', () => {
    expect(VIEWER_SECTIONS).toContain('roster');
    expect(VIEWER_SECTIONS).toContain('schedule');
    expect(VIEWER_SECTIONS).toContain('depth-chart');
    expect(VIEWER_SECTIONS).toContain('highlights');
  });

  it('has exactly 4 sections', () => {
    expect(VIEWER_SECTIONS).toHaveLength(4);
  });
});

// ---- createViewerLink ----

describe('createViewerLink()', () => {
  it('returns a URL string starting with /viewer', () => {
    const link = createViewerLink('team-1', makeConfig());
    expect(link).toMatch(/^\/viewer\?token=/);
  });

  it('includes an encoded token in the URL', () => {
    const link = createViewerLink('team-1', makeConfig());
    expect(link).toContain('token=');
    const token = decodeURIComponent(link.split('token=')[1]);
    expect(token.length).toBeGreaterThan(0);
  });

  it('throws for empty team ID', () => {
    expect(() => createViewerLink('', makeConfig())).toThrow('Team ID is required');
  });

  it('throws for whitespace-only team ID', () => {
    expect(() => createViewerLink('   ', makeConfig())).toThrow('Team ID is required');
  });

  it('throws for empty team name', () => {
    expect(() => createViewerLink('team-1', makeConfig({ teamName: '' }))).toThrow(
      'Team name is required',
    );
  });

  it('throws when no sections are allowed', () => {
    expect(() => createViewerLink('team-1', makeConfig({ allowedSections: [] }))).toThrow(
      'At least one section must be allowed',
    );
  });

  it('throws for invalid section names', () => {
    expect(() =>
      createViewerLink('team-1', makeConfig({ allowedSections: ['playbook'] })),
    ).toThrow('Invalid section: playbook');
  });

  it('generates unique links for different calls', () => {
    const link1 = createViewerLink('team-1', makeConfig());
    const link2 = createViewerLink('team-1', makeConfig());
    expect(link1).not.toBe(link2);
  });
});

// ---- validateViewerAccess ----

describe('validateViewerAccess()', () => {
  it('returns true for a valid token', () => {
    const link = createViewerLink('team-1', makeConfig());
    const token = decodeURIComponent(link.split('token=')[1]);
    expect(validateViewerAccess(token)).toBe(true);
  });

  it('returns false for an unknown token', () => {
    expect(validateViewerAccess('unknown-token')).toBe(false);
  });

  it('returns false for an empty token', () => {
    expect(validateViewerAccess('')).toBe(false);
  });

  it('returns false for whitespace token', () => {
    expect(validateViewerAccess('   ')).toBe(false);
  });

  it('returns false for an expired token', () => {
    const pastDate = new Date(Date.now() - 86400_000).toISOString(); // yesterday
    const link = createViewerLink('team-1', makeConfig({ expiresAt: pastDate }));
    const token = decodeURIComponent(link.split('token=')[1]);
    expect(validateViewerAccess(token)).toBe(false);
  });

  it('returns true for a non-expired token', () => {
    const futureDate = new Date(Date.now() + 86400_000).toISOString(); // tomorrow
    const link = createViewerLink('team-1', makeConfig({ expiresAt: futureDate }));
    const token = decodeURIComponent(link.split('token=')[1]);
    expect(validateViewerAccess(token)).toBe(true);
  });
});

// ---- filterContentForViewer ----

describe('filterContentForViewer()', () => {
  const sampleContent = [
    { section: 'roster', name: 'Player List' },
    { section: 'schedule', name: 'Game Schedule' },
    { section: 'depth-chart', name: 'Depth Chart' },
    { section: 'highlights', name: 'Highlights Reel' },
    { section: 'playbook', name: 'Secret Plays' },
  ];

  it('filters content to allowed sections only', () => {
    const result = filterContentForViewer(sampleContent, ['roster']);
    expect(result).toHaveLength(1);
    expect(result[0].section).toBe('roster');
  });

  it('allows multiple sections', () => {
    const result = filterContentForViewer(sampleContent, ['roster', 'schedule']);
    expect(result).toHaveLength(2);
  });

  it('excludes content from disallowed sections', () => {
    const result = filterContentForViewer(sampleContent, ['roster', 'schedule']);
    const sections = result.map((c) => c.section);
    expect(sections).not.toContain('playbook');
    expect(sections).not.toContain('depth-chart');
  });

  it('returns empty array for empty content', () => {
    const result = filterContentForViewer([], ['roster']);
    expect(result).toHaveLength(0);
  });

  it('returns empty array when no sections match', () => {
    const result = filterContentForViewer(sampleContent, []);
    expect(result).toHaveLength(0);
  });
});

// ---- isViewerMode / enterViewerMode / exitViewerMode ----

describe('viewer mode session', () => {
  it('is not in viewer mode by default', () => {
    expect(isViewerMode()).toBe(false);
  });

  it('enters viewer mode with a valid token', () => {
    const link = createViewerLink('team-1', makeConfig());
    const token = decodeURIComponent(link.split('token=')[1]);
    expect(enterViewerMode(token)).toBe(true);
    expect(isViewerMode()).toBe(true);
  });

  it('does not enter viewer mode with an invalid token', () => {
    expect(enterViewerMode('bad-token')).toBe(false);
    expect(isViewerMode()).toBe(false);
  });

  it('exits viewer mode', () => {
    const link = createViewerLink('team-1', makeConfig());
    const token = decodeURIComponent(link.split('token=')[1]);
    enterViewerMode(token);
    expect(isViewerMode()).toBe(true);
    exitViewerMode();
    expect(isViewerMode()).toBe(false);
  });

  it('returns viewer config when in viewer mode', () => {
    const config = makeConfig({ teamName: 'Eagles' });
    const link = createViewerLink('team-1', config);
    const token = decodeURIComponent(link.split('token=')[1]);
    enterViewerMode(token);
    const retrieved = getViewerConfig();
    expect(retrieved).not.toBeNull();
    expect(retrieved!.teamName).toBe('Eagles');
    expect(retrieved!.allowedSections).toEqual(config.allowedSections);
  });

  it('returns null config when not in viewer mode', () => {
    expect(getViewerConfig()).toBeNull();
  });
});
