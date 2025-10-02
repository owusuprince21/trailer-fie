// // lib/tmdbWatch.ts


// const TMDB_BASE = 'https://api.themoviedb.org/3';


// type Provider = {
//   provider_id: number;
//   provider_name: string;
//   logo_path: string | null;
// };

// export type ProviderBlock = {
//   link?: string;
//   flatrate?: Provider[];
//   rent?: Provider[];
//   buy?: Provider[];
//   free?: Provider[];
//   ads?: Provider[];
// };

// type AuthParts = { headers: Record<string, string>; query: string };

// function getAuthParts(): AuthParts {
//   const v4 = process.env.TMDB_V4_BEARER;
//   const v3 = process.env.TMDB_V3_KEY ?? process.env.TMDB_API_KEY;

//   const headers: Record<string, string> = { Accept: 'application/json' };
//   let query = '';

//   if (v4) {
//     headers['Authorization'] = `Bearer ${v4}`;
//   } else if (v3) {
//     query = `?api_key=${encodeURIComponent(v3)}`;
//   } else {
//     throw new Error(
//       'Missing TMDB credentials. Add TMDB_V4_BEARER (recommended) or TMDB_V3_KEY/TMDB_API_KEY to .env.local'
//     );
//   }

//   return { headers, query };
// }

// export async function fetchWatchProviders(movieId: number, region = 'GH') {
//   const { headers, query } = getAuthParts();
//   const url = `${TMDB_BASE}/movie/${movieId}/watch/providers${query}`;

//   const res = await fetch(url, {
//     headers,              // <-- now definitely Record<string,string>
//     cache: 'no-store',
//   });

//   if (!res.ok) {
//     try {
//       const err = await res.json();
//       console.error('TMDB error:', err);
//     } catch {}
//     throw new Error(`Failed to fetch providers (HTTP ${res.status})`);
//   }

//   const data = await res.json();
//   return (data?.results?.[region] ?? null) as ProviderBlock | null;
// }

// export function tmdbImg(path?: string | null, size: 'w45' | 'w92' = 'w92') {
//   return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
// }
