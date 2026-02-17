/**
 * Position-Based Assignment Options
 *
 * Defines what assignment options are available for each player position.
 * This creates a position-sensitive context menu system.
 */

import type { PlayerPosition, OffensivePosition, DefensivePosition, BlockType } from '@/types';
import {
  getCustomRunOptions,
  getCustomQBActions,
  type CustomRunOption,
  type CustomQBAction,
} from './custom-options';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type AssignmentCategory = 'route' | 'block' | 'action' | 'motion' | 'run';

export interface AssignmentOption {
  id: string;
  name: string;
  category: AssignmentCategory;
  description: string;
  icon: string;
  /** For routes, links to route-tree route ID */
  routeId?: string;
  /** For blocking, the block type */
  blockType?: BlockType;
  /** For blocking, the direction angle */
  blockDirection?: number;
  /** For QB/RB actions */
  actionType?: string;
  /** For motion */
  motionType?: 'jet' | 'orbit' | 'shift' | 'trade' | 'fly';
  /** For run plays */
  runGap?: 'A' | 'B' | 'C' | 'D' | 'outside';
  runDirection?: 'left' | 'right' | 'middle';
  runHandoff?: 'direct' | 'toss' | 'pitch' | 'option' | 'counter';
}

export interface PositionOptions {
  position: PlayerPosition;
  label: string;
  categories: {
    name: string;
    options: AssignmentOption[];
  }[];
}

// ----------------------------------------------------------------------------
// QB Options
// ----------------------------------------------------------------------------

const QB_OPTIONS: PositionOptions = {
  position: 'QB',
  label: 'Quarterback',
  categories: [
    {
      name: 'Dropback',
      options: [
        { id: 'qb-3step', name: '3-Step Drop', category: 'action', description: 'Quick 3-step dropback', icon: '3', actionType: '3-step' },
        { id: 'qb-5step', name: '5-Step Drop', category: 'action', description: 'Standard 5-step dropback', icon: '5', actionType: '5-step' },
        { id: 'qb-7step', name: '7-Step Drop', category: 'action', description: 'Deep 7-step dropback', icon: '7', actionType: '7-step' },
        { id: 'qb-shotgun', name: 'Shotgun', category: 'action', description: 'Stay in pocket (shotgun)', icon: 'S', actionType: 'shotgun' },
      ],
    },
    {
      name: 'Movement',
      options: [
        { id: 'qb-rollout-r', name: 'Rollout Right', category: 'action', description: 'Roll out to the right', icon: '→', actionType: 'rollout-r' },
        { id: 'qb-rollout-l', name: 'Rollout Left', category: 'action', description: 'Roll out to the left', icon: '←', actionType: 'rollout-l' },
        { id: 'qb-bootleg-r', name: 'Bootleg Right', category: 'action', description: 'Fake handoff, boot right', icon: 'B→', actionType: 'boot-r' },
        { id: 'qb-bootleg-l', name: 'Bootleg Left', category: 'action', description: 'Fake handoff, boot left', icon: '←B', actionType: 'boot-l' },
        { id: 'qb-scramble', name: 'Scramble', category: 'action', description: 'Designed scramble', icon: 'SC', actionType: 'scramble' },
      ],
    },
    {
      name: 'Run',
      options: [
        { id: 'qb-sneak', name: 'QB Sneak', category: 'action', description: 'Sneak up the middle', icon: 'SN', actionType: 'sneak' },
        { id: 'qb-draw', name: 'QB Draw', category: 'action', description: 'Delayed run up middle', icon: 'DR', actionType: 'draw' },
        { id: 'qb-keeper-r', name: 'Keeper Right', category: 'action', description: 'Option keeper right', icon: 'K→', actionType: 'keeper-r' },
        { id: 'qb-keeper-l', name: 'Keeper Left', category: 'action', description: 'Option keeper left', icon: '←K', actionType: 'keeper-l' },
      ],
    },
    {
      name: 'RPO',
      options: [
        { id: 'qb-rpo-bubble', name: 'RPO Bubble', category: 'action', description: 'Run/pass option - bubble', icon: 'RPO', actionType: 'rpo-bubble' },
        { id: 'qb-rpo-slant', name: 'RPO Slant', category: 'action', description: 'Run/pass option - slant', icon: 'RPO', actionType: 'rpo-slant' },
        { id: 'qb-rpo-pop', name: 'RPO Pop', category: 'action', description: 'Run/pass option - pop pass', icon: 'RPO', actionType: 'rpo-pop' },
      ],
    },
  ],
};

// ----------------------------------------------------------------------------
// RB Options
// ----------------------------------------------------------------------------

