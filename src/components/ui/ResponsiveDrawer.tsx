'use client';

import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export interface ResponsiveDrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  children: ReactNode;
}

/**
 * Responsive drawer component that adapts to screen size:
 * - Desktop (>1024px): persistent side panel
 * - Tablet (768-1024px): overlay panel with backdrop
 * - Mobile (<768px): full-screen bottom sheet
 */
export function ResponsiveDrawer({
  open,
  onClose,
  side = 'right',
  children,
}: ResponsiveDrawerProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  // Close on Escape
  useEffect(() => {
    if (!open || isDesktop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, isDesktop]);

  // Lock body scroll when overlay/bottom-sheet is open
  useEffect(() => {
    if (open && !isDesktop) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, isDesktop]);

  // Swipe-to-close on mobile (bottom sheet swipes down)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
  }, [isMobile]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile || touchStartYRef.current === null) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartYRef.current;
    const elapsed = Date.now() - touchStartTimeRef.current;

    // Swipe down to close: require a minimum 80px drag or fast swipe
    if (deltaY > 80 || (deltaY > 30 && elapsed < 300)) {
      onClose();
    }

    touchStartYRef.current = null;
  }, [isMobile, onClose]);

  // ==================
  // Desktop: persistent panel
  // ==================
  if (isDesktop) {
    return (
      <aside
        ref={drawerRef}
        className={cn(
          'flex h-full w-80 shrink-0 flex-col border-zinc-200 bg-white transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950',
          side === 'left' ? 'border-r' : 'border-l',
          !open && 'w-0 overflow-hidden border-0',
        )}
        data-testid="responsive-drawer"
        data-mode="desktop"
        role="complementary"
        aria-label="Side panel"
      >
        {open && <div className="flex-1 overflow-y-auto p-4">{children}</div>}
      </aside>
    );
  }

  // ==================
  // Mobile: full-screen bottom sheet
  // ==================
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200"
            onClick={onClose}
            aria-hidden="true"
            data-testid="drawer-backdrop"
          />
        )}
        <div
          ref={drawerRef}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl bg-white shadow-xl transition-transform duration-300 ease-out dark:bg-zinc-900',
            open ? 'translate-y-0' : 'translate-y-full',
          )}
          data-testid="responsive-drawer"
          data-mode="mobile"
          role="dialog"
          aria-modal="true"
          aria-label="Bottom sheet"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" data-testid="drag-handle" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        </div>
      </>
    );
  }

  // ==================
  // Tablet: overlay side panel with backdrop
  // ==================
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
          data-testid="drawer-backdrop"
        />
      )}
      <aside
        ref={drawerRef}
        className={cn(
          'fixed top-0 z-50 flex h-full w-80 flex-col bg-white shadow-xl transition-transform duration-300 ease-out dark:bg-zinc-900',
          side === 'left' ? 'left-0' : 'right-0',
          open
            ? 'translate-x-0'
            : side === 'left'
              ? '-translate-x-full'
              : 'translate-x-full',
        )}
        data-testid="responsive-drawer"
        data-mode="tablet"
        role="dialog"
        aria-modal="true"
        aria-label="Side panel"
      >
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}

export default ResponsiveDrawer;
