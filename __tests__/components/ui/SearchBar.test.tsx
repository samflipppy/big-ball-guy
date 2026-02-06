import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/ui/SearchBar';

describe('SearchBar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with default placeholder', () => {
    render(<SearchBar onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar onChange={() => {}} placeholder="Find plays..." />);
    expect(screen.getByPlaceholderText('Find plays...')).toBeInTheDocument();
  });

  it('renders a searchbox input', () => {
    render(<SearchBar onChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('calls onChange with debounce', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchBar onChange={handleChange} debounceMs={50} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'test');

    // Should eventually be called after debounce
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith('test');
    });
  });

  it('shows clear button when input has value', async () => {
    const user = userEvent.setup();
    render(<SearchBar onChange={() => {}} debounceMs={0} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'hello');

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clears input and calls onChange when clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchBar onChange={handleChange} debounceMs={0} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'hello');

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
    });

    handleChange.mockClear();
    await user.click(screen.getByLabelText('Clear search'));

    expect(input).toHaveValue('');
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('focuses input on Ctrl+K', async () => {
    const user = userEvent.setup();
    render(<SearchBar onChange={() => {}} />);

    const input = screen.getByRole('searchbox');
    expect(document.activeElement).not.toBe(input);

    await user.keyboard('{Control>}k{/Control}');
    expect(document.activeElement).toBe(input);
  });

  it('renders filter dropdown when filters are provided', () => {
    const filters = [
      { label: 'All', value: 'all' },
      { label: 'Offense', value: 'offense' },
    ];
    render(
      <SearchBar
        onChange={() => {}}
        filters={filters}
        activeFilter="all"
        onFilterChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Search filter')).toBeInTheDocument();
  });

  it('calls onFilterChange when filter is changed', async () => {
    const user = userEvent.setup();
    const handleFilterChange = vi.fn();
    const filters = [
      { label: 'All', value: 'all' },
      { label: 'Offense', value: 'offense' },
    ];
    render(
      <SearchBar
        onChange={() => {}}
        filters={filters}
        activeFilter="all"
        onFilterChange={handleFilterChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Search filter'), 'offense');
    expect(handleFilterChange).toHaveBeenCalledWith('offense');
  });

  it('does not render filter dropdown when no filters', () => {
    render(<SearchBar onChange={() => {}} />);
    expect(screen.queryByLabelText('Search filter')).not.toBeInTheDocument();
  });

  it('syncs with controlled value', () => {
    render(<SearchBar value="controlled" onChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toHaveValue('controlled');
  });
});
