import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import VideoClipEmbed from '@/components/playbook/VideoClipEmbed';
import type { VideoTimestamp } from '@/components/playbook/VideoClipEmbed';

// ============================================================
// Tests
// ============================================================
describe('VideoClipEmbed', () => {
  const onTimestampClick = vi.fn();

  beforeEach(() => {
    onTimestampClick.mockClear();
  });

  // --- Container ---
  it('renders the main container', () => {
    render(<VideoClipEmbed videoUrl="https://www.youtube.com/watch?v=abc12345678" />);
    expect(screen.getByTestId('video-clip-embed')).toBeInTheDocument();
  });

  it('renders the video player container', () => {
    render(<VideoClipEmbed videoUrl="https://www.youtube.com/watch?v=abc12345678" />);
    expect(screen.getByTestId('video-player-container')).toBeInTheDocument();
  });

  // --- YouTube ---
  it('renders YouTube embed for YouTube URLs', () => {
    render(<VideoClipEmbed videoUrl="https://www.youtube.com/watch?v=abc12345678" />);
    expect(screen.getByTestId('youtube-embed')).toBeInTheDocument();
  });

  it('shows YouTube provider badge', () => {
    render(<VideoClipEmbed videoUrl="https://www.youtube.com/watch?v=abc12345678" />);
    const badge = screen.getByTestId('provider-badge');
    expect(badge.textContent).toBe('YouTube');
  });

  // --- Vimeo ---
  it('renders Vimeo embed for Vimeo URLs', () => {
    render(<VideoClipEmbed videoUrl="https://vimeo.com/123456789" />);
    expect(screen.getByTestId('vimeo-embed')).toBeInTheDocument();
  });

  it('shows Vimeo provider badge', () => {
    render(<VideoClipEmbed videoUrl="https://vimeo.com/123456789" />);
    const badge = screen.getByTestId('provider-badge');
    expect(badge.textContent).toBe('Vimeo');
  });

  // --- Hudl ---
  it('renders Hudl embed for Hudl URLs', () => {
    render(<VideoClipEmbed videoUrl="https://www.hudl.com/video/abc123" />);
    expect(screen.getByTestId('hudl-embed')).toBeInTheDocument();
  });

  it('shows Hudl provider badge', () => {
    render(<VideoClipEmbed videoUrl="https://www.hudl.com/video/abc123" />);
    const badge = screen.getByTestId('provider-badge');
    expect(badge.textContent).toBe('Hudl');
  });

  // --- Direct video ---
  it('renders direct video element for mp4 URLs', () => {
    render(<VideoClipEmbed videoUrl="https://cdn.example.com/play.mp4" />);
    expect(screen.getByTestId('direct-video')).toBeInTheDocument();
  });

  it('shows Video provider badge for direct URLs', () => {
    render(<VideoClipEmbed videoUrl="https://cdn.example.com/play.mp4" />);
    const badge = screen.getByTestId('provider-badge');
    expect(badge.textContent).toBe('Video');
  });

  // --- Timestamps ---
  it('does not render timestamp list when no timestamps provided', () => {
    render(<VideoClipEmbed videoUrl="https://www.youtube.com/watch?v=abc12345678" />);
    expect(screen.queryByTestId('timestamp-list')).not.toBeInTheDocument();
  });

  it('renders timestamp list when timestamps are provided', () => {
    const timestamps: VideoTimestamp[] = [
      { seconds: 30, label: 'Pre-snap read' },
      { seconds: 45, label: 'Release point' },
    ];

    render(
      <VideoClipEmbed
        videoUrl="https://www.youtube.com/watch?v=abc12345678"
        timestamps={timestamps}
      />,
    );

    expect(screen.getByTestId('timestamp-list')).toBeInTheDocument();
  });

  it('renders individual timestamp buttons', () => {
    const timestamps: VideoTimestamp[] = [
      { seconds: 30, label: 'Pre-snap read' },
      { seconds: 83, label: 'Post-route break' },
    ];

    render(
      <VideoClipEmbed
        videoUrl="https://www.youtube.com/watch?v=abc12345678"
        timestamps={timestamps}
      />,
    );

    expect(screen.getByTestId('timestamp-0')).toBeInTheDocument();
    expect(screen.getByTestId('timestamp-1')).toBeInTheDocument();
  });

  it('shows formatted time in timestamp buttons', () => {
    const timestamps: VideoTimestamp[] = [
      { seconds: 83, label: 'Route break' },
    ];

    render(
      <VideoClipEmbed
        videoUrl="https://www.youtube.com/watch?v=abc12345678"
        timestamps={timestamps}
      />,
    );

    const btn = screen.getByTestId('timestamp-0');
    expect(btn.textContent).toContain('1:23');
    expect(btn.textContent).toContain('Route break');
  });

  it('calls onTimestampClick when a timestamp is clicked', () => {
    const timestamps: VideoTimestamp[] = [
      { seconds: 30, label: 'Pre-snap' },
    ];

    render(
      <VideoClipEmbed
        videoUrl="https://www.youtube.com/watch?v=abc12345678"
        timestamps={timestamps}
        onTimestampClick={onTimestampClick}
      />,
    );

    fireEvent.click(screen.getByTestId('timestamp-0'));
    expect(onTimestampClick).toHaveBeenCalledWith(30);
  });

  it('calls onTimestampClick with correct seconds for multiple timestamps', () => {
    const timestamps: VideoTimestamp[] = [
      { seconds: 10, label: 'Start' },
      { seconds: 60, label: 'Middle' },
      { seconds: 120, label: 'End' },
    ];

    render(
      <VideoClipEmbed
        videoUrl="https://www.youtube.com/watch?v=abc12345678"
        timestamps={timestamps}
        onTimestampClick={onTimestampClick}
      />,
    );

    fireEvent.click(screen.getByTestId('timestamp-1'));
    expect(onTimestampClick).toHaveBeenCalledWith(60);

    fireEvent.click(screen.getByTestId('timestamp-2'));
    expect(onTimestampClick).toHaveBeenCalledWith(120);
  });

  // --- className prop ---
  it('applies className prop', () => {
    render(
      <VideoClipEmbed
        videoUrl="https://www.youtube.com/watch?v=abc12345678"
        className="my-video-class"
      />,
    );
    expect(screen.getByTestId('video-clip-embed').className).toContain('my-video-class');
  });

  // --- Empty timestamps array ---
  it('does not show timestamps when array is empty', () => {
    render(
      <VideoClipEmbed
        videoUrl="https://www.youtube.com/watch?v=abc12345678"
        timestamps={[]}
      />,
    );
    expect(screen.queryByTestId('timestamp-list')).not.toBeInTheDocument();
  });
});
