import { describe, it, expect } from 'vitest';
import {
  getOptimalLayout,
  getToolbarPosition,
  getLayoutConfig,
  isConstrainedTablet,
  getCanvasToolbarStyle,
  type TabletLayoutMode,
} from '@/lib/tablet-layout';

describe('tablet-layout', () => {
  describe('getOptimalLayout', () => {
    // Playbook rules
    it('returns split-pane for playbook at >=768px', () => {
      expect(getOptimalLayout(768, 1024, 'playbook')).toBe('split-pane');
      expect(getOptimalLayout(1200, 800, 'playbook')).toBe('split-pane');
    });

    it('returns single-pane for playbook at <768px', () => {
      expect(getOptimalLayout(767, 1024, 'playbook')).toBe('single-pane');
      expect(getOptimalLayout(375, 667, 'playbook')).toBe('single-pane');
    });

    // Canvas rules
    it('returns single-pane for canvas at any width', () => {
      expect(getOptimalLayout(375, 667, 'canvas')).toBe('single-pane');
      expect(getOptimalLayout(768, 1024, 'canvas')).toBe('single-pane');
      expect(getOptimalLayout(1200, 800, 'canvas')).toBe('single-pane');
    });

    it('returns single-pane for sketch at any width', () => {
      expect(getOptimalLayout(1200, 800, 'sketch')).toBe('single-pane');
    });

    // Game plan rules
    it('returns split-pane for gameplan at >=1024px', () => {
      expect(getOptimalLayout(1024, 768, 'gameplan')).toBe('split-pane');
      expect(getOptimalLayout(1200, 800, 'gameplan')).toBe('split-pane');
    });

    it('returns single-pane for gameplan at <1024px', () => {
      expect(getOptimalLayout(1023, 768, 'gameplan')).toBe('single-pane');
      expect(getOptimalLayout(768, 1024, 'gameplan')).toBe('single-pane');
    });

    // Practice rules
    it('returns split-pane for practice at >=768px', () => {
      expect(getOptimalLayout(768, 1024, 'practice')).toBe('split-pane');
    });

    it('returns single-pane for practice at <768px', () => {
      expect(getOptimalLayout(767, 1024, 'practice')).toBe('single-pane');
    });

    // Game day rules
    it('returns split-pane for gameday at >=768px', () => {
      expect(getOptimalLayout(768, 1024, 'gameday')).toBe('split-pane');
    });

    it('returns single-pane for gameday at <768px', () => {
      expect(getOptimalLayout(375, 667, 'gameday')).toBe('single-pane');
    });

    // Settings
    it('returns single-pane for settings at any width', () => {
      expect(getOptimalLayout(1200, 800, 'settings')).toBe('single-pane');
      expect(getOptimalLayout(375, 667, 'settings')).toBe('single-pane');
    });

    // Default fallback
    it('returns split-pane for unknown feature at >=768px', () => {
      expect(getOptimalLayout(800, 600, 'unknown-feature')).toBe('split-pane');
    });

    it('returns single-pane for unknown feature at <768px', () => {
      expect(getOptimalLayout(375, 667, 'unknown-feature')).toBe('single-pane');
    });
  });

  describe('getToolbarPosition', () => {
    it('returns bottom for mobile breakpoint', () => {
      expect(getToolbarPosition('mobile')).toBe('bottom');
    });

    it('returns floating for tablet breakpoint', () => {
      expect(getToolbarPosition('tablet')).toBe('floating');
    });

    it('returns side for desktop breakpoint', () => {
      expect(getToolbarPosition('desktop')).toBe('side');
    });

    it('returns bottom for unknown breakpoint', () => {
      expect(getToolbarPosition('unknown')).toBe('bottom');
    });
  });

  describe('getLayoutConfig', () => {
    it('returns full config for mobile playbook', () => {
      const config = getLayoutConfig(375, 667, 'playbook');
      expect(config.mode).toBe('single-pane');
      expect(config.toolbarPosition).toBe('bottom');
      expect(config.sidebarWidth).toBe(0);
      expect(config.contentPadding).toBe(8);
    });

    it('returns full config for tablet playbook', () => {
      const config = getLayoutConfig(800, 1024, 'playbook');
      expect(config.mode).toBe('split-pane');
      expect(config.toolbarPosition).toBe('floating');
      expect(config.sidebarWidth).toBe(280);
      expect(config.contentPadding).toBe(16);
    });

    it('returns full config for desktop playbook', () => {
      const config = getLayoutConfig(1200, 800, 'playbook');
      expect(config.mode).toBe('split-pane');
      expect(config.toolbarPosition).toBe('side');
      expect(config.sidebarWidth).toBe(320);
      expect(config.contentPadding).toBe(24);
    });

    it('returns floating toolbar for canvas at any size', () => {
      const mobile = getLayoutConfig(375, 667, 'canvas');
      expect(mobile.toolbarPosition).toBe('floating');

      const tablet = getLayoutConfig(800, 1024, 'canvas');
      expect(tablet.toolbarPosition).toBe('floating');

      const desktop = getLayoutConfig(1200, 800, 'canvas');
      expect(desktop.toolbarPosition).toBe('floating');
    });

    it('returns no sidebar for single-pane modes', () => {
      const config = getLayoutConfig(375, 667, 'playbook');
      expect(config.sidebarWidth).toBe(0);
    });
  });

  describe('isConstrainedTablet', () => {
    it('returns true for widths between 320 and 767', () => {
      expect(isConstrainedTablet(320)).toBe(true);
      expect(isConstrainedTablet(500)).toBe(true);
      expect(isConstrainedTablet(767)).toBe(true);
    });

    it('returns false for widths below 320', () => {
      expect(isConstrainedTablet(200)).toBe(false);
      expect(isConstrainedTablet(319)).toBe(false);
    });

    it('returns false for widths >= 768', () => {
      expect(isConstrainedTablet(768)).toBe(false);
      expect(isConstrainedTablet(1024)).toBe(false);
    });
  });

  describe('getCanvasToolbarStyle', () => {
    it('returns compact for mobile widths', () => {
      expect(getCanvasToolbarStyle(375)).toBe('compact');
      expect(getCanvasToolbarStyle(767)).toBe('compact');
    });

    it('returns standard for tablet widths', () => {
      expect(getCanvasToolbarStyle(768)).toBe('standard');
      expect(getCanvasToolbarStyle(1024)).toBe('standard');
    });

    it('returns expanded for desktop widths', () => {
      expect(getCanvasToolbarStyle(1025)).toBe('expanded');
      expect(getCanvasToolbarStyle(1440)).toBe('expanded');
    });
  });
});
