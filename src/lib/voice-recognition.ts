import type { OffensivePosition, RouteType } from '@/types';
import { BUILT_IN_FORMATIONS } from '@/lib/formations';
import { BUILT_IN_CONCEPTS } from '@/lib/concepts';

// ============================================================
// Voice Recognition — Speech-to-Play NLP parser
// ============================================================

// --- Types ---

export interface ParsedRoute {
  position: OffensivePosition;
  routeType: RouteType | 'run' | 'block';
  confidence: number;
}

export interface ParsedPlay {
  formationName?: string;
  conceptName?: string;
  routes: ParsedRoute[];
  blockingScheme?: string;
  notes?: string;
  confidence: number;
}

export interface VoiceRecognitionCallbacks {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

// --- Formation aliases ---

const FORMATION_ALIASES: Record<string, string> = {
  'singleback': 'Singleback',
  'single back': 'Singleback',
  'ace': 'Singleback',
  'i form': 'I-Form',
  'i-form': 'I-Form',
  'i formation': 'I-Form',
  'shotgun': 'Shotgun',
  'gun': 'Shotgun',
  'pistol': 'Pistol',
  'empty': 'Empty',
  'empty set': 'Empty',
  'spread': 'Empty',
  'spread formation': 'Empty',
  'trips': 'Trips',
  'trips right': 'Trips',
  'trips left': 'Trips',
  'bunch': 'Bunch',
  'bunch right': 'Bunch',
  'bunch left': 'Bunch',
  'shotgun trips': 'Trips',
  'shotgun trips right': 'Trips',
  'shotgun trips left': 'Trips',
  'gun trips': 'Trips',
  'gun trips right': 'Trips',
  'gun trips left': 'Trips',
  'shotgun bunch': 'Bunch',
  'gun bunch': 'Bunch',
  'shotgun empty': 'Empty',
  'gun empty': 'Empty',
  'shotgun spread': 'Empty',
};

// --- Concept aliases ---

const CONCEPT_ALIASES: Record<string, string> = {
  'mesh': 'Mesh',
  'mesh concept': 'Mesh',
  'smash': 'Smash',
  'smash concept': 'Smash',
  'flood': 'Flood',
  'flood concept': 'Flood',
  'y cross': 'Y-Cross',
  'y-cross': 'Y-Cross',
  'drive': 'Drive',
  'drive concept': 'Drive',
  'sail': 'Sail',
  'sail concept': 'Sail',
  'levels': 'Levels',
  'levels concept': 'Levels',
  'four verticals': 'Four Verticals',
  'four verts': 'Four Verticals',
  '4 verticals': 'Four Verticals',
  '4 verts': 'Four Verticals',
  'all verticals': 'Four Verticals',
  'slant flat': 'Slant-Flat',
  'slant-flat': 'Slant-Flat',
  'curl flat': 'Curl-Flat',
  'curl-flat': 'Curl-Flat',
  'stick': 'Stick',
  'stick concept': 'Stick',
  'dagger': 'Dagger',
  'dagger concept': 'Dagger',
  'post wheel': 'Post-Wheel',
  'post-wheel': 'Post-Wheel',
  'scissors': 'Scissors',
  'scissors concept': 'Scissors',
  'double slants': 'Double Slants',
};

// --- Route pattern aliases ---

interface RoutePattern {
  pattern: RegExp;
  position: OffensivePosition;
  routeType: RouteType | 'run' | 'block';
}

const ROUTE_PATTERNS: RoutePattern[] = [
  // Running back routes
  { pattern: /\bhb dive\b/i, position: 'RB', routeType: 'run' },
  { pattern: /\bhb draw\b/i, position: 'RB', routeType: 'run' },
  { pattern: /\bhb sweep\b/i, position: 'RB', routeType: 'run' },
  { pattern: /\bhb power\b/i, position: 'RB', routeType: 'run' },
  { pattern: /\bhb counter\b/i, position: 'RB', routeType: 'run' },
  { pattern: /\bhb stretch\b/i, position: 'RB', routeType: 'run' },
  { pattern: /\brb dive\b/i, position: 'RB', routeType: 'run' },
  { pattern: /\brb draw\b/i, position: 'RB', routeType: 'run' },
  { pattern: /\brb screen\b/i, position: 'RB', routeType: 'screen' },
  { pattern: /\brb flat\b/i, position: 'RB', routeType: 'flat' },
  { pattern: /\brb swing\b/i, position: 'RB', routeType: 'swing' },
  { pattern: /\brb wheel\b/i, position: 'RB', routeType: 'wheel' },
  { pattern: /\brb angle\b/i, position: 'RB', routeType: 'angle' },
  // Fullback
  { pattern: /\bfb dive\b/i, position: 'FB', routeType: 'run' },
  { pattern: /\bfb lead\b/i, position: 'FB', routeType: 'block' },
  // Receiver routes
  { pattern: /\bx streak\b/i, position: 'WR', routeType: 'streak' },
  { pattern: /\bx slant\b/i, position: 'WR', routeType: 'slant' },
  { pattern: /\bx post\b/i, position: 'WR', routeType: 'post' },
  { pattern: /\bx corner\b/i, position: 'WR', routeType: 'corner' },
  { pattern: /\bx out\b/i, position: 'WR', routeType: 'out' },
  { pattern: /\bx in\b/i, position: 'WR', routeType: 'in' },
  { pattern: /\bx curl\b/i, position: 'WR', routeType: 'curl' },
  { pattern: /\bx hitch\b/i, position: 'WR', routeType: 'hitch' },
  { pattern: /\bx drag\b/i, position: 'WR', routeType: 'drag' },
  { pattern: /\bx screen\b/i, position: 'WR', routeType: 'screen' },
  { pattern: /\bz streak\b/i, position: 'WR', routeType: 'streak' },
  { pattern: /\bz slant\b/i, position: 'WR', routeType: 'slant' },
  { pattern: /\bz post\b/i, position: 'WR', routeType: 'post' },
  { pattern: /\bz corner\b/i, position: 'WR', routeType: 'corner' },
  { pattern: /\bz out\b/i, position: 'WR', routeType: 'out' },
  { pattern: /\bz in\b/i, position: 'WR', routeType: 'in' },
  { pattern: /\bz curl\b/i, position: 'WR', routeType: 'curl' },
  { pattern: /\bz hitch\b/i, position: 'WR', routeType: 'hitch' },
  { pattern: /\bz drag\b/i, position: 'WR', routeType: 'drag' },
  // Slot
  { pattern: /\bh seam\b/i, position: 'WR', routeType: 'seam' },
  { pattern: /\bh slant\b/i, position: 'WR', routeType: 'slant' },
  { pattern: /\bh drag\b/i, position: 'WR', routeType: 'drag' },
  { pattern: /\bslot seam\b/i, position: 'WR', routeType: 'seam' },
  { pattern: /\bslot slant\b/i, position: 'WR', routeType: 'slant' },
  // Tight end
  { pattern: /\bte seam\b/i, position: 'TE', routeType: 'seam' },
  { pattern: /\bte drag\b/i, position: 'TE', routeType: 'drag' },
  { pattern: /\bte corner\b/i, position: 'TE', routeType: 'corner' },
  { pattern: /\bte out\b/i, position: 'TE', routeType: 'out' },
  { pattern: /\bte flat\b/i, position: 'TE', routeType: 'flat' },
  { pattern: /\bte cross\b/i, position: 'TE', routeType: 'cross' },
  { pattern: /\by seam\b/i, position: 'TE', routeType: 'seam' },
  { pattern: /\by drag\b/i, position: 'TE', routeType: 'drag' },
  { pattern: /\by corner\b/i, position: 'TE', routeType: 'corner' },
  { pattern: /\by cross\b/i, position: 'TE', routeType: 'cross' },
];

// --- Blocking scheme aliases ---

const BLOCKING_SCHEME_ALIASES: Record<string, string> = {
  'zone left': 'Inside Zone Left',
  'zone right': 'Inside Zone Right',
  'inside zone': 'Inside Zone',
  'outside zone': 'Outside Zone',
  'power': 'Power',
  'power right': 'Power Right',
  'power left': 'Power Left',
  'counter': 'Counter',
  'trap': 'Trap',
  'draw': 'Draw',
  'man protection': 'Man Protection',
  'slide protection': 'Slide Protection',
  'max protect': 'Max Protection',
  'max protection': 'Max Protection',
  'half slide': 'Half Slide',
};

// --- Web Speech API types ---

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventPayload {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorPayload {
  readonly error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventPayload) => void) | null;
  onerror: ((event: SpeechRecognitionErrorPayload) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

// --- SpeechRecognition wrapper ---

let recognition: SpeechRecognitionInstance | null = null;

/**
 * Check if the Web Speech API is available in the current browser.
 */
export function isSpeechRecognitionAvailable(): boolean {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );
}

/**
 * Start listening for speech input via the Web Speech API.
 * Returns false if speech recognition is not available.
 */
export function startListening(callbacks: VoiceRecognitionCallbacks = {}): boolean {
  if (!isSpeechRecognitionAvailable()) {
    callbacks.onError?.('Speech recognition is not available in this browser.');
    return false;
  }

  // Stop any existing session
  stopListening();

  const SpeechRecognitionAPI = (
    (window as unknown as Record<string, SpeechRecognitionConstructor>).SpeechRecognition ||
    (window as unknown as Record<string, SpeechRecognitionConstructor>).webkitSpeechRecognition
  );

  recognition = new SpeechRecognitionAPI();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: SpeechRecognitionEventPayload) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    if (finalTranscript) {
      callbacks.onTranscript?.(finalTranscript, true);
    } else if (interimTranscript) {
      callbacks.onTranscript?.(interimTranscript, false);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorPayload) => {
    callbacks.onError?.(event.error);
  };

