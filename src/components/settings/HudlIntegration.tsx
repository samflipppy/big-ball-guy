'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { HudlClient, type HudlPlay } from '@/lib/hudl';

// ---- Types ----

export interface HudlIntegrationProps {
  onConnect: (client: HudlClient) => void;
  isConnected: boolean;
  className?: string;
}

// ---- Component ----

export function HudlIntegration({ onConnect, isConnected, className }: HudlIntegrationProps) {
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client] = useState(() => new HudlClient());
  const [showImportModal, setShowImportModal] = useState(false);
  const [plays, setPlays] = useState<HudlPlay[]>([]);
  const [loadingPlays, setLoadingPlays] = useState(false);

  const inputClasses =
    'block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500';

  const labelClasses = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';

  const handleConnect = useCallback(async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key.');
      return;
    }

    setError(null);
    setConnecting(true);

    try {
      const success = await client.authenticate(apiKey);
      if (success) {
        onConnect(client);
      } else {
        setError('Authentication failed. Please check your API key.');
      }
    } catch {
      setError('Failed to connect to Hudl. Please try again.');
    } finally {
      setConnecting(false);
    }
  }, [apiKey, client, onConnect]);

  const handleDisconnect = useCallback(() => {
    client.disconnect();
    setApiKey('');
    setPlays([]);
    setShowImportModal(false);
    // Trigger reconnect callback with a disconnected client
    onConnect(client);
  }, [client, onConnect]);

  const handleImportPlays = useCallback(async () => {
    setShowImportModal(true);
    setLoadingPlays(true);
    try {
      const teamPlays = await client.getTeamPlays('default-team');
      setPlays(teamPlays);
    } catch {
      setError('Failed to load plays from Hudl.');
    } finally {
      setLoadingPlays(false);
    }
  }, [client]);

  const handleCloseModal = useCallback(() => {
    setShowImportModal(false);
  }, []);

  return (
    <div className={cn('space-y-6', className)} data-testid="hudl-integration">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Hudl Integration
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Connect your Hudl account to import and export plays.
          </p>
        </div>
        <ConnectionStatus isConnected={isConnected} />
      </div>

      {/* API Key input */}
      {!isConnected && (
        <div>
          <label htmlFor="hudl-api-key" className={labelClasses}>
            API Key
          </label>
          <input
            id="hudl-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError(null);
            }}
            placeholder="Enter your Hudl API key"
            className={inputClasses}
            data-testid="api-key-input"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
          role="alert"
          data-testid="hudl-error"
        >
          {error}
        </div>
      )}

      {/* Connect / Disconnect buttons */}
      <div className="flex items-center gap-3">
        {!isConnected ? (
          <Button
            onClick={handleConnect}
            loading={connecting}
            disabled={!apiKey.trim()}
            data-testid="connect-button"
          >
            Connect
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={handleImportPlays}
              data-testid="import-plays-button"
            >
              Import Plays
            </Button>
            <Button
              variant="danger"
              onClick={handleDisconnect}
              data-testid="disconnect-button"
            >
              Disconnect
            </Button>
          </>
        )}
      </div>

      {/* Import modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          data-testid="import-modal"
          role="dialog"
          aria-label="Import plays from Hudl"
        >
          <div className="mx-4 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Import from Hudl
              </h4>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                aria-label="Close modal"
                data-testid="close-modal-button"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingPlays ? (
              <div className="py-8 text-center text-sm text-zinc-500" data-testid="loading-plays">
                Loading plays...
              </div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto" data-testid="plays-list">
                {plays.map((play) => (
                  <HudlPlayCard key={play.id} play={play} />
                ))}
                {plays.length === 0 && (
                  <div className="py-4 text-center text-sm text-zinc-500">
                    No plays found.
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" onClick={handleCloseModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Sub-components ----

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div
      className="flex items-center gap-2"
      data-testid="connection-status"
    >
      <div
        className={cn(
          'h-2.5 w-2.5 rounded-full',
          isConnected ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600',
        )}
      />
      <span className={cn(
        'text-sm font-medium',
        isConnected
          ? 'text-green-600 dark:text-green-400'
          : 'text-zinc-500 dark:text-zinc-400',
      )}>
        {isConnected ? 'Connected' : 'Not connected'}
      </span>
    </div>
  );
}

function HudlPlayCard({ play }: { play: HudlPlay }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      data-testid={`hudl-play-${play.id}`}
    >
      <div>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{play.name}</div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{play.formation}</span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="capitalize">{play.playType}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {play.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default HudlIntegration;
