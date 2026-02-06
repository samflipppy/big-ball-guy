import { describe, it, expect } from 'vitest';
import {
  checkAriaLabels,
  checkColorContrast,
  checkFocusOrder,
  checkHeadingHierarchy,
  generateA11yReport,
} from '@/lib/testing/a11y-helpers';
import type { A11yViolation } from '@/lib/testing/a11y-helpers';

/** Helper to create a container with innerHTML. */
function createContainer(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('Accessibility Audit Helpers', () => {
  // -----------------------------------------------------------------------
  // checkAriaLabels
  // -----------------------------------------------------------------------

  describe('checkAriaLabels', () => {
    it('passes when all interactive elements have accessible names', () => {
      const container = createContainer(`
        <button>Save Play</button>
        <a href="/plays">View Plays</a>
        <input aria-label="Search plays" />
      `);

      const violations = checkAriaLabels(container);
      expect(violations).toHaveLength(0);
    });

    it('flags interactive elements without labels', () => {
      const container = createContainer(`
        <button></button>
        <input />
        <a href="/plays"></a>
      `);

      const violations = checkAriaLabels(container);
      expect(violations.length).toBeGreaterThanOrEqual(3);
      expect(violations[0].rule).toBe('aria-label');
      expect(violations[0].severity).toBe('critical');
    });

    it('accepts aria-labelledby references', () => {
      const container = createContainer(`
        <span id="btn-label">Delete</span>
        <button aria-labelledby="btn-label"></button>
      `);

      const violations = checkAriaLabels(container);
      expect(violations).toHaveLength(0);
    });

    it('accepts title attribute as label', () => {
      const container = createContainer(`
        <button title="Close dialog"></button>
      `);

      const violations = checkAriaLabels(container);
      expect(violations).toHaveLength(0);
    });

    it('accepts label[for] association', () => {
      const container = createContainer(`
        <label for="email-input">Email</label>
        <input id="email-input" />
      `);

      const violations = checkAriaLabels(container);
      expect(violations).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // checkColorContrast
  // -----------------------------------------------------------------------

  describe('checkColorContrast', () => {
    it('passes for black on white (21:1 ratio)', () => {
      const violations = checkColorContrast('#000000', '#FFFFFF', 16);
      expect(violations).toHaveLength(0);
    });

    it('flags insufficient contrast for AA', () => {
      // Light gray on white — very low contrast
      const violations = checkColorContrast('#CCCCCC', '#FFFFFF', 16);
      const aaViolation = violations.find((v) => v.rule === 'color-contrast-aa');
      expect(aaViolation).toBeDefined();
      expect(aaViolation!.severity).toBe('serious');
    });

    it('flags insufficient contrast for AAA but may pass AA', () => {
      // Medium contrast — might pass AA but not AAA
      const violations = checkColorContrast('#767676', '#FFFFFF', 16);
      // #767676 on white is approximately 4.54:1 — passes AA (4.5:1) but not AAA (7:1)
      const aaViolation = violations.find((v) => v.rule === 'color-contrast-aa');
      const aaaViolation = violations.find((v) => v.rule === 'color-contrast-aaa');
      expect(aaViolation).toBeUndefined();
      expect(aaaViolation).toBeDefined();
    });

    it('uses lower thresholds for large text', () => {
      // For large text (>=18px), AA requires only 3:1
      const violations = checkColorContrast('#999999', '#FFFFFF', 18);
      // #999999 on white is approximately 2.85:1 — fails even large-text AA
      const aaViolation = violations.find((v) => v.rule === 'color-contrast-aa');
      expect(aaViolation).toBeDefined();
    });

    it('returns violation messages with ratio information', () => {
      const violations = checkColorContrast('#FFFFFF', '#FFFFFF', 16);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('1.00');
    });
  });

  // -----------------------------------------------------------------------
  // checkFocusOrder
  // -----------------------------------------------------------------------

  describe('checkFocusOrder', () => {
    it('returns no violations for an empty list', () => {
      expect(checkFocusOrder([])).toHaveLength(0);
    });

    it('flags positive tabindex values', () => {
      const container = createContainer(`
        <button tabindex="5">First</button>
        <button tabindex="0">Second</button>
      `);

      const elements = Array.from(container.querySelectorAll<HTMLElement>('button'));
      const violations = checkFocusOrder(elements);

      const tabindexViolation = violations.find((v) => v.rule === 'focus-order-tabindex');
      expect(tabindexViolation).toBeDefined();
      expect(tabindexViolation!.severity).toBe('moderate');
    });

    it('passes when all elements use tabindex 0 or none', () => {
      const container = createContainer(`
        <button>A</button>
        <button tabindex="0">B</button>
        <button>C</button>
      `);

      const elements = Array.from(container.querySelectorAll<HTMLElement>('button'));
      const violations = checkFocusOrder(elements);
      // No positive tabindex violations
      const tabindexViolations = violations.filter((v) => v.rule === 'focus-order-tabindex');
      expect(tabindexViolations).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // checkHeadingHierarchy
  // -----------------------------------------------------------------------

  describe('checkHeadingHierarchy', () => {
    it('passes for properly ordered headings', () => {
      const container = createContainer(`
        <h1>Main Title</h1>
        <h2>Section</h2>
        <h3>Sub-section</h3>
        <h2>Another Section</h2>
      `);

      const violations = checkHeadingHierarchy(container);
      expect(violations).toHaveLength(0);
    });

    it('flags skipped heading levels', () => {
      const container = createContainer(`
        <h1>Title</h1>
        <h3>Skipped h2!</h3>
      `);

      const violations = checkHeadingHierarchy(container);
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('heading-hierarchy');
      expect(violations[0].message).toContain('h3');
      expect(violations[0].message).toContain('h1');
    });

    it('flags multiple hierarchy violations', () => {
      const container = createContainer(`
        <h1>Title</h1>
        <h4>Skipped h2 and h3</h4>
        <h6>Skipped more</h6>
      `);

      const violations = checkHeadingHierarchy(container);
      expect(violations.length).toBeGreaterThanOrEqual(2);
    });

    it('returns empty for container with no headings', () => {
      const container = createContainer('<p>Just a paragraph</p>');
      expect(checkHeadingHierarchy(container)).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // generateA11yReport
  // -----------------------------------------------------------------------

  describe('generateA11yReport', () => {
    it('produces a comprehensive report for a valid page', () => {
      const container = createContainer(`
        <h1>Playbook</h1>
        <h2>Formations</h2>
        <button>Add Formation</button>
        <a href="/plays">View Plays</a>
        <img alt="Team logo" src="/logo.png" />
      `);

      const report = generateA11yReport(container);
      expect(report.violations).toHaveLength(0);
      expect(report.passes).toBeGreaterThan(0);
      expect(report.totalChecked).toBeGreaterThan(0);
      expect(report.timestamp).toBeGreaterThan(0);
    });

    it('includes violations from multiple checks', () => {
      const container = createContainer(`
        <h1>Title</h1>
        <h4>Skipped h2 and h3</h4>
        <button></button>
        <img src="/photo.jpg" />
      `);

      const report = generateA11yReport(container);
      const rules = report.violations.map((v: A11yViolation) => v.rule);

      expect(rules).toContain('heading-hierarchy');
      expect(rules).toContain('aria-label');
    });

    it('counts both passes and violations', () => {
      const container = createContainer(`
        <h1>Title</h1>
        <h2>Section</h2>
        <button>OK</button>
        <button></button>
      `);

      const report = generateA11yReport(container);
      expect(report.passes).toBeGreaterThan(0);
      expect(report.violations.length).toBeGreaterThan(0);
      expect(report.totalChecked).toBe(report.passes + report.violations.length);
    });

    it('checks images for alt attributes', () => {
      const container = createContainer(`
        <img src="/a.png" />
      `);

      const report = generateA11yReport(container);
      const imgViolations = report.violations.filter((v: A11yViolation) => v.rule === 'img-alt');
      expect(imgViolations).toHaveLength(1);
    });
  });
});
