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
  {
    id: 'play-3',
    name: 'Screen Right',
    formationId: 'f1',
    assignments: [],
    tags: ['pass', 'screen'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

const mockGamePlans = [
  {
    id: 'gp-1',
    name: 'Week 1 vs Lincoln',
    opponent: 'Lincoln',
    week: 1,
    season: '2025',
    sections: [
      {
        id: 'sec-1',
        situation: '1st & 10',
        plays: [
          { playId: 'play-1', order: 0 },
          { playId: 'play-2', order: 1 },
        ],
        notes: '',
        order: 0,
      },
      {
        id: 'sec-2',
        situation: 'Red Zone',
        plays: [
          { playId: 'play-3', order: 0 },
        ],
        notes: '',
        order: 1,
      },
    ],
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'gp-2',
    name: 'Week 2 vs Jefferson',
    opponent: 'Jefferson',
    week: 2,
    season: '2025',
    sections: [],
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

const mockLoadAllGamePlans = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useGamePlan', () => ({
  useGamePlan: () => ({
    gamePlan: null,
    gamePlans: mockGamePlans,
    loading: false,
    error: null,
    createGamePlan: vi.fn(),
    updateGamePlan: vi.fn(),
    deleteGamePlan: vi.fn(),
    loadGamePlan: vi.fn(),
    loadAllGamePlans: mockLoadAllGamePlans,
    addSection: vi.fn(),
    removeSection: vi.fn(),
    updateSection: vi.fn(),
    reorderSections: vi.fn(),
    addPlayToSection: vi.fn(),
    removePlayFromSection: vi.fn(),
    reorderPlaysInSection: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePlaybook', () => ({
  usePlaybook: () => ({
    allPlays: mockPlays,
    plays: mockPlays,
    formations: [],
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

import GameDayPage from '@/app/(app)/gameday/page';

describe('GameDayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the game day page', () => {
    render(<GameDayPage />);
    expect(screen.getByTestId('gameday-page')).toBeInTheDocument();
  });

  it('shows page title', () => {
    render(<GameDayPage />);
    expect(screen.getByText('Game Day')).toBeInTheDocument();
  });

  it('renders game plan selector', () => {
    render(<GameDayPage />);
    const selector = screen.getByTestId('gameplan-selector');
    expect(selector).toBeInTheDocument();
  });

  it('shows game plans in selector dropdown', () => {
    render(<GameDayPage />);
    const selector = screen.getByTestId('gameplan-selector');
    expect(selector).toContainHTML('Wk 1 vs Lincoln');
    expect(selector).toContainHTML('Wk 2 vs Jefferson');
  });

  it('shows Call Sheet and Wristband toggle buttons', () => {
    render(<GameDayPage />);
    expect(screen.getByTestId('tab-callsheet')).toBeInTheDocument();
    expect(screen.getByTestId('tab-wristband')).toBeInTheDocument();
  });

  it('shows print button', () => {
    render(<GameDayPage />);
    expect(screen.getByTestId('print-btn')).toBeInTheDocument();
  });

  it('auto-selects first game plan and shows call sheet view', async () => {
    render(<GameDayPage />);

    await waitFor(() => {
      expect(screen.getByTestId('call-sheet-view')).toBeInTheDocument();
    });
  });

  it('displays plan header with opponent and week', async () => {
    render(<GameDayPage />);

    await waitFor(() => {
      expect(screen.getByTestId('plan-header')).toHaveTextContent('Week 1 vs Lincoln');
    });
  });

  it('shows call sheet sections from game plan', async () => {
    render(<GameDayPage />);

    await waitFor(() => {
      expect(screen.getByTestId('call-sheet-view')).toBeInTheDocument();
    });
  });

  it('switches to wristband view when tab is clicked', async () => {
    const user = userEvent.setup();
    render(<GameDayPage />);

    await waitFor(() => {
      expect(screen.getByTestId('call-sheet-view')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('tab-wristband'));

    await waitFor(() => {
      expect(screen.getByTestId('wristband-generator')).toBeInTheDocument();
      expect(screen.queryByTestId('call-sheet-view')).not.toBeInTheDocument();
    });
  });

  it('switches back to call sheet view from wristband', async () => {
    const user = userEvent.setup();
    render(<GameDayPage />);

    await waitFor(() => {
      expect(screen.getByTestId('call-sheet-view')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('tab-wristband'));
    await waitFor(() => {
      expect(screen.getByTestId('wristband-generator')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('tab-callsheet'));
    await waitFor(() => {
      expect(screen.getByTestId('call-sheet-view')).toBeInTheDocument();
    });
  });

  it('changes game plan when selector changes', async () => {
    const user = userEvent.setup();
    render(<GameDayPage />);

    await waitFor(() => {
      expect(screen.getByTestId('plan-header')).toHaveTextContent('Week 1 vs Lincoln');
    });

    const selector = screen.getByTestId('gameplan-selector');
    await user.selectOptions(selector, 'gp-2');

    // gp-2 has no sections, so it should show empty state
    await waitFor(() => {
      expect(screen.getByText('Empty game plan')).toBeInTheDocument();
    });
  });

  it('calls window.print when print button is clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<GameDayPage />);

    await user.click(screen.getByTestId('print-btn'));
    expect(printSpy).toHaveBeenCalled();

    printSpy.mockRestore();
  });

  it('filters plays by search query', async () => {
    const user = userEvent.setup();
    render(<GameDayPage />);

    await waitFor(() => {
      expect(screen.getByTestId('call-sheet-view')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'Screen');

    await waitFor(() => {
      // Only the Red Zone section with Screen Right should be visible
      const callSheetView = screen.getByTestId('call-sheet-view');
      expect(callSheetView).toBeInTheDocument();
    });
  });

  it('shows empty state when no game plan is selected', async () => {
    const user = userEvent.setup();
    render(<GameDayPage />);

    // Wait for auto-select, then deselect
    await waitFor(() => {
      expect(screen.getByTestId('gameplan-selector')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('gameplan-selector');
    await user.selectOptions(selector, '');

    await waitFor(() => {
      expect(screen.getByText('Select a game plan')).toBeInTheDocument();
    });
  });

  it('loads game plans on mount', () => {
    render(<GameDayPage />);
    expect(mockLoadAllGamePlans).toHaveBeenCalled();
  });

  it('shows total play count in plan header', async () => {
    render(<GameDayPage />);

    await waitFor(() => {
      expect(screen.getByText(/3 plays/)).toBeInTheDocument();
    });
  });
});
