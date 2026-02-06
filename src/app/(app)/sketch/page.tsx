'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/playStore';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SketchPage() {
  const [hasContent, setHasContent] = useState(false);
  const { setCurrentMode } = useAppStore();

  const handleNewPlay = () => {
    setHasContent(false);
  };

  const handleSaveToPlaybook = () => {
    setCurrentMode('playbook');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Quick Sketch
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleNewPlay}>
            New Play
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveToPlaybook}>
            Save to Playbook
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative bg-[#2d5a27] dark:bg-[#1a3d18]">
        {!hasContent ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <EmptyState
              title="Start sketching"
              description="Click anywhere on the field to start drawing a play. Use the drawing tools to add routes, blocks, and assignments."
              actionLabel="Start Drawing"
              onAction={() => setHasContent(true)}
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              }
              className="text-white [&_h3]:text-white [&_p]:text-white/70"
            />
          </div>
        ) : (
          /* Placeholder for PlayRenderer + DrawingTools integration */
          <div className="flex h-full items-center justify-center">
            <div className="rounded-lg bg-white/10 p-8 text-center text-white/70 backdrop-blur-sm">
              <p className="text-sm">Canvas rendering area</p>
              <p className="mt-1 text-xs">PlayRenderer and DrawingTools will be integrated here</p>
            </div>
          </div>
        )}

        {/* Field lines overlay (decorative) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Yard lines */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-white/10"
              style={{ top: `${((i + 1) * 100) / 8}%` }}
            />
          ))}
          {/* Hash marks */}
          <div className="absolute top-0 bottom-0 left-1/3 border-l border-dashed border-white/5" />
          <div className="absolute top-0 bottom-0 right-1/3 border-r border-dashed border-white/5" />
        </div>
      </div>
    </div>
  );
}
