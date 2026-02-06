import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';

// Helper to control matchMedia for mobile/desktop testing
function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('Breadcrumbs', () => {
  beforeEach(() => {
    mockMatchMedia(false); // default to desktop
  });

  it('renders nothing when items array is empty', () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container.querySelector('nav')).toBeNull();
  });

  it('renders a nav element with aria-label', () => {
    const items: BreadcrumbItem[] = [{ label: 'Home' }];
    render(<Breadcrumbs items={items} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
  });

  it('renders all items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Playbook', href: '/playbook' },
      { label: 'My Play' },
    ];
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Playbook')).toBeInTheDocument();
    expect(screen.getByText('My Play')).toBeInTheDocument();
  });

  it('renders separators between items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Playbook', href: '/playbook' },
      { label: 'My Play' },
    ];
    render(<Breadcrumbs items={items} />);
    const separators = screen.getAllByTestId('breadcrumb-separator');
    expect(separators).toHaveLength(2);
  });

  it('marks the last item with aria-current="page"', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Current Page' },
    ];
    render(<Breadcrumbs items={items} />);
    const current = screen.getByTestId('breadcrumb-current');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveTextContent('Current Page');
  });

  it('renders links as <a> elements with href', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Page' },
    ];
    render(<Breadcrumbs items={items} />);
    const link = screen.getByTestId('breadcrumb-link');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders clickable items as buttons', () => {
    const onClick = vi.fn();
    const items: BreadcrumbItem[] = [
      { label: 'Back', onClick },
      { label: 'Current' },
    ];
    render(<Breadcrumbs items={items} />);
    const button = screen.getByTestId('breadcrumb-button');
    expect(button.tagName).toBe('BUTTON');
  });

  it('calls onClick handler when button breadcrumb is clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const items: BreadcrumbItem[] = [
      { label: 'Clickable', onClick },
      { label: 'Current' },
    ];
    render(<Breadcrumbs items={items} />);

    await user.click(screen.getByTestId('breadcrumb-button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('collapses middle items on mobile with ellipsis', () => {
    mockMatchMedia(true); // simulate mobile
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Section', href: '/section' },
      { label: 'Subsection', href: '/sub' },
      { label: 'Deep', href: '/deep' },
      { label: 'Current Page' },
    ];
    render(<Breadcrumbs items={items} maxVisible={3} />);
    expect(screen.getByTestId('breadcrumb-ellipsis')).toBeInTheDocument();
  });

  it('expands collapsed items when ellipsis is clicked', async () => {
    mockMatchMedia(true); // simulate mobile
    const user = userEvent.setup();
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Section', href: '/section' },
      { label: 'Subsection', href: '/sub' },
      { label: 'Deep', href: '/deep' },
      { label: 'Current Page' },
    ];
    render(<Breadcrumbs items={items} maxVisible={3} />);

    expect(screen.getByTestId('breadcrumb-ellipsis')).toBeInTheDocument();

    await user.click(screen.getByTestId('breadcrumb-ellipsis'));

    // After expanding, all items should be visible
    expect(screen.queryByTestId('breadcrumb-ellipsis')).not.toBeInTheDocument();
    expect(screen.getByText('Section')).toBeInTheDocument();
    expect(screen.getByText('Subsection')).toBeInTheDocument();
    expect(screen.getByText('Deep')).toBeInTheDocument();
  });

  it('does not collapse on desktop even with many items', () => {
    mockMatchMedia(false); // desktop
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Section', href: '/section' },
      { label: 'Subsection', href: '/sub' },
      { label: 'Deep', href: '/deep' },
      { label: 'Current Page' },
    ];
    render(<Breadcrumbs items={items} />);
    expect(screen.queryByTestId('breadcrumb-ellipsis')).not.toBeInTheDocument();
  });
});
