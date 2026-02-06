import { describe, it, expect } from 'vitest';
import {
  generateEmbedCode,
  generateOEmbedResponse,
  generateIframeUrl,
  type EmbedOptions,
} from '@/lib/embed-generator';

describe('embed-generator', () => {
  describe('generateIframeUrl', () => {
    it('generates a URL containing the play ID', () => {
      const url = generateIframeUrl('play-123');
      expect(url).toContain('/embed/play/play-123');
    });

    it('includes the light theme by default', () => {
      const url = generateIframeUrl('play-1');
      expect(url).toContain('theme=light');
    });

    it('uses dark theme when specified', () => {
      const url = generateIframeUrl('play-1', { theme: 'dark' });
      expect(url).toContain('theme=dark');
    });

    it('includes controls=1 by default', () => {
      const url = generateIframeUrl('play-1');
      expect(url).toContain('controls=1');
    });

    it('sets controls=0 when showControls is false', () => {
      const url = generateIframeUrl('play-1', { showControls: false });
      expect(url).toContain('controls=0');
    });

    it('includes autoplay=0 by default', () => {
      const url = generateIframeUrl('play-1');
      expect(url).toContain('autoplay=0');
    });

    it('sets autoplay=1 when autoPlay is true', () => {
      const url = generateIframeUrl('play-1', { autoPlay: true });
      expect(url).toContain('autoplay=1');
    });

    it('throws when play ID is empty', () => {
      expect(() => generateIframeUrl('')).toThrow('Play ID is required');
    });

    it('throws when play ID is whitespace only', () => {
      expect(() => generateIframeUrl('   ')).toThrow('Play ID is required');
    });
  });

  describe('generateEmbedCode', () => {
    it('returns an iframe HTML string', () => {
      const code = generateEmbedCode('play-123');
      expect(code).toContain('<iframe');
      expect(code).toContain('</iframe>');
    });

    it('includes the iframe URL with the play ID', () => {
      const code = generateEmbedCode('play-abc');
      expect(code).toContain('/embed/play/play-abc');
    });

    it('uses default dimensions of 640x400', () => {
      const code = generateEmbedCode('play-1');
      expect(code).toContain('width="640"');
      expect(code).toContain('height="400"');
    });

    it('uses custom dimensions when specified', () => {
      const code = generateEmbedCode('play-1', { width: 800, height: 500 });
      expect(code).toContain('width="800"');
      expect(code).toContain('height="500"');
    });

    it('includes frameborder, allowfullscreen, and loading attributes', () => {
      const code = generateEmbedCode('play-1');
      expect(code).toContain('frameborder="0"');
      expect(code).toContain('allowfullscreen');
      expect(code).toContain('loading="lazy"');
    });

    it('includes border-radius styling', () => {
      const code = generateEmbedCode('play-1');
      expect(code).toContain('border-radius: 8px');
    });

    it('includes an accessible title attribute', () => {
      const code = generateEmbedCode('play-1');
      expect(code).toContain('title="Play Diagram"');
    });

    it('throws when play ID is empty', () => {
      expect(() => generateEmbedCode('')).toThrow('Play ID is required');
    });
  });

  describe('generateOEmbedResponse', () => {
    it('returns an OEmbed response with type "rich"', () => {
      const response = generateOEmbedResponse('play-1', 'https://example.com/play/1');
      expect(response.type).toBe('rich');
    });

    it('returns version "1.0"', () => {
      const response = generateOEmbedResponse('play-1', 'https://example.com/play/1');
      expect(response.version).toBe('1.0');
    });

    it('includes the play ID in the title', () => {
      const response = generateOEmbedResponse('play-xyz', 'https://example.com');
      expect(response.title).toContain('play-xyz');
    });

    it('includes provider_name and provider_url', () => {
      const response = generateOEmbedResponse('play-1', 'https://example.com');
      expect(response.provider_name).toBe('Playbook');
      expect(response.provider_url).toBe('https://app.playbook.com');
    });

    it('includes the embed HTML in the response', () => {
      const response = generateOEmbedResponse('play-1', 'https://example.com');
      expect(response.html).toContain('<iframe');
      expect(response.html).toContain('/embed/play/play-1');
    });

    it('uses default dimensions', () => {
      const response = generateOEmbedResponse('play-1', 'https://example.com');
      expect(response.width).toBe(640);
      expect(response.height).toBe(400);
    });

    it('uses custom dimensions when specified', () => {
      const response = generateOEmbedResponse('play-1', 'https://example.com', {
        width: 1024,
        height: 768,
      });
      expect(response.width).toBe(1024);
      expect(response.height).toBe(768);
    });

    it('includes a thumbnail URL', () => {
      const response = generateOEmbedResponse('play-1', 'https://example.com');
      expect(response.thumbnail_url).toContain('/api/plays/play-1/thumbnail');
    });

    it('throws when play ID is empty', () => {
      expect(() => generateOEmbedResponse('', 'https://example.com')).toThrow('Play ID is required');
    });

    it('respects theme and controls options', () => {
      const response = generateOEmbedResponse('play-1', 'https://example.com', {
        theme: 'dark',
        showControls: false,
      });
      expect(response.html).toContain('theme=dark');
      expect(response.html).toContain('controls=0');
    });
  });
});
