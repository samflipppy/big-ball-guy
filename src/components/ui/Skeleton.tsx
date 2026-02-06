'use client';

import { cn } from '@/lib/utils';

// --- Base Skeleton ---
export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800',
        className,
      )}
      aria-hidden="true"
      data-testid="skeleton"
    />
  );
}

// --- SkeletonText ---
export interface SkeletonTextProps {
  className?: string;
  lines?: number;
}

export function SkeletonText({ className, lines = 3 }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true" data-testid="skeleton-text">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

// --- SkeletonCard ---
export interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900',
        className,
      )}
      aria-hidden="true"
      data-testid="skeleton-card"
    >
      <Skeleton className="mb-3 h-5 w-1/2" />
      <SkeletonText lines={2} />
    </div>
  );
}

// --- SkeletonPlayCard ---
export interface SkeletonPlayCardProps {
  className?: string;
}

export function SkeletonPlayCard({ className }: SkeletonPlayCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden',
        className,
      )}
      aria-hidden="true"
      data-testid="skeleton-play-card"
    >
      {/* Field thumbnail */}
      <Skeleton className="h-36 w-full rounded-none" />
      {/* Name + tags */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// --- SkeletonGrid ---
export interface SkeletonGridProps {
  className?: string;
  count?: number;
  variant?: 'play-card' | 'card';
}

export function SkeletonGrid({ className, count = 8, variant = 'play-card' }: SkeletonGridProps) {
  const CardComponent = variant === 'play-card' ? SkeletonPlayCard : SkeletonCard;

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
      aria-hidden="true"
      data-testid="skeleton-grid"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardComponent key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
