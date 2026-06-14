import { NextResponse } from 'next/server';
import { getAwardDetails } from '@/lib/awards';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const award = await getAwardDetails(slug);

  if (!award) {
    return NextResponse.json({ message: 'Award not found' }, { status: 404 });
  }

  return NextResponse.json(award);
}
