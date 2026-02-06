'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UndoToastProps {
  message: string;
  onUndo: () => void;
  duration?: number;
  onDismiss?: () => void;
}

/**
 * A toast notification with an undo action button.
 * Auto-dismisses after the configured duration with a progress bar.
 * Accessible: uses role="alert" and keyboard-focusable undo button.
 */
export function UndoToast({ message, onUndo, duration = 5000, onDismiss }: UndoToastProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const animFrameRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    // Allow exit animation to play
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 300);
  }, [exiting, onDismiss]);

  // Update progress bar using requestAnimationFrame
  useEffect(() => {
    if (duration <= 0) return;

    startTimeRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining > 0) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [duration]);

  // Auto-dismiss timer
  useEffect(() => {
    if (duration <= 0) return;

    timerRef.current = setTimeout(() => {
      dismiss();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, dismiss]);

  const handleUndo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    onUndo();
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 300);
  }, [onUndo, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid="undo-toast"
      className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300 ${
        exiting ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
      }`}
      style={{
        animation: exiting ? undefined : 'slideUp 0.3s ease-out',
      }}
    >
      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <span className="text-sm text-zinc-700 dark:text-zinc-300">{message}</span>
        <button
          type="button"
          onClick={handleUndo}
          className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          data-testid="undo-button"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-1 text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:text-zinc-300"
          data-testid="dismiss-button"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Progress bar */}
      {duration > 0 && (
        <div
          className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          data-testid="progress-bar"
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default UndoToast;
