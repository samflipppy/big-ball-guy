'use client';

import React, { useMemo, useCallback } from 'react';
import { Layer, Text as KonvaText } from 'react-konva';
import type {
  Play,
  Formation,
  PlayRenderMode,
  PlayRendererProps,
  Player,
  CanvasState,
} from '@/types';
import { FieldCanvas } from './FieldCanvas';
import { PlayerIcon } from './PlayerIcon';
import { RouteLine } from './RouteLine';
import { BlockingLine } from './BlockingLine';
import { DEFAULT_FIELD } from '@/lib/constants';

/**
 * PlayRenderer — The master assembly component.
 *
 * Combines FieldCanvas, PlayerIcons, RouteLines, and BlockingLines
 * into a complete play visualization. Supports multiple render modes:
 *   - full: interactive editor with drag/select
 *   - thumbnail: small static preview
 *   - card: medium preview with play name
 *   - wristband: tiny static for wristband cards
 *   - print: high-quality static for printing
 */
export function PlayRenderer({
  play,
  formation,
  mode,
  width,
  height,
  showDefense = false,
  showLabels = true,
  showRoutes = true,
  showBlocking = true,
  interactive,
  onPlayerSelect,
  onCanvasChange,
}: PlayRendererProps) {
  // Determine interactivity based on mode if not explicitly set
  const isInteractive = interactive ?? mode === 'full';

  const losY = DEFAULT_FIELD.lineOfScrimmageY * (height / DEFAULT_FIELD.height);

  // Build player lookup map
  const playerMap = useMemo(() => {
    const map = new Map<string, Player>();
    for (const p of formation.players) {
      map.set(p.id, p);
    }
    if (play.defensiveOverlay?.players) {
      for (const p of play.defensiveOverlay.players) {
        map.set(p.id, p);
      }
    }
    return map;
  }, [formation.players, play.defensiveOverlay]);

  // Scale factor for rendering at different sizes
  const scaleX = width / DEFAULT_FIELD.width;
  const scaleY = height / DEFAULT_FIELD.height;

  // Scale player locations
  const scaledPlayers = useMemo(() => {
    return formation.players.map((p) => ({
      ...p,
      location: {
        x: p.location.x * scaleX,
        y: p.location.y * scaleY,
      },
    }));
  }, [formation.players, scaleX, scaleY]);

  // Scale defensive players
  const scaledDefense = useMemo(() => {
    if (!showDefense || !play.defensiveOverlay?.players) return [];
    return play.defensiveOverlay.players.map((p) => ({
      ...p,
      location: {
        x: p.location.x * scaleX,
        y: p.location.y * scaleY,
      },
    }));
  }, [showDefense, play.defensiveOverlay, scaleX, scaleY]);

  // Player select handler
  const handlePlayerSelect = useCallback(
    (playerId: string) => {
      if (!isInteractive) return;
      onPlayerSelect?.(playerId);
    },
    [isInteractive, onPlayerSelect],
  );

  // Player drag handler
  const handlePlayerDragEnd = useCallback(
    (playerId: string, x: number, y: number) => {
      if (!isInteractive) return;
      // Notify parent of canvas state change
      onCanvasChange?.({
        zoom: 1,
        panX: 0,
        panY: 0,
        selectedIds: [playerId],
        tool: 'select',
        isDrawing: false,
      });
    },
    [isInteractive, onCanvasChange],
  );

  // Build route lines from assignments
  const routeLines = useMemo(() => {
    if (!showRoutes) return [];
    return play.assignments
      .filter((a) => a.route && a.route.points.length > 0)
      .map((a) => {
        const player = playerMap.get(a.playerId);
        if (!player) return null;
        const scaledStart = {
          x: player.location.x * scaleX,
          y: player.location.y * scaleY,
        };
        const scaledRoute = {
          ...a.route!,
          points: a.route!.points.map((pt) => ({
            ...pt,
            x: pt.x * scaleX,
            y: pt.y * scaleY,
          })),
        };
        return (
          <RouteLine
            key={`route-${a.playerId}`}
            route={scaledRoute}
            startPosition={scaledStart}
            mode={mode}
          />
        );
      })
      .filter(Boolean);
  }, [play.assignments, playerMap, showRoutes, scaleX, scaleY, mode]);

  // Build blocking lines from assignments
  const blockingLines = useMemo(() => {
    if (!showBlocking) return [];
    return play.assignments
      .filter((a) => a.blocking)
      .map((a) => {
        const blocker = playerMap.get(a.playerId);
        if (!blocker) return null;
        const scaledBlockerPos = {
          x: blocker.location.x * scaleX,
          y: blocker.location.y * scaleY,
        };
        let scaledTargetPos;
        if (a.blocking!.targetId) {
          const target = playerMap.get(a.blocking!.targetId);
          if (target) {
            scaledTargetPos = {
              x: target.location.x * scaleX,
              y: target.location.y * scaleY,
            };
          }
        }
        return (
          <BlockingLine
            key={`block-${a.playerId}`}
            assignment={a.blocking!}
            blockerPosition={scaledBlockerPos}
            targetPosition={scaledTargetPos}
            mode={mode}
          />
        );
      })
      .filter(Boolean);
  }, [play.assignments, playerMap, showBlocking, scaleX, scaleY, mode]);

  // Play name label for card mode
  const playNameLabel = useMemo(() => {
    if (mode !== 'card') return null;
    const fontSize = Math.max(10, width * 0.04);
    return (
      <KonvaText
        x={0}
        y={height - fontSize * 2}
        width={width}
        text={play.name}
        fontSize={fontSize}
        fill="#ffffff"
        fontStyle="bold"
        align="center"
        listening={false}
      />
    );
  }, [mode, width, height, play.name]);

  return (
    <FieldCanvas
      width={width}
      height={height}
      lineOfScrimmageY={losY}
      panMode={false}
    >
      <Layer>
        {/* Route lines (drawn below players) */}
        {routeLines}

        {/* Blocking lines */}
        {blockingLines}

        {/* Offensive players */}
        {scaledPlayers.map((player) => (
          <PlayerIcon
            key={player.id}
            player={player}
            interactive={isInteractive}
            onSelect={handlePlayerSelect}
            onDragEnd={handlePlayerDragEnd}
            mode={mode}
          />
        ))}

        {/* Defensive players */}
        {scaledDefense.map((player) => (
          <PlayerIcon
            key={player.id}
            player={player}
            interactive={false}
            mode={mode}
          />
        ))}

        {/* Play name label (card mode only) */}
        {playNameLabel}
      </Layer>
    </FieldCanvas>
  );
}

export default PlayRenderer;
