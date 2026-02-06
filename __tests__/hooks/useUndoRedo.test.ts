import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useHistoryStore } from '@/stores/playStore';

describe('useUndoRedo', () => {
  const mockOnUndo = vi.fn();
  const mockOnRedo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useHistoryStore.setState({ past: [], future: [] });
  });

  it('starts with canUndo and canRedo both false', () => {
    const { result } = renderHook(() =>
      useUndoRedo(mockOnUndo, mockOnRedo),
    );

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('canUndo becomes true after pushing history', () => {
    const { result } = renderHook(() =>
      useUndoRedo(mockOnUndo, mockOnRedo),
    );

    act(() => {
      result.current.pushHistory({
        action: 'test',
        before: 'old',
        after: 'new',
      });
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo calls onUndo with the before value', () => {
    const { result } = renderHook(() =>
      useUndoRedo(mockOnUndo, mockOnRedo),
    );

    act(() => {
      result.current.pushHistory({
        action: 'move',
        before: { x: 0, y: 0 },
        after: { x: 10, y: 10 },
      });
    });

    act(() => {
      result.current.undo();
    });

    expect(mockOnUndo).toHaveBeenCalledWith({ x: 0, y: 0 });
  });

  it('redo calls onRedo with the after value', () => {
    const { result } = renderHook(() =>
      useUndoRedo(mockOnUndo, mockOnRedo),
    );

    act(() => {
      result.current.pushHistory({
        action: 'move',
        before: { x: 0, y: 0 },
        after: { x: 10, y: 10 },
      });
    });

    act(() => {
      result.current.undo();
    });

    act(() => {
      result.current.redo();
    });

    expect(mockOnRedo).toHaveBeenCalledWith({ x: 10, y: 10 });
  });

  it('canRedo becomes true after undo', () => {
    const { result } = renderHook(() =>
      useUndoRedo(mockOnUndo, mockOnRedo),
    );

    act(() => {
      result.current.pushHistory({
        action: 'test',
        before: 'a',
        after: 'b',
      });
    });

    act(() => {
      result.current.undo();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('undo does nothing when there is no history', () => {
    const { result } = renderHook(() =>
      useUndoRedo(mockOnUndo, mockOnRedo),
    );

    act(() => {
      result.current.undo();
    });

    expect(mockOnUndo).not.toHaveBeenCalled();
  });

  it('redo does nothing when there is no future', () => {
    const { result } = renderHook(() =>
      useUndoRedo(mockOnUndo, mockOnRedo),
    );

    act(() => {
      result.current.redo();
    });

    expect(mockOnRedo).not.toHaveBeenCalled();
  });

  describe('keyboard shortcuts', () => {
    it('Ctrl+Z triggers undo', () => {
      const { result } = renderHook(() =>
        useUndoRedo(mockOnUndo, mockOnRedo),
      );

      act(() => {
        result.current.pushHistory({
          action: 'test',
          before: 'before',
          after: 'after',
        });
      });

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'z',
            ctrlKey: true,
          }),
        );
      });

      expect(mockOnUndo).toHaveBeenCalledWith('before');
    });

    it('Ctrl+Shift+Z triggers redo', () => {
      const { result } = renderHook(() =>
        useUndoRedo(mockOnUndo, mockOnRedo),
      );

      act(() => {
        result.current.pushHistory({
          action: 'test',
          before: 'before',
          after: 'after',
        });
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'z',
            ctrlKey: true,
            shiftKey: true,
          }),
        );
      });

      expect(mockOnRedo).toHaveBeenCalledWith('after');
    });

    it('Ctrl+Y triggers redo', () => {
      const { result } = renderHook(() =>
        useUndoRedo(mockOnUndo, mockOnRedo),
      );

      act(() => {
        result.current.pushHistory({
          action: 'test',
          before: 'before',
          after: 'after',
        });
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'y',
            ctrlKey: true,
          }),
        );
      });

      expect(mockOnRedo).toHaveBeenCalledWith('after');
    });

    it('Meta+Z triggers undo (Mac)', () => {
      const { result } = renderHook(() =>
        useUndoRedo(mockOnUndo, mockOnRedo),
      );

      act(() => {
        result.current.pushHistory({
          action: 'test',
          before: 'mac-before',
          after: 'mac-after',
        });
      });

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'z',
            metaKey: true,
          }),
        );
      });

      expect(mockOnUndo).toHaveBeenCalledWith('mac-before');
    });

    it('regular Z key does not trigger undo', () => {
      const { result } = renderHook(() =>
        useUndoRedo(mockOnUndo, mockOnRedo),
      );

      act(() => {
        result.current.pushHistory({
          action: 'test',
          before: 'before',
          after: 'after',
        });
      });

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'z',
          }),
        );
      });

      expect(mockOnUndo).not.toHaveBeenCalled();
    });

    it('cleans up keyboard event listener on unmount', () => {
      const spy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() =>
        useUndoRedo(mockOnUndo, mockOnRedo),
      );

      unmount();

      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
      spy.mockRestore();
    });
  });
});
