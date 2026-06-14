// lib/swr.ts

import { QueryKey, useQuery } from '@tanstack/react-query';
import { tmdbApi } from './tmdb';
import type { MovieEvent } from './events';

/* ----------------------------------------
   Shared types (export so pages can import)
----------------------------------------- */

export type MultiResult =
  | {
      media_type: 'movie';
      id: number;
      title?: string;
      release_date?: string;
      poster_path?: string | null;
      overview?: string;
    }
  | {
      media_type: 'tv';
      id: number;
      name?: string;
      first_air_date?: string;
      poster_path?: string | null;
      overview?: string;
    }
  | {
      media_type: 'person';
      id: number;
      name?: string;
      profile_path?: string | null;
      known_for_department?: string;
    }

| {
      media_type: 'collection';
      id: number;
      name?: string;
      profile_path?: string | null;
      known_for_department?: string;
    }
  | {
      media_type: 'company';
      id: number;
      name?: string;
      profile_path?: string | null;
      known_for_department?: string;
    }
  | {
      media_type: 'keyword';
      id: number;
      name?: string;
      profile_path?: string | null;
      known_for_department?: string;
    }
  | {
      media_type: 'network';
      id: number;
      name?: string;
      profile_path?: string | null;
      known_for_department?: string;
    }
  | {
      media_type: 'award';
      id: number;
      name?: string;
      profile_path?: string | null;
      known_for_department?: string;
    };

export interface SearchMultiResponse {
  page: number;
  results: MultiResult[];
  total_pages: number;
  total_results: number;
}

export interface PersonDetails {
  id: number;
  name: string;
  profile_path?: string | null;
  homepage?: string | null;
  biography?: string;
  known_for_department?: string;
  birthday?: string;
  deathday?: string | null;
  place_of_birth?: string;
  also_known_as?: string[];
  gender?: number;
}

export interface CombinedCredits {
  cast: Array<{
    id: number;
    media_type: 'movie' | 'tv';
    title?: string;
    name?: string;
    character?: string;
    poster_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_count?: number;
    popularity?: number;
  }>;
  crew: Array<{
    id: number;
    media_type: 'movie' | 'tv';
    title?: string;
    name?: string;
    job?: string;
    department?: string;
    poster_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_count?: number;
    popularity?: number;
  }>;
}

export interface ExternalIds {
  imdb_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
}

export interface PersonSummary {
  knownCredits?: number;
  contentScore?: number;
  awards?: {
    wins?: number;
    nominations?: number;
  };
}

export interface AwardSummary {
  id: string;
  slug: string;
  name: string;
  date?: string;
  imageUrl?: string;
  tmdbUrl: string;
}

export interface AwardDetails extends AwardSummary {
  description?: string;
  logoUrl?: string;
  backdropUrl?: string;
  ceremonies: Array<{
    id: string;
    name: string;
    year?: string;
    tmdbUrl: string;
  }>;
  categories: Array<{
    slug: string;
    name: string;
    tmdbUrl: string;
  }>;
  mostAwardedMovies: AwardHighlight[];
  mostAwardedPeople: AwardHighlight[];
  mostNominatedMovies: AwardHighlight[];
  mostNominatedPeople: AwardHighlight[];
}

export interface AwardHighlight {
  id: string;
  mediaType: 'movie' | 'tv' | 'person';
  name: string;
  imageUrl?: string;
  nominations?: string;
  wins?: string;
  href: string;
}

