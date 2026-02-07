import { describe, it, expect } from 'vitest';
import {
  processFilmScreenshot,
  mapToFieldCoordinates,
  createPlayFromCapture,
  detectFieldOrientation,
} from '@/lib/ai/film-capture';
import type { FilmCaptureResult, DetectedPlayer, FieldBounds } from '@/lib/ai/film-capture';

// ---- Helpers ----

const defaultFieldBounds: FieldBounds = { x: 0, y: 0, width: 800, height: 500 };

function makeSampleResult(overrides: Partial<FilmCaptureResult> = {}): FilmCaptureResult {
  return {
    imageData: 'data:image/png;base64,sample',
    detectedPlayers: [
      { x: 400, y: 250, team: 'offense', confidence: 0.95 },
      { x: 350, y: 250, team: 'offense', confidence: 0.90 },
      { x: 300, y: 220, team: 'defense', confidence: 0.80 },
    ],
    suggestedFormation: 'Shotgun',
    confidence: 0.88,
    ...overrides,
  };
}

// ---- detectFieldOrientation ----

describe('detectFieldOrientation()', () => {
  it('returns "unknown" for empty image data', () => {
    expect(detectFieldOrientation('')).toBe('unknown');
  });

  it('returns "unknown" for whitespace-only data', () => {
    expect(detectFieldOrientation('   ')).toBe('unknown');
  });

  it('detects horizontal orientation from hints', () => {
    expect(detectFieldOrientation('data:image/png;horizontal')).toBe('horizontal');
  });

  it('detects vertical orientation from hints', () => {
    expect(detectFieldOrientation('data:image/png;vertical')).toBe('vertical');
  });

  it('detects landscape as horizontal', () => {
    expect(detectFieldOrientation('landscape-broadcast-capture')).toBe('horizontal');
  });

  it('detects portrait as vertical', () => {
    expect(detectFieldOrientation('portrait-phone-capture')).toBe('vertical');
  });

  it('defaults to horizontal for standard image data', () => {
    expect(detectFieldOrientation('data:image/png;base64,abc123')).toBe('horizontal');
  });
});

// ---- processFilmScreenshot ----

