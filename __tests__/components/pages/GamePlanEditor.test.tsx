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
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  useParams: () => ({ planId: 'plan-1' }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

// Mock plays
const mockPlays = [
  {
    id: 'play-1',
    name: 'HB Dive',
    formationId: 'f1',
    assignments: [],
    tags: ['run'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'play-2',
    name: 'PA Boot',
    formationId: 'f1',
    assignments: [],
    tags: ['pass'],
    personnel: '12',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

const mockFormations = [
  {
    id: 'f1',
    name: 'Singleback',
    side: 'offense' as const,
    players: [],
    personnel: '11',
    tags: [],
    isCustom: false,
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

const mockGamePlan = {
  id: 'plan-1',
  name: 'Week 1 vs Lincoln',
  opponent: 'Lincoln',
  week: 1,
  season: '2025',
  sections: [
    {
      id: 'sec-1',
      situation: '1st & 10',
      plays: [{ playId: 'play-1', order: 0 }],
      notes: '',
      order: 0,
    },
  ],
  teamId: 'team-1',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
};

const mockAddSection = vi.fn();
const mockRemoveSection = vi.fn();
const mockUpdateSection = vi.fn();
const mockAddPlayToSection = vi.fn();
const mockRemovePlayFromSection = vi.fn();
const mockReorderPlaysInSection = vi.fn();
const mockUpdateGamePlan = vi.fn().mockResolvedValue(undefined);

let gamePlanReturnValue: any = {
  gamePlan: mockGamePlan,
  gamePlans: [mockGamePlan],
  loading: false,
  error: null,
  createGamePlan: vi.fn(),
  updateGamePlan: mockUpdateGamePlan,
  deleteGamePlan: vi.fn(),
  loadGamePlan: vi.fn(),
  loadAllGamePlans: vi.fn(),
  addSection: mockAddSection,
  removeSection: mockRemoveSection,
  updateSection: mockUpdateSection,
  reorderSections: vi.fn(),
  addPlayToSection: mockAddPlayToSection,
  removePlayFromSection: mockRemovePlayFromSection,
  reorderPlaysInSection: mockReorderPlaysInSection,
};

vi.mock('@/hooks/useGamePlan', () => ({
  useGamePlan: () => gamePlanReturnValue,
}));

vi.mock('@/hooks/usePlaybook', () => ({
  usePlaybook: () => ({
    allPlays: mockPlays,
    plays: mockPlays,
    formations: mockFormations,
    isLoading: false,
    savePlay: vi.fn(),
    getFormation: vi.fn(),
    folders: [],
    allTags: [],
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

import GamePlanEditorPage from '@/app/(app)/gameplan/[planId]/page';

describe('GamePlanEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gamePlanReturnValue = {
      ...gamePlanReturnValue,
      gamePlan: mockGamePlan,
      loading: false,
    };
  });

  it('renders the game plan editor page', () => {
    render(<GamePlanEditorPage />);
    expect(screen.getByTestId('gameplan-editor-page')).toBeInTheDocument();
  });

  it('displays opponent name in header', () => {
    render(<GamePlanEditorPage />);
    expect(screen.getByTestId('opponent-name')).toHaveTextContent('vs Lincoln');
  });

  it('shows back to game plans link', () => {
    render(<GamePlanEditorPage />);
    const backLink = screen.getByTestId('back-to-gameplans');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/gameplan');
  });

  it('shows total play count in header', () => {
    render(<GamePlanEditorPage />);
    // Header shows "Week 1 | 1 play" and section also shows play count
    const headerText = screen.getByText(/Week 1 \| 1 play/);
    expect(headerText).toBeInTheDocument();
  });

  it('shows export button', () => {
    render(<GamePlanEditorPage />);
    expect(screen.getByTestId('export-btn')).toBeInTheDocument();
  });

  it('renders play browser in left panel', () => {
    render(<GamePlanEditorPage />);
    expect(screen.getByText('Play Browser')).toBeInTheDocument();
  });

  it('displays plays in the browser list', () => {
    render(<GamePlanEditorPage />);
    expect(screen.getByTestId('browser-play-play-1')).toBeInTheDocument();
    expect(screen.getByTestId('browser-play-play-2')).toBeInTheDocument();
  });

  it('renders existing game plan sections', () => {
    render(<GamePlanEditorPage />);
    expect(screen.getByTestId('gameplan-section-sec-1')).toBeInTheDocument();
  });

  it('shows Add Section button', () => {
    render(<GamePlanEditorPage />);
    expect(screen.getByTestId('add-section-btn')).toBeInTheDocument();
  });

  it('opens section preset menu when Add Section is clicked', async () => {
    const user = userEvent.setup();
    render(<GamePlanEditorPage />);

    await user.click(screen.getByTestId('add-section-btn'));
    expect(screen.getByTestId('preset-menu')).toBeInTheDocument();
  });

  it('shows all section presets in the menu', async () => {
    const user = userEvent.setup();
    render(<GamePlanEditorPage />);

    await user.click(screen.getByTestId('add-section-btn'));
    expect(screen.getByTestId('preset-1st-&-10')).toBeInTheDocument();
    expect(screen.getByTestId('preset-2nd-&-medium')).toBeInTheDocument();
    expect(screen.getByTestId('preset-3rd-&-short')).toBeInTheDocument();
    expect(screen.getByTestId('preset-3rd-&-long')).toBeInTheDocument();
    expect(screen.getByTestId('preset-red-zone')).toBeInTheDocument();
    expect(screen.getByTestId('preset-goal-line')).toBeInTheDocument();
    expect(screen.getByTestId('preset-2-minute')).toBeInTheDocument();
  });

  it('adds section when preset is clicked', async () => {
    const user = userEvent.setup();
    render(<GamePlanEditorPage />);

    await user.click(screen.getByTestId('add-section-btn'));
    await user.click(screen.getByTestId('preset-red-zone'));

    expect(mockAddSection).toHaveBeenCalledWith('Red Zone');
  });

  it('filters plays in browser by search', async () => {
    const user = userEvent.setup();
    render(<GamePlanEditorPage />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'HB');

    await waitFor(() => {
      expect(screen.getByTestId('browser-play-play-1')).toBeInTheDocument();
      expect(screen.queryByTestId('browser-play-play-2')).not.toBeInTheDocument();
    });
  });

  it('shows save status indicator', () => {
    render(<GamePlanEditorPage />);
    expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');
  });

  it('shows not found when game plan does not exist', () => {
    gamePlanReturnValue = {
      ...gamePlanReturnValue,
      gamePlan: null,
      loading: false,
    };
    render(<GamePlanEditorPage />);
    expect(screen.getByTestId('gameplan-not-found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    gamePlanReturnValue = {
      ...gamePlanReturnValue,
      loading: true,
    };
    render(<GamePlanEditorPage />);
    expect(screen.getByTestId('gameplan-editor-loading')).toBeInTheDocument();
  });

  it('shows empty sections message when no sections', () => {
    gamePlanReturnValue = {
      ...gamePlanReturnValue,
      gamePlan: { ...mockGamePlan, sections: [] },
    };
    render(<GamePlanEditorPage />);
    expect(screen.getByTestId('empty-sections')).toBeInTheDocument();
  });

  it('renders custom section option in preset menu', async () => {
    const user = userEvent.setup();
    render(<GamePlanEditorPage />);

    await user.click(screen.getByTestId('add-section-btn'));
    expect(screen.getByTestId('preset-custom')).toBeInTheDocument();
  });

  it('adds custom section when custom option is clicked', async () => {
    const user = userEvent.setup();
    render(<GamePlanEditorPage />);

    await user.click(screen.getByTestId('add-section-btn'));
    await user.click(screen.getByTestId('preset-custom'));

    expect(mockAddSection).toHaveBeenCalledWith('Custom');
  });
});
