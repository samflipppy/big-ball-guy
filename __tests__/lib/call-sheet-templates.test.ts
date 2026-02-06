import { describe, it, expect } from 'vitest';
import type { Play } from '@/types';
import {
  STANDARD_TEMPLATE,
  COMPRESSED_TEMPLATE,
  CATEGORIZED_TEMPLATE,
  BUILT_IN_TEMPLATES,
  getTemplate,
  applyTemplate,
  createCustomTemplate,
  type CallSheetTemplate,
} from '@/lib/call-sheet-templates';

// ============================================================
// Test data factories
// ============================================================

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    id: 'play-1',
    name: 'HB Dive',
    formationId: 'formation-1',
    assignments: [],
    tags: ['run'],
    personnel: '11',
    teamId: 'team-1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    ...overrides,
  };
}

function makePlays(count: number): Play[] {
  return Array.from({ length: count }, (_, i) =>
    makePlay({ id: `play-${i}`, name: `Play ${i}` }),
  );
}

// ============================================================
// Tests
// ============================================================

describe('call-sheet-templates', () => {
  describe('BUILT_IN_TEMPLATES', () => {
    it('has exactly 3 built-in templates', () => {
      expect(BUILT_IN_TEMPLATES).toHaveLength(3);
    });

    it('standard template has 4 columns', () => {
      expect(STANDARD_TEMPLATE.columns).toBe(4);
      expect(STANDARD_TEMPLATE.id).toBe('standard');
    });

    it('compressed template has 6 columns', () => {
      expect(COMPRESSED_TEMPLATE.columns).toBe(6);
      expect(COMPRESSED_TEMPLATE.id).toBe('compressed');
    });

    it('categorized template shows situation', () => {
      expect(CATEGORIZED_TEMPLATE.showSituation).toBe(true);
      expect(CATEGORIZED_TEMPLATE.id).toBe('categorized');
    });

    it('all templates have valid header fields', () => {
      for (const template of BUILT_IN_TEMPLATES) {
        expect(template.headerFields.length).toBeGreaterThan(0);
        expect(template.name.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getTemplate', () => {
    it('returns standard template by id', () => {
      const template = getTemplate('standard');
      expect(template).toBeDefined();
      expect(template!.id).toBe('standard');
    });

    it('returns compressed template by id', () => {
      const template = getTemplate('compressed');
      expect(template).toBeDefined();
      expect(template!.columns).toBe(6);
    });

    it('returns undefined for unknown id', () => {
      const template = getTemplate('nonexistent');
      expect(template).toBeUndefined();
    });
  });

  describe('applyTemplate', () => {
    it('arranges plays into a grid for standard template', () => {
      const plays = makePlays(8);
      const grid = applyTemplate(plays, STANDARD_TEMPLATE);

      expect(grid.templateId).toBe('standard');
      expect(grid.columns).toBe(4);
      expect(grid.cells).toHaveLength(8);
    });

    it('assigns correct row and column positions', () => {
      const plays = makePlays(5);
      const grid = applyTemplate(plays, STANDARD_TEMPLATE);

      // First row: columns 0,1,2,3
      expect(grid.cells[0].row).toBe(0);
      expect(grid.cells[0].column).toBe(0);
      expect(grid.cells[3].row).toBe(0);
      expect(grid.cells[3].column).toBe(3);
      // Second row starts
      expect(grid.cells[4].row).toBe(1);
      expect(grid.cells[4].column).toBe(0);
    });

    it('limits plays to maxCells (columns * rows)', () => {
      const template: CallSheetTemplate = {
        ...STANDARD_TEMPLATE,
        columns: 2,
        rows: 2,
      };
      const plays = makePlays(10);
      const grid = applyTemplate(plays, template);

      expect(grid.cells).toHaveLength(4); // 2*2 = 4
    });

    it('handles empty plays array', () => {
      const grid = applyTemplate([], STANDARD_TEMPLATE);

      expect(grid.cells).toHaveLength(0);
      expect(grid.templateId).toBe('standard');
    });

    it('uses compressed template with 6 columns', () => {
      const plays = makePlays(12);
      const grid = applyTemplate(plays, COMPRESSED_TEMPLATE);

      expect(grid.columns).toBe(6);
      expect(grid.cells).toHaveLength(12);
      // Verify second row starts at index 6
      expect(grid.cells[6].row).toBe(1);
      expect(grid.cells[6].column).toBe(0);
    });

    it('groups by category for categorized template', () => {
      const plays = [
        makePlay({ id: 'p1', name: 'Run 1', category: 'Run' }),
        makePlay({ id: 'p2', name: 'Run 2', category: 'Run' }),
        makePlay({ id: 'p3', name: 'Pass 1', category: 'Pass' }),
        makePlay({ id: 'p4', name: 'Pass 2', category: 'Pass' }),
      ];
      const grid = applyTemplate(plays, CATEGORIZED_TEMPLATE);

      expect(grid.cells).toHaveLength(4);
      // Run plays should come first as a group
      const runCells = grid.cells.filter((c) => c.situation === 'Run');
      const passCells = grid.cells.filter((c) => c.situation === 'Pass');
      expect(runCells).toHaveLength(2);
      expect(passCells).toHaveLength(2);
    });

    it('uses "General" as default situation for uncategorized plays', () => {
      const plays = [makePlay({ id: 'p1', name: 'NoCategory' })];
      const grid = applyTemplate(plays, CATEGORIZED_TEMPLATE);

      expect(grid.cells[0].situation).toBe('General');
    });

    it('preserves play IDs and names in cells', () => {
      const plays = [
        makePlay({ id: 'my-play', name: 'Specific Play Name' }),
      ];
      const grid = applyTemplate(plays, STANDARD_TEMPLATE);

      expect(grid.cells[0].playId).toBe('my-play');
      expect(grid.cells[0].playName).toBe('Specific Play Name');
    });

    it('includes header fields from the template', () => {
      const grid = applyTemplate([], STANDARD_TEMPLATE);

      expect(grid.headerFields).toEqual(STANDARD_TEMPLATE.headerFields);
    });
  });

  describe('createCustomTemplate', () => {
    it('creates a template with the given name', () => {
      const template = createCustomTemplate('My Template');

      expect(template.name).toBe('My Template');
      expect(template.id).toContain('custom-');
    });

    it('uses standard defaults for unspecified fields', () => {
      const template = createCustomTemplate('Default Test');

      expect(template.columns).toBe(STANDARD_TEMPLATE.columns);
      expect(template.rows).toBe(STANDARD_TEMPLATE.rows);
      expect(template.showSituation).toBe(false);
    });

    it('overrides specific fields from config', () => {
      const template = createCustomTemplate('Wide Sheet', {
        columns: 5,
        rows: 15,
        showSituation: true,
      });

      expect(template.columns).toBe(5);
      expect(template.rows).toBe(15);
      expect(template.showSituation).toBe(true);
    });

    it('allows custom cell size', () => {
      const template = createCustomTemplate('Big Cells', {
        cellSize: { width: 200, height: 100 },
      });

      expect(template.cellSize.width).toBe(200);
      expect(template.cellSize.height).toBe(100);
    });

    it('allows custom header fields', () => {
      const template = createCustomTemplate('Custom Headers', {
        headerFields: ['Name', 'Custom Field'],
      });

      expect(template.headerFields).toEqual(['Name', 'Custom Field']);
    });

    it('generates unique IDs for different templates', () => {
      const t1 = createCustomTemplate('Template A');
      const t2 = createCustomTemplate('Template B');

      expect(t1.id).not.toBe(t2.id);
    });

    it('allows overriding the ID', () => {
      const template = createCustomTemplate('Named ID', { id: 'my-id' });

      expect(template.id).toBe('my-id');
    });

    it('created template works with applyTemplate', () => {
      const template = createCustomTemplate('Functional', { columns: 3, rows: 5 });
      const plays = makePlays(6);
      const grid = applyTemplate(plays, template);

      expect(grid.columns).toBe(3);
      expect(grid.cells).toHaveLength(6);
      expect(grid.cells[3].row).toBe(1);
      expect(grid.cells[3].column).toBe(0);
    });
  });
});
