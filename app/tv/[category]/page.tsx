'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MovieCard from '@/components/MovieCard';
import {
  usePopular,
  useTopRated,
  useAiringToday,
  useOnTheAir,
} from '@/lib/swr';

type TVCategory = 'popular' | 'airing-today' | 'on-tv' | 'top-rated';

const TV_TABS: { slug: TVCategory; label: string }[] = [
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

export default function TVCategoryPage() {
  const { category } = useParams() as { category: TVCategory };

  const isValid =
    category === 'popular' ||
    category === 'airing-today' ||
    category === 'on-tv' ||
    category === 'top-rated';

  // Fetch per category
  const popular = usePopular('tv');
  const topRated = useTopRated('tv');
  const airingToday = useAiringToday();
  const onTheAir = useOnTheAir();

  const map = {
    'popular': popular,
    'airing-today': airingToday,
    'on-tv': onTheAir,
    'top-rated': topRated,
  } as const;

  const active = isValid ? map[category] : undefined;
  const isLoading = !isValid || active?.isLoading;
  const items = (active?.data?.results ?? []) as any[];

  const title = TV_TABS.find(t => t.slug === category)?.label ?? 'TV Shows';

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[45px]">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TV_TABS.map(tab => {
            const activeTab = tab.slug === category;
            return (
              <Link
                key={tab.slug}
                href={`/tv/${tab.slug}`}
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

        <h1 className="text-2xl font-bold text-white mb-4">TV Shows · {title}</h1>

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
            {items.map((t: any) => (
              <MovieCard key={t.id} movie={t} mediaType="tvs" />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
