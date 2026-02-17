/**
 * Custom Options Storage & Management
 *
 * Allows coaches to create and manage custom:
 * - RB run paths
 * - QB actions/dropbacks
 * - Blocking schemes
 */

import type { RoutePoint, BlockType, RunGap, RunDirection } from '@/types';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface CustomRunOption {
  id: string;
  name: string;
  gap: RunGap;
  direction: RunDirection;
  handoff: 'direct' | 'toss' | 'pitch' | 'option' | 'counter';
  points: RoutePoint[];
  description: string;
  icon: string;
  teamId: string;
}

export interface CustomQBAction {
  id: string;
  name: string;
  type: 'dropback' | 'rollout' | 'bootleg' | 'scramble' | 'option' | 'read';
  direction?: 'left' | 'right';
  depth: number; // yards back
  points: RoutePoint[];
  description: string;
  icon: string;
  teamId: string;
}

export interface CustomBlockingScheme {
  id: string;
  name: string;
  type: 'run' | 'pass';
  description: string;
  rules: BlockingRule[];
  icon: string;
  teamId: string;
}

export interface BlockingRule {
  position: string; // 'LT' | 'LG' | 'C' | 'RG' | 'RT' | 'TE'
  blockType: BlockType;
  direction?: number; // angle in degrees
  description: string;
}

// ----------------------------------------------------------------------------
// Storage Keys
// ----------------------------------------------------------------------------

const RUN_STORAGE_KEY = 'custom-run-options';
const QB_STORAGE_KEY = 'custom-qb-actions';
const BLOCKING_STORAGE_KEY = 'custom-blocking-schemes';

// ----------------------------------------------------------------------------
// Custom Run Options
// ----------------------------------------------------------------------------

export function getCustomRunOptions(teamId: string = 'default'): CustomRunOption[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(`${RUN_STORAGE_KEY}-${teamId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCustomRunOptions(options: CustomRunOption[], teamId: string = 'default'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${RUN_STORAGE_KEY}-${teamId}`, JSON.stringify(options));
}

export function addCustomRunOption(option: CustomRunOption, teamId: string = 'default'): void {
  const options = getCustomRunOptions(teamId);
  options.push({ ...option, teamId });
  saveCustomRunOptions(options, teamId);
}

export function updateCustomRunOption(id: string, updates: Partial<CustomRunOption>, teamId: string = 'default'): void {
  const options = getCustomRunOptions(teamId);
  const idx = options.findIndex((o) => o.id === id);
  if (idx >= 0) {
    options[idx] = { ...options[idx], ...updates };
    saveCustomRunOptions(options, teamId);
  }
}

export function deleteCustomRunOption(id: string, teamId: string = 'default'): void {
  const options = getCustomRunOptions(teamId);
  saveCustomRunOptions(options.filter((o) => o.id !== id), teamId);
}

// ----------------------------------------------------------------------------
// Custom QB Actions
// ----------------------------------------------------------------------------

export function getCustomQBActions(teamId: string = 'default'): CustomQBAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(`${QB_STORAGE_KEY}-${teamId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCustomQBActions(actions: CustomQBAction[], teamId: string = 'default'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${QB_STORAGE_KEY}-${teamId}`, JSON.stringify(actions));
}

export function addCustomQBAction(action: CustomQBAction, teamId: string = 'default'): void {
  const actions = getCustomQBActions(teamId);
  actions.push({ ...action, teamId });
  saveCustomQBActions(actions, teamId);
}

export function updateCustomQBAction(id: string, updates: Partial<CustomQBAction>, teamId: string = 'default'): void {
  const actions = getCustomQBActions(teamId);
  const idx = actions.findIndex((a) => a.id === id);
  if (idx >= 0) {
    actions[idx] = { ...actions[idx], ...updates };
    saveCustomQBActions(actions, teamId);
  }
}

export function deleteCustomQBAction(id: string, teamId: string = 'default'): void {
  const actions = getCustomQBActions(teamId);
  saveCustomQBActions(actions.filter((a) => a.id !== id), teamId);
}

// ----------------------------------------------------------------------------
// Custom Blocking Schemes
// ----------------------------------------------------------------------------

