'use client';
export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import NextDynamic from 'next/dynamic';
import Footer from '@/components/Footer';
import CastCrewDirectory from '@/components/CastCrewDirectory';
import { useTVCredits, useTVDetails } from '@/lib/swr';

const Navbar = NextDynamic(() => import('@/components/Navbar'), { ssr: false });

function LoadingState() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-28 animate-pulse rounded-xl bg-white/10" />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function TVCastPage() {
  const { id } = useParams<{ id: string }>();
  const showId = Number(id);
  const { data: tv, isLoading: tvLoading } = useTVDetails(showId);
  const { data: credits, isLoading: creditsLoading } = useTVCredits(showId);

  if (tvLoading || creditsLoading) return <LoadingState />;

  return (
    <div className="min-h-screen">
      <Navbar />
      <CastCrewDirectory
        title={`${tv?.name || 'TV Series'} Cast & Crew`}
        subtitle="Full series cast, featured roles and production crew."
        backHref={`/tvs/${showId}`}
        posterPath={tv?.poster_path}
        backdropPath={tv?.backdrop_path}
        cast={credits?.cast ?? []}
        crew={credits?.crew ?? []}
      />
      <Footer />
    </div>
  );
}
