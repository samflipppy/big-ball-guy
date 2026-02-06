'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type {
  Play,
  Formation,
  Player,
  PlayerAssignment,
  Position,
  RoutePoint,
  MotionPath,
} from '@/types';
import {
  DEFAULT_FIELD,
  PLAYER_RADIUS,
  PLAYER_COLORS,
  ROUTE_COLORS,
  ROUTE_STROKE_WIDTH,
  ROUTE_ARROW_SIZE,
  BLOCK_STROKE_WIDTH,
  BLOCK_COLORS,
  CANVAS_BG_COLOR,
  LINE_COLOR,
  HASH_COLOR,
} from '@/lib/constants';
import PlayAnimationControls from './PlayAnimationControls';

// ============================================================
// Types
// ============================================================

export interface PlayAnimationProps {
  play: Play;
  formation: Formation;
  width: number;
  height: number;
  autoPlay?: boolean;
}

export type PlaybackSpeed = 0.5 | 1 | 2;

// ============================================================
// Animation timing constants
// ============================================================

/** Duration of pre-snap motion in seconds */
const PRE_SNAP_DURATION = 1.0;

/** Duration of route/post-snap phase in seconds */
const ROUTE_DURATION = 2.5;

/** Total animation duration */
const TOTAL_DURATION = PRE_SNAP_DURATION + ROUTE_DURATION;

// ============================================================
// Helpers
// ============================================================

/**
 * Linearly interpolate between two positions.
 */
