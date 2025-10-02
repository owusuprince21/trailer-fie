import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasV4: Boolean(process.env.TMDB_V4_BEARER),
    hasV3: Boolean(process.env.TMDB_V3_KEY || process.env.TMDB_API_KEY),
    cwd: process.cwd(),
  });
}
