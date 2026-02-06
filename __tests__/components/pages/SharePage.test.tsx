import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// --- Mocks ---
const mockValidateShareToken = vi.fn();

vi.mock('@/lib/sharing', () => ({
  validateShareToken: (...args: unknown[]) => mockValidateShareToken(...args),
}));

const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ token: 'test-token-123' }),
}));

import SharePage from '@/app/share/[token]/page';

const mockPlay = {
  id: 'play-shared',
  name: 'HB Dive',
  formationId: 'form-1',
  assignments: [
    { playerId: 'qb', label: 'QB' },
    { playerId: 'rb', label: 'RB' },
  ],
  tags: ['run', 'base'],
  notes: 'Quick inside run',
  personnel: '11',
  teamId: 'team-1',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
};

const mockFormation = {
  id: 'form-1',
  name: 'Singleback',
  side: 'offense',
  players: [],
  personnel: '11',
  tags: [],
  isCustom: false,
  teamId: 'team-1',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
};

describe('SharePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockFrom chain defaults
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
  });

  it('shows loading state initially', () => {
    // Make validateShareToken never resolve to stay in loading
    mockValidateShareToken.mockReturnValue(new Promise(() => {}));
    render(<SharePage />);
    expect(screen.getByTestId('share-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading shared play...')).toBeInTheDocument();
  });

  it('shows expired message for invalid token', async () => {
    mockValidateShareToken.mockResolvedValue({ valid: false });
    render(<SharePage />);

    await waitFor(() => {
      expect(screen.getByTestId('share-expired')).toBeInTheDocument();
    });
    expect(screen.getByText('Link Expired')).toBeInTheDocument();
    expect(screen.getByText(/expired or is no longer valid/)).toBeInTheDocument();
  });

  it('shows expired message when playId is missing from validation', async () => {
    mockValidateShareToken.mockResolvedValue({ valid: true, playId: undefined });
    render(<SharePage />);

    await waitFor(() => {
      expect(screen.getByTestId('share-expired')).toBeInTheDocument();
    });
  });

  it('renders the shared play when token is valid', async () => {
    mockValidateShareToken.mockResolvedValue({
      valid: true,
      playId: 'play-shared',
      allowDownload: true,
    });

    // Play fetch
    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        // plays table
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPlay, error: null }),
            }),
          }),
        };
      }
      // formations table
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFormation, error: null }),
          }),
        }),
      };
    });

    render(<SharePage />);

    await waitFor(() => {
      expect(screen.getByTestId('share-page')).toBeInTheDocument();
    });
    // Play name appears in both the header and the renderer
    const playNameElements = screen.getAllByText('HB Dive');
    expect(playNameElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows download button when allowed', async () => {
    mockValidateShareToken.mockResolvedValue({
      valid: true,
      playId: 'play-shared',
      allowDownload: true,
    });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPlay, error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFormation, error: null }),
          }),
        }),
      };
    });

    render(<SharePage />);

    await waitFor(() => {
      expect(screen.getByTestId('download-button')).toBeInTheDocument();
    });
  });

  it('hides download button when not allowed', async () => {
    mockValidateShareToken.mockResolvedValue({
      valid: true,
      playId: 'play-shared',
      allowDownload: false,
    });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPlay, error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFormation, error: null }),
          }),
        }),
      };
    });

    render(<SharePage />);

    await waitFor(() => {
      expect(screen.getByTestId('share-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('download-button')).not.toBeInTheDocument();
  });

  it('shows CTA link to create own playbook', async () => {
    mockValidateShareToken.mockResolvedValue({ valid: false });
    render(<SharePage />);

    await waitFor(() => {
      expect(screen.getByTestId('share-expired')).toBeInTheDocument();
    });

    const ctaLink = screen.getByTestId('cta-link');
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveTextContent('Create your own playbook');
    expect(ctaLink).toHaveAttribute('href', '/');
  });

  it('shows error state when play fetch fails', async () => {
    mockValidateShareToken.mockResolvedValue({
      valid: true,
      playId: 'play-missing',
      allowDownload: true,
    });

    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }),
      }),
    }));

    render(<SharePage />);

    await waitFor(() => {
      expect(screen.getByTestId('share-error')).toBeInTheDocument();
    });
    expect(screen.getByText('Play not found')).toBeInTheDocument();
  });

  it('renders play renderer container', async () => {
    mockValidateShareToken.mockResolvedValue({
      valid: true,
      playId: 'play-shared',
      allowDownload: true,
    });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPlay, error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFormation, error: null }),
          }),
        }),
      };
    });

    render(<SharePage />);

    await waitFor(() => {
      expect(screen.getByTestId('play-renderer')).toBeInTheDocument();
    });
  });

  it('shows play notes when available', async () => {
    mockValidateShareToken.mockResolvedValue({
      valid: true,
      playId: 'play-shared',
      allowDownload: true,
    });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPlay, error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFormation, error: null }),
          }),
        }),
      };
    });

    render(<SharePage />);

    await waitFor(() => {
      expect(screen.getByText('Quick inside run')).toBeInTheDocument();
    });
  });
});
