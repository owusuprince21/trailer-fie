import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import { Toast } from '@/components/ui/toast';
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TRAILER FIE - Watch Movie Trailers & Discuss',
  description: 'Discover and watch millions of movie trailers. Find your favorite movie stars and join discussions.',
  keywords: 'movie trailers, movies, TV shows, entertainment, cinema, actors, reviews',
  openGraph: {
    title: 'TRAILER FIE - Watch Movie Trailers & Discuss',
    description: 'Discover and watch millions of movie trailers. Find your favorite movie stars and join discussions.',
    type: 'website',
    locale: 'en_US',
  },
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