export interface EventsResponse {
  configured: boolean;
  source: string;
  message?: string;
  events: MovieEvent[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface EventDetailsResponse {
  configured: boolean;
  source: string;
  message?: string;
  event: MovieEvent | null;
}

/* ----------------------------------------
   SWR utils
----------------------------------------- */

export const QUERY_STALE_TIME = 1000 * 60 * 30;
export const QUERY_GC_TIME = 1000 * 60 * 60 * 4;

export const queryKeys = {
  trending: (mediaType: 'movie' | 'tv', timeWindow: 'day' | 'week') =>
    ['trending', mediaType, timeWindow] as const,
  popular: (mediaType: 'movie' | 'tv') => ['popular', mediaType] as const,
  topRated: (mediaType: 'movie' | 'tv') => ['top-rated', mediaType] as const,
  nowPlaying: () => ['now-playing'] as const,
  upcoming: () => ['upcoming'] as const,
  airingToday: () => ['airing-today'] as const,
  onTheAir: () => ['on-the-air'] as const,
  discover: (mediaType: 'movie' | 'tv', normalized: Record<string, string>) =>
    ['discover', mediaType, JSON.stringify(normalized)] as const,
  movie: (id: number) => ['movie', id] as const,
  tv: (id: number) => ['tv', id] as const,
  movieCredits: (id: number) => ['movie-credits', id] as const,
  tvCredits: (id: number) => ['tv-credits', id] as const,
  movieVideos: (id: number) => ['movie-videos', id] as const,
  tvVideos: (id: number) => ['tv-videos', id] as const,
  movieImages: (id: number) => ['movie-images', id] as const,
  tvImages: (id: number) => ['tv-images', id] as const,
  movieRecommendations: (id: number) => ['movie-recommendations', id] as const,
  tvRecommendations: (id: number) => ['tv-recommendations', id] as const,
  popularPeople: () => ['popular-people'] as const,
  personDetails: (id: number) => ['api', `/api/tmdb/person/${id}`] as const,
  personCombinedCredits: (id: number) => ['api', `/api/tmdb/person/${id}/combined_credits`] as const,
  personExternalIds: (id: number) => ['api', `/api/tmdb/person/${id}/external_ids`] as const,
  personSummary: (id: number) => ['api', `/api/tmdb/person/${id}/summary`] as const,
  awards: () => ['api', '/api/awards'] as const,
  awardDetails: (slug: string) => ['api', `/api/awards/${slug}`] as const,
  searchMulti: (query: string) => ['api', `/api/tmdb/search/multi${buildQuery({ query })}`] as const,
  events: (params: Record<string, string | number | boolean | undefined> = {}) =>
    ['api', `/api/events${buildQuery(params)}`] as const,
  eventDetails: (id: string) => ['api', `/api/events/${id}`] as const,
};

export async function jsonFetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      detail = (data?.status_message as string) || (data?.message as string) || '';
    } catch { /* ignore */ }
    throw new Error(`Request failed ${res.status}: ${detail || res.statusText}`);
  }
  return res.json();
}

