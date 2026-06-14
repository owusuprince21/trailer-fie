'use client';
export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import NextDynamic from 'next/dynamic';
import Footer from '@/components/Footer';
import CastCrewDirectory from '@/components/CastCrewDirectory';
import { useMovieCredits, useMovieDetails } from '@/lib/swr';

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

export default function MovieCastPage() {
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);
  const { data: movie, isLoading: movieLoading } = useMovieDetails(movieId);
  const { data: credits, isLoading: creditsLoading } = useMovieCredits(movieId);

  if (movieLoading || creditsLoading) return <LoadingState />;

  return (
    <div className="min-h-screen">
      <Navbar />
      <CastCrewDirectory
        title={`${movie?.title || 'Movie'} Cast & Crew`}
        subtitle="Full cast, featured roles and production crew."
        backHref={`/movie/${movieId}`}
        posterPath={movie?.poster_path}
        backdropPath={movie?.backdrop_path}
        cast={credits?.cast ?? []}
        crew={credits?.crew ?? []}
      />
      <Footer />
    </div>
  );
}
