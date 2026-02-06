import { describe, it, expect } from 'vitest';
import {
  generateQuiz,
  scoreQuiz,
  type QuizQuestion,
  type QuizAnswer,
  type QuizOptions,
} from '@/lib/quiz';
import type { Play, Formation } from '@/types';

// --- Test data factories ---

function makeFormation(overrides: Partial<Formation> = {}): Formation {
  return {
    id: 'formation-1',
    name: 'Singleback',
    side: 'offense',
    personnel: '11',
    tags: ['base'],
    isCustom: false,
    teamId: 't1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    players: [
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
      { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 330 }, side: 'offense' },
      { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: 248 }, side: 'offense' },
      { id: 'z', position: 'WR', label: 'Z', location: { x: 680, y: 248 }, side: 'offense' },
      { id: 'te', position: 'TE', label: 'Y', location: { x: 520, y: 248 }, side: 'offense' },
      { id: 'lt', position: 'LT', label: 'LT', location: { x: 310, y: 248 }, side: 'offense' },
      { id: 'lg', position: 'LG', label: 'LG', location: { x: 350, y: 248 }, side: 'offense' },
      { id: 'c', position: 'C', label: 'C', location: { x: 400, y: 248 }, side: 'offense' },
      { id: 'rg', position: 'RG', label: 'RG', location: { x: 450, y: 248 }, side: 'offense' },
      { id: 'rt', position: 'RT', label: 'RT', location: { x: 490, y: 248 }, side: 'offense' },
      { id: 'h', position: 'WR', label: 'H', location: { x: 580, y: 248 }, side: 'offense' },
    ],
    ...overrides,
  };
}

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    name: 'Mesh Concept',
    formationId: 'formation-1',
    assignments: [
      {
        playerId: 'x',
        route: {
          id: 'r1',
          name: 'X Drag',
          type: 'drag',
          points: [
            { x: 0, y: 0, type: 'line' },
            { x: 40, y: -5, type: 'line' },
          ],
        },
      },
      {
        playerId: 'z',
        route: {
          id: 'r2',
          name: 'Z Streak',
          type: 'streak',
          points: [
            { x: 0, y: 0, type: 'line' },
            { x: 0, y: -30, type: 'line' },
          ],
        },
      },
      {
        playerId: 'lt',
        blocking: {
          id: 'b1',
          blockerId: 'lt',
          blockType: 'pass-pro',
        },
      },
      {
        playerId: 'rb',
        route: {
          id: 'r3',
          name: 'RB Flat',
          type: 'flat',
          points: [
            { x: 0, y: 0, type: 'line' },
            { x: 20, y: -3, type: 'line' },
          ],
        },
      },
    ],
    tags: ['pass', 'quick game'],
    personnel: '11',
    teamId: 't1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const formation2: Formation = makeFormation({
  id: 'formation-2',
  name: 'Shotgun',
});

const play2: Play = makePlay({
  id: 'play-2',
  name: 'Power Right',
  formationId: 'formation-2',
  assignments: [
    {
      playerId: 'rb',
      route: {
        id: 'r4',
        name: 'HB Lead',
        type: 'custom',
        points: [
          { x: 0, y: 0, type: 'line' },
          { x: 15, y: -5, type: 'line' },
        ],
      },
    },
    {
      playerId: 'lt',
      blocking: {
        id: 'b2',
        blockerId: 'lt',
        blockType: 'drive',
      },
    },
  ],
});

const play3: Play = makePlay({
  id: 'play-3',
  name: 'Four Verticals',
  formationId: 'formation-1',
  assignments: [
    {
      playerId: 'x',
      route: {
        id: 'r5',
        name: 'X Streak',
        type: 'streak',
        points: [
          { x: 0, y: 0, type: 'line' },
          { x: 0, y: -40, type: 'line' },
        ],
      },
    },
    {
      playerId: 'z',
      route: {
        id: 'r6',
        name: 'Z Streak',
        type: 'streak',
        points: [
          { x: 0, y: 0, type: 'line' },
          { x: 0, y: -40, type: 'line' },
        ],
      },
    },
  ],
});

const allPlays: Play[] = [makePlay(), play2, play3];
const allFormations: Formation[] = [makeFormation(), formation2];

