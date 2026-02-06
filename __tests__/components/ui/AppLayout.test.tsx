import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppLayout from '@/app/(app)/layout';
import { useAppStore } from '@/stores/playStore';

// Mock next/navigation since we're testing outside of Next.js router context
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/sketch',
  useSearchParams: () => new URLSearchParams(),
}));

describe('AppLayout', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentMode: 'playbook',
      sidebarOpen: true,
    });
  });

  it('renders children content', () => {
    render(
      <AppLayout>
        <div>Page content here</div>
      </AppLayout>,
    );
    expect(screen.getByText('Page content here')).toBeInTheDocument();
  });

  it('renders the sidebar with navigation', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>,
    );
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('renders all nav items in the sidebar', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>,
    );
    expect(screen.getByText('Quick Sketch')).toBeInTheDocument();
    expect(screen.getByText('Playbook')).toBeInTheDocument();
    expect(screen.getByText('Game Plans')).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
    expect(screen.getByText('Game Day')).toBeInTheDocument();
  });

  it('renders the header with toggle button', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>,
    );
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument();
  });

  it('toggles sidebar when hamburger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>,
    );

    expect(useAppStore.getState().sidebarOpen).toBe(true);
    await user.click(screen.getByLabelText('Toggle sidebar'));
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it('renders Playbook Pro text in the header', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>,
    );
    expect(screen.getByText('Playbook Pro')).toBeInTheDocument();
  });

  it('renders sidebar collapse/expand button for desktop', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>,
    );
    expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
  });

  it('changes button label when sidebar is collapsed', async () => {
    useAppStore.setState({ sidebarOpen: false });
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>,
    );
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('renders a main content area', () => {
    render(
      <AppLayout>
        <div>Main content</div>
      </AppLayout>,
    );
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveTextContent('Main content');
  });
});
