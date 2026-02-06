import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ScoutingNotes } from '@/components/gameplan/ScoutingNotes';
import type { ScoutingNote } from '@/types';

// ============================================================
// Helpers
// ============================================================

function makeNote(overrides: Partial<ScoutingNote> = {}): ScoutingNote {
  return {
    id: 'note-1',
    gamePlanId: 'gp-1',
    type: 'player',
    targetId: 'player-1',
    content: 'Struggles against speed rushers',
    sentiment: 'weakness',
    tags: [],
    teamId: 'team-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
  };
}

// ============================================================
// Tests
// ============================================================

describe('ScoutingNotes', () => {
  it('renders the scouting notes container', () => {
    render(
      <ScoutingNotes
        playerId="p1"
        notes={[]}
        onAddNote={vi.fn()}
        onDeleteNote={vi.fn()}
      />,
    );
    expect(screen.getByTestId('scouting-notes')).toBeInTheDocument();
  });

  it('shows empty message when no notes exist', () => {
    render(
      <ScoutingNotes
        playerId="p1"
        notes={[]}
        onAddNote={vi.fn()}
        onDeleteNote={vi.fn()}
      />,
    );
    expect(screen.getByTestId('empty-message')).toBeInTheDocument();
    expect(screen.getByText(/No notes yet/)).toBeInTheDocument();
  });

  it('renders a list of notes when notes are provided', () => {
    const notes = [
      makeNote({ id: 'n1', content: 'First note' }),
      makeNote({ id: 'n2', content: 'Second note', sentiment: 'strength' }),
    ];

    render(
      <ScoutingNotes
        playerId="p1"
        notes={notes}
        onAddNote={vi.fn()}
        onDeleteNote={vi.fn()}
      />,
    );

    const items = screen.getAllByTestId('note-item');
    expect(items).toHaveLength(2);
    expect(screen.getByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
  });

  it('displays the sentiment badge for each note', () => {
    const notes = [
      makeNote({ id: 'n1', sentiment: 'weakness' }),
      makeNote({ id: 'n2', content: 'Good blocking', sentiment: 'strength' }),
    ];

    render(
      <ScoutingNotes
        playerId="p1"
        notes={notes}
        onAddNote={vi.fn()}
        onDeleteNote={vi.fn()}
      />,
    );

    expect(screen.getByText('weakness')).toBeInTheDocument();
    expect(screen.getByText('strength')).toBeInTheDocument();
  });

  it('calls onDeleteNote with the note id when delete button is clicked', () => {
    const onDeleteNote = vi.fn();
    const notes = [makeNote({ id: 'note-42', content: 'Delete me' })];

    render(
      <ScoutingNotes
        playerId="p1"
        notes={notes}
        onAddNote={vi.fn()}
        onDeleteNote={onDeleteNote}
      />,
    );

    const deleteBtn = screen.getByTestId('delete-note-btn');
    fireEvent.click(deleteBtn);
    expect(onDeleteNote).toHaveBeenCalledWith('note-42');
  });

  it('renders the add note form', () => {
    render(
      <ScoutingNotes
        playerId="p1"
        notes={[]}
        onAddNote={vi.fn()}
        onDeleteNote={vi.fn()}
      />,
    );

    expect(screen.getByTestId('add-note-form')).toBeInTheDocument();
    expect(screen.getByTestId('note-input')).toBeInTheDocument();
    expect(screen.getByTestId('sentiment-select')).toBeInTheDocument();
    expect(screen.getByTestId('add-note-btn')).toBeInTheDocument();
  });

  it('disables the submit button when input is empty', () => {
    render(
      <ScoutingNotes
        playerId="p1"
        notes={[]}
        onAddNote={vi.fn()}
        onDeleteNote={vi.fn()}
      />,
    );

    const submitBtn = screen.getByTestId('add-note-btn');
    expect(submitBtn).toBeDisabled();
  });

  it('calls onAddNote with correct data when form is submitted', async () => {
    const onAddNote = vi.fn();
    const user = userEvent.setup();

    render(
      <ScoutingNotes
        playerId="player-99"
        notes={[]}
        onAddNote={onAddNote}
        onDeleteNote={vi.fn()}
      />,
    );

    const input = screen.getByTestId('note-input');
    const select = screen.getByTestId('sentiment-select');
    const submitBtn = screen.getByTestId('add-note-btn');

    await user.type(input, 'Weak against the run');
    await user.selectOptions(select, 'weakness');
    await user.click(submitBtn);

    expect(onAddNote).toHaveBeenCalledTimes(1);
    expect(onAddNote).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'player-99',
        content: 'Weak against the run',
        sentiment: 'weakness',
        type: 'player',
      }),
    );
  });

  it('clears the input after successful submission', async () => {
    const user = userEvent.setup();

    render(
      <ScoutingNotes
        playerId="p1"
        notes={[]}
        onAddNote={vi.fn()}
        onDeleteNote={vi.fn()}
      />,
    );

    const input = screen.getByTestId('note-input') as HTMLTextAreaElement;
    await user.type(input, 'Some note');
    await user.click(screen.getByTestId('add-note-btn'));

    expect(input.value).toBe('');
  });

  it('does not submit when input is only whitespace', async () => {
    const onAddNote = vi.fn();
    const user = userEvent.setup();

    render(
      <ScoutingNotes
        playerId="p1"
        notes={[]}
        onAddNote={onAddNote}
        onDeleteNote={vi.fn()}
      />,
    );

    const input = screen.getByTestId('note-input');
    await user.type(input, '   ');

    // Button should be disabled for whitespace-only content
    const submitBtn = screen.getByTestId('add-note-btn');
    expect(submitBtn).toBeDisabled();
  });

  it('has three sentiment options in the select', () => {
    render(
      <ScoutingNotes
        playerId="p1"
        notes={[]}
        onAddNote={vi.fn()}
        onDeleteNote={vi.fn()}
      />,
    );

    const select = screen.getByTestId('sentiment-select');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
    const values = Array.from(options).map((o) => o.value);
    expect(values).toContain('weakness');
    expect(values).toContain('strength');
    expect(values).toContain('neutral');
  });
});
