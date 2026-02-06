'use client';

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  SCHOOL_COLOR_PRESETS,
  applyTeamColors,
  getContrastColor,
} from '@/lib/branding';
import type { Team } from '@/types';

// ---- Types ----

export interface TeamBrandingData {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  level: Team['level'];
  logo: string | null;
}

export interface TeamBrandingProps {
  team?: Partial<TeamBrandingData>;
  onSave: (data: TeamBrandingData) => void;
  className?: string;
}

// ---- Level options ----

const LEVEL_OPTIONS: { value: Team['level']; label: string }[] = [
  { value: 'youth', label: 'Youth' },
  { value: 'high_school', label: 'High School' },
  { value: 'college', label: 'College' },
  { value: 'pro', label: 'Pro' },
];

// ---- Component ----

export function TeamBranding({ team, onSave, className }: TeamBrandingProps) {
  const [name, setName] = useState(team?.name ?? '');
  const [primaryColor, setPrimaryColor] = useState(team?.primaryColor ?? '#1d4ed8');
  const [secondaryColor, setSecondaryColor] = useState(team?.secondaryColor ?? '#ffffff');
  const [level, setLevel] = useState<Team['level']>(team?.level ?? 'high_school');
  const [logo, setLogo] = useState<string | null>(team?.logo ?? null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClasses =
    'block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500';

  const labelClasses = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';

  // ---- Logo handling ----

  const handleLogoFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setLogo(result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleLogoFile(file);
    },
    [handleLogoFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleLogoFile(file);
    },
    [handleLogoFile],
  );

  const handleRemoveLogo = useCallback(() => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // ---- Preset selection ----

  const handlePresetClick = useCallback(
    (preset: (typeof SCHOOL_COLOR_PRESETS)[number]) => {
      setPrimaryColor(preset.primary);
      setSecondaryColor(preset.secondary);
    },
    [],
  );

  // ---- Save ----

  const handleSave = useCallback(async () => {
    setSaving(true);
    applyTeamColors(primaryColor, secondaryColor);
    onSave({
      name,
      primaryColor,
      secondaryColor,
      level,
      logo,
    });
    // Small delay to show loading state
    await new Promise((r) => setTimeout(r, 300));
    setSaving(false);
  }, [name, primaryColor, secondaryColor, level, logo, onSave]);

  return (
    <div className={cn('space-y-6', className)} data-testid="team-branding">
      {/* Team Name */}
      <div>
        <label htmlFor="branding-team-name" className={labelClasses}>
          Team Name
        </label>
        <input
          id="branding-team-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter team name"
          className={inputClasses}
          data-testid="team-name-input"
        />
      </div>

      {/* Level selector */}
      <div>
        <label htmlFor="branding-level" className={labelClasses}>
          Level
        </label>
        <select
          id="branding-level"
          value={level}
          onChange={(e) => setLevel(e.target.value as Team['level'])}
          className={inputClasses}
          data-testid="level-select"
        >
          {LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="branding-primary-color" className={labelClasses}>
            Primary Color
          </label>
          <div className="flex items-center gap-2">
            <input
              id="branding-primary-color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
              data-testid="primary-color-input"
            />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{primaryColor}</span>
          </div>
        </div>
        <div>
          <label htmlFor="branding-secondary-color" className={labelClasses}>
            Secondary Color
          </label>
          <div className="flex items-center gap-2">
            <input
              id="branding-secondary-color"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
              data-testid="secondary-color-input"
            />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{secondaryColor}</span>
          </div>
        </div>
      </div>

      {/* Color presets */}
      <div>
        <span className={labelClasses}>Color Presets</span>
        <div className="flex flex-wrap gap-2" data-testid="color-presets">
          {SCHOOL_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'flex h-8 items-center gap-1 rounded-full border border-zinc-200 px-2 text-xs transition-colors',
                'hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500',
              )}
              title={preset.name}
              data-testid={`preset-${preset.name.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <span
                className="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-600"
                style={{ backgroundColor: preset.primary }}
              />
              <span
                className="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-600"
                style={{ backgroundColor: preset.secondary }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Logo upload */}
      <div>
        <span className={labelClasses}>Team Logo</span>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors',
            dragging
              ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
              : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600',
          )}
          data-testid="logo-upload-zone"
          role="button"
          tabIndex={0}
          aria-label="Upload team logo"
        >
          {logo ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={logo}
                alt="Team logo preview"
                className="h-20 w-20 rounded-lg object-contain"
                data-testid="logo-preview"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveLogo();
                }}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                data-testid="remove-logo-button"
              >
                Remove logo
              </button>
            </div>
          ) : (
            <>
              <svg className="mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Drag and drop or click to upload
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">PNG, JPG, SVG</span>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          data-testid="logo-file-input"
        />
      </div>

      {/* Color preview */}
      <div>
        <span className={labelClasses}>Preview</span>
        <div
          className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
          data-testid="color-preview"
        >
          {/* Mini field */}
          <div className="relative h-24 w-40 overflow-hidden rounded-lg bg-green-700">
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/60" />
            {/* Player circles */}
            <div
              className="absolute left-1/2 top-1/3 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: primaryColor,
                color: getContrastColor(primaryColor),
              }}
              data-testid="preview-player-primary"
            >
              QB
            </div>
            <div
              className="absolute left-1/4 top-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: secondaryColor,
                color: getContrastColor(secondaryColor),
                border: `2px solid ${primaryColor}`,
              }}
              data-testid="preview-player-secondary"
            >
              WR
            </div>
          </div>

          {/* Color blocks */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-md border border-zinc-300 dark:border-zinc-600"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Primary</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-md border border-zinc-300 dark:border-zinc-600"
                style={{ backgroundColor: secondaryColor }}
              />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Secondary</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="pt-2">
        <Button onClick={handleSave} loading={saving} data-testid="save-branding-button">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

export default TeamBranding;
