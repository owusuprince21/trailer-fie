import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import { Toast } from '@/components/ui/toast';
import { Toaster } from 'react-hot-toast'
import { baseMetadata, getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  ...baseMetadata({
    title: `${SITE_NAME} - Movies, TV Shows, Trailers and Cast`,
    description: SITE_DESCRIPTION,
    path: '/',
    image: '/opengraph-image',
  }),
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_NAME,
  keywords: [
    'movie trailers',
    'movies',
    'TV shows',
    'entertainment',
    'cinema',
    'actors',
    'cast',
    'where to watch',
  ],
  creator: 'Trailer Fie',
  publisher: 'Trailer Fie',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-title" content="Trailer Fie" />
  </head>
      <body className={inter.className}>
<Toaster
          position="top-right"
          gutter={8}
          // place it below your fixed header, notch-safe
          containerStyle={{ top: 'calc(var(--nav-h, 64px) + env(safe-area-inset-top, 0px) + 12px)' }}
          toastOptions={{
            duration: 3000, // keep it on screen longer
            style: { zIndex: 99999 }, // stay above navbar
          }}
        />


        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
