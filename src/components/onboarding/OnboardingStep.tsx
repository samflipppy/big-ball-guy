'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface OnboardingStepProps {
  children: ReactNode;
  active: boolean;
  direction?: 'forward' | 'backward';
  className?: string;
}

/**
 * Reusable step wrapper component with animation transitions.
 * Wraps each step of the onboarding wizard and handles enter/exit animations.
 */
export function OnboardingStep({
  children,
  active,
  direction = 'forward',
  className,
}: OnboardingStepProps) {
  if (!active) return null;

  return (
    <div
      className={cn(
        'w-full animate-in fade-in duration-300',
        direction === 'forward' ? 'slide-in-from-right-4' : 'slide-in-from-left-4',
        className,
      )}
      role="tabpanel"
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

export default OnboardingStep;