const RB_OPTIONS: PositionOptions = {
  position: 'RB',
  label: 'Running Back',
  categories: [
    {
      name: 'Run Left',
      options: [
        { id: 'rb-a-gap-l', name: 'A Gap Left', category: 'run', description: 'Run through left A gap', icon: '←A', runGap: 'A', runDirection: 'left', runHandoff: 'direct' },
        { id: 'rb-b-gap-l', name: 'B Gap Left', category: 'run', description: 'Run through left B gap', icon: '←B', runGap: 'B', runDirection: 'left', runHandoff: 'direct' },
        { id: 'rb-c-gap-l', name: 'C Gap Left', category: 'run', description: 'Run off left tackle', icon: '←C', runGap: 'C', runDirection: 'left', runHandoff: 'direct' },
        { id: 'rb-outside-l', name: 'Outside Left', category: 'run', description: 'Sweep left', icon: '←OUT', runGap: 'outside', runDirection: 'left', runHandoff: 'direct' },
        { id: 'rb-toss-l', name: 'Toss Left', category: 'run', description: 'Toss sweep left', icon: '←T', runGap: 'outside', runDirection: 'left', runHandoff: 'toss' },
      ],
    },
    {
      name: 'Run Right',
      options: [
        { id: 'rb-a-gap-r', name: 'A Gap Right', category: 'run', description: 'Run through right A gap', icon: 'A→', runGap: 'A', runDirection: 'right', runHandoff: 'direct' },
        { id: 'rb-b-gap-r', name: 'B Gap Right', category: 'run', description: 'Run through right B gap', icon: 'B→', runGap: 'B', runDirection: 'right', runHandoff: 'direct' },
        { id: 'rb-c-gap-r', name: 'C Gap Right', category: 'run', description: 'Run off right tackle', icon: 'C→', runGap: 'C', runDirection: 'right', runHandoff: 'direct' },
        { id: 'rb-outside-r', name: 'Outside Right', category: 'run', description: 'Sweep right', icon: 'OUT→', runGap: 'outside', runDirection: 'right', runHandoff: 'direct' },
        { id: 'rb-toss-r', name: 'Toss Right', category: 'run', description: 'Toss sweep right', icon: 'T→', runGap: 'outside', runDirection: 'right', runHandoff: 'toss' },
      ],
    },
    {
      name: 'Special Runs',
      options: [
        { id: 'rb-dive', name: 'Dive', category: 'run', description: 'Straight ahead dive', icon: '↑', runGap: 'A', runDirection: 'middle', runHandoff: 'direct' },
        { id: 'rb-counter-l', name: 'Counter Left', category: 'run', description: 'Fake right, cut left', icon: '↰', runGap: 'B', runDirection: 'left', runHandoff: 'counter' },
        { id: 'rb-counter-r', name: 'Counter Right', category: 'run', description: 'Fake left, cut right', icon: '↱', runGap: 'B', runDirection: 'right', runHandoff: 'counter' },
        { id: 'rb-draw', name: 'Draw', category: 'run', description: 'Delayed handoff', icon: 'DRW', runGap: 'A', runDirection: 'middle', runHandoff: 'direct' },
      ],
    },
    {
      name: 'Pass Routes',
      options: [
        { id: 'rb-flat', name: 'Flat', category: 'route', description: 'Release to the flat', icon: '⌐', routeId: 'route-flat' },
        { id: 'rb-swing', name: 'Swing', category: 'route', description: 'Swing route', icon: '∪', routeId: 'route-swing' },
        { id: 'rb-wheel', name: 'Wheel', category: 'route', description: 'Wheel route up sideline', icon: '↺', routeId: 'route-wheel' },
        { id: 'rb-angle', name: 'Angle', category: 'route', description: 'Angle route inside', icon: '/', routeId: 'route-angle' },
        { id: 'rb-screen', name: 'Screen', category: 'route', description: 'Screen pass', icon: 'SCR', routeId: 'route-screen' },
        { id: 'rb-check', name: 'Check/Release', category: 'route', description: 'Block then release', icon: 'C/R', routeId: 'route-flat' },
      ],
    },
    {
      name: 'Blocking',
      options: [
        { id: 'rb-pass-pro', name: 'Pass Pro', category: 'block', description: 'Stay in for protection', icon: '▢', blockType: 'pass-pro' },
        { id: 'rb-chip', name: 'Chip & Release', category: 'block', description: 'Chip DE then release', icon: 'C&R', blockType: 'drive' },
        { id: 'rb-lead', name: 'Lead Block', category: 'block', description: 'Lead block through hole', icon: 'LD', blockType: 'drive' },
        { id: 'rb-iso', name: 'ISO Block', category: 'block', description: 'Isolate linebacker', icon: 'ISO', blockType: 'man' },
      ],
    },
  ],
};

// ----------------------------------------------------------------------------
// FB Options
// ----------------------------------------------------------------------------

const FB_OPTIONS: PositionOptions = {
  position: 'FB',
  label: 'Fullback',
  categories: [
    {
      name: 'Lead Blocking',
      options: [
        { id: 'fb-lead-a', name: 'Lead A Gap', category: 'block', description: 'Lead block A gap', icon: 'A', blockType: 'drive' },
        { id: 'fb-lead-b', name: 'Lead B Gap', category: 'block', description: 'Lead block B gap', icon: 'B', blockType: 'drive' },
        { id: 'fb-kickout', name: 'Kick Out', category: 'block', description: 'Kick out EMOL', icon: 'KO', blockType: 'drive' },
        { id: 'fb-wrap', name: 'Wrap', category: 'block', description: 'Wrap around and lead', icon: 'WR', blockType: 'pull' },
      ],
    },
    {
      name: 'Run Paths',
      options: [
        { id: 'fb-dive', name: 'FB Dive', category: 'action', description: 'Dive up the middle', icon: 'DIV', actionType: 'dive' },
        { id: 'fb-trap', name: 'FB Trap', category: 'action', description: 'Take trap handoff', icon: 'TRP', actionType: 'trap' },
      ],
    },
    {
      name: 'Pass Routes',
      options: [
        { id: 'fb-flat', name: 'Flat', category: 'route', description: 'Release to flat', icon: '⌐', routeId: 'route-flat' },
        { id: 'fb-seam', name: 'Seam', category: 'route', description: 'Up the seam', icon: '↑', routeId: 'route-seam' },
        { id: 'fb-check', name: 'Check/Release', category: 'route', description: 'Block then release', icon: 'C/R', routeId: 'route-flat' },
      ],
    },
  ],
};

