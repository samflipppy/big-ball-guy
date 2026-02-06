'use client';

import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { getShortcutsByCategory } from '@/lib/shortcuts';

interface ShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Format a shortcut key string for display.
 * e.g. 'Cmd+Shift+Z' -> display with nice symbols on Mac.
 */
function formatKeys(keys: string): string {
  return keys
    .replace(/Cmd/g, '\u2318')
    .replace(/Shift/g, '\u21E7')
    .replace(/Alt/g, '\u2325')
    .replace(/Ctrl/g, 'Ctrl');
}

const CATEGORY_ORDER = ['General', 'Playbook', 'Canvas Tools', 'Navigation'];

export default function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  const grouped = getShortcutsByCategory();

  return (
    <Modal open={open} onClose={onClose} size="md">
      <ModalHeader>Keyboard Shortcuts</ModalHeader>
      <ModalBody className="max-h-[60vh] overflow-y-auto">
        <div className="space-y-6" data-testid="shortcuts-help">
          {CATEGORY_ORDER.map((category) => {
            const shortcuts = grouped[category];
            if (!shortcuts || shortcuts.length === 0) return null;

            return (
              <div key={category}>
                <h3
                  className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"
                  data-testid={`shortcuts-category-${category}`}
                >
                  {category}
                </h3>
                <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.action}
                      className="flex items-center justify-between px-3 py-2"
                      data-testid={`shortcut-${shortcut.action}`}
                    >
                      <span className="text-sm text-zinc-700">
                        {shortcut.description}
                      </span>
                      <kbd className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono font-medium text-zinc-600 border border-zinc-200">
                        {formatKeys(shortcut.keys)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ModalBody>
    </Modal>
  );
}
