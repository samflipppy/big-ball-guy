import { create } from 'zustand';
import type {
  Play,
  Formation,
  Concept,
  GamePlan,
  AppMode,
  CanvasTool,
  HistoryEntry,
  TeamId,
  PlayId,
} from '@/types';

// ---- History (undo/redo) ----
interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  pushHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  undo: () => HistoryEntry | undefined;
  redo: () => HistoryEntry | undefined;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  pushHistory: (entry) => {
    const full: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((state) => ({
      past: [...state.past, full],
      future: [], // clear redo stack on new action
    }));
  },
  undo: () => {
    const { past } = get();
    if (past.length === 0) return undefined;
    const entry = past[past.length - 1];
    set((state) => ({
      past: state.past.slice(0, -1),
      future: [entry, ...state.future],
    }));
    return entry;
  },
  redo: () => {
    const { future } = get();
    if (future.length === 0) return undefined;
    const entry = future[0];
    set((state) => ({
      past: [...state.past, entry],
      future: state.future.slice(1),
    }));
    return entry;
  },
  clearHistory: () => set({ past: [], future: [] }),
}));

// ---- App-level state ----
interface AppStore {
  // Current context
  currentTeamId: TeamId | null;
  currentPlayId: PlayId | null;
  currentMode: AppMode;
  sidebarOpen: boolean;
  darkMode: boolean;
  canvasTool: CanvasTool;

  // Grid settings
  gridEnabled: boolean;
  gridSize: number;
  snapToGridEnabled: boolean;
  showYardNumbers: boolean;
  showHashMarks: boolean;
  showPlayerLabels: boolean;

  // In-memory caches (loaded from IndexedDB)
  plays: Play[];
  formations: Formation[];
  concepts: Concept[];
  gameplans: GamePlan[];

  // Actions
  setCurrentTeamId: (id: TeamId | null) => void;
  setCurrentPlayId: (id: PlayId | null) => void;
  setCurrentMode: (mode: AppMode) => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setCanvasTool: (tool: CanvasTool) => void;

  // Grid actions
  setGridEnabled: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
  setSnapToGridEnabled: (enabled: boolean) => void;
  setShowYardNumbers: (show: boolean) => void;
  setShowHashMarks: (show: boolean) => void;
  setShowPlayerLabels: (show: boolean) => void;

  // Data actions
  setPlays: (plays: Play[]) => void;
  addPlay: (play: Play) => void;
  updatePlay: (play: Play) => void;
  removePlay: (id: PlayId) => void;
  setFormations: (formations: Formation[]) => void;
  addFormation: (formation: Formation) => void;
  setConcepts: (concepts: Concept[]) => void;
  setGameplans: (gameplans: GamePlan[]) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentTeamId: null,
  currentPlayId: null,
  currentMode: 'playbook',
  sidebarOpen: true,
  darkMode: false,
  canvasTool: 'select',

  gridEnabled: false,
  gridSize: 10,
  snapToGridEnabled: false,
  showYardNumbers: true,
  showHashMarks: true,
  showPlayerLabels: true,

  plays: [],
  formations: [],
  concepts: [],
  gameplans: [],

  setCurrentTeamId: (id) => set({ currentTeamId: id }),
  setCurrentPlayId: (id) => set({ currentPlayId: id }),
  setCurrentMode: (mode) => set({ currentMode: mode }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  setCanvasTool: (tool) => set({ canvasTool: tool }),

  setGridEnabled: (enabled) => set({ gridEnabled: enabled }),
  setGridSize: (size) => set({ gridSize: size }),
  setSnapToGridEnabled: (enabled) => set({ snapToGridEnabled: enabled }),
  setShowYardNumbers: (show) => set({ showYardNumbers: show }),
  setShowHashMarks: (show) => set({ showHashMarks: show }),
  setShowPlayerLabels: (show) => set({ showPlayerLabels: show }),

  setPlays: (plays) => set({ plays }),
  addPlay: (play) => set((s) => ({ plays: [...s.plays, play] })),
  updatePlay: (play) =>
    set((s) => ({
      plays: s.plays.map((p) => (p.id === play.id ? play : p)),
    })),
  removePlay: (id) =>
    set((s) => ({
      plays: s.plays.filter((p) => p.id !== id),
    })),
  setFormations: (formations) => set({ formations }),
  addFormation: (formation) =>
    set((s) => ({ formations: [...s.formations, formation] })),
  setConcepts: (concepts) => set({ concepts }),
  setGameplans: (gameplans) => set({ gameplans }),
}));
