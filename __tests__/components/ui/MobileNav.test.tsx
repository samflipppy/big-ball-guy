import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileNav } from '@/components/ui/MobileNav';
import { useAppStore } from '@/stores/playStore';

// ============================================================
// Mock useBreakpoint
// ============================================================

const mockBreakpoint = {
  breakpoint: 'mobile' as 'mobile' | 'tablet' | 'desktop',
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  width: 375,
  height: 667,
};

vi.mock('@/hooks/useBreakpoint', () => ({
  useBreakpoint: () => mockBreakpoint,
  default: () => mockBreakpoint,
}));

function setBreakpoint(bp: 'mobile' | 'tablet' | 'desktop') {
  mockBreakpoint.breakpoint = bp;
  mockBreakpoint.isMobile = bp === 'mobile';
  mockBreakpoint.isTablet = bp === 'tablet';
  mockBreakpoint.isDesktop = bp === 'desktop';
  mockBreakpoint.width = bp === 'mobile' ? 375 : bp === 'tablet' ? 800 : 1200;
  mockBreakpoint.height = bp === 'mobile' ? 667 : bp === 'tablet' ? 600 : 800;
}

// ============================================================
// Tests
// ============================================================

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setBreakpoint('mobile');
    // Reset store to default mode
    useAppStore.setState({ currentMode: 'playbook' });
  });

  it('renders on mobile breakpoint', () => {
    render(<MobileNav />);
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
  });

  it('renders on tablet breakpoint', () => {
    setBreakpoint('tablet');
    render(<MobileNav />);
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
  });

  it('does not render on desktop breakpoint', () => {
    setBreakpoint('desktop');
    render(<MobileNav />);
    expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
  });

  it('has role navigation with aria-label', () => {
    render(<MobileNav />);
    const nav = screen.getByTestId('mobile-nav');
    expect(nav).toHaveAttribute('role', 'navigation');
    expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');
  });

  it('renders exactly 5 tabs', () => {
    render(<MobileNav />);
    const tabs = [
      screen.getByTestId('mobile-nav-tab-sketch'),
      screen.getByTestId('mobile-nav-tab-playbook'),
      screen.getByTestId('mobile-nav-tab-gameplan'),
      screen.getByTestId('mobile-nav-tab-practice'),
      screen.getByTestId('mobile-nav-tab-gameday'),
    ];
    expect(tabs).toHaveLength(5);
  });

  it('renders Sketch tab', () => {
    render(<MobileNav />);
    const tab = screen.getByTestId('mobile-nav-tab-sketch');
    expect(tab).toBeInTheDocument();
    expect(tab.textContent).toContain('Sketch');
  });

  it('renders Playbook tab', () => {
    render(<MobileNav />);
    const tab = screen.getByTestId('mobile-nav-tab-playbook');
    expect(tab).toBeInTheDocument();
    expect(tab.textContent).toContain('Playbook');
  });

  it('renders Game Plan tab', () => {
    render(<MobileNav />);
    const tab = screen.getByTestId('mobile-nav-tab-gameplan');
    expect(tab).toBeInTheDocument();
    expect(tab.textContent).toContain('Game Plan');
  });

  it('renders Practice tab', () => {
    render(<MobileNav />);
    const tab = screen.getByTestId('mobile-nav-tab-practice');
    expect(tab).toBeInTheDocument();
    expect(tab.textContent).toContain('Practice');
  });

  it('renders Game Day tab', () => {
    render(<MobileNav />);
    const tab = screen.getByTestId('mobile-nav-tab-gameday');
    expect(tab).toBeInTheDocument();
    expect(tab.textContent).toContain('Game Day');
  });

  it('highlights the active tab with aria-current', () => {
    useAppStore.setState({ currentMode: 'playbook' });
    render(<MobileNav />);
    const activeTab = screen.getByTestId('mobile-nav-tab-playbook');
    expect(activeTab).toHaveAttribute('aria-current', 'page');
    // Other tabs should not have aria-current
    expect(screen.getByTestId('mobile-nav-tab-sketch')).not.toHaveAttribute('aria-current');
  });

  it('shows active indicator on the active tab', () => {
    useAppStore.setState({ currentMode: 'sketch' });
    render(<MobileNav />);
    const indicator = screen.getByTestId('active-indicator');
    expect(indicator).toBeInTheDocument();
    // Indicator should be inside the sketch tab
    const sketchTab = screen.getByTestId('mobile-nav-tab-sketch');
    expect(sketchTab.contains(indicator)).toBe(true);
  });

  it('changes mode when a tab is clicked', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ currentMode: 'playbook' });
    render(<MobileNav />);

    await user.click(screen.getByTestId('mobile-nav-tab-sketch'));
    expect(useAppStore.getState().currentMode).toBe('sketch');
  });

  it('clicking multiple tabs updates the active tab', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MobileNav />);

    await user.click(screen.getByTestId('mobile-nav-tab-gameplan'));
    expect(useAppStore.getState().currentMode).toBe('gameplan');

    rerender(<MobileNav />);
    expect(screen.getByTestId('mobile-nav-tab-gameplan')).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByTestId('mobile-nav-tab-gameday'));
    expect(useAppStore.getState().currentMode).toBe('gameday');

    rerender(<MobileNav />);
    expect(screen.getByTestId('mobile-nav-tab-gameday')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('mobile-nav-tab-gameplan')).not.toHaveAttribute('aria-current');
  });

  it('each tab has an aria-label', () => {
    render(<MobileNav />);
    const modes = ['sketch', 'playbook', 'gameplan', 'practice', 'gameday'];
    for (const mode of modes) {
      const tab = screen.getByTestId(`mobile-nav-tab-${mode}`);
      expect(tab).toHaveAttribute('aria-label');
    }
  });
});
