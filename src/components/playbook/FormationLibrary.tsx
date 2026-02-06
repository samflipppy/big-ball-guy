'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PERSONNEL_GROUPS } from '@/lib/constants';
import { BUILT_IN_FORMATIONS } from '@/lib/formations';
import FormationEditor from './FormationEditor';
import type { Formation, Player } from '@/types';

interface FormationLibraryProps {
  formations: Formation[];
  selectedFormationId?: string;
  onSelect: (formation: Formation) => void;
  onCreateFormation?: (data: {
    name: string;
    personnel: string;
    players: Player[];
  }) => void;
  className?: string;
}

function FormationMiniPreview({
  players,
  className,
}: {
  players: Player[];
  className?: string;
}) {
  const viewBox = '0 0 800 500';
  return (
    <svg
      viewBox={viewBox}
      className={cn('rounded bg-emerald-900', className)}
      data-testid="formation-preview"
    >
      {/* LOS */}
      <line
        x1={0}
        y1={248}
        x2={800}
        y2={248}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={2}
      />
      {/* Player dots */}
      {players.map((p) => (
        <circle
          key={p.id}
          cx={p.location.x}
          cy={p.location.y}
          r={12}
          fill="#3b82f6"
          stroke="white"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

export default function FormationLibrary({
  formations,
  selectedFormationId,
  onSelect,
  onCreateFormation,
  className,
}: FormationLibraryProps) {
  const [personnelFilter, setPersonnelFilter] = useState<string>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Combine built-in and custom formations
  const allFormations = useMemo(() => {
    const builtInIds = new Set(BUILT_IN_FORMATIONS.map((f) => f.id));
    const customOnly = formations.filter((f) => !builtInIds.has(f.id));
    return [...BUILT_IN_FORMATIONS, ...customOnly];
  }, [formations]);

  const filteredFormations = useMemo(() => {
    let result = allFormations;

    if (personnelFilter !== 'all') {
      result = result.filter((f) => f.personnel === personnelFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }

    return result;
  }, [allFormations, personnelFilter, searchQuery]);

  const handleEditorSave = useCallback(
    (data: { name: string; personnel: string; players: Player[] }) => {
      if (onCreateFormation) {
        onCreateFormation(data);
      }
      setShowEditor(false);
    },
    [onCreateFormation],
  );

  if (showEditor) {
    return (
      <FormationEditor
        onSave={handleEditorSave}
        onCancel={() => setShowEditor(false)}
        className={className}
      />
    );
  }

  return (
    <div className={cn('flex flex-col', className)} data-testid="formation-library">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-900">Formations</h3>
        {onCreateFormation && (
          <button
            onClick={() => setShowEditor(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            data-testid="new-formation-btn"
          >
            + New Formation
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-100">
        <input
          type="text"
          placeholder="Search formations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-md border border-zinc-300 px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          data-testid="formation-search"
        />
        <select
          value={personnelFilter}
          onChange={(e) => setPersonnelFilter(e.target.value)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          data-testid="personnel-filter"
          aria-label="Filter by personnel"
        >
          <option value="all">All Personnel</option>
          {PERSONNEL_GROUPS.map((g) => (
            <option key={g.code} value={g.code}>
              {g.code}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredFormations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400" data-testid="no-formations">
            <p className="text-sm">No formations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="formation-grid">
            {filteredFormations.map((formation) => (
              <button
                key={formation.id}
                onClick={() => onSelect(formation)}
                className={cn(
                  'flex flex-col items-center rounded-lg border p-2 transition-all hover:shadow-md',
                  selectedFormationId === formation.id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-zinc-200 bg-white hover:border-zinc-300',
                )}
                data-testid={`formation-card-${formation.id}`}
              >
                <FormationMiniPreview
                  players={formation.players}
                  className="mb-2 h-16 w-full"
                />
                <span className="text-xs font-medium text-zinc-800 truncate w-full text-center">
                  {formation.name}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {formation.personnel} personnel
                  {formation.isCustom && ' · Custom'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
