import { describe, it, expect, beforeEach } from 'vitest';
import {
  isEnabled,
  getFlags,
  setFlag,
  setUserOverride,
  removeUserOverride,
  resetFlags,
  DEFAULT_FLAGS,
} from '@/lib/feature-flags';

describe('Feature Flags', () => {
  beforeEach(() => {
    localStorage.clear();
    resetFlags();
  });

  // -----------------------------------------------------------------------
  // DEFAULT_FLAGS
  // -----------------------------------------------------------------------

  describe('DEFAULT_FLAGS', () => {
    it('contains a set of predefined flags', () => {
      expect(DEFAULT_FLAGS.length).toBeGreaterThan(0);
      DEFAULT_FLAGS.forEach((flag) => {
        expect(flag.id).toBeTruthy();
        expect(flag.name).toBeTruthy();
        expect(typeof flag.enabled).toBe('boolean');
      });
    });

    it('includes expected flag IDs', () => {
      const ids = DEFAULT_FLAGS.map((f) => f.id);
      expect(ids).toContain('dark_mode');
      expect(ids).toContain('ai_play_suggestions');
      expect(ids).toContain('export_pdf');
    });
  });

  // -----------------------------------------------------------------------
  // isEnabled
  // -----------------------------------------------------------------------

  describe('isEnabled', () => {
    it('returns true for globally enabled flags', () => {
      expect(isEnabled('dark_mode')).toBe(true);
      expect(isEnabled('export_pdf')).toBe(true);
    });

    it('returns false for globally disabled flags without rollout', () => {
      // video_integration is disabled and has no rollout
      expect(isEnabled('video_integration')).toBe(false);
    });

    it('returns false for unknown flag IDs', () => {
      expect(isEnabled('nonexistent_flag')).toBe(false);
    });

    it('respects per-user overrides over global state', () => {
      setUserOverride('dark_mode', 'user_1', false);
      expect(isEnabled('dark_mode', 'user_1')).toBe(false);
      // Another user still gets the global value
      expect(isEnabled('dark_mode', 'user_2')).toBe(true);
    });

    it('evaluates rollout percentage for disabled flags with userId', () => {
      // ai_play_suggestions has rolloutPercentage = 25, enabled = false
      // We test with multiple user IDs — some should be in, some out
      const results: boolean[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(isEnabled('ai_play_suggestions', `user_${i}`));
      }
      const enabledCount = results.filter(Boolean).length;
      // Should be approximately 25% but allow wide margin
      expect(enabledCount).toBeGreaterThan(0);
      expect(enabledCount).toBeLessThan(100);
    });
  });

  // -----------------------------------------------------------------------
  // getFlags
  // -----------------------------------------------------------------------

  describe('getFlags', () => {
    it('returns all flags', () => {
      const flags = getFlags();
      expect(flags.length).toBe(DEFAULT_FLAGS.length);
    });

    it('reflects changes made by setFlag', () => {
      setFlag('dark_mode', false);
      const flags = getFlags();
      const dm = flags.find((f) => f.id === 'dark_mode');
      expect(dm?.enabled).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // setFlag
  // -----------------------------------------------------------------------

  describe('setFlag', () => {
    it('toggles a flag on', () => {
      setFlag('video_integration', true);
      expect(isEnabled('video_integration')).toBe(true);
    });

    it('toggles a flag off', () => {
      setFlag('dark_mode', false);
      expect(isEnabled('dark_mode')).toBe(false);
    });

    it('throws for unknown flag', () => {
      expect(() => setFlag('bad_flag', true)).toThrow('Unknown feature flag');
    });

    it('persists to localStorage', () => {
      setFlag('dark_mode', false);
      // Read directly from localStorage
      const raw = localStorage.getItem('bbg_feature_flags');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.flags.dark_mode.enabled).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // setUserOverride / removeUserOverride
  // -----------------------------------------------------------------------

  describe('setUserOverride', () => {
    it('sets a per-user override', () => {
      setUserOverride('dark_mode', 'user_42', false);
      expect(isEnabled('dark_mode', 'user_42')).toBe(false);
    });

    it('does not affect other users', () => {
      setUserOverride('dark_mode', 'user_42', false);
      expect(isEnabled('dark_mode', 'user_99')).toBe(true);
    });

    it('throws for unknown flag', () => {
      expect(() => setUserOverride('bad', 'u', true)).toThrow();
    });
  });

  describe('removeUserOverride', () => {
    it('removes a per-user override, reverting to global state', () => {
      setUserOverride('dark_mode', 'user_42', false);
      expect(isEnabled('dark_mode', 'user_42')).toBe(false);

      removeUserOverride('dark_mode', 'user_42');
      expect(isEnabled('dark_mode', 'user_42')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // resetFlags
  // -----------------------------------------------------------------------

  describe('resetFlags', () => {
    it('reverts all flags to defaults', () => {
      setFlag('dark_mode', false);
      setFlag('export_pdf', false);

      resetFlags();

      expect(isEnabled('dark_mode')).toBe(true);
      expect(isEnabled('export_pdf')).toBe(true);
    });
  });
});
