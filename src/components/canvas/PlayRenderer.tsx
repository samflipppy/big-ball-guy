'use client';

import React, { useMemo, useCallback, useState, useRef } from 'react';
import { Layer, Text as KonvaText, Line } from 'react-konva';
import type {
  Play,
  Formation,
  PlayRenderMode,
  PlayRendererProps,
  Player,
  CanvasState,
  PlayerAssignment,
  Route,
  RoutePoint,
  MotionPath,
  BlockingAssignment,
} from '@/types';
import { FieldCanvas } from './FieldCanvas';
import { PlayerIcon } from './PlayerIcon';
import { RouteLine } from './RouteLine';
import { BlockingLine } from './BlockingLine';
import { MotionLine } from './MotionLine';
import { DEFAULT_FIELD } from '@/lib/constants';
import { useAppStore } from '@/stores/playStore';
import { generateId } from '@/lib/utils';

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
export interface ExtendedPlayRendererProps extends PlayRendererProps {
  onAssignmentsChange?: (assignments: PlayerAssignment[]) => void;
}

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
  onAssignmentsChange,
}: ExtendedPlayRendererProps) {
  // Get current tool from global store
  const canvasTool = useAppStore((s) => s.canvasTool);

  // Determine interactivity based on mode if not explicitly set
  const isInteractive = interactive ?? mode === 'full';

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPlayerId, setDrawingPlayerId] = useState<string | null>(null);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const stageRef = useRef<any>(null);

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

  // Player drag handler (only when select tool is active)
  const handlePlayerDragEnd = useCallback(
    (playerId: string, x: number, y: number) => {
      if (!isInteractive || canvasTool !== 'select') return;
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
    [isInteractive, onCanvasChange, canvasTool],
  );

  // Find the closest player to a point
  const findClosestPlayer = useCallback(
    (x: number, y: number, maxDistance = 40): Player | null => {
      let closest: Player | null = null;
      let closestDist = maxDistance;

      for (const player of scaledPlayers) {
        const dist = Math.hypot(player.location.x - x, player.location.y - y);
        if (dist < closestDist) {
          closestDist = dist;
          closest = player;
        }
      }
      return closest;
    },
    [scaledPlayers],
  );

  // Handle starting a route draw from a player
  const handleDrawStart = useCallback(
    (playerId: string, startX: number, startY: number) => {
      if (!isInteractive) return;
      if (canvasTool === 'draw-route' || canvasTool === 'draw-block' || canvasTool === 'draw-motion') {
        setIsDrawing(true);
        setDrawingPlayerId(playerId);
        setCurrentDrawPoints([{ x: startX, y: startY }]);
      }
    },
    [isInteractive, canvasTool],
  );

  // Handle mouse move while drawing
  const handleDrawMove = useCallback(
    (x: number, y: number) => {
      if (!isDrawing || !drawingPlayerId) return;
      setCurrentDrawPoints((prev) => [...prev, { x, y }]);
    },
    [isDrawing, drawingPlayerId],
  );

  // Handle completing a drawing (route, motion, or blocking)
  const handleDrawEnd = useCallback(() => {
    if (!isDrawing || !drawingPlayerId || currentDrawPoints.length < 2) {
      setIsDrawing(false);
      setDrawingPlayerId(null);
      setCurrentDrawPoints([]);
      return;
    }

    const startPt = currentDrawPoints[0];
    const endPt = currentDrawPoints[currentDrawPoints.length - 1];

    // Get existing assignment or create new one
    const existingAssignmentIndex = play.assignments.findIndex(
      (a) => a.playerId === drawingPlayerId
    );
    const existingAssignment = existingAssignmentIndex >= 0
      ? play.assignments[existingAssignmentIndex]
      : { playerId: drawingPlayerId };

    let updatedAssignment: PlayerAssignment = { ...existingAssignment };

    if (canvasTool === 'draw-route') {
      // Simplify points for route (take every Nth point to reduce complexity)
      const simplifiedPoints: RoutePoint[] = [];
      const step = Math.max(1, Math.floor(currentDrawPoints.length / 20));
      for (let i = 0; i < currentDrawPoints.length; i += step) {
        const pt = currentDrawPoints[i];
        simplifiedPoints.push({
          x: pt.x / scaleX,
          y: pt.y / scaleY,
          type: i === 0 ? 'line' : 'curve',
        });
      }
      // Always include the last point
      if (simplifiedPoints.length === 0 ||
          simplifiedPoints[simplifiedPoints.length - 1].x !== endPt.x / scaleX ||
          simplifiedPoints[simplifiedPoints.length - 1].y !== endPt.y / scaleY) {
        simplifiedPoints.push({
          x: endPt.x / scaleX,
          y: endPt.y / scaleY,
          type: 'line',
        });
      }

      const newRoute: Route = {
        id: generateId(),
        name: 'Custom Route',
        type: 'custom',
        points: simplifiedPoints,
      };
      updatedAssignment.route = newRoute;

    } else if (canvasTool === 'draw-motion') {
      // Motion is simple: start position to end position
      const newMotion: MotionPath = {
        startPosition: { x: startPt.x / scaleX, y: startPt.y / scaleY },
        endPosition: { x: endPt.x / scaleX, y: endPt.y / scaleY },
        timing: 'pre-snap',
      };
      updatedAssignment.motion = newMotion;

    } else if (canvasTool === 'draw-block') {
      // Blocking: from blocker to target position/player
      // Check if end point is near another player (target)
      const targetPlayer = findClosestPlayer(endPt.x, endPt.y, 50);

      const newBlocking: BlockingAssignment = {
        id: generateId(),
        blockerId: drawingPlayerId,
        targetId: targetPlayer?.id,
        blockType: 'man',
        direction: Math.atan2(endPt.y - startPt.y, endPt.x - startPt.x) * (180 / Math.PI),
      };
      updatedAssignment.blocking = newBlocking;
    }

    // Update assignments array
    let newAssignments: PlayerAssignment[];
    if (existingAssignmentIndex >= 0) {
      newAssignments = [...play.assignments];
      newAssignments[existingAssignmentIndex] = updatedAssignment;
    } else {
      newAssignments = [...play.assignments, updatedAssignment];
    }

    onAssignmentsChange?.(newAssignments);

    // Reset drawing state
    setIsDrawing(false);
    setDrawingPlayerId(null);
    setCurrentDrawPoints([]);
  }, [isDrawing, drawingPlayerId, currentDrawPoints, scaleX, scaleY, play.assignments, canvasTool, onAssignmentsChange, findClosestPlayer]);

  // Handle eraser - remove assignments from a player
  const handleErase = useCallback(
    (playerId: string) => {
      const existingIndex = play.assignments.findIndex((a) => a.playerId === playerId);
      if (existingIndex >= 0) {
        const newAssignments = play.assignments.filter((a) => a.playerId !== playerId);
        onAssignmentsChange?.(newAssignments);
      }
    },
    [play.assignments, onAssignmentsChange],
  );

  // Handle stage mouse events for drawing
  const handleStageMouseDown = useCallback(
    (e: any) => {
      if (!isInteractive) return;

      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      if (!point) return;

      // Handle eraser tool
      if (canvasTool === 'eraser') {
        const player = findClosestPlayer(point.x, point.y);
        if (player) {
          handleErase(player.id);
        }
        return;
      }

      // Handle drawing tools
      if (canvasTool !== 'draw-route' && canvasTool !== 'draw-block' && canvasTool !== 'draw-motion') return;

      // Find if clicking near a player
      const player = findClosestPlayer(point.x, point.y);
      if (player) {
        // Start the route from the player's position, not the click position
        handleDrawStart(player.id, player.location.x, player.location.y);
      }
    },
    [isInteractive, canvasTool, findClosestPlayer, handleDrawStart, handleErase],
  );

  const handleStageMouseMove = useCallback(
    (e: any) => {
      if (!isDrawing) return;

      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      if (!point) return;

      handleDrawMove(point.x, point.y);
    },
    [isDrawing, handleDrawMove],
  );

  const handleStageMouseUp = useCallback(() => {
    if (isDrawing) {
      handleDrawEnd();
    }
  }, [isDrawing, handleDrawEnd]);

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

  // Build motion lines from assignments
  const motionLines = useMemo(() => {
    return play.assignments
      .filter((a) => a.motion)
      .map((a) => {
        const player = playerMap.get(a.playerId);
        if (!player) return null;
        const scaledStart = {
          x: player.location.x * scaleX,
          y: player.location.y * scaleY,
        };
        const scaledMotion = {
          ...a.motion!,
          startPosition: {
            x: a.motion!.startPosition.x * scaleX,
            y: a.motion!.startPosition.y * scaleY,
          },
          endPosition: {
            x: a.motion!.endPosition.x * scaleX,
            y: a.motion!.endPosition.y * scaleY,
          },
        };
        return (
          <MotionLine
            key={`motion-${a.playerId}`}
            motion={scaledMotion}
            startPosition={scaledStart}
            mode={mode}
          />
        );
      })
      .filter(Boolean);
  }, [play.assignments, playerMap, scaleX, scaleY, mode]);

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

  // Determine if players should be draggable based on tool
  const playersDraggable = isInteractive && canvasTool === 'select';

  // Current drawing line points for visualization
  const drawingLinePoints = useMemo(() => {
    if (!isDrawing || currentDrawPoints.length < 2) return [];
    return currentDrawPoints.flatMap((pt) => [pt.x, pt.y]);
  }, [isDrawing, currentDrawPoints]);

  // Cursor style based on tool
  const cursorStyle = useMemo(() => {
    switch (canvasTool) {
      case 'draw-route':
      case 'draw-block':
      case 'draw-motion':
        return 'crosshair';
      case 'pan':
        return 'grab';
      case 'eraser':
        return 'pointer';
      default:
        return 'default';
    }
  }, [canvasTool]);

  return (
    <FieldCanvas
      width={width}
      height={height}
      lineOfScrimmageY={losY}
      panMode={canvasTool === 'pan'}
      onStageMouseDown={handleStageMouseDown}
      onStageMouseMove={handleStageMouseMove}
      onStageMouseUp={handleStageMouseUp}
      cursorStyle={cursorStyle}
    >
      <Layer>
        {/* Motion lines (drawn first, below everything) */}
        {motionLines}

        {/* Route lines (drawn below players) */}
        {routeLines}

        {/* Blocking lines */}
        {blockingLines}

        {/* Live drawing line */}
        {isDrawing && drawingLinePoints.length >= 4 && (
          <Line
            points={drawingLinePoints}
            stroke="#f59e0b"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
            tension={0.3}
            listening={false}
          />
        )}

        {/* Offensive players */}
        {scaledPlayers.map((player) => (
          <PlayerIcon
            key={player.id}
            player={player}
            interactive={isInteractive}
            draggable={playersDraggable}
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
