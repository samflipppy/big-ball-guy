'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { validateShareToken } from '@/lib/sharing';
import type { Play, Formation } from '@/types';
import { createClient } from '@/lib/supabase/client';

// --- Types ---

interface SharedPlayData {
  play: Play;
  formation: Formation;
  allowDownload: boolean;
}

type PageState =
  | { status: 'loading' }
  | { status: 'valid'; data: SharedPlayData }
  | { status: 'expired' }
  | { status: 'error'; message: string };

// --- Component ---

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    async function loadSharedPlay() {
      try {
        const validation = await validateShareToken(token);

        if (!validation.valid || !validation.playId) {
          setState({ status: 'expired' });
          return;
        }

        // Fetch the play data
        const supabase = createClient();
        const { data: play, error: playError } = await supabase
          .from('plays')
          .select('*')
          .eq('id', validation.playId)
          .single();

        if (playError || !play) {
          setState({ status: 'error', message: 'Play not found' });
          return;
        }

        // Fetch the formation
        const { data: formation, error: formationError } = await supabase
          .from('formations')
          .select('*')
          .eq('id', play.formation_id)
          .single();

        if (formationError || !formation) {
          setState({ status: 'error', message: 'Formation not found' });
          return;
        }

        setState({
          status: 'valid',
          data: {
            play: play as unknown as Play,
            formation: formation as unknown as Formation,
            allowDownload: validation.allowDownload ?? true,
          },
        });
      } catch {
        setState({ status: 'error', message: 'Failed to load shared play' });
      }
    }

    if (token) {
      loadSharedPlay();
    }
  }, [token]);

  const handleDownload = useCallback(() => {
    if (state.status !== 'valid') return;

    const dataStr = JSON.stringify(
      { play: state.data.play, formation: state.data.formation },
      null,
      2,
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.data.play.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  // --- Loading State ---
  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950" data-testid="share-loading">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading shared play...</p>
        </div>
      </div>
    );
  }

  // --- Expired / Invalid Token ---
  if (state.status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950" data-testid="share-expired">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Link Expired
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            This share link has expired or is no longer valid. Ask the owner to generate a new link.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            data-testid="cta-link"
          >
            Create your own playbook
          </a>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (state.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950" data-testid="share-error">
        <div className="max-w-md mx-auto text-center p-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Something went wrong
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{state.message}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            data-testid="cta-link"
          >
            Create your own playbook
          </a>
        </div>
      </div>
    );
  }

  // --- Valid Shared Play ---
  const { play, formation, allowDownload } = state.data;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" data-testid="share-page">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {play.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {formation.name} &middot; {play.personnel} personnel
            </p>
          </div>
          <div className="flex items-center gap-3">
            {allowDownload && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                data-testid="download-button"
              >
                Download
              </button>
            )}
            <a
              href="/"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              data-testid="cta-link"
            >
              Create your own playbook
            </a>
          </div>
        </div>
      </header>

      {/* Play Visualization */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          data-testid="play-container"
        >
          {/* Read-only play renderer placeholder.
              In production, this would render <PlayRenderer> with interactive={false}.
              We render a static representation here since PlayRenderer uses Konva canvas
              which requires a full browser context. */}
          <div className="aspect-video bg-green-900 flex items-center justify-center" data-testid="play-renderer">
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold mb-2">{play.name}</h2>
              <p className="text-green-200">{formation.name}</p>
              <p className="text-green-300 text-sm mt-1">
                {play.assignments?.length ?? 0} assignments &middot;{' '}
                {play.tags?.join(', ') || 'No tags'}
              </p>
            </div>
          </div>
        </div>

        {/* Play Details */}
        {play.notes && (
          <div className="mt-6 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Notes</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{play.notes}</p>
          </div>
        )}

        {/* CTA Footer */}
        <div className="mt-8 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-3">
            Want to create and share your own plays?
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            data-testid="cta-link"
          >
            Create your own playbook
          </a>
        </div>
      </main>
    </div>
  );
}
