/**
 * SEO Landing Pages (#318)
 *
 * Generates SEO metadata, structured data (JSON-LD),
 * sitemaps, and robots.txt for targeted landing pages.
 */

// ---- Types ----

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  ogTitle?: string;
  canonical?: string;
  structuredData?: Record<string, unknown>;
}

export type StructuredDataType = 'SoftwareApplication' | 'WebPage' | 'Article';

export interface LandingPageConfig {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  heading: string;
  subheading: string;
}

// ---- Constants ----

export const LANDING_PAGES: Record<string, LandingPageConfig> = {
  '/high-school': {
    path: '/high-school',
    title: 'Football Playbook Software for High School Coaches | Big Ball Guy',
    description:
      'Create and share football plays with your high school coaching staff. Easy-to-use playbook builder with formations, game plans, and practice scripts.',
    keywords: ['high school football', 'playbook software', 'football plays', 'coaching tool', 'high school coaching'],
    heading: 'Built for High School Football Programs',
    subheading: 'Design plays, game plans, and practice scripts that your players can actually learn.',
  },
  '/college': {
    path: '/college',
    title: 'College Football Playbook Builder | Big Ball Guy',
    description:
      'Advanced playbook software for college football programs. Real-time collaboration, scouting integration, and professional-grade play design.',
    keywords: ['college football', 'playbook builder', 'football software', 'coaching staff', 'play design'],
    heading: 'College-Level Playbook Software',
    subheading: 'Collaborate with your entire coaching staff in real-time.',
  },
  '/youth': {
    path: '/youth',
    title: 'Youth Football Playbook App | Big Ball Guy',
    description:
      'Simple football play designer for youth and pee-wee coaches. Age-appropriate formations and easy play sharing with parents and players.',
    keywords: ['youth football', 'pee-wee football', 'play designer', 'youth coaching', 'simple playbook'],
    heading: 'Perfect for Youth Football Coaches',
    subheading: 'Keep it simple with age-appropriate formations and plays.',
  },
  '/7-on-7': {
    path: '/7-on-7',
    title: '7-on-7 Football Play Designer | Big Ball Guy',
    description:
      'Design passing plays and route concepts for 7-on-7 football. Specialized formations and quick play sharing for tournament day.',
    keywords: ['7-on-7 football', '7v7', 'passing plays', 'route concepts', 'tournament football'],
    heading: 'Dominate 7-on-7 Tournaments',
    subheading: 'Purpose-built route concepts and formations for 7-on-7 football.',
  },
  '/coaches': {
    path: '/coaches',
    title: 'Digital Playbook for Football Coaches | Big Ball Guy',
    description:
      'Replace your whiteboard with a digital playbook. Draw plays, build game plans, create practice scripts, and share everything with your staff.',
    keywords: ['football coaches', 'digital playbook', 'play drawing', 'game planning', 'coaching software'],
    heading: 'Your Digital Coaching Companion',
    subheading: 'Everything you need to install, teach, and call your offense.',
  },
};

const BASE_URL = 'https://bigballguy.com';

// ---- Public API ----

/**
 * Generate SEO metadata for a given page.
 */
export function generateSEOMetadata(
  page: string,
  params?: Record<string, string>,
): SEOMetadata {
  const landing = LANDING_PAGES[page];

  if (landing) {
    return {
      title: landing.title,
      description: landing.description,
      keywords: landing.keywords,
      ogTitle: landing.title,
      ogImage: `${BASE_URL}/og/${page.slice(1)}.png`,
      canonical: `${BASE_URL}${landing.path}`,
      structuredData: generateStructuredData('WebPage', {
        name: landing.title,
        description: landing.description,
        url: `${BASE_URL}${landing.path}`,
      }),
    };
  }

  // Default metadata for non-landing pages
  const title = params?.title ?? 'Big Ball Guy - Football Playbook Builder';
  const description =
    params?.description ??
    'Build, share, and manage your football playbook with Big Ball Guy.';

  return {
    title,
    description,
    keywords: ['football', 'playbook', 'play designer', 'coaching'],
    ogTitle: title,
    canonical: params?.canonical ?? `${BASE_URL}${page}`,
  };
}

/**
 * Generate JSON-LD structured data for a given type.
 */
export function generateStructuredData(
  type: StructuredDataType,
  data: Record<string, string>,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
  };

  switch (type) {
    case 'SoftwareApplication':
      return {
        ...base,
        name: data.name ?? 'Big Ball Guy',
        description: data.description ?? 'Football playbook builder for coaches',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: data.price ?? '0',
          priceCurrency: 'USD',
        },
        ...(data.url ? { url: data.url } : {}),
      };

    case 'Article':
      return {
        ...base,
        headline: data.headline ?? data.title ?? '',
        description: data.description ?? '',
        author: {
          '@type': 'Person',
          name: data.author ?? 'Big Ball Guy Team',
        },
        ...(data.datePublished ? { datePublished: data.datePublished } : {}),
        ...(data.url ? { url: data.url } : {}),
      };

    case 'WebPage':
    default:
      return {
        ...base,
        name: data.name ?? data.title ?? '',
        description: data.description ?? '',
        ...(data.url ? { url: data.url } : {}),
      };
  }
}

/**
 * Generate an XML sitemap string from a list of page paths.
 */
export function generateSitemap(pages: string[]): string {
  const urls = pages
    .map(
      (page) =>
        `  <url>\n    <loc>${BASE_URL}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${page === '/' ? '1.0' : '0.8'}</priority>\n  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

/**
 * Generate robots.txt content.
 */
export function generateRobotsTxt(sitemapUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /api/',
    'Disallow: /app/',
    'Disallow: /dashboard/',
    '',
    `Sitemap: ${sitemapUrl}`,
  ].join('\n');
}
