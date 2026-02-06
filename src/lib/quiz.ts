// ============================================================
// Quiz engine — generate questions, score answers
// ============================================================

import type { Play, Formation, PlayerPosition, OffensivePosition } from '@/types';

// --- Types ---

export type QuizQuestionType = 'assignment' | 'play_call' | 'formation';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  playId: string;
  diagram: {
    play: Play;
    formation: Formation;
  };
  correctAnswer: string;
  options: string[];
  playerPosition?: PlayerPosition;
  /** Player ID to highlight in the diagram (for assignment questions) */
  highlightPlayerId?: string;
}

export interface QuizOptions {
  questionCount: number;
  types: QuizQuestionType[];
  positions?: PlayerPosition[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
  timeSpent: number; // seconds
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  breakdown: Record<QuizQuestionType, { correct: number; total: number }>;
  wrongAnswers: {
    question: QuizQuestion;
    selectedAnswer: string;
    correctAnswer: string;
  }[];
}

// --- Position group helpers ---

const POSITION_GROUPS: Record<string, OffensivePosition[]> = {
  QB: ['QB'],
  'RB/FB': ['RB', 'FB'],
  'WR/TE': ['WR', 'TE', 'X', 'Y', 'Z', 'H', 'F'],
  OL: ['LT', 'LG', 'C', 'RG', 'RT', 'T'],
};

function positionMatchesFilter(
  position: PlayerPosition,
  filterPositions: PlayerPosition[],
): boolean {
  return filterPositions.includes(position);
}

// --- Helpers ---

/** Shuffle array using Fisher-Yates */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Pick n random distinct items from arr */
function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** Generate a unique-ish ID */
function qid(): string {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Describe a player assignment in human-readable text.
 */
function describeAssignment(play: Play, playerId: string): string {
  const assignment = play.assignments.find((a) => a.playerId === playerId);
  if (!assignment) return 'No assignment';

  if (assignment.route) {
    return `Run ${assignment.route.name || assignment.route.type} route`;
  }
  if (assignment.blocking) {
    return `${assignment.blocking.blockType} block`;
  }
  if (assignment.motion) {
    return `Motion ${assignment.motion.timing}`;
  }
  return assignment.label || 'No assignment';
}

// --- Generator functions for each question type ---

function generateAssignmentQuestion(
  play: Play,
  formation: Formation,
  allPlays: Play[],
  difficulty: 'easy' | 'medium' | 'hard',
  filterPositions?: PlayerPosition[],
): QuizQuestion | null {
  // Find players with assignments
  let eligiblePlayers = formation.players.filter((p) =>
    play.assignments.some((a) => a.playerId === p.id),
  );

  if (filterPositions && filterPositions.length > 0) {
    eligiblePlayers = eligiblePlayers.filter((p) =>
      positionMatchesFilter(p.position, filterPositions),
    );
  }

  if (eligiblePlayers.length === 0) return null;

  const player = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
  const correctAnswer = describeAssignment(play, player.id);

  // Generate wrong answers from other assignments in other plays
  const otherDescriptions = new Set<string>();
  for (const otherPlay of allPlays) {
    if (otherPlay.id === play.id) continue;
    for (const a of otherPlay.assignments) {
      const desc = describeAssignment(otherPlay, a.playerId);
      if (desc !== correctAnswer && desc !== 'No assignment') {
        otherDescriptions.add(desc);
      }
    }
  }

  // Also add some from the same play (different players)
  for (const a of play.assignments) {
    if (a.playerId === player.id) continue;
    const desc = describeAssignment(play, a.playerId);
    if (desc !== correctAnswer && desc !== 'No assignment') {
      otherDescriptions.add(desc);
    }
  }

  const distractorCount = difficulty === 'easy' ? 2 : 3;
  const distractors = pickRandom([...otherDescriptions], distractorCount);

  // Pad with generic distractors if needed
  const genericDistractors = [
    'Run streak route',
    'Run slant route',
    'pass-pro block',
    'Run flat route',
    'Run curl route',
    'drive block',
    'Motion pre-snap',
    'Run post route',
    'Run drag route',
    'zone block',
  ];
  while (distractors.length < distractorCount) {
    const generic = genericDistractors.find(
      (g) => g !== correctAnswer && !distractors.includes(g),
    );
    if (generic) distractors.push(generic);
    else break;
  }

  const options = shuffle([correctAnswer, ...distractors]);

  return {
    id: qid(),
    type: 'assignment',
    playId: play.id,
    diagram: { play, formation },
    correctAnswer,
    options,
    playerPosition: player.position,
    highlightPlayerId: player.id,
  };
}

function generatePlayCallQuestion(
  play: Play,
  formation: Formation,
  allPlays: Play[],
  difficulty: 'easy' | 'medium' | 'hard',
): QuizQuestion | null {
  const correctAnswer = play.name;

  const distractorCount = difficulty === 'easy' ? 2 : 3;
  const otherNames = allPlays
    .filter((p) => p.id !== play.id)
    .map((p) => p.name);

  const distractors = pickRandom(otherNames, distractorCount);

  // Pad if not enough plays
  const genericPlayNames = [
    'Power Right',
    'Counter Left',
    'HB Dive',
    'PA Boot',
    'Mesh Concept',
    'Four Verticals',
    'Smash',
    'Stick',
    'Curl-Flat',
    'Hitch Screen',
  ];
  while (distractors.length < distractorCount) {
    const generic = genericPlayNames.find(
      (g) => g !== correctAnswer && !distractors.includes(g),
    );
    if (generic) distractors.push(generic);
    else break;
  }

  return {
    id: qid(),
    type: 'play_call',
    playId: play.id,
    diagram: { play, formation },
    correctAnswer,
    options: shuffle([correctAnswer, ...distractors]),
  };
}

function generateFormationQuestion(
  play: Play,
  formation: Formation,
  allFormations: Formation[],
  difficulty: 'easy' | 'medium' | 'hard',
): QuizQuestion | null {
  const correctAnswer = formation.name;

  const distractorCount = difficulty === 'easy' ? 2 : 3;
  const otherNames = allFormations
    .filter((f) => f.id !== formation.id)
    .map((f) => f.name);

  const distractors = pickRandom(otherNames, distractorCount);

  const genericFormations = [
    'Singleback',
    'I-Form',
    'Shotgun',
    'Pistol',
    'Empty',
    'Trips',
    'Bunch',
    'Wishbone',
    'Wing-T',
    'Spread',
  ];
  while (distractors.length < distractorCount) {
    const generic = genericFormations.find(
      (g) => g !== correctAnswer && !distractors.includes(g),
    );
    if (generic) distractors.push(generic);
    else break;
  }

  return {
    id: qid(),
    type: 'formation',
    playId: play.id,
    diagram: { play, formation },
    correctAnswer,
    options: shuffle([correctAnswer, ...distractors]),
  };
}

// --- Main API ---

/**
 * Generate a quiz from a set of plays and formations.
 */
export function generateQuiz(
  plays: Play[],
  formations: Formation[],
  options: QuizOptions,
): QuizQuestion[] {
  if (plays.length === 0 || formations.length === 0) return [];

  const formationMap = new Map<string, Formation>();
  for (const f of formations) {
    formationMap.set(f.id, f);
  }

  // Only consider plays that have a matching formation
  const validPlays = plays.filter((p) => formationMap.has(p.formationId));
  if (validPlays.length === 0) return [];

  const questions: QuizQuestion[] = [];
  const typeCycle = options.types.length > 0 ? options.types : ['assignment', 'play_call', 'formation'] as QuizQuestionType[];

  let attempts = 0;
  const maxAttempts = options.questionCount * 5;

  while (questions.length < options.questionCount && attempts < maxAttempts) {
    attempts++;
    const type = typeCycle[questions.length % typeCycle.length];
    const play = validPlays[Math.floor(Math.random() * validPlays.length)];
    const formation = formationMap.get(play.formationId)!;

    let question: QuizQuestion | null = null;

    switch (type) {
      case 'assignment':
        question = generateAssignmentQuestion(
          play,
          formation,
          validPlays,
          options.difficulty,
          options.positions,
        );
        break;
      case 'play_call':
        question = generatePlayCallQuestion(play, formation, validPlays, options.difficulty);
        break;
      case 'formation':
        question = generateFormationQuestion(play, formation, formations, options.difficulty);
        break;
    }

    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

/**
 * Score a completed quiz.
 */
export function scoreQuiz(
  questions: QuizQuestion[],
  answers: QuizAnswer[],
): QuizResult {
  const answerMap = new Map<string, QuizAnswer>();
  for (const a of answers) {
    answerMap.set(a.questionId, a);
  }

  const breakdown: Record<QuizQuestionType, { correct: number; total: number }> = {
    assignment: { correct: 0, total: 0 },
    play_call: { correct: 0, total: 0 },
    formation: { correct: 0, total: 0 },
  };

  let score = 0;
  const wrongAnswers: QuizResult['wrongAnswers'] = [];

  for (const q of questions) {
    breakdown[q.type].total++;
    const answer = answerMap.get(q.id);

    if (answer && answer.selectedAnswer === q.correctAnswer) {
      score++;
      breakdown[q.type].correct++;
    } else {
      wrongAnswers.push({
        question: q,
        selectedAnswer: answer?.selectedAnswer ?? '',
        correctAnswer: q.correctAnswer,
      });
    }
  }

  const total = questions.length;

  return {
    score,
    total,
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    breakdown,
    wrongAnswers,
  };
}
