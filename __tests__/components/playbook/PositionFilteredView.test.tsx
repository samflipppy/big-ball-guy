import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PositionFilteredView from '@/components/playbook/PositionFilteredView';
import type { Play, Formation } from '@/types';

// --- Test data ---

const formation: Formation = {
  id: 'f1',
  name: 'Singleback',
  side: 'offense',
  personnel: '11',
  tags: ['base'],
  isCustom: false,
  teamId: 't1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  players: [
    { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
    { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 330 }, side: 'offense' },
    { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: 248 }, side: 'offense' },
    { id: 'z', position: 'WR', label: 'Z', location: { x: 680, y: 248 }, side: 'offense' },
    { id: 'te', position: 'TE', label: 'Y', location: { x: 520, y: 248 }, side: 'offense' },
    { id: 'lt', position: 'LT', label: 'LT', location: { x: 310, y: 248 }, side: 'offense' },
    { id: 'lg', position: 'LG', label: 'LG', location: { x: 350, y: 248 }, side: 'offense' },
    { id: 'c', position: 'C', label: 'C', location: { x: 400, y: 248 }, side: 'offense' },
    { id: 'rg', position: 'RG', label: 'RG', location: { x: 450, y: 248 }, side: 'offense' },
    { id: 'rt', position: 'RT', label: 'RT', location: { x: 490, y: 248 }, side: 'offense' },
    { id: 'h', position: 'WR', label: 'H', location: { x: 580, y: 248 }, side: 'offense' },
  ],
};