export function getCustomBlockingSchemes(teamId: string = 'default'): CustomBlockingScheme[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(`${BLOCKING_STORAGE_KEY}-${teamId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCustomBlockingSchemes(schemes: CustomBlockingScheme[], teamId: string = 'default'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${BLOCKING_STORAGE_KEY}-${teamId}`, JSON.stringify(schemes));
}

export function addCustomBlockingScheme(scheme: CustomBlockingScheme, teamId: string = 'default'): void {
  const schemes = getCustomBlockingSchemes(teamId);
  schemes.push({ ...scheme, teamId });
  saveCustomBlockingSchemes(schemes, teamId);
}

export function updateCustomBlockingScheme(id: string, updates: Partial<CustomBlockingScheme>, teamId: string = 'default'): void {
  const schemes = getCustomBlockingSchemes(teamId);
  const idx = schemes.findIndex((s) => s.id === id);
  if (idx >= 0) {
    schemes[idx] = { ...schemes[idx], ...updates };
    saveCustomBlockingSchemes(schemes, teamId);
  }
}

export function deleteCustomBlockingScheme(id: string, teamId: string = 'default'): void {
  const schemes = getCustomBlockingSchemes(teamId);
  saveCustomBlockingSchemes(schemes.filter((s) => s.id !== id), teamId);
}

// ----------------------------------------------------------------------------
// ID Generation
// ----------------------------------------------------------------------------

export function generateOptionId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ----------------------------------------------------------------------------
// Built-in Templates
// ----------------------------------------------------------------------------

export const BUILT_IN_RUN_TEMPLATES: Omit<CustomRunOption, 'id' | 'teamId'>[] = [
  {
    name: 'Inside Zone Left',
    gap: 'A',
    direction: 'left',
    handoff: 'direct',
    points: [
      { x: -3, y: -2, type: 'curve' },
      { x: -5, y: -8, type: 'line' },
      { x: -6, y: -15, type: 'line' },
    ],
    description: 'Inside zone run to the left A gap',
    icon: 'IZL',
  },
  {
    name: 'Outside Zone Right',
    gap: 'outside',
    direction: 'right',
    handoff: 'direct',
    points: [
      { x: 5, y: -1, type: 'curve' },
      { x: 12, y: -3, type: 'curve' },
      { x: 18, y: -10, type: 'line' },
    ],
    description: 'Outside zone stretch to the right',
    icon: 'OZR',
  },
  {
    name: 'Power Right',
    gap: 'B',
    direction: 'right',
    handoff: 'direct',
    points: [
      { x: 2, y: -1, type: 'curve' },
      { x: 6, y: -5, type: 'line' },
      { x: 8, y: -12, type: 'line' },
    ],
    description: 'Power run to the right B gap',
    icon: 'PWR',
  },
  {
    name: 'Counter Left',
    gap: 'B',
    direction: 'left',
    handoff: 'counter',
    points: [
      { x: 3, y: 1, type: 'curve' },
      { x: -2, y: -2, type: 'curve' },
      { x: -6, y: -10, type: 'line' },
    ],
    description: 'Counter play with misdirection',
    icon: 'CTR',
  },
  {
    name: 'Toss Sweep Left',
    gap: 'outside',
    direction: 'left',
    handoff: 'toss',
    points: [
      { x: -8, y: 2, type: 'curve' },
      { x: -15, y: -2, type: 'curve' },
      { x: -20, y: -10, type: 'line' },
    ],
    description: 'Toss play to the left sideline',
    icon: 'TSL',
  },
];

