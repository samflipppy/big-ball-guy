import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * Next.js route handler that generates the apple-touch-icon (180x180).
 * Renders a football-themed icon with the app's brand colors.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          borderRadius: '40px',
        }}
      >
        {/* Football shape */}
        <div
          style={{
            width: '100px',
            height: '64px',
            background: '#92400e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-30deg)',
            border: '3px solid #fbbf24',
          }}
        >
          {/* Laces */}
          <div
            style={{
              width: '40px',
              height: '2px',
              background: 'white',
              position: 'absolute',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
