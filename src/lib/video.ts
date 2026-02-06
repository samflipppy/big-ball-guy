// ============================================================
// Video utilities — parse URLs, thumbnails, timestamp formatting
// ============================================================

export type VideoProvider = 'youtube' | 'hudl' | 'vimeo' | 'direct';

export interface ParsedVideo {
  provider: VideoProvider;
  embedUrl: string;
  id: string;
}

/**
 * Parse a video URL and return the provider, embeddable URL, and video ID.
 *
 * Supported formats:
 *  - YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 *  - Vimeo:   vimeo.com/ID, player.vimeo.com/video/ID
 *  - Hudl:    hudl.com/video/ID
 *  - Direct:  any .mp4 / .webm / .mov URL
 */
export function parseVideoUrl(url: string): ParsedVideo {
  // YouTube
  const ytRegex =
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${id}`,
      id,
    };
  }

  // Vimeo
  const vimeoRegex =
    /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${id}`,
      id,
    };
  }

  // Hudl
  const hudlRegex = /hudl\.com\/video\/([A-Za-z0-9]+)/;
  const hudlMatch = url.match(hudlRegex);
  if (hudlMatch) {
    const id = hudlMatch[1];
    return {
      provider: 'hudl',
      embedUrl: `https://www.hudl.com/embed/video/${id}`,
      id,
    };
  }

  // Direct video (mp4, webm, mov)
  return {
    provider: 'direct',
    embedUrl: url,
    id: url,
  };
}

/**
 * Get a thumbnail URL for a video. Only YouTube and Vimeo provide known
 * thumbnail URL patterns. For Hudl and direct videos we return an empty string.
 */
export function getVideoThumbnail(url: string): string {
  const parsed = parseVideoUrl(url);

  switch (parsed.provider) {
    case 'youtube':
      return `https://img.youtube.com/vi/${parsed.id}/hqdefault.jpg`;
    case 'vimeo':
      // Vimeo thumbnails require an API call; return the oEmbed proxy pattern
      return `https://vumbnail.com/${parsed.id}.jpg`;
    case 'hudl':
      return '';
    case 'direct':
      return '';
  }
}

/**
 * Format a number of seconds into a human-readable timestamp string.
 *
 * Examples:
 *  - 0   → '0:00'
 *  - 83  → '1:23'
 *  - 3661 → '1:01:01'
 */
export function formatTimestamp(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
