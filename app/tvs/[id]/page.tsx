'use client';
export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Heart, Bookmark, Plus } from 'lucide-react';
// import dynamic from 'next/dynamic';

import NextDynamic from 'next/dynamic';
const Navbar = NextDynamic(() => import('@/components/Navbar'), { ssr: false });
import Footer from '@/components/Footer';
import Carousel from '@/components/Carousel';
import MovieCard from '@/components/MovieCard';
import PersonCard from '@/components/PersonCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { notify } from '@/lib/notify';

import {
  useTVDetails,
  useTVCredits,
  useTVVideos,
  useTVRecommendations,
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
import { getAuthClient } from '@/lib/firebase'; // 👈 replace `auth` import
import { addFavorite, getFavorites } from '@/lib/favorites';
import { addToWatchlist, getWatchlist } from '@/lib/watchlist';
import { addToLists, getLists } from '@/lib/lists';
import { logWatchEvent } from '@/lib/watch';

/* --- tiny skeleton atoms --- */
function Skel({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}
function SkelCircle({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />;
}
function SkelLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse h-4 rounded bg-white/10 ${className}`} />;
}


// Note: WatchProviders is a **server component** in our setup.
// You can't import a server component directly into a client component,
// but Next.js allows using dynamic() with { ssr: true } to render it.
// const WatchProviders = dynamic(() => import('@/app/movie/[id]/WatchProviders'), {
//   ssr: true,
// });

export default function TVDetailPage() {
  const { id } = useParams<{ id: string }>();
  const showId = Number(id);

  // Data hooks
  const { data: tv, isLoading } = useTVDetails(showId);
  const { data: credits } = useTVCredits(showId);
  const { data: videos } = useTVVideos(showId);
  const { data: recommendations } = useTVRecommendations(showId);

  // Local UI/auth state
  const [imageError, setImageError] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [isWatch, setIsWatch] = useState(false);
  const [isListed, setIsListed] = useState(false);

  /* Auth subscription */
useEffect(() => {
  const auth = getAuthClient();           // ✅ create in browser
  const unsub = onAuthStateChanged(auth, setUser);
  return () => unsub();
}, []);

  /* Compute toggles when user/show changes */
  useEffect(() => {
    if (!user || !tv) {
      setIsFav(false);
      setIsWatch(false);
      setIsListed(false);
      return;
    }
    setIsFav(getFavorites(user.uid).some((m) => m.id === tv.id));
    setIsWatch(getWatchlist(user.uid).some((m) => m.id === tv.id));
    setIsListed(getLists(user.uid).some((m) => m.id === tv.id));
  }, [user, tv]);

  const handleImageError = () => setImageError(true);

  const requireAuth = (action: string, fn: () => void) => {
    if (!user) {
      notify({
        once: true,
        title: 'Sign in required',
        description: `Please sign in to ${action}.`,
        variant: 'error',
      });
      return;
    }
    fn();
  };

  const handleFavorite = () =>
    requireAuth('add favorites', () => {
      if (!user || !tv) return;
      const { added } = addFavorite(user.uid, {
        id: tv.id,
        media_type: 'tvs', // keep your app’s internal media_type
        title: tv.name,
        poster_path: tv.poster_path,
        first_air_date: tv.first_air_date,
        vote_average: tv.vote_average,
      });
      if (added) {
        setIsFav(true);
        notify({
          once: true,
          title: 'Added to favorites',
          description: `${tv.name} was added to your favorites.`,
          variant: 'success',
        });
      } else {
        setIsFav(true);
        notify({
          once: true,
          title: 'Already added',
          description: `${tv.name} is already in your favorites.`,
          variant: 'error',
        });
      }
    });

  const handleWatchlist = () =>
    requireAuth('add to watchlist', () => {
      if (!user || !tv) return;
      const { added } = addToWatchlist(user.uid, {
        id: tv.id,
        media_type: 'tvs',
        title: tv.name,
        poster_path: tv.poster_path,
        first_air_date: tv.first_air_date,
        vote_average: tv.vote_average,
      });
      if (added) {
        setIsWatch(true);
        notify({
          once: true,
          title: 'Added to watchlist',
          description: `${tv.name} was added to your watchlist.`,
          variant: 'success',
        });
      } else {
        setIsWatch(true);
        notify({
          once: true,
          title: 'Already added',
          description: `${tv.name} is already in your watchlist.`,
          variant: 'error',
        });
      }
    });

  const handleList = () =>
    requireAuth('add to your list', () => {
      if (!user || !tv) return;
      const { added } = addToLists(user.uid, {
        id: tv.id,
        media_type: 'tvs',
        title: tv.name,
        poster_path: tv.poster_path,
        first_air_date: tv.first_air_date,
        vote_average: tv.vote_average,
      });
      if (added) {
        setIsListed(true);
        notify({
          once: true,
          title: 'Added to your list',
          description: `${tv.name} was added to your list.`,
          variant: 'success',
        });
      } else {
        setIsListed(true);
        notify({
          once: true,
          title: 'Already added',
          description: `${tv.name} is already in your list.`,
          variant: 'error',
        });
      }
    });

  /* ----------------- SKELETON: loading state ----------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <section className="relative min-h-[70vh] bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-900">
          <div className="absolute inset-0 movie-backdrop" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1">
                <div className="relative aspect-[2/3] max-w-sm mx-auto lg:mx-0 overflow-hidden rounded-lg shadow-2xl">
                  <Skel className="absolute inset-0" />
                </div>
              </div>
              <div className="lg:col-span-2 mt-[35px]">
                <SkelLine className="h-8 w-4/5 mb-3" />
                <SkelLine className="h-5 w-1/3 mb-8" />
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
  if (!tv) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div>TV show not found</div>
        </div>
      </div>
    );
  }

  /* ----------------- NORMAL RENDER ----------------- */
  const trailer = videos?.results?.find(
    (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
  );

  const score = formatVoteAverage(tv.vote_average);
  const scoreColor = getVoteAverageColor(tv.vote_average);

  const epRuntime =
    Array.isArray(tv.episode_run_time) && tv.episode_run_time.length > 0
      ? tv.episode_run_time[0]
      : typeof tv.episode_run_time === 'number'
      ? tv.episode_run_time
      : undefined;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section with Backdrop */}
      <section
        className="relative min-h-[70vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${getBackdropUrl(tv.backdrop_path)})` }}
      >
        <div className="absolute inset-0 movie-backdrop" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Poster */}
            <div className="lg:col-span-1">
              <div className="relative aspect-[2/3] max-w-sm mx-auto lg:mx-0 overflow-hidden rounded-lg shadow-2xl">
                {!imageError && tv.poster_path ? (
                  <Image
                    src={getImageUrl(tv.poster_path, 'w500')}
                    alt={tv.name}
                    fill
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

            {/* TV Info */}
            <div className="lg:col-span-2 text-white mt-[35px]">
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                {tv.name}
                {tv.first_air_date && (
                  <span className="text-gray-300 font-normal ml-2">
                    ({new Date(tv.first_air_date).getFullYear()})
                  </span>
                )}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                {tv.first_air_date && <span>{formatDate(tv.first_air_date)}</span>}
                {tv.genres?.length ? (
                  <>
                    <span>•</span>
                    <span>{tv.genres.map((g: any) => g.name).join(', ')}</span>
                  </>
                ) : null}
                {epRuntime ? (
                  <>
                    <span>•</span>
                    <span>{formatRuntime(epRuntime)} / ep</span>
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
                        strokeDashoffset={100 - tv.vote_average * 10}
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
                    className={`border-white/50 text-white hover:bg-white/30 ${
                      isListed ? 'bg-sky-500/30 hover:bg-sky-500/40' : 'bg-white/20'
                    }`}
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
                    className={`border-white/50 text-white hover:bg-white/30 ${
                      isFav ? 'bg-rose-500/30 hover:bg-rose-500/40' : 'bg-white/20'
                    }`}
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
                    className={`border-white/50 text-white hover:bg-white/30 ${
                      isWatch ? 'bg-emerald-500/30 hover:bg-emerald-500/40' : 'bg-white/20'
                    }`}
                    aria-label={isWatch ? 'Added to watchlist' : 'Add to watchlist'}
                    title={isWatch ? 'Added to watchlist' : 'Add to watchlist'}
                  >
                    <Bookmark className={`h-4 w-4 ${isWatch ? 'text-emerald-200' : ''}`} />
                  </Button>

                  {/* Trailer */}
                  {trailer && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            const uid = user?.uid; 
                            if (!uid) return;
                            logWatchEvent(uid, {
                              id: tv.id,
                              media_type: 'tvs', // your app’s internal type
                              name: tv.name,
                              poster_path: tv.poster_path,
                            });
                          }}
                        >
                          Watch Trailer
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
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

              {tv.tagline && (
                <p className="text-lg italic text-gray-300 mb-4">&quot;{tv.tagline}&quot;</p>
              )}

              <div>
                <h3 className="text-xl font-semibold mb-2">Overview</h3>
                <p className="text-gray-200 leading-relaxed">{tv.overview}</p>
              </div>

              {/* WHERE TO WATCH */}
              {/* <div className="mt-8">
                <WatchProviders movieId={showId} mediaType="tv" region="GH" />
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* Cast & Facts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cast */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-6 text-white">Top Billed Cast</h2>
            {credits?.cast ? (
              <Carousel className="w-full">
                {credits.cast.slice(0, 10).map((person: any) => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </Carousel>
            ) : (
              <div className="flex gap-4">
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
            )}
          </div>

          {/* Facts */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-6 text-white">Facts</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="font-semibold text-white">Status</h4>
                <p className="text-gray-300">{tv.status || '-'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-white">Original Language</h4>
                <p className="text-gray-300">{tv.original_language?.toUpperCase() || '-'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-white">Seasons</h4>
                <p className="text-gray-300">{tv.number_of_seasons ?? '-'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-white">Episodes</h4>
                <p className="text-gray-300">{tv.number_of_episodes ?? '-'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-white">First Air Date</h4>
                <p className="text-gray-300">
                  {tv.first_air_date ? formatDate(tv.first_air_date) : '-'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white">Last Air Date</h4>
                <p className="text-gray-300">
                  {tv.last_air_date ? formatDate(tv.last_air_date) : '-'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white">In Production</h4>
                <p className="text-gray-300">{tv.in_production ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-white">Networks</h4>
                <p className="text-gray-300">
                  {Array.isArray(tv.networks) && tv.networks.length > 0
                    ? tv.networks.map((n: any) => n.name).join(', ')
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      {recommendations?.results?.length ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-2xl font-bold mb-6 text-white">Recommendations</h2>
          <Carousel>
            {recommendations.results.slice(0, 10).map((show: any) => (
              <MovieCard key={show.id} movie={show} mediaType="tvs" />
            ))}
          </Carousel>
        </section>
      ) : null}

      <Footer />
    </div>
  );
}