// ----------------------------------------------------------------------------
// WR Options
// ----------------------------------------------------------------------------

const WR_OPTIONS: PositionOptions = {
  position: 'WR',
  label: 'Wide Receiver',
  categories: [
    {
      name: 'Quick Routes',
      options: [
        { id: 'wr-hitch', name: 'Hitch', category: 'route', description: '5-yard hitch', icon: '⌐', routeId: 'route-hitch' },
        { id: 'wr-slant', name: 'Slant', category: 'route', description: 'Quick slant inside', icon: '/', routeId: 'route-slant' },
        { id: 'wr-quick-out', name: 'Quick Out', category: 'route', description: '5-yard out', icon: '⌐', routeId: 'route-quick-out' },
        { id: 'wr-bubble', name: 'Bubble', category: 'route', description: 'Bubble screen', icon: '○', routeId: 'route-screen' },
      ],
    },
    {
      name: 'Intermediate Routes',
      options: [
        { id: 'wr-curl', name: 'Curl', category: 'route', description: '12-yard curl', icon: '↺', routeId: 'route-curl' },
        { id: 'wr-out', name: 'Out', category: 'route', description: '12-yard out', icon: '⌐', routeId: 'route-out' },
        { id: 'wr-in', name: 'In/Dig', category: 'route', description: '12-yard in', icon: '⌐', routeId: 'route-in' },
        { id: 'wr-comeback', name: 'Comeback', category: 'route', description: '15-yard comeback', icon: '↩', routeId: 'route-comeback' },
        { id: 'wr-drag', name: 'Drag', category: 'route', description: 'Shallow cross', icon: '—', routeId: 'route-drag' },
        { id: 'wr-cross', name: 'Cross', category: 'route', description: 'Intermediate cross', icon: '✕', routeId: 'route-cross' },
      ],
    },
    {
      name: 'Deep Routes',
      options: [
        { id: 'wr-go', name: 'Go/Streak', category: 'route', description: 'Vertical route', icon: '↑', routeId: 'route-streak' },
        { id: 'wr-post', name: 'Post', category: 'route', description: 'Post route', icon: '↗', routeId: 'route-post' },
        { id: 'wr-corner', name: 'Corner', category: 'route', description: 'Corner route', icon: '↖', routeId: 'route-corner' },
        { id: 'wr-seam', name: 'Seam', category: 'route', description: 'Up the seam', icon: '↑', routeId: 'route-seam' },
      ],
    },
    {
      name: 'Blocking',
      options: [
        { id: 'wr-stalk', name: 'Stalk Block', category: 'block', description: 'Block defender', icon: '▢', blockType: 'man' },
        { id: 'wr-crack', name: 'Crack Block', category: 'block', description: 'Crack back on LB/S', icon: '◁', blockType: 'drive' },
      ],
    },
  ],
};

// ----------------------------------------------------------------------------
// TE Options
// ----------------------------------------------------------------------------

const TE_OPTIONS: PositionOptions = {
  position: 'TE',
  label: 'Tight End',
  categories: [
    {
      name: 'Pass Routes',
      options: [
        { id: 'te-seam', name: 'Seam', category: 'route', description: 'Up the seam', icon: '↑', routeId: 'route-seam' },
        { id: 'te-drag', name: 'Drag', category: 'route', description: 'Shallow cross', icon: '—', routeId: 'route-drag' },
        { id: 'te-out', name: 'Out', category: 'route', description: 'Out route', icon: '⌐', routeId: 'route-out' },
        { id: 'te-corner', name: 'Corner', category: 'route', description: 'Corner route', icon: '↖', routeId: 'route-corner' },
        { id: 'te-flat', name: 'Flat', category: 'route', description: 'Release to flat', icon: '⌐', routeId: 'route-flat' },
        { id: 'te-option', name: 'Option', category: 'route', description: 'Find soft spot', icon: '?', routeId: 'route-option' },
      ],
    },
    {
      name: 'Blocking',
      options: [
        { id: 'te-base', name: 'Base Block', category: 'block', description: 'Base block DE/OLB', icon: '▢', blockType: 'drive' },
        { id: 'te-chip', name: 'Chip & Release', category: 'block', description: 'Chip then release', icon: 'C/R', blockType: 'drive' },
        { id: 'te-down', name: 'Down Block', category: 'block', description: 'Down block inside', icon: '◁', blockType: 'down' },
        { id: 'te-reach', name: 'Reach Block', category: 'block', description: 'Reach block outside', icon: '▷', blockType: 'reach' },
        { id: 'te-pull', name: 'Pull', category: 'block', description: 'Pull and lead', icon: '→', blockType: 'pull' },
      ],
    },
  ],
};

// ----------------------------------------------------------------------------
// OL Options (Generic for all linemen)
// ----------------------------------------------------------------------------

