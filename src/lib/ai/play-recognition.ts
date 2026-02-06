import type { Play, Position, Formation, Player, RouteType } from '@/types';
import { BUILT_IN_FORMATIONS } from '@/lib/formations';

// ---- Types ----

export interface DetectedRoute {
  playerId?: string;
  startPosition: Position;
  endPosition: Position;
  routeType: RouteType;
  confidence: number;
}

export interface PlayRecognitionResult {
  confidence: number;
  detectedFormation?: string;
  playerPositions: Position[];
  routes: DetectedRoute[];
  notes: string;
}

export interface CoordinateMapping {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

// ---- Coordinate mapping ----

/**
 * Create a coordinate mapping from image space to canvas/field space.
 *
 * Maps (imageWidth x imageHeight) to (fieldWidth x fieldHeight) maintaining
 * aspect ratio with centering offsets.
 */
export function imageToCanvasCoordinates(
  imageWidth: number,
  imageHeight: number,
  fieldWidth: number,
  fieldHeight: number,
): CoordinateMapping {
  const scaleX = fieldWidth / imageWidth;
  const scaleY = fieldHeight / imageHeight;
  const scale = Math.min(scaleX, scaleY);

  // Center the mapped image within the field
  const mappedWidth = imageWidth * scale;
  const mappedHeight = imageHeight * scale;
  const offsetX = (fieldWidth - mappedWidth) / 2;
  const offsetY = (fieldHeight - mappedHeight) / 2;

  return {
    scaleX: scale,
    scaleY: scale,
    offsetX,
    offsetY,
  };
}

/**
 * Apply coordinate mapping to transform a point from image space to field space.
 */
export function applyMapping(point: Position, mapping: CoordinateMapping): Position {
  return {
    x: point.x * mapping.scaleX + mapping.offsetX,
    y: point.y * mapping.scaleY + mapping.offsetY,
  };
}

// ---- Formation suggestion ----

/**
 * Suggest the closest built-in formation based on detected player positions.
 *
 * Uses average distance between detected positions and formation player positions.
 * Assumes at least some positions will be close to a known formation.
 */
export function suggestFormation(positions: Position[]): Formation | undefined {
  if (positions.length === 0) return undefined;

  let bestFormation: Formation | undefined;
  let bestScore = Infinity;

  for (const formation of BUILT_IN_FORMATIONS) {
    const score = formationMatchScore(positions, formation.players);
    if (score < bestScore) {
      bestScore = score;
      bestFormation = formation;
    }
  }

  return bestFormation;
}

/**
 * Compute a match score (lower = better) between detected positions and formation players.
 *
 * Uses a greedy nearest-neighbor matching — for each detected position,
 * find the closest unmatched formation player.
 */
function formationMatchScore(detected: Position[], formationPlayers: Player[]): number {
  const formationPositions = formationPlayers.map((p) => p.location);
  const used = new Set<number>();
  let totalDistance = 0;

  for (const pos of detected) {
    let bestDist = Infinity;
    let bestIdx = -1;

    for (let i = 0; i < formationPositions.length; i++) {
      if (used.has(i)) continue;
      const dist = distance(pos, formationPositions[i]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      used.add(bestIdx);
      totalDistance += bestDist;
    } else {
      // Penalty for unmatched positions
      totalDistance += 500;
    }
  }

  // Penalty for unmatched formation players
  const unmatched = formationPlayers.length - used.size;
  totalDistance += unmatched * 100;

  return totalDistance;
}

function distance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ---- AI analysis (stub) ----

/**
 * Analyze a play image and return recognition results.
 *
 * NOTE: This is a stub implementation that returns sample data.
 * In production, this would call an AI vision model API.
 */
export async function analyzePlayImage(imageData: string): Promise<PlayRecognitionResult> {
  // Validate that we received image data
  if (!imageData || imageData.trim().length === 0) {
    throw new Error('Image data is required');
  }

  // Stub: return sample recognition result simulating a shotgun formation
  const samplePositions: Position[] = [
    // O-Line
    { x: 310, y: 248 },
    { x: 350, y: 248 },
    { x: 400, y: 248 },
    { x: 450, y: 248 },
    { x: 490, y: 248 },
    // QB (shotgun depth)
    { x: 400, y: 310 },
    // RB
    { x: 360, y: 310 },
    // Receivers
    { x: 80, y: 248 },
    { x: 680, y: 248 },
    { x: 600, y: 248 },
    // TE
    { x: 520, y: 248 },
  ];

  const sampleRoutes: DetectedRoute[] = [
    {
      startPosition: { x: 80, y: 248 },
      endPosition: { x: 92, y: 218 },
      routeType: 'slant',
      confidence: 0.85,
    },
    {
      startPosition: { x: 680, y: 248 },
      endPosition: { x: 680, y: 218 },
      routeType: 'streak',
      confidence: 0.92,
    },
    {
      startPosition: { x: 600, y: 248 },
      endPosition: { x: 580, y: 228 },
      routeType: 'out',
      confidence: 0.78,
    },
  ];

  return {
    confidence: 0.82,
    detectedFormation: 'Shotgun',
    playerPositions: samplePositions,
    routes: sampleRoutes,
    notes: 'Detected 11 players in shotgun formation. 3 pass routes identified.',
  };
}

// ---- Conversion ----

/**
 * Convert a PlayRecognitionResult into a Play object.
 */
export function convertToPlay(result: PlayRecognitionResult, name: string): Play {
  const suggestedFormation = suggestFormation(result.playerPositions);

  const assignments = result.routes.map((route, i) => ({
    playerId: route.playerId ?? `detected-${i}`,
    route: {
      id: `route-${i}`,
      name: `${route.routeType} route`,
      type: route.routeType,
      points: [
        { x: route.startPosition.x, y: route.startPosition.y, type: 'line' as const },
        { x: route.endPosition.x, y: route.endPosition.y, type: 'line' as const },
      ],
    },
  }));

  return {
    id: `imported-${Date.now()}`,
    name,
    formationId: suggestedFormation?.id ?? 'unknown',
    assignments,
    tags: ['imported', 'ai-detected'],
    notes: result.notes,
    personnel: suggestedFormation?.personnel ?? '11',
    teamId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