// ============================================================
// generateQuiz
// ============================================================
describe('generateQuiz', () => {
  const baseOptions: QuizOptions = {
    questionCount: 5,
    types: ['assignment', 'play_call', 'formation'],
    difficulty: 'medium',
  };

  it('returns an array of questions', () => {
    const questions = generateQuiz(allPlays, allFormations, baseOptions);
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(baseOptions.questionCount);
  });

  it('each question has the required fields', () => {
    const questions = generateQuiz(allPlays, allFormations, baseOptions);
    for (const q of questions) {
      expect(q.id).toBeTruthy();
      expect(['assignment', 'play_call', 'formation']).toContain(q.type);
      expect(q.playId).toBeTruthy();
      expect(q.diagram).toBeDefined();
      expect(q.diagram.play).toBeDefined();
      expect(q.diagram.formation).toBeDefined();
      expect(q.correctAnswer).toBeTruthy();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('correct answer is always among options', () => {
    const questions = generateQuiz(allPlays, allFormations, baseOptions);
    for (const q of questions) {
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  it('returns empty array when plays is empty', () => {
    const questions = generateQuiz([], allFormations, baseOptions);
    expect(questions).toEqual([]);
  });

  it('returns empty array when formations is empty', () => {
    const questions = generateQuiz(allPlays, [], baseOptions);
    expect(questions).toEqual([]);
  });

  it('returns empty when no play matches any formation', () => {
    const unmatchedPlays: Play[] = [
      makePlay({ id: 'unmatched', formationId: 'nonexistent' }),
    ];
    const questions = generateQuiz(unmatchedPlays, allFormations, baseOptions);
    expect(questions).toEqual([]);
  });

  it('respects questionCount', () => {
    const options: QuizOptions = { ...baseOptions, questionCount: 3 };
    const questions = generateQuiz(allPlays, allFormations, options);
    expect(questions.length).toBeLessThanOrEqual(3);
  });

  it('generates only requested types', () => {
    const options: QuizOptions = {
      ...baseOptions,
      types: ['play_call'],
      questionCount: 5,
    };
    const questions = generateQuiz(allPlays, allFormations, options);
    for (const q of questions) {
      expect(q.type).toBe('play_call');
    }
  });

  it('easy difficulty generates fewer options', () => {
    const options: QuizOptions = {
      ...baseOptions,
      difficulty: 'easy',
      questionCount: 10,
    };
    const questions = generateQuiz(allPlays, allFormations, options);
    for (const q of questions) {
      // Easy: 1 correct + 2 distractors = 3 options
      expect(q.options.length).toBeLessThanOrEqual(4);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('hard difficulty can generate up to 4 options', () => {
    const options: QuizOptions = {
      ...baseOptions,
      difficulty: 'hard',
      questionCount: 10,
    };
    const questions = generateQuiz(allPlays, allFormations, options);
    for (const q of questions) {
      // Hard: 1 correct + 3 distractors = 4 options
      expect(q.options.length).toBeLessThanOrEqual(4);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('assignment questions include highlighted player info', () => {
    const options: QuizOptions = {
      ...baseOptions,
      types: ['assignment'],
      questionCount: 10,
    };
    const questions = generateQuiz(allPlays, allFormations, options);
    for (const q of questions) {
      expect(q.highlightPlayerId).toBeTruthy();
      expect(q.playerPosition).toBeTruthy();
    }
  });

  it('generates unique question ids', () => {
    const questions = generateQuiz(allPlays, allFormations, {
      ...baseOptions,
      questionCount: 10,
    });
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ============================================================
// scoreQuiz
// ============================================================
describe('scoreQuiz', () => {
  const questions: QuizQuestion[] = [
    {
      id: 'q1',
      type: 'assignment',
      playId: 'play-1',
      diagram: { play: makePlay(), formation: makeFormation() },
      correctAnswer: 'Run X Drag route',
      options: ['Run X Drag route', 'Run streak route', 'pass-pro block'],
      playerPosition: 'WR',
      highlightPlayerId: 'x',
    },
    {
      id: 'q2',
      type: 'play_call',
      playId: 'play-1',
      diagram: { play: makePlay(), formation: makeFormation() },
      correctAnswer: 'Mesh Concept',
      options: ['Mesh Concept', 'Power Right', 'Four Verticals'],
    },
    {
      id: 'q3',
      type: 'formation',
      playId: 'play-1',
      diagram: { play: makePlay(), formation: makeFormation() },
      correctAnswer: 'Singleback',
      options: ['Singleback', 'Shotgun', 'I-Form'],
    },
  ];

  it('scores all correct answers', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedAnswer: 'Run X Drag route', timeSpent: 5 },
      { questionId: 'q2', selectedAnswer: 'Mesh Concept', timeSpent: 8 },
      { questionId: 'q3', selectedAnswer: 'Singleback', timeSpent: 3 },
    ];

    const result = scoreQuiz(questions, answers);
    expect(result.score).toBe(3);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(100);
    expect(result.wrongAnswers).toHaveLength(0);
  });

  it('scores all wrong answers', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedAnswer: 'pass-pro block', timeSpent: 5 },
      { questionId: 'q2', selectedAnswer: 'Power Right', timeSpent: 8 },
      { questionId: 'q3', selectedAnswer: 'I-Form', timeSpent: 3 },
    ];

    const result = scoreQuiz(questions, answers);
    expect(result.score).toBe(0);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(0);
    expect(result.wrongAnswers).toHaveLength(3);
  });

  it('scores partial correct answers', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedAnswer: 'Run X Drag route', timeSpent: 5 },
      { questionId: 'q2', selectedAnswer: 'Power Right', timeSpent: 8 },
      { questionId: 'q3', selectedAnswer: 'Singleback', timeSpent: 3 },
    ];

    const result = scoreQuiz(questions, answers);
    expect(result.score).toBe(2);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(67);
    expect(result.wrongAnswers).toHaveLength(1);
  });

  it('provides breakdown by question type', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedAnswer: 'Run X Drag route', timeSpent: 5 },
      { questionId: 'q2', selectedAnswer: 'Power Right', timeSpent: 8 },
      { questionId: 'q3', selectedAnswer: 'Singleback', timeSpent: 3 },
    ];

    const result = scoreQuiz(questions, answers);
    expect(result.breakdown.assignment).toEqual({ correct: 1, total: 1 });
    expect(result.breakdown.play_call).toEqual({ correct: 0, total: 1 });
    expect(result.breakdown.formation).toEqual({ correct: 1, total: 1 });
  });

  it('wrong answers include question and both answers', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedAnswer: 'pass-pro block', timeSpent: 5 },
      { questionId: 'q2', selectedAnswer: 'Mesh Concept', timeSpent: 8 },
      { questionId: 'q3', selectedAnswer: 'Singleback', timeSpent: 3 },
    ];

    const result = scoreQuiz(questions, answers);
    expect(result.wrongAnswers).toHaveLength(1);
    expect(result.wrongAnswers[0].selectedAnswer).toBe('pass-pro block');
    expect(result.wrongAnswers[0].correctAnswer).toBe('Run X Drag route');
    expect(result.wrongAnswers[0].question.id).toBe('q1');
  });

  it('handles missing answers as wrong', () => {
    // Only answer q1
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedAnswer: 'Run X Drag route', timeSpent: 5 },
    ];

    const result = scoreQuiz(questions, answers);
    expect(result.score).toBe(1);
    expect(result.total).toBe(3);
    expect(result.wrongAnswers).toHaveLength(2);
  });

  it('handles empty questions array', () => {
    const result = scoreQuiz([], []);
    expect(result.score).toBe(0);
    expect(result.total).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.wrongAnswers).toHaveLength(0);
  });

  it('handles empty answers for answered quiz', () => {
    const result = scoreQuiz(questions, []);
    expect(result.score).toBe(0);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(0);
    expect(result.wrongAnswers).toHaveLength(3);
  });

  it('empty selectedAnswer for timeout is treated as wrong', () => {
    const answers: QuizAnswer[] = [
      { questionId: 'q1', selectedAnswer: '', timeSpent: 30 },
      { questionId: 'q2', selectedAnswer: 'Mesh Concept', timeSpent: 8 },
      { questionId: 'q3', selectedAnswer: 'Singleback', timeSpent: 3 },
    ];

    const result = scoreQuiz(questions, answers);
    expect(result.score).toBe(2);
    expect(result.wrongAnswers).toHaveLength(1);
    expect(result.wrongAnswers[0].selectedAnswer).toBe('');
  });
});
