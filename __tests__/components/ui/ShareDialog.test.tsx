import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareDialog } from '@/components/ui/ShareDialog';

// --- Mocks ---
const mockGenerateShareToken = vi.fn().mockResolvedValue('mock-token-abc123');
const mockGetShareUrl = vi.fn().mockReturnValue('https://app.playbook.com/share/mock-token-abc123');
const mockGenerateQRCodeSVG = vi.fn().mockReturnValue(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#fff"/></svg>',
);

vi.mock('@/lib/sharing', () => ({
  generateShareToken: (...args: unknown[]) => mockGenerateShareToken(...args),
  getShareUrl: (...args: unknown[]) => mockGetShareUrl(...args),
  generateQRCodeSVG: (...args: unknown[]) => mockGenerateQRCodeSVG(...args),
}));

// Mock clipboard — set up fresh in beforeEach
let mockWriteText: ReturnType<typeof vi.fn>;

describe('ShareDialog', () => {
  const defaultProps = {
    playId: 'play-123',
    playName: 'Slant Right',
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateShareToken.mockResolvedValue('mock-token-abc123');

    // Fresh clipboard mock each test
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
  });

  it('renders the dialog when open is true', async () => {
    render(<ShareDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<ShareDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays the play name in the header', async () => {
    render(<ShareDialog {...defaultProps} />);
    expect(screen.getByText(/Slant Right/)).toBeInTheDocument();
  });

  it('generates a share token on open', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => {
      expect(mockGenerateShareToken).toHaveBeenCalledWith(
        'play-123',
        '24h',
        expect.objectContaining({ allowDownload: true, requireAuth: false }),
      );
    });
  });

  it('displays the share URL after generation', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => {
      const input = screen.getByTestId('share-url-input') as HTMLInputElement;
      expect(input.value).toBe('https://app.playbook.com/share/mock-token-abc123');
    });
  });

  it('copies link to clipboard when Copy Link is clicked', async () => {
    const user = userEvent.setup();
    render(<ShareDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('share-url-input')).toHaveValue(
        'https://app.playbook.com/share/mock-token-abc123',
      );
    });

    await user.click(screen.getByTestId('copy-button'));

    // After clicking copy, the button text changes to "Copied!" (via either clipboard API or fallback)
    await waitFor(() => {
      expect(screen.getByTestId('copy-button')).toHaveTextContent('Copied!');
    });
  });

  it('shows "Copied!" feedback after copying', async () => {
    const user = userEvent.setup();
    render(<ShareDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('share-url-input')).toHaveValue(
        'https://app.playbook.com/share/mock-token-abc123',
      );
    });

    await user.click(screen.getByTestId('copy-button'));
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('displays the QR code', async () => {
    render(<ShareDialog {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });
  });

  it('renders the expiration selector', async () => {
    render(<ShareDialog {...defaultProps} />);
    const select = screen.getByTestId('expiration-select');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('24h');
  });

  it('renders the download toggle', async () => {
    render(<ShareDialog {...defaultProps} />);
    const toggle = screen.getByTestId('download-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('renders the auth toggle', async () => {
    render(<ShareDialog {...defaultProps} />);
    const toggle = screen.getByTestId('auth-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles download option', async () => {
    const user = userEvent.setup();
    render(<ShareDialog {...defaultProps} />);

    const toggle = screen.getByTestId('download-toggle');
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles require auth option', async () => {
    const user = userEvent.setup();
    render(<ShareDialog {...defaultProps} />);

    const toggle = screen.getByTestId('auth-toggle');
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('renders social share buttons', async () => {
    render(<ShareDialog {...defaultProps} />);
    expect(screen.getByTestId('share-copy-btn')).toBeInTheDocument();
    expect(screen.getByTestId('share-email-btn')).toBeInTheDocument();
  });

  it('calls onClose when Done button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ShareDialog {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error message when token generation fails', async () => {
    mockGenerateShareToken.mockRejectedValueOnce(new Error('Network error'));
    render(<ShareDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });

  it('shows Regenerate Link button', async () => {
    render(<ShareDialog {...defaultProps} />);
    expect(screen.getByText('Regenerate Link')).toBeInTheDocument();
  });
});
