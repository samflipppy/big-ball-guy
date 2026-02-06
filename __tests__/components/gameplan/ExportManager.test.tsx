import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportManager } from '@/components/gameplan/ExportManager';
import type { ExportOptions, ExportContentType } from '@/components/gameplan/ExportManager';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onExport: vi.fn(),
};

function renderExportManager(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(<ExportManager {...props} />);
}

beforeEach(() => {
  vi.restoreAllMocks();
  defaultProps.onClose = vi.fn();
  defaultProps.onExport = vi.fn();
});

describe('ExportManager', () => {
  // --- Rendering ---

  it('renders the modal when open', () => {
    renderExportManager();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Export Playbook')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderExportManager({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders all default export types', () => {
    renderExportManager();
    expect(screen.getByTestId('export-type-single_play')).toHaveTextContent('Single Play');
    expect(screen.getByTestId('export-type-full_playbook')).toHaveTextContent('Full Playbook');
    expect(screen.getByTestId('export-type-game_plan')).toHaveTextContent('Game Plan');
    expect(screen.getByTestId('export-type-call_sheet')).toHaveTextContent('Call Sheet');
    expect(screen.getByTestId('export-type-wristband')).toHaveTextContent('Wristband');
    expect(screen.getByTestId('export-type-practice_script')).toHaveTextContent('Practice Script');
  });

  it('renders only the provided available types', () => {
    const availableTypes: ExportContentType[] = ['single_play', 'game_plan'];
    renderExportManager({ ...defaultProps, availableTypes } as never);
    expect(screen.getByTestId('export-type-single_play')).toBeInTheDocument();
    expect(screen.getByTestId('export-type-game_plan')).toBeInTheDocument();
    expect(screen.queryByTestId('export-type-full_playbook')).not.toBeInTheDocument();
    expect(screen.queryByTestId('export-type-call_sheet')).not.toBeInTheDocument();
  });

  it('renders format options', () => {
    renderExportManager();
    expect(screen.getByTestId('format-pdf')).toHaveTextContent('PDF');
    expect(screen.getByTestId('format-png')).toHaveTextContent('PNG');
    expect(screen.getByTestId('format-print')).toHaveTextContent('Print');
  });

  it('renders all include/exclude toggles', () => {
    renderExportManager();
    expect(screen.getByText('Play Names')).toBeInTheDocument();
    expect(screen.getByText('Formation Names')).toBeInTheDocument();
    expect(screen.getByText('Coaching Notes')).toBeInTheDocument();
    expect(screen.getByText('Defensive Overlay')).toBeInTheDocument();
    expect(screen.getByText('Player Labels')).toBeInTheDocument();
  });

  it('renders the preview area', () => {
    renderExportManager();
    expect(screen.getByTestId('export-preview')).toBeInTheDocument();
  });

  it('renders export and print buttons', () => {
    renderExportManager();
    expect(screen.getByTestId('export-button')).toHaveTextContent('Export');
    expect(screen.getByTestId('print-button')).toHaveTextContent('Print');
  });

  // --- Export type selection ---

  it('selects single_play by default', () => {
    renderExportManager();
    const btn = screen.getByTestId('export-type-single_play');
    expect(btn.className).toContain('bg-blue-600');
  });

  it('switches export type on click', async () => {
    const user = userEvent.setup();
    renderExportManager();

    const fullPlaybookBtn = screen.getByTestId('export-type-full_playbook');
    await user.click(fullPlaybookBtn);

    expect(fullPlaybookBtn.className).toContain('bg-blue-600');
    // previous selection is deselected
    const singlePlayBtn = screen.getByTestId('export-type-single_play');
    expect(singlePlayBtn.className).not.toContain('bg-blue-600');
  });

  it('shows layout options for full_playbook type', async () => {
    const user = userEvent.setup();
    renderExportManager();

    // Initially single_play: layout section should NOT be present
    expect(screen.queryByTestId('layout-section')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('export-type-full_playbook'));
    expect(screen.getByTestId('layout-section')).toBeInTheDocument();
  });

  it('shows layout options for game_plan type', async () => {
    const user = userEvent.setup();
    renderExportManager();

    await user.click(screen.getByTestId('export-type-game_plan'));
    expect(screen.getByTestId('layout-section')).toBeInTheDocument();
  });

  it('shows layout options for call_sheet type', async () => {
    const user = userEvent.setup();
    renderExportManager();

    await user.click(screen.getByTestId('export-type-call_sheet'));
    expect(screen.getByTestId('layout-section')).toBeInTheDocument();
  });

  it('shows layout options for practice_script type', async () => {
    const user = userEvent.setup();
    renderExportManager();

    await user.click(screen.getByTestId('export-type-practice_script'));
    expect(screen.getByTestId('layout-section')).toBeInTheDocument();
  });

  it('hides layout options for single_play type', () => {
    renderExportManager();
    expect(screen.queryByTestId('layout-section')).not.toBeInTheDocument();
  });

  it('hides layout options for wristband type', async () => {
    const user = userEvent.setup();
    renderExportManager();

    await user.click(screen.getByTestId('export-type-wristband'));
    expect(screen.queryByTestId('layout-section')).not.toBeInTheDocument();
  });

  // --- Format selection ---

  it('selects PDF format by default', () => {
    renderExportManager();
    expect(screen.getByTestId('format-pdf').className).toContain('bg-blue-600');
  });

  it('switches format on click', async () => {
    const user = userEvent.setup();
    renderExportManager();

    await user.click(screen.getByTestId('format-png'));
    expect(screen.getByTestId('format-png').className).toContain('bg-blue-600');
    expect(screen.getByTestId('format-pdf').className).not.toContain('bg-blue-600');
  });

  // --- Layout option switching ---

  it('selects 1-up layout by default', async () => {
    const user = userEvent.setup();
    renderExportManager();

    await user.click(screen.getByTestId('export-type-full_playbook'));
    expect(screen.getByTestId('layout-1-up').className).toContain('bg-blue-600');
  });

  it('switches layout to 2-up', async () => {
    const user = userEvent.setup();
    renderExportManager();

    await user.click(screen.getByTestId('export-type-full_playbook'));
    await user.click(screen.getByTestId('layout-2-up'));

    expect(screen.getByTestId('layout-2-up').className).toContain('bg-blue-600');
    expect(screen.getByTestId('layout-1-up').className).not.toContain('bg-blue-600');
  });

  it('switches layout to 4-up', async () => {
    const user = userEvent.setup();
    renderExportManager();

    await user.click(screen.getByTestId('export-type-full_playbook'));
    await user.click(screen.getByTestId('layout-4-up'));

    expect(screen.getByTestId('layout-4-up').className).toContain('bg-blue-600');
  });

  it('switches layout to 9-up and shows 9 preview cells', async () => {
    const user = userEvent.setup();
    renderExportManager();

    await user.click(screen.getByTestId('export-type-full_playbook'));
    await user.click(screen.getByTestId('layout-9-up'));

    expect(screen.getByTestId('layout-9-up').className).toContain('bg-blue-600');
    // 9-up should render 9 preview cells
    for (let i = 0; i < 9; i++) {
      expect(screen.getByTestId(`preview-cell-${i}`)).toBeInTheDocument();
    }
  });

  it('shows correct number of preview cells for 4-up layout', async () => {
    const user = userEvent.setup();
    renderExportManager();

    await user.click(screen.getByTestId('export-type-full_playbook'));
    await user.click(screen.getByTestId('layout-4-up'));

    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`preview-cell-${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('preview-cell-4')).not.toBeInTheDocument();
  });

  it('shows 1 preview cell for single_play type regardless of layout', () => {
    renderExportManager();
    expect(screen.getByTestId('preview-cell-0')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-cell-1')).not.toBeInTheDocument();
  });

  // --- Toggle include/exclude options ---

  it('toggles play names off and hides from preview', async () => {
    const user = userEvent.setup();
    renderExportManager();

    // Play names should be visible initially
    expect(screen.getByTestId('preview-play-name-0')).toBeInTheDocument();

    const toggle = screen.getByTestId('toggle-include-play-names');
    await user.click(toggle);

    expect(screen.queryByTestId('preview-play-name-0')).not.toBeInTheDocument();
  });

  it('toggles formation names off and hides from preview', async () => {
    const user = userEvent.setup();
    renderExportManager();

    expect(screen.getByTestId('preview-formation-name-0')).toBeInTheDocument();

    const toggle = screen.getByTestId('toggle-include-formation-names');
    await user.click(toggle);

    expect(screen.queryByTestId('preview-formation-name-0')).not.toBeInTheDocument();
  });

  it('toggles coaching notes off and hides from preview', async () => {
    const user = userEvent.setup();
    renderExportManager();

    expect(screen.getByTestId('preview-notes-0')).toBeInTheDocument();

    const toggle = screen.getByTestId('toggle-include-coaching-notes');
    await user.click(toggle);

    expect(screen.queryByTestId('preview-notes-0')).not.toBeInTheDocument();
  });

  it('toggles defensive overlay on (off by default)', async () => {
    const user = userEvent.setup();
    renderExportManager();

    const toggle = screen.getByTestId('toggle-include-defensive-overlay');
    // Defensive overlay is off by default
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    // After toggling on, the checkbox should be checked
    expect(toggle).toBeChecked();
  });

  it('toggles player labels off', async () => {
    const user = userEvent.setup();
    renderExportManager();

    const toggle = screen.getByTestId('toggle-include-player-labels');
    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  it('toggle states are independent', async () => {
    const user = userEvent.setup();
    renderExportManager();

    // Toggle off play names only
    await user.click(screen.getByTestId('toggle-include-play-names'));

    // Formation names and notes should still be visible
    expect(screen.queryByTestId('preview-play-name-0')).not.toBeInTheDocument();
    expect(screen.getByTestId('preview-formation-name-0')).toBeInTheDocument();
    expect(screen.getByTestId('preview-notes-0')).toBeInTheDocument();
  });

  // --- Export button triggers callback ---

  it('calls onExport with correct options when Export is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    renderExportManager({ onExport });

    await user.click(screen.getByTestId('export-button'));

    expect(onExport).toHaveBeenCalledTimes(1);
    const options: ExportOptions = onExport.mock.calls[0][0];
    expect(options.contentType).toBe('single_play');
    expect(options.format).toBe('pdf');
    expect(options.layout).toBe('1-up');
    expect(options.includePlayNames).toBe(true);
    expect(options.includeFormationNames).toBe(true);
    expect(options.includeCoachingNotes).toBe(true);
    expect(options.includeDefensiveOverlay).toBe(false);
    expect(options.includePlayerLabels).toBe(true);
  });

  it('passes updated options after changing settings', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    renderExportManager({ onExport });

    // Change to full playbook
    await user.click(screen.getByTestId('export-type-full_playbook'));
    // Change to PNG
    await user.click(screen.getByTestId('format-png'));
    // Change layout to 4-up
    await user.click(screen.getByTestId('layout-4-up'));
    // Toggle off play names
    await user.click(screen.getByTestId('toggle-include-play-names'));
    // Toggle on defensive overlay
    await user.click(screen.getByTestId('toggle-include-defensive-overlay'));

    await user.click(screen.getByTestId('export-button'));

    const options: ExportOptions = onExport.mock.calls[0][0];
    expect(options.contentType).toBe('full_playbook');
    expect(options.format).toBe('png');
    expect(options.layout).toBe('4-up');
    expect(options.includePlayNames).toBe(false);
    expect(options.includeDefensiveOverlay).toBe(true);
  });

  it('shows loading state during async export', async () => {
    const user = userEvent.setup();

    let resolveExport: () => void;
    const exportPromise = new Promise<void>((resolve) => {
      resolveExport = resolve;
    });
    const onExport = vi.fn().mockReturnValue(exportPromise);

    renderExportManager({ onExport });

    await user.click(screen.getByTestId('export-button'));

    // During export, button should show loading text
    expect(screen.getByTestId('export-button')).toHaveTextContent('Exporting...');

    // Resolve the export
    resolveExport!();
    await exportPromise;

    // After resolving we need to wait for state update
    await vi.waitFor(() => {
      expect(screen.getByTestId('export-button')).toHaveTextContent('Export');
    });
  });

  // --- Print button ---

  it('calls window.print when Print button is clicked', async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    renderExportManager();

    await user.click(screen.getByTestId('print-button'));

    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  // --- Cancel / Close ---

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderExportManager({ onClose });

    await user.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // --- Layout forces 1-up for single play types ---

  it('passes 1-up layout for single_play even if layout was changed before', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    renderExportManager({ onExport });

    // First switch to full_playbook and change layout
    await user.click(screen.getByTestId('export-type-full_playbook'));
    await user.click(screen.getByTestId('layout-9-up'));

    // Switch back to single_play
    await user.click(screen.getByTestId('export-type-single_play'));

    await user.click(screen.getByTestId('export-button'));

    const options: ExportOptions = onExport.mock.calls[0][0];
    expect(options.layout).toBe('1-up');
  });
});
