import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallPrompt } from '@/components/ui/InstallPrompt';

// ---------------------------------------------------------------------------
// Mock the hook so we can control its return value
// ---------------------------------------------------------------------------

const mockHookReturn = vi.hoisted(() => ({
  canInstall: false,
  promptInstall: vi.fn(async () => {}),
  isInstalled: false,
  dismiss: vi.fn(),
  isDismissed: false,
  isIOS: false,
}));

vi.mock('@/hooks/useInstallPrompt', () => ({
  useInstallPrompt: () => mockHookReturn,
}));

beforeEach(() => {
  mockHookReturn.canInstall = false;
  mockHookReturn.isInstalled = false;
  mockHookReturn.isDismissed = false;
  mockHookReturn.isIOS = false;
  mockHookReturn.promptInstall = vi.fn(async () => {});
  mockHookReturn.dismiss = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InstallPrompt', () => {
  it('renders nothing when canInstall is false and not iOS', () => {
    render(<InstallPrompt />);
    expect(screen.queryByTestId('install-prompt')).not.toBeInTheDocument();
  });

  it('renders nothing when already installed', () => {
    mockHookReturn.canInstall = true;
    mockHookReturn.isInstalled = true;
    render(<InstallPrompt />);
    expect(screen.queryByTestId('install-prompt')).not.toBeInTheDocument();
  });

  it('renders nothing when dismissed', () => {
    mockHookReturn.canInstall = true;
    mockHookReturn.isDismissed = true;
    render(<InstallPrompt />);
    expect(screen.queryByTestId('install-prompt')).not.toBeInTheDocument();
  });

  it('renders the banner when canInstall is true', () => {
    mockHookReturn.canInstall = true;
    render(<InstallPrompt />);
    expect(screen.getByTestId('install-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('install-prompt-title').textContent).toContain('Install Big Ball Guy');
  });

  it('shows Install button for non-iOS browsers', () => {
    mockHookReturn.canInstall = true;
    render(<InstallPrompt />);
    expect(screen.getByTestId('install-prompt-install-btn')).toBeInTheDocument();
    expect(screen.getByTestId('install-prompt-description')).toBeInTheDocument();
  });

  it('shows iOS instructions instead of Install button on iOS', () => {
    mockHookReturn.isIOS = true;
    render(<InstallPrompt />);
    expect(screen.getByTestId('install-prompt-ios')).toBeInTheDocument();
    expect(screen.queryByTestId('install-prompt-install-btn')).not.toBeInTheDocument();
  });

  it('calls promptInstall and onInstall when Install is clicked', async () => {
    mockHookReturn.canInstall = true;
    const onInstall = vi.fn();
    const user = userEvent.setup();

    render(<InstallPrompt onInstall={onInstall} />);

    await user.click(screen.getByTestId('install-prompt-install-btn'));

    expect(mockHookReturn.promptInstall).toHaveBeenCalledTimes(1);
    expect(onInstall).toHaveBeenCalledTimes(1);
  });

  it('calls dismiss and onDismiss when Dismiss is clicked', async () => {
    mockHookReturn.canInstall = true;
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(<InstallPrompt onDismiss={onDismiss} />);

    await user.click(screen.getByTestId('install-prompt-dismiss-btn'));

    expect(mockHookReturn.dismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismiss button says "Not now" for non-iOS', () => {
    mockHookReturn.canInstall = true;
    render(<InstallPrompt />);
    expect(screen.getByTestId('install-prompt-dismiss-btn').textContent).toBe('Not now');
  });

  it('dismiss button says "Got it" on iOS', () => {
    mockHookReturn.isIOS = true;
    render(<InstallPrompt />);
    expect(screen.getByTestId('install-prompt-dismiss-btn').textContent).toBe('Got it');
  });

  it('renders the app icon', () => {
    mockHookReturn.canInstall = true;
    render(<InstallPrompt />);
    expect(screen.getByTestId('install-prompt-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockHookReturn.canInstall = true;
    render(<InstallPrompt className="my-class" />);
    expect(screen.getByTestId('install-prompt').className).toContain('my-class');
  });
});
