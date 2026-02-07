import { describe, it, expect } from 'vitest';
import {
  LANDING_PAGES,
  generateSEOMetadata,
  generateStructuredData,
  generateSitemap,
  generateRobotsTxt,
} from '@/lib/seo';

describe('seo', () => {
  describe('LANDING_PAGES', () => {
    it('defines 5 landing pages', () => {
      expect(Object.keys(LANDING_PAGES)).toHaveLength(5);
    });

    it('has configs for all required paths', () => {
      expect(LANDING_PAGES['/high-school']).toBeDefined();
      expect(LANDING_PAGES['/college']).toBeDefined();
      expect(LANDING_PAGES['/youth']).toBeDefined();
      expect(LANDING_PAGES['/7-on-7']).toBeDefined();
      expect(LANDING_PAGES['/coaches']).toBeDefined();
    });

    it('each landing page has title, description, and keywords', () => {
      for (const config of Object.values(LANDING_PAGES)) {
        expect(config.title).toBeTruthy();
        expect(config.description).toBeTruthy();
        expect(config.keywords.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateSEOMetadata', () => {
    it('returns metadata for a known landing page', () => {
      const meta = generateSEOMetadata('/high-school');
      expect(meta.title).toContain('High School');
      expect(meta.description).toBeTruthy();
      expect(meta.keywords.length).toBeGreaterThan(0);
      expect(meta.canonical).toContain('/high-school');
      expect(meta.ogTitle).toBeTruthy();
    });

    it('includes structured data for landing pages', () => {
      const meta = generateSEOMetadata('/college');
      expect(meta.structuredData).toBeDefined();
      expect(meta.structuredData!['@type']).toBe('WebPage');
    });

    it('includes og image for landing pages', () => {
      const meta = generateSEOMetadata('/youth');
      expect(meta.ogImage).toContain('youth.png');
    });

    it('returns default metadata for unknown pages', () => {
      const meta = generateSEOMetadata('/some-other-page');
      expect(meta.title).toContain('Big Ball Guy');
      expect(meta.keywords).toContain('football');
    });

    it('uses params for custom metadata', () => {
      const meta = generateSEOMetadata('/custom', {
        title: 'Custom Title',
        description: 'Custom description',
      });
      expect(meta.title).toBe('Custom Title');
      expect(meta.description).toBe('Custom description');
    });
  });

  describe('generateStructuredData', () => {
    it('generates SoftwareApplication schema', () => {
      const data = generateStructuredData('SoftwareApplication', {
        name: 'Big Ball Guy',
        description: 'Playbook builder',
        price: '9.99',
      });
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('SoftwareApplication');
      expect(data['name']).toBe('Big Ball Guy');
      expect(data['applicationCategory']).toBe('SportsApplication');
      expect((data['offers'] as Record<string, string>)['price']).toBe('9.99');
    });

    it('generates WebPage schema', () => {
      const data = generateStructuredData('WebPage', {
        name: 'Home',
        description: 'Main page',
        url: 'https://bigballguy.com',
      });
      expect(data['@type']).toBe('WebPage');
      expect(data['name']).toBe('Home');
      expect(data['url']).toBe('https://bigballguy.com');
    });

    it('generates Article schema', () => {
      const data = generateStructuredData('Article', {
        headline: 'How to Draw Plays',
        author: 'Coach Jones',
        datePublished: '2026-01-15',
      });
      expect(data['@type']).toBe('Article');
      expect(data['headline']).toBe('How to Draw Plays');
      expect((data['author'] as Record<string, string>)['name']).toBe('Coach Jones');
    });
  });

  describe('generateSitemap', () => {
    it('generates valid XML sitemap', () => {
      const sitemap = generateSitemap(['/', '/high-school', '/college']);
      expect(sitemap).toContain('<?xml version="1.0"');
      expect(sitemap).toContain('<urlset');
      expect(sitemap).toContain('bigballguy.com/');
      expect(sitemap).toContain('bigballguy.com/high-school');
    });

    it('gives home page priority 1.0', () => {
      const sitemap = generateSitemap(['/']);
      expect(sitemap).toContain('<priority>1.0</priority>');
    });

    it('gives other pages priority 0.8', () => {
      const sitemap = generateSitemap(['/college']);
      expect(sitemap).toContain('<priority>0.8</priority>');
    });

    it('handles empty pages array', () => {
      const sitemap = generateSitemap([]);
      expect(sitemap).toContain('<urlset');
      expect(sitemap).toContain('</urlset>');
    });
  });

  describe('generateRobotsTxt', () => {
    it('generates robots.txt with sitemap reference', () => {
      const robots = generateRobotsTxt('https://bigballguy.com/sitemap.xml');
      expect(robots).toContain('User-agent: *');
      expect(robots).toContain('Allow: /');
      expect(robots).toContain('Sitemap: https://bigballguy.com/sitemap.xml');
    });

    it('disallows API and dashboard routes', () => {
      const robots = generateRobotsTxt('https://bigballguy.com/sitemap.xml');
      expect(robots).toContain('Disallow: /api/');
      expect(robots).toContain('Disallow: /dashboard/');
    });
  });
});
