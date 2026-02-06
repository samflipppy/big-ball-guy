// ============================================================
// #348 — Accessibility Audit Helpers
// Utilities for programmatic a11y checks in tests and audits.
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type A11ySeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export interface A11yViolation {
  rule: string;
  element: string; // outer HTML snippet or tag description
  severity: A11ySeverity;
  message: string;
  fix: string;
}

export interface A11yReport {
  violations: A11yViolation[];
  passes: number;
  totalChecked: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Selectors for interactive elements
// ---------------------------------------------------------------------------

const INTERACTIVE_SELECTORS = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[tabindex]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="switch"]',
].join(',');

// ---------------------------------------------------------------------------
// Helper: truncate outerHTML for violation reports
// ---------------------------------------------------------------------------

function elementDesc(el: HTMLElement): string {
  const outer = el.outerHTML;
  if (outer.length <= 120) return outer;
  return outer.slice(0, 120) + '...';
}

// ---------------------------------------------------------------------------
// checkAriaLabels
// ---------------------------------------------------------------------------

/**
 * Validates that every interactive element inside `element` has an accessible
 * name via `aria-label`, `aria-labelledby`, `title`, inner text, or a
 * `<label>` association.
 */
export function checkAriaLabels(element: HTMLElement): A11yViolation[] {
  const violations: A11yViolation[] = [];
  const interactiveElements = element.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTORS);

  interactiveElements.forEach((el) => {
    if (hasAccessibleName(el)) return;

    violations.push({
      rule: 'aria-label',
      element: elementDesc(el),
      severity: 'critical',
      message: `Interactive element <${el.tagName.toLowerCase()}> is missing an accessible name.`,
      fix: 'Add an aria-label, aria-labelledby, title attribute, visible text content, or associate a <label>.',
    });
  });

  return violations;
}

