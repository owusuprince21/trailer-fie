import { NextResponse } from 'next/server';
import { getAwards } from '@/lib/awards';

export const dynamic = 'force-dynamic';

export async function GET() {
  const awards = await getAwards();
  return NextResponse.json({ results: awards });
}
