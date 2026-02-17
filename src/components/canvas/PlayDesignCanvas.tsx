'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Arrow, Circle, Rect, RegularPolygon, Text, Group } from 'react-konva';
import type Konva from 'konva';
import { cn } from '@/lib/utils';
import { PlayerAssignmentPanel } from './PlayerAssignmentPanel';
import { scaleRouteToCanvas } from '@/lib/route-tree';
import { DEFAULT_FIELD, PLAYER_RADIUS, PLAYER_COLORS } from '@/lib/constants';
import type {
  Play,
  Formation,
  Player,
  PlayerAssignment,
  Route,
  MotionPath,
  BlockingAssignment,
  RunPath,
} from '@/types';
import { generateId } from '@/lib/utils';

interface PlayDesignCanvasProps {
  play: Play;
  formation: Formation;
  width: number;
  height: number;
  onAssignmentsChange: (assignments: PlayerAssignment[]) => void;
  showDefense?: boolean;
  className?: string;
}

/**
 * PlayDesignCanvas - The main canvas for designing plays
 *
 * Click on a player to open the assignment panel
 * Select routes, blocks, motions from the contextual menu
 * Visual feedback for all assignments
 */
type CanvasTool = 'select' | 'draw-route' | 'draw-motion' | 'draw-block';