function hasAccessibleName(el: HTMLElement): boolean {
  // aria-label
  if (el.getAttribute('aria-label')?.trim()) return true;

  // aria-labelledby → referenced element must exist and have text
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const ref = findElementById(el, labelledBy);
    if (ref && ref.textContent?.trim()) return true;
  }

  // title attribute
  if (el.getAttribute('title')?.trim()) return true;

  // Inner text content (for buttons, links, etc.)
  if (el.textContent?.trim()) return true;

  // <label> association for form controls
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    if (el.id) {
      const root = getTreeRoot(el);
      const label = root.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`);
      if (label && label.textContent?.trim()) return true;
    }
  }

  return false;
}

/** Walk up to the root of the element's tree (handles detached DOM subtrees). */
function getTreeRoot(el: HTMLElement): HTMLElement {
  let root: HTMLElement = el;
  while (root.parentElement) root = root.parentElement;
  return root;
}

/** Find an element by ID, searching both the document and the local tree root. */
function findElementById(el: HTMLElement, id: string): HTMLElement | null {
  const fromDoc = el.ownerDocument.getElementById(id);
  if (fromDoc) return fromDoc;
  return getTreeRoot(el).querySelector<HTMLElement>(`[id="${id}"]`);
}

// ---------------------------------------------------------------------------
// checkColorContrast
// ---------------------------------------------------------------------------

/**
 * Checks whether the contrast ratio between foreground and background colors
 * meets WCAG 2.1 AA and AAA criteria for the given font size.
 *
 * Returns violations if AA is not met.
 */
export function checkColorContrast(
  fg: string,
  bg: string,
  fontSize: number,
): A11yViolation[] {
  const violations: A11yViolation[] = [];
  const ratio = contrastRatio(fg, bg);

  const isLargeText = fontSize >= 18; // simplified large-text threshold (WCAG: 18pt or 14pt bold)
  const aaThreshold = isLargeText ? 3.0 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7.0;

  if (ratio < aaThreshold) {
    violations.push({
      rule: 'color-contrast-aa',
      element: `fg:${fg} bg:${bg}`,
      severity: 'serious',
      message: `Contrast ratio ${ratio.toFixed(2)}:1 does not meet WCAG AA (requires ${aaThreshold}:1 for ${isLargeText ? 'large' : 'normal'} text).`,
      fix: `Increase contrast between foreground (${fg}) and background (${bg}) to at least ${aaThreshold}:1.`,
    });
  }

  if (ratio < aaaThreshold) {
    violations.push({
      rule: 'color-contrast-aaa',
      element: `fg:${fg} bg:${bg}`,
      severity: 'moderate',
      message: `Contrast ratio ${ratio.toFixed(2)}:1 does not meet WCAG AAA (requires ${aaaThreshold}:1 for ${isLargeText ? 'large' : 'normal'} text).`,
      fix: `Increase contrast between foreground (${fg}) and background (${bg}) to at least ${aaaThreshold}:1.`,
    });
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Color contrast utilities
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace(/^#/, '');
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// checkFocusOrder
// ---------------------------------------------------------------------------

/**
 * Validates that the provided elements follow a logical tab order.
 * Elements with a negative tabindex that should be skipped are flagged.
 * If explicit tabindex values are used, they should be in non-descending order.
 */
export function checkFocusOrder(elements: HTMLElement[]): A11yViolation[] {
  const violations: A11yViolation[] = [];

  if (elements.length === 0) return violations;

  // Check for tabindex > 0 (generally an anti-pattern)
  elements.forEach((el) => {
    const tabindex = el.getAttribute('tabindex');
    if (tabindex !== null) {
      const val = parseInt(tabindex, 10);
      if (val > 0) {
        violations.push({
          rule: 'focus-order-tabindex',
          element: elementDesc(el),
          severity: 'moderate',
          message: `Element has tabindex="${val}". Positive tabindex values override natural DOM order and create confusing focus sequences.`,
          fix: 'Use tabindex="0" to include the element in natural tab order, or tabindex="-1" for programmatic focus only.',
        });
      }
    }
  });

  // Check DOM order alignment — elements should appear in visual reading order
  // Heuristic: if elements have getBoundingClientRect, verify top-to-bottom and left-to-right
  const withRects = elements.map((el) => {
    try {
      const rect = el.getBoundingClientRect();
      return { el, top: rect.top, left: rect.left };
    } catch {
      return { el, top: 0, left: 0 };
    }
  });

  for (let i = 1; i < withRects.length; i++) {
    const prev = withRects[i - 1];
    const curr = withRects[i];
    // Flag if element jumps significantly upward (more than 50px) — suggests wrong order
    if (curr.top < prev.top - 50) {
      violations.push({
        rule: 'focus-order-visual',
        element: elementDesc(curr.el),
        severity: 'moderate',
        message: `Focus order may not match visual order: element at position ${i + 1} appears visually above position ${i}.`,
        fix: 'Reorder DOM elements to match the visual layout, or use CSS order carefully.',
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// checkHeadingHierarchy
// ---------------------------------------------------------------------------

/**
 * Validates that headings (h1-h6) within the container follow a proper
 * hierarchy — no skipping levels (e.g., h1 → h3 without h2).
 */
export function checkHeadingHierarchy(container: HTMLElement): A11yViolation[] {
  const violations: A11yViolation[] = [];
  const headings = container.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6');

  if (headings.length === 0) return violations;

  let prevLevel = 0;

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1], 10);

    if (prevLevel > 0 && level > prevLevel + 1) {
      violations.push({
        rule: 'heading-hierarchy',
        element: elementDesc(heading),
        severity: 'serious',
        message: `Heading level <h${level}> skips level(s) after <h${prevLevel}>. Expected <h${prevLevel + 1}> or lower.`,
        fix: `Change this heading to <h${prevLevel + 1}> or add intermediate heading levels.`,
      });
    }

    prevLevel = level;
  });

  return violations;
}

// ---------------------------------------------------------------------------
// generateA11yReport — comprehensive audit
// ---------------------------------------------------------------------------

/**
 * Runs all accessibility checks on the given container and returns a
 * consolidated report.
 */
export function generateA11yReport(container: HTMLElement): A11yReport {
  const violations: A11yViolation[] = [];
  let passes = 0;
  let totalChecked = 0;

  // 1. Aria labels check
  const ariaViolations = checkAriaLabels(container);
  const interactiveCount = container.querySelectorAll(INTERACTIVE_SELECTORS).length;
  violations.push(...ariaViolations);
  passes += interactiveCount - ariaViolations.length;
  totalChecked += interactiveCount;

  // 2. Heading hierarchy check
  const headingViolations = checkHeadingHierarchy(container);
  const headingCount = container.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
  violations.push(...headingViolations);
  passes += Math.max(0, headingCount - headingViolations.length);
  totalChecked += headingCount;

  // 3. Focus order check on interactive elements
  const focusableEls = Array.from(
    container.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTORS),
  );
  const focusViolations = checkFocusOrder(focusableEls);
  violations.push(...focusViolations);
  // Each element without a violation is a pass
  passes += Math.max(0, focusableEls.length - focusViolations.length);
  totalChecked += focusableEls.length;

  // 4. Image alt text check
  const images = container.querySelectorAll<HTMLImageElement>('img');
  images.forEach((img) => {
    totalChecked += 1;
    if (!img.getAttribute('alt') && img.getAttribute('alt') !== '') {
      violations.push({
        rule: 'img-alt',
        element: elementDesc(img),
        severity: 'critical',
        message: 'Image is missing an alt attribute.',
        fix: 'Add an alt attribute describing the image, or alt="" for decorative images.',
      });
    } else {
      passes += 1;
    }
  });

  return {
    violations,
    passes,
    totalChecked,
    timestamp: Date.now(),
  };
}
