import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock react-konva
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => <div data-testid="stage" {...props}>{children}</div>,
  Layer: ({ children, ...props }: any) => <div data-testid="layer" {...props}>{children}</div>,
  Circle: (props: any) => <div data-testid="circle" {...props} />,
  Line: (props: any) => <div data-testid="line" {...props} />,
  Text: (props: any) => <div data-testid="konva-text" {...props} />,
  Rect: (props: any) => <div data-testid="rect" {...props} />,
  Group: ({ children, ...props }: any) => <div data-testid="group" {...props}>{children}</div>,
  Arrow: (props: any) => <div data-testid="arrow" {...props} />,
  RegularPolygon: (props: any) => <div data-testid="polygon" {...props} />,
  Path: (props: any) => <div data-testid="path" {...props} />,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock IndexedDB
const mockPut = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/db/indexeddb', () => ({
  plays: {
    put: (...args: any[]) => mockPut(...args),
    getAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  formations: {
    put: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  folders: {
    put: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock generateId
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    generateId: () => 'mock-generated-id',
  };
});

// Mock zustand stores
const mockSetCanvasTool = vi.fn();
const mockAddPlay = vi.fn();
const mockClearHistory = vi.fn();

vi.mock('@/stores/playStore', () => ({
  useAppStore: (selector?: any) => {
    const state = {
      currentTeamId: 'team-1',
      currentPlayId: null,
      currentMode: 'sketch',
      sidebarOpen: true,
      darkMode: false,
      canvasTool: 'select',
      plays: [],
      formations: [],
      concepts: [],
      gameplans: [],
      setCurrentPlayId: vi.fn(),
      setCanvasTool: mockSetCanvasTool,
      setCurrentMode: vi.fn(),
      addPlay: mockAddPlay,
    };
    if (selector) return selector(state);
    return state;
  },
  useHistoryStore: (selector?: any) => {
    const state = {
      past: [],
      future: [],
      pushHistory: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      clearHistory: mockClearHistory,
    };
    if (selector) return selector(state);
    return state;
  },
}));

import SketchPage from '@/app/(app)/sketch/page';

