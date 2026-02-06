import { describe, it, expect } from 'vitest';
import { parseVideoUrl, getVideoThumbnail, formatTimestamp } from '@/lib/video';

// ============================================================
// parseVideoUrl
// ============================================================
describe('parseVideoUrl', () => {
  // --- YouTube ---
  it('parses youtube.com/watch?v=ID', () => {
    const result = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.provider).toBe('youtube');
    expect(result.id).toBe('dQw4w9WgXcQ');
    expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('parses youtu.be/ID short links', () => {
    const result = parseVideoUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result.provider).toBe('youtube');
    expect(result.id).toBe('dQw4w9WgXcQ');
    expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('parses youtube.com/embed/ID', () => {
    const result = parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(result.provider).toBe('youtube');
    expect(result.id).toBe('dQw4w9WgXcQ');
  });

  it('parses youtube URL with extra query params', () => {
    const result = parseVideoUrl(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLab',
    );
    expect(result.provider).toBe('youtube');
    expect(result.id).toBe('dQw4w9WgXcQ');
  });

  // --- Vimeo ---
  it('parses vimeo.com/ID', () => {
    const result = parseVideoUrl('https://vimeo.com/123456789');
    expect(result.provider).toBe('vimeo');
    expect(result.id).toBe('123456789');
    expect(result.embedUrl).toBe('https://player.vimeo.com/video/123456789');
  });

  it('parses player.vimeo.com/video/ID', () => {
    const result = parseVideoUrl('https://player.vimeo.com/video/987654321');
    expect(result.provider).toBe('vimeo');
    expect(result.id).toBe('987654321');
    expect(result.embedUrl).toBe('https://player.vimeo.com/video/987654321');
  });

  // --- Hudl ---
  it('parses hudl.com/video/ID', () => {
    const result = parseVideoUrl('https://www.hudl.com/video/abc123XYZ');
    expect(result.provider).toBe('hudl');
    expect(result.id).toBe('abc123XYZ');
    expect(result.embedUrl).toBe('https://www.hudl.com/embed/video/abc123XYZ');
  });

  // --- Direct video ---
  it('treats .mp4 URLs as direct', () => {
    const url = 'https://cdn.example.com/clips/play1.mp4';
    const result = parseVideoUrl(url);
    expect(result.provider).toBe('direct');
    expect(result.embedUrl).toBe(url);
    expect(result.id).toBe(url);
  });

  it('treats .webm URLs as direct', () => {
    const url = 'https://cdn.example.com/clips/play1.webm';
    const result = parseVideoUrl(url);
    expect(result.provider).toBe('direct');
  });

  it('treats unknown URLs as direct', () => {
    const url = 'https://example.com/some-video-page';
    const result = parseVideoUrl(url);
    expect(result.provider).toBe('direct');
    expect(result.embedUrl).toBe(url);
  });
});

// ============================================================
// getVideoThumbnail
// ============================================================
describe('getVideoThumbnail', () => {
  it('returns YouTube thumbnail URL', () => {
    const thumb = getVideoThumbnail('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(thumb).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('returns Vimeo thumbnail URL', () => {
    const thumb = getVideoThumbnail('https://vimeo.com/123456789');
    expect(thumb).toBe('https://vumbnail.com/123456789.jpg');
  });

  it('returns empty string for Hudl', () => {
    const thumb = getVideoThumbnail('https://www.hudl.com/video/abc123');
    expect(thumb).toBe('');
  });

  it('returns empty string for direct video URLs', () => {
    const thumb = getVideoThumbnail('https://cdn.example.com/play.mp4');
    expect(thumb).toBe('');
  });
});

// ============================================================
// formatTimestamp
// ============================================================
describe('formatTimestamp', () => {
  it('formats 0 seconds as 0:00', () => {
    expect(formatTimestamp(0)).toBe('0:00');
  });

  it('formats seconds under a minute', () => {
    expect(formatTimestamp(5)).toBe('0:05');
    expect(formatTimestamp(45)).toBe('0:45');
  });

  it('formats 83 seconds as 1:23', () => {
    expect(formatTimestamp(83)).toBe('1:23');
  });

  it('formats exactly 60 seconds as 1:00', () => {
    expect(formatTimestamp(60)).toBe('1:00');
  });

  it('formats large values with hours', () => {
    expect(formatTimestamp(3661)).toBe('1:01:01');
  });

  it('formats exactly one hour', () => {
    expect(formatTimestamp(3600)).toBe('1:00:00');
  });

  it('pads single-digit minutes in hour format', () => {
    expect(formatTimestamp(3665)).toBe('1:01:05');
  });

  it('handles negative values as 0:00', () => {
    expect(formatTimestamp(-5)).toBe('0:00');
  });

  it('floors decimal seconds', () => {
    expect(formatTimestamp(83.7)).toBe('1:23');
  });
});
