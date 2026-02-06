'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface UpgradePromptProps {
  feature: string;
  currentUsage: number;
  limit: number;
  className?: string;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

/**
 * Inline prompt shown when a user hits a free-tier limit.
 * Displays current usage vs. limit and provides a CTA to the pricing page.
 * Dismissible via the close button.
 */
export function UpgradePrompt({
  feature,
  currentUsage,
  limit,
  className,
  onUpgrade,
  onDismiss,
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  function handleUpgrade() {
    onUpgrade?.();
  }

  return (
    <div
      className={cn(
        'relative flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950',
        className,
      )}
      role="alert"
      data-testid="upgrade-prompt"
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
        <svg
          className="h-5 w-5 text-amber-600 dark:text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100" data-testid="usage-text">
          You&apos;ve used {currentUsage}/{limit} {feature}. Upgrade to Pro for unlimited.
        </p>
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        size="sm"
        onClick={handleUpgrade}
        data-testid="upgrade-button"
      >
        Upgrade
      </Button>

      {/* Dismiss */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-lg p-1 text-amber-500 hover:bg-amber-100 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900 dark:hover:text-amber-200"
        aria-label="Dismiss"
        data-testid="dismiss-button"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default UpgradePrompt;