const OL_OPTIONS: PositionOptions = {
  position: 'C',
  label: 'Offensive Line',
  categories: [
    {
      name: 'Run Block Left',
      options: [
        { id: 'ol-drive-l', name: 'Drive Left', category: 'block', description: 'Drive block angled left', icon: '↖', blockType: 'drive', blockDirection: -30 },
        { id: 'ol-reach-l', name: 'Reach Left', category: 'block', description: 'Reach to the left', icon: '←', blockType: 'reach', blockDirection: -60 },
        { id: 'ol-down-l', name: 'Down Left', category: 'block', description: 'Down block inside left', icon: '◁', blockType: 'down', blockDirection: -45 },
        { id: 'ol-pull-l', name: 'Pull Left', category: 'block', description: 'Pull to the left', icon: '↰', blockType: 'pull', blockDirection: -90 },
      ],
    },
    {
      name: 'Run Block Right',
      options: [
        { id: 'ol-drive-r', name: 'Drive Right', category: 'block', description: 'Drive block angled right', icon: '↗', blockType: 'drive', blockDirection: 30 },
        { id: 'ol-reach-r', name: 'Reach Right', category: 'block', description: 'Reach to the right', icon: '→', blockType: 'reach', blockDirection: 60 },
        { id: 'ol-down-r', name: 'Down Right', category: 'block', description: 'Down block inside right', icon: '▷', blockType: 'down', blockDirection: 45 },
        { id: 'ol-pull-r', name: 'Pull Right', category: 'block', description: 'Pull to the right', icon: '↱', blockType: 'pull', blockDirection: 90 },
      ],
    },
    {
      name: 'Straight/Combo',
      options: [
        { id: 'ol-drive', name: 'Drive Straight', category: 'block', description: 'Drive defender back', icon: '▲', blockType: 'drive', blockDirection: 0 },
        { id: 'ol-combo', name: 'Combo Block', category: 'block', description: 'Double-team to LB', icon: '▲▲', blockType: 'double', blockDirection: 0 },
        { id: 'ol-zone-l', name: 'Zone Left', category: 'block', description: 'Zone step left', icon: '←—', blockType: 'zone', blockDirection: -45 },
        { id: 'ol-zone-r', name: 'Zone Right', category: 'block', description: 'Zone step right', icon: '—→', blockType: 'zone', blockDirection: 45 },
        { id: 'ol-trap', name: 'Trap', category: 'block', description: 'Trap block', icon: '↻', blockType: 'trap', blockDirection: 0 },
        { id: 'ol-cut', name: 'Cut Block', category: 'block', description: 'Cut block low', icon: '▽', blockType: 'cut', blockDirection: 0 },
      ],
    },
    {
      name: 'Pass Protection',
      options: [
        { id: 'ol-pass-pro', name: 'Pass Pro', category: 'block', description: 'Standard pass set', icon: '▢', blockType: 'pass-pro', blockDirection: 0 },
        { id: 'ol-slide-l', name: 'Slide Left', category: 'block', description: 'Slide protection left', icon: '←', blockType: 'pass-pro', blockDirection: -30 },
        { id: 'ol-slide-r', name: 'Slide Right', category: 'block', description: 'Slide protection right', icon: '→', blockType: 'pass-pro', blockDirection: 30 },
        { id: 'ol-man', name: 'Man Block', category: 'block', description: 'Man protection', icon: '▢', blockType: 'man', blockDirection: 0 },
        { id: 'ol-hinge', name: 'Hinge', category: 'block', description: 'Hinge backside', icon: '◁', blockType: 'pass-pro', blockDirection: -60 },
      ],
    },
  ],
};

// ----------------------------------------------------------------------------
// Motion Options (applicable to multiple positions)
// ----------------------------------------------------------------------------

export const MOTION_OPTIONS: AssignmentOption[] = [
  { id: 'motion-jet', name: 'Jet Motion', category: 'motion', description: 'Full speed across formation', icon: '→→', motionType: 'jet' },
  { id: 'motion-orbit', name: 'Orbit Motion', category: 'motion', description: 'Loop behind QB', icon: '↺', motionType: 'orbit' },
  { id: 'motion-shift', name: 'Shift', category: 'motion', description: 'Pre-snap shift to new position', icon: '⇒', motionType: 'shift' },
  { id: 'motion-trade', name: 'Trade', category: 'motion', description: 'Switch positions with another player', icon: '⇄', motionType: 'trade' },
  { id: 'motion-fly', name: 'Fly Motion', category: 'motion', description: 'Speed motion timing with snap', icon: '→', motionType: 'fly' },
];

// ----------------------------------------------------------------------------
// DEFENSIVE POSITIONS
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Defensive Line Options (DE, DT, NT)
// ----------------------------------------------------------------------------

const DE_OPTIONS: PositionOptions = {
  position: 'DE' as PlayerPosition,
  label: 'Defensive End',
  categories: [
    {
      name: 'Pass Rush',
      options: [
        { id: 'de-speed', name: 'Speed Rush', category: 'action', description: 'Speed rush around the edge', icon: '→', actionType: 'speed-rush' },
        { id: 'de-power', name: 'Power Rush', category: 'action', description: 'Bull rush through blocker', icon: '▲', actionType: 'power-rush' },
        { id: 'de-spin', name: 'Spin Move', category: 'action', description: 'Spin inside off block', icon: '↺', actionType: 'spin' },
        { id: 'de-rip', name: 'Rip Move', category: 'action', description: 'Rip under blocker arm', icon: '↗', actionType: 'rip' },
        { id: 'de-swim', name: 'Swim Move', category: 'action', description: 'Swim over blocker', icon: '∪', actionType: 'swim' },
        { id: 'de-contain', name: 'Contain', category: 'action', description: 'Set edge, contain QB', icon: '|', actionType: 'contain' },
      ],
    },
    {
      name: 'Run Defense',
      options: [
        { id: 'de-c-gap', name: 'C Gap', category: 'action', description: 'Fill C gap responsibility', icon: 'C', actionType: 'c-gap' },
        { id: 'de-d-gap', name: 'D Gap', category: 'action', description: 'Contain D gap/outside', icon: 'D', actionType: 'd-gap' },
        { id: 'de-crash', name: 'Crash Inside', category: 'action', description: 'Crash hard inside', icon: '◁', actionType: 'crash' },
        { id: 'de-squeeze', name: 'Squeeze', category: 'action', description: 'Squeeze down on TE', icon: '⊏', actionType: 'squeeze' },
        { id: 'de-spill', name: 'Spill', category: 'action', description: 'Force ball outside', icon: '▷', actionType: 'spill' },
      ],
    },
  ],
};

