/**
 * Play Template Marketplace (#404)
 *
 * Enables coaches to publish, search, purchase, and rate
 * play templates and formation packs in a marketplace.
 */

import type { Play, Formation } from '@/types';

// ---- Types ----

export type MarketplaceCategory =
  | 'offense'
  | 'defense'
  | 'special-teams'
  | 'complete-systems'
  | 'drills';

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  author: string;
  price: number;
  category: MarketplaceCategory;
  plays: Play[];
  formations: Formation[];
  rating: number;
  downloadCount: number;
  previewImages: string[];
}

export interface MarketplaceRating {
  itemId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  review?: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  itemId: string;
  buyerId: string;
  price: number;
  purchasedAt: string;
}

export interface SellerDashboard {
  totalSales: number;
  totalRevenue: number;
  itemCount: number;
  averageRating: number;
  recentPurchases: Purchase[];
}

export interface MarketplaceSearchFilters {
  category?: MarketplaceCategory;
  priceRange?: { min: number; max: number };
  minRating?: number;
}

// ---- Constants ----

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  'offense',
  'defense',
  'special-teams',
  'complete-systems',
  'drills',
];

// ---- In-memory store ----

let items: MarketplaceItem[] = [];
let purchases: Purchase[] = [];
let ratings: MarketplaceRating[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ---- Public API ----

/**
 * Publish a new item to the marketplace.
 */
export function publishToMarketplace(
  item: Omit<MarketplaceItem, 'id' | 'rating' | 'downloadCount'>,
): MarketplaceItem {
  if (!item.name || item.name.trim().length === 0) {
    throw new Error('Item name is required');
  }
  if (item.price < 0) {
    throw new Error('Price cannot be negative');
  }

  const full: MarketplaceItem = {
    ...item,
    id: generateId('mkt'),
    rating: 0,
    downloadCount: 0,
  };
  items.push(full);
  return full;
}

/**
 * Search the marketplace with optional filters.
 */
export function searchMarketplace(
  query: string,
  filters?: MarketplaceSearchFilters,
): MarketplaceItem[] {
  let results = [...items];

  // Text search
  if (query.trim()) {
    const terms = query.toLowerCase().split(/\s+/);
    results = results.filter((item) => {
      const searchable = [item.name, item.description, item.author, item.category]
        .join(' ')
        .toLowerCase();
      return terms.every((term) => searchable.includes(term));
    });
  }

  // Category filter
  if (filters?.category) {
    results = results.filter((item) => item.category === filters.category);
  }

  // Price range filter
  if (filters?.priceRange) {
    results = results.filter(
      (item) =>
        item.price >= filters.priceRange!.min &&
        item.price <= filters.priceRange!.max,
    );
  }

  // Minimum rating filter
  if (filters?.minRating !== undefined) {
    results = results.filter((item) => item.rating >= filters.minRating!);
  }

  return results;
}

/**
 * Record a purchase of a marketplace item.
 */
export function purchaseItem(itemId: string, buyerId: string): Purchase {
  const item = items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
  }

  // Check for duplicate purchase
  const existing = purchases.find(
    (p) => p.itemId === itemId && p.buyerId === buyerId,
  );
  if (existing) {
    throw new Error('Item already purchased');
  }

  const purchase: Purchase = {
    id: generateId('pur'),
    itemId,
    buyerId,
    price: item.price,
    purchasedAt: new Date().toISOString(),
  };

  purchases.push(purchase);
  item.downloadCount += 1;
  return purchase;
}

/**
 * Rate a marketplace item.
 */
export function rateItem(
  itemId: string,
  userId: string,
  rating: 1 | 2 | 3 | 4 | 5,
  review?: string,
): MarketplaceRating {
  const item = items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
  }

  // Upsert: replace existing rating by same user
  const existingIdx = ratings.findIndex(
    (r) => r.itemId === itemId && r.userId === userId,
  );

  const entry: MarketplaceRating = {
    itemId,
    userId,
    rating,
    review,
    createdAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    ratings[existingIdx] = entry;
  } else {
    ratings.push(entry);
  }

  // Recalculate average rating for the item
  const itemRatings = ratings.filter((r) => r.itemId === itemId);
  const avg =
    itemRatings.reduce((sum, r) => sum + r.rating, 0) / itemRatings.length;
  item.rating = Math.round(avg * 10) / 10;

  return entry;
}

/**
 * Get seller dashboard stats for a given author.
 */
export function getSellerDashboard(sellerId: string): SellerDashboard {
  const sellerItems = items.filter((i) => i.author === sellerId);
  const sellerItemIds = new Set(sellerItems.map((i) => i.id));

  const sellerPurchases = purchases.filter((p) => sellerItemIds.has(p.itemId));
  const totalRevenue = sellerPurchases.reduce((sum, p) => sum + p.price, 0);

  const sellerRatings = ratings.filter((r) => sellerItemIds.has(r.itemId));
  const averageRating =
    sellerRatings.length > 0
      ? Math.round(
          (sellerRatings.reduce((sum, r) => sum + r.rating, 0) /
            sellerRatings.length) *
            10,
        ) / 10
      : 0;

  return {
    totalSales: sellerPurchases.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    itemCount: sellerItems.length,
    averageRating,
    recentPurchases: sellerPurchases
      .sort(
        (a, b) =>
          new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
      )
      .slice(0, 10),
  };
}

/**
 * Get all items (for testing).
 */
export function getAllItems(): MarketplaceItem[] {
  return [...items];
}

/**
 * Clear all marketplace data (for testing).
 */
export function clearMarketplace(): void {
  items = [];
  purchases = [];
  ratings = [];
}
