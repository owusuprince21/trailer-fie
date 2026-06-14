import { NextResponse } from 'next/server';
import { isoWithoutMs, normalizeEvent, TicketmasterEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      source: 'ticketmaster',
      message: 'Add TICKETMASTER_API_KEY to enable live movie theatre events.',
      events: [],
      page: { number: 0, size: 0, totalElements: 0, totalPages: 0 },
    });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const sixMonths = new Date(now);
  sixMonths.setMonth(sixMonths.getMonth() + 6);

  const params = new URLSearchParams({
    apikey: apiKey,
    classificationName: 'Film',
    sort: 'date,asc',
    includeTBA: 'no',
    includeTBD: 'no',
    size: searchParams.get('size') || '24',
    page: searchParams.get('page') || '0',
    startDateTime: searchParams.get('startDateTime') || isoWithoutMs(now),
    endDateTime: searchParams.get('endDateTime') || isoWithoutMs(sixMonths),
  });

  const keyword = searchParams.get('keyword')?.trim();
  const city = searchParams.get('city')?.trim();
  const countryCode = searchParams.get('countryCode')?.trim().toUpperCase() || 'US';
  const stateCode = searchParams.get('stateCode')?.trim().toUpperCase();
  const postalCode = searchParams.get('postalCode')?.trim();

  if (keyword) params.set('keyword', keyword);
  if (city) params.set('city', city);
  if (countryCode) params.set('countryCode', countryCode);
  if (stateCode) params.set('stateCode', stateCode);
  if (postalCode) params.set('postalCode', postalCode);

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

  try {
    const response = await fetch(url, { next: { revalidate: 900 } });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          configured: true,
          source: 'ticketmaster',
          message: data?.fault?.faultstring || data?.message || 'Unable to load events.',
          events: [],
          page: { number: 0, size: 0, totalElements: 0, totalPages: 0 },
        },
        { status: response.status }
      );
    }

    const events = ((data?._embedded?.events ?? []) as TicketmasterEvent[]).map(normalizeEvent);

    return NextResponse.json({
      configured: true,
      source: 'ticketmaster',
      events,
      page: data?.page ?? { number: 0, size: events.length, totalElements: events.length, totalPages: 1 },
    });
  } catch {
    return NextResponse.json(
      {
        configured: true,
        source: 'ticketmaster',
        message: 'Unable to reach the events provider.',
        events: [],
        page: { number: 0, size: 0, totalElements: 0, totalPages: 0 },
      },
      { status: 502 }
    );
  }
}