describe('processFilmScreenshot()', () => {
  it('returns detected players for valid input', () => {
    const result = processFilmScreenshot('data:image/png;base64,abc', defaultFieldBounds);
    expect(result.detectedPlayers.length).toBeGreaterThan(0);
  });

  it('includes both offense and defense players', () => {
    const result = processFilmScreenshot('data:image/png;base64,abc', defaultFieldBounds);
    const offensePlayers = result.detectedPlayers.filter((p) => p.team === 'offense');
    const defensePlayers = result.detectedPlayers.filter((p) => p.team === 'defense');
    expect(offensePlayers.length).toBeGreaterThan(0);
    expect(defensePlayers.length).toBeGreaterThan(0);
  });

  it('suggests a formation', () => {
    const result = processFilmScreenshot('data:image/png;base64,abc', defaultFieldBounds);
    expect(result.suggestedFormation).toBe('Shotgun');
  });

  it('returns confidence between 0 and 1', () => {
    const result = processFilmScreenshot('data:image/png;base64,abc', defaultFieldBounds);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('preserves the original image data', () => {
    const imgData = 'data:image/png;base64,test123';
    const result = processFilmScreenshot(imgData, defaultFieldBounds);
    expect(result.imageData).toBe(imgData);
  });

  it('throws for empty image data', () => {
    expect(() => processFilmScreenshot('', defaultFieldBounds)).toThrow('Image data is required');
  });

  it('throws for whitespace-only image data', () => {
    expect(() => processFilmScreenshot('   ', defaultFieldBounds)).toThrow('Image data is required');
  });

  it('throws for zero-dimension field bounds', () => {
    expect(() =>
      processFilmScreenshot('data:image/png;base64,abc', { x: 0, y: 0, width: 0, height: 500 }),
    ).toThrow('Field bounds must have positive dimensions');
  });

  it('throws for negative field bounds', () => {
    expect(() =>
      processFilmScreenshot('data:image/png;base64,abc', { x: 0, y: 0, width: 800, height: -10 }),
    ).toThrow('Field bounds must have positive dimensions');
  });

  it('all players have confidence scores', () => {
    const result = processFilmScreenshot('data:image/png;base64,abc', defaultFieldBounds);
    for (const player of result.detectedPlayers) {
      expect(player.confidence).toBeGreaterThan(0);
      expect(player.confidence).toBeLessThanOrEqual(1);
    }
  });
});

// ---- mapToFieldCoordinates ----

describe('mapToFieldCoordinates()', () => {
  it('maps detected players to field coordinates', () => {
    const players: DetectedPlayer[] = [
      { x: 50, y: 50, team: 'offense', confidence: 0.9 },
    ];
    const result = mapToFieldCoordinates(players, 800, 500);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBeDefined();
    expect(result[0].y).toBeDefined();
  });

  it('returns empty array for no players', () => {
    const result = mapToFieldCoordinates([], 800, 500);
    expect(result).toHaveLength(0);
  });

  it('preserves count of detected players', () => {
    const players: DetectedPlayer[] = [
      { x: 10, y: 20, team: 'offense', confidence: 0.9 },
      { x: 30, y: 40, team: 'defense', confidence: 0.8 },
      { x: 50, y: 60, team: 'offense', confidence: 0.7 },
    ];
    const result = mapToFieldCoordinates(players, 800, 500);
    expect(result).toHaveLength(3);
  });

  it('throws for zero field width', () => {
    expect(() =>
      mapToFieldCoordinates([{ x: 10, y: 10, team: 'offense', confidence: 0.9 }], 0, 500),
    ).toThrow('Field dimensions must be positive');
  });

  it('throws for negative field height', () => {
    expect(() =>
      mapToFieldCoordinates([{ x: 10, y: 10, team: 'offense', confidence: 0.9 }], 800, -100),
    ).toThrow('Field dimensions must be positive');
  });

  it('produces numeric x and y values', () => {
    const players: DetectedPlayer[] = [
      { x: 25, y: 75, team: 'offense', confidence: 0.9 },
    ];
    const result = mapToFieldCoordinates(players, 800, 500);
    expect(typeof result[0].x).toBe('number');
    expect(typeof result[0].y).toBe('number');
    expect(Number.isFinite(result[0].x)).toBe(true);
    expect(Number.isFinite(result[0].y)).toBe(true);
  });
});

// ---- createPlayFromCapture ----

describe('createPlayFromCapture()', () => {
  it('creates a Play with the given name', () => {
    const play = createPlayFromCapture(makeSampleResult(), 'Film Play 1');
    expect(play.name).toBe('Film Play 1');
  });

  it('trims whitespace from play name', () => {
    const play = createPlayFromCapture(makeSampleResult(), '  Trimmed Name  ');
    expect(play.name).toBe('Trimmed Name');
  });

  it('throws for empty play name', () => {
    expect(() => createPlayFromCapture(makeSampleResult(), '')).toThrow('Play name is required');
  });

  it('throws for whitespace-only play name', () => {
    expect(() => createPlayFromCapture(makeSampleResult(), '   ')).toThrow('Play name is required');
  });

  it('includes film-capture and imported tags', () => {
    const play = createPlayFromCapture(makeSampleResult(), 'Test');
    expect(play.tags).toContain('film-capture');
    expect(play.tags).toContain('imported');
  });

  it('includes notes with confidence and formation info', () => {
    const play = createPlayFromCapture(makeSampleResult(), 'Test');
    expect(play.notes).toContain('Confidence');
    expect(play.notes).toContain('Shotgun');
  });

  it('creates assignments for offensive players', () => {
    const result = makeSampleResult();
    const offenseCount = result.detectedPlayers.filter((p) => p.team === 'offense').length;
    const play = createPlayFromCapture(result, 'Test');
    expect(play.assignments).toHaveLength(offenseCount);
  });

  it('creates defensive overlay from defensive players', () => {
    const play = createPlayFromCapture(makeSampleResult(), 'Test');
    expect(play.defensiveOverlay).toBeDefined();
    expect(play.defensiveOverlay!.players.length).toBeGreaterThan(0);
  });

  it('handles result with no defensive players', () => {
    const result = makeSampleResult({
      detectedPlayers: [
        { x: 400, y: 250, team: 'offense', confidence: 0.95 },
      ],
    });
    const play = createPlayFromCapture(result, 'No Defense');
    expect(play.defensiveOverlay).toBeUndefined();
  });

  it('assigns a valid formation ID or "unknown"', () => {
    const play = createPlayFromCapture(makeSampleResult(), 'Test');
    expect(play.formationId).toBeDefined();
    expect(typeof play.formationId).toBe('string');
    expect(play.formationId.length).toBeGreaterThan(0);
  });

  it('sets timestamps on created play', () => {
    const play = createPlayFromCapture(makeSampleResult(), 'Test');
    expect(play.createdAt).toBeDefined();
    expect(play.updatedAt).toBeDefined();
    expect(new Date(play.createdAt).getTime()).toBeGreaterThan(0);
  });
});
