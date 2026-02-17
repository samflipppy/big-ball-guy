import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/components/ui/Sidebar';
import { useAppStore } from '@/stores/playStore';

let mockPathname = '/playbook';
const mockPush = vi.fn((path: string) => {
  mockPathname = path;
});
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    mockPathname = '/playbook';
    mockPush.mockClear();
    // Reset store to defaults
    useAppStore.setState({
      currentMode: 'playbook',
      sidebarOpen: true,
    });
  });

  it('renders team name', () => {
    render(<Sidebar teamName="Eagles" />);
    expect(screen.getByText('Eagles')).toBeInTheDocument();
  });

  it('renders the team initial in the logo area', () => {
    render(<Sidebar teamName="Eagles" />);
    expect(screen.getByText('E')).toBeInTheDocument();
  });

  it('renders default team name "My Team"', () => {
    render(<Sidebar />);
    expect(screen.getByText('My Team')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Quick Sketch')).toBeInTheDocument();
    expect(screen.getByText('Playbook')).toBeInTheDocument();
    expect(screen.getByText('Game Plans')).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
    expect(screen.getByText('Game Day')).toBeInTheDocument();
  });

  it('highlights the active mode', () => {
    useAppStore.setState({ currentMode: 'playbook' });
    render(<Sidebar />);

    const playbookBtn = screen.getByText('Playbook').closest('button');
    expect(playbookBtn?.getAttribute('aria-current')).toBe('page');
  });

  it('changes mode when a nav item is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByText('Quick Sketch'));
    expect(useAppStore.getState().currentMode).toBe('sketch');
    expect(mockPush).toHaveBeenCalledWith('/sketch');
  });

  it('changes mode to gameplan when Game Plans is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByText('Game Plans'));
    expect(useAppStore.getState().currentMode).toBe('gameplan');
    expect(mockPush).toHaveBeenCalledWith('/gameplan');
  });

  it('changes mode to practice when Practice is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByText('Practice'));
    expect(useAppStore.getState().currentMode).toBe('practice');
    expect(mockPush).toHaveBeenCalledWith('/practice');
  });

  it('changes mode to gameday when Game Day is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByText('Game Day'));
    expect(useAppStore.getState().currentMode).toBe('gameday');
    expect(mockPush).toHaveBeenCalledWith('/gameday');
  });

  it('renders settings button', () => {
    render(<Sidebar />);
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('navigates to settings when settings button is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByLabelText('Settings'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('shows sync status indicator', () => {
    render(
      <Sidebar
        syncStatus={{
          lastSaved: new Date().toISOString(),
          lastSynced: new Date().toISOString(),
          pendingChanges: 0,
          isOnline: true,
          isSyncing: false,
        }}
      />,
    );
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows syncing status when syncing', () => {
    render(
      <Sidebar
        syncStatus={{
          lastSaved: new Date().toISOString(),
          lastSynced: new Date().toISOString(),
          pendingChanges: 0,
          isOnline: true,
          isSyncing: true,
        }}
      />,
    );
    expect(screen.getByText('Syncing')).toBeInTheDocument();
  });

  it('shows offline status', () => {
    render(
      <Sidebar
        syncStatus={{
          lastSaved: new Date().toISOString(),
          lastSynced: null,
          pendingChanges: 2,
          isOnline: false,
          isSyncing: false,
        }}
      />,
    );
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('has proper navigation role and label', () => {
    render(<Sidebar />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('shows overlay on mobile when sidebar is open', () => {
    useAppStore.setState({ sidebarOpen: true });
    render(<Sidebar />);
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument();
  });

  it('hides nav labels when sidebar is collapsed', () => {
    useAppStore.setState({ sidebarOpen: false });
    render(<Sidebar />);
    // All nav text labels should not be present in the DOM
    expect(screen.queryByText('Quick Sketch')).not.toBeInTheDocument();
    expect(screen.queryByText('Playbook')).not.toBeInTheDocument();
  });
});
