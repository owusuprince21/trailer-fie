// app/api/tmdb/discover/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const genre = searchParams.get('genre') || '';
  const page = searchParams.get('page') || '1';

  const API_KEY = process.env.TMDB_API_KEY; // server-side only
  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing TMDB_API_KEY' }, { status: 500 });
  }

  const tmdbUrl =
    `https://api.themoviedb.org/3/discover/movie` +
    `?include_adult=false&include_video=false&language=en-US` +
    `&sort_by=popularity.desc&with_genres=${encodeURIComponent(genre)}` +
    `&page=${encodeURIComponent(page)}&api_key=${API_KEY}`;

  const r = await fetch(tmdbUrl, { next: { revalidate: 60 } }); // cache 60s
  if (!r.ok) {
    const text = await r.text();
    return NextResponse.json({ error: 'TMDB error', detail: text }, { status: r.status });
  }

  const data = await r.json();
  return NextResponse.json(data);
}
