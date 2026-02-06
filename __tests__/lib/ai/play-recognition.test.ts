import { describe, it, expect } from 'vitest';
import {
  analyzePlayImage,
  imageToCanvasCoordinates,
  applyMapping,
  suggestFormation,
  convertToPlay,
} from '@/lib/ai/play-recognition';
import type { PlayRecognitionResult } from '@/lib/ai/play-recognition';

// ---- Tests ----

describe('imageToCanvasCoordinates()', () => {
  it('produces correct scale for same aspect ratio', () => {
    const mapping = imageToCanvasCoordinates(800, 600, 800, 600);
    expect(mapping.scaleX).toBeCloseTo(1);
    expect(mapping.scaleY).toBeCloseTo(1);
    expect(mapping.offsetX).toBeCloseTo(0);
    expect(mapping.offsetY).toBeCloseTo(0);
  });

  it('scales down large images proportionally', () => {
    const mapping = imageToCanvasCoordinates(1600, 1200, 800, 600);
    expect(mapping.scaleX).toBeCloseTo(0.5);
    expect(mapping.scaleY).toBeCloseTo(0.5);
  });

  it('centers when aspect ratios differ', () => {
    // Wide image mapped to square field
    const mapping = imageToCanvasCoordinates(800, 400, 400, 400);
    // scale = min(400/800, 400/400) = min(0.5, 1) = 0.5
    expect(mapping.scaleX).toBeCloseTo(0.5);
    expect(mapping.scaleY).toBeCloseTo(0.5);
    // mappedWidth = 800 * 0.5 = 400, offsetX = 0
    expect(mapping.offsetX).toBeCloseTo(0);
    // mappedHeight = 400 * 0.5 = 200, offsetY = (400-200)/2 = 100
    expect(mapping.offsetY).toBeCloseTo(100);
  });

  it('handles tall images', () => {
    const mapping = imageToCanvasCoordinates(400, 800, 400, 400);
    // scale = min(400/400, 400/800) = min(1, 0.5) = 0.5
    expect(mapping.scaleX).toBeCloseTo(0.5);
    expect(mapping.offsetX).toBeCloseTo(100); // (400 - 200)/2
    expect(mapping.offsetY).toBeCloseTo(0);
  });
});

