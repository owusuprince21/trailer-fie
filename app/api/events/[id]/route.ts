import { NextResponse } from 'next/server';
import { normalizeEvent, TicketmasterEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  const { id } = await params;

  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      source: 'ticketmaster',
      message: 'Add TICKETMASTER_API_KEY to enable live movie theatre event details.',
      event: null,
    });
  }

  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    return NextResponse.json({ message: 'Invalid event id' }, { status: 400 });
  }

  const url = `https://app.ticketmaster.com/discovery/v2/events/${encodeURIComponent(
    id
  )}.json?apikey=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, { next: { revalidate: 900 } });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          configured: true,
          source: 'ticketmaster',
          message: data?.fault?.faultstring || data?.message || 'Unable to load event details.',
          event: null,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      configured: true,
      source: 'ticketmaster',
      event: normalizeEvent(data as TicketmasterEvent),
    });
  } catch {
    return NextResponse.json(
      {
        configured: true,
        source: 'ticketmaster',
        message: 'Unable to reach the events provider.',
        event: null,
      },
      { status: 502 }
    );
  }
}
