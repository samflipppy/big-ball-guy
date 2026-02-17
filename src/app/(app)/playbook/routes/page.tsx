'use client';

import { RouteTreeEditor } from '@/components/canvas/RouteTreeEditor';

export default function RouteTreePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Route Tree Editor</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Create and manage your team's custom route library. Draw routes to add them to your playbook.
        </p>
      </div>

      <RouteTreeEditor teamId="default" />
    </div>
  );
}
