'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/stores/playStore';
import { gameplans as gameplansDb } from '@/lib/db/indexeddb';
import { generateId } from '@/lib/utils';
import type { GamePlan, GamePlanSection, PlayRef, GamePlanId } from '@/types';

export interface UseGamePlanReturn {
  gamePlan: GamePlan | null;
  gamePlans: GamePlan[];
  loading: boolean;
  error: string | null;
  createGamePlan: (data: { name: string; opponent: string; week: number; season: string }) => Promise<GamePlan>;
  updateGamePlan: (gamePlan: GamePlan) => Promise<void>;
  deleteGamePlan: (id: GamePlanId) => Promise<void>;
  loadGamePlan: (id: GamePlanId) => Promise<GamePlan | null>;
  loadAllGamePlans: () => Promise<void>;
  addSection: (situation: string) => void;
  removeSection: (sectionId: string) => void;
  updateSection: (sectionId: string, updates: Partial<GamePlanSection>) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  addPlayToSection: (sectionId: string, playId: string, notes?: string) => void;
  removePlayFromSection: (sectionId: string, playId: string) => void;
  reorderPlaysInSection: (sectionId: string, fromIndex: number, toIndex: number) => void;
}

export function useGamePlan(initialPlanId?: GamePlanId): UseGamePlanReturn {
  const [gamePlan, setGamePlan] = useState<GamePlan | null>(null);
  const [gamePlans, setGamePlans] = useState<GamePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentTeamId = useAppStore((s) => s.currentTeamId);
  const storeGameplans = useAppStore((s) => s.gameplans);
  const setStoreGameplans = useAppStore((s) => s.setGameplans);

  const loadAllGamePlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await gameplansDb.getAll(currentTeamId ?? undefined);
      setGamePlans(all);
      setStoreGameplans(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game plans');
    } finally {
      setLoading(false);
    }
  }, [currentTeamId, setStoreGameplans]);

  const loadGamePlan = useCallback(async (id: GamePlanId): Promise<GamePlan | null> => {
    setLoading(true);
    setError(null);
    try {
      const gp = await gameplansDb.get(id);
      if (gp) {
        setGamePlan(gp);
      } else {
        setError('Game plan not found');
      }
      return gp ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game plan');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createGamePlan = useCallback(async (data: {
    name: string;
    opponent: string;
    week: number;
    season: string;
  }): Promise<GamePlan> => {
    const now = new Date().toISOString();
    const newPlan: GamePlan = {
      id: generateId(),
      name: data.name,
      opponent: data.opponent,
      week: data.week,
      season: data.season,
      sections: [],
      teamId: currentTeamId ?? '',
      createdAt: now,
      updatedAt: now,
    };
    await gameplansDb.put(newPlan);
    setGamePlans((prev) => [...prev, newPlan]);
    setStoreGameplans([...storeGameplans, newPlan]);
    setGamePlan(newPlan);
    return newPlan;
  }, [currentTeamId, storeGameplans, setStoreGameplans]);

  const updateGamePlan = useCallback(async (updated: GamePlan) => {
    const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
    await gameplansDb.put(withTimestamp);
    setGamePlan(withTimestamp);
    setGamePlans((prev) => prev.map((gp) => (gp.id === withTimestamp.id ? withTimestamp : gp)));
  }, []);

  const deleteGamePlan = useCallback(async (id: GamePlanId) => {
    await gameplansDb.delete(id);
    setGamePlans((prev) => prev.filter((gp) => gp.id !== id));
    if (gamePlan?.id === id) {
      setGamePlan(null);
    }
  }, [gamePlan]);

  const addSection = useCallback((situation: string) => {
    setGamePlan((prev) => {
      if (!prev) return prev;
      const newSection: GamePlanSection = {
        id: generateId(),
        situation,
        plays: [],
        notes: '',
        order: prev.sections.length,
      };
      return { ...prev, sections: [...prev.sections, newSection], updatedAt: new Date().toISOString() };
    });
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setGamePlan((prev) => {
      if (!prev) return prev;
      const filtered = prev.sections.filter((s) => s.id !== sectionId);
      const reordered = filtered.map((s, i) => ({ ...s, order: i }));
      return { ...prev, sections: reordered, updatedAt: new Date().toISOString() };
    });
  }, []);

  const updateSection = useCallback((sectionId: string, updates: Partial<GamePlanSection>) => {
    setGamePlan((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s,
      );
      return { ...prev, sections, updatedAt: new Date().toISOString() };
    });
  }, []);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setGamePlan((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);
      const reordered = sections.map((s, i) => ({ ...s, order: i }));
      return { ...prev, sections: reordered, updatedAt: new Date().toISOString() };
    });
  }, []);

  const addPlayToSection = useCallback((sectionId: string, playId: string, notes?: string) => {
    setGamePlan((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        // Don't add duplicates
        if (s.plays.some((p) => p.playId === playId)) return s;
        const newRef: PlayRef = { playId, order: s.plays.length, notes };
        return { ...s, plays: [...s.plays, newRef] };
      });
      return { ...prev, sections, updatedAt: new Date().toISOString() };
    });
  }, []);

  const removePlayFromSection = useCallback((sectionId: string, playId: string) => {
    setGamePlan((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const filtered = s.plays.filter((p) => p.playId !== playId);
        const reordered = filtered.map((p, i) => ({ ...p, order: i }));
        return { ...s, plays: reordered };
      });
      return { ...prev, sections, updatedAt: new Date().toISOString() };
    });
  }, []);

  const reorderPlaysInSection = useCallback((sectionId: string, fromIndex: number, toIndex: number) => {
    setGamePlan((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const plays = [...s.plays];
        const [moved] = plays.splice(fromIndex, 1);
        plays.splice(toIndex, 0, moved);
        const reordered = plays.map((p, i) => ({ ...p, order: i }));
        return { ...s, plays: reordered };
      });
      return { ...prev, sections, updatedAt: new Date().toISOString() };
    });
  }, []);

  // Auto-load if initialPlanId provided
  useEffect(() => {
    if (initialPlanId) {
      loadGamePlan(initialPlanId);
    }
  }, [initialPlanId, loadGamePlan]);

  return {
    gamePlan,
    gamePlans,
    loading,
    error,
    createGamePlan,
    updateGamePlan,
    deleteGamePlan,
    loadGamePlan,
    loadAllGamePlans,
    addSection,
    removeSection,
    updateSection,
    reorderSections,
    addPlayToSection,
    removePlayFromSection,
    reorderPlaysInSection,
  };
}
