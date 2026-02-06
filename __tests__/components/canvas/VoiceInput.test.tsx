import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';

// ---- Mocks ----

const mockStartListening = vi.fn();
const mockStopListening = vi.fn();
const mockParsePlayDescription = vi.fn();
const mockIsSpeechRecognitionAvailable = vi.fn();

vi.mock('@/lib/voice-recognition', () => ({
  startListening: (...args: unknown[]) => mockStartListening(...args),
  stopListening: (...args: unknown[]) => mockStopListening(...args),
  parsePlayDescription: (...args: unknown[]) => mockParsePlayDescription(...args),
  isSpeechRecognitionAvailable: () => mockIsSpeechRecognitionAvailable(),
}));

import { VoiceInput } from '@/components/canvas/VoiceInput';

describe('VoiceInput', () => {
  const mockOnPlayParsed = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: speech recognition IS available
    mockIsSpeechRecognitionAvailable.mockReturnValue(true);
    mockStartListening.mockReturnValue(true);
    mockParsePlayDescription.mockReturnValue({
      formationName: 'Shotgun',
      conceptName: 'Four Verticals',
      routes: [],
      confidence: 0.9,
      notes: 'shotgun four verticals',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders voice input container', () => {
    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    expect(screen.getByTestId('voice-input')).toBeInTheDocument();
  });

  it('renders mic button', () => {
    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    expect(screen.getByTestId('mic-button')).toBeInTheDocument();
  });

  it('shows "Start listening" label when not active', () => {
    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    const micBtn = screen.getByTestId('mic-button');
    expect(micBtn).toHaveAttribute('aria-label', 'Start listening');
  });

  it('shows unsupported message when speech recognition is unavailable', () => {
    mockIsSpeechRecognitionAvailable.mockReturnValue(false);
    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    expect(screen.getByText('Voice input is not supported in this browser')).toBeInTheDocument();
  });

  it('does not show mic button when speech recognition is unavailable', () => {
    mockIsSpeechRecognitionAvailable.mockReturnValue(false);
    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    expect(screen.queryByTestId('mic-button')).not.toBeInTheDocument();
  });

  it('starts listening when mic button is clicked', () => {
    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));
    expect(mockStartListening).toHaveBeenCalledTimes(1);
  });

  it('shows "Stop listening" label after clicking mic', () => {
    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));
    const micBtn = screen.getByTestId('mic-button');
    expect(micBtn).toHaveAttribute('aria-label', 'Stop listening');
  });

  it('shows listening indicator when active', () => {
    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));
    expect(screen.getByTestId('listening-indicator')).toBeInTheDocument();
    expect(screen.getByText('Listening...')).toBeInTheDocument();
  });

  it('shows waveform animation when listening', () => {
    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));
    expect(screen.getByTestId('waveform')).toBeInTheDocument();
  });

  it('stops listening on second mic click', () => {
    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    // Start
    fireEvent.click(screen.getByTestId('mic-button'));
    // Stop
    fireEvent.click(screen.getByTestId('mic-button'));
    expect(mockStopListening).toHaveBeenCalled();
  });

  it('shows transcript when speech is recognized', () => {
    mockStartListening.mockImplementation((callbacks: any) => {
      // Simulate receiving a final transcript
      setTimeout(() => {
        callbacks.onTranscript('shotgun four verticals', true);
      }, 0);
      return true;
    });

    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));

    return waitFor(() => {
      expect(screen.getByTestId('transcript')).toBeInTheDocument();
      expect(screen.getByText(/shotgun four verticals/i)).toBeInTheDocument();
    });
  });

  it('shows parsed result after recognition', () => {
    mockStartListening.mockImplementation((callbacks: any) => {
      setTimeout(() => {
        callbacks.onTranscript('shotgun four verticals', true);
      }, 0);
      return true;
    });

    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));

    return waitFor(() => {
      expect(screen.getByTestId('parsed-result')).toBeInTheDocument();
      expect(screen.getByText(/I heard:/)).toBeInTheDocument();
    });
  });

  it('shows apply button when parsed result is available and not listening', () => {
    mockStartListening.mockImplementation((callbacks: any) => {
      setTimeout(() => {
        callbacks.onTranscript('shotgun four verticals', true);
        callbacks.onEnd();
      }, 0);
      return true;
    });

    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));

    return waitFor(() => {
      expect(screen.getByTestId('apply-button')).toBeInTheDocument();
    });
  });

  it('calls onPlayParsed when apply button is clicked', () => {
    mockStartListening.mockImplementation((callbacks: any) => {
      setTimeout(() => {
        callbacks.onTranscript('shotgun four verticals', true);
        callbacks.onEnd();
      }, 0);
      return true;
    });

    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));

    return waitFor(() => {
      fireEvent.click(screen.getByTestId('apply-button'));
      expect(mockOnPlayParsed).toHaveBeenCalledWith(
        expect.objectContaining({
          formationName: 'Shotgun',
          conceptName: 'Four Verticals',
        }),
      );
    });
  });

  it('clears state after apply', () => {
    mockStartListening.mockImplementation((callbacks: any) => {
      setTimeout(() => {
        callbacks.onTranscript('shotgun four verticals', true);
        callbacks.onEnd();
      }, 0);
      return true;
    });

    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));

    return waitFor(() => {
      fireEvent.click(screen.getByTestId('apply-button'));
      expect(screen.queryByTestId('parsed-result')).not.toBeInTheDocument();
      expect(screen.queryByTestId('transcript')).not.toBeInTheDocument();
    });
  });

  it('shows clear button alongside apply', () => {
    mockStartListening.mockImplementation((callbacks: any) => {
      setTimeout(() => {
        callbacks.onTranscript('shotgun four verticals', true);
        callbacks.onEnd();
      }, 0);
      return true;
    });

    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));

    return waitFor(() => {
      expect(screen.getByTestId('clear-button')).toBeInTheDocument();
    });
  });

  it('clears state when clear button is clicked', () => {
    mockStartListening.mockImplementation((callbacks: any) => {
      setTimeout(() => {
        callbacks.onTranscript('shotgun four verticals', true);
        callbacks.onEnd();
      }, 0);
      return true;
    });

    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));

    return waitFor(() => {
      fireEvent.click(screen.getByTestId('clear-button'));
      expect(screen.queryByTestId('parsed-result')).not.toBeInTheDocument();
      expect(screen.queryByTestId('transcript')).not.toBeInTheDocument();
    });
  });

  it('shows error state when recognition fails', () => {
    mockStartListening.mockImplementation((callbacks: any) => {
      setTimeout(() => {
        callbacks.onError('no-speech');
      }, 0);
      return true;
    });

    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));

    return waitFor(() => {
      expect(screen.getByTestId('voice-error')).toBeInTheDocument();
      expect(screen.getByText('no-speech')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<VoiceInput onPlayParsed={mockOnPlayParsed} className="my-custom-class" />);
    expect(screen.getByTestId('voice-input').className).toContain('my-custom-class');
  });

  it('stops listening on unmount', () => {
    const { unmount } = render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    unmount();
    expect(mockStopListening).toHaveBeenCalled();
  });

  it('shows interim transcript while speaking', () => {
    mockStartListening.mockImplementation((callbacks: any) => {
      setTimeout(() => {
        callbacks.onTranscript('shotgun four', false);
      }, 0);
      return true;
    });

    render(<VoiceInput onPlayParsed={mockOnPlayParsed} />);
    fireEvent.click(screen.getByTestId('mic-button'));

    return waitFor(() => {
      expect(screen.getByTestId('transcript')).toBeInTheDocument();
      expect(screen.getByText(/shotgun four/)).toBeInTheDocument();
    });
  });
});