export function buildQuery(params: Record<string, string | number | boolean | undefined> = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function useCachedQuery<T>(
  queryKey: QueryKey | null,
  queryFn: () => Promise<T>,
  enabled = true
) {
  return useQuery({
    queryKey: queryKey ?? ['disabled-query'],
    queryFn,
    enabled: Boolean(queryKey) && enabled,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/* ----------------------------------------
   Home feeds & discovery (tmdbApi direct)
----------------------------------------- */

export const useTrending = (mediaType: 'movie' | 'tv', timeWindow: 'day' | 'week') =>
  useCachedQuery(queryKeys.trending(mediaType, timeWindow), () =>
    tmdbApi.getTrending(mediaType, timeWindow)
  );

export const usePopular = (mediaType: 'movie' | 'tv') =>
  useCachedQuery(queryKeys.popular(mediaType), () => tmdbApi.getPopular(mediaType));

export const useTopRated = (mediaType: 'movie' | 'tv') =>
  useCachedQuery(queryKeys.topRated(mediaType), () => tmdbApi.getTopRated(mediaType));

export const useNowPlaying = () =>
  useCachedQuery(queryKeys.nowPlaying(), () => tmdbApi.getNowPlaying());

export const useUpcoming = () =>
  useCachedQuery(queryKeys.upcoming(), () => tmdbApi.getUpcoming());

export const useAiringToday = () =>
  useCachedQuery(queryKeys.airingToday(), () => tmdbApi.getAiringToday());

export const useOnTheAir = () =>
  useCachedQuery(queryKeys.onTheAir(), () => tmdbApi.getOnTheAir());

export const useDiscover = (
  mediaType: 'movie' | 'tv',
  params: Record<string, string | number | boolean> = {}
) => {
  const normalized: Record<string, string> = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  );
  return useCachedQuery(queryKeys.discover(mediaType, normalized), () =>
    tmdbApi.discover(mediaType, normalized)
  );
};

/* ----------------------------------------
   Movie / TV details (tmdbApi direct)
----------------------------------------- */

export const useMovieDetails = (id: number) =>
  useCachedQuery(id ? queryKeys.movie(id) : null, () => tmdbApi.getMovieDetails(id));

export const useTVDetails = (id: number) =>
  useCachedQuery(id ? queryKeys.tv(id) : null, () => tmdbApi.getTVDetails(id));

export const useMovieCredits = (id: number) =>
  useCachedQuery(id ? queryKeys.movieCredits(id) : null, () => tmdbApi.getMovieCredits(id));

export const useTVCredits = (id: number) =>
  useCachedQuery(id ? queryKeys.tvCredits(id) : null, () => tmdbApi.getTVCredits(id));

export const useMovieVideos = (id: number) =>
  useCachedQuery(id ? queryKeys.movieVideos(id) : null, () => tmdbApi.getMovieVideos(id));

export const useMovieImages = (id: number) =>
  useCachedQuery(id ? queryKeys.movieImages(id) : null, () => tmdbApi.getMovieImages(id));

export const useTVImages = (id: number) =>
  useCachedQuery(id ? queryKeys.tvImages(id) : null, () => tmdbApi.getTVImages(id));

export const useTVVideos = (id: number) =>
  useCachedQuery(id ? queryKeys.tvVideos(id) : null, () => tmdbApi.getTVVideos(id));

export const useMovieRecommendations = (id: number) =>
  useCachedQuery(id ? queryKeys.movieRecommendations(id) : null, () =>
    tmdbApi.getMovieRecommendations(id)
  );

export const useTVRecommendations = (id: number) =>
  useCachedQuery(id ? queryKeys.tvRecommendations(id) : null, () =>
    tmdbApi.getTVRecommendations(id)
  );

/* ----------------------------------------
   People (tmdbApi + API routes)
----------------------------------------- */

export const usePopularPeople = () =>
  useCachedQuery(queryKeys.popularPeople(), () => tmdbApi.getPopularPeople());

export const usePersonDetails = (id: number) =>
  useCachedQuery<PersonDetails>(
    id ? queryKeys.personDetails(id) : null,
    () => jsonFetcher(`/api/tmdb/person/${id}`)
  );

export const usePersonCombinedCredits = (id: number) =>
  useCachedQuery<CombinedCredits>(
    id ? queryKeys.personCombinedCredits(id) : null,
    () => jsonFetcher(`/api/tmdb/person/${id}/combined_credits`)
  );

export const usePersonExternalIds = (id: number) =>
  useCachedQuery<ExternalIds>(
    id ? queryKeys.personExternalIds(id) : null,
    () => jsonFetcher(`/api/tmdb/person/${id}/external_ids`)
  );

export const usePersonSummary = (id: number) =>
  useCachedQuery<PersonSummary>(
    id ? queryKeys.personSummary(id) : null,
    () => jsonFetcher(`/api/tmdb/person/${id}/summary`)
  );

/* ----------------------------------------
   Awards (TMDB public awards pages)
----------------------------------------- */

export const useAwards = () =>
  useCachedQuery<{ results: AwardSummary[] }>(queryKeys.awards(), () => jsonFetcher('/api/awards'));

export const useAwardDetails = (slug?: string) =>
  useCachedQuery<AwardDetails>(
    slug ? queryKeys.awardDetails(slug) : null,
    () => jsonFetcher(`/api/awards/${slug}`)
  );

/* ----------------------------------------
   Events (Ticketmaster API routes)
----------------------------------------- */

export const useEvents = (params: Record<string, string | number | boolean | undefined> = {}) =>
  useCachedQuery<EventsResponse>(queryKeys.events(params), () =>
    jsonFetcher(`/api/events${buildQuery(params)}`)
  );

export const useEventDetails = (id?: string) =>
  useCachedQuery<EventDetailsResponse>(
    id ? queryKeys.eventDetails(id) : null,
    () => jsonFetcher(`/api/events/${id}`)
  );

/* ----------------------------------------
   Search (single API route: /api/tmdb/search/multi)
----------------------------------------- */

export const useSearchMulti = (query: string) => {
  const q = query?.trim();
  return useCachedQuery<SearchMultiResponse>(
    q ? queryKeys.searchMulti(q) : null,
    () => jsonFetcher(`/api/tmdb/search/multi${buildQuery({ query: q })}`)
  );
};

/* Optional shims: keep category hooks by filtering /multi */
export const useSearchMovies = (query: string) => {
  const q = query?.trim();
  return useCachedQuery<SearchMultiResponse>(
    q ? ['search-movies', q] : null,
    async () => {
      const data = await jsonFetcher<SearchMultiResponse>(
        `/api/tmdb/search/multi?query=${encodeURIComponent(q!)}`
      );
      const results = (data?.results ?? []).filter((r) => r.media_type === 'movie');
      return { ...data, results, total_results: results.length };
    }
  );
};

export const useSearchTV = (query: string) => {
  const q = query?.trim();
  return useCachedQuery<SearchMultiResponse>(
    q ? ['search-tv', q] : null,
    async () => {
      const data = await jsonFetcher<SearchMultiResponse>(
        `/api/tmdb/search/multi?query=${encodeURIComponent(q!)}`
      );
      const results = (data?.results ?? []).filter((r) => r.media_type === 'tv');
      return { ...data, results, total_results: results.length };
    }
  );
};

export const useSearchPeople = (query: string) => {
  const q = query?.trim();
  return useCachedQuery<SearchMultiResponse>(
    q ? ['search-people', q] : null,
    async () => {
      const data = await jsonFetcher<SearchMultiResponse>(
        `/api/tmdb/search/multi?query=${encodeURIComponent(q!)}`
      );
      const results = (data?.results ?? []).filter((r) => r.media_type === 'person');
      return { ...data, results, total_results: results.length };
    }
  );
};
