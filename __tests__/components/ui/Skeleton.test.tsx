import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonPlayCard,
  SkeletonGrid,
} from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders base skeleton element', () => {
    render(<Skeleton />);
    const el = screen.getByTestId('skeleton');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies animate-pulse class', () => {
    render(<Skeleton />);
    const el = screen.getByTestId('skeleton');
    expect(el.className).toContain('animate-pulse');
  });

  it('applies custom className', () => {
    render(<Skeleton className="h-10 w-40" />);
    const el = screen.getByTestId('skeleton');
    expect(el.className).toContain('h-10');
    expect(el.className).toContain('w-40');
  });
});

describe('SkeletonText', () => {
  it('renders default 3 lines', () => {
    render(<SkeletonText />);
    const container = screen.getByTestId('skeleton-text');
    const lines = container.querySelectorAll('[data-testid="skeleton"]');
    expect(lines.length).toBe(3);
  });

  it('renders custom number of lines', () => {
    render(<SkeletonText lines={5} />);
    const container = screen.getByTestId('skeleton-text');
    const lines = container.querySelectorAll('[data-testid="skeleton"]');
    expect(lines.length).toBe(5);
  });

  it('renders with custom className', () => {
    render(<SkeletonText className="my-custom-class" />);
    const container = screen.getByTestId('skeleton-text');
    expect(container.className).toContain('my-custom-class');
  });

  it('last line is shorter when more than 1 line', () => {
    render(<SkeletonText lines={3} />);
    const container = screen.getByTestId('skeleton-text');
    const lines = container.querySelectorAll('[data-testid="skeleton"]');
    expect(lines[2].className).toContain('w-2/3');
    expect(lines[0].className).toContain('w-full');
  });
});

describe('SkeletonCard', () => {
  it('renders card skeleton', () => {
    render(<SkeletonCard />);
    const el = screen.getByTestId('skeleton-card');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies custom className', () => {
    render(<SkeletonCard className="extra-class" />);
    const el = screen.getByTestId('skeleton-card');
    expect(el.className).toContain('extra-class');
  });

  it('contains inner skeleton elements', () => {
    render(<SkeletonCard />);
    const el = screen.getByTestId('skeleton-card');
    // Should contain a title skeleton and text skeleton
    expect(el.querySelectorAll('[data-testid="skeleton"]').length).toBeGreaterThan(0);
    expect(el.querySelector('[data-testid="skeleton-text"]')).toBeInTheDocument();
  });
});

describe('SkeletonPlayCard', () => {
  it('renders play card skeleton', () => {
    render(<SkeletonPlayCard />);
    const el = screen.getByTestId('skeleton-play-card');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('contains field thumbnail skeleton', () => {
    render(<SkeletonPlayCard />);
    const el = screen.getByTestId('skeleton-play-card');
    // The first child skeleton is the field thumbnail (h-36)
    const thumbnailSkeleton = el.querySelector('[data-testid="skeleton"]');
    expect(thumbnailSkeleton).toBeInTheDocument();
    expect(thumbnailSkeleton?.className).toContain('h-36');
  });

  it('applies custom className', () => {
    render(<SkeletonPlayCard className="custom-play-card" />);
    const el = screen.getByTestId('skeleton-play-card');
    expect(el.className).toContain('custom-play-card');
  });
});

describe('SkeletonGrid', () => {
  it('renders default 8 play card skeletons', () => {
    render(<SkeletonGrid />);
    const grid = screen.getByTestId('skeleton-grid');
    const cards = grid.querySelectorAll('[data-testid="skeleton-play-card"]');
    expect(cards.length).toBe(8);
  });

  it('renders custom count of skeletons', () => {
    render(<SkeletonGrid count={4} />);
    const grid = screen.getByTestId('skeleton-grid');
    const cards = grid.querySelectorAll('[data-testid="skeleton-play-card"]');
    expect(cards.length).toBe(4);
  });

  it('renders card variant instead of play-card', () => {
    render(<SkeletonGrid count={3} variant="card" />);
    const grid = screen.getByTestId('skeleton-grid');
    const cards = grid.querySelectorAll('[data-testid="skeleton-card"]');
    expect(cards.length).toBe(3);
    // Should not render play cards
    const playCards = grid.querySelectorAll('[data-testid="skeleton-play-card"]');
    expect(playCards.length).toBe(0);
  });

  it('applies custom className', () => {
    render(<SkeletonGrid className="gap-8" />);
    const grid = screen.getByTestId('skeleton-grid');
    expect(grid.className).toContain('gap-8');
  });

  it('has grid layout classes', () => {
    render(<SkeletonGrid />);
    const grid = screen.getByTestId('skeleton-grid');
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('grid-cols-1');
  });

  it('is hidden from accessibility tree', () => {
    render(<SkeletonGrid />);
    const grid = screen.getByTestId('skeleton-grid');
    expect(grid).toHaveAttribute('aria-hidden', 'true');
  });
});