export function PlayDesignCanvas({
  play,
  formation,
  width,
  height,
  onAssignmentsChange,
  showDefense = false,
  className,
}: PlayDesignCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Drawing state
  const [tool, setTool] = useState<CanvasTool>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<number[]>([]);
  const [drawingPlayerId, setDrawingPlayerId] = useState<string | null>(null);

  // Dragging state - position overrides for players (formations are read-only templates)
  const [positionOverrides, setPositionOverrides] = useState<Record<string, { x: number; y: number }>>({});

  // Scale factors
  const scaleX = width / DEFAULT_FIELD.width;
  const scaleY = height / DEFAULT_FIELD.height;
  const losY = DEFAULT_FIELD.lineOfScrimmageY * scaleY;

  // Yards to pixels scale factor (how many pixels per yard)
  const yardsToPixels = Math.min(scaleX, scaleY) * 8;

  // Combine offensive and defensive players
  const allPlayers = useMemo(() => {
    const players = [...formation.players];
    if (showDefense && play.defensiveOverlay?.players) {
      players.push(...play.defensiveOverlay.players);
    }
    return players;
  }, [formation.players, showDefense, play.defensiveOverlay?.players]);

  // Get selected player and their assignment
  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    return allPlayers.find((p) => p.id === selectedPlayerId) || null;
  }, [selectedPlayerId, allPlayers]);

  const selectedAssignment = useMemo(() => {
    if (!selectedPlayerId) return undefined;
    return play.assignments.find((a) => a.playerId === selectedPlayerId);
  }, [selectedPlayerId, play.assignments]);

  // Scale player positions (offensive) - apply position overrides
  const scaledPlayers = useMemo(() => {
    return formation.players.map((p) => {
      const override = positionOverrides[p.id];
      return {
        ...p,
        scaledLocation: override
          ? { x: override.x, y: override.y }
          : { x: p.location.x * scaleX, y: p.location.y * scaleY },
      };
    });
  }, [formation.players, scaleX, scaleY, positionOverrides]);

  // Scale defensive player positions - apply position overrides
  const scaledDefensivePlayers = useMemo(() => {
    if (!showDefense || !play.defensiveOverlay?.players) return [];
    return play.defensiveOverlay.players.map((p) => {
      const override = positionOverrides[p.id];
      return {
        ...p,
        scaledLocation: override
          ? { x: override.x, y: override.y }
          : { x: p.location.x * scaleX, y: p.location.y * scaleY },
      };
    });
  }, [showDefense, play.defensiveOverlay?.players, scaleX, scaleY, positionOverrides]);

  // Combine all scaled players for lookups
  const allScaledPlayers = useMemo(() => {
    return [...scaledPlayers, ...scaledDefensivePlayers];
  }, [scaledPlayers, scaledDefensivePlayers]);

  // Handle player click
  const handlePlayerClick = useCallback(
    (playerId: string, evt: any) => {
      const stage = stageRef.current;
      if (!stage) return;

      const player = allScaledPlayers.find((p) => p.id === playerId);
      if (!player) return;

      // Position the panel near the player but within viewport
      const stageBox = stage.container().getBoundingClientRect();
      let panelX = player.scaledLocation.x + stageBox.left + 60;
      let panelY = player.scaledLocation.y + stageBox.top - 100;

      // Keep panel in viewport
      const panelWidth = 320;
      const panelHeight = 400;
      if (panelX + panelWidth > window.innerWidth) {
        panelX = player.scaledLocation.x + stageBox.left - panelWidth - 30;
      }
      if (panelY + panelHeight > window.innerHeight) {
        panelY = window.innerHeight - panelHeight - 20;
      }
      if (panelY < 20) panelY = 20;

      setPanelPosition({ x: panelX, y: panelY });
      setSelectedPlayerId(playerId);
    },
    [allScaledPlayers]
  );

  // Handle assignment change
  const handleAssign = useCallback(
    (assignment: PlayerAssignment) => {
      const existingIndex = play.assignments.findIndex((a) => a.playerId === assignment.playerId);
      let newAssignments: PlayerAssignment[];

      if (existingIndex >= 0) {
        // Merge with existing assignment
        const existing = play.assignments[existingIndex];
        newAssignments = [...play.assignments];
        newAssignments[existingIndex] = {
          ...existing,
          ...assignment,
          // Keep existing properties that aren't being replaced
          route: assignment.route || existing.route,
          blocking: assignment.blocking || existing.blocking,
          motion: assignment.motion || existing.motion,
          runPath: assignment.runPath || existing.runPath,
        };
      } else {
        newAssignments = [...play.assignments, assignment];
      }

      onAssignmentsChange(newAssignments);
    },
    [play.assignments, onAssignmentsChange]
  );

  // Handle clear assignment
  const handleClearAssignment = useCallback(() => {
    if (!selectedPlayerId) return;
    const newAssignments = play.assignments.filter((a) => a.playerId !== selectedPlayerId);
    onAssignmentsChange(newAssignments);
  }, [selectedPlayerId, play.assignments, onAssignmentsChange]);

  // Close panel
  const handleClosePanel = useCallback(() => {
    setSelectedPlayerId(null);
  }, []);

  // Handle player drag end (update position override)
  const handleDragEnd = useCallback(
    (playerId: string, e: any) => {
      const node = e.target;
      const newX = node.x();
      const newY = node.y();
      setPositionOverrides((prev) => ({
        ...prev,
        [playerId]: { x: newX, y: newY },
      }));
    },
    []
  );

  // Handle stage click (deselect)
  const handleStageClick = useCallback((e: any) => {
    // Only close if clicking on empty space
    if (e.target === e.target.getStage()) {
      setSelectedPlayerId(null);
    }
  }, []);

  // Handle zoom
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const oldScale = zoom;
    const newScale = e.evt.deltaY < 0 ? Math.min(oldScale * scaleBy, 3) : Math.max(oldScale / scaleBy, 0.5);
    setZoom(newScale);
  }, [zoom]);

  // Find nearest player to a point (for starting a draw)
  const findNearestPlayer = useCallback((x: number, y: number) => {
    const scaledAll = [...scaledPlayers, ...scaledDefensivePlayers];
    let nearest: typeof scaledAll[0] | null = null;
    let minDist = Infinity;
    const threshold = PLAYER_RADIUS * Math.min(scaleX, scaleY) * 2;

    for (const p of scaledAll) {
      const dist = Math.sqrt(
        Math.pow(p.scaledLocation.x - x, 2) + Math.pow(p.scaledLocation.y - y, 2)
      );
      if (dist < minDist && dist < threshold) {
        minDist = dist;
        nearest = p;
      }
    }
    return nearest;
  }, [scaledPlayers, scaledDefensivePlayers, scaleX, scaleY]);

  // Drawing handlers
  const handleMouseDown = useCallback((e: any) => {
    if (tool === 'select') return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Find the nearest player to start drawing from
    const nearestPlayer = findNearestPlayer(pos.x, pos.y);
    if (nearestPlayer) {
      setIsDrawing(true);
      setDrawingPlayerId(nearestPlayer.id);
      setDrawingPoints([nearestPlayer.scaledLocation.x, nearestPlayer.scaledLocation.y, pos.x, pos.y]);
    }
  }, [tool, findNearestPlayer]);

  const handleMouseMove = useCallback((e: any) => {
    if (!isDrawing || tool === 'select') return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    setDrawingPoints((prev) => [...prev, pos.x, pos.y]);
  }, [isDrawing, tool]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !drawingPlayerId || drawingPoints.length < 4) {
      setIsDrawing(false);
      setDrawingPoints([]);
      setDrawingPlayerId(null);
      return;
    }

    // Convert canvas points to route points (relative to player)
    const player = allPlayers.find((p) => p.id === drawingPlayerId);
    if (!player) {
      setIsDrawing(false);
      setDrawingPoints([]);
      setDrawingPlayerId(null);
      return;
    }

    const playerX = player.location.x * scaleX;
    const playerY = player.location.y * scaleY;

    // Convert drawing points to route points in yards
    const routePoints = [];
    for (let i = 2; i < drawingPoints.length; i += 2) {
      const x = drawingPoints[i];
      const y = drawingPoints[i + 1];
      // Convert to yards relative to player
      routePoints.push({
        x: (x - playerX) / yardsToPixels,
        y: (y - playerY) / yardsToPixels,
        type: 'line' as const,
      });
    }

    // Simplify the route (reduce points)
    const simplifiedPoints = simplifyRoute(routePoints, 0.5);

    if (tool === 'draw-route' && simplifiedPoints.length > 0) {
      const assignment: PlayerAssignment = {
        playerId: drawingPlayerId,
        route: {
          id: generateId(),
          name: 'Custom Route',
          type: 'custom',
          points: simplifiedPoints,
        },
        label: 'Custom Route',
      };
      handleAssign(assignment);
    } else if (tool === 'draw-motion' && simplifiedPoints.length > 0) {
      const lastPoint = simplifiedPoints[simplifiedPoints.length - 1];
      const assignment: PlayerAssignment = {
        playerId: drawingPlayerId,
        motion: {
          startPosition: { x: player.location.x, y: player.location.y },
          endPosition: {
            x: player.location.x + lastPoint.x,
            y: player.location.y + lastPoint.y,
          },
          timing: 'pre-snap',
        },
        label: 'Custom Motion',
      };
      handleAssign(assignment);
    } else if (tool === 'draw-block' && simplifiedPoints.length > 0) {
      const lastPoint = simplifiedPoints[simplifiedPoints.length - 1];
      const endX = playerX + lastPoint.x * yardsToPixels;
      const endY = playerY + lastPoint.y * yardsToPixels;

      // Find nearest player to endpoint (potential block target)
      const targetPlayer = findNearestPlayer(endX, endY);
      const isTargetDifferent = targetPlayer && targetPlayer.id !== drawingPlayerId;

      // Calculate direction angle from player to endpoint
      const dx = lastPoint.x;
      const dy = lastPoint.y;
      const directionDeg = (Math.atan2(dx, -dy) * 180) / Math.PI;

      const assignment: PlayerAssignment = {
        playerId: drawingPlayerId,
        blocking: {
          id: generateId(),
          blockerId: drawingPlayerId,
          blockType: 'drive',
          direction: directionDeg,
          ...(isTargetDifferent ? { targetId: targetPlayer.id } : {}),
        },
        label: 'Custom Block',
      };
      handleAssign(assignment);
    }

    setIsDrawing(false);
    setDrawingPoints([]);
    setDrawingPlayerId(null);
  }, [isDrawing, drawingPlayerId, drawingPoints, allPlayers, scaleX, scaleY, yardsToPixels, tool, handleAssign, findNearestPlayer]);

  // Simplify a route by removing redundant points
  const simplifyRoute = (points: { x: number; y: number; type: 'line' | 'curve' | 'break' }[], tolerance: number) => {
    if (points.length <= 2) return points;

    const result = [points[0]];
    let lastAdded = points[0];

    for (let i = 1; i < points.length - 1; i++) {
      const dist = Math.sqrt(
        Math.pow(points[i].x - lastAdded.x, 2) + Math.pow(points[i].y - lastAdded.y, 2)
      );
      if (dist > tolerance) {
        result.push(points[i]);
        lastAdded = points[i];
      }
    }

    result.push(points[points.length - 1]);
    return result;
  };

  // Render a player icon
  const renderPlayer = (player: typeof scaledPlayers[0], isSelected: boolean) => {
    const { x, y } = player.scaledLocation;
    const isOffense = player.side === 'offense';
    const radius = PLAYER_RADIUS * Math.min(scaleX, scaleY);
    const fillColor = player.color ?? (isOffense ? PLAYER_COLORS.offense : PLAYER_COLORS.defense);
    const strokeColor = isSelected ? PLAYER_COLORS.selected : 'rgba(255,255,255,0.7)';
    const strokeWidth = isSelected ? 3 : 1.5;

    // Check if player has assignment
    const hasAssignment = play.assignments.some((a) => a.playerId === player.id);

    return (
      <Group
        key={player.id}
        x={x}
        y={y}
        draggable={tool === 'select'}
        onClick={(e) => handlePlayerClick(player.id, e)}
        onTap={(e) => handlePlayerClick(player.id, e)}
        onDragEnd={(e) => handleDragEnd(player.id, e)}
        style={{ cursor: tool === 'select' ? 'grab' : 'pointer' }}
      >
        {/* Selection ring */}
        {isSelected && (
          <Circle
            radius={radius + 6}
            fill="transparent"
            stroke="#fbbf24"
            strokeWidth={2}
            dash={[4, 2]}
          />
        )}
        {/* Assignment indicator ring */}
        {hasAssignment && !isSelected && (
          <Circle radius={radius + 4} fill="transparent" stroke="#22c55e" strokeWidth={2} />
        )}
        {/* Player shape */}
        {isOffense ? (
          <Circle radius={radius} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
        ) : player.position === 'DE' ||
          player.position === 'DT' ||
          player.position === 'NT' ? (
          <Rect
            x={-radius}
            y={-radius}
            width={radius * 2}
            height={radius * 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            cornerRadius={2}
          />
        ) : (
          <RegularPolygon
            sides={3}
            radius={radius * 1.15}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rotation={180}
          />
        )}
        {/* Label */}
        <Text
          text={player.label}
          fontSize={10 * Math.min(scaleX, scaleY)}
          fill="#ffffff"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          width={radius * 2.5}
          height={12}
          x={-radius * 1.25}
          y={-6}
          listening={false}
        />
      </Group>
    );
  };

  // Render a route line
  const renderRoute = (assignment: PlayerAssignment) => {
    if (!assignment.route) return null;

    const player = allPlayers.find((p) => p.id === assignment.playerId);
    if (!player) return null;

    const startX = player.location.x * scaleX;
    const startY = player.location.y * scaleY;

    // Route points are in yards relative to player position
    // X: positive = right, negative = left
    // Y: negative = upfield (toward defense), positive = backfield
    const points: number[] = [startX, startY]; // Start at player position
    assignment.route.points.forEach((pt) => {
      points.push(startX + pt.x * yardsToPixels);
      points.push(startY + pt.y * yardsToPixels);
    });

    if (points.length < 4) return null;

    const lastX = points[points.length - 2];
    const lastY = points[points.length - 1];
    const secondLastX = points[points.length - 4] || startX;
    const secondLastY = points[points.length - 3] || startY;

    return (
      <Group key={`route-${assignment.playerId}`}>
        <Line
          points={points}
          stroke="#f59e0b"
          strokeWidth={2.5}
          lineCap="round"
          lineJoin="round"
          tension={0.3}
        />
        {/* Arrow head */}
        <Arrow
          points={[secondLastX, secondLastY, lastX, lastY]}
          stroke="#f59e0b"
          fill="#f59e0b"
          strokeWidth={2.5}
          pointerLength={10}
          pointerWidth={8}
        />
      </Group>
    );
  };

  // Render a motion line
  const renderMotion = (assignment: PlayerAssignment) => {
    if (!assignment.motion) return null;

    const startX = assignment.motion.startPosition.x * scaleX;
    const startY = assignment.motion.startPosition.y * scaleY;
    const endX = assignment.motion.endPosition.x * scaleX;
    const endY = assignment.motion.endPosition.y * scaleY;

    const strokeColor = assignment.motion.timing === 'pre-snap' ? '#f59e0b' : '#8b5cf6';

    return (
      <Group key={`motion-${assignment.playerId}`}>
        <Line
          points={[startX, startY, endX, endY]}
          stroke={strokeColor}
          strokeWidth={2}
          dash={[6, 3]}
          lineCap="round"
        />
        <Arrow
          points={[startX + (endX - startX) * 0.6, startY + (endY - startY) * 0.6, endX, endY]}
          stroke={strokeColor}
          fill={strokeColor}
          strokeWidth={2}
          pointerLength={8}
          pointerWidth={6}
        />
      </Group>
    );
  };

  // Render a blocking line with different visuals based on block type
  const renderBlocking = (assignment: PlayerAssignment) => {
    if (!assignment.blocking) return null;

    const player = allPlayers.find((p) => p.id === assignment.playerId);
    if (!player) return null;

    const startX = player.location.x * scaleX;
    const startY = player.location.y * scaleY;
    const blockType = assignment.blocking.blockType;

    // Calculate end point based on block type and direction
    let endX = startX;
    let endY = startY - 30; // Default: straight ahead (for offense)
    // For defense, "forward" is toward the offense (positive Y)
    if (player.side === 'defense') {
      endY = startY + 30;
    }

    // Adjust distance and direction based on block type
    let distance = 30;
    if (blockType === 'pull') distance = 60; // Pulls go further
    if (blockType === 'reach') distance = 35;
    if (blockType === 'double') distance = 25;

    if (assignment.blocking.direction !== undefined) {
      const angle = (assignment.blocking.direction * Math.PI) / 180;
      const dirMultiplier = player.side === 'defense' ? -1 : 1;
      endX = startX + Math.sin(angle) * distance;
      endY = startY - Math.cos(angle) * distance * dirMultiplier;
    }

    // If targeting a specific player
    if (assignment.blocking.targetId) {
      const target = allPlayers.find((p) => p.id === assignment.blocking!.targetId);
      if (target) {
        endX = target.location.x * scaleX;
        endY = target.location.y * scaleY;
      }
    }

    // Different colors for different block types
    const blockColors: Record<string, string> = {
      'drive': '#22c55e',     // Green
      'reach': '#3b82f6',     // Blue
      'down': '#8b5cf6',      // Purple
      'pull': '#f59e0b',      // Amber
      'trap': '#ef4444',      // Red
      'pass-pro': '#6b7280',  // Gray
      'cut': '#ec4899',       // Pink
      'double': '#14b8a6',    // Teal
      'zone': '#22c55e',      // Green
      'man': '#3b82f6',       // Blue
      'custom': '#22c55e',    // Green
    };
    const strokeColor = blockColors[blockType] || '#22c55e';

    // Pull blocks have a curved path
    if (blockType === 'pull') {
      const midX = startX + (endX - startX) * 0.3;
      const midY = startY + 20; // Pull goes behind the line first
      return (
        <Group key={`block-${assignment.playerId}`}>
          <Line
            points={[startX, startY, midX, midY, endX, endY]}
            stroke={strokeColor}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
          />
          <Arrow
            points={[midX, midY, endX, endY]}
            stroke={strokeColor}
            fill={strokeColor}
            strokeWidth={3}
            pointerLength={10}
            pointerWidth={8}
          />
        </Group>
      );
    }

    // Double team block - two lines converging
    if (blockType === 'double') {
      return (
        <Group key={`block-${assignment.playerId}`}>
          <Line
            points={[startX, startY, endX, endY]}
            stroke={strokeColor}
            strokeWidth={4}
            lineCap="round"
          />
          {/* Two prongs at the end */}
          <Line
            points={[endX - 8, endY - 4, endX, endY, endX + 8, endY - 4]}
            stroke={strokeColor}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        </Group>
      );
    }

    // Pass protection - shows a cup/wall
    if (blockType === 'pass-pro') {
      return (
        <Group key={`block-${assignment.playerId}`}>
          <Line
            points={[startX, startY, endX, endY]}
            stroke={strokeColor}
            strokeWidth={3}
            lineCap="round"
          />
          {/* Protection wall arc */}
          <Line
            points={[endX - 10, endY + 5, endX - 5, endY - 3, endX + 5, endY - 3, endX + 10, endY + 5]}
            stroke={strokeColor}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
          />
        </Group>
      );
    }

    // Zone block - shows lateral movement
    if (blockType === 'zone') {
      return (
        <Group key={`block-${assignment.playerId}`}>
          <Line
            points={[startX, startY, endX, endY]}
            stroke={strokeColor}
            strokeWidth={3}
            lineCap="round"
          />
          {/* Lateral arrow indicator */}
          <Arrow
            points={[startX, startY, endX, endY]}
            stroke={strokeColor}
            fill={strokeColor}
            strokeWidth={3}
            pointerLength={8}
            pointerWidth={10}
          />
        </Group>
      );
    }

    // Default block rendering
    return (
      <Group key={`block-${assignment.playerId}`}>
        <Line
          points={[startX, startY, endX, endY]}
          stroke={strokeColor}
          strokeWidth={3}
          lineCap="round"
        />
        {/* Block indicator (flat end) */}
        <Line
          points={[endX - 6, endY - 3, endX + 6, endY + 3]}
          stroke={strokeColor}
          strokeWidth={4}
          lineCap="round"
        />
      </Group>
    );
  };

  // Render a run path
  const renderRunPath = (assignment: PlayerAssignment) => {
    if (!assignment.runPath) return null;

    const player = allPlayers.find((p) => p.id === assignment.playerId);
    if (!player) return null;

    const startX = player.location.x * scaleX;
    const startY = player.location.y * scaleY;

    // Run path points are in yards relative to player position
    const points: number[] = [startX, startY];
    assignment.runPath.points.forEach((pt) => {
      points.push(startX + pt.x * yardsToPixels);
      points.push(startY + pt.y * yardsToPixels);
    });

    if (points.length < 4) return null;

    // Color based on handoff type
    const handoffColors: Record<string, string> = {
      'direct': '#3b82f6',   // Blue
      'toss': '#8b5cf6',     // Purple
      'pitch': '#ec4899',    // Pink
      'option': '#f59e0b',   // Amber
      'counter': '#ef4444',  // Red
    };
    const strokeColor = handoffColors[assignment.runPath.handoff || 'direct'] || '#3b82f6';

    const lastX = points[points.length - 2];
    const lastY = points[points.length - 1];
    const secondLastX = points[points.length - 4] || startX;
    const secondLastY = points[points.length - 3] || startY;

    return (
      <Group key={`run-${assignment.playerId}`}>
        {/* Run path line - thicker than routes */}
        <Line
          points={points}
          stroke={strokeColor}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
          tension={0.4}
        />
        {/* Arrow head */}
        <Arrow
          points={[secondLastX, secondLastY, lastX, lastY]}
          stroke={strokeColor}
          fill={strokeColor}
          strokeWidth={4}
          pointerLength={12}
          pointerWidth={10}
        />
        {/* Handoff indicator at start (small circle) */}
        {assignment.runPath.handoff && assignment.runPath.handoff !== 'direct' && (
          <Circle
            x={startX + (points[2] - startX) * 0.3}
            y={startY + (points[3] - startY) * 0.3}
            radius={5}
            fill={strokeColor}
            stroke="#ffffff"
            strokeWidth={1}
          />
        )}
      </Group>
    );
  };

  // Field markings
  const renderField = () => {
    const yardLines: React.ReactNode[] = [];
    const yardsVisible = 30;
    const yardSpacing = height / yardsVisible;

    // Yard lines every 5 yards
    for (let i = 0; i <= yardsVisible; i++) {
      const y = i * yardSpacing;
      if (i % 5 === 0) {
        yardLines.push(
          <Line
            key={`yard-${i}`}
            points={[0, y, width, y]}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1}
          />
        );
      }
    }

    return (
      <>
        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill="#2d5a27" />
        {/* Yard lines */}
        {yardLines}
        {/* Line of scrimmage */}
        <Line
          points={[0, losY, width, losY]}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[8, 4]}
        />
        {/* Sidelines */}
        <Line points={[1, 0, 1, height]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
        <Line points={[width - 1, 0, width - 1, height]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
      </>
    );
  };

  return (
    <div className={cn('relative', className)}>
      {/* Drawing Tools Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 bg-white/90 dark:bg-zinc-800/90 rounded-lg shadow p-1" data-testid="drawing-tools-container" role="toolbar" aria-label="Drawing tools">
        <button
          onClick={() => setTool('select')}
          className={cn(
            'p-2 rounded text-sm font-medium transition-colors',
            tool === 'select'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
          )}
          title="Select (click players)"
          aria-label="Select"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </button>
        <button
          onClick={() => setTool('draw-route')}
          className={cn(
            'p-2 rounded text-sm font-medium transition-colors',
            tool === 'draw-route'
              ? 'bg-amber-500 text-white'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
          )}
          title="Draw Route"
          aria-label="Draw Route"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={() => setTool('draw-block')}
          className={cn(
            'p-2 rounded text-sm font-medium transition-colors',
            tool === 'draw-block'
              ? 'bg-green-600 text-white'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
          )}
          title="Draw Block"
          aria-label="Draw Block"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={() => setTool('draw-motion')}
          className={cn(
            'p-2 rounded text-sm font-medium transition-colors',
            tool === 'draw-motion'
              ? 'bg-purple-500 text-white'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
          )}
          title="Draw Motion"
          aria-label="Draw Motion"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" strokeDasharray="4 2" />
          </svg>
        </button>
        <div className="h-px bg-zinc-300 dark:bg-zinc-600 my-0.5" />
        <button
          onClick={() => {
            // Eraser: clear assignment for selected player
            if (selectedPlayerId) {
              const newAssignments = play.assignments.filter((a) => a.playerId !== selectedPlayerId);
              onAssignmentsChange(newAssignments);
              setSelectedPlayerId(null);
            }
          }}
          className="p-2 rounded text-sm font-medium transition-colors text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          title="Eraser"
          aria-label="Eraser"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <button
          onClick={() => {
            // Pan: reset view
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-2 rounded text-sm font-medium transition-colors text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          title="Pan / Reset View"
          aria-label="Pan"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        onClick={tool === 'select' ? handleStageClick : undefined}
        onTap={tool === 'select' ? handleStageClick : undefined}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
      >
        <Layer>
          {/* Field */}
          {renderField()}

          {/* Motion lines (render first, behind everything) */}
          {play.assignments.filter((a) => a.motion).map(renderMotion)}

          {/* Route lines */}
          {play.assignments.filter((a) => a.route).map(renderRoute)}

          {/* Run path lines */}
          {play.assignments.filter((a) => a.runPath).map(renderRunPath)}

          {/* Blocking lines */}
          {play.assignments.filter((a) => a.blocking).map(renderBlocking)}

          {/* Offensive Players */}
          {scaledPlayers.map((player) => renderPlayer(player, player.id === selectedPlayerId))}

          {/* Defensive Players */}
          {scaledDefensivePlayers.map((player) => renderPlayer(player, player.id === selectedPlayerId))}

          {/* Current drawing line */}
          {isDrawing && drawingPoints.length >= 4 && (
            <Line
              points={drawingPoints}
              stroke={tool === 'draw-route' ? '#f59e0b' : tool === 'draw-motion' ? '#8b5cf6' : tool === 'draw-block' ? '#22c55e' : '#f59e0b'}
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              tension={0.3}
              dash={tool === 'draw-motion' ? [6, 3] : undefined}
            />
          )}
        </Layer>
      </Stage>

      {/* Assignment Panel (positioned absolutely over the canvas) */}
      {selectedPlayer && (
        <div
          className="fixed z-50"
          style={{
            left: panelPosition.x,
            top: panelPosition.y,
          }}
        >
          <PlayerAssignmentPanel
            player={selectedPlayer}
            currentAssignment={selectedAssignment}
            onAssign={handleAssign}
            onClear={handleClearAssignment}
            onClose={handleClosePanel}
          />
        </div>
      )}

      {/* Instructions overlay */}
      {!selectedPlayerId && play.assignments.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-lg px-4 py-2 text-white text-sm">
            Click on a player to assign routes, blocks, or motions
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.2, 3))}
          className="w-8 h-8 rounded bg-white/90 dark:bg-zinc-800/90 shadow flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z / 1.2, 0.5))}
          className="w-8 h-8 rounded bg-white/90 dark:bg-zinc-800/90 shadow flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700"
        >
          -
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="w-8 h-8 rounded bg-white/90 dark:bg-zinc-800/90 shadow flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 text-xs"
        >
          Fit
        </button>
      </div>
    </div>
  );
}

export default PlayDesignCanvas;
