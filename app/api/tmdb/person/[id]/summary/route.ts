import { NextRequest, NextResponse } from 'next/server';

function decodeBasicEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function toPlainText(html: string) {
  return decodeBasicEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function parseNumber(value?: string | null) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value.replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const response = await fetch(`https://www.themoviedb.org/person/${id}`, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (compatible; TrailerFie/1.0)',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch person summary from TMDB');
    }

    const text = toPlainText(await response.text());
    const knownCredits = parseNumber(text.match(/Known Credits\s+([\d,]+)/i)?.[1]);
    const contentScore = parseNumber(text.match(/Content Score\s+(\d{1,3})/i)?.[1]);
    const wins = parseNumber(text.match(/(\d+)\s+Wins?/i)?.[1]);
    const nominations = parseNumber(text.match(/(\d+)\s+Nominations?/i)?.[1]);

    return NextResponse.json({
      knownCredits,
      contentScore,
      awards: { wins, nominations },
    });
  } catch (error) {
    console.error('TMDB Person Summary Error:', error);
    return NextResponse.json({
      knownCredits: undefined,
      contentScore: undefined,
      awards: { wins: undefined, nominations: undefined },
    });
  }
}
