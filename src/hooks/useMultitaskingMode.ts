'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface MultitaskingInfo {
  isFullScreen: boolean;
  isSplitView: boolean;
  isSlideOver: boolean;
  availableWidth: number;
  availableHeight: number;
}

// iPad screen widths for reference
const IPAD_FULL_WIDTH_MIN = 1024;
const SLIDE_OVER_MAX_WIDTH = 320;
const SPLIT_VIEW_THRESHOLD = 0.75; // if available width < 75% of screen, it's split

/**
 * Hook that detects iPad multitasking mode (Split View / Slide Over)
 * and returns layout information for adapting the UI.
 *
 * Uses window.matchMedia and ResizeObserver to monitor size changes.
 */
export function useMultitaskingMode(): MultitaskingInfo {
  const [info, setInfo] = useState<MultitaskingInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isFullScreen: true,
        isSplitView: false,
        isSlideOver: false,
        availableWidth: 1024,
        availableHeight: 768,
      };
    }
    return detectMode(window.innerWidth, window.innerHeight);
  });

  const infoRef = useRef(info);
  infoRef.current = info;

  const update = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const newInfo = detectMode(width, height);
    const prev = infoRef.current;

    if (
      prev.isFullScreen !== newInfo.isFullScreen ||
      prev.isSplitView !== newInfo.isSplitView ||
      prev.isSlideOver !== newInfo.isSlideOver ||
      prev.availableWidth !== newInfo.availableWidth ||
      prev.availableHeight !== newInfo.availableHeight
    ) {
      setInfo(newInfo);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    update();

    // Use ResizeObserver for layout changes
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        update();
      });
      observer.observe(document.documentElement);
    }

    // Also listen to resize events as fallback
    window.addEventListener('resize', update);

    // matchMedia listener for orientation changes that may indicate multitasking
    const orientationQuery = window.matchMedia('(orientation: landscape)');
    orientationQuery.addEventListener('change', update);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', update);
      orientationQuery.removeEventListener('change', update);
    };
  }, [update]);

  return info;
}

/**
 * Determines the multitasking mode based on available width and height.
 */
function detectMode(width: number, height: number): MultitaskingInfo {
  const screenWidth = typeof screen !== 'undefined' ? screen.width : width;

  // Slide Over: very narrow width (around 320px on iPad)
  const isSlideOver = width <= SLIDE_OVER_MAX_WIDTH && screenWidth >= IPAD_FULL_WIDTH_MIN;

  // Split View: width is significantly less than full screen but not Slide Over
  const isSplitView =
    !isSlideOver &&
    screenWidth >= IPAD_FULL_WIDTH_MIN &&
    width < screenWidth * SPLIT_VIEW_THRESHOLD;

  // Full screen: neither split view nor slide over
  const isFullScreen = !isSlideOver && !isSplitView;

  return {
    isFullScreen,
    isSplitView,
    isSlideOver,
    availableWidth: width,
    availableHeight: height,
  };
}

export default useMultitaskingMode;
