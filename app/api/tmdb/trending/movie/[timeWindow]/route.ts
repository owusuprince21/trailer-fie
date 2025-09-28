import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { timeWindow: string } }
) {
  const { timeWindow } = params;

  if (!['day', 'week'].includes(timeWindow)) {
    return NextResponse.json({ error: 'Invalid time window' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${process.env.TMDB_API_KEY}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from TMDB');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('TMDB API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// ✅ Required for dynamic routes in static export
export function generateStaticParams() {
  return [
    { timeWindow: 'day' },
    { timeWindow: 'week' },
  ];
}
