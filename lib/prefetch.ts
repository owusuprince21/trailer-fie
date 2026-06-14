import type { QueryClient } from '@tanstack/react-query';
import { jsonFetcher, queryKeys, QUERY_GC_TIME, QUERY_STALE_TIME } from '@/lib/swr';
import { tmdbApi } from '@/lib/tmdb';

const PREFETCH_OPTS = {
  staleTime: QUERY_STALE_TIME,
  gcTime: QUERY_GC_TIME,
};

export async function prefetchMovie(queryClient: QueryClient, id: number) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.movie(id),
      queryFn: () => tmdbApi.getMovieDetails(id),
      ...PREFETCH_OPTS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.movieCredits(id),
      queryFn: () => tmdbApi.getMovieCredits(id),
      ...PREFETCH_OPTS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.movieVideos(id),
      queryFn: () => tmdbApi.getMovieVideos(id),
      ...PREFETCH_OPTS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.movieImages(id),
      queryFn: () => tmdbApi.getMovieImages(id),
      ...PREFETCH_OPTS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.movieRecommendations(id),
      queryFn: () => tmdbApi.getMovieRecommendations(id),
      ...PREFETCH_OPTS,
    }),
  ]);
}

export async function prefetchTV(queryClient: QueryClient, id: number) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.tv(id),
      queryFn: () => tmdbApi.getTVDetails(id),
      ...PREFETCH_OPTS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.tvCredits(id),
      queryFn: () => tmdbApi.getTVCredits(id),
      ...PREFETCH_OPTS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.tvVideos(id),
      queryFn: () => tmdbApi.getTVVideos(id),
      ...PREFETCH_OPTS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.tvImages(id),
      queryFn: () => tmdbApi.getTVImages(id),
      ...PREFETCH_OPTS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.tvRecommendations(id),
      queryFn: () => tmdbApi.getTVRecommendations(id),
      ...PREFETCH_OPTS,
    }),
  ]);
}

export async function prefetchPerson(queryClient: QueryClient, id: number) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.personDetails(id),
      queryFn: () => jsonFetcher(`/api/tmdb/person/${id}`),
      ...PREFETCH_OPTS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.personCombinedCredits(id),
      queryFn: () => jsonFetcher(`/api/tmdb/person/${id}/combined_credits`),
      ...PREFETCH_OPTS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.personExternalIds(id),
      queryFn: () => jsonFetcher(`/api/tmdb/person/${id}/external_ids`),
      ...PREFETCH_OPTS,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.personSummary(id),
      queryFn: () => jsonFetcher(`/api/tmdb/person/${id}/summary`),
      ...PREFETCH_OPTS,
    }),
  ]);
}

export async function prefetchAward(queryClient: QueryClient, slug: string) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.awardDetails(slug),
    queryFn: () => jsonFetcher(`/api/awards/${slug}`),
    ...PREFETCH_OPTS,
  });
}

export async function prefetchEvent(queryClient: QueryClient, id: string) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.eventDetails(id),
    queryFn: () => jsonFetcher(`/api/events/${id}`),
    ...PREFETCH_OPTS,
  });
}