  recognition.onend = () => {
    callbacks.onEnd?.();
  };

  recognition.start();
  return true;
}

/**
 * Stop the current speech recognition session.
 */
export function stopListening(): void {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}

// --- NLP Parser ---

/**
 * Parse a spoken transcript into a structured play description.
 * Uses pattern matching against known formations, concepts, routes, and blocking schemes.
 */
export function parsePlayDescription(transcript: string): ParsedPlay {
  const normalized = transcript.trim().toLowerCase();

  const formationResult = matchFormation(normalized);
  const conceptResult = matchConcept(normalized);
  const routes = matchRoutes(normalized);
  const blockingScheme = matchBlockingScheme(normalized);

  // Calculate overall confidence as an average of matched elements
  const scores: number[] = [];
  if (formationResult) scores.push(formationResult.confidence);
  if (conceptResult) scores.push(conceptResult.confidence);
  for (const route of routes) scores.push(route.confidence);
  if (blockingScheme) scores.push(0.8);

  const confidence = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 0.1;

  return {
    formationName: formationResult?.name,
    conceptName: conceptResult?.name,
    routes,
    blockingScheme: blockingScheme ?? undefined,
    notes: transcript.trim(),
    confidence: Math.round(confidence * 100) / 100,
  };
}

function matchFormation(text: string): { name: string; confidence: number } | null {
  // Try exact alias matches (longest first to catch multi-word aliases)
  const sortedAliases = Object.keys(FORMATION_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    if (text.includes(alias)) {
      const name = FORMATION_ALIASES[alias];
      // Higher confidence for longer, more specific matches
      const confidence = alias.split(' ').length > 1 ? 0.95 : 0.9;
      return { name, confidence };
    }
  }

  // Try fuzzy match against built-in formation names
  for (const formation of BUILT_IN_FORMATIONS) {
    if (text.includes(formation.name.toLowerCase())) {
      return { name: formation.name, confidence: 0.85 };
    }
  }

  return null;
}

