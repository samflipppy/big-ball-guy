'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  getOptionsForPosition,
  getOptionsForPositionWithCustom,
  isLineman,
  isReceiver,
  isDefensivePosition,
  MOTION_OPTIONS,
  type AssignmentOption,
  type AssignmentCategory,
} from '@/lib/position-options';
import { getRouteById, type RouteDefinition, mirrorRoute, scaleRouteToCanvas } from '@/lib/route-tree';
import { RoutePicker } from './RoutePicker';
import type { Player, PlayerAssignment, Route, BlockingAssignment, MotionPath } from '@/types';
import { generateId } from '@/lib/utils';

interface PlayerAssignmentPanelProps {
  player: Player;
  currentAssignment?: PlayerAssignment;
  onAssign: (assignment: PlayerAssignment) => void;
  onClear: () => void;
  onClose: () => void;
  className?: string;
}

type PanelView = 'main' | 'routes' | 'motion';

/**
 * Context-sensitive assignment panel for a selected player
 * Shows options based on the player's position
 */
export function PlayerAssignmentPanel({
  player,
  currentAssignment,
  onAssign,
  onClear,
  onClose,
  className,
}: PlayerAssignmentPanelProps) {
  const [view, setView] = useState<PanelView>('main');
  const [activeCategory, setActiveCategory] = useState(0);

  // Get position-specific options (including custom options)
  const positionOptions = useMemo(() => {
    // Use the function that includes custom options for RB/QB
    return getOptionsForPositionWithCustom(player.position, 'default');
  }, [player.position]);

  // Handle selecting an assignment option
  const handleOptionSelect = useCallback(
    (option: AssignmentOption) => {
      let assignment: PlayerAssignment = {
        playerId: player.id,
      };

      if (option.category === 'route' && option.routeId) {
        // Get the route definition and create a Route
        const routeDef = getRouteById(option.routeId);
        if (routeDef) {
          // Store raw route points - they'll be scaled during rendering
          assignment.route = {
            id: generateId(),
            name: routeDef.name,
            type: routeDef.type,
            points: routeDef.points.map(p => ({ ...p })), // Copy raw points
          };
          assignment.label = routeDef.name;
        }
      } else if (option.category === 'block' && option.blockType) {
        assignment.blocking = {
          id: generateId(),
          blockerId: player.id,
          blockType: option.blockType,
          direction: option.blockDirection,
        };
        assignment.label = option.name;
      } else if (option.category === 'run' && option.runDirection) {
        // Create run path based on gap and direction
        const runPoints = createRunPathPoints(option.runGap, option.runDirection, option.runHandoff);
        assignment.runPath = {
          id: generateId(),
          name: option.name,
          gap: option.runGap,
          direction: option.runDirection,
          points: runPoints,
          handoff: option.runHandoff,
        };
        assignment.label = option.name;
      } else if (option.category === 'action') {
        // For QB/RB actions, store as label for now
        assignment.label = option.name;
      } else if (option.category === 'motion' && option.motionType) {
        // Motion will be handled separately
        setView('motion');
        return;
      }

      onAssign(assignment);
    },
    [player.id, onAssign]
  );

  // Create run path points based on gap and direction
  const createRunPathPoints = (
    gap: 'A' | 'B' | 'C' | 'D' | 'outside' | undefined,
    direction: 'left' | 'right' | 'middle',
    handoff?: string
  ) => {
    const points: { x: number; y: number; type: 'line' | 'curve' | 'break' }[] = [];

    // X offset based on gap and direction
    let xOffset = 0;
    if (direction === 'left') {
      xOffset = gap === 'A' ? -3 : gap === 'B' ? -6 : gap === 'C' ? -10 : gap === 'outside' ? -18 : -3;
    } else if (direction === 'right') {
      xOffset = gap === 'A' ? 3 : gap === 'B' ? 6 : gap === 'C' ? 10 : gap === 'outside' ? 18 : 3;
    }

    // Counter has initial fake step
    if (handoff === 'counter') {
      points.push({ x: direction === 'left' ? 3 : -3, y: 1, type: 'curve' });
    }

    // Main path
    if (gap === 'outside' || handoff === 'toss') {
      // Sweeps go wider
      points.push({ x: xOffset * 0.3, y: -2, type: 'curve' });
      points.push({ x: xOffset * 0.7, y: -5, type: 'curve' });
      points.push({ x: xOffset, y: -12, type: 'line' });
    } else {
      // Inside runs go through the hole
      points.push({ x: xOffset * 0.5, y: -3, type: 'curve' });
      points.push({ x: xOffset, y: -8, type: 'line' });
      points.push({ x: xOffset * 1.2, y: -15, type: 'line' });
    }

    return points;
  };

  // Handle route selection from full route picker
  const handleRouteSelect = useCallback(
    (routeDef: RouteDefinition, mirrored: boolean) => {
      // Store raw route points - they'll be scaled during rendering
      const assignment: PlayerAssignment = {
        playerId: player.id,
        route: {
          id: generateId(),
          name: routeDef.name,
          type: routeDef.type,
          points: routeDef.points.map(p => ({ ...p })), // Copy raw points
        },
        label: `${routeDef.name}${mirrored ? ' (M)' : ''}`,
      };
      onAssign(assignment);
      setView('main');
    },
    [player.id, onAssign]
  );

  // Handle motion selection
  const handleMotionSelect = useCallback(
    (motionType: string) => {
      // Create a motion path based on type
      let endX = player.location.x;
      let endY = player.location.y;

      switch (motionType) {
        case 'jet':
          endX = player.location.x > 400 ? 200 : 600; // Across formation
          break;
        case 'orbit':
          endX = player.location.x > 400 ? player.location.x - 100 : player.location.x + 100;
          endY = player.location.y + 50; // Behind QB
          break;
        case 'shift':
          endX = player.location.x + (player.location.x > 400 ? -80 : 80);
          break;
        case 'fly':
          endX = player.location.x > 400 ? 200 : 600;
          break;
        default:
          endX = player.location.x + 100;
      }

      const motion: MotionPath = {
        startPosition: { x: player.location.x, y: player.location.y },
        endPosition: { x: endX, y: endY },
        timing: 'pre-snap',
      };

      const assignment: PlayerAssignment = {
        playerId: player.id,
        motion,
        label: `${motionType.charAt(0).toUpperCase() + motionType.slice(1)} Motion`,
      };
      onAssign(assignment);
      setView('main');
    },
    [player, onAssign]
  );

  // Render the route picker view
  if (view === 'routes') {
    return (
      <RoutePicker
        onSelectRoute={handleRouteSelect}
        onCancel={() => setView('main')}
        selectedRouteId={currentAssignment?.route?.id}
        className={className}
      />
    );
  }

  // Render the motion picker view
  if (view === 'motion') {
    return (
      <div
        className={cn(
          'flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden',
          className
        )}
        style={{ width: 320, maxHeight: 400 }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setView('main')}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Select Motion</h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-2">
          {MOTION_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleMotionSelect(option.motionType!)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-left"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-lg font-bold">
                {option.icon}
              </span>
              <div>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{option.name}</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Main view - show position-specific options
  return (
    <div
      className={cn(
        'flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden',
        className
      )}
      style={{ width: 320, maxHeight: 500 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold',
              player.side === 'offense' ? 'bg-blue-600' : 'bg-red-600'
            )}
          >
            {player.label}
          </span>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {positionOptions?.label || player.position}
            </h3>
            {currentAssignment?.label && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Current: {currentAssignment.label}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Quick actions - only show route/motion for offense */}
      <div className="flex gap-2 p-3 border-b border-zinc-200 dark:border-zinc-700">
        {isReceiver(player.position) && !isDefensivePosition(player.position) && (
          <button
            onClick={() => setView('routes')}
            className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Browse All Routes
          </button>
        )}
        {!isDefensivePosition(player.position) && (
          <button
            onClick={() => setView('motion')}
            className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
          >
            Add Motion
          </button>
        )}
        {currentAssignment && (
          <button
            onClick={onClear}
            className="py-2 px-3 text-xs font-medium rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category tabs */}
      {positionOptions && positionOptions.categories.length > 1 && (
        <div className="flex border-b border-zinc-200 dark:border-zinc-700 overflow-x-auto">
          {positionOptions.categories.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(idx)}
              className={cn(
                'flex-1 px-2 py-2 text-xs font-medium whitespace-nowrap transition-colors',
                activeCategory === idx
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Options list */}
      <div className="flex-1 overflow-y-auto p-2">
        {positionOptions ? (
          <div className="space-y-1">
            {positionOptions.categories[activeCategory]?.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left',
                  currentAssignment?.label === option.name
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded text-sm font-bold',
                    option.category === 'route'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      : option.category === 'block'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      : option.category === 'action'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                  )}
                >
                  {option.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {option.name}
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {option.description}
                  </p>
                </div>
                {currentAssignment?.label === option.name && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <p className="text-sm">No options available for this position</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerAssignmentPanel;
