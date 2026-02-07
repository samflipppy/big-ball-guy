/**
 * Competitive Feature Comparison (#320)
 *
 * Defines competitor data and comparison utilities to generate
 * feature comparison tables and identify unique advantages.
 */

// ---- Types ----

export interface Competitor {
  name: string;
  features: Record<string, boolean | string>;
  pricing: string;
  platforms: string[];
  targetAudience: string;
}

export interface ComparisonResult {
  advantages: string[];
  disadvantages: string[];
  neutral: string[];
}

export interface ComparisonTableRow {
  feature: string;
  values: Record<string, boolean | string>;
}

// ---- Constants ----

export const BIG_BALL_GUY: Competitor = {
  name: 'Big Ball Guy',
  features: {
    'Play Designer': true,
    'Formation Builder': true,
    'Game Plan Builder': true,
    'Practice Scripts': true,
    'Call Sheets': true,
    'Wristband Cards': true,
    'Real-time Collaboration': true,
    'Offline Mode': true,
    'PDF Export': true,
    'Image Export': true,
    'Custom Branding': true,
    'Scouting Integration': true,
    'Tendency Tracking': true,
    'Player App': true,
    'Marketplace': true,
    'Voice Input': true,
    'Animation': true,
    'Starting Price': 'Free',
  },
  pricing: 'Free / $9.99/mo / $24.99/mo',
  platforms: ['Web', 'iOS', 'Android'],
  targetAudience: 'All levels: Youth, High School, College, Pro',
};

export const COMPETITORS: Record<string, Competitor> = {
  'Pro Quick Draw': {
    name: 'Pro Quick Draw',
    features: {
      'Play Designer': true,
      'Formation Builder': true,
      'Game Plan Builder': true,
      'Practice Scripts': false,
      'Call Sheets': false,
      'Wristband Cards': false,
      'Real-time Collaboration': false,
      'Offline Mode': false,
      'PDF Export': true,
      'Image Export': true,
      'Custom Branding': false,
      'Scouting Integration': false,
      'Tendency Tracking': false,
      'Player App': false,
      'Marketplace': false,
      'Voice Input': false,
      'Animation': false,
      'Starting Price': '$4.99/mo',
    },
    pricing: '$4.99/mo',
    platforms: ['Web'],
    targetAudience: 'High School and College',
  },
  'Hudl': {
    name: 'Hudl',
    features: {
      'Play Designer': true,
      'Formation Builder': true,
      'Game Plan Builder': true,
      'Practice Scripts': true,
      'Call Sheets': false,
      'Wristband Cards': false,
      'Real-time Collaboration': true,
      'Offline Mode': false,
      'PDF Export': true,
      'Image Export': true,
      'Custom Branding': false,
      'Scouting Integration': true,
      'Tendency Tracking': true,
      'Player App': true,
      'Marketplace': false,
      'Voice Input': false,
      'Animation': true,
      'Starting Price': '$99/yr',
    },
    pricing: '$99/yr and up',
    platforms: ['Web', 'iOS', 'Android'],
    targetAudience: 'High School and College',
  },
  'Just Play': {
    name: 'Just Play',
    features: {
      'Play Designer': true,
      'Formation Builder': true,
      'Game Plan Builder': true,
      'Practice Scripts': true,
      'Call Sheets': true,
      'Wristband Cards': false,
      'Real-time Collaboration': true,
      'Offline Mode': true,
      'PDF Export': true,
      'Image Export': true,
      'Custom Branding': false,
      'Scouting Integration': false,
      'Tendency Tracking': false,
      'Player App': true,
      'Marketplace': false,
      'Voice Input': false,
      'Animation': true,
      'Starting Price': '$50/mo',
    },
    pricing: '$50/mo and up',
    platforms: ['Web', 'iOS', 'Android'],
    targetAudience: 'College and Pro',
  },
  'FirstDown PlayBook': {
    name: 'FirstDown PlayBook',
    features: {
      'Play Designer': true,
      'Formation Builder': true,
      'Game Plan Builder': false,
      'Practice Scripts': false,
      'Call Sheets': false,
      'Wristband Cards': false,
      'Real-time Collaboration': false,
      'Offline Mode': false,
      'PDF Export': true,
      'Image Export': true,
      'Custom Branding': false,
      'Scouting Integration': false,
      'Tendency Tracking': false,
      'Player App': false,
      'Marketplace': false,
      'Voice Input': false,
      'Animation': false,
      'Starting Price': '$9.99/mo',
    },
    pricing: '$9.99/mo',
    platforms: ['Web'],
    targetAudience: 'Youth and High School',
  },
};

// ---- Public API ----

/**
 * Compare Big Ball Guy against a competitor.
 * Returns features where we win, lose, or tie.
 */
export function compareFeatures(
  us: Competitor,
  them: Competitor,
): ComparisonResult {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const neutral: string[] = [];

  const allFeatures = new Set([
    ...Object.keys(us.features),
    ...Object.keys(them.features),
  ]);

  for (const feature of allFeatures) {
    const ourValue = us.features[feature];
    const theirValue = them.features[feature];

    // Both have the feature (or same string value)
    if (ourValue === theirValue) {
      neutral.push(feature);
      continue;
    }

    // Boolean comparison: true > false
    if (ourValue === true && (theirValue === false || theirValue === undefined)) {
      advantages.push(feature);
    } else if ((ourValue === false || ourValue === undefined) && theirValue === true) {
      disadvantages.push(feature);
    } else {
      // String values differ (e.g. pricing) - treat as neutral
      neutral.push(feature);
    }
  }

  return { advantages, disadvantages, neutral };
}

/**
 * Generate a comparison table for multiple competitors.
 */
export function generateComparisonTable(
  competitors: Competitor[],
): ComparisonTableRow[] {
  const allFeatures = new Set<string>();
  for (const c of competitors) {
    for (const f of Object.keys(c.features)) {
      allFeatures.add(f);
    }
  }

  return Array.from(allFeatures).map((feature) => {
    const values: Record<string, boolean | string> = {};
    for (const c of competitors) {
      values[c.name] = c.features[feature] ?? false;
    }
    return { feature, values };
  });
}

/**
 * Get features that only Big Ball Guy has among all competitors.
 */
export function getUniqueAdvantages(): string[] {
  const ourFeatures = Object.entries(BIG_BALL_GUY.features)
    .filter(([, v]) => v === true)
    .map(([k]) => k);

  return ourFeatures.filter((feature) =>
    Object.values(COMPETITORS).every(
      (comp) => comp.features[feature] !== true,
    ),
  );
}
