'use client';

import { useState, useEffect, useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  maxVisible?: number;
}

/**
 * Accessible breadcrumb navigation component.
 * - Uses <nav> with aria-label="Breadcrumb"
 * - Marks the last item with aria-current="page"
 * - Truncates long labels with ellipsis
 * - Collapses middle items on mobile when there are more than maxVisible items
 */
export function Breadcrumbs({ items, maxVisible = 3 }: BreadcrumbsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const [collapsed, setCollapsed] = useState(true);

  const visibleItems = useMemo(() => {
    if (!isMobile || !collapsed || items.length <= maxVisible) {
      return items.map((item, index) => ({ item, index, isEllipsis: false }));
    }

    // On mobile, show first item, ellipsis, and last (maxVisible - 1) items
    const result: { item: BreadcrumbItem; index: number; isEllipsis: boolean }[] = [];
    result.push({ item: items[0], index: 0, isEllipsis: false });
    result.push({
      item: { label: '...' },
      index: -1,
      isEllipsis: true,
    });

    const tailCount = maxVisible - 1;
    const startIndex = items.length - tailCount;
    for (let i = startIndex; i < items.length; i++) {
      result.push({ item: items[i], index: i, isEllipsis: false });
    }

    return result;
  }, [items, isMobile, collapsed, maxVisible]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" data-testid="breadcrumbs">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {visibleItems.map(({ item, index, isEllipsis }, i) => {
          const isLast = !isEllipsis && index === items.length - 1;
          const key = isEllipsis ? 'ellipsis' : `${index}-${item.label}`;

          return (
            <li key={key} className="flex items-center gap-1">
              {/* Separator */}
              {i > 0 && (
                <span
                  className="text-zinc-400 dark:text-zinc-500"
                  aria-hidden="true"
                  data-testid="breadcrumb-separator"
                >
                  /
                </span>
              )}

              {isEllipsis ? (
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  className="rounded px-1 py-0.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label="Show all breadcrumbs"
                  data-testid="breadcrumb-ellipsis"
                >
                  ...
                </button>
              ) : isLast ? (
                <span
                  aria-current="page"
                  className="max-w-[200px] truncate font-medium text-zinc-900 dark:text-zinc-100"
                  title={item.label}
                  data-testid="breadcrumb-current"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  onClick={item.onClick}
                  className="max-w-[200px] truncate text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  title={item.label}
                  data-testid="breadcrumb-link"
                >
                  {item.label}
                </a>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="max-w-[200px] truncate text-zinc-500 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-400 dark:hover:text-zinc-200"
                  title={item.label}
                  data-testid="breadcrumb-button"
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className="max-w-[200px] truncate text-zinc-500 dark:text-zinc-400"
                  title={item.label}
                  data-testid="breadcrumb-text"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
