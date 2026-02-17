'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Stage, Layer, Line, Arrow, Circle, Rect, Text, Group } from 'react-konva';
import type Konva from 'konva';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import {
  getCustomRunOptions,
  addCustomRunOption,
  deleteCustomRunOption,
  getCustomQBActions,
  addCustomQBAction,
  deleteCustomQBAction,
  getCustomBlockingSchemes,
  addCustomBlockingScheme,
  deleteCustomBlockingScheme,
  generateOptionId,
  BUILT_IN_RUN_TEMPLATES,
  BUILT_IN_QB_TEMPLATES,
  BUILT_IN_BLOCKING_TEMPLATES,
  type CustomRunOption,
  type CustomQBAction,
  type CustomBlockingScheme,
} from '@/lib/custom-options';
import type { RoutePoint, RunGap, RunDirection, BlockType } from '@/types';

interface OptionsEditorProps {
  teamId?: string;
  className?: string;
}

type EditorTab = 'runs' | 'qb' | 'blocking';
type EditorMode = 'view' | 'draw';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const CENTER_X = 200;
const CENTER_Y = 350;
const YARDS_TO_PIXELS = 12;

const RUN_GAPS: { value: RunGap; label: string }[] = [
  { value: 'A', label: 'A Gap' },
  { value: 'B', label: 'B Gap' },
  { value: 'C', label: 'C Gap' },
  { value: 'D', label: 'D Gap' },
  { value: 'outside', label: 'Outside' },
];

const RUN_DIRECTIONS: { value: RunDirection; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'middle', label: 'Middle' },
  { value: 'right', label: 'Right' },
];

const HANDOFF_TYPES = [
  { value: 'direct', label: 'Direct Handoff' },
  { value: 'toss', label: 'Toss/Pitch' },
  { value: 'counter', label: 'Counter' },
  { value: 'option', label: 'Option' },
];

const QB_TYPES = [
  { value: 'dropback', label: 'Dropback' },
  { value: 'rollout', label: 'Rollout' },
  { value: 'bootleg', label: 'Bootleg' },
  { value: 'scramble', label: 'Scramble' },
  { value: 'read', label: 'Read Option' },
];

/**
 * Options Editor - Allows coaches to create and manage custom options
 */
