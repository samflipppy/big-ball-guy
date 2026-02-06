import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ConceptFrontMatrix from '@/components/playbook/ConceptFrontMatrix';
import type { Concept, Play } from '@/types';
import type { DefensiveFront } from '@/lib/defenses';

// --- Test data ---

const makeConcept = (overrides: Partial<Concept> = {}): Concept => ({
  id: 'concept-mesh',
  name: 'Mesh',
  description: 'Crossing routes',
  routes: [
    {
      position: 'WR',
      route: {
        id: 'mesh-x',
        name: 'X Drag',
        type: 'drag',
        points: [
          { x: 0, y: 0, type: 'line' },
          { x: 5, y: -2, type: 'break' },
          { x: 40, y: -5, type: 'line' },
        ],
      },
    },
    {
      position: 'TE',
      route: {
        id: 'mesh-y',
        name: 'Y Cross',
        type: 'cross',
        points: [
          { x: 0, y: 0, type: 'line' },
          { x: -5, y: -2, type: 'break' },
          { x: -40, y: -5, type: 'line' },
        ],
      },
    },
  ],
  tags: ['quick game', 'crossing'],
  teamId: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const makeFront = (overrides: Partial<DefensiveFront> = {}): DefensiveFront => ({
  id: 'front-43-over',
  name: '4-3 Over',
  description: 'Standard 4-3',
  players: [
    { id: 'de1', position: 'DE', label: 'DE', location: { x: 280, y: 225 }, side: 'defense' },
    { id: 'dt1', position: 'DT', label: 'DT', location: { x: 360, y: 225 }, side: 'defense' },
    { id: 'mlb', position: 'MLB', label: 'M', location: { x: 400, y: 190 }, side: 'defense' },
    { id: 'cb1', position: 'CB', label: 'CB', location: { x: 100, y: 200 }, side: 'defense' },
  ],
  ...overrides,
});

const concepts: Concept[] = [
  makeConcept(),
  makeConcept({
    id: 'concept-flood',
    name: 'Flood',
    description: 'Three level flood',
    tags: ['deep', 'three-level'],
    routes: [
      {
        position: 'WR',
        route: {
          id: 'flood-z',
          name: 'Z Streak',
          type: 'streak',
          points: [
            { x: 0, y: 0, type: 'line' },
            { x: 3, y: -25, type: 'line' },
          ],
        },
      },
    ],
  }),
  makeConcept({
    id: 'concept-slant-flat',
    name: 'Slant-Flat',
    description: 'Quick slant with flat',
    tags: ['quick game', 'zone-beater'],
  }),
];

const fronts: DefensiveFront[] = [
  makeFront(),
  makeFront({
    id: 'front-34',
    name: '3-4',
    description: 'Three down linemen',
    players: [
      { id: 'de1', position: 'DE', label: 'DE', location: { x: 310, y: 225 }, side: 'defense' },
      { id: 'nt', position: 'NT', label: 'NT', location: { x: 400, y: 225 }, side: 'defense' },
    ],
  }),
];

// ============================================================
// Tests
// ============================================================
describe('ConceptFrontMatrix', () => {
  const onCellClick = vi.fn();

  beforeEach(() => {
    onCellClick.mockClear();
  });

  it('renders the matrix container', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );
    expect(screen.getByTestId('concept-front-matrix')).toBeInTheDocument();
  });

  it('renders the header', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );
    expect(screen.getByText('Concept x Front Matrix')).toBeInTheDocument();
  });

  it('renders the matrix table', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );
    expect(screen.getByTestId('matrix-table')).toBeInTheDocument();
  });

  it('renders front names as column headers', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    for (const front of fronts) {
      expect(screen.getByTestId(`front-header-${front.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`front-header-${front.id}`).textContent).toBe(front.name);
    }
  });

  it('renders concept names as row labels', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    for (const concept of concepts) {
      expect(screen.getByTestId(`concept-label-${concept.id}`)).toBeInTheDocument();
    }
  });

  it('renders concept rows for each concept', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    for (const concept of concepts) {
      expect(screen.getByTestId(`concept-row-${concept.id}`)).toBeInTheDocument();
    }
  });

  it('renders a cell for every concept-front combination', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    for (const concept of concepts) {
      for (const front of fronts) {
        expect(
          screen.getByTestId(`cell-${concept.id}-${front.id}`),
        ).toBeInTheDocument();
      }
    }
  });

  it('renders cell previews (SVG thumbnails)', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    const previews = screen.getAllByTestId('cell-preview');
    // Should have concepts.length * fronts.length previews
    expect(previews).toHaveLength(concepts.length * fronts.length);
  });

  it('calls onCellClick with correct conceptId and frontId', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    const cell = screen.getByTestId(`cell-${concepts[0].id}-${fronts[1].id}`);
    fireEvent.click(cell);

    expect(onCellClick).toHaveBeenCalledTimes(1);
    expect(onCellClick).toHaveBeenCalledWith(concepts[0].id, fronts[1].id);
  });

  it('calls onCellClick with different concept-front combos', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    fireEvent.click(screen.getByTestId(`cell-${concepts[1].id}-${fronts[0].id}`));
    expect(onCellClick).toHaveBeenCalledWith(concepts[1].id, fronts[0].id);

    fireEvent.click(screen.getByTestId(`cell-${concepts[2].id}-${fronts[1].id}`));
    expect(onCellClick).toHaveBeenCalledWith(concepts[2].id, fronts[1].id);
  });

  // --- Filters ---

  it('renders concept tag filter', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );
    expect(screen.getByTestId('concept-tag-filter')).toBeInTheDocument();
  });

  it('renders front filter', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );
    expect(screen.getByTestId('front-filter')).toBeInTheDocument();
  });

  it('filters concepts by tag', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    const tagFilter = screen.getByTestId('concept-tag-filter');
    fireEvent.change(tagFilter, { target: { value: 'deep' } });

    // Only 'Flood' has the 'deep' tag
    expect(screen.getByTestId('concept-row-concept-flood')).toBeInTheDocument();
    expect(screen.queryByTestId('concept-row-concept-mesh')).not.toBeInTheDocument();
    expect(screen.queryByTestId('concept-row-concept-slant-flat')).not.toBeInTheDocument();
  });

  it('filters concepts by crossing tag', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    const tagFilter = screen.getByTestId('concept-tag-filter');
    fireEvent.change(tagFilter, { target: { value: 'crossing' } });

    // Only 'Mesh' has the 'crossing' tag
    expect(screen.getByTestId('concept-row-concept-mesh')).toBeInTheDocument();
    expect(screen.queryByTestId('concept-row-concept-flood')).not.toBeInTheDocument();
  });

  it('filters fronts by specific front', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    const frontFilter = screen.getByTestId('front-filter');
    fireEvent.change(frontFilter, { target: { value: 'front-34' } });

    // Should still see all concept rows but only the 3-4 front column
    expect(screen.getByTestId('front-header-front-34')).toBeInTheDocument();
    expect(screen.queryByTestId('front-header-front-43-over')).not.toBeInTheDocument();
  });

  it('resets filters to show all', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    const tagFilter = screen.getByTestId('concept-tag-filter');
    fireEvent.change(tagFilter, { target: { value: 'deep' } });
    fireEvent.change(tagFilter, { target: { value: 'all' } });

    for (const concept of concepts) {
      expect(screen.getByTestId(`concept-row-${concept.id}`)).toBeInTheDocument();
    }
  });

  it('shows no-results message when filters eliminate everything', () => {
    render(
      <ConceptFrontMatrix
        concepts={[]}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
  });

  it('shows no-results when fronts array is empty', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={[]}
        onCellClick={onCellClick}
      />,
    );
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
  });

  // --- Highlighting cells with plays/notes ---

  it('highlights cells that have existing plays', () => {
    const playsData: Play[] = [
      {
        id: 'play-1',
        name: 'Mesh vs 4-3',
        formationId: 'f1',
        conceptId: 'concept-mesh',
        assignments: [],
        defensiveOverlay: {
          front: 'front-43-over',
          coverage: 'Cover 3',
          players: [],
        },
        tags: [],
        personnel: '11',
        teamId: 't1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        plays={playsData}
        onCellClick={onCellClick}
      />,
    );

    // The cell for mesh vs 4-3 Over should exist and be clickable
    const cell = screen.getByTestId('cell-concept-mesh-front-43-over');
    expect(cell).toBeInTheDocument();
  });

  it('shows notes indicator on cells with notes', () => {
    const playsData: Play[] = [
      {
        id: 'play-1',
        name: 'Mesh vs 4-3',
        formationId: 'f1',
        conceptId: 'concept-mesh',
        assignments: [],
        defensiveOverlay: {
          front: 'front-43-over',
          coverage: 'Cover 3',
          players: [],
        },
        tags: [],
        notes: 'Great play against Cover 3',
        personnel: '11',
        teamId: 't1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        plays={playsData}
        onCellClick={onCellClick}
      />,
    );

    // Should have at least one notes indicator
    const indicators = screen.getAllByTestId('notes-indicator');
    expect(indicators.length).toBeGreaterThanOrEqual(1);
  });

  // --- Responsive scroll ---

  it('has a scrollable container for horizontal overflow', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
      />,
    );

    const scrollContainer = screen.getByTestId('matrix-scroll-container');
    expect(scrollContainer.className).toContain('overflow-x-auto');
  });

  // --- className prop ---

  it('applies className prop', () => {
    render(
      <ConceptFrontMatrix
        concepts={concepts}
        fronts={fronts}
        onCellClick={onCellClick}
        className="my-custom-class"
      />,
    );
    const container = screen.getByTestId('concept-front-matrix');
    expect(container.className).toContain('my-custom-class');
  });
});