const DT_OPTIONS: PositionOptions = {
  position: 'DT' as PlayerPosition,
  label: 'Defensive Tackle',
  categories: [
    {
      name: 'Pass Rush',
      options: [
        { id: 'dt-bull', name: 'Bull Rush', category: 'action', description: 'Power through center', icon: '▲', actionType: 'bull-rush' },
        { id: 'dt-swim', name: 'Swim Move', category: 'action', description: 'Swim over guard', icon: '∪', actionType: 'swim' },
        { id: 'dt-rip', name: 'Rip Move', category: 'action', description: 'Rip under arm', icon: '↗', actionType: 'rip' },
        { id: 'dt-club', name: 'Club/Arm Over', category: 'action', description: 'Club and go', icon: '⌐', actionType: 'club' },
        { id: 'dt-twist', name: 'Twist/Loop', category: 'action', description: 'Twist with DE', icon: '↻', actionType: 'twist' },
      ],
    },
    {
      name: 'Run Defense',
      options: [
        { id: 'dt-a-gap', name: 'A Gap', category: 'action', description: 'Penetrate A gap', icon: 'A', actionType: 'a-gap' },
        { id: 'dt-b-gap', name: 'B Gap', category: 'action', description: 'Control B gap', icon: 'B', actionType: 'b-gap' },
        { id: 'dt-2gap', name: '2-Gap', category: 'action', description: 'Read and react, two gap', icon: 'AB', actionType: '2-gap' },
        { id: 'dt-anchor', name: 'Anchor', category: 'action', description: 'Hold point of attack', icon: '▢', actionType: 'anchor' },
        { id: 'dt-slant', name: 'Slant', category: 'action', description: 'Slant to gap at snap', icon: '/', actionType: 'slant' },
      ],
    },
  ],
};

const NT_OPTIONS: PositionOptions = {
  position: 'NT' as PlayerPosition,
  label: 'Nose Tackle',
  categories: [
    {
      name: 'Technique',
      options: [
        { id: 'nt-0tech', name: '0-Tech', category: 'action', description: 'Head up on center', icon: '0', actionType: '0-tech' },
        { id: 'nt-1tech', name: '1-Tech', category: 'action', description: 'Shade on center', icon: '1', actionType: '1-tech' },
        { id: 'nt-2gap', name: '2-Gap', category: 'action', description: 'Control both A gaps', icon: 'AA', actionType: '2-gap' },
        { id: 'nt-anchor', name: 'Anchor', category: 'action', description: 'Eat blocks, hold ground', icon: '▢', actionType: 'anchor' },
      ],
    },
    {
      name: 'Run Defense',
      options: [
        { id: 'nt-a-gap-l', name: 'A Gap Left', category: 'action', description: 'Shoot left A gap', icon: '←A', actionType: 'a-gap-l' },
        { id: 'nt-a-gap-r', name: 'A Gap Right', category: 'action', description: 'Shoot right A gap', icon: 'A→', actionType: 'a-gap-r' },
        { id: 'nt-plug', name: 'Plug', category: 'action', description: 'Clog running lanes', icon: '■', actionType: 'plug' },
      ],
    },
  ],
};

// ----------------------------------------------------------------------------
// Linebacker Options (OLB, ILB, MLB, LB)
// ----------------------------------------------------------------------------

const OLB_OPTIONS: PositionOptions = {
  position: 'OLB' as PlayerPosition,
  label: 'Outside Linebacker',
  categories: [
    {
      name: 'Blitz',
      options: [
        { id: 'olb-edge', name: 'Edge Rush', category: 'action', description: 'Rush off the edge', icon: '→', actionType: 'edge-rush' },
        { id: 'olb-contain', name: 'Contain Rush', category: 'action', description: 'Contain and rush', icon: '|→', actionType: 'contain-rush' },
        { id: 'olb-delay', name: 'Delay Blitz', category: 'action', description: 'Delayed rush', icon: '...→', actionType: 'delay-blitz' },
        { id: 'olb-twist', name: 'Twist', category: 'action', description: 'Twist with DL', icon: '↻', actionType: 'twist' },
      ],
    },
    {
      name: 'Coverage',
      options: [
        { id: 'olb-flat', name: 'Flat Zone', category: 'action', description: 'Cover flat zone', icon: '⌐', actionType: 'flat-zone' },
        { id: 'olb-curl-flat', name: 'Curl/Flat', category: 'action', description: 'Curl to flat zone', icon: '↺⌐', actionType: 'curl-flat' },
        { id: 'olb-hook', name: 'Hook Zone', category: 'action', description: 'Cover hook zone', icon: '↺', actionType: 'hook-zone' },
        { id: 'olb-man-rb', name: 'Man RB', category: 'action', description: 'Man coverage on RB', icon: 'M', actionType: 'man-rb' },
        { id: 'olb-man-te', name: 'Man TE', category: 'action', description: 'Man coverage on TE', icon: 'M', actionType: 'man-te' },
      ],
    },
    {
      name: 'Run Fit',
      options: [
        { id: 'olb-force', name: 'Force', category: 'action', description: 'Force player, turn in', icon: '◁', actionType: 'force' },
        { id: 'olb-contain', name: 'Contain', category: 'action', description: 'Set edge, contain', icon: '|', actionType: 'contain' },
        { id: 'olb-c-gap', name: 'C Gap', category: 'action', description: 'Fill C gap', icon: 'C', actionType: 'c-gap' },
        { id: 'olb-scrape', name: 'Scrape', category: 'action', description: 'Scrape over top', icon: '↷', actionType: 'scrape' },
      ],
    },
  ],
};

