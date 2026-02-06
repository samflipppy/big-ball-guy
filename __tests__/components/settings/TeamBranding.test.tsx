import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamBranding } from '@/components/settings/TeamBranding';
import * as branding from '@/lib/branding';

describe('TeamBranding', () => {
  const defaultOnSave = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    defaultOnSave.mockClear();
    document.documentElement.style.cssText = '';
  });

  // -- Rendering --

  it('renders the form', () => {
    render(<TeamBranding onSave={defaultOnSave} />);
    expect(screen.getByTestId('team-branding')).toBeInTheDocument();
    expect(screen.getByTestId('team-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('level-select')).toBeInTheDocument();
    expect(screen.getByTestId('primary-color-input')).toBeInTheDocument();
    expect(screen.getByTestId('secondary-color-input')).toBeInTheDocument();
    expect(screen.getByTestId('logo-upload-zone')).toBeInTheDocument();
    expect(screen.getByTestId('color-preview')).toBeInTheDocument();
    expect(screen.getByTestId('save-branding-button')).toBeInTheDocument();
  });

  it('pre-fills team data', () => {
    render(
      <TeamBranding
        team={{
          name: 'Eagles',
          primaryColor: '#006633',
          secondaryColor: '#FFFFFF',
          level: 'college',
        }}
        onSave={defaultOnSave}
      />,
    );
    expect(screen.getByTestId('team-name-input')).toHaveValue('Eagles');
    expect(screen.getByTestId('level-select')).toHaveValue('college');
  });

  // -- Form inputs --

  it('allows typing a team name', async () => {
    const user = userEvent.setup();
    render(<TeamBranding onSave={defaultOnSave} />);
    const input = screen.getByTestId('team-name-input');
    await user.clear(input);
    await user.type(input, 'Hawks');
    expect(input).toHaveValue('Hawks');
  });

  it('allows changing the level', async () => {
    const user = userEvent.setup();
    render(<TeamBranding onSave={defaultOnSave} />);
    const select = screen.getByTestId('level-select');
    await user.selectOptions(select, 'pro');
    expect(select).toHaveValue('pro');
  });

  it('renders all four level options', () => {
    render(<TeamBranding onSave={defaultOnSave} />);
    const select = screen.getByTestId('level-select');
    const options = within(select).getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options.map((o) => o.textContent)).toEqual(['Youth', 'High School', 'College', 'Pro']);
  });

  // -- Color presets --

  it('renders color preset swatches', () => {
    render(<TeamBranding onSave={defaultOnSave} />);
    const presets = screen.getByTestId('color-presets');
    const buttons = within(presets).getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(20);
  });

  it('clicking a preset updates the colors', async () => {
    const user = userEvent.setup();
    render(<TeamBranding onSave={defaultOnSave} />);
    // Click the first preset
    const firstPreset = branding.SCHOOL_COLOR_PRESETS[0];
    const presetButton = screen.getByTitle(firstPreset.name);
    await user.click(presetButton);

    // The color inputs should have the preset values
    expect(screen.getByTestId('primary-color-input')).toHaveValue(firstPreset.primary.toLowerCase());
    expect(screen.getByTestId('secondary-color-input')).toHaveValue(firstPreset.secondary.toLowerCase());
  });

  // -- Preview --

  it('shows color preview with player circles', () => {
    render(
      <TeamBranding
        team={{ primaryColor: '#CC0000', secondaryColor: '#000000' }}
        onSave={defaultOnSave}
      />,
    );
    const primary = screen.getByTestId('preview-player-primary');
    expect(primary).toHaveStyle({ backgroundColor: '#CC0000' });

    const secondary = screen.getByTestId('preview-player-secondary');
    expect(secondary).toHaveStyle({ backgroundColor: '#000000' });
  });

  // -- Logo upload --

  it('shows drag-and-drop zone text when no logo', () => {
    render(<TeamBranding onSave={defaultOnSave} />);
    expect(screen.getByText('Drag and drop or click to upload')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG, SVG')).toBeInTheDocument();
  });

  it('shows logo preview when team has a logo', () => {
    render(
      <TeamBranding
        team={{ logo: 'data:image/png;base64,iVBORw0KGgo=' }}
        onSave={defaultOnSave}
      />,
    );
    expect(screen.getByTestId('logo-preview')).toBeInTheDocument();
    expect(screen.getByTestId('remove-logo-button')).toBeInTheDocument();
  });

  it('removes logo when Remove logo is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TeamBranding
        team={{ logo: 'data:image/png;base64,iVBORw0KGgo=' }}
        onSave={defaultOnSave}
      />,
    );
    await user.click(screen.getByTestId('remove-logo-button'));
    expect(screen.queryByTestId('logo-preview')).not.toBeInTheDocument();
    expect(screen.getByText('Drag and drop or click to upload')).toBeInTheDocument();
  });

  // -- Save --

  it('calls onSave with form data when Save is clicked', async () => {
    const user = userEvent.setup();
    const applySpy = vi.spyOn(branding, 'applyTeamColors');
    render(
      <TeamBranding
        team={{
          name: 'Tigers',
          primaryColor: '#FF8200',
          secondaryColor: '#FFFFFF',
          level: 'college',
        }}
        onSave={defaultOnSave}
      />,
    );

    await user.click(screen.getByTestId('save-branding-button'));

    // Wait for the async save to complete
    await vi.waitFor(() => {
      expect(defaultOnSave).toHaveBeenCalledTimes(1);
    });

    expect(defaultOnSave).toHaveBeenCalledWith({
      name: 'Tigers',
      primaryColor: '#FF8200',
      secondaryColor: '#FFFFFF',
      level: 'college',
      logo: null,
    });

    expect(applySpy).toHaveBeenCalledWith('#FF8200', '#FFFFFF');
  });

  it('shows loading state on the save button', async () => {
    const user = userEvent.setup();
    render(<TeamBranding team={{ name: 'Test' }} onSave={defaultOnSave} />);
    const btn = screen.getByTestId('save-branding-button');
    await user.click(btn);
    // The button should be disabled while saving
    expect(btn).toBeDisabled();
  });

  // -- className --

  it('applies custom className', () => {
    render(<TeamBranding onSave={defaultOnSave} className="custom-cls" />);
    expect(screen.getByTestId('team-branding')).toHaveClass('custom-cls');
  });
});
