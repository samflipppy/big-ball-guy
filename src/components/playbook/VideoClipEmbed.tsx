'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { parseVideoUrl, formatTimestamp, type VideoProvider } from '@/lib/video';

// --- Types ---

export interface VideoTimestamp {
  seconds: number;
  label: string;
}

export interface VideoClipEmbedProps {
  videoUrl: string;
  timestamps?: VideoTimestamp[];
  onTimestampClick?: (seconds: number) => void;
  className?: string;
}

// --- Sub-components ---

function YouTubeEmbed({
  embedUrl,
  startTime,
}: {
  embedUrl: string;
  startTime?: number;
}) {
  const src = startTime ? `${embedUrl}?start=${startTime}&autoplay=1` : embedUrl;
  return (
    <iframe
      src={src}
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="absolute inset-0 h-full w-full"
      data-testid="youtube-embed"
    />
  );
}

function VimeoEmbed({
  embedUrl,
  startTime,
}: {
  embedUrl: string;
  startTime?: number;
}) {
  const src = startTime ? `${embedUrl}#t=${startTime}s` : embedUrl;
  return (
    <iframe
      src={src}
      title="Vimeo video player"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      className="absolute inset-0 h-full w-full"
      data-testid="vimeo-embed"
    />
  );
}

function HudlEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <iframe
      src={embedUrl}
      title="Hudl video player"
      allowFullScreen
      className="absolute inset-0 h-full w-full"
      data-testid="hudl-embed"
    />
  );
}

function DirectVideoEmbed({
  url,
  videoRef,
}: {
  url: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  return (
    <video
      ref={videoRef}
      src={url}
      controls
      className="absolute inset-0 h-full w-full object-contain bg-black"
      data-testid="direct-video"
    >
      <track kind="captions" />
    </video>
  );
}

// --- Main Component ---

export default function VideoClipEmbed({
  videoUrl,
  timestamps,
  onTimestampClick,
  className,
}: VideoClipEmbedProps) {
  const [currentTime, setCurrentTime] = useState<number | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const parsed = useMemo(() => parseVideoUrl(videoUrl), [videoUrl]);

  const handleTimestampClick = useCallback(
    (seconds: number) => {
      setCurrentTime(seconds);

      // For direct video, we can seek the <video> element
      if (parsed.provider === 'direct' && videoRef.current) {
        videoRef.current.currentTime = seconds;
        videoRef.current.play().catch(() => {
          // autoplay may be blocked
        });
      }

      onTimestampClick?.(seconds);
    },
    [parsed.provider, onTimestampClick],
  );

  const renderEmbed = useCallback(() => {
    switch (parsed.provider) {
      case 'youtube':
        return <YouTubeEmbed embedUrl={parsed.embedUrl} startTime={currentTime} />;
      case 'vimeo':
        return <VimeoEmbed embedUrl={parsed.embedUrl} startTime={currentTime} />;
      case 'hudl':
        return <HudlEmbed embedUrl={parsed.embedUrl} />;
      case 'direct':
        return <DirectVideoEmbed url={parsed.embedUrl} videoRef={videoRef} />;
    }
  }, [parsed, currentTime]);

  return (
    <div
      className={cn('flex flex-col gap-3', className)}
      data-testid="video-clip-embed"
    >
      {/* Video player */}
      <div
        className="relative w-full overflow-hidden rounded-lg bg-black"
        style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}
        data-testid="video-player-container"
      >
        {renderEmbed()}
      </div>

      {/* Provider badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            parsed.provider === 'youtube' && 'bg-red-100 text-red-700',
            parsed.provider === 'vimeo' && 'bg-blue-100 text-blue-700',
            parsed.provider === 'hudl' && 'bg-orange-100 text-orange-700',
            parsed.provider === 'direct' && 'bg-zinc-100 text-zinc-700',
          )}
          data-testid="provider-badge"
        >
          {parsed.provider === 'youtube' && 'YouTube'}
          {parsed.provider === 'vimeo' && 'Vimeo'}
          {parsed.provider === 'hudl' && 'Hudl'}
          {parsed.provider === 'direct' && 'Video'}
        </span>
      </div>

      {/* Timestamps */}
      {timestamps && timestamps.length > 0 && (
        <div
          className="flex flex-col gap-1"
          data-testid="timestamp-list"
        >
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Timestamps
          </h4>
          <div className="flex flex-wrap gap-2">
            {timestamps.map((ts, idx) => (
              <button
                key={idx}
                onClick={() => handleTimestampClick(ts.seconds)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5',
                  'text-xs font-medium transition-colors',
                  'border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700',
                )}
                data-testid={`timestamp-${idx}`}
              >
                <span className="font-mono text-blue-600">
                  {formatTimestamp(ts.seconds)}
                </span>
                <span>{ts.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