const ILB_OPTIONS: PositionOptions = {
  position: 'ILB' as PlayerPosition,
  label: 'Inside Linebacker',
  categories: [
    {
      name: 'Blitz',
      options: [
        { id: 'ilb-a-gap', name: 'A Gap Blitz', category: 'action', description: 'Blitz through A gap', icon: 'A→', actionType: 'a-gap-blitz' },
        { id: 'ilb-b-gap', name: 'B Gap Blitz', category: 'action', description: 'Blitz through B gap', icon: 'B→', actionType: 'b-gap-blitz' },
        { id: 'ilb-delay', name: 'Delay Blitz', category: 'action', description: 'Delay then blitz', icon: '...→', actionType: 'delay-blitz' },
        { id: 'ilb-green-dog', name: 'Green Dog', category: 'action', description: 'Rush if RB releases', icon: 'GD', actionType: 'green-dog' },
      ],
    },
    {
      name: 'Coverage',
      options: [
        { id: 'ilb-hook', name: 'Hook Zone', category: 'action', description: 'Cover hook zone', icon: '↺', actionType: 'hook-zone' },
        { id: 'ilb-mid', name: 'Middle Zone', category: 'action', description: 'Cover middle of field', icon: 'M', actionType: 'mid-zone' },
        { id: 'ilb-man-rb', name: 'Man RB', category: 'action', description: 'Man coverage on RB', icon: 'M', actionType: 'man-rb' },
        { id: 'ilb-man-te', name: 'Man TE', category: 'action', description: 'Man coverage on TE', icon: 'M', actionType: 'man-te' },
        { id: 'ilb-spy', name: 'QB Spy', category: 'action', description: 'Spy the quarterback', icon: 'SPY', actionType: 'spy' },
      ],
    },
    {
      name: 'Run Fit',
      options: [
        { id: 'ilb-a-gap', name: 'A Gap Fit', category: 'action', description: 'Fill A gap', icon: 'A', actionType: 'a-gap' },
        { id: 'ilb-b-gap', name: 'B Gap Fit', category: 'action', description: 'Fill B gap', icon: 'B', actionType: 'b-gap' },
        { id: 'ilb-scrape', name: 'Scrape', category: 'action', description: 'Scrape to play side', icon: '↷', actionType: 'scrape' },
        { id: 'ilb-fill', name: 'Downhill Fill', category: 'action', description: 'Attack downhill', icon: '↓', actionType: 'downhill' },
      ],
    },
  ],
};

const MLB_OPTIONS: PositionOptions = {
  position: 'MLB' as PlayerPosition,
  label: 'Middle Linebacker',
  categories: ILB_OPTIONS.categories, // MLB uses same options as ILB
};

// ----------------------------------------------------------------------------
// Secondary Options (CB, SS, FS, NB, S)
// ----------------------------------------------------------------------------

const CB_OPTIONS: PositionOptions = {
  position: 'CB' as PlayerPosition,
  label: 'Cornerback',
  categories: [
    {
      name: 'Man Coverage',
      options: [
        { id: 'cb-press', name: 'Press Man', category: 'action', description: 'Press coverage at LOS', icon: '|M', actionType: 'press-man' },
        { id: 'cb-off', name: 'Off Man', category: 'action', description: 'Off coverage, 5-7 yards', icon: 'M', actionType: 'off-man' },
        { id: 'cb-trail', name: 'Trail', category: 'action', description: 'Trail technique inside', icon: 'TR', actionType: 'trail' },
        { id: 'cb-bail', name: 'Bail', category: 'action', description: 'Show press, bail at snap', icon: '|↑', actionType: 'bail' },
      ],
    },
    {
      name: 'Zone Coverage',
      options: [
        { id: 'cb-flat', name: 'Flat Zone', category: 'action', description: 'Cover flat zone', icon: '⌐', actionType: 'flat-zone' },
        { id: 'cb-third', name: 'Deep Third', category: 'action', description: 'Cover deep third', icon: '⅓', actionType: 'deep-third' },
        { id: 'cb-quarter', name: 'Deep Quarter', category: 'action', description: 'Cover deep quarter', icon: '¼', actionType: 'deep-quarter' },
        { id: 'cb-cloud', name: 'Cloud', category: 'action', description: 'Roll down to flat', icon: '↓⌐', actionType: 'cloud' },
      ],
    },
    {
      name: 'Blitz/Support',
      options: [
        { id: 'cb-blitz', name: 'Corner Blitz', category: 'action', description: 'Blitz off the edge', icon: '→', actionType: 'corner-blitz' },
        { id: 'cb-force', name: 'Force', category: 'action', description: 'Force on run support', icon: '◁', actionType: 'force' },
        { id: 'cb-contain', name: 'Contain', category: 'action', description: 'Contain the edge', icon: '|', actionType: 'contain' },
      ],
    },
  ],
};