describe('SketchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      constructor() {}
    } as any;
  });

  it('renders the sketch page container', () => {
    render(<SketchPage />);
    expect(screen.getByTestId('sketch-page')).toBeInTheDocument();
  });

  it('renders the page title', () => {
    render(<SketchPage />);
    expect(screen.getByText('Quick Sketch')).toBeInTheDocument();
  });

  it('renders the canvas area with PlayRenderer (Stage)', () => {
    render(<SketchPage />);
    expect(screen.getByTestId('canvas-area')).toBeInTheDocument();
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });

  it('renders the drawing tools toolbar', () => {
    render(<SketchPage />);
    expect(screen.getByTestId('drawing-tools-container')).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Drawing tools' })).toBeInTheDocument();
  });

  it('renders drawing tools in vertical orientation', () => {
    render(<SketchPage />);
    const toolbar = screen.getByRole('toolbar', { name: 'Drawing tools' });
    expect(toolbar.className).toContain('flex-col');
  });

  it('renders all tool buttons', () => {
    render(<SketchPage />);
    expect(screen.getByLabelText('Select')).toBeInTheDocument();
    expect(screen.getByLabelText('Draw Route')).toBeInTheDocument();
    expect(screen.getByLabelText('Draw Block')).toBeInTheDocument();
    expect(screen.getByLabelText('Draw Motion')).toBeInTheDocument();
    expect(screen.getByLabelText('Eraser')).toBeInTheDocument();
    expect(screen.getByLabelText('Pan')).toBeInTheDocument();
  });

  it('renders the formation selector with options', () => {
    render(<SketchPage />);
    const selector = screen.getByTestId('formation-selector');
    expect(selector).toBeInTheDocument();
    // Should default to Singleback (first built-in formation)
    expect(selector).toHaveValue('builtin-singleback');
  });

  it('lists all built-in formations in the selector', () => {
    render(<SketchPage />);
    const selector = screen.getByTestId('formation-selector');
    expect(selector).toContainHTML('Singleback');
    expect(selector).toContainHTML('I-Form');
    expect(selector).toContainHTML('Shotgun');
    expect(selector).toContainHTML('Pistol');
    expect(selector).toContainHTML('Empty');
    expect(selector).toContainHTML('Trips');
    expect(selector).toContainHTML('Bunch');
  });

  it('changes formation when selector changes', async () => {
    const user = userEvent.setup();
    render(<SketchPage />);

    const selector = screen.getByTestId('formation-selector');
    await user.selectOptions(selector, 'builtin-shotgun');

    expect(selector).toHaveValue('builtin-shotgun');
    // Changing formation should clear history
    expect(mockClearHistory).toHaveBeenCalled();
  });

  it('renders New Play button', () => {
    render(<SketchPage />);
    expect(screen.getByTestId('new-play-btn')).toBeInTheDocument();
    expect(screen.getByTestId('new-play-btn')).toHaveTextContent('New Play');
  });

  it('renders Save to Playbook button', () => {
    render(<SketchPage />);
    expect(screen.getByTestId('save-playbook-btn')).toBeInTheDocument();
    expect(screen.getByTestId('save-playbook-btn')).toHaveTextContent('Save to Playbook');
  });

  it('resets state when New Play is clicked', async () => {
    const user = userEvent.setup();
    render(<SketchPage />);

    // Change formation first
    const selector = screen.getByTestId('formation-selector');
    await user.selectOptions(selector, 'builtin-shotgun');
    expect(selector).toHaveValue('builtin-shotgun');

    // Click New Play
    await user.click(screen.getByTestId('new-play-btn'));

    // Formation should reset to default (Singleback)
    expect(selector).toHaveValue('builtin-singleback');
    // History should be cleared
    expect(mockClearHistory).toHaveBeenCalled();
  });

  it('shows save modal when Save to Playbook is clicked', async () => {
    const user = userEvent.setup();
    render(<SketchPage />);

    // Modal should not be visible initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click Save to Playbook
    await user.click(screen.getByTestId('save-playbook-btn'));

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // "Save to Playbook" appears both as button text and modal header,
      // so verify the dialog is present and has the input
      expect(screen.getByTestId('play-name-input')).toBeInTheDocument();
    });
  });

  it('shows Cancel and Save buttons in the modal', async () => {
    const user = userEvent.setup();
    render(<SketchPage />);

    await user.click(screen.getByTestId('save-playbook-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('cancel-save-btn')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-save-btn')).toBeInTheDocument();
    });
  });

  it('disables Save button when play name is empty', async () => {
    const user = userEvent.setup();
    render(<SketchPage />);

    await user.click(screen.getByTestId('save-playbook-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-save-btn')).toBeDisabled();
    });
  });

  it('enables Save button when play name is entered', async () => {
    const user = userEvent.setup();
    render(<SketchPage />);

    await user.click(screen.getByTestId('save-playbook-btn'));

    const input = screen.getByTestId('play-name-input');
    await user.type(input, 'HB Dive');

    await waitFor(() => {
      expect(screen.getByTestId('confirm-save-btn')).not.toBeDisabled();
    });
  });

  it('saves play to IndexedDB and store when confirmed', async () => {
    const user = userEvent.setup();
    render(<SketchPage />);

    await user.click(screen.getByTestId('save-playbook-btn'));

    const input = screen.getByTestId('play-name-input');
    await user.type(input, 'HB Dive');
    await user.click(screen.getByTestId('confirm-save-btn'));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mock-generated-id',
          name: 'HB Dive',
          formationId: 'builtin-singleback',
        }),
      );
      expect(mockAddPlay).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'HB Dive',
        }),
      );
    });
  });

  it('closes modal after saving', async () => {
    const user = userEvent.setup();
    render(<SketchPage />);

    await user.click(screen.getByTestId('save-playbook-btn'));

    const input = screen.getByTestId('play-name-input');
    await user.type(input, 'PA Boot');
    await user.click(screen.getByTestId('confirm-save-btn'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes modal when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<SketchPage />);

    await user.click(screen.getByTestId('save-playbook-btn'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('cancel-save-btn'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('renders player groups from the formation', () => {
    render(<SketchPage />);
    // Singleback has 11 players, each rendered as a Group
    const groups = screen.getAllByTestId('group');
    expect(groups.length).toBeGreaterThanOrEqual(11);
  });

  it('renders field elements (lines, rects) from FieldCanvas', () => {
    render(<SketchPage />);
    const lines = screen.getAllByTestId('line');
    expect(lines.length).toBeGreaterThan(0);
    const rects = screen.getAllByTestId('rect');
    expect(rects.length).toBeGreaterThan(0);
  });
});
