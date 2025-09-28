'use client';

import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/tabs';
import Carousel from '@/components/Carousel';
import MovieCard from '@/components/MovieCard';
import {
  useTrending,
  useDiscover,
  usePopular,
  useNowPlaying,
  useAiringToday,
  useOnTheAir,
} from '@/lib/swr';

/* =============================== Types =============================== */

type TrendingTab = 'today' | 'week';
type LatestTab = 'popular' | 'streaming' | 'tv' | 'rent' | 'theater';
type PopularTab = 'streaming' | 'tv' | 'rent' | 'theater';
type FreeTab = 'movies' | 'tv';

interface SectionTabsProps {
  title: string;
  type: 'trending' | 'latest-trailers' | 'popular' | 'free-to-watch';
}

type Option = { value: string; label: string };

/* ============================= SwitchPills ============================ */
/** A lightweight, animated pill switcher that:
 *  - fits the active highlight to the container
 *  - uses equal columns so the slider width is always correct
 *  - shrinks nicely on mobile when there are 2 options (compactOnTwo)
 */
function SwitchPills({
  value,
  onValueChange,
  options,
  compactOnTwo = false,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: Option[];
  compactOnTwo?: boolean;
}) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const cols = options.length;
  const widthPct = 100 / cols;

  // Container sizing
  const baseContainer =
    'relative overflow-hidden rounded-full border bg-white/5 backdrop-blur ' +
    'border-emerald-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]';
  const spacing = 'p-1';
  const responsive =
    compactOnTwo && cols === 2
      ? // keep the bar tight when there are 2 options on small screens
        'w-full max-w-[280px] sm:max-w-[360px] md:max-w-none'
      : 'w-full md:w-auto';

  return (
    <div className={`${baseContainer} ${spacing} ${responsive}`}>
      {/* Equal-width grid so the slider width is always column width */}
      <div
        className="relative grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {/* Sliding highlight */}
        <div
          className="absolute top-0 left-0 h-full rounded-full
                     transition-transform duration-300 ease-out will-change-transform
                     bg-gradient-to-r from-sky-500 to-fuchsia-500 hover:from-sky-400 hover:to-fuchsia-400 shadow-lg shadow-fuchsia-500/20"
          style={{
            width: `${widthPct}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
          aria-hidden
        />

        {/* Buttons */}
        {options.map((opt, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onValueChange(opt.value)}
              className={`relative z-10 rounded-full px-3 md:px-4 py-1.5 md:py-2
                          font-semibold text-[13px] md:text-sm
                          transition-colors
                          ${isActive ? 'text-black' : 'text-white/90 hover:text-white'}`}
              aria-pressed={isActive}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================== Skeletons ============================ */

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white/5">
      <div className="aspect-[2/3] animate-pulse bg-white/10" />
      <div className="p-3">
        <div className="mb-2 h-4 w-4/5 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

function SkeletonCarousel({ count = 8 }: { count?: number }) {
  return (
    <Carousel>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </Carousel>
  );
}

/* ============================= Carousels ============================= */

function TrendingCarousel({ timeWindow }: { timeWindow: 'day' | 'week' }) {
  const { data: movies } = useTrending('movie', timeWindow);
  if (!movies?.results) return <SkeletonCarousel />;
  return (
    <Carousel>
      {movies.results.map((m: any) => (
        <MovieCard key={m.id} movie={m} mediaType="movie" />
      ))}
    </Carousel>
  );
}

function PopularCarousel() {
  const { data: movies } = usePopular('movie');
  if (!movies?.results) return <SkeletonCarousel />;
  return (
    <Carousel>
      {movies.results.map((m: any) => (
        <MovieCard key={m.id} movie={m} mediaType="movie" />
      ))}
    </Carousel>
  );
}

function NowPlayingCarousel() {
  const { data: movies } = useNowPlaying();
  if (!movies?.results) return <SkeletonCarousel />;
  return (
    <Carousel>
      {movies.results.map((m: any) => (
        <MovieCard key={m.id} movie={m} mediaType="movie" />
      ))}
    </Carousel>
  );
}

function AiringTodayCarousel() {
  const { data: shows } = useAiringToday();
  if (!shows?.results) return <SkeletonCarousel />;
  return (
    <Carousel>
      {shows.results.map((s: any) => (
        <MovieCard key={s.id} movie={s} mediaType="tvs" />
      ))}
    </Carousel>
  );
}

function OnTheAirCarousel() {
  const { data: shows } = useOnTheAir();
  if (!shows?.results) return <SkeletonCarousel />;
  return (
    <Carousel>
      {shows.results.map((s: any) => (
        <MovieCard key={s.id} movie={s} mediaType="tvs" />
      ))}
    </Carousel>
  );
}

/** Accepts 'movie' | 'tvs' for app routing, converts to API 'movie' | 'tv' */
function DiscoverCarousel({
  mediaType,
  params,
}: {
  mediaType: 'movie' | 'tvs' | 'tv';
  params: Record<string, string>;
}) {
  const apiMediaType: 'movie' | 'tv' = mediaType === 'tvs' ? 'tv' : mediaType;
  const { data } = useDiscover(apiMediaType, params);
  if (!data?.results) return <SkeletonCarousel />;
  return (
    <Carousel>
      {data.results.map((item: any) => (
        <MovieCard
          key={item.id}
          movie={item}
          mediaType={mediaType === 'tv' ? 'tvs' : mediaType}
        />
      ))}
    </Carousel>
  );
}

/* ============================= Main Component ============================= */

export default function SectionTabs({ title, type }: SectionTabsProps) {
  // Controlled values for each section
  const [trendingValue, setTrendingValue] = useState<TrendingTab>('today');
  const [latestValue, setLatestValue] = useState<LatestTab>('popular');
  const [popularValue, setPopularValue] = useState<PopularTab>('streaming');
  const [freeValue, setFreeValue] = useState<FreeTab>('movies');

  // Typed handlers (no implicit any)
  const handleTrendingChange = (v: string) =>
    setTrendingValue(v as TrendingTab);
  const handleLatestChange = (v: string) => setLatestValue(v as LatestTab);
  const handlePopularChange = (v: string) => setPopularValue(v as PopularTab);
  const handleFreeChange = (v: string) => setFreeValue(v as FreeTab);

  const Header = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <div className="w-full md:w-auto">{children}</div>
    </div>
  );

  if (type === 'trending') {
    return (
      <Tabs value={trendingValue} onValueChange={handleTrendingChange} className="w-full">
        <Header>
          <SwitchPills
            value={trendingValue}
            onValueChange={handleTrendingChange}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
            ]}
            compactOnTwo
          />
        </Header>

        <TabsContent value="today">
          <TrendingCarousel timeWindow="day" />
        </TabsContent>
        <TabsContent value="week">
          <TrendingCarousel timeWindow="week" />
        </TabsContent>
      </Tabs>
    );
  }

  if (type === 'latest-trailers') {
    return (
      <Tabs value={latestValue} onValueChange={handleLatestChange} className="w-full">
        <Header>
          <SwitchPills
            value={latestValue}
            onValueChange={handleLatestChange}
            options={[
              { value: 'popular', label: 'Popular' },
              { value: 'streaming', label: 'Streaming' },
              { value: 'tv', label: 'On TV' },
              { value: 'rent', label: 'For Rent' },
              // { value: 'theater', label: 'In Theaters' },
            ]}
          />
        </Header>

        <TabsContent value="popular">
          <PopularCarousel />
        </TabsContent>
        <TabsContent value="streaming">
          <DiscoverCarousel
            mediaType="movie"
            params={{ with_watch_monetization_types: 'flatrate' }}
          />
        </TabsContent>
        <TabsContent value="tv">
          <AiringTodayCarousel />
        </TabsContent>
        <TabsContent value="rent">
          <DiscoverCarousel
            mediaType="movie"
            params={{ with_watch_monetization_types: 'rent' }}
          />
        </TabsContent>
        <TabsContent value="theater">
          <NowPlayingCarousel />
        </TabsContent>
      </Tabs>
    );
  }

  if (type === 'popular') {
    return (
      <Tabs value={popularValue} onValueChange={handlePopularChange} className="w-full">
        <Header>
          <SwitchPills
            value={popularValue}
            onValueChange={handlePopularChange}
            options={[
              { value: 'streaming', label: 'Streaming' },
              { value: 'tv', label: 'On TV' },
              { value: 'rent', label: 'For Rent' },
              { value: 'theater', label: 'Theaters' },
            ]}
          />
        </Header>

        <TabsContent value="streaming">
          <DiscoverCarousel
            mediaType="movie"
            params={{
              with_watch_monetization_types: 'flatrate',
              sort_by: 'popularity.desc',
            }}
          />
        </TabsContent>
        <TabsContent value="tv">
          <OnTheAirCarousel />
        </TabsContent>
        <TabsContent value="rent">
          <DiscoverCarousel
            mediaType="movie"
            params={{
              with_watch_monetization_types: 'rent',
              sort_by: 'popularity.desc',
            }}
          />
        </TabsContent>
        <TabsContent value="theater">
          <DiscoverCarousel
            mediaType="movie"
            params={{ with_release_type: '3', sort_by: 'popularity.desc' }}
          />
        </TabsContent>
      </Tabs>
    );
  }

  // free-to-watch
  return (
    <Tabs value={freeValue} onValueChange={handleFreeChange} className="w-full">
      <Header>
        <SwitchPills
          value={freeValue}
          onValueChange={handleFreeChange}
          options={[
            { value: 'movies', label: 'Movies' },
            { value: 'tv', label: 'TV' },
          ]}
          compactOnTwo
        />
      </Header>

      <TabsContent value="movies">
        <DiscoverCarousel
          mediaType="movie"
          params={{ with_watch_monetization_types: 'free' }}
        />
      </TabsContent>
      <TabsContent value="tv">
        {/* Accept "tvs" for app routing, call API with "tv" */}
        <DiscoverCarousel
          mediaType="tvs"
          params={{ with_watch_monetization_types: 'free' }}
        />
      </TabsContent>
    </Tabs>
  );
}