export const BUILT_IN_QB_TEMPLATES: Omit<CustomQBAction, 'id' | 'teamId'>[] = [
  {
    name: '3-Step Drop',
    type: 'dropback',
    depth: 3,
    points: [
      { x: 0, y: 3, type: 'line' },
    ],
    description: 'Quick 3-step dropback',
    icon: '3',
  },
  {
    name: '5-Step Drop',
    type: 'dropback',
    depth: 5,
    points: [
      { x: 0, y: 5, type: 'line' },
    ],
    description: 'Standard 5-step dropback',
    icon: '5',
  },
  {
    name: '7-Step Drop',
    type: 'dropback',
    depth: 7,
    points: [
      { x: 0, y: 7, type: 'line' },
    ],
    description: 'Deep 7-step dropback',
    icon: '7',
  },
  {
    name: 'Rollout Right',
    type: 'rollout',
    direction: 'right',
    depth: 5,
    points: [
      { x: 3, y: 2, type: 'curve' },
      { x: 10, y: 0, type: 'line' },
    ],
    description: 'Roll out to the right',
    icon: 'ROR',
  },
  {
    name: 'Bootleg Left',
    type: 'bootleg',
    direction: 'left',
    depth: 5,
    points: [
      { x: 2, y: 1, type: 'curve' },
      { x: -5, y: 0, type: 'curve' },
      { x: -12, y: -2, type: 'line' },
    ],
    description: 'Fake right, boot left',
    icon: 'BTL',
  },
  {
    name: 'Read Option',
    type: 'read',
    depth: 2,
    points: [
      { x: -3, y: 1, type: 'curve' },
      { x: -5, y: 0, type: 'line' },
    ],
    description: 'Read the end, keep or give',
    icon: 'RO',
  },
];

export const BUILT_IN_BLOCKING_TEMPLATES: Omit<CustomBlockingScheme, 'id' | 'teamId'>[] = [
  {
    name: 'Inside Zone',
    type: 'run',
    description: 'Zone blocking scheme - covered linemen block head-up, uncovered linemen combo to LB',
    rules: [
      { position: 'LT', blockType: 'zone', direction: -15, description: 'Zone step, combo to Mike' },
      { position: 'LG', blockType: 'zone', direction: -10, description: 'Zone step, combo to Will' },
      { position: 'C', blockType: 'zone', direction: 0, description: 'Zone step, climb to LB' },
      { position: 'RG', blockType: 'zone', direction: 10, description: 'Zone step, combo to Mike' },
      { position: 'RT', blockType: 'zone', direction: 15, description: 'Zone step, climb to LB' },
    ],
    icon: 'IZ',
  },
  {
    name: 'Power',
    type: 'run',
    description: 'Gap scheme - backside guard pulls, frontside down blocks',
    rules: [
      { position: 'LT', blockType: 'down', direction: -30, description: 'Down block on 3-tech' },
      { position: 'LG', blockType: 'pull', direction: 45, description: 'Pull and kick out EMLOS' },
      { position: 'C', blockType: 'drive', direction: 0, description: 'Back block on backside A' },
      { position: 'RG', blockType: 'double', direction: 0, description: 'Double to Mike' },
      { position: 'RT', blockType: 'drive', direction: 15, description: 'Drive block on DE' },
    ],
    icon: 'PWR',
  },
  {
    name: 'Half Slide',
    type: 'pass',
    description: 'Half slide protection - slide away from RB, man protect to RB side',
    rules: [
      { position: 'LT', blockType: 'pass-pro', direction: -15, description: 'Slide protect' },
      { position: 'LG', blockType: 'pass-pro', direction: -10, description: 'Slide protect' },
      { position: 'C', blockType: 'pass-pro', direction: 0, description: 'Slide protect' },
      { position: 'RG', blockType: 'man', direction: 0, description: 'Man on 3-tech' },
      { position: 'RT', blockType: 'man', direction: 15, description: 'Man on DE' },
    ],
    icon: 'HS',
  },
  {
    name: 'Full Slide',
    type: 'pass',
    description: 'Full slide protection - all linemen slide in same direction',
    rules: [
      { position: 'LT', blockType: 'pass-pro', direction: -20, description: 'Slide left' },
      { position: 'LG', blockType: 'pass-pro', direction: -15, description: 'Slide left' },
      { position: 'C', blockType: 'pass-pro', direction: -10, description: 'Slide left' },
      { position: 'RG', blockType: 'pass-pro', direction: -5, description: 'Slide left' },
      { position: 'RT', blockType: 'pass-pro', direction: 0, description: 'Slide left' },
    ],
    icon: 'FS',
  },
];