const SS_OPTIONS: PositionOptions = {
  position: 'SS' as PlayerPosition,
  label: 'Strong Safety',
  categories: [
    {
      name: 'Coverage',
      options: [
        { id: 'ss-man-te', name: 'Man TE', category: 'action', description: 'Man coverage on TE', icon: 'M', actionType: 'man-te' },
        { id: 'ss-man-rb', name: 'Man RB', category: 'action', description: 'Man coverage on RB', icon: 'M', actionType: 'man-rb' },
        { id: 'ss-hook', name: 'Hook Zone', category: 'action', description: 'Cover hook zone', icon: '↺', actionType: 'hook-zone' },
        { id: 'ss-half', name: 'Deep Half', category: 'action', description: 'Cover deep half', icon: '½', actionType: 'deep-half' },
        { id: 'ss-robber', name: 'Robber', category: 'action', description: 'Robber in middle', icon: 'ROB', actionType: 'robber' },
      ],
    },
    {
      name: 'Run Support',
      options: [
        { id: 'ss-alley', name: 'Alley', category: 'action', description: 'Fill alley vs run', icon: '↓', actionType: 'alley' },
        { id: 'ss-force', name: 'Force', category: 'action', description: 'Primary force player', icon: '◁', actionType: 'force' },
        { id: 'ss-box', name: 'In the Box', category: 'action', description: 'Play in the box', icon: '■', actionType: 'box' },
      ],
    },
    {
      name: 'Blitz',
      options: [
        { id: 'ss-blitz', name: 'Safety Blitz', category: 'action', description: 'Blitz from depth', icon: '→', actionType: 'safety-blitz' },
        { id: 'ss-edge', name: 'Edge Blitz', category: 'action', description: 'Blitz off edge', icon: '↘', actionType: 'edge-blitz' },
        { id: 'ss-delay', name: 'Delay Blitz', category: 'action', description: 'Delayed blitz', icon: '...→', actionType: 'delay-blitz' },
      ],
    },
  ],
};

const FS_OPTIONS: PositionOptions = {
  position: 'FS' as PlayerPosition,
  label: 'Free Safety',
  categories: [
    {
      name: 'Coverage',
      options: [
        { id: 'fs-center', name: 'Centerfield', category: 'action', description: 'Single high safety', icon: '↑', actionType: 'centerfield' },
        { id: 'fs-half', name: 'Deep Half', category: 'action', description: 'Cover deep half', icon: '½', actionType: 'deep-half' },
        { id: 'fs-third', name: 'Deep Third', category: 'action', description: 'Cover deep third', icon: '⅓', actionType: 'deep-third' },
        { id: 'fs-quarter', name: 'Deep Quarter', category: 'action', description: 'Cover deep quarter', icon: '¼', actionType: 'deep-quarter' },
        { id: 'fs-robber', name: 'Robber', category: 'action', description: 'Robber in middle', icon: 'ROB', actionType: 'robber' },
      ],
    },
    {
      name: 'Run Support',
      options: [
        { id: 'fs-alley', name: 'Alley', category: 'action', description: 'Fill alley late', icon: '↓', actionType: 'alley' },
        { id: 'fs-cutback', name: 'Cutback', category: 'action', description: 'Backside cutback', icon: '←', actionType: 'cutback' },
      ],
    },
    {
      name: 'Blitz',
      options: [
        { id: 'fs-blitz', name: 'Safety Blitz', category: 'action', description: 'Blitz from depth', icon: '↓→', actionType: 'safety-blitz' },
        { id: 'fs-delay', name: 'Delay Blitz', category: 'action', description: 'Delayed blitz', icon: '...→', actionType: 'delay-blitz' },
      ],
    },
  ],
};

const NB_OPTIONS: PositionOptions = {
  position: 'NB' as PlayerPosition,
  label: 'Nickelback',
  categories: [
    {
      name: 'Coverage',
      options: [
        { id: 'nb-man-slot', name: 'Man Slot', category: 'action', description: 'Man coverage on slot', icon: 'M', actionType: 'man-slot' },
        { id: 'nb-press', name: 'Press', category: 'action', description: 'Press coverage', icon: '|M', actionType: 'press' },
        { id: 'nb-off', name: 'Off', category: 'action', description: 'Off coverage', icon: 'M', actionType: 'off' },
      ],
    },
    {
      name: 'Zone',
      options: [
        { id: 'nb-hook', name: 'Hook Zone', category: 'action', description: 'Cover hook zone', icon: '↺', actionType: 'hook-zone' },
        { id: 'nb-seam', name: 'Seam Zone', category: 'action', description: 'Cover seam area', icon: '↑', actionType: 'seam-zone' },
        { id: 'nb-flat', name: 'Flat Zone', category: 'action', description: 'Cover flat zone', icon: '⌐', actionType: 'flat-zone' },
      ],
    },
    {
      name: 'Blitz',
      options: [
        { id: 'nb-blitz', name: 'Nickel Blitz', category: 'action', description: 'Blitz inside', icon: '→', actionType: 'nickel-blitz' },
        { id: 'nb-delay', name: 'Delay Blitz', category: 'action', description: 'Delayed blitz', icon: '...→', actionType: 'delay-blitz' },
      ],
    },
  ],
};

// ----------------------------------------------------------------------------
// Position to Options Mapping
// ----------------------------------------------------------------------------

