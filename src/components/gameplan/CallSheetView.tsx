'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { CallSheet, CallSheetSection, Play } from '@/types';

const DEFAULT_SECTION_COLORS: string[] = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#ca8a04', // yellow
  '#be185d', // pink
];

export interface CallSheetViewProps {
  callSheet: CallSheet;
  plays: Play[];
  compact?: boolean;
}

export function CallSheetView({ callSheet, plays, compact = false }: CallSheetViewProps) {
  const getPlay = useMemo(() => {
    const playMap = new Map(plays.map((p) => [p.id, p]));
    return (playId: string): Play | undefined => playMap.get(playId);
  }, [plays]);

  const getSectionColor = (section: CallSheetSection, index: number): string => {
    return section.color ?? DEFAULT_SECTION_COLORS[index % DEFAULT_SECTION_COLORS.length];
  };

  return (
    <div className="call-sheet-view" data-testid="call-sheet-view">
      <div
        className={cn(
          'grid gap-4',
          compact ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2',
        )}
      >
        {callSheet.sections.length === 0 ? (
          <div className="col-span-full text-center py-12 text-zinc-400 dark:text-zinc-500" data-testid="empty-call-sheet">
            <p className="text-sm">No sections in this call sheet</p>
          </div>
        ) : (
          callSheet.sections.map((section, sectionIndex) => {
            const color = getSectionColor(section, sectionIndex);
            return (
              <div
                key={`${section.name}-${sectionIndex}`}
                className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm print:shadow-none print:break-inside-avoid"
                data-testid={`call-sheet-section-${sectionIndex}`}
              >
                {/* Section Header */}
                <div
                  className="px-4 py-2 text-white font-bold text-sm uppercase tracking-wide"
                  style={{ backgroundColor: color }}
                  data-testid={`section-header-${sectionIndex}`}
                >
                  {section.name}
                  <span className="ml-2 text-xs font-normal opacity-80">
                    ({section.plays.length})
                  </span>
                </div>

                {/* Play Cards */}
                <div className={cn('p-2', compact ? 'space-y-1' : 'space-y-2')}>
                  {section.plays.length === 0 ? (
                    <div className="text-center py-4 text-xs text-zinc-400" data-testid={`empty-section-${sectionIndex}`}>
                      No plays
                    </div>
                  ) : (
                    section.plays.map((playRef) => {
                      const play = getPlay(playRef.playId);
                      return (
                        <div
                          key={playRef.playId}
                          className={cn(
                            'flex items-center gap-3 rounded-md border border-zinc-100 dark:border-zinc-800',
                            compact ? 'px-2 py-1.5' : 'px-3 py-2',
                          )}
                          data-testid={`call-sheet-play-${playRef.playId}`}
                        >
                          {/* Mini diagram placeholder */}
                          <div
                            className={cn(
                              'bg-green-800 rounded flex-shrink-0 flex items-center justify-center',
                              compact ? 'w-8 h-6' : 'w-12 h-8',
                            )}
                          >
                            <span className="text-white text-[6px] font-bold">
                              {play ? play.name.substring(0, 4).toUpperCase() : '?'}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'font-semibold text-zinc-900 dark:text-zinc-100 truncate',
                                compact ? 'text-xs' : 'text-sm',
                              )}
                            >
                              {play?.name ?? 'Unknown Play'}
                            </p>
                            {!compact && play?.notes && (
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                {play.notes}
                              </p>
                            )}
                          </div>

                          <span className="text-[10px] text-zinc-400 flex-shrink-0 font-medium">
                            {play?.personnel ?? ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .call-sheet-view {
            padding: 0;
          }
          .call-sheet-view > div {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CallSheetView;
