'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Arrow, Circle, Rect, Text, Group } from 'react-konva';
import type Konva from 'konva';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import {
  BUILT_IN_ROUTES,
  type RouteDefinition,
  type RouteCategory,
  mirrorRoute,
} from '@/lib/route-tree';
import {
  getCustomRoutes,
  addCustomRoute,
  updateCustomRoute,
  deleteCustomRoute,
  generateRouteId,
  getRouteCategoriesWithCustom,
} from '@/lib/custom-routes';
import type { RoutePoint, RouteType } from '@/types';

interface RouteTreeEditorProps {
  teamId?: string;
  className?: string;
}

type EditorMode = 'view' | 'draw' | 'edit';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const PLAYER_START_X = 200;
const PLAYER_START_Y = 400;
const YARDS_TO_PIXELS = 12; // 12 pixels per yard

const ROUTE_TYPES: { value: RouteType; label: string }[] = [
  { value: 'streak', label: 'Streak/Go' },
  { value: 'slant', label: 'Slant' },
  { value: 'out', label: 'Out' },
  { value: 'in', label: 'In' },
  { value: 'corner', label: 'Corner' },
  { value: 'post', label: 'Post' },
  { value: 'curl', label: 'Curl' },
  { value: 'comeback', label: 'Comeback' },
  { value: 'hitch', label: 'Hitch' },
  { value: 'flat', label: 'Flat' },
  { value: 'wheel', label: 'Wheel' },
  { value: 'drag', label: 'Drag' },
  { value: 'cross', label: 'Cross' },
  { value: 'dig', label: 'Dig' },
  { value: 'seam', label: 'Seam' },
  { value: 'screen', label: 'Screen' },
  { value: 'swing', label: 'Swing' },
  { value: 'angle', label: 'Angle' },
  { value: 'option', label: 'Option' },
  { value: 'custom', label: 'Custom' },
];

/**
 * Route Tree Editor - Allows coaches to create and manage custom routes
 */
