import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parsePlayDescription,
  startListening,
  stopListening,
  isSpeechRecognitionAvailable,
  type ParsedPlay,
} from '@/lib/voice-recognition';

// ============================================================
// parsePlayDescription — NLP phrase tests
// ============================================================

describe('parsePlayDescription', () => {
  describe('formation detection', () => {
    it('detects "shotgun" formation', () => {
      const result = parsePlayDescription('shotgun');
      expect(result.formationName).toBe('Shotgun');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('detects "gun" alias for Shotgun', () => {
      const result = parsePlayDescription('gun trips right');
      expect(result.formationName).toBe('Trips');
    });

    it('detects "singleback" formation', () => {
      const result = parsePlayDescription('singleback');
      expect(result.formationName).toBe('Singleback');
    });

    it('detects "i form" formation', () => {
      const result = parsePlayDescription('i form');
      expect(result.formationName).toBe('I-Form');
    });

    it('detects "i-form" formation', () => {
      const result = parsePlayDescription('i-form');
      expect(result.formationName).toBe('I-Form');
    });

    it('detects "pistol" formation', () => {
      const result = parsePlayDescription('pistol');
      expect(result.formationName).toBe('Pistol');
    });

    it('detects "empty" formation', () => {
      const result = parsePlayDescription('empty set');
      expect(result.formationName).toBe('Empty');
    });

    it('detects "trips" formation', () => {
      const result = parsePlayDescription('trips right');
      expect(result.formationName).toBe('Trips');
    });

    it('detects "bunch" formation', () => {
      const result = parsePlayDescription('bunch right');
      expect(result.formationName).toBe('Bunch');
    });

    it('detects "spread formation" as Empty', () => {
      const result = parsePlayDescription('spread formation');
      expect(result.formationName).toBe('Empty');
    });

    it('detects "shotgun trips right" as Trips', () => {
      const result = parsePlayDescription('shotgun trips right');
      expect(result.formationName).toBe('Trips');
    });
  });

  describe('concept detection', () => {
    it('detects "four verticals"', () => {
      const result = parsePlayDescription('four verticals');
      expect(result.conceptName).toBe('Four Verticals');
    });

    it('detects "four verts" alias', () => {
      const result = parsePlayDescription('four verts');
      expect(result.conceptName).toBe('Four Verticals');
    });

    it('detects "4 verts"', () => {
      const result = parsePlayDescription('4 verts');
      expect(result.conceptName).toBe('Four Verticals');
    });

    it('detects "mesh concept"', () => {
      const result = parsePlayDescription('mesh concept');
      expect(result.conceptName).toBe('Mesh');
    });

    it('detects "smash"', () => {
      const result = parsePlayDescription('smash');
      expect(result.conceptName).toBe('Smash');
    });

    it('detects "flood concept"', () => {
      const result = parsePlayDescription('flood concept');
      expect(result.conceptName).toBe('Flood');
    });

    it('detects "levels"', () => {
      const result = parsePlayDescription('levels');
      expect(result.conceptName).toBe('Levels');
    });

    it('detects "dagger"', () => {
      const result = parsePlayDescription('dagger');
      expect(result.conceptName).toBe('Dagger');
    });

    it('detects "double slants"', () => {
      const result = parsePlayDescription('double slants');
      expect(result.conceptName).toBe('Double Slants');
    });

    it('detects "slant flat" alias', () => {
      const result = parsePlayDescription('slant flat');
      expect(result.conceptName).toBe('Slant-Flat');
    });

    it('detects "curl flat" alias', () => {
      const result = parsePlayDescription('curl flat');
      expect(result.conceptName).toBe('Curl-Flat');
    });

    it('detects "stick"', () => {
      const result = parsePlayDescription('stick');
      expect(result.conceptName).toBe('Stick');
    });

    it('detects "scissors"', () => {
      const result = parsePlayDescription('scissors');
      expect(result.conceptName).toBe('Scissors');
    });

    it('detects "post wheel" alias', () => {
      const result = parsePlayDescription('post wheel');
      expect(result.conceptName).toBe('Post-Wheel');
    });

    it('detects "sail"', () => {
      const result = parsePlayDescription('sail');
      expect(result.conceptName).toBe('Sail');
    });

    it('detects "y cross" alias', () => {
      const result = parsePlayDescription('y cross');
      expect(result.conceptName).toBe('Y-Cross');
    });
  });

  describe('combined formation + concept', () => {
    it('parses "Shotgun trips right, four verticals"', () => {
      const result = parsePlayDescription('Shotgun trips right, four verticals');
      expect(result.formationName).toBe('Trips');
      expect(result.conceptName).toBe('Four Verticals');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('parses "Spread formation, mesh concept"', () => {
      const result = parsePlayDescription('Spread formation, mesh concept');
      expect(result.formationName).toBe('Empty');
      expect(result.conceptName).toBe('Mesh');
    });

    it('parses "singleback smash"', () => {
      const result = parsePlayDescription('singleback smash');
      expect(result.formationName).toBe('Singleback');
      expect(result.conceptName).toBe('Smash');
    });

    it('parses "shotgun bunch levels"', () => {
      const result = parsePlayDescription('shotgun bunch levels');
      expect(result.formationName).toBe('Bunch');
      expect(result.conceptName).toBe('Levels');
    });
  });

  describe('route detection', () => {
    it('parses "Singleback, HB dive right" with RB run route', () => {
      const result = parsePlayDescription('Singleback, HB dive right');
      expect(result.formationName).toBe('Singleback');
      expect(result.routes.length).toBeGreaterThanOrEqual(1);
      const rbRoute = result.routes.find((r) => r.position === 'RB');
      expect(rbRoute).toBeDefined();
      expect(rbRoute!.routeType).toBe('run');
    });

    it('detects RB screen route', () => {
      const result = parsePlayDescription('rb screen');
      expect(result.routes).toContainEqual(
        expect.objectContaining({ position: 'RB', routeType: 'screen' }),
      );
    });

    it('detects RB swing route', () => {
      const result = parsePlayDescription('rb swing');
      expect(result.routes).toContainEqual(
        expect.objectContaining({ position: 'RB', routeType: 'swing' }),
      );
    });

    it('detects X slant route', () => {
      const result = parsePlayDescription('x slant');
      expect(result.routes).toContainEqual(
        expect.objectContaining({ position: 'WR', routeType: 'slant' }),
      );
    });

    it('detects Z post route', () => {
      const result = parsePlayDescription('z post');
      expect(result.routes).toContainEqual(
        expect.objectContaining({ position: 'WR', routeType: 'post' }),
      );
    });

    it('detects TE seam route', () => {
      const result = parsePlayDescription('te seam');
      expect(result.routes).toContainEqual(
        expect.objectContaining({ position: 'TE', routeType: 'seam' }),
      );
    });

    it('detects TE drag route', () => {
      const result = parsePlayDescription('te drag');
      expect(result.routes).toContainEqual(
        expect.objectContaining({ position: 'TE', routeType: 'drag' }),
      );
    });

    it('detects multiple routes in one phrase', () => {
      const result = parsePlayDescription('x slant, rb flat');
      expect(result.routes.length).toBe(2);
      expect(result.routes).toContainEqual(
        expect.objectContaining({ position: 'WR', routeType: 'slant' }),
      );
      expect(result.routes).toContainEqual(
        expect.objectContaining({ position: 'RB', routeType: 'flat' }),
      );
    });

    it('each route has a confidence score', () => {
      const result = parsePlayDescription('x slant');
      for (const route of result.routes) {
        expect(route.confidence).toBeGreaterThan(0);
        expect(route.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('blocking scheme detection', () => {
    it('detects "inside zone"', () => {
      const result = parsePlayDescription('inside zone');
      expect(result.blockingScheme).toBe('Inside Zone');
    });

    it('detects "power right"', () => {
      const result = parsePlayDescription('power right');
      expect(result.blockingScheme).toBe('Power Right');
    });

    it('detects "max protection"', () => {
      const result = parsePlayDescription('max protection');
      expect(result.blockingScheme).toBe('Max Protection');
    });

    it('detects "counter"', () => {
      const result = parsePlayDescription('counter');
      expect(result.blockingScheme).toBe('Counter');
    });
  });

  describe('confidence scoring', () => {
    it('returns a confidence score between 0 and 1', () => {
      const result = parsePlayDescription('shotgun trips right, four verticals');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('returns low confidence for unrecognized input', () => {
      const result = parsePlayDescription('lorem ipsum dolor sit amet');
      expect(result.confidence).toBeLessThanOrEqual(0.2);
    });

    it('returns higher confidence for well-known phrases', () => {
      const known = parsePlayDescription('shotgun four verticals');
      const unknown = parsePlayDescription('some random words');
      expect(known.confidence).toBeGreaterThan(unknown.confidence);
    });
  });

  describe('notes preservation', () => {
    it('stores the original transcript in notes', () => {
      const result = parsePlayDescription('Shotgun trips right, four verticals');
      expect(result.notes).toBe('Shotgun trips right, four verticals');
    });

    it('trims whitespace from notes', () => {
      const result = parsePlayDescription('  singleback mesh  ');
      expect(result.notes).toBe('singleback mesh');
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      const result = parsePlayDescription('');
      expect(result.formationName).toBeUndefined();
      expect(result.conceptName).toBeUndefined();
      expect(result.routes).toHaveLength(0);
      expect(result.blockingScheme).toBeUndefined();
    });

    it('handles case-insensitive input', () => {
      const result = parsePlayDescription('SHOTGUN FOUR VERTICALS');
      expect(result.formationName).toBe('Shotgun');
      expect(result.conceptName).toBe('Four Verticals');
    });

    it('handles mixed case', () => {
      const result = parsePlayDescription('SiNgLeBaCk MeSh');
      expect(result.formationName).toBe('Singleback');
      expect(result.conceptName).toBe('Mesh');
    });
  });
});

// ============================================================
// Speech API wrapper tests
// ============================================================

describe('isSpeechRecognitionAvailable', () => {
  it('returns false when SpeechRecognition is not on window', () => {
    // jsdom doesn't have SpeechRecognition by default
    expect(isSpeechRecognitionAvailable()).toBe(false);
  });

  it('returns true when SpeechRecognition is on window', () => {
    // Mock the API
    const original = window.SpeechRecognition;
    (window as any).SpeechRecognition = class {};
    expect(isSpeechRecognitionAvailable()).toBe(true);
    // Restore
    if (original) {
      window.SpeechRecognition = original;
    } else {
      delete (window as any).SpeechRecognition;
    }
  });

  it('returns true when webkitSpeechRecognition is on window', () => {
    const original = window.webkitSpeechRecognition;
    (window as any).webkitSpeechRecognition = class {};
    expect(isSpeechRecognitionAvailable()).toBe(true);
    if (original) {
      window.webkitSpeechRecognition = original;
    } else {
      delete (window as any).webkitSpeechRecognition;
    }
  });
});

describe('startListening', () => {
  it('returns false and calls onError when speech recognition is unavailable', () => {
    const onError = vi.fn();
    const result = startListening({ onError });
    expect(result).toBe(false);
    expect(onError).toHaveBeenCalledWith('Speech recognition is not available in this browser.');
  });
});

describe('stopListening', () => {
  it('does not throw when called without an active session', () => {
    expect(() => stopListening()).not.toThrow();
  });
});
