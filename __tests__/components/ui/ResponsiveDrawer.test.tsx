import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsiveDrawer } from '@/components/ui/ResponsiveDrawer';

// ============================================================
// Mock useBreakpoint
// ============================================================

const mockBreakpoint = {
  breakpoint: 'desktop' as 'mobile' | 'tablet' | 'desktop',
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  width: 1200,
  height: 800,
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

describe('ResponsiveDrawer', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    children: <div data-testid="drawer-content">Drawer Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setBreakpoint('desktop');
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  // ==================
  // Desktop mode
  // ==================
  describe('Desktop mode', () => {
    beforeEach(() => setBreakpoint('desktop'));

    it('renders as a persistent side panel', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer).toBeInTheDocument();
      expect(drawer.getAttribute('data-mode')).toBe('desktop');
    });

    it('renders children when open', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
    });

    it('hides content when closed', () => {
      render(<ResponsiveDrawer {...defaultProps} open={false} />);
      expect(screen.queryByTestId('drawer-content')).not.toBeInTheDocument();
    });

    it('has role complementary', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer).toHaveAttribute('role', 'complementary');
    });

    it('does not render a backdrop on desktop', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      expect(screen.queryByTestId('drawer-backdrop')).not.toBeInTheDocument();
    });

    it('applies border-r for left side', () => {
      render(<ResponsiveDrawer {...defaultProps} side="left" />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer.className).toContain('border-r');
    });

    it('applies border-l for right side', () => {
      render(<ResponsiveDrawer {...defaultProps} side="right" />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer.className).toContain('border-l');
    });
  });

  // ==================
  // Tablet mode
  // ==================
  describe('Tablet mode', () => {
    beforeEach(() => setBreakpoint('tablet'));

    it('renders as an overlay side panel', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer).toBeInTheDocument();
      expect(drawer.getAttribute('data-mode')).toBe('tablet');
    });

    it('shows a backdrop when open', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer-backdrop')).toBeInTheDocument();
    });

    it('does not show a backdrop when closed', () => {
      render(<ResponsiveDrawer {...defaultProps} open={false} />);
      expect(screen.queryByTestId('drawer-backdrop')).not.toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ResponsiveDrawer {...defaultProps} onClose={onClose} />);
      await user.click(screen.getByTestId('drawer-backdrop'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('has role dialog with aria-modal', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer).toHaveAttribute('role', 'dialog');
      expect(drawer).toHaveAttribute('aria-modal', 'true');
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ResponsiveDrawer {...defaultProps} onClose={onClose} />);
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('positions on the right by default', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer.className).toContain('right-0');
    });

    it('positions on the left when side=left', () => {
      render(<ResponsiveDrawer {...defaultProps} side="left" />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer.className).toContain('left-0');
    });
  });

  // ==================
  // Mobile mode
  // ==================
  describe('Mobile mode', () => {
    beforeEach(() => setBreakpoint('mobile'));

    it('renders as a bottom sheet', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer).toBeInTheDocument();
      expect(drawer.getAttribute('data-mode')).toBe('mobile');
    });

    it('shows a backdrop when open', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer-backdrop')).toBeInTheDocument();
    });

    it('renders a drag handle', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      expect(screen.getByTestId('drag-handle')).toBeInTheDocument();
    });

    it('has role dialog with aria-modal', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer).toHaveAttribute('role', 'dialog');
      expect(drawer).toHaveAttribute('aria-modal', 'true');
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ResponsiveDrawer {...defaultProps} onClose={onClose} />);
      await user.click(screen.getByTestId('drawer-backdrop'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('has bottom-0 and inset-x-0 classes for bottom sheet', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer.className).toContain('bottom-0');
      expect(drawer.className).toContain('inset-x-0');
    });

    it('renders children', () => {
      render(<ResponsiveDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
    });
  });

  // ==================
  // Transitions between modes
  // ==================
  describe('Side prop', () => {
    it('defaults to right side', () => {
      setBreakpoint('tablet');
      render(<ResponsiveDrawer {...defaultProps} />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer.className).toContain('right-0');
    });

    it('renders on left when side=left (tablet)', () => {
      setBreakpoint('tablet');
      render(<ResponsiveDrawer {...defaultProps} side="left" />);
      const drawer = screen.getByTestId('responsive-drawer');
      expect(drawer.className).toContain('left-0');
    });
  });
});
