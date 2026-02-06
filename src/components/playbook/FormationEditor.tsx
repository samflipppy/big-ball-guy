'use client';

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { PERSONNEL_GROUPS } from '@/lib/constants';
import { DEFAULT_OFFENSE_PLAYERS } from '@/lib/constants';
import type { Player, Formation } from '@/types';

interface FormationEditorProps {
  formation?: Formation;
  onSave: (data: {
    name: string;
    personnel: string;
    players: Player[];
  }) => void;
  onCancel: () => void;
  className?: string;
}

const FIELD_WIDTH = 800;
const FIELD_HEIGHT = 500;
const PLAYER_RADIUS = 14;
const LOS_Y = 248;

export default function FormationEditor({
  formation,
  onSave,
  onCancel,
  className,
}: FormationEditorProps) {
  const [name, setName] = useState(formation?.name ?? '');
  const [personnel, setPersonnel] = useState(formation?.personnel ?? '11');
  const [players, setPlayers] = useState<Player[]>(
    formation?.players ?? [...DEFAULT_OFFENSE_PLAYERS],
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  const getMousePosition = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = FIELD_WIDTH / rect.width;
      const scaleY = FIELD_HEIGHT / rect.height;
      return {
        x: Math.max(PLAYER_RADIUS, Math.min(FIELD_WIDTH - PLAYER_RADIUS, (e.clientX - rect.left) * scaleX)),
        y: Math.max(PLAYER_RADIUS, Math.min(FIELD_HEIGHT - PLAYER_RADIUS, (e.clientY - rect.top) * scaleY)),
      };
    },
    [],
  );

  const handleMouseDown = useCallback(
    (playerId: string) => {
      setDraggingId(playerId);
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!draggingId) return;
      const pos = getMousePosition(e);
      setPlayers((prev) =>
        prev.map((p) => (p.id === draggingId ? { ...p, location: pos } : p)),
      );
    },
    [draggingId, getMousePosition],
  );

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      setNameError('Formation name is required');
      return;
    }
    setNameError('');
    onSave({ name: name.trim(), personnel, players });
  }, [name, personnel, players, onSave]);

  return (
    <div
      className={cn(
        'flex flex-col bg-white rounded-xl shadow-xl overflow-hidden',
        className,
      )}
      data-testid="formation-editor"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">
          {formation ? 'Edit Formation' : 'New Formation'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            data-testid="formation-editor-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            data-testid="formation-editor-save"
          >
            Save Formation
          </button>
        </div>
      </div>

      {/* Name & Personnel */}
      <div className="flex items-center gap-4 border-b border-zinc-200 px-6 py-3">
        <div className="flex-1">
          <label htmlFor="formation-name" className="mb-1 block text-xs font-medium text-zinc-500">
            Formation Name
          </label>
          <input
            id="formation-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="e.g., Shotgun Trips Right"
            className={cn(
              'w-full rounded-lg border px-3 py-1.5 text-sm',
              nameError ? 'border-red-400 focus:ring-red-500' : 'border-zinc-300 focus:ring-blue-500',
              'focus:border-transparent focus:outline-none focus:ring-2',
            )}
            data-testid="formation-name-input"
          />
          {nameError && (
            <p className="mt-1 text-xs text-red-500" data-testid="formation-name-error">
              {nameError}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="formation-personnel" className="mb-1 block text-xs font-medium text-zinc-500">
            Personnel
          </label>
          <select
            id="formation-personnel"
            value={personnel}
            onChange={(e) => setPersonnel(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="formation-personnel-select"
          >
            {PERSONNEL_GROUPS.map((g) => (
              <option key={g.code} value={g.code}>
                {g.code} - {g.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Field */}
      <div className="flex-1 bg-zinc-50 p-4">
        <div className="mx-auto" style={{ maxWidth: FIELD_WIDTH }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
            className="w-full cursor-crosshair rounded-lg"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            data-testid="formation-field"
          >
            {/* Yard lines */}
            {Array.from({ length: 7 }, (_, i) => {
              const y = 50 + i * (FIELD_HEIGHT / 7);
              return (
                <line
                  key={`yard-${i}`}
                  x1={0}
                  y1={y}
                  x2={FIELD_WIDTH}
                  y2={y}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                />
              );
            })}

            {/* Line of scrimmage */}
            <line
              x1={0}
              y1={LOS_Y}
              x2={FIELD_WIDTH}
              y2={LOS_Y}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={2}
              strokeDasharray="8,4"
            />

            {/* Hash marks */}
            <line
              x1={270}
              y1={0}
              x2={270}
              y2={FIELD_HEIGHT}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
            <line
              x1={530}
              y1={0}
              x2={530}
              y2={FIELD_HEIGHT}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />

            {/* Players */}
            {players.map((player) => (
              <g
                key={player.id}
                onMouseDown={() => handleMouseDown(player.id)}
                style={{ cursor: 'grab' }}
                data-testid={`player-dot-${player.id}`}
              >
                <circle
                  cx={player.location.x}
                  cy={player.location.y}
                  r={PLAYER_RADIUS}
                  fill={draggingId === player.id ? '#8b5cf6' : '#2563eb'}
                  stroke="white"
                  strokeWidth={2}
                />
                <text
                  x={player.location.x}
                  y={player.location.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight="bold"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {player.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className="mt-2 text-center text-xs text-zinc-500">
          Drag players to position them on the field
        </p>
      </div>
    </div>
  );
}
