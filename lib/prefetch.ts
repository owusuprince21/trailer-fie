// lib/prefetch.ts
import { mutate } from 'swr';
import { tmdbApi } from '@/lib/tmdb';

// SWR keys must match the ones used in lib/swr.ts

export async function prefetchMovie(id: number) {
  await Promise.all([
    mutate(['movie', id], tmdbApi.getMovieDetails(id), { populateCache: true, revalidate: false }),
    mutate(['movie-credits', id], tmdbApi.getMovieCredits(id), { populateCache: true, revalidate: false }),
    mutate(['movie-videos', id], tmdbApi.getMovieVideos(id), { populateCache: true, revalidate: false }),
    mutate(['movie-recommendations', id], tmdbApi.getMovieRecommendations(id), { populateCache: true, revalidate: false }),
  ]);
}

export async function prefetchTV(id: number) {
  await Promise.all([
    mutate(['tv', id], tmdbApi.getTVDetails(id), { populateCache: true, revalidate: false }),
    mutate(['tv-credits', id], tmdbApi.getTVCredits(id), { populateCache: true, revalidate: false }),
    mutate(['tv-videos', id], tmdbApi.getTVVideos(id), { populateCache: true, revalidate: false }),
    mutate(['tv-recommendations', id], tmdbApi.getTVRecommendations(id), { populateCache: true, revalidate: false }),
  ]);
}

export async function prefetchPerson(id: number) {
  // person endpoints are via your /api routes in lib/swr.ts
  await Promise.all([
    mutate(`/api/tmdb/person/${id}`, fetch(`/api/tmdb/person/${id}`).then(r => r.json()), {
      populateCache: true, revalidate: false,
    }),
    mutate(`/api/tmdb/person/${id}/combined_credits`, fetch(`/api/tmdb/person/${id}/combined_credits`).then(r => r.json()), {
      populateCache: true, revalidate: false,
    }),
    mutate(`/api/tmdb/person/${id}/external_ids`, fetch(`/api/tmdb/person/${id}/external_ids`).then(r => r.json()), {
      populateCache: true, revalidate: false,
    }),
  ]);
}