const POSITION_OPTIONS_MAP: Record<string, PositionOptions> = {
  // Offensive positions
  QB: QB_OPTIONS,
  RB: RB_OPTIONS,
  FB: FB_OPTIONS,
  WR: WR_OPTIONS,
  TE: TE_OPTIONS,
  // All OL positions use same options
  LT: { ...OL_OPTIONS, position: 'LT', label: 'Left Tackle' },
  LG: { ...OL_OPTIONS, position: 'LG', label: 'Left Guard' },
  C: { ...OL_OPTIONS, position: 'C', label: 'Center' },
  RG: { ...OL_OPTIONS, position: 'RG', label: 'Right Guard' },
  RT: { ...OL_OPTIONS, position: 'RT', label: 'Right Tackle' },
  // Slot receivers use WR options
  H: { ...WR_OPTIONS, position: 'H' as OffensivePosition, label: 'Slot (H)' },
  X: { ...WR_OPTIONS, position: 'X' as OffensivePosition, label: 'X Receiver' },
  Y: { ...TE_OPTIONS, position: 'Y' as OffensivePosition, label: 'Y (TE)' },
  Z: { ...WR_OPTIONS, position: 'Z' as OffensivePosition, label: 'Z Receiver' },
  F: { ...WR_OPTIONS, position: 'F' as OffensivePosition, label: 'Flanker (F)' },
  T: { ...TE_OPTIONS, position: 'T' as OffensivePosition, label: 'TE (T)' },

  // Defensive positions
  DE: DE_OPTIONS,
  DT: DT_OPTIONS,
  NT: NT_OPTIONS,
  OLB: OLB_OPTIONS,
  ILB: ILB_OPTIONS,
  MLB: MLB_OPTIONS,
  LB: { ...ILB_OPTIONS, position: 'LB' as PlayerPosition, label: 'Linebacker' },
  CB: CB_OPTIONS,
  SS: SS_OPTIONS,
  FS: FS_OPTIONS,
  NB: NB_OPTIONS,
  S: { ...FS_OPTIONS, position: 'S' as PlayerPosition, label: 'Safety' },
};

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

/**
 * Get assignment options for a player position
 */
export function getOptionsForPosition(position: PlayerPosition): PositionOptions | null {
  return POSITION_OPTIONS_MAP[position] || null;
}

/**
 * Check if a position is an offensive lineman
 */
export function isLineman(position: PlayerPosition): boolean {
  return ['LT', 'LG', 'C', 'RG', 'RT'].includes(position);
}

/**
 * Check if a position is a receiver (WR or TE)
 */
export function isReceiver(position: PlayerPosition): boolean {
  return ['WR', 'TE', 'H', 'X', 'Y', 'Z', 'F', 'T'].includes(position);
}

/**
 * Check if a position is a skill player (can run routes)
 */
export function isSkillPosition(position: PlayerPosition): boolean {
  return ['QB', 'RB', 'FB', 'WR', 'TE', 'H', 'X', 'Y', 'Z', 'F', 'T'].includes(position);
}

/**
 * Get the primary category for a position
 */
export function getPrimaryCategory(position: PlayerPosition): AssignmentCategory {
  if (isLineman(position)) return 'block';
  if (isReceiver(position)) return 'route';
  if (position === 'QB') return 'action';
  if (position === 'RB' || position === 'FB') return 'action';
  // All defensive positions use 'action' for their assignments
  if (isDefensivePosition(position)) return 'action';
  return 'block';
}

/**
 * Check if a position is a defensive position
 */
export function isDefensivePosition(position: PlayerPosition): boolean {
  return ['DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB', 'CB', 'SS', 'FS', 'NB', 'S', 'LB'].includes(position);
}

/**
 * Check if a position is a defensive lineman
 */
export function isDefensiveLineman(position: PlayerPosition): boolean {
  return ['DE', 'DT', 'NT'].includes(position);
}

/**
 * Check if a position is a linebacker
 */
export function isLinebacker(position: PlayerPosition): boolean {
  return ['OLB', 'ILB', 'MLB', 'LB'].includes(position);
}

/**
 * Check if a position is a defensive back
 */
export function isDefensiveBack(position: PlayerPosition): boolean {
  return ['CB', 'SS', 'FS', 'NB', 'S'].includes(position);
}

/**
 * Get position options with custom options included
 * Custom RB runs and QB actions are added as additional categories
 */
export function getOptionsForPositionWithCustom(
  position: PlayerPosition,
  teamId: string = 'default'
): PositionOptions | null {
  const baseOptions = POSITION_OPTIONS_MAP[position];
  if (!baseOptions) return null;

  // Clone the base options
  const options: PositionOptions = {
    ...baseOptions,
    categories: baseOptions.categories.map((cat) => ({
      ...cat,
      options: [...cat.options],
    })),
  };

  // Add custom RB runs for RB position
  if (position === 'RB') {
    const customRuns = getCustomRunOptions(teamId);
    if (customRuns.length > 0) {
      const customRunOptions: AssignmentOption[] = customRuns.map((run) => ({
        id: run.id,
        name: run.name,
        category: 'run' as AssignmentCategory,
        description: run.description,
        icon: run.icon,
        runGap: run.gap,
        runDirection: run.direction,
        runHandoff: run.handoff,
      }));
      options.categories.push({
        name: 'Custom Runs',
        options: customRunOptions,
      });
    }
  }

  // Add custom QB actions for QB position
  if (position === 'QB') {
    const customActions = getCustomQBActions(teamId);
    if (customActions.length > 0) {
      const customQBOptions: AssignmentOption[] = customActions.map((action) => ({
        id: action.id,
        name: action.name,
        category: 'action' as AssignmentCategory,
        description: action.description,
        icon: action.icon,
        actionType: action.type,
      }));
      options.categories.push({
        name: 'Custom Actions',
        options: customQBOptions,
      });
    }
  }

  return options;
}