function lerp(a: Position, b: Position, t: number): Position {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/**
 * Given a list of route points and a parameter t in [0, 1],
 * return the interpolated position along the polyline.
 */
function interpolateAlongPath(start: Position, points: RoutePoint[], t: number): Position {
  if (points.length === 0) return start;
  if (t <= 0) return start;
  if (t >= 1) return { x: points[points.length - 1].x, y: points[points.length - 1].y };

  // Build full path: start + all route points
  const fullPath: Position[] = [start, ...points.map((p) => ({ x: p.x, y: p.y }))];

  // Calculate total length
  let totalLen = 0;
  const segLengths: number[] = [];
  for (let i = 1; i < fullPath.length; i++) {
    const dx = fullPath[i].x - fullPath[i - 1].x;
    const dy = fullPath[i].y - fullPath[i - 1].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    segLengths.push(segLen);
    totalLen += segLen;
  }

  if (totalLen === 0) return start;

  // Find the target distance along the path
  const targetDist = t * totalLen;
  let accumulated = 0;

  for (let i = 0; i < segLengths.length; i++) {
    if (accumulated + segLengths[i] >= targetDist) {
      const segT = (targetDist - accumulated) / segLengths[i];
      return lerp(fullPath[i], fullPath[i + 1], segT);
    }
    accumulated += segLengths[i];
  }

  return { x: points[points.length - 1].x, y: points[points.length - 1].y };
}

/**
 * Compute the partial path points for a route up to parameter t in [0, 1].
 * Returns a flat array [x1, y1, x2, y2, ...] for drawing.
 */
function getPartialPath(
  start: Position,
  points: RoutePoint[],
  t: number,
  scaleX: number,
  scaleY: number,
): number[] {
  if (points.length === 0 || t <= 0) {
    return [start.x * scaleX, start.y * scaleY];
  }

  const fullPath: Position[] = [start, ...points.map((p) => ({ x: p.x, y: p.y }))];

  let totalLen = 0;
  const segLengths: number[] = [];
  for (let i = 1; i < fullPath.length; i++) {
    const dx = fullPath[i].x - fullPath[i - 1].x;
    const dy = fullPath[i].y - fullPath[i - 1].y;
    segLengths.push(Math.sqrt(dx * dx + dy * dy));
    totalLen += segLengths[segLengths.length - 1];
  }

  if (totalLen === 0) return [start.x * scaleX, start.y * scaleY];

  const targetDist = Math.min(t, 1) * totalLen;
  let accumulated = 0;
  const result: number[] = [fullPath[0].x * scaleX, fullPath[0].y * scaleY];

  for (let i = 0; i < segLengths.length; i++) {
    if (accumulated + segLengths[i] >= targetDist) {
      const segT = (targetDist - accumulated) / segLengths[i];
      const pt = lerp(fullPath[i], fullPath[i + 1], segT);
      result.push(pt.x * scaleX, pt.y * scaleY);
      break;
    }
    accumulated += segLengths[i];
    result.push(fullPath[i + 1].x * scaleX, fullPath[i + 1].y * scaleY);
  }

  return result;
}

// ============================================================
// Canvas rendering for animation frame
// ============================================================

function drawField(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = CANVAS_BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  const yardsVisible = DEFAULT_FIELD.yardsVisible;
  const yardSpacing = h / yardsVisible;
  const fieldWidthYards = 53.33;
  const pixelsPerYard = w / fieldWidthYards;
  const leftHash = 20 * pixelsPerYard;
  const rightHash = (fieldWidthYards - 20) * pixelsPerYard;
  const losY = DEFAULT_FIELD.lineOfScrimmageY * (h / DEFAULT_FIELD.height);

  for (let i = 0; i <= yardsVisible; i++) {
    const y = i * yardSpacing;
    const isFiveYard = i % 5 === 0;

    if (isFiveYard) {
      ctx.strokeStyle = LINE_COLOR;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = HASH_COLOR;
      ctx.lineWidth = 0.5;
      const hl = 8;
      // left
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(hl, y); ctx.stroke();
      // right
      ctx.beginPath(); ctx.moveTo(w - hl, y); ctx.lineTo(w, y); ctx.stroke();
      // left hash
      ctx.beginPath(); ctx.moveTo(leftHash - 4, y); ctx.lineTo(leftHash + 4, y); ctx.stroke();
      // right hash
      ctx.beginPath(); ctx.moveTo(rightHash - 4, y); ctx.lineTo(rightHash + 4, y); ctx.stroke();
    }
  }

  // Sidelines
  ctx.strokeStyle = LINE_COLOR;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(1, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - 1, 0); ctx.lineTo(w - 1, h); ctx.stroke();
  ctx.globalAlpha = 1;

  // LOS
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;
  ctx.setLineDash([8, 4]);
  ctx.beginPath(); ctx.moveTo(0, losY); ctx.lineTo(w, losY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function drawPlayerIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  player: Player,
  showLabel: boolean,
): void {
  const isOffense = player.side === 'offense';
  const fillColor = player.color ?? (isOffense ? PLAYER_COLORS.offense : PLAYER_COLORS.defense);
  const radius = PLAYER_RADIUS;

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.5;

  if (isOffense) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const dlPositions = new Set(['DE', 'DT', 'NT']);
    if (dlPositions.has(player.position)) {
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
    } else {
      const r = radius * 1.15;
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.lineTo(x - r * Math.sin(Math.PI / 3), y - r * Math.cos(Math.PI / 3));
      ctx.lineTo(x + r * Math.sin(Math.PI / 3), y - r * Math.cos(Math.PI / 3));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  if (showLabel) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.label, x, y);
  }
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  prevX: number,
  prevY: number,
  color: string,
  size: number,
): void {
  const angle = Math.atan2(y - prevY, x - prevX);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

// ============================================================
// Main Component
// ============================================================

export function PlayAnimation({
  play,
  formation,
  width,
  height,
  autoPlay = false,
}: PlayAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);

  const scaleX = width / DEFAULT_FIELD.width;
  const scaleY = height / DEFAULT_FIELD.height;

  // Build player map
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

  // Identify which assignments have pre-snap motions
  const motionAssignments = useMemo(() => {
    return play.assignments.filter(
      (a) => a.motion && a.motion.timing === 'pre-snap',
    );
  }, [play.assignments]);

  /**
   * Render a single animation frame to canvas.
   */
  const renderFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear and draw field
      ctx.clearRect(0, 0, width, height);
      drawField(ctx, width, height);

      // Determine animation phase
      const preSnapT = Math.min(time / PRE_SNAP_DURATION, 1); // 0..1 during pre-snap
      const routeT = time > PRE_SNAP_DURATION
        ? Math.min((time - PRE_SNAP_DURATION) / ROUTE_DURATION, 1)
        : 0;

      // Compute player positions (factoring in pre-snap motion)
      const playerPositions = new Map<string, Position>();

      for (const player of formation.players) {
        let pos: Position = { ...player.location };

        // Check if this player has a pre-snap motion
        const motionAssignment = motionAssignments.find((a) => a.playerId === player.id);
        if (motionAssignment?.motion && motionAssignment.motion.timing === 'pre-snap') {
          const motion = motionAssignment.motion;
          pos = lerp(motion.startPosition, motion.endPosition, preSnapT);
        }

        playerPositions.set(player.id, pos);
      }

      // Draw route trails (animated)
      if (routeT > 0) {
        for (const assignment of play.assignments) {
          if (!assignment.route || assignment.route.points.length === 0) continue;

          const startPos = playerPositions.get(assignment.playerId);
          if (!startPos) continue;

          const routeColor =
            assignment.route.color ??
            ROUTE_COLORS[assignment.route.type] ??
            ROUTE_COLORS.default;

          // Draw partial path up to current routeT
          const pathPoints = getPartialPath(
            startPos,
            assignment.route.points,
            routeT,
            scaleX,
            scaleY,
          );

          if (pathPoints.length >= 4) {
            ctx.strokeStyle = routeColor;
            ctx.lineWidth = ROUTE_STROKE_WIDTH;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(pathPoints[0], pathPoints[1]);
            for (let i = 2; i < pathPoints.length; i += 2) {
              ctx.lineTo(pathPoints[i], pathPoints[i + 1]);
            }
            ctx.stroke();

            // Arrowhead at tip
            if (pathPoints.length >= 4) {
              const tipX = pathPoints[pathPoints.length - 2];
              const tipY = pathPoints[pathPoints.length - 1];
              const prevX = pathPoints[pathPoints.length - 4];
              const prevY = pathPoints[pathPoints.length - 3];
              drawArrowhead(ctx, tipX, tipY, prevX, prevY, routeColor, ROUTE_ARROW_SIZE);
            }
          }
        }

        // Draw blocking assignments (animate as arrows growing toward target)
        for (const assignment of play.assignments) {
          if (!assignment.blocking) continue;

          const blocker = playerMap.get(assignment.playerId);
          if (!blocker) continue;

          const blockerPos = playerPositions.get(assignment.playerId) ?? blocker.location;
          const blocking = assignment.blocking;

          let targetPos: Position;
          if (blocking.targetId) {
            const target = playerMap.get(blocking.targetId);
            if (!target) continue;
            targetPos = target.location;
          } else {
            const dir = blocking.direction ?? 90;
            const rad = (dir * Math.PI) / 180;
            targetPos = {
              x: blockerPos.x + Math.cos(rad) * 30,
              y: blockerPos.y - Math.sin(rad) * 30,
            };
          }

          // Interpolate blocking line progress
          const blockEnd = lerp(blockerPos, targetPos, routeT);

          const color =
            BLOCK_COLORS[blocking.blockType as keyof typeof BLOCK_COLORS] ?? BLOCK_COLORS.default;
          ctx.strokeStyle = color;
          ctx.lineWidth = BLOCK_STROKE_WIDTH;
          ctx.lineCap = 'round';

          const bx = blockerPos.x * scaleX;
          const by = blockerPos.y * scaleY;
          const ex = blockEnd.x * scaleX;
          const ey = blockEnd.y * scaleY;

          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(ex, ey);
          ctx.stroke();

          // Arrowhead for pull/trap
          if (blocking.blockType === 'pull' || blocking.blockType === 'trap') {
            drawArrowhead(ctx, ex, ey, bx, by, color, 8);
          }
        }
      }

      // Draw offensive players at their current positions
      for (const player of formation.players) {
        const pos = playerPositions.get(player.id) ?? player.location;
        let drawPos: Position;

        // During route phase, move players along their routes
        if (routeT > 0) {
          const assignment = play.assignments.find((a) => a.playerId === player.id);
          if (assignment?.route && assignment.route.points.length > 0) {
            drawPos = interpolateAlongPath(pos, assignment.route.points, routeT);
          } else {
            drawPos = pos;
          }
        } else {
          drawPos = pos;
        }

        drawPlayerIcon(
          ctx,
          drawPos.x * scaleX,
          drawPos.y * scaleY,
          player,
          true,
        );
      }

      // Draw defensive players (static)
      if (play.defensiveOverlay?.players) {
        for (const player of play.defensiveOverlay.players) {
          drawPlayerIcon(
            ctx,
            player.location.x * scaleX,
            player.location.y * scaleY,
            player,
            true,
          );
        }
      }
    },
    [width, height, scaleX, scaleY, play, formation, playerMap, motionAssignments],
  );

  /**
   * Animation loop using requestAnimationFrame.
   */
  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const delta = ((timestamp - lastTimeRef.current) / 1000) * speed;
      lastTimeRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= TOTAL_DURATION) {
          // Stop at end
          setIsPlaying(false);
          return TOTAL_DURATION;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    },
    [speed],
  );

  // Start/stop animation loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, animate]);

  // Render frame whenever currentTime changes
  useEffect(() => {
    renderFrame(currentTime);
  }, [currentTime, renderFrame]);

  // Render initial frame on mount
  useEffect(() => {
    renderFrame(0);
  }, [renderFrame]);

  // Playback controls
  const handlePlay = useCallback(() => {
    if (currentTime >= TOTAL_DURATION) {
      setCurrentTime(0);
    }
    setIsPlaying(true);
  }, [currentTime]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleRewind = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleScrub = useCallback((t: number) => {
    setCurrentTime(t);
  }, []);

  const handleSpeedChange = useCallback((s: PlaybackSpeed) => {
    setSpeed(s);
  }, []);

  const handleStepForward = useCallback(() => {
    setCurrentTime((prev) => Math.min(prev + 0.1, TOTAL_DURATION));
  }, []);

  const handleStepBackward = useCallback(() => {
    setCurrentTime((prev) => Math.max(prev - 0.1, 0));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input element
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isPlaying) {
            handlePause();
          } else {
            handlePlay();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            // Decrease speed
            setSpeed((prev) => {
              if (prev === 2) return 1;
              if (prev === 1) return 0.5;
              return 0.5;
            });
          } else {
            handleStepBackward();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            // Increase speed
            setSpeed((prev) => {
              if (prev === 0.5) return 1;
              if (prev === 1) return 2;
              return 2;
            });
          } else {
            handleStepForward();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, handlePlay, handlePause, handleStepForward, handleStepBackward]);

  return (
    <div data-testid="play-animation" className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        data-testid="animation-canvas"
        className="rounded-lg"
        style={{ width, height }}
      />
      <PlayAnimationControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        totalDuration={TOTAL_DURATION}
        speed={speed}
        onPlay={handlePlay}
        onPause={handlePause}
        onRewind={handleRewind}
        onScrub={handleScrub}
        onSpeedChange={handleSpeedChange}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
      />
    </div>
  );
}

export default PlayAnimation;
