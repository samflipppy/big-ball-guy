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
  TeamMember,
  UserRole,
  UserId,
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

  // Team settings
  teamName: string;
  teamLevel: string;
  primaryColor: string;
  secondaryColor: string;
  teamMembers: TeamMember[];
  currentUserId: UserId | null;
  currentUserRole: UserRole;

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

  // Team settings actions
  setTeamName: (name: string) => void;
  setTeamLevel: (level: string) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  removeTeamMember: (userId: string) => void;
  updateTeamMemberRole: (userId: string, role: UserRole) => void;
  setCurrentUserId: (id: UserId | null) => void;
  setCurrentUserRole: (role: UserRole) => void;
  updateTeamSettings: (settings: {
    teamName?: string;
    teamLevel?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }) => void;
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

  teamName: 'My Team',
  teamLevel: 'high_school',
  primaryColor: '#1d4ed8',
  secondaryColor: '#ffffff',
  teamMembers: [],
  currentUserId: null,
  currentUserRole: 'head_coach',

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

  setTeamName: (teamName) => set({ teamName }),
  setTeamLevel: (teamLevel) => set({ teamLevel }),
  setPrimaryColor: (primaryColor) => set({ primaryColor }),
  setSecondaryColor: (secondaryColor) => set({ secondaryColor }),
  setTeamMembers: (teamMembers) => set({ teamMembers }),
  removeTeamMember: (userId) =>
    set((s) => ({
      teamMembers: s.teamMembers.filter((m) => m.userId !== userId),
    })),
  updateTeamMemberRole: (userId, role) =>
    set((s) => ({
      teamMembers: s.teamMembers.map((m) =>
        m.userId === userId ? { ...m, role } : m
      ),
    })),
  setCurrentUserId: (id) => set({ currentUserId: id }),
  setCurrentUserRole: (role) => set({ currentUserRole: role }),
  updateTeamSettings: (settings) =>
    set({
      ...(settings.teamName !== undefined ? { teamName: settings.teamName } : {}),
      ...(settings.teamLevel !== undefined ? { teamLevel: settings.teamLevel } : {}),
      ...(settings.primaryColor !== undefined ? { primaryColor: settings.primaryColor } : {}),
      ...(settings.secondaryColor !== undefined ? { secondaryColor: settings.secondaryColor } : {}),
    }),
}));
