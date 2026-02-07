'use client';

import { cn } from '@/lib/utils';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Bottom banner prompting the user to install the PWA.
 *
 * - On supported browsers: shows Install + Dismiss buttons.
 * - On iOS: shows manual "Add to Home Screen" instructions.
 * - Tracks dismissal in localStorage; re-appears after 7 days.
 * - Hidden when already installed or recently dismissed.
 */
export function InstallPrompt({ onInstall, onDismiss, className }: InstallPromptProps) {
  const { canInstall, promptInstall, isInstalled, dismiss, isDismissed, isIOS } = useInstallPrompt();

  // Don't render if already installed or dismissed
  if (isInstalled || isDismissed) return null;

  // Only show if the browser offered a prompt OR we're on iOS
  if (!canInstall && !isIOS) return null;

  const handleInstall = async () => {
    await promptInstall();
    onInstall?.();
  };

  const handleDismiss = () => {
    dismiss();
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'border-t bg-white px-4 py-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900',
        className,
      )}
      role="banner"
      data-testid="install-prompt"
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        {/* App icon placeholder */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg"
          aria-hidden="true"
          data-testid="install-prompt-icon"
        >
          BB
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white" data-testid="install-prompt-title">
            Install Big Ball Guy
          </p>
          {isIOS ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400" data-testid="install-prompt-ios">
              Tap the share button and select &quot;Add to Home Screen&quot;
            </p>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400" data-testid="install-prompt-description">
              Get quick access from your home screen
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex shrink-0 gap-2">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              data-testid="install-prompt-install-btn"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            data-testid="install-prompt-dismiss-btn"
          >
            {isIOS ? 'Got it' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
