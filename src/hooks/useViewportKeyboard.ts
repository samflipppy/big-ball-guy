'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ViewportKeyboardInfo {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  visualViewportHeight: number;
}

/**
 * Hook that detects iOS virtual keyboard showing/hiding using the Visual Viewport API.
 *
 * Returns the keyboard state including estimated keyboard height.
 * Auto-scrolls focused inputs into view when the keyboard opens.
 */
export function useViewportKeyboard(): ViewportKeyboardInfo {
  const [info, setInfo] = useState<ViewportKeyboardInfo>({
    isKeyboardOpen: false,
    keyboardHeight: 0,
    visualViewportHeight: typeof window !== 'undefined'
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 768,
  });

  const infoRef = useRef(info);
  infoRef.current = info;

  const initialHeightRef = useRef<number>(
    typeof window !== 'undefined'
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 768,
  );

  const scrollFocusedIntoView = useCallback(() => {
    // Auto-scroll focused input into view when keyboard opens
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement)
    ) {
      // Small delay to let the viewport settle
      setTimeout(() => {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    // Capture initial height on mount
    initialHeightRef.current = viewport.height;

    function handleViewportResize() {
      if (!viewport) return;

      const currentVisualHeight = viewport.height;
      const fullHeight = initialHeightRef.current;

      // Keyboard is considered open if visual viewport is significantly smaller
      // than the initial height (threshold: 150px to avoid false positives from toolbars)
      const heightDiff = fullHeight - currentVisualHeight;
      const isOpen = heightDiff > 150;
      const keyboardHeight = isOpen ? heightDiff : 0;

      const prev = infoRef.current;
      if (
        prev.isKeyboardOpen !== isOpen ||
        prev.keyboardHeight !== keyboardHeight ||
        prev.visualViewportHeight !== currentVisualHeight
      ) {
        setInfo({
          isKeyboardOpen: isOpen,
          keyboardHeight,
          visualViewportHeight: currentVisualHeight,
        });

        if (isOpen && !prev.isKeyboardOpen) {
          scrollFocusedIntoView();
        }
      }
    }

    viewport.addEventListener('resize', handleViewportResize);
    viewport.addEventListener('scroll', handleViewportResize);

    return () => {
      viewport.removeEventListener('resize', handleViewportResize);
      viewport.removeEventListener('scroll', handleViewportResize);
    };
  }, [scrollFocusedIntoView]);

  return info;
}

export default useViewportKeyboard;
