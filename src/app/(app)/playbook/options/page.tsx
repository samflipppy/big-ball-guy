'use client';

import { OptionsEditor } from '@/components/canvas/OptionsEditor';

export default function OptionsEditorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Options Editor</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Create and manage custom RB runs, QB actions, and blocking schemes for your playbook.
        </p>
      </div>

      <OptionsEditor teamId="default" />
    </div>
  );
}
