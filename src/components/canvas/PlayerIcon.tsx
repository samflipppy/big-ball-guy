'use client';

import React, { useCallback, useMemo } from 'react';
import { Group, Circle, RegularPolygon, Rect, Text } from 'react-konva';
import type { Player, PlayRenderMode } from '@/types';
import {
  PLAYER_RADIUS,
  PLAYER_FONT_SIZE,
  PLAYER_COLORS,
} from '@/lib/constants';

export interface PlayerIconProps {
  player: Player;
  selected?: boolean;
  interactive?: boolean;
  onSelect?: (playerId: string) => void;
  onDragEnd?: (playerId: string, x: number, y: number) => void;
  mode?: PlayRenderMode;
}

/** Returns scaling factor based on render mode */
function getModeScale(mode: PlayRenderMode): number {
  switch (mode) {
    case 'thumbnail':
      return 0.55;
    case 'wristband':
      return 0.4;
    case 'card':
      return 0.7;
    case 'print':
      return 1.1;
    case 'full':
    default:
      return 1;
  }
}

export function PlayerIcon({
  player,
  selected = false,
  interactive = false,
  onSelect,
  onDragEnd,
  mode = 'full',
}: PlayerIconProps) {
  const scale = getModeScale(mode);
  const radius = PLAYER_RADIUS * scale;
  const fontSize = PLAYER_FONT_SIZE * scale;
  const { x, y } = player.location;

  const isOffense = player.side === 'offense';
  const fillColor = player.color ?? (isOffense ? PLAYER_COLORS.offense : PLAYER_COLORS.defense);
  const strokeColor = selected ? PLAYER_COLORS.selected : 'rgba(255,255,255,0.6)';
  const strokeWidth = selected ? 3 * scale : 1.5 * scale;

  const handleClick = useCallback(() => {
    onSelect?.(player.id);
  }, [onSelect, player.id]);

  const handleDragEnd = useCallback(
    (e: any) => {
      onDragEnd?.(player.id, e.target.x(), e.target.y());
    },
    [onDragEnd, player.id],
  );

  // Choose shape based on side: circle for offense, triangle for defense LB/DB, square for DL
  const shape = useMemo(() => {
    if (isOffense) {
      return (
        <Circle
          radius={radius}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    }

    // Defense: DL positions get squares, secondary/LB get triangles
    const dlPositions = new Set(['DE', 'DT', 'NT']);
    if (dlPositions.has(player.position)) {
      return (
        <Rect
          x={-radius}
          y={-radius}
          width={radius * 2}
          height={radius * 2}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          cornerRadius={2 * scale}
        />
      );
    }

    // LBs and DBs get triangles
    return (
      <RegularPolygon
        sides={3}
        radius={radius * 1.15}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        rotation={180}
      />
    );
  }, [isOffense, player.position, radius, fillColor, strokeColor, strokeWidth, scale]);

  // Position label text
  const label = useMemo(() => {
    // Don't show labels in wristband mode - too small
    if (mode === 'wristband') return null;

    return (
      <Text
        text={player.label}
        fontSize={fontSize}
        fill="#ffffff"
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        width={radius * 2.5}
        height={fontSize * 1.4}
        x={-radius * 1.25}
        y={-fontSize * 0.7}
        listening={false}
      />
    );
  }, [player.label, fontSize, radius, mode]);

  return (
    <Group
      x={x}
      y={y}
      draggable={interactive}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      data-player-id={player.id}
    >
      {/* Selection highlight ring */}
      {selected && (
        <Circle
          radius={radius + 4 * scale}
          fill="transparent"
          stroke={PLAYER_COLORS.highlight}
          strokeWidth={2 * scale}
          dash={[4, 2]}
          listening={false}
        />
      )}
      {shape}
      {label}
    </Group>
  );
}

export default PlayerIcon;
