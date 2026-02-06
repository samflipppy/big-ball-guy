// ============================================================
// Screen Reader Support (#114)
// Utilities for making the playbook builder accessible to screen readers
// ============================================================

import type { Play, Formation, Player, PlayerAssignment } from '@/types';

let liveRegion: HTMLElement | null = null;

/**
 * Gets or creates the aria-live region element in the DOM.
 * The region is visually hidden but accessible to screen readers.
 */
function getOrCreateLiveRegion(priority: 'polite' | 'assertive'): HTMLElement {
  const id = `sr-live-region-${priority}`;

  // Try to find existing region
  let region = document.getElementById(id);
  if (region) return region;

  // Create a new visually-hidden aria-live region
  region = document.createElement('div');
  region.id = id;
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');

  // Visually hidden styles
  Object.assign(region.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  });

  document.body.appendChild(region);
  liveRegion = region;

  return region;
}

/**
 * Announces a message to screen readers via an aria-live region.
 * @param message - The text to announce
 * @param priority - 'polite' waits for current speech to finish; 'assertive' interrupts
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
): void {
  const region = getOrCreateLiveRegion(priority);

  // Clear first to ensure re-announcements of the same text work
  region.textContent = '';

  // Use requestAnimationFrame to ensure the DOM update is processed
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

/**
 * Generates a human-readable description of a play for screen readers.
 */
export function generatePlayDescription(play: Play): string {
  const parts: string[] = [];

  parts.push(`Play: ${play.name}.`);

  if (play.personnel) {
    parts.push(`Personnel: ${play.personnel}.`);
  }

  if (play.category) {
    parts.push(`Category: ${play.category}.`);
  }

  if (play.hash) {
    parts.push(`Hash: ${play.hash}.`);
  }

  const routeAssignments = play.assignments.filter((a) => a.route);
  const blockingAssignments = play.assignments.filter((a) => a.blocking);
  const motionAssignments = play.assignments.filter((a) => a.motion);

  if (routeAssignments.length > 0) {
    const routeDescs = routeAssignments.map((a) => {
      const routeName = a.route!.type === 'custom' ? 'custom route' : `${a.route!.type} route`;
      return `${a.label || a.playerId} runs a ${routeName}`;
    });
    parts.push(`Routes: ${routeDescs.join('; ')}.`);
  }

  if (blockingAssignments.length > 0) {
    parts.push(`${blockingAssignments.length} blocking assignment${blockingAssignments.length > 1 ? 's' : ''}.`);
  }

  if (motionAssignments.length > 0) {
    const motionDescs = motionAssignments.map((a) => {
      return `${a.label || a.playerId} in ${a.motion!.timing} motion`;
    });
    parts.push(`Motion: ${motionDescs.join('; ')}.`);
  }

  if (play.notes) {
    parts.push(`Notes: ${play.notes}.`);
  }

  if (play.tags.length > 0) {
    parts.push(`Tags: ${play.tags.join(', ')}.`);
  }

  return parts.join(' ');
}

/**
 * Generates a human-readable description of a formation for screen readers.
 * Describes player positions relative to the line of scrimmage.
 */
export function generateFormationDescription(formation: Formation): string {
  const parts: string[] = [];

  parts.push(`Formation: ${formation.name}.`);
  parts.push(`Side: ${formation.side}.`);
  parts.push(`Personnel: ${formation.personnel}.`);

  const playersByPosition = groupPlayersByPosition(formation.players);

  for (const [group, players] of Object.entries(playersByPosition)) {
    if (players.length > 0) {
      const labels = players.map((p) => p.label).join(', ');
      parts.push(`${group}: ${labels}.`);
    }
  }

  parts.push(`Total players: ${formation.players.length}.`);

  return parts.join(' ');
}

/**
 * Groups players into descriptive position categories for narration.
 */
function groupPlayersByPosition(players: Player[]): Record<string, Player[]> {
  const groups: Record<string, Player[]> = {
    'Offensive Line': [],
    'Skill Positions': [],
    'Defensive Line': [],
    'Linebackers': [],
    'Secondary': [],
  };

  const olPositions = new Set(['LT', 'LG', 'C', 'RG', 'RT']);
  const skillPositions = new Set(['QB', 'RB', 'FB', 'WR', 'TE', 'H', 'X', 'Y', 'Z', 'F', 'T']);
  const dlPositions = new Set(['DE', 'DT', 'NT']);
  const lbPositions = new Set(['OLB', 'ILB', 'MLB', 'LB']);
  const dbPositions = new Set(['CB', 'SS', 'FS', 'NB', 'S']);

  for (const player of players) {
    if (olPositions.has(player.position)) {
      groups['Offensive Line'].push(player);
    } else if (skillPositions.has(player.position)) {
      groups['Skill Positions'].push(player);
    } else if (dlPositions.has(player.position)) {
      groups['Defensive Line'].push(player);
    } else if (lbPositions.has(player.position)) {
      groups['Linebackers'].push(player);
    } else if (dbPositions.has(player.position)) {
      groups['Secondary'].push(player);
    }
  }

  return groups;
}

/**
 * Generates alt text for a play diagram image.
 */
export function getCanvasAltText(play: Play): string {
  const routeCount = play.assignments.filter((a) => a.route).length;
  const blockCount = play.assignments.filter((a) => a.blocking).length;

  const parts: string[] = [];
  parts.push(`Diagram of play "${play.name}"`);

  if (play.personnel) {
    parts.push(`${play.personnel} personnel`);
  }

  if (routeCount > 0) {
    parts.push(`${routeCount} route${routeCount > 1 ? 's' : ''}`);
  }

  if (blockCount > 0) {
    parts.push(`${blockCount} blocking assignment${blockCount > 1 ? 's' : ''}`);
  }

  if (play.defensiveOverlay) {
    parts.push(`against ${play.defensiveOverlay.front} ${play.defensiveOverlay.coverage}`);
  }

  return parts.join(', ') + '.';
}

/**
 * Returns a CSS class string for visually hidden but screen-reader accessible text.
 * This is a utility that returns the class name to apply.
 */
export function srOnly(text: string): string {
  return text;
}

/**
 * The CSS class string to apply for visually hidden screen-reader-only content.
 */
export const SR_ONLY_CLASS =
  'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

/**
 * The inline styles for visually hidden screen-reader-only content.
 */
export const SR_ONLY_STYLES: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
};
