import { describe, it, expect, beforeEach } from 'vitest';
import {
  MARKETPLACE_CATEGORIES,
  publishToMarketplace,
  searchMarketplace,
  purchaseItem,
  rateItem,
  getSellerDashboard,
  clearMarketplace,
  getAllItems,
} from '@/lib/marketplace';
import type { MarketplaceItem } from '@/lib/marketplace';

function publishTestItem(
  overrides: Partial<Omit<MarketplaceItem, 'id' | 'rating' | 'downloadCount'>> = {},
): MarketplaceItem {
  return publishToMarketplace({
    name: 'Spread Offense Pack',
    description: 'Complete spread offense system with 20 plays',
    author: 'coach-1',
    price: 9.99,
    category: 'offense',
    plays: [],
    formations: [],
    previewImages: ['/preview1.png'],
    ...overrides,
  });
}

describe('marketplace', () => {
  beforeEach(() => {
    clearMarketplace();
  });

  describe('MARKETPLACE_CATEGORIES', () => {
    it('contains 5 categories', () => {
      expect(MARKETPLACE_CATEGORIES).toHaveLength(5);
    });

    it('includes offense, defense, special-teams, complete-systems, drills', () => {
      expect(MARKETPLACE_CATEGORIES).toContain('offense');
      expect(MARKETPLACE_CATEGORIES).toContain('defense');
      expect(MARKETPLACE_CATEGORIES).toContain('special-teams');
      expect(MARKETPLACE_CATEGORIES).toContain('complete-systems');
      expect(MARKETPLACE_CATEGORIES).toContain('drills');
    });
  });

  describe('publishToMarketplace', () => {
    it('creates an item with generated id and 0 rating/downloads', () => {
      const item = publishTestItem();
      expect(item.id).toMatch(/^mkt_/);
      expect(item.rating).toBe(0);
      expect(item.downloadCount).toBe(0);
      expect(item.name).toBe('Spread Offense Pack');
    });

    it('throws when name is empty', () => {
      expect(() => publishTestItem({ name: '' })).toThrow('Item name is required');
    });

    it('throws when price is negative', () => {
      expect(() => publishTestItem({ price: -5 })).toThrow('Price cannot be negative');
    });

    it('allows free items (price = 0)', () => {
      const item = publishTestItem({ price: 0 });
      expect(item.price).toBe(0);
    });
  });

  describe('searchMarketplace', () => {
    it('finds items matching query in name', () => {
      publishTestItem({ name: 'Spread Offense Pack', description: 'A great pack of spread plays' });
      publishTestItem({ name: 'Zone Defense Plays', description: 'Defensive zone coverage schemes' });
      const results = searchMarketplace('spread');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Spread Offense Pack');
    });

    it('filters by category', () => {
      publishTestItem({ category: 'offense' });
      publishTestItem({ category: 'defense' });
      const results = searchMarketplace('', { category: 'defense' });
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('defense');
    });

    it('filters by price range', () => {
      publishTestItem({ price: 5 });
      publishTestItem({ price: 15 });
      publishTestItem({ price: 25 });
      const results = searchMarketplace('', { priceRange: { min: 10, max: 20 } });
      expect(results).toHaveLength(1);
      expect(results[0].price).toBe(15);
    });

    it('filters by minimum rating', () => {
      const item = publishTestItem();
      rateItem(item.id, 'user-1', 5);
      publishTestItem({ name: 'Low Rated Pack' });
      const results = searchMarketplace('', { minRating: 4 });
      expect(results).toHaveLength(1);
    });

    it('returns all items for empty query with no filters', () => {
      publishTestItem();
      publishTestItem({ name: 'Another Pack' });
      const results = searchMarketplace('');
      expect(results).toHaveLength(2);
    });
  });

  describe('purchaseItem', () => {
    it('records a purchase and increments download count', () => {
      const item = publishTestItem();
      const purchase = purchaseItem(item.id, 'buyer-1');
      expect(purchase.id).toMatch(/^pur_/);
      expect(purchase.itemId).toBe(item.id);
      expect(purchase.buyerId).toBe('buyer-1');
      expect(purchase.price).toBe(9.99);
      // Check download count increased
      const updated = getAllItems().find((i) => i.id === item.id)!;
      expect(updated.downloadCount).toBe(1);
    });

    it('throws for non-existent item', () => {
      expect(() => purchaseItem('nonexistent', 'buyer-1')).toThrow('Item not found');
    });

    it('throws for duplicate purchase', () => {
      const item = publishTestItem();
      purchaseItem(item.id, 'buyer-1');
      expect(() => purchaseItem(item.id, 'buyer-1')).toThrow('Item already purchased');
    });
  });

  describe('rateItem', () => {
    it('adds a rating and updates item average', () => {
      const item = publishTestItem();
      rateItem(item.id, 'user-1', 4);
      rateItem(item.id, 'user-2', 2);
      const updated = getAllItems().find((i) => i.id === item.id)!;
      expect(updated.rating).toBe(3); // (4+2)/2 = 3
    });

    it('allows updating an existing rating', () => {
      const item = publishTestItem();
      rateItem(item.id, 'user-1', 2);
      rateItem(item.id, 'user-1', 5); // update to 5
      const updated = getAllItems().find((i) => i.id === item.id)!;
      expect(updated.rating).toBe(5);
    });

    it('throws for non-existent item', () => {
      expect(() => rateItem('nonexistent', 'user-1', 5)).toThrow('Item not found');
    });

    it('includes optional review', () => {
      const item = publishTestItem();
      const entry = rateItem(item.id, 'user-1', 5, 'Great plays!');
      expect(entry.review).toBe('Great plays!');
    });
  });

  describe('getSellerDashboard', () => {
    it('returns stats for a seller', () => {
      const item = publishTestItem({ author: 'seller-1', price: 10 });
      purchaseItem(item.id, 'buyer-1');
      purchaseItem(item.id, 'buyer-2');
      rateItem(item.id, 'buyer-1', 4);

      const dashboard = getSellerDashboard('seller-1');
      expect(dashboard.totalSales).toBe(2);
      expect(dashboard.totalRevenue).toBe(20);
      expect(dashboard.itemCount).toBe(1);
      expect(dashboard.averageRating).toBe(4);
      expect(dashboard.recentPurchases).toHaveLength(2);
    });

    it('returns empty dashboard for seller with no items', () => {
      const dashboard = getSellerDashboard('nobody');
      expect(dashboard.totalSales).toBe(0);
      expect(dashboard.totalRevenue).toBe(0);
      expect(dashboard.itemCount).toBe(0);
      expect(dashboard.averageRating).toBe(0);
    });
  });
});
