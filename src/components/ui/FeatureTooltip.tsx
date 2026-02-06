'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { isDiscovered, markDiscovered, FEATURES } from '@/lib/feature-discovery';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface FeatureTooltipProps {
  featureId: string;
  children: React.ReactNode;
  position?: TooltipPosition;
}

/**
 * Renders a pulsing indicator dot and a tooltip for undiscovered features.
 * Once the user interacts with (clicks) the tooltip, the feature is marked as discovered.
 */
export function FeatureTooltip({ featureId, children, position = 'top' }: FeatureTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [discovered, setDiscovered] = useState(true);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDiscovered(isDiscovered(featureId));
  }, [featureId]);

  const feature = FEATURES.find((f) => f.id === featureId);

  const handleDismiss = useCallback(() => {
    markDiscovered(featureId);
    setDiscovered(true);
    setShowTooltip(false);
  }, [featureId]);

  // Close tooltip on Escape key
  useEffect(() => {
    if (!showTooltip) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showTooltip, handleDismiss]);

  // Close tooltip on outside click
  useEffect(() => {
    if (!showTooltip) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);

  if (discovered || !feature) {
    return <>{children}</>;
  }

  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div ref={containerRef} className="relative inline-block" data-testid="feature-tooltip-wrapper">
      {children}

      {/* Pulsing dot indicator */}
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        aria-label={`Learn about ${feature.title}`}
        className="absolute -right-1 -top-1 z-10"
        data-testid="pulse-dot"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 w-64 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 ${positionClasses[position]}`}
          data-testid="feature-tooltip"
        >
          <div className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {feature.title}
          </div>
          <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">
            {feature.description}
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="got-it-button"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}

export default FeatureTooltip;
