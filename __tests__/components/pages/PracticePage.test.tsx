import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const {
  mockPlays, mockFormations, mockGamePlans, mockScripts,
  mockPut, mockDelete, mockGetAll,
} = vi.hoisted(() => ({
  mockPlays: [
    { id: 'play-1', name: 'HB Dive', formationId: 'f1', assignments: [], tags: ['run'], personnel: '11', teamId: 'team-1', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  ],
  mockFormations: [
    { id: 'f1', name: 'Singleback', side: 'offense' as const, players: [], personnel: '11', tags: [], isCustom: false, teamId: 'team-1', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  ],
  mockGamePlans: [
    { id: 'gp-1', name: 'Week 1 vs Lincoln', opponent: 'Lincoln', week: 1, season: '2025', sections: [], teamId: 'team-1', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  ],
  mockScripts: [
    {
      id: 'script-1', name: 'Practice - Monday', date: '2025-09-15', gamePlanId: 'gp-1',
      periods: [{ id: 'period-1', name: 'Period 1', duration: 15, type: 'team' as const, plays: [{ playId: 'play-1', order: 0 }], notes: '', order: 0 }],
      teamId: 'team-1', createdAt: '2025-09-15T00:00:00.000Z', updatedAt: '2025-09-15T00:00:00.000Z',
    },
  ],
  mockPut: vi.fn().mockResolvedValue(undefined),
  mockDelete: vi.fn().mockResolvedValue(undefined),
  mockGetAll: vi.fn(),
}));

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/db/indexeddb', () => ({
  practiceScripts: {
    get: vi.fn(), getAll: (...args: any[]) => mockGetAll(...args),
    put: (...args: any[]) => mockPut(...args), delete: (...args: any[]) => mockDelete(...args),
  },
  plays: { get: vi.fn(), getAll: vi.fn().mockResolvedValue([]), put: vi.fn(), delete: vi.fn() },
  formations: { get: vi.fn(), getAll: vi.fn().mockResolvedValue([]), put: vi.fn(), delete: vi.fn() },
  folders: { get: vi.fn(), getAll: vi.fn().mockResolvedValue([]), put: vi.fn(), delete: vi.fn() },
  gameplans: { get: vi.fn(), getAll: vi.fn().mockResolvedValue(mockGamePlans), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/hooks/usePlaybook', () => ({
  usePlaybook: () => ({
    allPlays: mockPlays, plays: mockPlays, formations: mockFormations, isLoading: false,
    savePlay: vi.fn(), getFormation: vi.fn(), folders: [], allTags: [],
    filters: { searchQuery: '', formationId: null, tags: [], personnel: null, folderId: null },
    setFilters: vi.fn(), sort: { field: 'updatedAt', direction: 'desc' }, setSort: vi.fn(),
    viewMode: 'grid', setViewMode: vi.fn(), selectedPlayIds: [], toggleSelectPlay: vi.fn(),
    clearSelection: vi.fn(), selectAll: vi.fn(), createPlay: vi.fn(), deletePlay: vi.fn(),
    duplicatePlay: vi.fn(), bulkDelete: vi.fn(), bulkTag: vi.fn(), bulkMove: vi.fn(),
    createFormation: vi.fn(), createFolder: vi.fn(), deleteFolder: vi.fn(), renameFolder: vi.fn(),
    folderPlayCounts: {},
  }),
}));

vi.mock('@/hooks/useGamePlan', () => ({
  useGamePlan: () => ({
    gamePlan: null, gamePlans: mockGamePlans, loading: false, error: null,
    createGamePlan: vi.fn(), updateGamePlan: vi.fn(), deleteGamePlan: vi.fn(),
    loadGamePlan: vi.fn(), loadAllGamePlans: vi.fn().mockResolvedValue(undefined),
    addSection: vi.fn(), removeSection: vi.fn(), updateSection: vi.fn(), reorderSections: vi.fn(),
    addPlayToSection: vi.fn(), removePlayFromSection: vi.fn(), reorderPlaysInSection: vi.fn(),
  }),
}));

vi.mock('@/stores/playStore', () => ({
  useAppStore: (selector: any) => selector({
    currentTeamId: 'team-1', currentPlayId: null, currentMode: 'practice',
    sidebarOpen: true, darkMode: false, canvasTool: 'select',
    plays: [], formations: [], concepts: [], gameplans: [],
    setPlays: vi.fn(), setFormations: vi.fn(), setGameplans: vi.fn(),
  }),
}));

import PracticePage from '@/app/(app)/practice/page';

describe('PracticePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockResolvedValue(mockScripts);
  });

  it('renders the practice page', async () => {
    render(<PracticePage />);
    await waitFor(() => {
      expect(screen.getByTestId('practice-page')).toBeInTheDocument();
    });
  });

  it('shows page title', async () => {
    render(<PracticePage />);
    await waitFor(() => {
      expect(screen.getByText('Practice Scripts')).toBeInTheDocument();
    });
  });

  it('shows New Practice Script button', async () => {
    render(<PracticePage />);
    await waitFor(() => {
      expect(screen.getByTestId('new-script-btn')).toBeInTheDocument();
    });
  });

  it('shows script name in the list', async () => {
    render(<PracticePage />);
    await waitFor(() => {
      expect(screen.getByText('Practice - Monday')).toBeInTheDocument();
    });
  });

  it('shows EmptyState when no scripts exist', async () => {
    mockGetAll.mockResolvedValue([]);
    render(<PracticePage />);
    await waitFor(() => {
      expect(screen.getByText('No practice scripts')).toBeInTheDocument();
    });
  });
});
