'use client';

/**
 * Customer Feedback Widget (#314)
 *
 * Floating feedback button that opens a form with type selector,
 * star rating, text area, and submit action.
 */

import React, { useState, useCallback } from 'react';
import type { FeedbackType } from '@/lib/feedback';

// ---- Types ----

export interface FeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  userId: string;
  onSubmit: (data: {
    userId: string;
    type: FeedbackType;
    rating: 1 | 2 | 3 | 4 | 5;
    message: string;
    page: string;
  }) => void;
}

// ---- Subcomponents ----

const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'general', label: 'General' },
];

function StarRating({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (r: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={`text-2xl transition-colors ${
            star <= rating ? 'text-yellow-400' : 'text-zinc-300'
          }`}
          onClick={() => onChange(star as 1 | 2 | 3 | 4 | 5)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ---- Main component ----

export function FeedbackWidget({
  position = 'bottom-right',
  userId,
  onSubmit,
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('general');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const positionClass =
    position === 'bottom-left' ? 'left-4 bottom-4' : 'right-4 bottom-4';

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim()) return;

      onSubmit({
        userId,
        type,
        rating,
        message: message.trim(),
        page: typeof window !== 'undefined' ? window.location.pathname : '/',
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
        setMessage('');
        setRating(5);
        setType('general');
      }, 2000);
    },
    [userId, type, rating, message, onSubmit],
  );

  if (!isOpen) {
    return (
      <button
        className={`fixed ${positionClass} z-50 rounded-full bg-blue-600 px-4 py-3 text-white shadow-lg hover:bg-blue-700 transition-colors`}
        onClick={() => setIsOpen(true)}
        aria-label="Send feedback"
      >
        Feedback
      </button>
    );
  }

  return (
    <div
      className={`fixed ${positionClass} z-50 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-800`}
      role="dialog"
      aria-label="Feedback form"
    >
      {submitted ? (
        <div className="py-8 text-center">
          <p className="text-lg font-semibold text-green-600">Thank you!</p>
          <p className="text-sm text-zinc-500">Your feedback has been submitted.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Send Feedback</h3>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-600"
              onClick={() => setIsOpen(false)}
              aria-label="Close feedback form"
            >
              X
            </button>
          </div>

          {/* Type selector */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Type
            </label>
            <div className="flex gap-2" role="group">
              {FEEDBACK_TYPES.map((ft) => (
                <button
                  key={ft.value}
                  type="button"
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    type === ft.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}
                  onClick={() => setType(ft.value)}
                >
                  {ft.label}
                </button>
              ))}
            </div>
          </div>

          {/* Star rating */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Rating
            </label>
            <StarRating rating={rating} onChange={setRating} />
          </div>

          {/* Message */}
          <div className="mb-3">
            <label
              htmlFor="feedback-message"
              className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
            >
              Message
            </label>
            <textarea
              id="feedback-message"
              className="w-full rounded border border-zinc-300 p-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              rows={3}
              placeholder="Tell us what you think..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!message.trim()}
          >
            Submit Feedback
          </button>
        </form>
      )}
    </div>
  );
}
