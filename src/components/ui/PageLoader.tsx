'use client';

import { cn } from '@/lib/utils';
import { Skeleton, SkeletonGrid, SkeletonText } from './Skeleton';

export interface PageLoaderProps {
  className?: string;
  variant?: 'grid' | 'canvas' | 'detail';
  count?: number;
}

export function PageLoader({ className, variant = 'grid', count = 8 }: PageLoaderProps) {
  return (
    <div className={cn('flex flex-1 flex-col', className)} data-testid="page-loader">
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <Skeleton className="h-7 w-48" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-6">
        {variant === 'grid' && <SkeletonGrid count={count} variant="play-card" />}

        {variant === 'canvas' && (
          <div className="flex h-full gap-4">
            {/* Canvas area */}
            <Skeleton className="flex-1 rounded-xl" />
            {/* Side panel */}
            <div className="hidden w-64 space-y-4 lg:block">
              <Skeleton className="h-10 w-full rounded-lg" />
              <SkeletonText lines={4} />
              <Skeleton className="h-10 w-full rounded-lg" />
              <SkeletonText lines={3} />
            </div>
          </div>
        )}

        {variant === 'detail' && (
          <div className="mx-auto max-w-4xl space-y-6">
            <Skeleton className="h-8 w-2/3" />
            <SkeletonText lines={4} />
            <SkeletonGrid count={4} variant="card" />
          </div>
        )}
      </div>
    </div>
  );
}

export default PageLoader;
