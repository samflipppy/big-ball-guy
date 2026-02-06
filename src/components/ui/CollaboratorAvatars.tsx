'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface EditorInfo {
  id: string;
  name: string;
  color: string;
}

export interface CollaboratorAvatarsProps {
  editors: EditorInfo[];
  /** Maximum number of individual avatars to show before collapsing. Default 3. */
  maxVisible?: number;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function Avatar({
  editor,
  isEditing = true,
}: {
  editor: EditorInfo;
  isEditing?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={cn(
          'relative flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-semibold border-2 border-white dark:border-zinc-900 cursor-default',
        )}
        style={{ backgroundColor: editor.color }}
        aria-label={editor.name}
      >
        {getInitials(editor.name)}

        {/* Pulsing active editing indicator */}
        {isEditing && (
          <span
            className="absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900"
            data-testid="pulse-indicator"
          >
            <span
              className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"
            />
            <span
              className="absolute inset-0 rounded-full bg-green-500"
            />
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-zinc-900 dark:bg-zinc-700 text-white text-xs whitespace-nowrap z-50 pointer-events-none"
        >
          {editor.name}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-700" />
        </div>
      )}
    </div>
  );
}

export function CollaboratorAvatars({
  editors,
  maxVisible = 3,
  className,
}: CollaboratorAvatarsProps) {
  if (editors.length === 0) return null;

  const visibleEditors = editors.slice(0, maxVisible);
  const overflowCount = editors.length - maxVisible;

  return (
    <div
      className={cn('flex items-center', className)}
      data-testid="collaborator-avatars"
    >
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {visibleEditors.map((editor) => (
          <Avatar key={editor.id} editor={editor} />
        ))}

        {/* Overflow indicator */}
        {overflowCount > 0 && (
          <div
            className="relative flex items-center justify-center w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold border-2 border-white dark:border-zinc-900 cursor-default"
            aria-label={`${overflowCount} more editor${overflowCount !== 1 ? 's' : ''}`}
          >
            +{overflowCount}
          </div>
        )}
      </div>

      {/* Label */}
      <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
        {editors.length} {editors.length === 1 ? 'editor' : 'editors'}
      </span>
    </div>
  );
}

export default CollaboratorAvatars;