const plays: Play[] = [
  {
    id: 'play-1',
    name: 'Mesh Concept',
    formationId: 'f1',
    assignments: [
      {
        playerId: 'qb',
        label: 'Read 1-2-3',
      },
      {
        playerId: 'x',
        route: {
          id: 'r1',
          name: 'X Drag',
          type: 'drag',
          points: [
            { x: 0, y: 0, type: 'line' },
            { x: 40, y: -5, type: 'line' },
          ],
        },
      },
      {
        playerId: 'z',
        route: {
          id: 'r2',
          name: 'Z Streak',
          type: 'streak',
          points: [
            { x: 0, y: 0, type: 'line' },
            { x: 0, y: -30, type: 'line' },
          ],
        },
      },
      {
        playerId: 'lt',
        blocking: {
          id: 'b1',
          blockerId: 'lt',
          blockType: 'pass-pro',
        },
      },
      {
        playerId: 'rb',
        route: {
          id: 'r3',
          name: 'RB Flat',
          type: 'flat',
          points: [
            { x: 0, y: 0, type: 'line' },
            { x: 20, y: -3, type: 'line' },
          ],
        },
      },
    ],
    tags: ['pass'],
    personnel: '11',
    teamId: 't1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'play-2',
    name: 'Power Right',
    formationId: 'f1',
    assignments: [
      {
        playerId: 'rb',
        route: {
          id: 'r4',
          name: 'HB Power',
          type: 'custom',
          points: [
            { x: 0, y: 0, type: 'line' },
            { x: 15, y: -5, type: 'line' },
          ],
        },
      },
      {
        playerId: 'lt',
        blocking: { id: 'b2', blockerId: 'lt', blockType: 'drive' },
      },
      {
        playerId: 'lg',
        blocking: { id: 'b3', blockerId: 'lg', blockType: 'drive' },
      },
      {
        playerId: 'c',
        blocking: { id: 'b4', blockerId: 'c', blockType: 'zone' },
      },
      {
        playerId: 'rg',
        blocking: { id: 'b5', blockerId: 'rg', blockType: 'pull' },
      },
      {
        playerId: 'rt',
        blocking: { id: 'b6', blockerId: 'rt', blockType: 'drive' },
      },
    ],
    tags: ['run'],
    personnel: '11',
    teamId: 't1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

// ============================================================
// Tests
// ============================================================
describe('PositionFilteredView', () => {
  const onPlayClick = vi.fn();

  beforeEach(() => {
    onPlayClick.mockClear();
  });

  it('renders the main container', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );
    expect(screen.getByTestId('position-filtered-view')).toBeInTheDocument();
  });

  it('renders position tab bar', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );
    expect(screen.getByTestId('position-tab-bar')).toBeInTheDocument();
  });

  it('renders all four position group tabs', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );
    expect(screen.getByTestId('position-tab-QB')).toBeInTheDocument();
    expect(screen.getByTestId('position-tab-RB/FB')).toBeInTheDocument();
    expect(screen.getByTestId('position-tab-WR/TE')).toBeInTheDocument();
    expect(screen.getByTestId('position-tab-OL')).toBeInTheDocument();
  });

  it('defaults to QB tab', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );
    const qbTab = screen.getByTestId('position-tab-QB');
    expect(qbTab.getAttribute('aria-selected')).toBe('true');
  });

  it('uses selectedPosition prop as initial tab', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        selectedPosition="OL"
        onPlayClick={onPlayClick}
      />,
    );
    const olTab = screen.getByTestId('position-tab-OL');
    expect(olTab.getAttribute('aria-selected')).toBe('true');
  });

  it('switches tabs on click', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );

    fireEvent.click(screen.getByTestId('position-tab-WR/TE'));
    const wrTab = screen.getByTestId('position-tab-WR/TE');
    expect(wrTab.getAttribute('aria-selected')).toBe('true');
  });

  it('shows results count', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );
    expect(screen.getByTestId('results-count')).toBeInTheDocument();
  });

  it('shows QB plays when QB tab is active', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );

    // QB has assignment in play-1 only
    expect(screen.getByTestId('filtered-play-card-play-1')).toBeInTheDocument();
  });

  it('shows WR/TE plays when WR/TE tab is active', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );

    fireEvent.click(screen.getByTestId('position-tab-WR/TE'));

    // WR has assignments in play-1 (X Drag, Z Streak)
    expect(screen.getByTestId('filtered-play-card-play-1')).toBeInTheDocument();
  });

  it('shows RB/FB plays when RB/FB tab is active', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );

    fireEvent.click(screen.getByTestId('position-tab-RB/FB'));

    // RB has assignment in both plays
    expect(screen.getByTestId('filtered-play-card-play-1')).toBeInTheDocument();
    expect(screen.getByTestId('filtered-play-card-play-2')).toBeInTheDocument();
  });

  it('shows OL plays when OL tab is active', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );

    fireEvent.click(screen.getByTestId('position-tab-OL'));

    // OL has blocking assignments in both plays
    expect(screen.getByTestId('filtered-play-card-play-2')).toBeInTheDocument();
  });

  it('calls onPlayClick when a play card is clicked', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );

    fireEvent.click(screen.getByTestId('filtered-play-card-play-1'));
    expect(onPlayClick).toHaveBeenCalledWith('play-1');
  });

  it('shows no-results message when no plays match', () => {
    render(
      <PositionFilteredView
        plays={[]}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
  });

  it('renders play name and formation in cards', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );

    expect(screen.getByText('Mesh Concept')).toBeInTheDocument();
  });

  it('renders play thumbnails with SVG', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );

    const thumbnails = screen.getAllByTestId('play-thumbnail');
    expect(thumbnails.length).toBeGreaterThan(0);
  });

  it('highlights players in thumbnail', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );

    // QB tab => qb should be highlighted in play-1
    const highlighted = screen.getAllByTestId('highlighted-player-qb');
    expect(highlighted.length).toBeGreaterThan(0);
  });

  it('shows assignment summary text', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );

    // QB assignment label in play-1
    const summaries = screen.getAllByTestId('assignment-summary');
    expect(summaries.length).toBeGreaterThan(0);
  });

  it('shows filtered play grid', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
      />,
    );

    expect(screen.getByTestId('filtered-play-grid')).toBeInTheDocument();
  });

  it('applies className prop', () => {
    render(
      <PositionFilteredView
        plays={plays}
        formations={[formation]}
        onPlayClick={onPlayClick}
        className="my-custom-class"
      />,
    );
    expect(screen.getByTestId('position-filtered-view').className).toContain(
      'my-custom-class',
    );
  });
});
