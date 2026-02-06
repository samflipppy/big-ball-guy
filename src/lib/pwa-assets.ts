/**
 * PWA Assets - Icon definitions and splash screen metadata
 *
 * Centralizes all PWA icon sizes and apple-touch-startup-image definitions
 * for iOS, Android, and favicons.
 */

export interface PWAIconDefinition {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
  platform?: 'ios' | 'android' | 'any';
}

export interface SplashScreenMeta {
  rel: string;
  href: string;
  media: string;
}

/**
 * All PWA icon definitions for different platforms and sizes.
 */
export const PWA_ICONS: PWAIconDefinition[] = [
  // Favicon
  {
    src: '/icons/favicon-32x32.png',
    sizes: '32x32',
    type: 'image/png',
    platform: 'any',
  },
  // iOS
  {
    src: '/icons/apple-touch-icon-180x180.png',
    sizes: '180x180',
    type: 'image/png',
    platform: 'ios',
    purpose: 'apple touch icon',
  },
  // Android
  {
    src: '/icons/android-chrome-192x192.png',
    sizes: '192x192',
    type: 'image/png',
    platform: 'android',
    purpose: 'any',
  },
  {
    src: '/icons/android-chrome-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    platform: 'android',
    purpose: 'any',
  },
  // Maskable icons for Android
  {
    src: '/icons/maskable-192x192.png',
    sizes: '192x192',
    type: 'image/png',
    platform: 'android',
    purpose: 'maskable',
  },
  {
    src: '/icons/maskable-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    platform: 'android',
    purpose: 'maskable',
  },
];

/**
 * Device splash screen definitions for iOS.
 * Covers common iPhone and iPad sizes.
 */
const SPLASH_SCREENS = [
  // iPhone SE, iPod Touch
  { width: 640, height: 1136, ratio: 2 },
  // iPhone 8
  { width: 750, height: 1334, ratio: 2 },
  // iPhone 8 Plus
  { width: 1242, height: 2208, ratio: 3 },
  // iPhone X / XS / 11 Pro
  { width: 1125, height: 2436, ratio: 3 },
  // iPhone XR / 11
  { width: 828, height: 1792, ratio: 2 },
  // iPhone XS Max / 11 Pro Max
  { width: 1242, height: 2688, ratio: 3 },
  // iPhone 12 mini / 13 mini
  { width: 1080, height: 2340, ratio: 3 },
  // iPhone 12 / 12 Pro / 13 / 13 Pro / 14
  { width: 1170, height: 2532, ratio: 3 },
  // iPhone 12 Pro Max / 13 Pro Max / 14 Plus
  { width: 1284, height: 2778, ratio: 3 },
  // iPhone 14 Pro
  { width: 1179, height: 2556, ratio: 3 },
  // iPhone 14 Pro Max
  { width: 1290, height: 2796, ratio: 3 },
  // iPad Mini
  { width: 1536, height: 2048, ratio: 2 },
  // iPad Air / iPad Pro 10.5"
  { width: 1668, height: 2224, ratio: 2 },
  // iPad Pro 11"
  { width: 1668, height: 2388, ratio: 2 },
  // iPad Pro 12.9"
  { width: 2048, height: 2732, ratio: 2 },
];

/**
 * Generate apple-touch-startup-image link tag metadata for all device sizes.
 * Returns an array of objects suitable for use in <link> tags.
 */
export function generateSplashScreenMeta(): SplashScreenMeta[] {
  return SPLASH_SCREENS.map(({ width, height, ratio }) => {
    const deviceWidth = width / ratio;
    const deviceHeight = height / ratio;

    return {
      rel: 'apple-touch-startup-image',
      href: `/splash/splash-${width}x${height}.png`,
      media: `(device-width: ${deviceWidth}px) and (device-height: ${deviceHeight}px) and (-webkit-device-pixel-ratio: ${ratio})`,
    };
  });
}

/**
 * Get icons filtered by platform.
 */
export function getIconsByPlatform(platform: 'ios' | 'android' | 'any'): PWAIconDefinition[] {
  return PWA_ICONS.filter((icon) => icon.platform === platform);
}

/**
 * Get the apple touch icon (180x180).
 */
export function getAppleTouchIcon(): PWAIconDefinition | undefined {
  return PWA_ICONS.find(
    (icon) => icon.platform === 'ios' && icon.sizes === '180x180',
  );
}

/**
 * Get manifest-compatible icon entries (for web app manifest).
 */
export function getManifestIcons(): Pick<PWAIconDefinition, 'src' | 'sizes' | 'type' | 'purpose'>[] {
  return PWA_ICONS.filter(
    (icon) => icon.platform === 'android' || icon.platform === 'any',
  ).map(({ src, sizes, type, purpose }) => ({
    src,
    sizes,
    type,
    purpose: purpose ?? 'any',
  }));
}
