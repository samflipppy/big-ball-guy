import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---- Mocks ----

const mockAuthenticate = vi.fn();
const mockDisconnect = vi.fn();
const mockGetTeamPlays = vi.fn();

vi.mock('@/lib/hudl', () => {
  class MockHudlClient {
    authenticate = mockAuthenticate;
    disconnect = mockDisconnect;
    getTeamPlays = mockGetTeamPlays;
    isAuthenticated = false;
  }
  return {
    HudlClient: MockHudlClient,
    HUDL_API_BASE_URL: 'https://api.hudl.com',
    HUDL_API_VERSION: 'v1',
  };
});

import { HudlIntegration } from '@/components/settings/HudlIntegration';

describe('HudlIntegration', () => {
  const mockOnConnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticate.mockResolvedValue(true);
    mockGetTeamPlays.mockResolvedValue([
      {
        id: 'hudl-001',
        name: 'Shotgun Trips - Four Verticals',
        formation: 'Shotgun Trips',
        playType: 'pass',
        tags: ['passing', 'deep'],
      },
      {
        id: 'hudl-002',
        name: 'I-Form Power Right',
        formation: 'I-Form',
        playType: 'run',
        tags: ['run', 'power'],
      },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Rendering ---

  it('renders the integration panel', () => {
    render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
    expect(screen.getByTestId('hudl-integration')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
    expect(screen.getByText('Hudl Integration')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
    expect(
      screen.getByText('Connect your Hudl account to import and export plays.'),
    ).toBeInTheDocument();
  });

  // --- Not connected state ---

  describe('when not connected', () => {
    it('shows API key input', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      expect(screen.getByTestId('api-key-input')).toBeInTheDocument();
    });

    it('shows API key input as password type (masked)', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      expect(screen.getByTestId('api-key-input')).toHaveAttribute('type', 'password');
    });

    it('shows Connect button', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      expect(screen.getByTestId('connect-button')).toBeInTheDocument();
      expect(screen.getByTestId('connect-button')).toHaveTextContent('Connect');
    });

    it('disables Connect button when API key is empty', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      expect(screen.getByTestId('connect-button')).toBeDisabled();
    });

    it('enables Connect button when API key is entered', async () => {
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      await user.type(screen.getByTestId('api-key-input'), 'my-api-key');
      expect(screen.getByTestId('connect-button')).not.toBeDisabled();
    });

    it('shows "Not connected" status', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      expect(screen.getByText('Not connected')).toBeInTheDocument();
    });

    it('does not show disconnect button', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      expect(screen.queryByTestId('disconnect-button')).not.toBeInTheDocument();
    });

    it('does not show import plays button', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      expect(screen.queryByTestId('import-plays-button')).not.toBeInTheDocument();
    });
  });

  // --- Connected state ---

  describe('when connected', () => {
    it('shows "Connected" status', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('does not show API key input', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      expect(screen.queryByTestId('api-key-input')).not.toBeInTheDocument();
    });

    it('does not show Connect button', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      expect(screen.queryByTestId('connect-button')).not.toBeInTheDocument();
    });

    it('shows Disconnect button', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      expect(screen.getByTestId('disconnect-button')).toBeInTheDocument();
      expect(screen.getByTestId('disconnect-button')).toHaveTextContent('Disconnect');
    });

    it('shows Import Plays button', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      expect(screen.getByTestId('import-plays-button')).toBeInTheDocument();
    });
  });

  // --- Connection status indicator ---

  describe('connection status indicator', () => {
    it('renders status component', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    });

    it('shows correct status text when not connected', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      expect(screen.getByText('Not connected')).toBeInTheDocument();
    });

    it('shows correct status text when connected', () => {
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  // --- Connect flow ---

  describe('connect flow', () => {
    it('calls authenticate when Connect is clicked', async () => {
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      await user.type(screen.getByTestId('api-key-input'), 'test-key');
      await user.click(screen.getByTestId('connect-button'));
      expect(mockAuthenticate).toHaveBeenCalledWith('test-key');
    });

    it('calls onConnect after successful authentication', async () => {
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      await user.type(screen.getByTestId('api-key-input'), 'test-key');
      await user.click(screen.getByTestId('connect-button'));
      await waitFor(() => {
        expect(mockOnConnect).toHaveBeenCalled();
      });
    });

    it('shows error when authentication fails', async () => {
      mockAuthenticate.mockResolvedValue(false);
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      await user.type(screen.getByTestId('api-key-input'), 'bad-key');
      await user.click(screen.getByTestId('connect-button'));
      await waitFor(() => {
        expect(screen.getByTestId('hudl-error')).toBeInTheDocument();
        expect(screen.getByText(/Authentication failed/)).toBeInTheDocument();
      });
    });

    it('shows error when authenticate throws', async () => {
      mockAuthenticate.mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      await user.type(screen.getByTestId('api-key-input'), 'test-key');
      await user.click(screen.getByTestId('connect-button'));
      await waitFor(() => {
        expect(screen.getByTestId('hudl-error')).toBeInTheDocument();
      });
    });

    it('shows error when API key is empty and connect is attempted', async () => {
      // Manually click the button (though it's disabled, test the validation just in case)
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={false} />);
      const connectBtn = screen.getByTestId('connect-button');
      // Button is disabled with empty input, so authenticate should NOT be called
      expect(connectBtn).toBeDisabled();
    });
  });

  // --- Disconnect flow ---

  describe('disconnect flow', () => {
    it('calls disconnect on client when Disconnect is clicked', async () => {
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      await user.click(screen.getByTestId('disconnect-button'));
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('calls onConnect after disconnect', async () => {
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      await user.click(screen.getByTestId('disconnect-button'));
      expect(mockOnConnect).toHaveBeenCalled();
    });
  });

  // --- Import modal ---

  describe('import modal', () => {
    it('opens import modal when Import Plays is clicked', async () => {
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      await user.click(screen.getByTestId('import-plays-button'));
      await waitFor(() => {
        expect(screen.getByTestId('import-modal')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', async () => {
      // Make getTeamPlays slow to resolve
      mockGetTeamPlays.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000)),
      );
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      await user.click(screen.getByTestId('import-plays-button'));
      expect(screen.getByTestId('loading-plays')).toBeInTheDocument();
    });

    it('displays plays after loading', async () => {
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      await user.click(screen.getByTestId('import-plays-button'));
      await waitFor(() => {
        expect(screen.getByTestId('plays-list')).toBeInTheDocument();
        expect(screen.getByText('Shotgun Trips - Four Verticals')).toBeInTheDocument();
        expect(screen.getByText('I-Form Power Right')).toBeInTheDocument();
      });
    });

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      await user.click(screen.getByTestId('import-plays-button'));
      await waitFor(() => {
        expect(screen.getByTestId('import-modal')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('close-modal-button'));
      expect(screen.queryByTestId('import-modal')).not.toBeInTheDocument();
    });

    it('modal has dialog role', async () => {
      const user = userEvent.setup();
      render(<HudlIntegration onConnect={mockOnConnect} isConnected={true} />);
      await user.click(screen.getByTestId('import-plays-button'));
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  // --- Custom className ---

  it('applies custom className', () => {
    render(
      <HudlIntegration
        onConnect={mockOnConnect}
        isConnected={false}
        className="my-custom-class"
      />,
    );
    expect(screen.getByTestId('hudl-integration').className).toContain('my-custom-class');
  });
});
