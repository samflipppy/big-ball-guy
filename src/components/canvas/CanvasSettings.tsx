'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/playStore';
import { DEFAULT_GRID_SIZES } from '@/lib/grid';

// ============================================================
// CanvasSettings — Settings panel for canvas display options
// ============================================================

export interface CanvasSettingsProps {
  className?: string;
}

export function CanvasSettings({ className = '' }: CanvasSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const gridEnabled = useAppStore((s) => s.gridEnabled);
  const gridSize = useAppStore((s) => s.gridSize);
  const snapToGridEnabled = useAppStore((s) => s.snapToGridEnabled);
  const showYardNumbers = useAppStore((s) => s.showYardNumbers);
  const showHashMarks = useAppStore((s) => s.showHashMarks);
  const showPlayerLabels = useAppStore((s) => s.showPlayerLabels);

  const setGridEnabled = useAppStore((s) => s.setGridEnabled);
  const setGridSize = useAppStore((s) => s.setGridSize);
  const setSnapToGridEnabled = useAppStore((s) => s.setSnapToGridEnabled);
  const setShowYardNumbers = useAppStore((s) => s.setShowYardNumbers);
  const setShowHashMarks = useAppStore((s) => s.setShowHashMarks);
  const setShowPlayerLabels = useAppStore((s) => s.setShowPlayerLabels);

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  return (
    <div ref={panelRef} className={`relative ${className}`}>
      {/* Gear icon toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Canvas settings"
        aria-expanded={isOpen}
        className={`
          flex items-center justify-center w-9 h-9 rounded-md text-sm
          transition-colors duration-100
          ${
            isOpen
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm
        `}
        data-testid="canvas-settings-toggle"
      >
        <span aria-hidden="true">&#9881;</span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50"
          role="group"
          aria-label="Canvas settings panel"
          data-testid="canvas-settings-panel"
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Grid
          </div>

          {/* Show Grid toggle */}
          <label className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-200">Show grid</span>
            <input
              type="checkbox"
              checked={gridEnabled}
              onChange={(e) => setGridEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              data-testid="toggle-show-grid"
            />
          </label>

          {/* Snap to Grid toggle */}
          <label className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-200">Snap to grid</span>
            <input
              type="checkbox"
              checked={snapToGridEnabled}
              onChange={(e) => setSnapToGridEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              data-testid="toggle-snap-to-grid"
            />
          </label>

          {/* Grid size selector */}
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-sm text-gray-700 dark:text-gray-200">Grid size</span>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-0.5 text-gray-700 dark:text-gray-200"
              data-testid="grid-size-selector"
            >
              {DEFAULT_GRID_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" role="separator" />

          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Display
          </div>

          {/* Show Yard Numbers toggle */}
          <label className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-200">Show yard numbers</span>
            <input
              type="checkbox"
              checked={showYardNumbers}
              onChange={(e) => setShowYardNumbers(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              data-testid="toggle-yard-numbers"
            />
          </label>

          {/* Show Hash Marks toggle */}
          <label className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-200">Show hash marks</span>
            <input
              type="checkbox"
              checked={showHashMarks}
              onChange={(e) => setShowHashMarks(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              data-testid="toggle-hash-marks"
            />
          </label>

          {/* Show Player Labels toggle */}
          <label className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-200">Show player labels</span>
            <input
              type="checkbox"
              checked={showPlayerLabels}
              onChange={(e) => setShowPlayerLabels(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              data-testid="toggle-player-labels"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default CanvasSettings;
