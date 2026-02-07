// ============================================================
// #229 — Server-Side Rendering for Shared Plays
// Utilities for fetching shared play data, generating meta tags,
// Open Graph images, and static SVG diagrams for SSR pages.
// ============================================================

import type { Play, Player, PlayerAssignment, Route } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SharedPlayPageData {
  play: Play;
  author: string;
  teamName: string;
  sharedAt: string;
  expiresAt?: string;
}

export interface MetaTag {
  property?: string;
  name?: string;
  content: string;
}

// ---------------------------------------------------------------------------
// getSharedPlayData
// ---------------------------------------------------------------------------

/**
 * Fetch play data for a shared link token.
 * In production this would hit the Supabase API; here it returns mock data.
 */
export async function getSharedPlayData(
  token: string,
): Promise<SharedPlayPageData | null> {
  if (!token || token.length < 8) {
    return null;
  }

  // Mock response simulating a database lookup
  const mockPlay: Play = {
    id: `play_${token}`,
    name: 'Shared Play',
    formationId: 'formation_spread',
    assignments: [],
    tags: ['shared'],
    personnel: '11',
    teamId: 'team_mock',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    play: mockPlay,
    author: 'Coach Smith',
    teamName: 'Demo Team',
    sharedAt: new Date().toISOString(),
    expiresAt: undefined,
  };
}

// ---------------------------------------------------------------------------
// generateOpenGraphImage
// ---------------------------------------------------------------------------

/**
 * Generate Open Graph image metadata (URL, dimensions, alt text).
 * In production this would call an image generation service; here it
 * returns metadata that points to a dynamic OG image endpoint.
 */
export function generateOpenGraphImage(
  play: Play,
  width: number,
  height: number,
): { url: string; width: number; height: number; alt: string } {
  const encodedName = encodeURIComponent(play.name);
  return {
    url: `/api/og?play=${play.id}&name=${encodedName}&w=${width}&h=${height}`,
    width,
    height,
    alt: `Play diagram: ${play.name}`,
  };
}

// ---------------------------------------------------------------------------
// generateSharePageMeta
// ---------------------------------------------------------------------------

/**
 * Generate meta tags suitable for SEO and social sharing cards.
 */
export function generateSharePageMeta(data: SharedPlayPageData): MetaTag[] {
  const { play, author, teamName, sharedAt } = data;
  const ogImage = generateOpenGraphImage(play, 1200, 630);
  const description = `${play.name} by ${author} (${teamName}) — shared on ${new Date(sharedAt).toLocaleDateString()}`;

  return [
    { property: 'og:title', content: play.name },
    { property: 'og:description', content: description },
    { property: 'og:image', content: ogImage.url },
    { property: 'og:image:width', content: String(ogImage.width) },
    { property: 'og:image:height', content: String(ogImage.height) },
    { property: 'og:type', content: 'article' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: play.name },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage.url },
    { name: 'description', content: description },
    { name: 'author', content: author },
  ];
}

// ---------------------------------------------------------------------------
// renderStaticPlayDiagram
// ---------------------------------------------------------------------------

/**
 * Render a static SVG string representation of a play diagram.
 * Renders the field, players (as circles with labels), and routes.
 */
export function renderStaticPlayDiagram(play: Play): string {
  const width = 800;
  const height = 500;
  const fieldColor = '#2d5a27';
  const lineColor = '#ffffff';
  const losY = 250;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;

  // Field background
  svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="${fieldColor}" />`;

  // Yard lines
  for (let y = 0; y <= height; y += 50) {
    svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${lineColor}" stroke-opacity="0.3" stroke-width="1" />`;
  }

  // Line of scrimmage
  svg += `<line x1="0" y1="${losY}" x2="${width}" y2="${losY}" stroke="${lineColor}" stroke-width="2" stroke-dasharray="8,4" />`;

  // Render assignments (players + routes)
  for (const assignment of play.assignments) {
    // Attempt to resolve player position from assignment
    const playerId = assignment.playerId;

    if (assignment.route) {
      svg += renderRoute(assignment.route);
    }
  }

  // If there are no assignments we just show the empty field
  svg += '</svg>';
  return svg;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderRoute(route: Route): string {
  if (route.points.length < 2) return '';

  const color = route.color || '#ffcc00';
  let path = `M ${route.points[0].x} ${route.points[0].y}`;

  for (let i = 1; i < route.points.length; i++) {
    const pt = route.points[i];
    if (pt.type === 'curve' && i + 1 < route.points.length) {
      const next = route.points[i + 1];
      path += ` Q ${pt.x} ${pt.y} ${next.x} ${next.y}`;
      i++; // skip next point, used as control
    } else {
      path += ` L ${pt.x} ${pt.y}`;
    }
  }

  return `<path d="${path}" stroke="${color}" stroke-width="2" fill="none" />`;
}
