'use client';
export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Play, Heart, Bookmark, Plus, Images, Trophy } from 'lucide-react';
// import dynamic from 'next/dynamic';

import NextDynamic from 'next/dynamic';
const Navbar = NextDynamic(() => import('@/components/Navbar'), { ssr: false });
import Footer from '@/components/Footer';
import Carousel from '@/components/Carousel';
import MovieCard from '@/components/MovieCard';
import PersonCard from '@/components/PersonCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { notify } from '@/lib/notify';

import {
  useMovieDetails,
  useMovieCredits,
  useMovieImages,
  useMovieVideos,
  useMovieRecommendations,
} from '@/lib/swr';

import {
  getImageUrl,
  getBackdropUrl,
  formatDate,
  formatRuntime,
  formatVoteAverage,
  getVoteAverageColor,
} from '@/lib/tmdb';

import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getAuthClient } from '@/lib/firebase'; // ⬅️ replace `auth` import
import { addFavorite, getFavorites } from '@/lib/favorites';
import { addToWatchlist, getWatchlist } from '@/lib/watchlist';
import { addToLists, getLists } from '@/lib/lists';
import { logWatchEvent } from '@/lib/watch';

/* --- lightweight skeleton atoms (no deps) --- */
function Skel({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}
function SkelCircle({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />;
}
function SkelLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse h-4 rounded bg-white/10 ${className}`} />;
}

function CompactCastCard({ person }: { person: any }) {
  const [imageError, setImageError] = useState(false);
  const name = person?.name || 'Unknown';
  const role = person?.character || person?.job || person?.department || 'Contributor';
  const badge = person?.credit_kind === 'crew' ? person?.department || 'Crew' : 'Cast';

  return (
    <a
      href={`/person/${person.id}`}
      className="group overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-md transition hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl"
    >
      <div className="relative aspect-[2/3] bg-gray-200">
        <Image
          src={!imageError && person.profile_path ? getImageUrl(person.profile_path, 'w342') : '/person-placeholder.svg'}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 14vw"
          className="object-cover transition duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {badge}
        </span>
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-2 min-h-[2.4em] text-xs font-bold leading-tight text-white sm:text-sm">
          {name}
        </h3>
        <p className="mt-1 line-clamp-2 min-h-[2.2em] text-[11px] leading-tight text-white/65">
          {role}
        </p>
      </div>
    </a>
  );
}

function CastCarousel({ cast, crew = [] }: { cast: any[]; crew?: any[] }) {
  const castPeople = cast.map((person) => ({ ...person, credit_kind: 'cast' }));
  const crewPeople = crew.map((person) => ({ ...person, credit_kind: 'crew' }));
  const dedupe = (people: any[]) =>
    people.filter((person, index, all) => {
      const key = person.credit_id ?? `${person.credit_kind}-${person.id}-${person.job ?? person.character ?? index}`;
      return all.findIndex((candidate, candidateIndex) => {
        const candidateKey =
          candidate.credit_id ??
          `${candidate.credit_kind}-${candidate.id}-${candidate.job ?? candidate.character ?? candidateIndex}`;
        return candidateKey === key;
      }) === index;
    });
  const featured = dedupe([
    ...castPeople.slice(0, 8),
    ...crewPeople.slice(0, 4),
    ...castPeople.slice(8),
    ...crewPeople.slice(4),
  ]).slice(0, 12);

  return (
    <div className="overflow-hidden">
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide lg:gap-4">
        {featured.map((person: any, index) => (
          <div
            key={person.credit_id ?? `${person.credit_kind}-${person.id}-${index}`}
            className="w-[calc((100%_-_0.75rem)/2)] shrink-0 min-[520px]:w-[calc((100%_-_1.5rem)/3)] lg:w-[calc((100%_-_6rem)/7)]"
          >
            <CompactCastCard person={person} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ContributorLeaderboard({ crew = [] }: { crew?: any[] }) {
  const contributors = useMemo(() => {
    const byId = new Map<number, any>();

    crew.forEach((member) => {
      if (!member?.id) return;
      const current = byId.get(member.id) ?? {
        id: member.id,
        name: member.name || 'Unknown',
        profile_path: member.profile_path,
        popularity: member.popularity ?? 0,
        jobs: new Set<string>(),
        departments: new Set<string>(),
      };
      if (member.job) current.jobs.add(member.job);
      if (member.department) current.departments.add(member.department);
      current.popularity = Math.max(current.popularity, member.popularity ?? 0);
      byId.set(member.id, current);
    });

    return Array.from(byId.values())
      .map((person) => ({
        ...person,
        jobs: Array.from(person.jobs) as string[],
        departments: Array.from(person.departments) as string[],
        score: person.popularity + person.jobs.size * 8 + person.departments.size * 3,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [crew]);

  if (!contributors.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="mb-5 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-300" />
        <h2 className="text-2xl font-bold text-white">Top Contributors</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {contributors.map((person, index) => (
          <a
            key={person.id}
            href={`/person/${person.id}`}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">
              {index + 1}
            </div>
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/10">
              {person.profile_path ? (
                <Image
                  src={getImageUrl(person.profile_path, 'w185')}
                  alt={person.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <Image
                  src="/person-placeholder.svg"
                  alt={person.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{person.name}</div>
              <div className="truncate text-xs text-white/60">
                {person.jobs.slice(0, 2).join(', ') || person.departments.join(', ') || 'Contributor'}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function MovieMediaPanel({
  images,
  videos,
}: {
  images?: { backdrops?: any[]; posters?: any[]; logos?: any[] };
  videos?: { results?: any[] };
}) {
  const [active, setActive] = useState<'backdrops' | 'posters' | 'videos'>('backdrops');
  const backdrops = images?.backdrops ?? [];
  const posters = images?.posters ?? [];
  const playableVideos =
    videos?.results?.filter((video: any) => video.site === 'YouTube') ?? [];

  const tabs = [
    { key: 'backdrops' as const, label: 'Backdrops', count: backdrops.length },
    { key: 'posters' as const, label: 'Posters', count: posters.length },
    { key: 'videos' as const, label: 'Videos', count: playableVideos.length },
  ];

  if (!backdrops.length && !posters.length && !playableVideos.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5 text-sky-300" />
          <h2 className="text-2xl font-bold text-white">Media</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                active === tab.key
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
              <span className="ml-1 text-xs opacity-70">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {active === 'backdrops' && (
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
          {backdrops.slice(0, 20).map((item: any) => (
            <div
              key={item.file_path}
              className="relative aspect-video w-[82vw] shrink-0 overflow-hidden rounded-lg bg-white/10 sm:w-[520px]"
            >
              <Image
                src={getBackdropUrl(item.file_path, 'w780')}
                alt="Movie backdrop"
                fill
                sizes="(max-width: 640px) 82vw, 520px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {active === 'posters' && (
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
          {posters.slice(0, 24).map((item: any) => (
            <div
              key={item.file_path}
              className="relative aspect-[2/3] w-[42vw] shrink-0 overflow-hidden rounded-lg bg-white/10 sm:w-[190px]"
            >
              <Image
                src={getImageUrl(item.file_path, 'w342')}
                alt="Movie poster"
                fill
                sizes="(max-width: 640px) 42vw, 190px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {active === 'videos' && (
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
          {playableVideos.slice(0, 16).map((video: any) => (
            <Dialog key={video.id}>
              <DialogTrigger asChild>
                <button className="group relative aspect-video w-[82vw] shrink-0 overflow-hidden rounded-lg bg-white/10 text-left sm:w-[420px]">
                  <Image
                    src={`https://img.youtube.com/vi/${video.key}/hqdefault.jpg`}
                    alt={video.name}
                    fill
                    sizes="(max-width: 640px) 82vw, 420px"
                    className="object-cover transition group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black">
                      <Play className="h-5 w-5 fill-current" />
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="line-clamp-1 text-sm font-semibold text-white">{video.name}</p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogTitle className="sr-only">{video.name || 'Movie video'}</DialogTitle>
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.key}`}
                    title={video.name}
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </section>
  );
}

export default function MovieDetailPage() {

const { id } = useParams<{ id: string }>();
const movieId = Number(id);

  // Dynamically import WatchProviders to avoid SSR issues with sessionStorage
  // const WatchProviders = dynamic(() => import('./WatchProviders'), { ssr: true });

  // Data hooks
  const { data: movie, isLoading } = useMovieDetails(movieId);
  const { data: credits } = useMovieCredits(movieId);
  const { data: movieImages } = useMovieImages(movieId);
  const { data: videos } = useMovieVideos(movieId);
  const { data: recommendations } = useMovieRecommendations(movieId);

  // Local UI/auth state
  const [imageError, setImageError] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [isWatch, setIsWatch] = useState(false);
  const [isListed, setIsListed] = useState(false);
  
  useEffect(() => {
    const auth = getAuthClient();            
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !movie) {
      setIsFav(false);
      setIsWatch(false);
      setIsListed(false);
      return;
    }
    setIsFav(getFavorites(user.uid).some((m) => m.id === movie.id));
    setIsWatch(getWatchlist(user.uid).some((m) => m.id === movie.id));
    setIsListed(getLists(user.uid).some((m) => m.id === movie.id));
  }, [user, movie]);

  const handleImageError = () => setImageError(true);

  const requireAuth = (action: string, fn: () => void) => {
if (!user) {
  notify({
    once: true,
    title: 'Sign in required',
    description: `Please sign in to ${action}.`,
    variant: 'error',
  });
}
    fn();
  };

  const handleFavorite = () =>
    requireAuth('add favorites', () => {
      if (!user || !movie) return;
      const { added } = addFavorite(user.uid, {
        id: movie.id,
        media_type: 'movie',
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
      });
     if (added) {
  setIsFav(true);
  notify({
    once: true,
    title: 'Added to favorites',
    description: `${movie.title ?? movie.name ?? 'This title'} was added to your favorites.`,
    variant: 'success',
  });
} else {
  // keep the existing state; don't force true if it was already favorited
  notify({
    once: true,
    title: 'Already added',
    description: `${movie.title ?? movie.name ?? 'This title'} is already in your favorites.`,
    variant: 'error',
  });
}
    });

  const handleWatchlist = () =>
    requireAuth('add to watchlist', () => {
      if (!user || !movie) return;
      const { added } = addToWatchlist(user.uid, {
        id: movie.id,
        media_type: 'movie',
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
      });
      if (added) {
        setIsWatch(true);
        notify({
          once: true,
          title: 'Added to watchlist',
          description: `${movie.title} was added to your watchlist.`,
          variant: 'success',
        });
      } else {
        setIsWatch(true);
        notify({
           once: true,
          title: 'Already added',
          description: `${movie.title} is already in your watchlist.`,
          variant: 'error',
        });
      }
    });

  const handleList = () =>
    requireAuth('add to your list', () => {
      if (!user || !movie) return;
      const { added } = addToLists(user.uid, {
        id: movie.id,
        media_type: 'movie',
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
      });
      if (added) {
        setIsListed(true);
        notify({
           once: true,
          title: 'Added to your list',
          description: `${movie.title} was added to your list.`,
          variant: 'success',
        });
      } else {
        setIsListed(true);
        notify({
           once: true,
          title: 'Already added',
          description: `${movie.title} is already in your list.`,
          variant: 'error',
        });
      }
    });

  /* ----------------- SKELETON: loading state ----------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />

        {/* Hero skeleton */}
        <section className="relative min-h-[70vh] bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-900">
          <div className="absolute inset-0 movie-backdrop" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Poster */}
              <div className="lg:col-span-1">
                <div className="relative aspect-[2/3] max-w-sm mx-auto lg:mx-0 overflow-hidden rounded-lg shadow-2xl">
                  <Skel className="absolute inset-0" />
                </div>
              </div>

              {/* Info */}
              <div className="lg:col-span-2 mt-[35px]">
                <SkelLine className="h-8 w-4/5 mb-3" />
                <SkelLine className="h-5 w-1/3 mb-8" />

                {/* Score + actions */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <SkelCircle className="w-16 h-16" />
                    <SkelLine className="h-4 w-24" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Skel className="h-10 w-10 rounded-md" />
                    <Skel className="h-10 w-10 rounded-md" />
                    <Skel className="h-10 w-10 rounded-md" />
                    <Skel className="h-10 w-32 rounded-md" />
                  </div>
                </div>

                <SkelLine className="h-5 w-1/2 mb-3" />
                <div className="space-y-3">
                  <SkelLine className="w-full" />
                  <SkelLine className="w-11/12" />
                  <SkelLine className="w-4/5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cast skeleton */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SkelLine className="h-6 w-48 mb-6" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-[220px] sm:w-[240px] lg:w-[260px] shrink-0">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3">
                  <Skel className="absolute inset-0" />
                </div>
                <SkelLine className="w-3/4 mb-2" />
                <SkelLine className="w-1/2 h-3" />
              </div>
            ))}
          </div>
        </section>

        {/* Facts skeleton */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <SkelLine className="h-6 w-32 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkelLine className="h-4 w-32" />
                <Skel className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations skeleton */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <SkelLine className="h-6 w-56 mb-6" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-[220px] sm:w-[240px] lg:w-[260px] shrink-0">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3">
                  <Skel className="absolute inset-0" />
                </div>
                <SkelLine className="w-3/4 mb-2" />
                <SkelLine className="w-1/3 h-3" />
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  /* ----------------- NOT FOUND ----------------- */
  if (!movie) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div>Movie not found</div>
        </div>
      </div>
    );
  }

  /* ----------------- NORMAL RENDER ----------------- */
  const trailer = videos?.results?.find(
    (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
  );

  const score = formatVoteAverage(movie.vote_average);
  const scoreColor = getVoteAverageColor(movie.vote_average);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section with Backdrop */}
      <section
        className="relative min-h-[70vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${getBackdropUrl(movie.backdrop_path)})` }}
      >
        <div className="absolute inset-0 movie-backdrop" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Poster */}
            <div className="lg:col-span-1">
              <div className="relative aspect-[2/3] max-w-sm mx-auto lg:mx-0 overflow-hidden rounded-lg shadow-2xl">
                {!imageError && movie.poster_path ? (
                  <Image
                    src={getImageUrl(movie.poster_path, 'w500')}
                    alt={movie.title}
                    fill
                    loading="eager"
                    sizes="(max-width: 1024px) 384px, 33vw"
                    className="object-cover mt-[25px]"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Movie Info */}
            <div className="lg:col-span-2 text-white mt-[35px]">
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                {movie.title}
                {movie.release_date && (
                  <span className="text-gray-300 font-normal ml-2">
                    ({new Date(movie.release_date).getFullYear()})
                  </span>
                )}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                {movie.release_date && <span>{formatDate(movie.release_date)}</span>}
                {movie.genres?.length ? (
                  <>
                    <span>•</span>
                    <span>{movie.genres.map((g: any) => g.name).join(', ')}</span>
                  </>
                ) : null}
                {movie.runtime ? (
                  <>
                    <span>•</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                  </>
                ) : null}
              </div>

              {/* User Score and Actions */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-600"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray="100"
                        strokeDashoffset="0"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={scoreColor}
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray="100"
                        strokeDashoffset={100 - movie.vote_average * 10}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{score}%</span>
                    </div>
                  </div>
                  <span className="text-sm">User Score</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {/* Lists */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleList}
                    className={`border-white/50 text-white hover:bg-white/30 ${isListed ? 'bg-sky-500/30 hover:bg-sky-500/40' : 'bg-white/20'}`}
                    aria-label={isListed ? 'Added to your list' : 'Add to your list'}
                    title={isListed ? 'Added to your list' : 'Add to your list'}
                  >
                    <Plus className={`h-4 w-4 ${isListed ? 'text-sky-200' : ''}`} />
                  </Button>

                  {/* Favorite */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleFavorite}
                    className={`border-white/50 text-white hover:bg-white/30 ${isFav ? 'bg-rose-500/30 hover:bg-rose-500/40' : 'bg-white/20'}`}
                    aria-label={isFav ? 'Added to favorites' : 'Add to favorites'}
                    title={isFav ? 'Added to favorites' : 'Add to favorites'}
                  >
                    <Heart className={`h-4 w-4 ${isFav ? 'fill-current text-rose-300' : ''}`} />
                  </Button>

                  {/* Watchlist */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleWatchlist}
                    className={`border-white/50 text-white hover:bg-white/30 ${isWatch ? 'bg-emerald-500/30 hover:bg-emerald-500/40' : 'bg-white/20'}`}
                    aria-label={isWatch ? 'Added to watchlist' : 'Add to watchlist'}
                    title={isWatch ? 'Added to watchlist' : 'Add to watchlist'}
                  >
                    <Bookmark className={`h-4 w-4 ${isWatch ? 'text-emerald-200' : ''}`} />
                  </Button>

                  {trailer && (
                    <Dialog>
                      <DialogTrigger asChild>
<Button
  onClick={() => {
    const uid = user?.uid;
    if (!uid) return; // or prompt login
    logWatchEvent(uid, {
      id: movie.id,
      media_type: 'movie',
      title: movie.title,
      poster_path: movie.poster_path,
    });
  }}
>
  Watch Trailer
</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogTitle className="sr-only">
                          {trailer.name || `${movie.title} trailer`}
                        </DialogTitle>
                        <div className="aspect-video">
                          <iframe
                            src={`https://www.youtube.com/embed/${trailer.key}`}
                            title={trailer.name}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {movie.tagline && (
                <p className="text-lg italic text-gray-300 mb-4">&quot;{movie.tagline}&quot;</p>
              )}

              <div>
                <h3 className="text-xl font-semibold mb-2">Overview</h3>
                <p className="text-gray-200 leading-relaxed">{movie.overview}</p>
              </div>

              {/* <div className="mt-8">
                <WatchProviders movieId={movieId} region="GH" />
              </div> */}

            </div>
          </div>
        </div>
      </section>

      {/* Top Billed Cast */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-white">Top Billed Cast & Crew</h2>
          <Link
            href={`/movie/${movieId}/cast`}
            className="text-sm font-semibold text-sky-300 hover:text-sky-200"
          >
            Full Cast & Crew
          </Link>
        </div>
        {credits?.cast ? (
          <CastCarousel cast={credits.cast} crew={credits.crew ?? []} />
        ) : (
          <div className="flex gap-3 overflow-hidden lg:gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-[calc((100%_-_0.75rem)/2)] shrink-0 overflow-hidden rounded-lg bg-white/5 min-[520px]:w-[calc((100%_-_1.5rem)/3)] lg:w-[calc((100%_-_6rem)/7)]"
              >
                <div className="relative aspect-[2/3]">
                  <Skel className="absolute inset-0" />
                </div>
                <div className="p-2.5">
                  <SkelLine className="mb-2 w-3/4" />
                  <SkelLine className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <MovieMediaPanel images={movieImages} videos={videos} />
      <ContributorLeaderboard crew={credits?.crew ?? []} />

      {/* Facts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h2 className="text-2xl font-bold mb-6 text-white">Facts</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h4 className="font-semibold text-white">Status</h4>
            <p className="text-gray-300">{movie.status}</p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Original Language</h4>
            <p className="text-gray-300">{movie.original_language?.toUpperCase()}</p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Budget</h4>
            <p className="text-gray-300">
              {movie.budget > 0 ? `$${movie.budget.toLocaleString()}` : '-'}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Revenue</h4>
            <p className="text-gray-300">
              {movie.revenue > 0 ? `$${movie.revenue.toLocaleString()}` : '-'}
            </p>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      {recommendations?.results?.length ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-2xl font-bold mb-6 text-white">Recommendations</h2>
          <Carousel>
            {recommendations.results.slice(0, 10).map((m: any) => (
              <MovieCard key={m.id} movie={m} mediaType="movie" />
            ))}
          </Carousel>
        </section>
      ) : null}

      <Footer />
    </div>
  );
}
