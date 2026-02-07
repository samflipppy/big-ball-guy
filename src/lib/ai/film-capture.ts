import type { Play, Position } from '@/types';
import { suggestFormation } from '@/lib/ai/play-recognition';

// ---- Types ----

export interface DetectedPlayer {
  x: number;
  y: number;
  team: 'offense' | 'defense';
  confidence: number;
}

export interface FilmCaptureResult {
  imageData: string;
  detectedPlayers: DetectedPlayer[];
  suggestedFormation?: string;
  confidence: number;
}

export interface FieldBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---- Field orientation detection ----

/**
 * Detect the orientation of the field in a film screenshot.
 *
 * NOTE: This is a stub implementation. In production, this would use
 * computer vision to analyze yard lines and field markings.
 */
export function detectFieldOrientation(
  imageData: string,
): 'horizontal' | 'vertical' | 'unknown' {
  if (!imageData || imageData.trim().length === 0) {
    return 'unknown';
  }

  // Stub heuristic: check for orientation hints in the data URI or metadata.
  // In a real implementation, this would analyze the image content.
  const lower = imageData.toLowerCase();
  if (lower.includes('horizontal') || lower.includes('landscape')) {
    return 'horizontal';
  }
  if (lower.includes('vertical') || lower.includes('portrait')) {
    return 'vertical';
  }

  // Default assumption: most broadcast film is horizontal
  return 'horizontal';
}

// ---- Screenshot processing ----

/**
 * Process a film screenshot to detect players and their positions.
 *
 * NOTE: This is a stub implementation that returns sample data.
 * In production, this would call an AI vision model API.
 */
export function processFilmScreenshot(
  imageData: string,
  fieldBounds: FieldBounds,
): FilmCaptureResult {
  if (!imageData || imageData.trim().length === 0) {
    throw new Error('Image data is required');
  }

  if (fieldBounds.width <= 0 || fieldBounds.height <= 0) {
    throw new Error('Field bounds must have positive dimensions');
  }

  // Stub: return sample detected players simulating a shotgun formation
  const sampleOffense: DetectedPlayer[] = [
    // O-Line
    { x: fieldBounds.x + fieldBounds.width * 0.39, y: fieldBounds.y + fieldBounds.height * 0.50, team: 'offense', confidence: 0.95 },
    { x: fieldBounds.x + fieldBounds.width * 0.44, y: fieldBounds.y + fieldBounds.height * 0.50, team: 'offense', confidence: 0.93 },
    { x: fieldBounds.x + fieldBounds.width * 0.50, y: fieldBounds.y + fieldBounds.height * 0.50, team: 'offense', confidence: 0.96 },
    { x: fieldBounds.x + fieldBounds.width * 0.56, y: fieldBounds.y + fieldBounds.height * 0.50, team: 'offense', confidence: 0.94 },
    { x: fieldBounds.x + fieldBounds.width * 0.61, y: fieldBounds.y + fieldBounds.height * 0.50, team: 'offense', confidence: 0.92 },
    // QB (shotgun)
    { x: fieldBounds.x + fieldBounds.width * 0.50, y: fieldBounds.y + fieldBounds.height * 0.62, team: 'offense', confidence: 0.91 },
    // RB
    { x: fieldBounds.x + fieldBounds.width * 0.45, y: fieldBounds.y + fieldBounds.height * 0.62, team: 'offense', confidence: 0.88 },
    // Receivers
    { x: fieldBounds.x + fieldBounds.width * 0.10, y: fieldBounds.y + fieldBounds.height * 0.50, team: 'offense', confidence: 0.87 },
    { x: fieldBounds.x + fieldBounds.width * 0.85, y: fieldBounds.y + fieldBounds.height * 0.50, team: 'offense', confidence: 0.86 },
    { x: fieldBounds.x + fieldBounds.width * 0.75, y: fieldBounds.y + fieldBounds.height * 0.50, team: 'offense', confidence: 0.84 },
    // TE
    { x: fieldBounds.x + fieldBounds.width * 0.65, y: fieldBounds.y + fieldBounds.height * 0.50, team: 'offense', confidence: 0.90 },
  ];

  const sampleDefense: DetectedPlayer[] = [
    { x: fieldBounds.x + fieldBounds.width * 0.50, y: fieldBounds.y + fieldBounds.height * 0.38, team: 'defense', confidence: 0.82 },
    { x: fieldBounds.x + fieldBounds.width * 0.40, y: fieldBounds.y + fieldBounds.height * 0.42, team: 'defense', confidence: 0.80 },
    { x: fieldBounds.x + fieldBounds.width * 0.60, y: fieldBounds.y + fieldBounds.height * 0.42, team: 'defense', confidence: 0.79 },
  ];

  const detectedPlayers = [...sampleOffense, ...sampleDefense];
  const avgConfidence =
    detectedPlayers.reduce((sum, p) => sum + p.confidence, 0) / detectedPlayers.length;

  return {
    imageData,
    detectedPlayers,
    suggestedFormation: 'Shotgun',
    confidence: Math.round(avgConfidence * 100) / 100,
  };
}

// ---- Coordinate mapping ----

/**
 * Map detected player positions from image coordinates to field coordinates.
 *
 * Image coordinates are relative to the capture bounds; this function
 * normalises them into the field coordinate system defined by fieldWidth
 * and fieldHeight.
 */
export function mapToFieldCoordinates(
  detectedPlayers: DetectedPlayer[],
  fieldWidth: number,
  fieldHeight: number,
): Position[] {
  if (fieldWidth <= 0 || fieldHeight <= 0) {
    throw new Error('Field dimensions must be positive');
  }

  return detectedPlayers.map((player) => ({
    x: Math.round((player.x / 100) * fieldWidth * 100) / 100,
    y: Math.round((player.y / 100) * fieldHeight * 100) / 100,
  }));
}

// ---- Play creation ----

/**
 * Convert a FilmCaptureResult into a Play object.
 */
export function createPlayFromCapture(
  result: FilmCaptureResult,
  playName: string,
): Play {
  if (!playName || playName.trim().length === 0) {
    throw new Error('Play name is required');
  }

  // Extract offensive player positions for formation suggestion
  const offensePlayers = result.detectedPlayers.filter((p) => p.team === 'offense');
  const positions: Position[] = offensePlayers.map((p) => ({ x: p.x, y: p.y }));

  const suggestedFormation = suggestFormation(positions);

  // Create assignments from offensive players
  const assignments = offensePlayers.map((player, i) => ({
    playerId: `film-player-${i}`,
  }));

  // Create defensive overlay from detected defensive players
  const defensivePlayers = result.detectedPlayers.filter((p) => p.team === 'defense');
  const defensiveOverlay = defensivePlayers.length > 0
    ? {
        front: 'Unknown',
        coverage: 'Unknown',
        players: defensivePlayers.map((p, i) => ({
          id: `film-def-${i}`,
          position: 'LB' as const,
          label: `D${i + 1}`,
          location: { x: p.x, y: p.y },
          side: 'defense' as const,
        })),
      }
    : undefined;

  return {
    id: `film-capture-${Date.now()}`,
    name: playName.trim(),
    formationId: suggestedFormation?.id ?? 'unknown',
    assignments,
    defensiveOverlay,
    tags: ['film-capture', 'imported'],
    notes: `Captured from film. Confidence: ${result.confidence}. Formation: ${result.suggestedFormation ?? 'Unknown'}`,
    personnel: suggestedFormation?.personnel ?? '11',
    teamId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
