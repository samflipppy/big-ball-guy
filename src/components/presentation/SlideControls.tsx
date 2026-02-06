'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SlideControlsProps {
  currentSlide: number;
  totalSlides: number;
  autoAdvance: boolean;
  autoAdvanceSeconds: number;
  timeRemaining?: number;
  onPrevious: () => void;
  onNext: () => void;
  onToggleAutoAdvance: () => void;
  onExit: () => void;
}

export function SlideControls({
  currentSlide,
  totalSlides,
  autoAdvance,
  autoAdvanceSeconds,
  timeRemaining,
  onPrevious,
  onNext,
  onToggleAutoAdvance,
  onExit,
}: SlideControlsProps) {
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === totalSlides - 1;

  return (
    <div
      className="flex items-center justify-between px-6 py-3 bg-zinc-900/95 border-t border-zinc-700 text-white"
      data-testid="slide-controls"
    >
      {/* Left: Previous + shortcuts */}
      <div className="flex items-center gap-3">
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            isFirst
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-zinc-700 hover:bg-zinc-600 text-white',
          )}
          onClick={onPrevious}
          disabled={isFirst}
          data-testid="slide-prev"
          aria-label="Previous slide"
        >
          Previous
        </button>
        <span className="text-xs text-zinc-500" data-testid="shortcut-hint-arrows">
          Arrow keys to navigate
        </span>
      </div>

      {/* Center: Slide counter + auto-advance */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-mono tabular-nums" data-testid="slide-counter">
          {currentSlide + 1} / {totalSlides}
        </span>

        <button
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            autoAdvance
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300',
          )}
          onClick={onToggleAutoAdvance}
          data-testid="auto-advance-toggle"
          aria-label={autoAdvance ? 'Disable auto-advance' : 'Enable auto-advance'}
        >
          {autoAdvance ? 'Auto: ON' : 'Auto: OFF'}
        </button>

        {autoAdvance && timeRemaining != null && (
          <span className="text-xs text-blue-400 font-mono tabular-nums" data-testid="auto-advance-timer">
            {timeRemaining}s / {autoAdvanceSeconds}s
          </span>
        )}
      </div>

      {/* Right: Next + Exit */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500" data-testid="shortcut-hint-escape">
          Esc to exit
        </span>
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            isLast
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-zinc-700 hover:bg-zinc-600 text-white',
          )}
          onClick={onNext}
          disabled={isLast}
          data-testid="slide-next"
          aria-label="Next slide"
        >
          Next
        </button>
        <button
          className="px-4 py-2 rounded-md text-sm font-medium bg-red-700 hover:bg-red-600 text-white transition-colors"
          onClick={onExit}
          data-testid="slide-exit"
          aria-label="Exit presentation"
        >
          Exit
        </button>
      </div>
    </div>
  );
}

export default SlideControls;
