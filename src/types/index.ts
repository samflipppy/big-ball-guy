// ============================================================
// Core Types — Single source of truth for the entire application
// ============================================================

// --- Identifiers ---
export type PlayId = string;
export type FormationId = string;
export type ConceptId = string;
export type GamePlanId = string;
export type UserId = string;
export type TeamId = string;

// --- Field & Positioning ---
export type FieldSide = 'offense' | 'defense';

export interface Position {
  x: number;
  y: number;
}

export interface FieldDimensions {
  width: number;
  height: number;
  yardsVisible: number;
  lineOfScrimmageY: number;
}

// --- Player ---
export type OffensivePosition =
  | 'QB' | 'RB' | 'FB' | 'WR' | 'TE' | 'LT' | 'LG' | 'C' | 'RG' | 'RT' | 'H' | 'X' | 'Y' | 'Z' | 'F' | 'T';

export type DefensivePosition =
  | 'DE' | 'DT' | 'NT' | 'OLB' | 'ILB' | 'MLB' | 'CB' | 'SS' | 'FS' | 'NB' | 'S' | 'LB';

export type PlayerPosition = OffensivePosition | DefensivePosition;

export interface Player {
  id: string;
  position: PlayerPosition;
  label: string;
  location: Position;
  side: FieldSide;
  color?: string;
}

// --- Routes & Assignments ---
export type RouteType =
  | 'streak' | 'slant' | 'out' | 'in' | 'corner' | 'post'
  | 'curl' | 'comeback' | 'hitch' | 'flat' | 'wheel'
  | 'drag' | 'cross' | 'dig' | 'seam' | 'screen'
  | 'swing' | 'angle' | 'option' | 'custom';

export type BlockType =
  | 'drive' | 'reach' | 'down' | 'pull' | 'trap' | 'pass-pro'
  | 'cut' | 'double' | 'zone' | 'man' | 'custom';

export interface RoutePoint {
  x: number;
  y: number;
  type: 'line' | 'curve' | 'break';
}

export interface Route {
  id: string;
  name: string;
  type: RouteType;
  points: RoutePoint[];
  color?: string;
}

export interface BlockingAssignment {
  id: string;
  blockerId: string;
  targetId?: string;
  blockType: BlockType;
  direction?: number; // angle in degrees
}

export interface PlayerAssignment {
  playerId: string;
  route?: Route;
  blocking?: BlockingAssignment;
  motion?: MotionPath;
  runPath?: RunPath;
  label?: string;
}

export interface MotionPath {
  startPosition: Position;
  endPosition: Position;
  timing: 'pre-snap' | 'post-snap';
}

// Run path types for RB/QB runs
export type RunGap = 'A' | 'B' | 'C' | 'D' | 'outside';
export type RunDirection = 'left' | 'right' | 'middle';

export interface RunPath {
  id: string;
  name: string;
  gap?: RunGap;
  direction: RunDirection;
  points: RoutePoint[]; // Path the runner takes
  handoff?: 'direct' | 'toss' | 'pitch' | 'option' | 'counter';
}

// --- Formations ---
export interface Formation {
  id: FormationId;
  name: string;
  side: FieldSide;
  players: Player[];
  personnel: string; // e.g., '11', '12', '21', '22'
  tags: string[];
  isCustom: boolean;
  teamId: TeamId;
  createdAt: string;
  updatedAt: string;
}

// --- Concepts (reusable route combinations) ---
export interface Concept {
  id: ConceptId;
  name: string;
  description?: string;
  routes: {
    position: OffensivePosition;
    route: Route;
  }[];
  tags: string[];
  teamId: TeamId;
  createdAt: string;
  updatedAt: string;
}

// --- Blocking Schemes ---
export interface BlockingScheme {
  id: string;
  name: string;
  type: 'run' | 'pass';
  description: string;
  rules: BlockingRule[];
  tags: string[];
  teamId: TeamId;
  createdAt: string;
  updatedAt: string;
}

export interface BlockingRule {
  position: OffensivePosition;
  rule: string; // e.g., "Block defender head-up or playside gap"
  blockType: BlockType;
  priority: number;
}

