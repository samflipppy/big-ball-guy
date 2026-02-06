import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { DarkModeProvider } from '@/components/ui/DarkModeProvider';
import { useAppStore } from '@/stores/playStore';

describe('DarkModeToggle', () => {
  beforeEach(() => {
    useAppStore.setState({ darkMode: false });
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('renders the toggle button', () => {
    render(<DarkModeToggle />);
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
  });

  it('shows "Switch to dark mode" label when in light mode', () => {
    useAppStore.setState({ darkMode: false });
    render(<DarkModeToggle />);
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
  });

  it('shows "Switch to light mode" label when in dark mode', () => {
    useAppStore.setState({ darkMode: true });
    render(<DarkModeToggle />);
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
  });

  it('toggles dark mode in the store on click', async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);

    expect(useAppStore.getState().darkMode).toBe(false);
    await user.click(screen.getByRole('button'));
    expect(useAppStore.getState().darkMode).toBe(true);
  });

  it('toggles back to light mode on second click', async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);

    await user.click(screen.getByRole('button'));
    expect(useAppStore.getState().darkMode).toBe(true);

    await user.click(screen.getByRole('button'));
    expect(useAppStore.getState().darkMode).toBe(false);
  });

  it('applies custom className', () => {
    render(<DarkModeToggle className="my-custom-class" />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('my-custom-class');
  });
});

describe('DarkModeProvider', () => {
  beforeEach(() => {
    useAppStore.setState({ darkMode: false });
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('adds dark class to documentElement when darkMode is true', () => {
    localStorage.setItem('darkMode', 'true');
    useAppStore.setState({ darkMode: true });
    render(
      <DarkModeProvider>
        <div>child</div>
      </DarkModeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class from documentElement when darkMode is false', () => {
    document.documentElement.classList.add('dark');
    useAppStore.setState({ darkMode: false });
    render(
      <DarkModeProvider>
        <div>child</div>
      </DarkModeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists darkMode to localStorage', () => {
    localStorage.setItem('darkMode', 'true');
    useAppStore.setState({ darkMode: true });
    render(
      <DarkModeProvider>
        <div>child</div>
      </DarkModeProvider>,
    );
    expect(localStorage.getItem('darkMode')).toBe('true');
  });

  it('reads darkMode preference from localStorage on mount', () => {
    localStorage.setItem('darkMode', 'true');
    useAppStore.setState({ darkMode: false });
    render(
      <DarkModeProvider>
        <div>child</div>
      </DarkModeProvider>,
    );
    expect(useAppStore.getState().darkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('reads false preference from localStorage on mount', () => {
    localStorage.setItem('darkMode', 'false');
    useAppStore.setState({ darkMode: true });
    render(
      <DarkModeProvider>
        <div>child</div>
      </DarkModeProvider>,
    );
    expect(useAppStore.getState().darkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('renders children', () => {
    render(
      <DarkModeProvider>
        <div>test content</div>
      </DarkModeProvider>,
    );
    expect(screen.getByText('test content')).toBeInTheDocument();
  });

  it('updates dark class when toggled via store', async () => {
    const user = userEvent.setup();
    render(
      <DarkModeProvider>
        <DarkModeToggle />
      </DarkModeProvider>,
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    await user.click(screen.getByRole('button'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('darkMode')).toBe('true');
  });
});
