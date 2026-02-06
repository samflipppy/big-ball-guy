import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from '@/components/ui/Toast';
import { DarkModeProvider } from '@/components/ui/DarkModeProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Playbook Pro',
  description: 'The playbook builder coaches actually want to use',
  keywords: ['football', 'playbook', 'coach', 'play design', 'game plan'],
  manifest: '/manifest.json',
  themeColor: '#18181b',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Playbook Pro',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#18181b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Playbook Pro" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}>
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
        <ToastContainer />
      </body>
    </html>
  );
}
