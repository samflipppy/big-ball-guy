'use client';

import React, { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { PlaybackSpeed } from './PlayAnimation';

// ============================================================
// Types
// ============================================================

export interface PlayAnimationControlsProps {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  speed: PlaybackSpeed;
  onPlay: () => void;
  onPause: () => void;
  onRewind: () => void;
  onScrub: (time: number) => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 2];

// ============================================================
// Component
// ============================================================

export function PlayAnimationControls({
  isPlaying,
  currentTime,
  totalDuration,
  speed,
  onPlay,
  onPause,
  onRewind,
  onScrub,
  onSpeedChange,
  onStepForward,
  onStepBackward,
}: PlayAnimationControlsProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const formatTime = (seconds: number): string => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const tenths = Math.floor((s % 1) * 10);
    if (mins > 0) {
      return `${mins}:${String(secs).padStart(2, '0')}.${tenths}`;
    }
    return `${secs}.${tenths}s`;
  };

  /**
   * Handle clicking on the progress bar to scrub.
   */
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressBarRef.current;
      if (!bar) return;

      const rect = bar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      onScrub(ratio * totalDuration);
    },
    [totalDuration, onScrub],
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  const cycleSpeed = useCallback(() => {
    const currentIdx = SPEED_OPTIONS.indexOf(speed);
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
    onSpeedChange(SPEED_OPTIONS[nextIdx]);
  }, [speed, onSpeedChange]);

  return (
    <div
      data-testid="animation-controls"
      className="flex flex-col gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800"
    >
      {/* Progress bar */}
      <div
        ref={progressBarRef}
        data-testid="progress-bar"
        className="relative h-2 w-full cursor-pointer rounded-full bg-zinc-300 dark:bg-zinc-600"
        onClick={handleProgressClick}
        role="slider"
        aria-label="Animation progress"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-[width] duration-75"
          style={{ width: `${progress}%` }}
          data-testid="progress-fill"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-blue-600 border-2 border-white shadow-sm"
          style={{ left: `calc(${progress}% - 7px)` }}
          data-testid="progress-thumb"
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Left: playback buttons */}
        <div className="flex items-center gap-1">
          {/* Step backward */}
          <button
            onClick={onStepBackward}
            className="rounded p-1 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
            title="Step backward"
            data-testid="btn-step-backward"
            aria-label="Step backward"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
            </svg>
          </button>

          {/* Rewind */}
          <button
            onClick={onRewind}
            className="rounded p-1 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
            title="Rewind"
            data-testid="btn-rewind"
            aria-label="Rewind"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={handlePlayPause}
            className="rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
            title={isPlaying ? 'Pause' : 'Play'}
            data-testid="btn-play-pause"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            )}
          </button>

          {/* Step forward */}
          <button
            onClick={onStepForward}
            className="rounded p-1 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
            title="Step forward"
            data-testid="btn-step-forward"
            aria-label="Step forward"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Center: time display */}
        <span
          className="text-xs font-mono text-zinc-500 dark:text-zinc-400"
          data-testid="time-display"
        >
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>

        {/* Right: speed selector */}
        <button
          onClick={cycleSpeed}
          className={cn(
            'rounded px-2 py-0.5 text-xs font-medium transition-colors',
            'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700',
            speed !== 1 && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          )}
          title="Change speed"
          data-testid="btn-speed"
          aria-label={`Speed ${speed}x`}
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}

export default PlayAnimationControls;
