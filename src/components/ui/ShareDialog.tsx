'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import type { PlayId } from '@/types';
import type { ShareOptions } from '@/lib/sharing';
import {
  generateShareToken,
  getShareUrl,
  generateQRCodeSVG,
} from '@/lib/sharing';

// --- Types ---

export interface ShareDialogProps {
  playId: PlayId;
  playName: string;
  open: boolean;
  onClose: () => void;
}

type ExpirationOption = ShareOptions['expiresIn'];

// --- Component ---

export function ShareDialog({ playId, playName, open, onClose }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [expiresIn, setExpiresIn] = useState<ExpirationOption>('24h');
  const [allowDownload, setAllowDownload] = useState(true);
  const [requireAuth, setRequireAuth] = useState(false);

  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate a share link when dialog opens or options change
  const generateLink = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const token = await generateShareToken(playId, expiresIn, {
        allowDownload,
        requireAuth,
      });
      const url = getShareUrl(token);
      setShareUrl(url);
      setQrSvg(generateQRCodeSVG(url, 200));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  }, [playId, expiresIn, allowDownload, requireAuth]);

  // Generate on open
  useEffect(() => {
    if (open) {
      generateLink();
    } else {
      // Reset state when dialog closes
      setShareUrl(null);
      setQrSvg('');
      setCopied(false);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);

      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  // Email share
  const handleEmailShare = useCallback(() => {
    if (!shareUrl) return;
    const subject = encodeURIComponent(`Check out this play: ${playName}`);
    const body = encodeURIComponent(`I wanted to share this play with you:\n\n${playName}\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  }, [shareUrl, playName]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  return (
    <Modal open={open} onClose={onClose} size="md">
      <ModalHeader>Share &ldquo;{playName}&rdquo;</ModalHeader>

      <ModalBody>
        <div className="space-y-5">
          {/* Error */}
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm"
            >
              {error}
            </div>
          )}

          {/* Share URL + Copy */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl ?? 'Generating...'}
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 truncate"
                data-testid="share-url-input"
              />
              <button
                onClick={handleCopy}
                disabled={!shareUrl || loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                data-testid="copy-button"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* QR Code */}
          {qrSvg && (
            <div className="flex justify-center">
              <div
                className="p-4 bg-white rounded-lg border border-zinc-200 dark:border-zinc-700 inline-block"
                data-testid="qr-code"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Options</h3>

            {/* Expiration */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="share-expiration"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                Link expires in
              </label>
              <select
                id="share-expiration"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value as ExpirationOption)}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100"
                data-testid="expiration-select"
              >
                <option value="1h">1 hour</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
                <option value="never">Never</option>
              </select>
            </div>

            {/* Allow download */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="share-download"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                Allow download
              </label>
              <button
                id="share-download"
                role="switch"
                aria-checked={allowDownload}
                onClick={() => setAllowDownload(!allowDownload)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  allowDownload ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
                data-testid="download-toggle"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    allowDownload ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Require login */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="share-auth"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                Require login
              </label>
              <button
                id="share-auth"
                role="switch"
                aria-checked={requireAuth}
                onClick={() => setRequireAuth(!requireAuth)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  requireAuth ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
                data-testid="auth-toggle"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    requireAuth ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Social share buttons */}
          <div className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={handleCopy}
              disabled={!shareUrl}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              data-testid="share-copy-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
            <button
              onClick={handleEmailShare}
              disabled={!shareUrl}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              data-testid="share-email-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={generateLink}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          Regenerate Link
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Done
        </button>
      </ModalFooter>
    </Modal>
  );
}

export default ShareDialog;
