import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import QuizQuestion from '@/components/quiz/QuizQuestion';
import type { QuizQuestion as QuizQuestionType } from '@/lib/quiz';
import type { Play, Formation } from '@/types';

// --- Test data ---

const formation: Formation = {
  id: 'f1',
  name: 'Singleback',
  side: 'offense',
  personnel: '11',
  tags: ['base'],
  isCustom: false,
  teamId: 't1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
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
  ],
};

const play: Play = {
  id: 'play-1',
  name: 'Mesh Concept',
  formationId: 'f1',
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
  ],
  tags: [],
  personnel: '11',
  teamId: 't1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const assignmentQuestion: QuizQuestionType = {
  id: 'q1',
  type: 'assignment',
  playId: 'play-1',
  diagram: { play, formation },
  correctAnswer: 'Run X Drag route',
  options: ['Run X Drag route', 'Run streak route', 'pass-pro block'],
  playerPosition: 'WR',
  highlightPlayerId: 'x',
};

const playCallQuestion: QuizQuestionType = {
  id: 'q2',
  type: 'play_call',
  playId: 'play-1',
  diagram: { play, formation },
  correctAnswer: 'Mesh Concept',
  options: ['Mesh Concept', 'Power Right', 'Four Verticals'],
};

const formationQuestion: QuizQuestionType = {
  id: 'q3',
  type: 'formation',
  playId: 'play-1',
  diagram: { play, formation },
  correctAnswer: 'Singleback',
  options: ['Singleback', 'Shotgun', 'I-Form'],
};

// ============================================================
// Tests
// ============================================================
describe('QuizQuestion', () => {
  const onAnswer = vi.fn();

  beforeEach(() => {
    onAnswer.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Rendering ---
  it('renders the quiz question container', () => {
    render(<QuizQuestion question={assignmentQuestion} onAnswer={onAnswer} />);
    expect(screen.getByTestId('quiz-question')).toBeInTheDocument();
  });

  it('renders the question type label', () => {
    render(<QuizQuestion question={assignmentQuestion} onAnswer={onAnswer} />);
    expect(screen.getByTestId('question-type')).toBeInTheDocument();
    expect(screen.getByTestId('question-type').textContent).toContain(
      "What's your assignment?",
    );
  });

  it('renders play call question type label', () => {
    render(<QuizQuestion question={playCallQuestion} onAnswer={onAnswer} />);
    expect(screen.getByTestId('question-type').textContent).toContain(
      "What's the play call?",
    );
  });

  it('renders formation question type label', () => {
    render(<QuizQuestion question={formationQuestion} onAnswer={onAnswer} />);
    expect(screen.getByTestId('question-type').textContent).toContain(
      'Identify the formation',
    );
  });

  it('renders the play diagram', () => {
    render(<QuizQuestion question={assignmentQuestion} onAnswer={onAnswer} />);
    expect(screen.getByTestId('question-diagram')).toBeInTheDocument();
  });

  it('renders answer options', () => {
    render(<QuizQuestion question={assignmentQuestion} onAnswer={onAnswer} />);
    expect(screen.getByTestId('answer-options')).toBeInTheDocument();
    expect(screen.getByTestId('option-A')).toBeInTheDocument();
    expect(screen.getByTestId('option-B')).toBeInTheDocument();
    expect(screen.getByTestId('option-C')).toBeInTheDocument();
  });

  it('displays all option text', () => {
    render(<QuizQuestion question={assignmentQuestion} onAnswer={onAnswer} />);
    for (const opt of assignmentQuestion.options) {
      expect(screen.getByText(opt)).toBeInTheDocument();
    }
  });

  // --- Player highlight ---
  it('highlights the player for assignment questions', () => {
    render(<QuizQuestion question={assignmentQuestion} onAnswer={onAnswer} />);
    expect(screen.getByTestId('highlighted-player')).toBeInTheDocument();
  });

  it('shows player position for assignment questions', () => {
    render(<QuizQuestion question={assignmentQuestion} onAnswer={onAnswer} />);
    expect(screen.getByTestId('question-position')).toBeInTheDocument();
    expect(screen.getByTestId('question-position').textContent).toContain('WR');
  });

  it('does not show position for play call questions', () => {
    render(<QuizQuestion question={playCallQuestion} onAnswer={onAnswer} />);
    expect(screen.queryByTestId('question-position')).not.toBeInTheDocument();
  });

  // --- Answer handling ---
  it('calls onAnswer when an option is clicked', () => {
    render(<QuizQuestion question={assignmentQuestion} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByTestId('option-A'));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(
      'q1',
      assignmentQuestion.options[0],
      expect.any(Number),
    );
  });

  it('shows correct feedback when correct answer is selected', () => {
    render(<QuizQuestion question={playCallQuestion} onAnswer={onAnswer} />);

    // Find the button with correct answer text and click it
    const correctIdx = playCallQuestion.options.indexOf('Mesh Concept');
    const letter = ['A', 'B', 'C', 'D'][correctIdx];
    fireEvent.click(screen.getByTestId(`option-${letter}`));

    expect(screen.getByTestId('feedback-message')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-message').textContent).toContain('Correct');
  });

  it('shows wrong feedback when incorrect answer is selected', () => {
    render(<QuizQuestion question={playCallQuestion} onAnswer={onAnswer} />);

    // Find a wrong answer button
    const wrongIdx = playCallQuestion.options.indexOf('Power Right');
    const letter = ['A', 'B', 'C', 'D'][wrongIdx];
    fireEvent.click(screen.getByTestId(`option-${letter}`));

    expect(screen.getByTestId('feedback-message')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-message').textContent).toContain('Wrong');
    expect(screen.getByTestId('feedback-message').textContent).toContain(
      'Mesh Concept',
    );
  });

  it('disables options after answering', () => {
    render(<QuizQuestion question={assignmentQuestion} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByTestId('option-A'));

    // Click again should not fire
    fireEvent.click(screen.getByTestId('option-B'));
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  // --- Timer ---
  it('does not show timer bar when no timeLimit', () => {
    render(<QuizQuestion question={assignmentQuestion} onAnswer={onAnswer} />);
    expect(screen.queryByTestId('timer-bar')).not.toBeInTheDocument();
  });

  it('shows timer bar when timeLimit is provided', () => {
    render(
      <QuizQuestion
        question={assignmentQuestion}
        onAnswer={onAnswer}
        timeLimit={30}
      />,
    );
    expect(screen.getByTestId('timer-bar')).toBeInTheDocument();
    expect(screen.getByTestId('timer-progress')).toBeInTheDocument();
  });

  it('auto-submits when timer expires', () => {
    render(
      <QuizQuestion
        question={assignmentQuestion}
        onAnswer={onAnswer}
        timeLimit={5}
      />,
    );

    // Advance past the timer
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith('q1', '', expect.any(Number));
  });

  it('shows wrong feedback on timeout', () => {
    render(
      <QuizQuestion
        question={assignmentQuestion}
        onAnswer={onAnswer}
        timeLimit={5}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByTestId('feedback-message')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-message').textContent).toContain('Wrong');
  });

  // --- Route line in diagram ---
  it('renders route line for highlighted player in assignment question', () => {
    render(<QuizQuestion question={assignmentQuestion} onAnswer={onAnswer} />);
    expect(screen.getByTestId('route-line')).toBeInTheDocument();
  });
});
