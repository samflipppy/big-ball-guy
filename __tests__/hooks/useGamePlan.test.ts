import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGamePlan } from '@/hooks/useGamePlan';
import { useAppStore } from '@/stores/playStore';
import type { GamePlan } from '@/types';

// Mock IndexedDB layer
const mockPut = vi.fn().mockResolvedValue(undefined);
const mockGet = vi.fn();
const mockGetAll = vi.fn().mockResolvedValue([]);
const mockDelete = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db/indexeddb', () => ({
  gameplans: {
    get: (...args: unknown[]) => mockGet(...args),
    getAll: (...args: unknown[]) => mockGetAll(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  let counter = 0;
  return {
    ...actual,
    generateId: () => `test-id-${++counter}`,
  };
});

describe('useGamePlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockResolvedValue([]);
    useAppStore.setState({
      currentTeamId: 'team-1',
      gameplans: [],
    });
  });

  it('should initialize with null game plan and empty list', () => {
    const { result } = renderHook(() => useGamePlan());
    expect(result.current.gamePlan).toBeNull();
    expect(result.current.gamePlans).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load all game plans', async () => {
    const plans: GamePlan[] = [
      {
        id: 'gp-1',
        name: 'Week 1 Plan',
        opponent: 'Eagles',
        week: 1,
        season: '2025',
        sections: [],
        teamId: 'team-1',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    ];
    mockGetAll.mockResolvedValue(plans);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadAllGamePlans();
    });

    expect(result.current.gamePlans).toEqual(plans);
    expect(result.current.loading).toBe(false);
  });

  it('should create a new game plan', async () => {
    const { result } = renderHook(() => useGamePlan());

    let created: GamePlan | undefined;
    await act(async () => {
      created = await result.current.createGamePlan({
        name: 'Week 2 Plan',
        opponent: 'Giants',
        week: 2,
        season: '2025',
      });
    });

    expect(created).toBeDefined();
    expect(created!.name).toBe('Week 2 Plan');
    expect(created!.opponent).toBe('Giants');
    expect(created!.week).toBe(2);
    expect(created!.sections).toEqual([]);
    expect(mockPut).toHaveBeenCalledWith(expect.objectContaining({ name: 'Week 2 Plan' }));
    expect(result.current.gamePlan).toEqual(created);
  });

  it('should load a game plan by id', async () => {
    const plan: GamePlan = {
      id: 'gp-load',
      name: 'Loaded Plan',
      opponent: 'Bears',
      week: 3,
      season: '2025',
      sections: [],
      teamId: 'team-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    mockGet.mockResolvedValue(plan);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadGamePlan('gp-load');
    });

    expect(result.current.gamePlan).toEqual(plan);
  });

  it('should set error when game plan not found', async () => {
    mockGet.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadGamePlan('nonexistent');
    });

    expect(result.current.gamePlan).toBeNull();
    expect(result.current.error).toBe('Game plan not found');
  });

  it('should delete a game plan', async () => {
    const plan: GamePlan = {
      id: 'gp-del',
      name: 'To Delete',
      opponent: 'Lions',
      week: 4,
      season: '2025',
      sections: [],
      teamId: 'team-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    mockGet.mockResolvedValue(plan);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadGamePlan('gp-del');
    });

    expect(result.current.gamePlan).toEqual(plan);

    await act(async () => {
      await result.current.deleteGamePlan('gp-del');
    });

    expect(mockDelete).toHaveBeenCalledWith('gp-del');
    expect(result.current.gamePlan).toBeNull();
  });

  it('should add a section', async () => {
    const plan: GamePlan = {
      id: 'gp-sec',
      name: 'Section Plan',
      opponent: 'Vikings',
      week: 5,
      season: '2025',
      sections: [],
      teamId: 'team-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    mockGet.mockResolvedValue(plan);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadGamePlan('gp-sec');
    });

    act(() => {
      result.current.addSection('1st & 10');
    });

    expect(result.current.gamePlan!.sections).toHaveLength(1);
    expect(result.current.gamePlan!.sections[0].situation).toBe('1st & 10');
    expect(result.current.gamePlan!.sections[0].order).toBe(0);
  });

  it('should remove a section', async () => {
    const plan: GamePlan = {
      id: 'gp-rm-sec',
      name: 'Remove Section Plan',
      opponent: 'Packers',
      week: 6,
      season: '2025',
      sections: [
        { id: 'sec-1', situation: '1st & 10', plays: [], order: 0, notes: '' },
        { id: 'sec-2', situation: 'Red Zone', plays: [], order: 1, notes: '' },
      ],
      teamId: 'team-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    mockGet.mockResolvedValue(plan);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadGamePlan('gp-rm-sec');
    });

    act(() => {
      result.current.removeSection('sec-1');
    });

    expect(result.current.gamePlan!.sections).toHaveLength(1);
    expect(result.current.gamePlan!.sections[0].situation).toBe('Red Zone');
    expect(result.current.gamePlan!.sections[0].order).toBe(0);
  });

  it('should update a section', async () => {
    const plan: GamePlan = {
      id: 'gp-upd-sec',
      name: 'Update Section Plan',
      opponent: 'Cowboys',
      week: 7,
      season: '2025',
      sections: [
        { id: 'sec-1', situation: '1st & 10', plays: [], order: 0, notes: '' },
      ],
      teamId: 'team-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    mockGet.mockResolvedValue(plan);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadGamePlan('gp-upd-sec');
    });

    act(() => {
      result.current.updateSection('sec-1', { situation: '3rd & Long', notes: 'Updated notes' });
    });

    expect(result.current.gamePlan!.sections[0].situation).toBe('3rd & Long');
    expect(result.current.gamePlan!.sections[0].notes).toBe('Updated notes');
  });

  it('should reorder sections', async () => {
    const plan: GamePlan = {
      id: 'gp-reorder',
      name: 'Reorder Plan',
      opponent: 'Ravens',
      week: 8,
      season: '2025',
      sections: [
        { id: 'sec-a', situation: 'A', plays: [], order: 0 },
        { id: 'sec-b', situation: 'B', plays: [], order: 1 },
        { id: 'sec-c', situation: 'C', plays: [], order: 2 },
      ],
      teamId: 'team-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    mockGet.mockResolvedValue(plan);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadGamePlan('gp-reorder');
    });

    act(() => {
      result.current.reorderSections(0, 2);
    });

    expect(result.current.gamePlan!.sections[0].situation).toBe('B');
    expect(result.current.gamePlan!.sections[1].situation).toBe('C');
    expect(result.current.gamePlan!.sections[2].situation).toBe('A');
  });

  it('should add a play to a section', async () => {
    const plan: GamePlan = {
      id: 'gp-add-play',
      name: 'Add Play Plan',
      opponent: 'Broncos',
      week: 9,
      season: '2025',
      sections: [
        { id: 'sec-1', situation: '1st & 10', plays: [], order: 0 },
      ],
      teamId: 'team-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    mockGet.mockResolvedValue(plan);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadGamePlan('gp-add-play');
    });

    act(() => {
      result.current.addPlayToSection('sec-1', 'play-1', 'Great against man coverage');
    });

    const section = result.current.gamePlan!.sections[0];
    expect(section.plays).toHaveLength(1);
    expect(section.plays[0].playId).toBe('play-1');
    expect(section.plays[0].notes).toBe('Great against man coverage');
  });

  it('should not add duplicate plays to a section', async () => {
    const plan: GamePlan = {
      id: 'gp-dup',
      name: 'Dup Plan',
      opponent: 'Chiefs',
      week: 10,
      season: '2025',
      sections: [
        { id: 'sec-1', situation: '1st & 10', plays: [{ playId: 'play-1', order: 0 }], order: 0 },
      ],
      teamId: 'team-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    mockGet.mockResolvedValue(plan);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadGamePlan('gp-dup');
    });

    act(() => {
      result.current.addPlayToSection('sec-1', 'play-1');
    });

    expect(result.current.gamePlan!.sections[0].plays).toHaveLength(1);
  });

  it('should remove a play from a section', async () => {
    const plan: GamePlan = {
      id: 'gp-rm-play',
      name: 'Remove Play Plan',
      opponent: 'Chargers',
      week: 11,
      season: '2025',
      sections: [
        {
          id: 'sec-1',
          situation: '1st & 10',
          plays: [
            { playId: 'play-1', order: 0 },
            { playId: 'play-2', order: 1 },
          ],
          order: 0,
        },
      ],
      teamId: 'team-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    mockGet.mockResolvedValue(plan);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadGamePlan('gp-rm-play');
    });

    act(() => {
      result.current.removePlayFromSection('sec-1', 'play-1');
    });

    const section = result.current.gamePlan!.sections[0];
    expect(section.plays).toHaveLength(1);
    expect(section.plays[0].playId).toBe('play-2');
    expect(section.plays[0].order).toBe(0);
  });

  it('should reorder plays within a section', async () => {
    const plan: GamePlan = {
      id: 'gp-reorder-plays',
      name: 'Reorder Plays Plan',
      opponent: 'Raiders',
      week: 12,
      season: '2025',
      sections: [
        {
          id: 'sec-1',
          situation: '1st & 10',
          plays: [
            { playId: 'play-a', order: 0 },
            { playId: 'play-b', order: 1 },
            { playId: 'play-c', order: 2 },
          ],
          order: 0,
        },
      ],
      teamId: 'team-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };
    mockGet.mockResolvedValue(plan);

    const { result } = renderHook(() => useGamePlan());

    await act(async () => {
      await result.current.loadGamePlan('gp-reorder-plays');
    });

    act(() => {
      result.current.reorderPlaysInSection('sec-1', 0, 2);
    });

    const plays = result.current.gamePlan!.sections[0].plays;
    expect(plays[0].playId).toBe('play-b');
    expect(plays[1].playId).toBe('play-c');
    expect(plays[2].playId).toBe('play-a');
    expect(plays[0].order).toBe(0);
    expect(plays[1].order).toBe(1);
    expect(plays[2].order).toBe(2);
  });
});