// --- Plays ---
export interface Play {
  id: PlayId;
  name: string;
  formationId: FormationId;
  conceptId?: ConceptId;
  blockingSchemeId?: string;
  assignments: PlayerAssignment[];
  defensiveOverlay?: DefensiveOverlay;
  tags: string[];
  notes?: string;
  category?: string;
  personnel: string;
  hash?: 'left' | 'middle' | 'right';
  teamId: TeamId;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Defensive Overlays ---
export interface DefensiveOverlay {
  front: string; // e.g., 'Over', 'Under', '4-3', '3-4'
  coverage: string; // e.g., 'Cover 2', 'Cover 3', 'Man'
  players: Player[];
  blitz?: string;
}

// --- Game Plans ---
export interface GamePlan {
  id: GamePlanId;
  name: string;
  opponent: string;
  week: number;
  season: string;
  sections: GamePlanSection[];
  notes?: string;
  teamId: TeamId;
  createdAt: string;
  updatedAt: string;
}

export interface GamePlanSection {
  id: string;
  situation: string; // e.g., '1st & 10', 'Red Zone', '3rd & Short'
  plays: PlayRef[];
  defense?: DefensiveOverlay;
  notes?: string;
  order: number;
}

export interface PlayRef {
  playId: PlayId;
  order: number;
  notes?: string;
}

// --- Practice Scripts ---
export interface PracticeScript {
  id: string;
  name: string;
  date: string;
  gamePlanId?: GamePlanId;
  periods: PracticePeriod[];
  teamId: TeamId;
  createdAt: string;
  updatedAt: string;
}

export interface PracticePeriod {
  id: string;
  name: string;
  duration: number; // minutes
  type: 'install' | 'team' | 'seven-on-seven' | 'individual' | 'scout' | 'situational';
  plays: PlayRef[];
  notes?: string;
  order: number;
}

// --- Call Sheet & Wristband ---
export interface CallSheet {
  id: string;
  gamePlanId: GamePlanId;
  sections: CallSheetSection[];
  teamId: TeamId;
  createdAt: string;
  updatedAt: string;
}

export interface CallSheetSection {
  name: string;
  plays: PlayRef[];
  color?: string;
}

export interface WristbandConfig {
  callSheetId: string;
  columns: number;
  rows: number;
  fontSize: number;
  showDiagram: boolean;
  showFormation: boolean;
}

// --- Folders & Organization ---
export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  order: number;
  teamId: TeamId;
  createdAt: string;
}

// --- Scouting ---
export interface ScoutingNote {
  id: string;
  gamePlanId: GamePlanId;
  type: 'player' | 'play' | 'formation' | 'tendency';
  targetId: string;
  content: string;
  sentiment: 'weakness' | 'strength' | 'neutral';
  tags: string[];
  rating?: number;
  teamId: TeamId;
  createdAt: string;
  updatedAt: string;
}

export interface TendencyEntry {
  id: string;
  opponentId: string;
  situation: string;
  personnel: string;
  formation?: string;
  playType: string;
  direction?: 'left' | 'right' | 'middle';
  percentage: number;
  sampleSize: number;
  notes?: string;
  teamId: TeamId;
  createdAt: string;
}

// --- Canvas State ---
export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  selectedIds: string[];
  tool: CanvasTool;
  isDrawing: boolean;
}

export type CanvasTool =
  | 'select' | 'draw-route' | 'draw-block' | 'draw-motion'
  | 'draw-zone' | 'text' | 'eraser' | 'pan';

// --- Play Renderer Props ---
export type PlayRenderMode = 'full' | 'thumbnail' | 'card' | 'wristband' | 'print';

export interface PlayRendererProps {
  play: Play;
  formation: Formation;
  mode: PlayRenderMode;
  width: number;
  height: number;
  showDefense?: boolean;
  showLabels?: boolean;
  showRoutes?: boolean;
  showBlocking?: boolean;
  showScoutingAlerts?: boolean;
  interactive?: boolean;
  onPlayerSelect?: (playerId: string) => void;
  onCanvasChange?: (state: CanvasState) => void;
}

// --- Undo/Redo ---
export interface HistoryEntry<T = unknown> {
  id: string;
  timestamp: number;
  action: string;
  before: T;
  after: T;
}

// --- Auth & Team ---
export type UserRole = 'head_coach' | 'coordinator' | 'position_coach' | 'player' | 'viewer';

export interface TeamMember {
  userId: UserId;
  teamId: TeamId;
  role: UserRole;
  displayName: string;
  email: string;
  joinedAt: string;
}

export interface Team {
  id: TeamId;
  name: string;
  school?: string;
  level: 'high_school' | 'college' | 'pro' | 'youth';
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  createdAt: string;
}

// --- App State (Zustand) ---
export interface AppState {
  currentTeamId: TeamId | null;
  currentPlayId: PlayId | null;
  currentMode: AppMode;
  sidebarOpen: boolean;
  darkMode: boolean;
}

export type AppMode = 'sketch' | 'playbook' | 'gameplan' | 'practice' | 'gameday';

// --- Auto-Save ---
export interface SyncStatus {
  lastSaved: string | null;
  lastSynced: string | null;
  pendingChanges: number;
  isOnline: boolean;
  isSyncing: boolean;
}
