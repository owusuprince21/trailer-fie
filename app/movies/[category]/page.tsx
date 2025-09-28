'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MovieCard from '@/components/MovieCard';
import {
  usePopular,
  useTopRated,
  useNowPlaying, // used for "Airing Today" (movies analogue)
  useUpcoming,   // used for "On TV" (movies analogue)
} from '@/lib/swr';

type MoviesCategory = 'popular' | 'airing-today' | 'on-tv' | 'top-rated';

const MOVIE_TABS: { slug: MoviesCategory; label: string }[] = [
  { slug: 'popular',      label: 'Popular' },
  { slug: 'airing-today', label: 'Airing Today' },
  { slug: 'on-tv',        label: 'On TV' },
  { slug: 'top-rated',    label: 'Top Rated' },
];

/* ---------- lightweight skeleton atoms (no deps) ---------- */
function Skel({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}
function SkelLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse h-4 rounded bg-white/10 ${className}`} />;
}
function SkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden bg-white/5 shadow">
      <div className="relative aspect-[2/3]">
        <Skel className="absolute inset-0" />
      </div>
      <div className="p-3">
        <SkelLine className="w-4/5 mb-2" />
        <SkelLine className="w-1/3 h-3" />
      </div>
    </div>
  );
}

export default function MoviesCategoryPage() {
  const { category } = useParams() as { category: MoviesCategory };

  const isValid =
    category === 'popular' ||
    category === 'airing-today' ||
    category === 'on-tv' ||
    category === 'top-rated';

  // Fetch per category
  const popular = usePopular('movie');
  const topRated = useTopRated('movie');
  const nowPlaying = useNowPlaying(); // Airing Today
  const upcoming = useUpcoming();     // On TV

  const map = {
    'popular': popular,
    'airing-today': nowPlaying,
    'on-tv': upcoming,
    'top-rated': topRated,
  } as const;

  const active = isValid ? map[category] : undefined;
  const isLoading = !isValid || active?.isLoading;
  const items = (active?.data?.results ?? []) as any[];

  const title = MOVIE_TABS.find(t => t.slug === category)?.label ?? 'Movies';

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[45px]">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MOVIE_TABS.map(tab => {
            const activeTab = tab.slug === category;
            return (
              <Link
                key={tab.slug}
                href={`/movies/${tab.slug}`}
                className={`px-3 py-1.5 rounded-full border text-sm ${
                  activeTab
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-transparent text-gray-200 border-white/10 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">Movies · {title}</h1>

        {!isValid ? (
          <div className="text-gray-300">Unknown category.</div>
        ) : isLoading ? (
          // ---------- Skeleton grid ----------
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-gray-300">No items found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {items.map((m: any) => (
              <MovieCard key={m.id} movie={m} mediaType="movie" />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