export function OptionsEditor({ teamId = 'default', className }: OptionsEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('runs');
  const [mode, setMode] = useState<EditorMode>('view');

  // Data state
  const [customRuns, setCustomRuns] = useState<CustomRunOption[]>([]);
  const [customQBActions, setCustomQBActions] = useState<CustomQBAction[]>([]);
  const [customBlocking, setCustomBlocking] = useState<CustomBlockingScheme[]>([]);

  // Selection state
  const [selectedRun, setSelectedRun] = useState<CustomRunOption | null>(null);
  const [selectedQB, setSelectedQB] = useState<CustomQBAction | null>(null);
  const [selectedBlocking, setSelectedBlocking] = useState<CustomBlockingScheme | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);

  // Modal state
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [qbModalOpen, setQBModalOpen] = useState(false);
  const [blockingModalOpen, setBlockingModalOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formGap, setFormGap] = useState<RunGap>('A');
  const [formDirection, setFormDirection] = useState<RunDirection>('right');
  const [formHandoff, setFormHandoff] = useState<'direct' | 'toss' | 'pitch' | 'option' | 'counter'>('direct');
  const [formQBType, setFormQBType] = useState<'dropback' | 'rollout' | 'bootleg' | 'scramble' | 'option' | 'read'>('dropback');
  const [formQBDepth, setFormQBDepth] = useState(5);
  const [formDescription, setFormDescription] = useState('');

  // Load data on mount
  useEffect(() => {
    setCustomRuns(getCustomRunOptions(teamId));
    setCustomQBActions(getCustomQBActions(teamId));
    setCustomBlocking(getCustomBlockingSchemes(teamId));
  }, [teamId]);

  // Drawing handlers
  const handleMouseDown = useCallback((e: any) => {
    if (mode !== 'draw') return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    setIsDrawing(true);
    setDrawingPoints([{ x: pos.x, y: pos.y }]);
  }, [mode]);

  const handleMouseMove = useCallback((e: any) => {
    if (!isDrawing || mode !== 'draw') return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    setDrawingPoints((prev) => [...prev, { x: pos.x, y: pos.y }]);
  }, [isDrawing, mode]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || drawingPoints.length < 2) {
      setIsDrawing(false);
      setDrawingPoints([]);
      return;
    }

    // Simplify points
    const simplified = simplifyPoints(drawingPoints, 5);
    setDrawingPoints(simplified);
    setIsDrawing(false);

    // Open appropriate modal
    if (activeTab === 'runs') {
      setRunModalOpen(true);
    } else if (activeTab === 'qb') {
      setQBModalOpen(true);
    }
  }, [isDrawing, drawingPoints, activeTab]);

  const simplifyPoints = (points: { x: number; y: number }[], tolerance: number) => {
    if (points.length <= 2) return points;
    const result = [points[0]];
    let lastAdded = points[0];
    for (let i = 1; i < points.length - 1; i++) {
      const dist = Math.sqrt(
        Math.pow(points[i].x - lastAdded.x, 2) + Math.pow(points[i].y - lastAdded.y, 2)
      );
      if (dist > tolerance * 3) {
        result.push(points[i]);
        lastAdded = points[i];
      }
    }
    result.push(points[points.length - 1]);
    return result;
  };

  // Save run option
  const handleSaveRun = useCallback(() => {
    if (!formName.trim()) return;

    const routePoints: RoutePoint[] = drawingPoints.map((p, idx) => ({
      x: (p.x - CENTER_X) / YARDS_TO_PIXELS,
      y: (p.y - CENTER_Y) / YARDS_TO_PIXELS,
      type: idx === 0 ? 'line' : idx === drawingPoints.length - 1 ? 'line' : 'curve',
    }));

    const newRun: CustomRunOption = {
      id: generateOptionId('run'),
      name: formName,
      gap: formGap,
      direction: formDirection,
      handoff: formHandoff,
      points: routePoints,
      description: formDescription || `Custom ${formName} run`,
      icon: formName.substring(0, 3).toUpperCase(),
      teamId,
    };

    addCustomRunOption(newRun, teamId);
    setCustomRuns(getCustomRunOptions(teamId));
    setRunModalOpen(false);
    setDrawingPoints([]);
    setMode('view');
    resetForm();
  }, [formName, formGap, formDirection, formHandoff, formDescription, drawingPoints, teamId]);

  // Save QB action
  const handleSaveQB = useCallback(() => {
    if (!formName.trim()) return;

    const routePoints: RoutePoint[] = drawingPoints.map((p, idx) => ({
      x: (p.x - CENTER_X) / YARDS_TO_PIXELS,
      y: (p.y - CENTER_Y) / YARDS_TO_PIXELS,
      type: idx === 0 ? 'line' : idx === drawingPoints.length - 1 ? 'line' : 'curve',
    }));

    // Determine direction from points
    const lastPoint = routePoints[routePoints.length - 1];
    let direction: 'left' | 'right' | undefined;
    if (lastPoint && lastPoint.x < -2) direction = 'left';
    else if (lastPoint && lastPoint.x > 2) direction = 'right';

    const newAction: CustomQBAction = {
      id: generateOptionId('qb'),
      name: formName,
      type: formQBType,
      direction,
      depth: formQBDepth,
      points: routePoints,
      description: formDescription || `Custom ${formName} action`,
      icon: formName.substring(0, 3).toUpperCase(),
      teamId,
    };

    addCustomQBAction(newAction, teamId);
    setCustomQBActions(getCustomQBActions(teamId));
    setQBModalOpen(false);
    setDrawingPoints([]);
    setMode('view');
    resetForm();
  }, [formName, formQBType, formQBDepth, formDescription, drawingPoints, teamId]);

  // Delete handlers
  const handleDeleteRun = useCallback((id: string) => {
    deleteCustomRunOption(id, teamId);
    setCustomRuns(getCustomRunOptions(teamId));
    if (selectedRun?.id === id) setSelectedRun(null);
  }, [teamId, selectedRun]);

  const handleDeleteQB = useCallback((id: string) => {
    deleteCustomQBAction(id, teamId);
    setCustomQBActions(getCustomQBActions(teamId));
    if (selectedQB?.id === id) setSelectedQB(null);
  }, [teamId, selectedQB]);

  const handleDeleteBlocking = useCallback((id: string) => {
    deleteCustomBlockingScheme(id, teamId);
    setCustomBlocking(getCustomBlockingSchemes(teamId));
    if (selectedBlocking?.id === id) setSelectedBlocking(null);
  }, [teamId, selectedBlocking]);

  // Add from template
  const handleAddFromTemplate = useCallback((template: any, type: 'run' | 'qb' | 'blocking') => {
    if (type === 'run') {
      const newRun: CustomRunOption = {
        ...template,
        id: generateOptionId('run'),
        teamId,
      };
      addCustomRunOption(newRun, teamId);
      setCustomRuns(getCustomRunOptions(teamId));
    } else if (type === 'qb') {
      const newAction: CustomQBAction = {
        ...template,
        id: generateOptionId('qb'),
        teamId,
      };
      addCustomQBAction(newAction, teamId);
      setCustomQBActions(getCustomQBActions(teamId));
    } else if (type === 'blocking') {
      const newScheme: CustomBlockingScheme = {
        ...template,
        id: generateOptionId('blocking'),
        teamId,
      };
      addCustomBlockingScheme(newScheme, teamId);
      setCustomBlocking(getCustomBlockingSchemes(teamId));
    }
  }, [teamId]);

  const resetForm = () => {
    setFormName('');
    setFormGap('A');
    setFormDirection('right');
    setFormHandoff('direct');
    setFormQBType('dropback');
    setFormQBDepth(5);
    setFormDescription('');
  };

  // Render field
  const renderField = useCallback(() => {
    const yardLines: React.ReactNode[] = [];
    for (let y = -5; y <= 20; y += 5) {
      const canvasY = CENTER_Y - y * YARDS_TO_PIXELS;
      yardLines.push(
        <Line
          key={`yard-${y}`}
          points={[0, canvasY, CANVAS_WIDTH, canvasY]}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1}
        />
      );
    }
    return (
      <>
        <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#2d5a27" />
        {yardLines}
        <Line points={[0, CENTER_Y, CANVAS_WIDTH, CENTER_Y]} stroke="#3b82f6" strokeWidth={2} dash={[6, 3]} />
      </>
    );
  }, []);

  // Render run path preview
  const renderRunPath = useCallback((run: CustomRunOption, isSelected: boolean) => {
    const points = run.points.flatMap((p) => [
      CENTER_X + p.x * YARDS_TO_PIXELS,
      CENTER_Y + p.y * YARDS_TO_PIXELS,
    ]);
    if (points.length < 4) return null;

    return (
      <Group key={run.id} opacity={isSelected ? 1 : 0.6}>
        <Line
          points={[CENTER_X, CENTER_Y, ...points]}
          stroke={isSelected ? '#3b82f6' : '#60a5fa'}
          strokeWidth={isSelected ? 4 : 3}
          lineCap="round"
          lineJoin="round"
          tension={0.4}
        />
        <Arrow
          points={[points[points.length - 4] || CENTER_X, points[points.length - 3] || CENTER_Y, points[points.length - 2], points[points.length - 1]]}
          stroke={isSelected ? '#3b82f6' : '#60a5fa'}
          fill={isSelected ? '#3b82f6' : '#60a5fa'}
          strokeWidth={3}
          pointerLength={10}
          pointerWidth={8}
        />
      </Group>
    );
  }, []);

  // Render QB action preview
  const renderQBAction = useCallback((action: CustomQBAction, isSelected: boolean) => {
    const points = action.points.flatMap((p) => [
      CENTER_X + p.x * YARDS_TO_PIXELS,
      CENTER_Y + p.y * YARDS_TO_PIXELS,
    ]);
    if (points.length < 2) return null;

    return (
      <Group key={action.id} opacity={isSelected ? 1 : 0.6}>
        <Line
          points={[CENTER_X, CENTER_Y, ...points]}
          stroke={isSelected ? '#8b5cf6' : '#a78bfa'}
          strokeWidth={isSelected ? 4 : 3}
          lineCap="round"
          lineJoin="round"
          tension={0.4}
        />
      </Group>
    );
  }, []);

  return (
    <div className={cn('flex gap-6', className)}>
      {/* Left Panel */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {/* Tab navigation */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-700">
            {(['runs', 'qb', 'blocking'] as EditorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                )}
              >
                {tab === 'runs' ? 'RB Runs' : tab === 'qb' ? 'QB Actions' : 'Blocking'}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
            <Button
              variant={mode === 'draw' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMode(mode === 'draw' ? 'view' : 'draw')}
              className="w-full"
              disabled={activeTab === 'blocking'}
            >
              {mode === 'draw' ? 'Cancel Drawing' : `Draw New ${activeTab === 'runs' ? 'Run' : 'QB Action'}`}
            </Button>
          </div>

          {/* List */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {/* RB Runs */}
            {activeTab === 'runs' && (
              <>
                {customRuns.map((run) => (
                  <div
                    key={run.id}
                    className={cn(
                      'p-3 cursor-pointer transition-colors',
                      selectedRun?.id === run.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    )}
                    onClick={() => setSelectedRun(run)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{run.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {run.gap} Gap • {run.direction} • {run.handoff}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRun(run.id); }}
                        className="p-1 text-zinc-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {customRuns.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                    No custom runs yet. Draw one or add from templates.
                  </div>
                )}
              </>
            )}

            {/* QB Actions */}
            {activeTab === 'qb' && (
              <>
                {customQBActions.map((action) => (
                  <div
                    key={action.id}
                    className={cn(
                      'p-3 cursor-pointer transition-colors',
                      selectedQB?.id === action.id ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    )}
                    onClick={() => setSelectedQB(action)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{action.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {action.type} • {action.depth} yds
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteQB(action.id); }}
                        className="p-1 text-zinc-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {customQBActions.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                    No custom QB actions yet. Draw one or add from templates.
                  </div>
                )}
              </>
            )}

            {/* Blocking Schemes */}
            {activeTab === 'blocking' && (
              <>
                {customBlocking.map((scheme) => (
                  <div
                    key={scheme.id}
                    className={cn(
                      'p-3 cursor-pointer transition-colors',
                      selectedBlocking?.id === scheme.id ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    )}
                    onClick={() => setSelectedBlocking(scheme)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{scheme.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {scheme.type} • {scheme.rules.length} rules
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBlocking(scheme.id); }}
                        className="p-1 text-zinc-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {customBlocking.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                    No custom blocking schemes yet. Add from templates.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Templates section */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Add from Templates</p>
            <div className="flex flex-wrap gap-1">
              {activeTab === 'runs' && BUILT_IN_RUN_TEMPLATES.slice(0, 3).map((t) => (
                <button
                  key={t.name}
                  onClick={() => handleAddFromTemplate(t, 'run')}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  + {t.icon}
                </button>
              ))}
              {activeTab === 'qb' && BUILT_IN_QB_TEMPLATES.slice(0, 4).map((t) => (
                <button
                  key={t.name}
                  onClick={() => handleAddFromTemplate(t, 'qb')}
                  className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                >
                  + {t.icon}
                </button>
              ))}
              {activeTab === 'blocking' && BUILT_IN_BLOCKING_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => handleAddFromTemplate(t, 'blocking')}
                  className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                >
                  + {t.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Canvas */}
      <div className="flex-1">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {mode === 'draw' ? `Draw ${activeTab === 'runs' ? 'Run Path' : 'QB Action'}` : 'Preview'}
            </h3>
            {mode === 'draw' && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Click and drag from the player position to draw the path
              </p>
            )}
          </div>

          <div className="p-4">
            <Stage
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ cursor: mode === 'draw' ? 'crosshair' : 'default' }}
            >
              <Layer>
                {renderField()}

                {/* Player indicator */}
                <Circle x={CENTER_X} y={CENTER_Y} radius={14} fill={activeTab === 'runs' ? '#3b82f6' : '#8b5cf6'} stroke="#ffffff" strokeWidth={2} />
                <Text x={CENTER_X - 8} y={CENTER_Y - 5} text={activeTab === 'runs' ? 'RB' : 'QB'} fontSize={10} fill="#ffffff" fontStyle="bold" />

                {/* Selected preview */}
                {activeTab === 'runs' && selectedRun && renderRunPath(selectedRun, true)}
                {activeTab === 'qb' && selectedQB && renderQBAction(selectedQB, true)}

                {/* Drawing preview */}
                {isDrawing && drawingPoints.length >= 2 && (
                  <Line
                    points={drawingPoints.flatMap((p) => [p.x, p.y])}
                    stroke={activeTab === 'runs' ? '#3b82f6' : '#8b5cf6'}
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.4}
                  />
                )}
              </Layer>
            </Stage>
          </div>

          {/* Details */}
          {activeTab === 'runs' && selectedRun && (
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{selectedRun.name}</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedRun.description}</p>
              <div className="mt-2 flex gap-2">
                <span className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {selectedRun.gap} Gap
                </span>
                <span className="px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {selectedRun.direction}
                </span>
                <span className="px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {selectedRun.handoff}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'qb' && selectedQB && (
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{selectedQB.name}</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedQB.description}</p>
              <div className="mt-2 flex gap-2">
                <span className="px-2 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  {selectedQB.type}
                </span>
                <span className="px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {selectedQB.depth} yds
                </span>
                {selectedQB.direction && (
                  <span className="px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {selectedQB.direction}
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'blocking' && selectedBlocking && (
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{selectedBlocking.name}</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{selectedBlocking.description}</p>
              <div className="space-y-1">
                {selectedBlocking.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-8 font-medium text-zinc-700 dark:text-zinc-300">{rule.position}</span>
                    <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      {rule.blockType}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">{rule.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Run Modal */}
      <Modal open={runModalOpen} onClose={() => { setRunModalOpen(false); setDrawingPoints([]); }} size="sm">
        <ModalHeader>Save Run Option</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Counter Left, Power Right"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Gap</label>
                <select
                  value={formGap}
                  onChange={(e) => setFormGap(e.target.value as RunGap)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                >
                  {RUN_GAPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Direction</label>
                <select
                  value={formDirection}
                  onChange={(e) => setFormDirection(e.target.value as RunDirection)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                >
                  {RUN_DIRECTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Handoff Type</label>
              <select
                value={formHandoff}
                onChange={(e) => setFormHandoff(e.target.value as any)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                {HANDOFF_TYPES.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => { setRunModalOpen(false); setDrawingPoints([]); }}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSaveRun} disabled={!formName.trim()}>Save Run</Button>
        </ModalFooter>
      </Modal>

      {/* QB Modal */}
      <Modal open={qbModalOpen} onClose={() => { setQBModalOpen(false); setDrawingPoints([]); }} size="sm">
        <ModalHeader>Save QB Action</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Sprint Right, Naked Boot"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
                <select
                  value={formQBType}
                  onChange={(e) => setFormQBType(e.target.value as any)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                >
                  {QB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Depth (yds)</label>
                <input
                  type="number"
                  value={formQBDepth}
                  onChange={(e) => setFormQBDepth(Number(e.target.value))}
                  min={1}
                  max={10}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => { setQBModalOpen(false); setDrawingPoints([]); }}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSaveQB} disabled={!formName.trim()}>Save Action</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default OptionsEditor;
