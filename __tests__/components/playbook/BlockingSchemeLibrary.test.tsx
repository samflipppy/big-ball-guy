import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import BlockingSchemeLibrary from '@/components/playbook/BlockingSchemeLibrary';
import { BUILT_IN_BLOCKING_SCHEMES } from '@/lib/blocking-schemes';

describe('BlockingSchemeLibrary', () => {
  const onSelectScheme = vi.fn();

  beforeEach(() => {
    onSelectScheme.mockClear();
  });

  it('renders the library container', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);
    expect(screen.getByTestId('blocking-scheme-library')).toBeInTheDocument();
  });

  it('renders the header', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);
    expect(screen.getByText('Blocking Schemes')).toBeInTheDocument();
  });

  it('renders the type filter dropdown', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);
    const filter = screen.getByTestId('scheme-type-filter');
    expect(filter).toBeInTheDocument();
    expect(filter).toHaveValue('all');
  });

  it('renders all blocking schemes by default', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);
    const grid = screen.getByTestId('scheme-grid');
    expect(grid).toBeInTheDocument();

    for (const scheme of BUILT_IN_BLOCKING_SCHEMES) {
      expect(screen.getByTestId(`scheme-card-${scheme.id}`)).toBeInTheDocument();
    }
  });

  it('renders scheme names', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);
    expect(screen.getByText('Inside Zone')).toBeInTheDocument();
    expect(screen.getByText('Power')).toBeInTheDocument();
    expect(screen.getByText('Pass Pro (Half-Slide)')).toBeInTheDocument();
  });

  it('renders run/pass type badges', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);
    // Check that Run and Pass badges exist
    const runBadges = screen.getAllByText('Run');
    const passBadges = screen.getAllByText('Pass');
    expect(runBadges.length).toBeGreaterThan(0);
    expect(passBadges.length).toBeGreaterThan(0);
  });

  it('renders mini-diagrams for each scheme', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);
    for (const scheme of BUILT_IN_BLOCKING_SCHEMES) {
      expect(screen.getByTestId(`scheme-diagram-${scheme.id}`)).toBeInTheDocument();
    }
  });

  it('filters to only run schemes', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);
    const filter = screen.getByTestId('scheme-type-filter');

    fireEvent.change(filter, { target: { value: 'run' } });

    const runSchemes = BUILT_IN_BLOCKING_SCHEMES.filter((s) => s.type === 'run');
    const passSchemes = BUILT_IN_BLOCKING_SCHEMES.filter((s) => s.type === 'pass');

    for (const scheme of runSchemes) {
      expect(screen.getByTestId(`scheme-card-${scheme.id}`)).toBeInTheDocument();
    }
    for (const scheme of passSchemes) {
      expect(screen.queryByTestId(`scheme-card-${scheme.id}`)).not.toBeInTheDocument();
    }
  });

  it('filters to only pass schemes', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);
    const filter = screen.getByTestId('scheme-type-filter');

    fireEvent.change(filter, { target: { value: 'pass' } });

    const runSchemes = BUILT_IN_BLOCKING_SCHEMES.filter((s) => s.type === 'run');
    const passSchemes = BUILT_IN_BLOCKING_SCHEMES.filter((s) => s.type === 'pass');

    for (const scheme of passSchemes) {
      expect(screen.getByTestId(`scheme-card-${scheme.id}`)).toBeInTheDocument();
    }
    for (const scheme of runSchemes) {
      expect(screen.queryByTestId(`scheme-card-${scheme.id}`)).not.toBeInTheDocument();
    }
  });

  it('resets filter to show all schemes', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);
    const filter = screen.getByTestId('scheme-type-filter');

    fireEvent.change(filter, { target: { value: 'run' } });
    fireEvent.change(filter, { target: { value: 'all' } });

    for (const scheme of BUILT_IN_BLOCKING_SCHEMES) {
      expect(screen.getByTestId(`scheme-card-${scheme.id}`)).toBeInTheDocument();
    }
  });

  it('calls onSelectScheme when a scheme card is clicked', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);

    const insideZone = BUILT_IN_BLOCKING_SCHEMES.find((s) => s.name === 'Inside Zone')!;
    fireEvent.click(screen.getByTestId(`scheme-card-${insideZone.id}`));

    expect(onSelectScheme).toHaveBeenCalledTimes(1);
    expect(onSelectScheme).toHaveBeenCalledWith(insideZone);
  });

  it('calls onSelectScheme with correct scheme for different cards', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);

    const power = BUILT_IN_BLOCKING_SCHEMES.find((s) => s.name === 'Power')!;
    fireEvent.click(screen.getByTestId(`scheme-card-${power.id}`));

    expect(onSelectScheme).toHaveBeenCalledWith(power);
  });

  it('highlights the selected scheme', () => {
    const insideZone = BUILT_IN_BLOCKING_SCHEMES.find((s) => s.name === 'Inside Zone')!;
    render(
      <BlockingSchemeLibrary
        onSelectScheme={onSelectScheme}
        selectedSchemeId={insideZone.id}
      />,
    );

    const card = screen.getByTestId(`scheme-card-${insideZone.id}`);
    expect(card.className).toContain('border-blue-500');
    expect(card.className).toContain('ring-1');
  });

  it('does not highlight non-selected schemes', () => {
    const insideZone = BUILT_IN_BLOCKING_SCHEMES.find((s) => s.name === 'Inside Zone')!;
    const power = BUILT_IN_BLOCKING_SCHEMES.find((s) => s.name === 'Power')!;
    render(
      <BlockingSchemeLibrary
        onSelectScheme={onSelectScheme}
        selectedSchemeId={insideZone.id}
      />,
    );

    const powerCard = screen.getByTestId(`scheme-card-${power.id}`);
    expect(powerCard.className).not.toContain('border-blue-500');
  });

  it('applies className prop', () => {
    render(
      <BlockingSchemeLibrary
        onSelectScheme={onSelectScheme}
        className="custom-class"
      />,
    );
    const container = screen.getByTestId('blocking-scheme-library');
    expect(container.className).toContain('custom-class');
  });

  it('filter dropdown has run and pass options', () => {
    render(<BlockingSchemeLibrary onSelectScheme={onSelectScheme} />);
    const filter = screen.getByTestId('scheme-type-filter');
    const options = filter.querySelectorAll('option');
    const values = Array.from(options).map((o) => o.getAttribute('value'));
    expect(values).toContain('all');
    expect(values).toContain('run');
    expect(values).toContain('pass');
  });
});
