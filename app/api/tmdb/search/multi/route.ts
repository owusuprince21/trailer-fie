import { NextRequest, NextResponse } from 'next/server';

const TMDB = 'https://api.themoviedb.org/3';
const BEARER = process.env.TMDB_BEARER || process.env.NEXT_PUBLIC_TMDB_BEARER;
const API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // Accept both ?query= and ?q=
  const query = (sp.get('query') ?? sp.get('q') ?? '').trim();
  const page = sp.get('page') ?? '1';
  const include_adult = sp.get('include_adult') ?? 'false';
  const language = sp.get('language') ?? 'en-US';

  if (!query) {
    return NextResponse.json({
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    });
  }

  try {
    const qs = new URLSearchParams({
      query,
      page,
      include_adult,
      language,
    });

    // Prefer v4 Bearer (more reliable); fallback to v3 api_key if provided
    const url =
      `${TMDB}/search/multi?${qs.toString()}` +
      (BEARER ? '' : API_KEY ? `&api_key=${API_KEY}` : '');

    const res = await fetch(url, {
      headers: BEARER ? { Authorization: `Bearer ${BEARER}` } : undefined,
      cache: 'no-store', // avoid stale “no results”
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ error: text || res.statusText }, { status: res.status });
    }

    const data = await res.json();
    // TMDB returns { page, results, total_pages, total_results }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
