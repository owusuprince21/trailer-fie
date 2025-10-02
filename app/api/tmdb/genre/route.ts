// app/api/tmdb/genres/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[api] /api/tmdb/genres hit'); // shows in server logs
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Missing TMDB_API_KEY' }, { status: 500 });
  }

  const r = await fetch(
    `https://api.themoviedb.org/3/genre/movie/list?api_key=${key}&language=en-US`,
    { cache: 'no-store' }
  );

  if (!r.ok) {
    return NextResponse.json({ error: 'TMDB fetch failed' }, { status: r.status });
  }

  const data = await r.json();
  return NextResponse.json(data);
}