export function RouteTreeEditor({ teamId = 'default', className }: RouteTreeEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [mode, setMode] = useState<EditorMode>('view');
  const [customRoutes, setCustomRoutes] = useState<RouteDefinition[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteDefinition | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRouteName, setEditRouteName] = useState('');
  const [editRouteType, setEditRouteType] = useState<RouteType>('custom');
  const [editRouteDepth, setEditRouteDepth] = useState(10);
  const [editRouteDescription, setEditRouteDescription] = useState('');
  const [editingRoute, setEditingRoute] = useState<RouteDefinition | null>(null);

  // Load custom routes on mount
  useEffect(() => {
    setCustomRoutes(getCustomRoutes(teamId));
  }, [teamId]);

  // Get categories with custom routes
  const categories = useMemo(() => {
    return getRouteCategoriesWithCustom(teamId);
  }, [teamId, customRoutes]);

  // Convert route points to canvas coordinates
  const routeToCanvas = useCallback((route: RouteDefinition): number[] => {
    const points: number[] = [];
    route.points.forEach((pt) => {
      points.push(PLAYER_START_X + pt.x * YARDS_TO_PIXELS);
      points.push(PLAYER_START_Y + pt.y * YARDS_TO_PIXELS);
    });
    return points;
  }, []);

  // Handle drawing start
  const handleMouseDown = useCallback(
    (e: any) => {
      if (mode !== 'draw') return;

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;

      setIsDrawing(true);
      setDrawingPoints([{ x: pos.x, y: pos.y }]);
    },
    [mode]
  );

  // Handle drawing
  const handleMouseMove = useCallback(
    (e: any) => {
      if (!isDrawing || mode !== 'draw') return;

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;

      setDrawingPoints((prev) => [...prev, { x: pos.x, y: pos.y }]);
    },
    [isDrawing, mode]
  );

  // Handle drawing end
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || drawingPoints.length < 2) {
      setIsDrawing(false);
      setDrawingPoints([]);
      return;
    }

    // Simplify points
    const simplified = simplifyPoints(drawingPoints, 3);
    if (simplified.length < 2) {
      setIsDrawing(false);
      setDrawingPoints([]);
      return;
    }

    // Convert to route points (relative to player position)
    const routePoints: RoutePoint[] = simplified.map((p, idx) => ({
      x: (p.x - PLAYER_START_X) / YARDS_TO_PIXELS,
      y: (p.y - PLAYER_START_Y) / YARDS_TO_PIXELS,
      type: idx === 0 ? 'line' : idx === simplified.length - 1 ? 'line' : 'curve',
    }));

    // Calculate depth
    const depth = Math.abs(Math.min(...routePoints.map((p) => p.y)));

    // Calculate direction
    const lastPoint = routePoints[routePoints.length - 1];
    let direction: -1 | 0 | 1 = 0;
    if (lastPoint.x < -3) direction = -1;
    else if (lastPoint.x > 3) direction = 1;

    // Open edit modal with the new route
    setEditingRoute(null);
    setEditRouteName('');
    setEditRouteType('custom');
    setEditRouteDepth(Math.round(depth));
    setEditRouteDescription('');
    setEditModalOpen(true);

    // Store the points temporarily
    setDrawingPoints(simplified);
    setIsDrawing(false);
  }, [isDrawing, drawingPoints]);

  // Simplify points (reduce density)
  const simplifyPoints = (points: { x: number; y: number }[], tolerance: number) => {
    if (points.length <= 2) return points;

    const result = [points[0]];
    let lastAdded = points[0];

    for (let i = 1; i < points.length - 1; i++) {
      const dist = Math.sqrt(
        Math.pow(points[i].x - lastAdded.x, 2) + Math.pow(points[i].y - lastAdded.y, 2)
      );
      if (dist > tolerance * 5) {
        result.push(points[i]);
        lastAdded = points[i];
      }
    }

    result.push(points[points.length - 1]);
    return result;
  };

  // Save the drawn route
  const handleSaveRoute = useCallback(() => {
    if (!editRouteName.trim()) return;

    // Convert drawing points to route points
    const routePoints: RoutePoint[] = drawingPoints.map((p, idx) => ({
      x: (p.x - PLAYER_START_X) / YARDS_TO_PIXELS,
      y: (p.y - PLAYER_START_Y) / YARDS_TO_PIXELS,
      type: idx === 0 ? 'line' : idx === drawingPoints.length - 1 ? 'line' : 'curve',
    }));

    // Calculate direction
    const lastPoint = routePoints[routePoints.length - 1];
    let direction: -1 | 0 | 1 = 0;
    if (lastPoint && lastPoint.x < -3) direction = -1;
    else if (lastPoint && lastPoint.x > 3) direction = 1;

    if (editingRoute) {
      // Update existing route
      updateCustomRoute(
        editingRoute.id,
        {
          name: editRouteName,
          type: editRouteType,
          depth: editRouteDepth,
          description: editRouteDescription,
          direction,
        },
        teamId
      );
    } else {
      // Create new route
      const newRoute: RouteDefinition = {
        id: generateRouteId(),
        name: editRouteName,
        type: editRouteType,
        depth: editRouteDepth,
        direction,
        points: routePoints,
        description: editRouteDescription || `Custom ${editRouteName} route`,
        tags: ['custom'],
        isBuiltIn: false,
        teamId,
      };
      addCustomRoute(newRoute, teamId);
    }

    // Refresh custom routes
    setCustomRoutes(getCustomRoutes(teamId));
    setEditModalOpen(false);
    setDrawingPoints([]);
    setMode('view');
  }, [editRouteName, editRouteType, editRouteDepth, editRouteDescription, drawingPoints, editingRoute, teamId]);

  // Edit an existing route
  const handleEditRoute = useCallback((route: RouteDefinition) => {
    setEditingRoute(route);
    setEditRouteName(route.name);
    setEditRouteType(route.type);
    setEditRouteDepth(route.depth);
    setEditRouteDescription(route.description);
    setDrawingPoints(
      route.points.map((p) => ({
        x: PLAYER_START_X + p.x * YARDS_TO_PIXELS,
        y: PLAYER_START_Y + p.y * YARDS_TO_PIXELS,
      }))
    );
    setEditModalOpen(true);
  }, []);

  // Delete a route
  const handleDeleteRoute = useCallback(
    (routeId: string) => {
      deleteCustomRoute(routeId, teamId);
      setCustomRoutes(getCustomRoutes(teamId));
      if (selectedRoute?.id === routeId) {
        setSelectedRoute(null);
      }
    },
    [teamId, selectedRoute]
  );

  // Render a route on the canvas
  const renderRoute = useCallback(
    (route: RouteDefinition, isSelected: boolean, isHovered: boolean) => {
      const points = routeToCanvas(route);
      if (points.length < 4) return null;

      const strokeColor = isSelected
        ? '#f59e0b'
        : route.isBuiltIn
        ? '#3b82f6'
        : '#22c55e';
      const strokeWidth = isSelected ? 4 : isHovered ? 3 : 2;
      const opacity = isSelected || isHovered ? 1 : 0.6;

      const lastX = points[points.length - 2];
      const lastY = points[points.length - 1];
      const secondLastX = points[points.length - 4] || PLAYER_START_X;
      const secondLastY = points[points.length - 3] || PLAYER_START_Y;

      return (
        <Group key={route.id} opacity={opacity}>
          <Line
            points={[PLAYER_START_X, PLAYER_START_Y, ...points]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            lineCap="round"
            lineJoin="round"
            tension={0.4}
          />
          <Arrow
            points={[secondLastX, secondLastY, lastX, lastY]}
            stroke={strokeColor}
            fill={strokeColor}
            strokeWidth={strokeWidth}
            pointerLength={10}
            pointerWidth={8}
          />
        </Group>
      );
    },
    [routeToCanvas]
  );

  // Render field background
  const renderField = useCallback(() => {
    const yardLines: React.ReactNode[] = [];

    // Draw yard lines (every 5 yards)
    for (let y = 0; y <= 40; y += 5) {
      const canvasY = PLAYER_START_Y - y * YARDS_TO_PIXELS;
      yardLines.push(
        <Line
          key={`yard-${y}`}
          points={[0, canvasY, CANVAS_WIDTH, canvasY]}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1}
        />
      );
      // Yard number
      yardLines.push(
        <Text
          key={`yard-text-${y}`}
          x={5}
          y={canvasY - 8}
          text={`${y}`}
          fontSize={10}
          fill="rgba(255,255,255,0.4)"
        />
      );
    }

    return (
      <>
        <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#2d5a27" />
        {yardLines}
        {/* Center line */}
        <Line
          points={[PLAYER_START_X, 0, PLAYER_START_X, CANVAS_HEIGHT]}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />
        {/* Line of scrimmage */}
        <Line
          points={[0, PLAYER_START_Y, CANVAS_WIDTH, PLAYER_START_Y]}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[6, 3]}
        />
      </>
    );
  }, []);

  // Get current category routes
  const currentRoutes = categories[activeCategory]?.routes || [];

  return (
    <div className={cn('flex gap-6', className)}>
      {/* Left Panel - Route List */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Route Tree</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {customRoutes.length} custom route{customRoutes.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Actions */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 flex gap-2">
            <Button
              variant={mode === 'draw' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMode(mode === 'draw' ? 'view' : 'draw')}
              className="flex-1"
            >
              {mode === 'draw' ? 'Cancel Drawing' : 'Draw New Route'}
            </Button>
          </div>

          {/* Category tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-700 overflow-x-auto">
            {categories.map((cat, idx) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(idx)}
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors min-w-0',
                  activeCategory === idx
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                )}
              >
                {cat.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Route list */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {currentRoutes.map((route) => (
              <div
                key={route.id}
                className={cn(
                  'p-3 cursor-pointer transition-colors',
                  selectedRoute?.id === route.id
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                )}
                onClick={() => setSelectedRoute(route)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                      {route.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {route.depth} yds • {route.isBuiltIn ? 'Built-in' : 'Custom'}
                    </p>
                  </div>
                  {!route.isBuiltIn && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRoute(route);
                        }}
                        className="p-1 text-zinc-400 hover:text-blue-500 rounded"
                        title="Edit route"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoute(route.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded"
                        title="Delete route"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Canvas Preview */}
      <div className="flex-1">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {/* Canvas Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {mode === 'draw' ? 'Draw Your Route' : selectedRoute ? selectedRoute.name : 'Route Preview'}
            </h3>
            {mode === 'draw' && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Click and drag from the player to draw a route path
              </p>
            )}
            {selectedRoute && mode === 'view' && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedRoute.description}</p>
            )}
          </div>

          {/* Canvas */}
          <div className="p-4">
            <Stage
              ref={stageRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
              style={{ cursor: mode === 'draw' ? 'crosshair' : 'default' }}
            >
              <Layer>
                {renderField()}

                {/* Show selected route */}
                {selectedRoute && mode === 'view' && renderRoute(selectedRoute, true, false)}

                {/* Player indicator */}
                <Circle
                  x={PLAYER_START_X}
                  y={PLAYER_START_Y}
                  radius={12}
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <Text
                  x={PLAYER_START_X - 5}
                  y={PLAYER_START_Y - 5}
                  text="WR"
                  fontSize={8}
                  fill="#ffffff"
                  fontStyle="bold"
                />

                {/* Drawing preview */}
                {isDrawing && drawingPoints.length >= 2 && (
                  <Line
                    points={drawingPoints.flatMap((p) => [p.x, p.y])}
                    stroke="#f59e0b"
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.4}
                  />
                )}

                {/* Pending save preview */}
                {!isDrawing && drawingPoints.length >= 2 && editModalOpen && (
                  <Line
                    points={drawingPoints.flatMap((p) => [p.x, p.y])}
                    stroke="#22c55e"
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.4}
                  />
                )}
              </Layer>
            </Stage>
          </div>

          {/* Route Details */}
          {selectedRoute && mode === 'view' && (
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Depth</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedRoute.depth} yards</p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Direction</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {selectedRoute.direction === -1 ? 'Left' : selectedRoute.direction === 1 ? 'Right' : 'Straight'}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Type</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">{selectedRoute.type}</p>
                </div>
              </div>
              {selectedRoute.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {selectedRoute.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} size="sm">
        <ModalHeader>{editingRoute ? 'Edit Route' : 'Save New Route'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="route-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Route Name *
              </label>
              <input
                id="route-name"
                type="text"
                value={editRouteName}
                onChange={(e) => setEditRouteName(e.target.value)}
                placeholder="e.g., Deep Corner, Skinny Post"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="route-type" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Route Type
              </label>
              <select
                id="route-type"
                value={editRouteType}
                onChange={(e) => setEditRouteType(e.target.value as RouteType)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROUTE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="route-depth" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Depth (yards)
              </label>
              <input
                id="route-depth"
                type="number"
                value={editRouteDepth}
                onChange={(e) => setEditRouteDepth(Number(e.target.value))}
                min={0}
                max={50}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="route-desc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description
              </label>
              <textarea
                id="route-desc"
                value={editRouteDescription}
                onChange={(e) => setEditRouteDescription(e.target.value)}
                placeholder="Describe the route..."
                rows={2}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditModalOpen(false);
              setDrawingPoints([]);
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveRoute} disabled={!editRouteName.trim()}>
            {editingRoute ? 'Save Changes' : 'Save Route'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default RouteTreeEditor;
