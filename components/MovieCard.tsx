'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  getImageUrl,
  formatYear,
  formatVoteAverage,
  getVoteAverageColor,
} from '@/lib/tmdb';
import { prefetchMovie, prefetchTV } from '@/lib/prefetch';

interface MovieCardProps {
  movie: any;
  mediaType: 'movie' | 'tvs';
}

export default function MovieCard({ movie, mediaType }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const prefetchedRef = useRef(false);

  if (!movie) return null;

  const title =
    mediaType === 'movie' ? movie?.title ?? 'Untitled' : movie?.name ?? 'Untitled';
  const releaseDate =
    mediaType === 'movie' ? movie?.release_date : movie?.first_air_date;
  const year = formatYear(releaseDate);
  const score = formatVoteAverage(movie?.vote_average ?? 0);
  const scoreColor = getVoteAverageColor(movie?.vote_average ?? 0);

  const doPrefetch = async () => {
    if (prefetchedRef.current || !movie?.id) return;
    try {
      if (mediaType === 'movie') {
        await prefetchMovie(movie.id);
      } else {
        await prefetchTV(movie.id);
      }
      prefetchedRef.current = true;
    } catch {
      // ignore prefetch errors; page will still fetch on navigate
    }
  };

  return (
    <motion.div
      className="relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer group h-full flex flex-col"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/${mediaType}/${movie.id}`}
        prefetch
        className="flex h-full flex-col"
        onMouseEnter={doPrefetch}
        onFocus={doPrefetch}
        onTouchStart={doPrefetch}
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          {!imageError && movie?.poster_path ? (
            <Image
              src={getImageUrl(movie.poster_path)}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          )}

          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/50">
                <Play className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Watch Trailer</span>
              </Button>
            </motion.div>
          )}

          {/* User Score */}
          <div className="absolute bottom-1.5 left-1.5">
            <div className="relative h-8 w-8">
              <svg className="h-8 w-8 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-300"
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
                  strokeDashoffset={100 - (movie?.vote_average ?? 0) * 10}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-[9px] font-bold text-white">
                  {score}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed-height text block to keep every card the same height */}
        <div className="p-2.5">
          <h3
            className="mb-0.5 text-xs font-semibold leading-snug text-gray-900 transition-colors line-clamp-2 group-hover:text-blue-600 sm:text-sm"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '2.6em',
            }}
          >
            {title}
          </h3>
          <p className="text-[11px] text-gray-600 sm:text-xs">{year}</p>
        </div>
      </Link>
    </motion.div>
  );
}
