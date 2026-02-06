import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const {
  mockPlay, mockFormation, mockFormations, stableAllPlays,
  mockSavePlay, mockGetFormation, mockSetCurrentPlayId,
} = vi.hoisted(() => {
  const formation = {
    id: 'formation-1',
    name: 'Singleback',
    side: 'offense' as const,
    players: [
      { id: 'qb', position: 'QB' as const, label: 'QB', location: { x: 400, y: 280 }, side: 'offense' as const },
      { id: 'rb', position: 'RB' as const, label: 'RB', location: { x: 400, y: 330 }, side: 'offense' as const },
    ],
    personnel: '11',
    tags: [] as string[],
    isCustom: false,
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };

  const play = {
    id: 'test-play-1',
    name: 'HB Dive',
    formationId: 'formation-1',
    assignments: [] as any[],
    tags: ['run', 'inside'],
    notes: 'Quick hitting run play',
    personnel: '11',
    hash: 'middle' as const,
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };

  const formations = [formation, {
    id: 'formation-2',
    name: 'Shotgun',
    side: 'offense' as const,
    players: [] as any[],
    personnel: '11',
    tags: [] as string[],
    isCustom: false,
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  }];

  // Stable reference for allPlays to prevent useEffect re-triggering
  const allPlays = [play];

  return {
    mockPlay: play,
    mockFormation: formation,
    mockFormations: formations,
    stableAllPlays: allPlays,
    mockSavePlay: vi.fn().mockResolvedValue(undefined),
    mockGetFormation: vi.fn(),
    mockSetCurrentPlayId: vi.fn(),
  };
});

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
  useParams: () => ({ playId: 'test-play-1' }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('@/hooks/usePlaybook', () => ({
  usePlaybook: () => ({
    allPlays: stableAllPlays,
    plays: stableAllPlays,
    formations: mockFormations,
    savePlay: mockSavePlay,
    getFormation: mockGetFormation,
    isLoading: false,
    folders: [],
    allTags: ['run', 'inside'],
    filters: { searchQuery: '', formationId: null, tags: [], personnel: null, folderId: null },
    setFilters: vi.fn(),
    sort: { field: 'updatedAt', direction: 'desc' },
    setSort: vi.fn(),
    viewMode: 'grid',
    setViewMode: vi.fn(),
    selectedPlayIds: [],
    toggleSelectPlay: vi.fn(),
    clearSelection: vi.fn(),
    selectAll: vi.fn(),
    createPlay: vi.fn(),
    deletePlay: vi.fn(),
    duplicatePlay: vi.fn(),
    bulkDelete: vi.fn(),
    bulkTag: vi.fn(),
    bulkMove: vi.fn(),
    createFormation: vi.fn(),
    createFolder: vi.fn(),
    deleteFolder: vi.fn(),
    renameFolder: vi.fn(),
    folderPlayCounts: {},
  }),
}));

vi.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: () => ({
    syncStatus: {
      lastSaved: '2025-01-01T00:00:00.000Z',
      lastSynced: null,
      pendingChanges: 0,
      isOnline: true,
      isSyncing: false,
    },
    forceSave: vi.fn(),
  }),
}));

vi.mock('@/stores/playStore', () => ({
  useAppStore: (selector: any) => {
    const state = {
      currentTeamId: 'team-1',
      currentPlayId: null,
      currentMode: 'playbook',
      sidebarOpen: true,
      darkMode: false,
      canvasTool: 'select',
      plays: [],
      formations: [],
      concepts: [],
      gameplans: [],
      setCurrentPlayId: mockSetCurrentPlayId,
      setCanvasTool: vi.fn(),
    };
    return selector(state);
  },
  useHistoryStore: (selector: any) => {
    const state = {
      past: [],
      future: [],
      pushHistory: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      clearHistory: vi.fn(),
    };
    return selector(state);
  },
}));

import PlayEditorPage from '@/app/(app)/playbook/[playId]/page';

