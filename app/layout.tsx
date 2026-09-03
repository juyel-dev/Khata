import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/shared/ClientProviders';

export const metadata: Metadata = {
  title: 'Khata — Simple Money Notebook',
  description:
    'A dead-simple, offline-first digital ledger for shopkeepers and individuals to track cash transactions, balances, and who owes what.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Khata',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Khata — Simple Money Notebook',
    description:
      'A dead-simple, offline-first digital ledger for shopkeepers and individuals to track cash transactions, balances, and who owes what.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Khata — Simple Money Notebook',
    description:
      'A dead-simple, offline-first digital ledger for shopkeepers and individuals to track cash transactions, balances, and who owes what.',
  },
};

export const viewport: Viewport = {
  themeColor: '#2F6B4F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased selection:bg-[#E4EFE7] selection:text-[#2F6B4F]">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