describe('applyMapping()', () => {
  it('transforms a point using scale and offset', () => {
    const mapping = { scaleX: 0.5, scaleY: 0.5, offsetX: 10, offsetY: 20 };
    const result = applyMapping({ x: 100, y: 200 }, mapping);
    expect(result.x).toBeCloseTo(60); // 100 * 0.5 + 10
    expect(result.y).toBeCloseTo(120); // 200 * 0.5 + 20
  });

  it('handles identity mapping', () => {
    const mapping = { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
    const result = applyMapping({ x: 42, y: 99 }, mapping);
    expect(result.x).toBe(42);
    expect(result.y).toBe(99);
  });
});

describe('suggestFormation()', () => {
  it('returns undefined for empty positions', () => {
    expect(suggestFormation([])).toBeUndefined();
  });

  it('suggests Shotgun for shotgun-like positions', () => {
    // Approximate shotgun positions
    const positions = [
      { x: 310, y: 248 }, { x: 350, y: 248 }, { x: 400, y: 248 },
      { x: 450, y: 248 }, { x: 490, y: 248 }, // OL
      { x: 400, y: 310 }, // QB
      { x: 360, y: 310 }, // RB
      { x: 80, y: 248 }, { x: 680, y: 248 }, { x: 600, y: 248 }, // WR
      { x: 520, y: 248 }, // TE
    ];
    const formation = suggestFormation(positions);
    expect(formation).toBeDefined();
    expect(formation!.name).toBe('Shotgun');
  });

  it('suggests I-Form for I-form-like positions', () => {
    const positions = [
      { x: 310, y: 248 }, { x: 350, y: 248 }, { x: 400, y: 248 },
      { x: 450, y: 248 }, { x: 490, y: 248 }, // OL
      { x: 400, y: 280 }, // QB
      { x: 400, y: 315 }, // FB
      { x: 400, y: 350 }, // RB
      { x: 80, y: 248 }, { x: 680, y: 248 }, // WR
      { x: 520, y: 248 }, // TE
    ];
    const formation = suggestFormation(positions);
    expect(formation).toBeDefined();
    expect(formation!.name).toBe('I-Form');
  });

  it('returns a formation even for imprecise positions', () => {
    const positions = [
      { x: 300, y: 250 }, { x: 340, y: 250 }, { x: 395, y: 250 },
      { x: 445, y: 250 }, { x: 485, y: 250 },
      { x: 395, y: 285 },
      { x: 395, y: 335 },
      { x: 75, y: 250 }, { x: 675, y: 250 }, { x: 575, y: 250 },
      { x: 515, y: 250 },
    ];
    const formation = suggestFormation(positions);
    expect(formation).toBeDefined();
  });
});

describe('analyzePlayImage()', () => {
  it('returns a recognition result with expected fields', async () => {
    const result = await analyzePlayImage('data:image/png;base64,abc123');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.playerPositions.length).toBeGreaterThan(0);
    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.notes).toBeDefined();
  });

  it('throws for empty image data', async () => {
    await expect(analyzePlayImage('')).rejects.toThrow('Image data is required');
  });

  it('throws for whitespace-only image data', async () => {
    await expect(analyzePlayImage('   ')).rejects.toThrow('Image data is required');
  });

  it('returns detected formation name', async () => {
    const result = await analyzePlayImage('data:image/png;base64,test');
    expect(result.detectedFormation).toBe('Shotgun');
  });

  it('returns routes with confidence scores', async () => {
    const result = await analyzePlayImage('data:image/png;base64,test');
    for (const route of result.routes) {
      expect(route.confidence).toBeGreaterThanOrEqual(0);
      expect(route.confidence).toBeLessThanOrEqual(1);
      expect(route.routeType).toBeDefined();
    }
  });
});

describe('convertToPlay()', () => {
  const sampleResult: PlayRecognitionResult = {
    confidence: 0.85,
    detectedFormation: 'Shotgun',
    playerPositions: [
      { x: 310, y: 248 }, { x: 350, y: 248 }, { x: 400, y: 248 },
      { x: 450, y: 248 }, { x: 490, y: 248 },
      { x: 400, y: 310 }, { x: 360, y: 310 },
      { x: 80, y: 248 }, { x: 680, y: 248 }, { x: 600, y: 248 },
      { x: 520, y: 248 },
    ],
    routes: [
      {
        startPosition: { x: 80, y: 248 },
        endPosition: { x: 92, y: 218 },
        routeType: 'slant',
        confidence: 0.85,
      },
    ],
    notes: 'Test note',
  };

  it('creates a Play with the given name', () => {
    const play = convertToPlay(sampleResult, 'My Imported Play');
    expect(play.name).toBe('My Imported Play');
  });

  it('assigns a formation ID from suggestion', () => {
    const play = convertToPlay(sampleResult, 'Test');
    expect(play.formationId).toBe('builtin-shotgun');
  });

  it('includes imported and ai-detected tags', () => {
    const play = convertToPlay(sampleResult, 'Test');
    expect(play.tags).toContain('imported');
    expect(play.tags).toContain('ai-detected');
  });

  it('converts routes to assignments', () => {
    const play = convertToPlay(sampleResult, 'Test');
    expect(play.assignments).toHaveLength(1);
    expect(play.assignments[0].route).toBeDefined();
    expect(play.assignments[0].route!.type).toBe('slant');
  });

  it('includes notes from recognition result', () => {
    const play = convertToPlay(sampleResult, 'Test');
    expect(play.notes).toBe('Test note');
  });

  it('uses "unknown" formationId when no positions are provided', () => {
    const emptyResult: PlayRecognitionResult = {
      confidence: 0.5,
      playerPositions: [],
      routes: [],
      notes: '',
    };
    const play = convertToPlay(emptyResult, 'Empty');
    expect(play.formationId).toBe('unknown');
  });
});
