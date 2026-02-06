'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { QuizQuestion as QuizQuestionType } from '@/lib/quiz';

// --- Types ---

export interface QuizQuestionProps {
  question: QuizQuestionType;
  onAnswer: (questionId: string, selectedAnswer: string, timeSpent: number) => void;
  timeLimit?: number; // seconds, 0 or undefined = no timer
  className?: string;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const QUESTION_TYPE_LABELS: Record<string, string> = {
  assignment: "What's your assignment?",
  play_call: "What's the play call?",
  formation: 'Identify the formation',
};

// --- Main Component ---

export default function QuizQuestion({
  question,
  onAnswer,
  timeLimit,
  className,
}: QuizQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit ?? 0);
  const [answered, setAnswered] = useState(false);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setFeedback(null);
    setAnswered(false);
    setTimeRemaining(timeLimit ?? 0);
    startTimeRef.current = Date.now();
  }, [question.id, timeLimit]);

  // Timer countdown
  useEffect(() => {
    if (!timeLimit || timeLimit <= 0 || answered) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto-submit with no answer
          if (!answered) {
            const timeSpent = (Date.now() - startTimeRef.current) / 1000;
            onAnswer(question.id, '', timeSpent);
            setAnswered(true);
            setFeedback('wrong');
          }
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question.id, timeLimit, answered, onAnswer]);

  const handleOptionClick = useCallback(
    (option: string) => {
      if (answered) return;

      const timeSpent = (Date.now() - startTimeRef.current) / 1000;
      setSelectedOption(option);
      setAnswered(true);

      const isCorrect = option === question.correctAnswer;
      setFeedback(isCorrect ? 'correct' : 'wrong');

      if (timerRef.current) clearInterval(timerRef.current);

      onAnswer(question.id, option, timeSpent);
    },
    [answered, question.id, question.correctAnswer, onAnswer],
  );

  // Timer progress bar percentage
  const timerPercent = useMemo(() => {
    if (!timeLimit || timeLimit <= 0) return 100;
    return Math.max(0, (timeRemaining / timeLimit) * 100);
  }, [timeRemaining, timeLimit]);

  const { play, formation } = question.diagram;

  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded-xl bg-white p-6 shadow-lg',
        feedback === 'correct' && 'ring-2 ring-green-400',
        feedback === 'wrong' && 'ring-2 ring-red-400',
        className,
      )}
      data-testid="quiz-question"
    >
      {/* Timer bar */}
      {timeLimit && timeLimit > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200" data-testid="timer-bar">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000',
              timerPercent > 50 ? 'bg-blue-500' : timerPercent > 25 ? 'bg-amber-500' : 'bg-red-500',
            )}
            style={{ width: `${timerPercent}%` }}
            data-testid="timer-progress"
          />
        </div>
      )}

      {/* Question text */}
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400" data-testid="question-type">
          {QUESTION_TYPE_LABELS[question.type] || question.type}
        </p>
        {question.playerPosition && (
          <p className="mt-1 text-sm text-zinc-500" data-testid="question-position">
            Position: {question.playerPosition}
          </p>
        )}
      </div>

      {/* Play diagram (SVG thumbnail) */}
      <div className="flex justify-center">
        <svg
          viewBox="0 0 800 500"
          className="h-48 w-full max-w-md rounded-lg bg-emerald-900"
          data-testid="question-diagram"
        >
          {/* Line of scrimmage */}
          <line
            x1={0} y1={248} x2={800} y2={248}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={2}
          />
          {/* Players */}
          {formation.players.map((p) => {
            const isHighlighted = question.highlightPlayerId === p.id;
            return (
              <g key={p.id}>
                <circle
                  cx={p.location.x}
                  cy={p.location.y}
                  r={isHighlighted ? 16 : 10}
                  fill={isHighlighted ? '#f59e0b' : '#3b82f6'}
                  stroke="white"
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  data-testid={isHighlighted ? 'highlighted-player' : undefined}
                />
                {isHighlighted && (
                  <text
                    x={p.location.x}
                    y={p.location.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize={11}
                    fontWeight="bold"
                  >
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Routes for highlighted player (assignment question) */}
          {question.highlightPlayerId && (() => {
            const assignment = play.assignments.find(
              (a) => a.playerId === question.highlightPlayerId,
            );
            const player = formation.players.find(
              (p) => p.id === question.highlightPlayerId,
            );
            if (!assignment?.route || !player) return null;
            const points = assignment.route.points;
            if (points.length < 2) return null;

            const pathData = points
              .map((pt, i) => {
                const x = player.location.x + pt.x;
                const y = player.location.y + pt.y;
                return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(' ');

            return (
              <path
                d={pathData}
                stroke="#f59e0b"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                data-testid="route-line"
              />
            );
          })()}
        </svg>
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="answer-options">
        {question.options.map((option, idx) => {
          const letter = OPTION_LETTERS[idx] || String(idx + 1);
          const isSelected = selectedOption === option;
          const isCorrectOption = option === question.correctAnswer;

          let optionStyle = 'border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50';
          if (answered) {
            if (isCorrectOption) {
              optionStyle = 'border-green-500 bg-green-50 text-green-800';
            } else if (isSelected && !isCorrectOption) {
              optionStyle = 'border-red-500 bg-red-50 text-red-800';
            } else {
              optionStyle = 'border-zinc-200 bg-zinc-50 text-zinc-400';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(option)}
              disabled={answered}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all',
                optionStyle,
              )}
              data-testid={`option-${letter}`}
            >
              <span
                className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  answered && isCorrectOption
                    ? 'bg-green-500 text-white'
                    : answered && isSelected && !isCorrectOption
                      ? 'bg-red-500 text-white'
                      : 'bg-zinc-100 text-zinc-600',
                )}
              >
                {letter}
              </span>
              <span className="truncate">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            'text-center text-sm font-medium',
            feedback === 'correct' ? 'text-green-600' : 'text-red-600',
          )}
          data-testid="feedback-message"
        >
          {feedback === 'correct' ? 'Correct!' : `Wrong — the answer is: ${question.correctAnswer}`}
        </div>
      )}
    </div>
  );
}
