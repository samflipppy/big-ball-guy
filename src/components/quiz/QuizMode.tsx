'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  generateQuiz,
  scoreQuiz,
  type QuizQuestion as QuizQuestionType,
  type QuizAnswer,
  type QuizResult,
  type QuizOptions,
  type QuizQuestionType as QuestionTypeEnum,
} from '@/lib/quiz';
import type { Play, Formation, PlayerPosition } from '@/types';
import QuizQuestion from './QuizQuestion';

// --- Types ---

export interface QuizModeProps {
  plays: Play[];
  formations: Formation[];
  playerPosition?: PlayerPosition;
  onComplete?: (result: QuizResult) => void;
  className?: string;
}

type QuizStage = 'setup' | 'playing' | 'review';

// --- Setup Screen ---

function QuizSetup({
  onStart,
}: {
  onStart: (options: QuizOptions) => void;
}) {
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeLimit, setTimeLimit] = useState(30);
  const [selectedTypes, setSelectedTypes] = useState<QuestionTypeEnum[]>([
    'assignment',
    'play_call',
    'formation',
  ]);

  const toggleType = useCallback((type: QuestionTypeEnum) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        // Don't allow deselecting all
        if (prev.length <= 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  }, []);

  const handleStart = useCallback(() => {
    onStart({
      questionCount,
      types: selectedTypes,
      difficulty,
    });
  }, [questionCount, selectedTypes, difficulty, onStart]);

  return (
    <div className="flex flex-col items-center gap-8 p-8" data-testid="quiz-setup">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900">Quiz Mode</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Test your knowledge of the playbook
        </p>
      </div>

      {/* Question types */}
      <div className="w-full max-w-md">
        <label className="text-sm font-medium text-zinc-700">Question Types</label>
        <div className="mt-2 flex flex-wrap gap-2" data-testid="type-selector">
          {([
            { key: 'assignment' as const, label: 'Assignments' },
            { key: 'play_call' as const, label: 'Play Calls' },
            { key: 'formation' as const, label: 'Formations' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleType(key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                selectedTypes.includes(key)
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
              )}
              data-testid={`type-toggle-${key}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Question count */}
      <div className="w-full max-w-md">
        <label className="text-sm font-medium text-zinc-700" htmlFor="question-count">
          Number of Questions: {questionCount}
        </label>
        <input
          id="question-count"
          type="range"
          min={5}
          max={30}
          step={5}
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="mt-2 w-full"
          data-testid="question-count-slider"
        />
        <div className="mt-1 flex justify-between text-xs text-zinc-400">
          <span>5</span>
          <span>30</span>
        </div>
      </div>

      {/* Difficulty */}
      <div className="w-full max-w-md">
        <label className="text-sm font-medium text-zinc-700">Difficulty</label>
        <div className="mt-2 flex gap-2" data-testid="difficulty-selector">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={cn(
                'flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors',
                difficulty === d
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
              )}
              data-testid={`difficulty-${d}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Time limit */}
      <div className="w-full max-w-md">
        <label className="text-sm font-medium text-zinc-700" htmlFor="time-limit">
          Time per Question: {timeLimit}s
        </label>
        <input
          id="time-limit"
          type="range"
          min={10}
          max={60}
          step={5}
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
          className="mt-2 w-full"
          data-testid="time-limit-slider"
        />
        <div className="mt-1 flex justify-between text-xs text-zinc-400">
          <span>10s</span>
          <span>60s</span>
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
        data-testid="start-quiz-btn"
      >
        Start Quiz
      </button>
    </div>
  );
}

// --- Results Screen ---

function QuizResults({
  result,
  onRestart,
}: {
  result: QuizResult;
  onRestart: () => void;
}) {
  const gradeColor = useMemo(() => {
    if (result.percentage >= 80) return 'text-green-600';
    if (result.percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  }, [result.percentage]);

  return (
    <div className="flex flex-col items-center gap-8 p-8" data-testid="quiz-results">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900">Quiz Complete</h2>
        <p className={cn('mt-2 text-5xl font-bold', gradeColor)} data-testid="score-percentage">
          {result.percentage}%
        </p>
        <p className="mt-1 text-sm text-zinc-500" data-testid="score-fraction">
          {result.score} / {result.total} correct
        </p>
      </div>

      {/* Breakdown by type */}
      <div className="w-full max-w-md space-y-3" data-testid="score-breakdown">
        {Object.entries(result.breakdown).map(([type, data]) => {
          if (data.total === 0) return null;
          const pct = Math.round((data.correct / data.total) * 100);
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="w-28 text-sm capitalize text-zinc-600">
                {type.replace('_', ' ')}
              </span>
              <div className="flex-1 h-3 overflow-hidden rounded-full bg-zinc-200">
                <div
                  className={cn(
                    'h-full rounded-full',
                    pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-16 text-right text-xs text-zinc-500">
                {data.correct}/{data.total}
              </span>
            </div>
          );
        })}
      </div>

      {/* Wrong answers review */}
      {result.wrongAnswers.length > 0 && (
        <div className="w-full max-w-md" data-testid="wrong-answers-review">
          <h3 className="text-sm font-medium text-zinc-700 mb-3">
            Review Wrong Answers ({result.wrongAnswers.length})
          </h3>
          <div className="space-y-3">
            {result.wrongAnswers.map((wa, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-red-200 bg-red-50 p-3"
                data-testid={`wrong-answer-${idx}`}
              >
                <p className="text-xs font-medium text-zinc-500 capitalize">
                  {wa.question.type.replace('_', ' ')}
                  {wa.question.diagram.play.name && ` — ${wa.question.diagram.play.name}`}
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Your answer: <span className="font-medium">{wa.selectedAnswer || '(no answer)'}</span>
                </p>
                <p className="text-sm text-green-700">
                  Correct answer: <span className="font-medium">{wa.correctAnswer}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
          data-testid="restart-quiz-btn"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function QuizMode({
  plays,
  formations,
  playerPosition,
  onComplete,
  className,
}: QuizModeProps) {
  const [stage, setStage] = useState<QuizStage>('setup');
  const [questions, setQuestions] = useState<QuizQuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLimitPerQuestion, setTimeLimitPerQuestion] = useState(30);

  const handleStart = useCallback(
    (options: QuizOptions) => {
      const generatedQuestions = generateQuiz(plays, formations, {
        ...options,
        positions: playerPosition ? [playerPosition] : options.positions,
      });

      if (generatedQuestions.length === 0) {
        // Not enough data to generate quiz
        return;
      }

      setQuestions(generatedQuestions);
      setCurrentIndex(0);
      setAnswers([]);
      setStreak(0);
      setBestStreak(0);
      setResult(null);
      setStage('playing');
    },
    [plays, formations, playerPosition],
  );

  const handleAnswer = useCallback(
    (questionId: string, selectedAnswer: string, timeSpent: number) => {
      const answer: QuizAnswer = { questionId, selectedAnswer, timeSpent };
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      // Update streak
      const question = questions.find((q) => q.id === questionId);
      if (question && selectedAnswer === question.correctAnswer) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) setBestStreak(newStreak);
      } else {
        setStreak(0);
      }

      // Move to next question after a brief delay
      setTimeout(() => {
        if (currentIndex + 1 >= questions.length) {
          // Quiz complete
          const quizResult = scoreQuiz(questions, newAnswers);
          setResult(quizResult);
          setStage('review');
          onComplete?.(quizResult);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 1500);
    },
    [answers, questions, currentIndex, streak, bestStreak, onComplete],
  );

  const handleRestart = useCallback(() => {
    setStage('setup');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setResult(null);
    setStreak(0);
    setBestStreak(0);
  }, []);

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center bg-zinc-50',
        className,
      )}
      data-testid="quiz-mode"
    >
      {stage === 'setup' && <QuizSetup onStart={handleStart} />}

      {stage === 'playing' && questions.length > 0 && (
        <div className="flex w-full max-w-2xl flex-col gap-4 p-4">
          {/* Progress bar */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-600" data-testid="question-progress">
              {currentIndex + 1} / {questions.length}
            </span>
            <div className="flex-1 h-2 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
                data-testid="progress-bar"
              />
            </div>
            {streak > 0 && (
              <span
                className="text-sm font-bold text-amber-600"
                data-testid="streak-counter"
              >
                {streak} streak
              </span>
            )}
          </div>

          {/* Current question */}
          <QuizQuestion
            key={questions[currentIndex].id}
            question={questions[currentIndex]}
            onAnswer={handleAnswer}
            timeLimit={timeLimitPerQuestion}
          />
        </div>
      )}

      {stage === 'review' && result && (
        <QuizResults result={result} onRestart={handleRestart} />
      )}
    </div>
  );
}
