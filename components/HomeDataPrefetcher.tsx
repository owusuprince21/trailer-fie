'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { buildQuery, jsonFetcher, queryKeys, QUERY_GC_TIME, QUERY_STALE_TIME } from '@/lib/swr';
import { tmdbApi } from '@/lib/tmdb';
import { prefetchAward, prefetchEvent, prefetchMovie, prefetchTV } from '@/lib/prefetch';

const PREFETCH_OPTS = {
  staleTime: QUERY_STALE_TIME,
  gcTime: QUERY_GC_TIME,
};

function runWhenIdle(callback: () => void) {
  if (typeof window === 'undefined') return;
  const idle = window.requestIdleCallback as undefined | ((cb: () => void, opts?: { timeout?: number }) => number);
  if (idle) {
    idle(callback, { timeout: 2500 });
    return;
  }
  window.setTimeout(callback, 600);
}

export default function HomeDataPrefetcher() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    runWhenIdle(() => {
      if (cancelled) return;

      ['/awards', '/events', '/people', '/movies/popular', '/tv/popular'].forEach((href) => {
        router.prefetch(href);
      });

      const discoverMovie = (params: Record<string, string>) =>
        queryClient.prefetchQuery({
          queryKey: queryKeys.discover('movie', params),
          queryFn: () => tmdbApi.discover('movie', params),
          ...PREFETCH_OPTS,
        });

      const discoverTV = (params: Record<string, string>) =>
        queryClient.prefetchQuery({
          queryKey: queryKeys.discover('tv', params),
          queryFn: () => tmdbApi.discover('tv', params),
          ...PREFETCH_OPTS,
        });

      const warmHome = async () => {
        const [
          trendingDay,
          trendingWeek,
          popularMovies,
          popularTV,
          awards,
          events,
        ] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: queryKeys.trending('movie', 'day'),
            queryFn: () => tmdbApi.getTrending('movie', 'day'),
            ...PREFETCH_OPTS,
          }),
          queryClient.fetchQuery({
            queryKey: queryKeys.trending('movie', 'week'),
            queryFn: () => tmdbApi.getTrending('movie', 'week'),
            ...PREFETCH_OPTS,
          }),
          queryClient.fetchQuery({
            queryKey: queryKeys.popular('movie'),
            queryFn: () => tmdbApi.getPopular('movie'),
            ...PREFETCH_OPTS,
          }),
          queryClient.fetchQuery({
            queryKey: queryKeys.popular('tv'),
            queryFn: () => tmdbApi.getPopular('tv'),
            ...PREFETCH_OPTS,
          }),
          queryClient.fetchQuery({
            queryKey: queryKeys.awards(),
            queryFn: () => jsonFetcher('/api/awards'),
            ...PREFETCH_OPTS,
          }),
          queryClient.fetchQuery({
            queryKey: queryKeys.events({ page: 0, size: 24, countryCode: 'US' }),
            queryFn: () => jsonFetcher(`/api/events${buildQuery({ page: 0, size: 24, countryCode: 'US' })}`),
            ...PREFETCH_OPTS,
          }),
        ]);

        await Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: queryKeys.nowPlaying(),
            queryFn: () => tmdbApi.getNowPlaying(),
            ...PREFETCH_OPTS,
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.upcoming(),
            queryFn: () => tmdbApi.getUpcoming(),
            ...PREFETCH_OPTS,
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.topRated('movie'),
            queryFn: () => tmdbApi.getTopRated('movie'),
            ...PREFETCH_OPTS,
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.airingToday(),
            queryFn: () => tmdbApi.getAiringToday(),
            ...PREFETCH_OPTS,
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.onTheAir(),
            queryFn: () => tmdbApi.getOnTheAir(),
            ...PREFETCH_OPTS,
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.topRated('tv'),
            queryFn: () => tmdbApi.getTopRated('tv'),
            ...PREFETCH_OPTS,
          }),
          discoverMovie({ with_watch_monetization_types: 'flatrate' }),
          discoverMovie({ with_watch_monetization_types: 'rent' }),
          discoverMovie({ with_watch_monetization_types: 'free' }),
          discoverMovie({ with_watch_monetization_types: 'flatrate', sort_by: 'popularity.desc' }),
          discoverMovie({ with_watch_monetization_types: 'rent', sort_by: 'popularity.desc' }),
          discoverMovie({ with_release_type: '3', sort_by: 'popularity.desc' }),
          discoverTV({ with_watch_monetization_types: 'free' }),
        ]);

        const movieIds = [
          ...(trendingDay?.results ?? []),
          ...(trendingWeek?.results ?? []),
          ...(popularMovies?.results ?? []),
        ]
          .map((item: any) => item?.id)
          .filter(Boolean)
          .slice(0, 10);

        const tvIds = (popularTV?.results ?? [])
          .map((item: any) => item?.id)
          .filter(Boolean)
          .slice(0, 6);

        await Promise.allSettled([
          ...movieIds.map((id: number) => prefetchMovie(queryClient, id)),
          ...tvIds.map((id: number) => prefetchTV(queryClient, id)),
          ...((awards as any)?.results ?? []).slice(0, 8).map((award: any) => prefetchAward(queryClient, award.slug)),
          ...((events as any)?.events ?? []).slice(0, 8).map((event: any) => prefetchEvent(queryClient, event.id)),
        ]);
      };

      warmHome().catch(() => {
        // Cache warmup should never block the page.
      });
    });

    return () => {
      cancelled = true;
    };
  }, [queryClient, router]);

  return null;
}
