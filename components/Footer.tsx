'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

/* Prefetch helper for internal routes */
function useSmartPrefetch() {
  const router = useRouter();
  const cacheRef = useRef<Set<string>>(new Set());
  return useCallback(
    (href: string) => {
      if (!href || cacheRef.current.has(href)) return;
      cacheRef.current.add(href);
      const idle = (window as any).requestIdleCallback as
        | ((cb: () => void) => void)
        | undefined;
      if (idle) idle(() => router.prefetch(href));
      else setTimeout(() => router.prefetch(href), 0);
    },
    [router]
  );
}

export default function Footer() {
  const prefetch = useSmartPrefetch();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link
              href="/"
              prefetch
              onMouseEnter={() => prefetch('/')}
              onFocus={() => prefetch('/')}
              className="inline-block"
              aria-label="Go to homepage"
            >
              <h3 className="text-2xl font-bold text-blue-400 mb-4">TRAILER FIE</h3>
            </Link>
            <p className="text-gray-400">
              Your ultimate destination for movie trailers and entertainment discovery.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link
                  href="/movies/popular"
                  prefetch
                  onMouseEnter={() => prefetch('/movies/popular')}
                  onFocus={() => prefetch('/movies/popular')}
                  className="hover:text-white transition-colors"
                >
                  Popular Movies
                </Link>
              </li>
              <li>
                <Link
                  href="/tv/popular"
                  prefetch
                  onMouseEnter={() => prefetch('/tv/popular')}
                  onFocus={() => prefetch('/tv/popular')}
                  className="hover:text-white transition-colors"
                >
                  Popular TV Shows
                </Link>
              </li>
              <li>
                <Link
                  href="/people"
                  prefetch
                  onMouseEnter={() => prefetch('/people')}
                  onFocus={() => prefetch('/people')}
                  className="hover:text-white transition-colors"
                >
                  People
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  prefetch
                  onMouseEnter={() => prefetch('/events')}
                  onFocus={() => prefetch('/events')}
                  className="hover:text-white transition-colors"
                >
                  Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link
                  href="/movies/now-playing"
                  prefetch
                  onMouseEnter={() => prefetch('/movies/now-playing')}
                  onFocus={() => prefetch('/movies/now-playing')}
                  className="hover:text-white transition-colors"
                >
                  Now Playing
                </Link>
              </li>
              <li>
                <Link
                  href="/movies/upcoming"
                  prefetch
                  onMouseEnter={() => prefetch('/movies/upcoming')}
                  onFocus={() => prefetch('/movies/upcoming')}
                  className="hover:text-white transition-colors"
                >
                  Upcoming
                </Link>
              </li>
              <li>
                <Link
                  href="/movies/top-rated"
                  prefetch
                  onMouseEnter={() => prefetch('/movies/top-rated')}
                  onFocus={() => prefetch('/movies/top-rated')}
                  className="hover:text-white transition-colors"
                >
                  Top Rated
                </Link>
              </li>
              <li>
                <Link
                  href="/tv/airing-today"
                  prefetch
                  onMouseEnter={() => prefetch('/tv/airing-today')}
                  onFocus={() => prefetch('/tv/airing-today')}
                  className="hover:text-white transition-colors"
                >
                  Airing Today
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="YouTube"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p className="text-center">
            &copy; {new Date().getFullYear()} TRAILER FIE. All rights reserved ||{' '}
            <span className="block sm:inline">
              Developed by{' '}
              <a
                href="https://owusu-portfolio-site.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className=" hover:text-white"
              >
                Prince Owusu 
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
