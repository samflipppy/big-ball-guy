import { describe, it, expect } from 'vitest';
import {
  PWA_ICONS,
  generateSplashScreenMeta,
  getIconsByPlatform,
  getAppleTouchIcon,
  getManifestIcons,
} from '@/lib/pwa-assets';

describe('pwa-assets', () => {
  describe('PWA_ICONS', () => {
    it('contains a 32x32 favicon', () => {
      const favicon = PWA_ICONS.find((icon) => icon.sizes === '32x32');
      expect(favicon).toBeDefined();
      expect(favicon!.type).toBe('image/png');
      expect(favicon!.platform).toBe('any');
    });

    it('contains a 180x180 iOS icon', () => {
      const iosIcon = PWA_ICONS.find(
        (icon) => icon.sizes === '180x180' && icon.platform === 'ios',
      );
      expect(iosIcon).toBeDefined();
      expect(iosIcon!.type).toBe('image/png');
    });

    it('contains 192x192 Android icon', () => {
      const androidIcon = PWA_ICONS.find(
        (icon) => icon.sizes === '192x192' && icon.platform === 'android' && icon.purpose === 'any',
      );
      expect(androidIcon).toBeDefined();
      expect(androidIcon!.type).toBe('image/png');
    });

    it('contains 512x512 Android icon', () => {
      const androidIcon = PWA_ICONS.find(
        (icon) => icon.sizes === '512x512' && icon.platform === 'android' && icon.purpose === 'any',
      );
      expect(androidIcon).toBeDefined();
    });

    it('contains maskable icons for Android', () => {
      const maskable = PWA_ICONS.filter((icon) => icon.purpose === 'maskable');
      expect(maskable.length).toBeGreaterThanOrEqual(2);
      expect(maskable.some((icon) => icon.sizes === '192x192')).toBe(true);
      expect(maskable.some((icon) => icon.sizes === '512x512')).toBe(true);
    });

    it('all icons have src, sizes, and type', () => {
      PWA_ICONS.forEach((icon) => {
        expect(icon.src).toBeTruthy();
        expect(icon.sizes).toMatch(/^\d+x\d+$/);
        expect(icon.type).toBe('image/png');
      });
    });
  });

  describe('generateSplashScreenMeta', () => {
    it('returns an array of splash screen definitions', () => {
      const meta = generateSplashScreenMeta();
      expect(Array.isArray(meta)).toBe(true);
      expect(meta.length).toBeGreaterThan(0);
    });

    it('each entry has rel, href, and media', () => {
      const meta = generateSplashScreenMeta();
      meta.forEach((entry) => {
        expect(entry.rel).toBe('apple-touch-startup-image');
        expect(entry.href).toMatch(/^\/splash\/splash-\d+x\d+\.png$/);
        expect(entry.media).toContain('device-width');
        expect(entry.media).toContain('device-height');
        expect(entry.media).toContain('-webkit-device-pixel-ratio');
      });
    });

    it('includes iPhone SE splash screen', () => {
      const meta = generateSplashScreenMeta();
      const se = meta.find((m) => m.href.includes('640x1136'));
      expect(se).toBeDefined();
    });

    it('includes iPad Pro 12.9" splash screen', () => {
      const meta = generateSplashScreenMeta();
      const iPadPro = meta.find((m) => m.href.includes('2048x2732'));
      expect(iPadPro).toBeDefined();
    });

    it('includes iPhone 14 Pro splash screen', () => {
      const meta = generateSplashScreenMeta();
      const iphone14Pro = meta.find((m) => m.href.includes('1179x2556'));
      expect(iphone14Pro).toBeDefined();
    });

    it('computes correct device dimensions from pixel ratios', () => {
      const meta = generateSplashScreenMeta();
      // iPhone SE: 640x1136 at 2x = 320x568
      const se = meta.find((m) => m.href.includes('640x1136'));
      expect(se!.media).toContain('device-width: 320px');
      expect(se!.media).toContain('device-height: 568px');
      expect(se!.media).toContain('-webkit-device-pixel-ratio: 2');
    });
  });

  describe('getIconsByPlatform', () => {
    it('returns only iOS icons', () => {
      const iosIcons = getIconsByPlatform('ios');
      expect(iosIcons.length).toBeGreaterThan(0);
      iosIcons.forEach((icon) => {
        expect(icon.platform).toBe('ios');
      });
    });

    it('returns only Android icons', () => {
      const androidIcons = getIconsByPlatform('android');
      expect(androidIcons.length).toBeGreaterThan(0);
      androidIcons.forEach((icon) => {
        expect(icon.platform).toBe('android');
      });
    });

    it('returns only generic icons for "any"', () => {
      const anyIcons = getIconsByPlatform('any');
      expect(anyIcons.length).toBeGreaterThan(0);
      anyIcons.forEach((icon) => {
        expect(icon.platform).toBe('any');
      });
    });
  });

  describe('getAppleTouchIcon', () => {
    it('returns the 180x180 iOS icon', () => {
      const icon = getAppleTouchIcon();
      expect(icon).toBeDefined();
      expect(icon!.sizes).toBe('180x180');
      expect(icon!.platform).toBe('ios');
    });
  });

  describe('getManifestIcons', () => {
    it('returns icons suitable for web app manifest', () => {
      const icons = getManifestIcons();
      expect(icons.length).toBeGreaterThan(0);

      icons.forEach((icon) => {
        expect(icon).toHaveProperty('src');
        expect(icon).toHaveProperty('sizes');
        expect(icon).toHaveProperty('type');
        expect(icon).toHaveProperty('purpose');
      });
    });

    it('does not include iOS-only icons', () => {
      const icons = getManifestIcons();
      const iosSrc = PWA_ICONS.filter((i) => i.platform === 'ios').map((i) => i.src);
      icons.forEach((icon) => {
        expect(iosSrc).not.toContain(icon.src);
      });
    });

    it('includes both regular and maskable icons', () => {
      const icons = getManifestIcons();
      const purposes = icons.map((i) => i.purpose);
      expect(purposes).toContain('any');
      expect(purposes).toContain('maskable');
    });
  });
});
