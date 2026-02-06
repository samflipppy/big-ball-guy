'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  startListening,
  stopListening,
  parsePlayDescription,
  isSpeechRecognitionAvailable,
  type ParsedPlay,
} from '@/lib/voice-recognition';

// ---- Types ----

export interface VoiceInputProps {
  onPlayParsed: (play: ParsedPlay) => void;
  className?: string;
}

// ---- Component ----

export function VoiceInput({ onPlayParsed, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedPlay, setParsedPlay] = useState<ParsedPlay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable] = useState(() => isSpeechRecognitionAvailable());
  const transcriptRef = useRef('');

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const handleToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      setIsListening(false);
      // Parse the final transcript
      if (transcriptRef.current.trim()) {
        const result = parsePlayDescription(transcriptRef.current);
        setParsedPlay(result);
      }
    } else {
      setError(null);
      setTranscript('');
      setParsedPlay(null);
      transcriptRef.current = '';

      const started = startListening({
        onTranscript: (text, isFinal) => {
          if (isFinal) {
            transcriptRef.current += text;
            setTranscript(transcriptRef.current);
            const result = parsePlayDescription(transcriptRef.current);
            setParsedPlay(result);
          } else {
            setTranscript(transcriptRef.current + text);
          }
        },
        onError: (errMsg) => {
          setError(errMsg);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });

      if (started) {
        setIsListening(true);
      }
    }
  }, [isListening]);

  const handleApply = useCallback(() => {
    if (parsedPlay) {
      onPlayParsed(parsedPlay);
      setTranscript('');
      setParsedPlay(null);
      transcriptRef.current = '';
    }
  }, [parsedPlay, onPlayParsed]);

  const handleClear = useCallback(() => {
    setTranscript('');
    setParsedPlay(null);
    transcriptRef.current = '';
    setError(null);
  }, []);

  // Speech recognition not available
  if (!isAvailable) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
          className,
        )}
        data-testid="voice-input"
        role="status"
      >
        <MicOffIcon className="h-4 w-4" />
        <span>Voice input is not supported in this browser</span>
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="voice-input"
    >
      {/* Mic toggle + status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full transition-all',
            isListening
              ? 'animate-pulse bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
          )}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
          data-testid="mic-button"
        >
          {isListening ? (
            <MicActiveIcon className="h-5 w-5" />
          ) : (
            <MicIcon className="h-5 w-5" />
          )}
        </button>

        <div className="flex-1">
          {isListening && (
            <div className="flex items-center gap-2">
              <WaveformAnimation />
              <span className="text-sm font-medium text-red-500" data-testid="listening-indicator">
                Listening...
              </span>
            </div>
          )}
          {!isListening && !transcript && !error && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Click the microphone to describe a play
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
          role="alert"
          data-testid="voice-error"
        >
          {error}
        </div>
      )}

      {/* Live transcript */}
      {transcript && (
        <div
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          data-testid="transcript"
        >
          <span className="font-medium text-zinc-500 dark:text-zinc-400">Heard: </span>
          {transcript}
        </div>
      )}

      {/* Parsed result preview */}
      {parsedPlay && (
        <div
          className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/30"
          data-testid="parsed-result"
        >
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            I heard:{' '}
            {[parsedPlay.formationName, parsedPlay.conceptName].filter(Boolean).join(', ') ||
              'Could not identify play'}
          </p>
          {parsedPlay.routes.length > 0 && (
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Routes: {parsedPlay.routes.map((r) => `${r.position} ${r.routeType}`).join(', ')}
            </div>
          )}
          {parsedPlay.blockingScheme && (
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Blocking: {parsedPlay.blockingScheme}
            </div>
          )}
          <div className="text-xs text-blue-500 dark:text-blue-500">
            Confidence: {Math.round(parsedPlay.confidence * 100)}%
          </div>
        </div>
      )}

      {/* Action buttons */}
      {parsedPlay && !isListening && (
        <div className="flex items-center gap-2" data-testid="action-buttons">
          <Button
            size="sm"
            onClick={handleApply}
            data-testid="apply-button"
          >
            Apply to Canvas
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            data-testid="clear-button"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}

// ---- Icon components ----

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a4 4 0 00-4 4v6a4 4 0 008 0V5a4 4 0 00-4-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1M12 18.5V23M8 23h8" />
    </svg>
  );
}

function MicActiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a4 4 0 00-4 4v6a4 4 0 008 0V5a4 4 0 00-4-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1M12 18.5V23M8 23h8" />
    </svg>
  );
}

function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 2l20 20M9 9v2a3 3 0 005.12 2.12M15 9.34V5a3 3 0 00-5.94-.6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16.95A7 7 0 015 12v-2m14 0v2c0 .76-.12 1.5-.35 2.18M12 19v4m-4 0h8" />
    </svg>
  );
}

function WaveformAnimation() {
  return (
    <div className="flex items-center gap-0.5" data-testid="waveform" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-0.5 rounded-full bg-red-500"
          style={{
            height: '16px',
            animation: `waveform 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes waveform {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

export default VoiceInput;
