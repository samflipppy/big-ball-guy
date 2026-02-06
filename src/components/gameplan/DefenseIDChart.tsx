'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Play } from '@/types';

// ============================================================
// Types for defense identification
// ============================================================

export type ThreatLevel = 'blitz' | 'zone' | 'man';

export interface DefenseEntry {
  id: string;
  name: string;
  front: string;
  coverage: string;
  threatLevel: ThreatLevel;
  keyIdentifiers: string[];
  description: string;
  audibleTo?: string;
  notes?: string;
}

export interface DefenseIDChartProps {
  defenses: DefenseEntry[];
  plays?: Play[];
  onEdit?: (defense: DefenseEntry) => void;
}

// Color mapping for threat levels
const THREAT_COLORS: Record<ThreatLevel, { bg: string; border: string; text: string; label: string }> = {
  blitz: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-300 dark:border-red-800',
    text: 'text-red-700 dark:text-red-400',
    label: 'Blitz',
  },
  zone: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-300 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-400',
    label: 'Zone',
  },
  man: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-300 dark:border-green-800',
    text: 'text-green-700 dark:text-green-400',
    label: 'Man',
  },
};

export function DefenseIDChart({
  defenses,
  plays,
  onEdit,
}: DefenseIDChartProps) {
  // Build play lookup for audible suggestions
  const playMap = useMemo(() => {
    if (!plays) return new Map<string, Play>();
    return new Map(plays.map((p) => [p.name.toLowerCase(), p]));
  }, [plays]);

  if (defenses.length === 0) {
    return (
      <div className="p-8 text-center" data-testid="defense-id-chart">
        <p className="text-zinc-400 text-sm" data-testid="empty-chart">
          No defensive looks added yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="defense-id-chart">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 print:mb-2" data-testid="threat-legend">
        {(Object.entries(THREAT_COLORS) as [ThreatLevel, typeof THREAT_COLORS[ThreatLevel]][]).map(
          ([level, colors]) => (
            <div key={level} className="flex items-center gap-1.5">
              <div
                className={cn('w-3 h-3 rounded-sm border', colors.bg, colors.border)}
                data-testid={`legend-${level}`}
              />
              <span className={cn('text-xs font-medium', colors.text)}>
                {colors.label}
              </span>
            </div>
          ),
        )}
      </div>

      {/* Chart table */}
      <table
        className="w-full border-collapse text-sm print:text-xs"
        data-testid="defense-id-table"
      >
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Defense
            </th>
            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Front / Coverage
            </th>
            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Key Identifiers
            </th>
            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Diagram
            </th>
            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Audible To
            </th>
            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 print:hidden">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {defenses.map((defense) => {
            const colors = THREAT_COLORS[defense.threatLevel];
            return (
              <tr
                key={defense.id}
                className={cn(colors.bg, 'hover:brightness-95 transition-colors')}
                data-testid={`defense-row-${defense.id}`}
              >
                {/* Defense name + threat badge */}
                <td className={cn('px-3 py-2.5 border', colors.border)}>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {defense.name}
                    </span>
                    <span
                      className={cn(
                        'inline-block w-fit px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                        colors.text,
                        colors.border,
                        'border',
                      )}
                      data-testid={`threat-badge-${defense.id}`}
                    >
                      {colors.label}
                    </span>
                  </div>
                </td>

                {/* Front / Coverage */}
                <td className={cn('px-3 py-2.5 border', colors.border)}>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {defense.front}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {defense.coverage}
                    </span>
                  </div>
                </td>

                {/* Key Identifiers */}
                <td className={cn('px-3 py-2.5 border', colors.border)}>
                  <ul className="list-disc list-inside space-y-0.5" data-testid={`identifiers-${defense.id}`}>
                    {defense.keyIdentifiers.map((identifier, i) => (
                      <li
                        key={i}
                        className="text-xs text-zinc-700 dark:text-zinc-300"
                      >
                        {identifier}
                      </li>
                    ))}
                  </ul>
                  {defense.notes && (
                    <p className="mt-1 text-[10px] italic text-zinc-500 dark:text-zinc-400" data-testid={`defense-notes-${defense.id}`}>
                      {defense.notes}
                    </p>
                  )}
                </td>

                {/* Diagram placeholder */}
                <td className={cn('px-3 py-2.5 border', colors.border)}>
                  <div
                    className="w-24 h-16 bg-green-800 rounded flex items-center justify-center"
                    data-testid={`defense-diagram-${defense.id}`}
                  >
                    <span className="text-white text-[8px] font-bold text-center leading-tight">
                      {defense.front}
                      <br />
                      {defense.coverage}
                    </span>
                  </div>
                </td>

                {/* Audible To */}
                <td className={cn('px-3 py-2.5 border', colors.border)}>
                  {defense.audibleTo ? (
                    <span
                      className="font-semibold text-blue-700 dark:text-blue-400"
                      data-testid={`audible-${defense.id}`}
                    >
                      {defense.audibleTo}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">--</span>
                  )}
                </td>

                {/* Actions */}
                <td className={cn('px-3 py-2.5 border print:hidden', colors.border)}>
                  {onEdit && (
                    <button
                      className="px-2 py-1 text-xs font-medium bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded text-zinc-700 dark:text-zinc-300 transition-colors"
                      onClick={() => onEdit(defense)}
                      data-testid={`edit-defense-${defense.id}`}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Print styles */}
      <style>{`
        @media print {
          [data-testid="defense-id-chart"] {
            font-size: 10px;
          }
          [data-testid="defense-id-chart"] table {
            page-break-inside: auto;
          }
          [data-testid="defense-id-chart"] tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

export default DefenseIDChart;
