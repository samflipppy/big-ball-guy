import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const {
  mockPush, mockCreateGamePlan, mockLoadAllGamePlans, mockGamePlans,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockCreateGamePlan: vi.fn().mockResolvedValue({
    id: 'gp-new',
    name: 'Week 1 vs Roosevelt',
    opponent: 'Roosevelt',
    week: 1,
    season: '2025',
    sections: [],
    teamId: 'team-1',
    createdAt: '2025-09-15T00:00:00.000Z',
    updatedAt: '2025-09-15T00:00:00.000Z',
  }),
  mockLoadAllGamePlans: vi.fn().mockResolvedValue(undefined),
  mockGamePlans: [
    {
      id: 'gp-1',
      name: 'Week 1 vs Lincoln',
      opponent: 'Lincoln',
      week: 1,
      season: '2025',
      sections: [
        { id: 's1', situation: '1st & 10', plays: [{ playId: 'p1', order: 0 }, { playId: 'p2', order: 1 }], order: 0 },
      ],
      teamId: 'team-1',
      createdAt: '2025-08-15T00:00:00.000Z',
      updatedAt: '2025-08-15T00:00:00.000Z',
    },
    {
      id: 'gp-2',
      name: 'Week 3 vs Jefferson',
      opponent: 'Jefferson',
      week: 3,
      season: '2025',
      sections: [],
      teamId: 'team-1',
      createdAt: '2025-08-29T00:00:00.000Z',
      updatedAt: '2025-08-29T00:00:00.000Z',
    },
  ],
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

let useGamePlanReturnValue: any;

vi.mock('@/hooks/useGamePlan', () => ({
  useGamePlan: () => useGamePlanReturnValue,
}));

import GamePlanListPage from '@/app/(app)/gameplan/page';

describe('GamePlanListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateGamePlan.mockResolvedValue({
      id: 'gp-new',
      name: 'Week 1 vs Roosevelt',
      opponent: 'Roosevelt',
      week: 1,
      season: '2025',
      sections: [],
      teamId: 'team-1',
      createdAt: '2025-09-15T00:00:00.000Z',
      updatedAt: '2025-09-15T00:00:00.000Z',
    });
    useGamePlanReturnValue = {
      gamePlan: null,
      gamePlans: mockGamePlans,
      loading: false,
      error: null,
      createGamePlan: mockCreateGamePlan,
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
    };
  });

  it('renders the game plan list page', () => {
    render(<GamePlanListPage />);
    expect(screen.getByTestId('gameplan-list-page')).toBeInTheDocument();
  });

  it('shows page title', () => {
    render(<GamePlanListPage />);
    expect(screen.getByText('Game Plans')).toBeInTheDocument();
  });

  it('renders game plan cards', () => {
    render(<GamePlanListPage />);
    expect(screen.getByTestId('gameplan-card-gp-1')).toBeInTheDocument();
    expect(screen.getByTestId('gameplan-card-gp-2')).toBeInTheDocument();
  });

  it('displays opponent name on cards', () => {
    render(<GamePlanListPage />);
    expect(screen.getByText('vs Lincoln')).toBeInTheDocument();
    expect(screen.getByText('vs Jefferson')).toBeInTheDocument();
  });

  it('displays week number on cards', () => {
    render(<GamePlanListPage />);
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Week 3')).toBeInTheDocument();
  });

  it('displays play count on cards', () => {
    render(<GamePlanListPage />);
    expect(screen.getByTestId('play-count-gp-1')).toHaveTextContent('2 plays');
    expect(screen.getByTestId('play-count-gp-2')).toHaveTextContent('0 plays');
  });

  it('displays season on cards', () => {
    render(<GamePlanListPage />);
    const seasonElements = screen.getAllByText('2025');
    expect(seasonElements.length).toBeGreaterThan(0);
  });

  it('shows New Game Plan button', () => {
    render(<GamePlanListPage />);
    expect(screen.getByTestId('new-gameplan-btn')).toBeInTheDocument();
  });

  it('opens create modal when New Game Plan is clicked', async () => {
    const user = userEvent.setup();
    render(<GamePlanListPage />);

    await user.click(screen.getByTestId('new-gameplan-btn'));
    // Modal is open with form fields
    expect(screen.getByTestId('opponent-input')).toBeInTheDocument();
    expect(screen.getByTestId('week-input')).toBeInTheDocument();
    expect(screen.getByTestId('season-input')).toBeInTheDocument();
    expect(screen.getByTestId('create-gameplan-btn')).toBeInTheDocument();
  });

  it('validates opponent name is required', async () => {
    const user = userEvent.setup();
    render(<GamePlanListPage />);

    await user.click(screen.getByTestId('new-gameplan-btn'));
    await user.click(screen.getByTestId('create-gameplan-btn'));
    expect(screen.getByTestId('form-error')).toHaveTextContent('Opponent name is required');
  });

  it('creates game plan and navigates to editor', async () => {
    const user = userEvent.setup();
    render(<GamePlanListPage />);

    await user.click(screen.getByTestId('new-gameplan-btn'));
    await user.type(screen.getByTestId('opponent-input'), 'Roosevelt');
    await user.click(screen.getByTestId('create-gameplan-btn'));

    await waitFor(() => {
      expect(mockCreateGamePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          opponent: 'Roosevelt',
        }),
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/gameplan/gp-new');
    });
  });

  it('cancels modal creation', async () => {
    const user = userEvent.setup();
    render(<GamePlanListPage />);

    await user.click(screen.getByTestId('new-gameplan-btn'));
    expect(screen.getByTestId('opponent-input')).toBeInTheDocument();

    await user.click(screen.getByTestId('cancel-create-btn'));
    expect(screen.queryByTestId('opponent-input')).not.toBeInTheDocument();
  });

  it('navigates to game plan editor when card is clicked', async () => {
    const user = userEvent.setup();
    render(<GamePlanListPage />);

    await user.click(screen.getByTestId('gameplan-card-gp-1'));
    expect(mockPush).toHaveBeenCalledWith('/gameplan/gp-1');
  });

  it('sorts by week by default', () => {
    render(<GamePlanListPage />);
    const grid = screen.getByTestId('gameplan-grid');
    const cards = grid.querySelectorAll('[data-testid^="gameplan-card-"]');
    expect(cards[0]).toHaveAttribute('data-testid', 'gameplan-card-gp-1');
    expect(cards[1]).toHaveAttribute('data-testid', 'gameplan-card-gp-2');
  });

  it('allows sorting by date', async () => {
    const user = userEvent.setup();
    render(<GamePlanListPage />);

    const sortSelect = screen.getByTestId('sort-select');
    await user.selectOptions(sortSelect, 'date');
    // After sorting by date (desc), gp-2 (Aug 29) should come first
    const grid = screen.getByTestId('gameplan-grid');
    const cards = grid.querySelectorAll('[data-testid^="gameplan-card-"]');
    expect(cards[0]).toHaveAttribute('data-testid', 'gameplan-card-gp-2');
  });

  it('shows EmptyState when no game plans exist', () => {
    useGamePlanReturnValue = {
      ...useGamePlanReturnValue,
      gamePlans: [],
    };
    render(<GamePlanListPage />);
    expect(screen.getByText('No game plans yet')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useGamePlanReturnValue = {
      ...useGamePlanReturnValue,
      loading: true,
    };
    render(<GamePlanListPage />);
    expect(screen.getByTestId('gameplan-loading')).toBeInTheDocument();
  });

  it('calls loadAllGamePlans on mount', () => {
    render(<GamePlanListPage />);
    expect(mockLoadAllGamePlans).toHaveBeenCalled();
  });
});