function matchConcept(text: string): { name: string; confidence: number } | null {
  // Try exact alias matches (longest first)
  const sortedAliases = Object.keys(CONCEPT_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    if (text.includes(alias)) {
      const name = CONCEPT_ALIASES[alias];
      const confidence = alias.split(' ').length > 1 ? 0.95 : 0.9;
      return { name, confidence };
    }
  }

  // Try fuzzy match against built-in concept names
  for (const concept of BUILT_IN_CONCEPTS) {
    if (text.includes(concept.name.toLowerCase())) {
      return { name: concept.name, confidence: 0.85 };
    }
  }

  return null;
}

function matchRoutes(text: string): ParsedRoute[] {
  const routes: ParsedRoute[] = [];
  for (const rp of ROUTE_PATTERNS) {
    if (rp.pattern.test(text)) {
      routes.push({
        position: rp.position,
        routeType: rp.routeType,
        confidence: 0.85,
      });
    }
  }
  return routes;
}

function matchBlockingScheme(text: string): string | null {
  const sortedAliases = Object.keys(BLOCKING_SCHEME_ALIASES).sort(
    (a, b) => b.length - a.length,
  );
  for (const alias of sortedAliases) {
    if (text.includes(alias)) {
      return BLOCKING_SCHEME_ALIASES[alias];
    }
  }
  return null;
}

