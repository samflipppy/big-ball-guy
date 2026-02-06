'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointInfo {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

const MOBILE_MAX = 768;
const TABLET_MAX = 1024;

function getBreakpoint(width: number): Breakpoint {
  if (width < MOBILE_MAX) return 'mobile';
  if (width <= TABLET_MAX) return 'tablet';
  return 'desktop';
}

function buildInfo(width: number, height: number): BreakpointInfo {
  const breakpoint = getBreakpoint(width);
  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    width,
    height,
  };
}

/**
 * Hook that returns the current responsive breakpoint and viewport dimensions.
 *
 * Breakpoints:
 * - mobile: <768px
 * - tablet: 768-1024px
 * - desktop: >1024px
 *
 * Uses ResizeObserver on document.documentElement for performance.
 */
export function useBreakpoint(): BreakpointInfo {
  const [info, setInfo] = useState<BreakpointInfo>(() => {
    if (typeof window === 'undefined') {
      return buildInfo(1024, 768); // SSR default to desktop
    }
    return buildInfo(window.innerWidth, window.innerHeight);
  });

  const infoRef = useRef(info);
  infoRef.current = info;

  const updateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const newBreakpoint = getBreakpoint(width);
    const prev = infoRef.current;

    // Only trigger state update if breakpoint or dimensions actually changed
    if (prev.breakpoint !== newBreakpoint || prev.width !== width || prev.height !== height) {
      setInfo(buildInfo(width, height));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial measurement
    updateDimensions();

    // Use ResizeObserver on documentElement for performance
    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateDimensions();
      });
      observer.observe(document.documentElement);
    }

    // Fallback: also listen to window resize for viewport changes (e.g. mobile toolbar)
    window.addEventListener('resize', updateDimensions);

    return () => {
      if (observer) {
        observer.disconnect();
      }
      window.removeEventListener('resize', updateDimensions);
    };
  }, [updateDimensions]);

  return info;
}

export default useBreakpoint;
