'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlayRenderer } from '@/components/canvas/PlayRenderer';
import { SlideControls } from './SlideControls';
import type { Play, Formation } from '@/types';

export interface MeetingDeckProps {
  plays: Play[];
  formations: Formation[];
  initialSlide?: number;
  onExit: () => void;
}

interface LaserDot {
  id: number;
  x: number;
  y: number;
}

let laserIdCounter = 0;

export function MeetingDeck({
  plays,
  formations,
  initialSlide = 0,
  onExit,
}: MeetingDeckProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(10);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [laserDots, setLaserDots] = useState<LaserDot[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideAreaRef = useRef<HTMLDivElement>(null);

  const totalSlides = plays.length;
  const currentPlay = plays[currentSlide];

  // Find the formation for the current play
  const currentFormation = formations.find(
    (f) => f.id === currentPlay?.formationId,
  );

  // Navigation
  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const goToPrevious = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const toggleAutoAdvance = useCallback(() => {
    setAutoAdvance((prev) => !prev);
  }, []);

  // Reset timer when slide changes or auto-advance is toggled
  useEffect(() => {
    setTimeRemaining(autoAdvanceSeconds);
  }, [currentSlide, autoAdvance, autoAdvanceSeconds]);

  // Auto-advance timer
  useEffect(() => {
    if (!autoAdvance) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Advance to next slide
          setCurrentSlide((s) => {
            if (s >= totalSlides - 1) {
              // At the last slide, stop auto-advance
              setAutoAdvance(false);
              return s;
            }
            return s + 1;
          });
          return autoAdvanceSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoAdvance, autoAdvanceSeconds, totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goToPrevious();
          break;
        case 'Escape':
          e.preventDefault();
          onExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, onExit]);

  // Laser pointer click handler
  const handleSlideClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!slideAreaRef.current) return;

      const rect = slideAreaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = ++laserIdCounter;

      setLaserDots((prev) => [...prev, { id, x, y }]);

      // Fade the dot after 1.5 seconds
      setTimeout(() => {
        setLaserDots((prev) => prev.filter((dot) => dot.id !== id));
      }, 1500);
    },
    [],
  );

  // Notes for current play
  const currentNotes = currentPlay ? notes[currentPlay.id] ?? '' : '';
  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!currentPlay) return;
      setNotes((prev) => ({
        ...prev,
        [currentPlay.id]: e.target.value,
      }));
    },
    [currentPlay],
  );

  if (totalSlides === 0) {
    return (
      <div
        className="fixed inset-0 z-50 bg-zinc-950 flex items-center justify-center text-white"
        data-testid="meeting-deck"
      >
        <div className="text-center">
          <p className="text-lg text-zinc-400" data-testid="empty-deck">No plays to present</p>
          <button
            className="mt-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-sm"
            onClick={onExit}
            data-testid="empty-deck-exit"
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950 flex flex-col text-white"
      data-testid="meeting-deck"
    >
      {/* Top bar: play name + auto-advance config */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-900/80 border-b border-zinc-800">
        <h2 className="text-xl font-bold truncate" data-testid="slide-play-name">
          {currentPlay?.name ?? 'Untitled'}
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400" htmlFor="auto-advance-seconds">
            Seconds per slide:
          </label>
          <input
            id="auto-advance-seconds"
            type="number"
            min={3}
            max={120}
            value={autoAdvanceSeconds}
            onChange={(e) => setAutoAdvanceSeconds(Math.max(3, Math.min(120, Number(e.target.value))))}
            className="w-16 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-white text-xs text-center"
            data-testid="auto-advance-seconds-input"
          />
        </div>
      </div>

      {/* Main content: play renderer + notes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Play diagram area */}
        <div
          ref={slideAreaRef}
          className="flex-1 flex items-center justify-center relative cursor-crosshair"
          onClick={handleSlideClick}
          data-testid="slide-area"
        >
          {currentFormation ? (
            <PlayRenderer
              play={currentPlay}
              formation={currentFormation}
              mode="full"
              width={800}
              height={500}
              showDefense={!!currentPlay.defensiveOverlay}
              showLabels
              showRoutes
              showBlocking
              interactive={false}
            />
          ) : (
            <div className="text-zinc-500 text-sm" data-testid="missing-formation">
              Formation not found
            </div>
          )}

          {/* Laser dots */}
          {laserDots.map((dot) => (
            <div
              key={dot.id}
              className="absolute w-3 h-3 rounded-full bg-red-500 pointer-events-none animate-pulse"
              style={{
                left: dot.x - 6,
                top: dot.y - 6,
                boxShadow: '0 0 8px 2px rgba(239, 68, 68, 0.7)',
              }}
              data-testid="laser-dot"
            />
          ))}
        </div>

        {/* Notes panel */}
        <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col" data-testid="notes-panel">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-300">Notes</h3>
          </div>
          <textarea
            className="flex-1 p-4 bg-transparent text-sm text-zinc-300 resize-none focus:outline-none placeholder-zinc-600"
            placeholder="Add meeting notes for this play..."
            value={currentNotes}
            onChange={handleNotesChange}
            data-testid="slide-notes"
          />
          {currentPlay?.notes && (
            <div className="px-4 py-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Play notes:</p>
              <p className="text-xs text-zinc-400" data-testid="play-notes">{currentPlay.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <SlideControls
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        autoAdvance={autoAdvance}
        autoAdvanceSeconds={autoAdvanceSeconds}
        timeRemaining={timeRemaining}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onToggleAutoAdvance={toggleAutoAdvance}
        onExit={onExit}
      />
    </div>
  );
}

export default MeetingDeck;