describe('PlayEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFormation.mockReturnValue(mockFormation);
  });

  it('renders the play editor page', () => {
    render(<PlayEditorPage />);
    expect(screen.getByTestId('play-editor-page')).toBeInTheDocument();
  });

  it('displays the play name', () => {
    render(<PlayEditorPage />);
    expect(screen.getByTestId('play-name-display')).toHaveTextContent('HB Dive');
  });

  it('shows back to playbook link', () => {
    render(<PlayEditorPage />);
    const backLink = screen.getByTestId('back-to-playbook');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/playbook');
  });

  it('shows save status indicator', () => {
    render(<PlayEditorPage />);
    expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');
  });

  it('renders formation selector with options', () => {
    render(<PlayEditorPage />);
    const selector = screen.getByTestId('formation-selector');
    expect(selector).toBeInTheDocument();
    expect(selector).toHaveValue('formation-1');
  });

  it('renders drawing tools toolbar', () => {
    render(<PlayEditorPage />);
    expect(screen.getByRole('toolbar', { name: 'Drawing tools' })).toBeInTheDocument();
  });

  it('renders the canvas area with PlayRenderer', () => {
    render(<PlayEditorPage />);
    expect(screen.getByTestId('canvas-area')).toBeInTheDocument();
    expect(screen.getByTestId('stage')).toBeInTheDocument();
  });

  it('renders properties panel with tags, notes, personnel, hash', () => {
    render(<PlayEditorPage />);
    expect(screen.getByTestId('properties-panel')).toBeInTheDocument();
    expect(screen.getByTestId('tags-input')).toBeInTheDocument();
    expect(screen.getByTestId('notes-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('personnel-select')).toBeInTheDocument();
    expect(screen.getByTestId('hash-selector')).toBeInTheDocument();
  });

  it('shows notes textarea with existing notes', () => {
    render(<PlayEditorPage />);
    const notesTextarea = screen.getByTestId('notes-textarea');
    expect(notesTextarea).toHaveValue('Quick hitting run play');
  });

  it('shows tags input with existing tags', () => {
    render(<PlayEditorPage />);
    const tagsInput = screen.getByTestId('tags-input');
    expect(tagsInput).toHaveValue('run, inside');
  });

  it('shows hash buttons with selected hash highlighted', () => {
    render(<PlayEditorPage />);
    const middleHash = screen.getByTestId('hash-middle');
    expect(middleHash).toBeInTheDocument();
  });

  it('allows inline play name editing', async () => {
    const user = userEvent.setup();
    render(<PlayEditorPage />);

    await user.click(screen.getByTestId('play-name-display'));
    expect(screen.getByTestId('play-name-input')).toBeInTheDocument();
  });

  it('toggles right panel visibility', async () => {
    const user = userEvent.setup();
    render(<PlayEditorPage />);

    expect(screen.getByTestId('properties-panel')).toBeInTheDocument();
    await user.click(screen.getByTestId('toggle-panel-btn'));
    expect(screen.queryByTestId('properties-panel')).not.toBeInTheDocument();
  });

  it('shows Add Defense button', () => {
    render(<PlayEditorPage />);
    expect(screen.getByTestId('toggle-defense-btn')).toHaveTextContent('Add Defense');
  });

  it('toggles defense overlay', async () => {
    const user = userEvent.setup();
    render(<PlayEditorPage />);

    await user.click(screen.getByTestId('toggle-defense-btn'));
    expect(screen.getByTestId('toggle-defense-btn')).toHaveTextContent('Hide Defense');
  });

  it('shows defensive settings when defense is enabled', async () => {
    const user = userEvent.setup();
    render(<PlayEditorPage />);

    await user.click(screen.getByTestId('toggle-defense-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('defense-front-select')).toBeInTheDocument();
      expect(screen.getByTestId('defense-coverage-select')).toBeInTheDocument();
    });
  });

  it('shows play not found when formation is missing', () => {
    mockGetFormation.mockReturnValue(undefined);

    render(<PlayEditorPage />);
    expect(screen.getByTestId('play-not-found')).toBeInTheDocument();
    expect(screen.getByText('Play not found')).toBeInTheDocument();
  });

  it('renders personnel select with current value', () => {
    render(<PlayEditorPage />);
    expect(screen.getByTestId('personnel-select')).toHaveValue('11');
  });
});
