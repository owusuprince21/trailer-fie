// lib/swr.ts
import useSWR, { SWRConfiguration } from 'swr';
import { tmdbApi } from './tmdb';

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

/* ----------------------------------------
   SWR utils
----------------------------------------- */

const SWR_OPTS: SWRConfiguration = {
  revalidateOnFocus: false,
  keepPreviousData: true,
};

async function jsonFetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url);
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

function buildKey(base: string, parts?: unknown[]) {
  return parts ? [base, ...parts] : [base];
}

function buildQuery(params: Record<string, string | number | boolean | undefined> = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/* ----------------------------------------
   Home feeds & discovery (tmdbApi direct)
----------------------------------------- */

export const useTrending = (mediaType: 'movie' | 'tv', timeWindow: 'day' | 'week') =>
  useSWR(buildKey('trending', [mediaType, timeWindow]), () =>
    tmdbApi.getTrending(mediaType, timeWindow),
    SWR_OPTS
  );

export const usePopular = (mediaType: 'movie' | 'tv') =>
  useSWR(buildKey('popular', [mediaType]), () => tmdbApi.getPopular(mediaType), SWR_OPTS);

export const useTopRated = (mediaType: 'movie' | 'tv') =>
  useSWR(buildKey('top-rated', [mediaType]), () => tmdbApi.getTopRated(mediaType), SWR_OPTS);

export const useNowPlaying = () =>
  useSWR(buildKey('now-playing'), () => tmdbApi.getNowPlaying(), SWR_OPTS);

export const useUpcoming = () =>
  useSWR(buildKey('upcoming'), () => tmdbApi.getUpcoming(), SWR_OPTS);

export const useAiringToday = () =>
  useSWR(buildKey('airing-today'), () => tmdbApi.getAiringToday(), SWR_OPTS);

export const useOnTheAir = () =>
  useSWR(buildKey('on-the-air'), () => tmdbApi.getOnTheAir(), SWR_OPTS);

export const useDiscover = (
  mediaType: 'movie' | 'tv',
  params: Record<string, string | number | boolean> = {}
) => {
  const normalized: Record<string, string> = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  );
  const key = buildKey('discover', [mediaType, JSON.stringify(normalized)]);
  return useSWR(key, () => tmdbApi.discover(mediaType, normalized), SWR_OPTS);
};

/* ----------------------------------------
   Movie / TV details (tmdbApi direct)
----------------------------------------- */

export const useMovieDetails = (id: number) =>
  useSWR(id ? buildKey('movie', [id]) : null, () => tmdbApi.getMovieDetails(id), SWR_OPTS);

export const useTVDetails = (id: number) =>
  useSWR(id ? buildKey('tv', [id]) : null, () => tmdbApi.getTVDetails(id), SWR_OPTS);

export const useMovieCredits = (id: number) =>
  useSWR(id ? buildKey('movie-credits', [id]) : null, () => tmdbApi.getMovieCredits(id), SWR_OPTS);

export const useTVCredits = (id: number) =>
  useSWR(id ? buildKey('tv-credits', [id]) : null, () => tmdbApi.getTVCredits(id), SWR_OPTS);

export const useMovieVideos = (id: number) =>
  useSWR(id ? buildKey('movie-videos', [id]) : null, () => tmdbApi.getMovieVideos(id), SWR_OPTS);

export const useTVVideos = (id: number) =>
  useSWR(id ? buildKey('tv-videos', [id]) : null, () => tmdbApi.getTVVideos(id), SWR_OPTS);

export const useMovieRecommendations = (id: number) =>
  useSWR(
    id ? buildKey('movie-recommendations', [id]) : null,
    () => tmdbApi.getMovieRecommendations(id),
    SWR_OPTS
  );

export const useTVRecommendations = (id: number) =>
  useSWR(
    id ? buildKey('tv-recommendations', [id]) : null,
    () => tmdbApi.getTVRecommendations(id),
    SWR_OPTS
  );

/* ----------------------------------------
   People (tmdbApi + API routes)
----------------------------------------- */

export const usePopularPeople = () =>
  useSWR(buildKey('popular-people'), () => tmdbApi.getPopularPeople(), SWR_OPTS);

export const usePersonDetails = (id: number) =>
  useSWR<PersonDetails>(id ? `/api/tmdb/person/${id}` : null, jsonFetcher, SWR_OPTS);

export const usePersonCombinedCredits = (id: number) =>
  useSWR<CombinedCredits>(
    id ? `/api/tmdb/person/${id}/combined_credits` : null,
    jsonFetcher,
    SWR_OPTS
  );

export const usePersonExternalIds = (id: number) =>
  useSWR<ExternalIds>(id ? `/api/tmdb/person/${id}/external_ids` : null, jsonFetcher, SWR_OPTS);

/* ----------------------------------------
   Search (single API route: /api/tmdb/search/multi)
----------------------------------------- */

export const useSearchMulti = (query: string) => {
  const q = query?.trim();
  return useSWR<SearchMultiResponse>(
    q ? `/api/tmdb/search/multi${buildQuery({ query: q })}` : null,
    jsonFetcher,
    SWR_OPTS
  );
};

/* Optional shims: keep category hooks by filtering /multi */
export const useSearchMovies = (query: string) => {
  const q = query?.trim();
  return useSWR<SearchMultiResponse>(
    q ? ['search-movies', q] : null,
    async () => {
      const data = await jsonFetcher<SearchMultiResponse>(
        `/api/tmdb/search/multi?query=${encodeURIComponent(q!)}`
      );
      const results = (data?.results ?? []).filter((r) => r.media_type === 'movie');
      return { ...data, results, total_results: results.length };
    },
    SWR_OPTS
  );
};

export const useSearchTV = (query: string) => {
  const q = query?.trim();
  return useSWR<SearchMultiResponse>(
    q ? ['search-tv', q] : null,
    async () => {
      const data = await jsonFetcher<SearchMultiResponse>(
        `/api/tmdb/search/multi?query=${encodeURIComponent(q!)}`
      );
      const results = (data?.results ?? []).filter((r) => r.media_type === 'tv');
      return { ...data, results, total_results: results.length };
    },
    SWR_OPTS
  );
};

export const useSearchPeople = (query: string) => {
  const q = query?.trim();
  return useSWR<SearchMultiResponse>(
    q ? ['search-people', q] : null,
    async () => {
      const data = await jsonFetcher<SearchMultiResponse>(
        `/api/tmdb/search/multi?query=${encodeURIComponent(q!)}`
      );
      const results = (data?.results ?? []).filter((r) => r.media_type === 'person');
      return { ...data, results, total_results: results.length };
    },
    SWR_OPTS
  );
};
