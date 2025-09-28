'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePopular, useMovieVideos } from '@/lib/swr';
import { getBackdropUrl } from '@/lib/tmdb';

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const { data: popularMovies } = usePopular('movie');
  const backgroundMovie = popularMovies?.results?.[14];

  const movieId = backgroundMovie?.id ?? 0;
  const { data: videos } = useMovieVideos(movieId);

  const trailer = videos?.results?.find(
    (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
  );
  const trailerId = trailer?.key || '';

  const backgroundImage = backgroundMovie
    ? getBackdropUrl(backgroundMovie.backdrop_path, 'w1280')
    : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative min-h-[78vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background video that fully covers the hero */}
      {trailerId ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <iframe
            className="heroVideo"
            src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${trailerId}&modestbranding=1&rel=0&iv_load_policy=3`}
            title="Background trailer"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen={false}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      ) : (
        backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">Welcome to Trailer Fie</h1>
          <p className="text-xl md:text-2xl mb-4 text-gray-200">Watch millions of movie trailers here</p>
          <p className="text-lg md:text-xl mb-8 text-gray-300">Discover your favorite movie star here</p>

          <form onSubmit={handleSearch} className="mt-8 md:mt-10 mx-auto max-w-2xl">
            <div className="relative">
              <div className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] focus-within:border-white/30 focus-within:ring-2 focus-within:ring-sky-400/40 transition">
                <span className="pl-4 md:pl-5 text-gray-200/80 pointer-events-none">
                  <Search className="h-5 w-5 md:h-5 md:w-5" />
                </span>
                <Input
                  type="text"
                  placeholder="Search for movies, TV shows, people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 md:h-[3.75rem] flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base md:text-lg placeholder:text-gray-300 text-white px-0"
                />
                <div className="pr-2 md:pr-2.5">
                  <Button
                    type="submit"
                    className="h-11 md:h-12 rounded-full px-5 md:px-6 font-semibold
                               bg-gradient-to-r from-sky-500 to-fuchsia-500
                               hover:from-sky-400 hover:to-fuchsia-400
                               shadow-lg shadow-fuchsia-500/20"
                  >
                    Search
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm text-gray-200/80">
                <span className="opacity-80">Try:</span>
                <button type="button" onClick={() => setSearchQuery('Oppenheimer')} className="underline/30 hover:underline">
                  Oppenheimer
                </button>
                <span>•</span>
                <button type="button" onClick={() => setSearchQuery('Dune: Part Two')} className="underline/30 hover:underline">
                  Dune: Part Two
                </button>
                <span>•</span>
                <button type="button" onClick={() => setSearchQuery('Zendaya')} className="underline/30 hover:underline">
                  Zendaya
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Sizing rules for the iframe to fully cover the hero container */}
      <style jsx>{`
        .heroVideo {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          /* Default: fit by width (for wide viewports) -> 16:9 = 56.25vw tall */
          width: 100vw;
          height: 56.25vw;
          max-width: none;
          border: 0;
        }
        /* If the viewport is taller (narrow), fit by height instead -> width = 177.78vh */
        @media (max-aspect-ratio: 16/9) {
          .heroVideo {
            width: 177.78vh; /* 100vh * 16/9 */
            height: 100vh;
          }
        }
      `}</style>
    </section>
  );
}
