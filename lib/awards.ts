export interface AwardSummary {
  id: string;
  slug: string;
  name: string;
  date?: string;
  imageUrl?: string;
  tmdbUrl: string;
}

export interface AwardCeremony {
  id: string;
  name: string;
  year?: string;
  tmdbUrl: string;
}

export interface AwardCategory {
  slug: string;
  name: string;
  tmdbUrl: string;
}

export interface AwardHighlight {
  id: string;
  mediaType: 'movie' | 'tv' | 'person';
  name: string;
  imageUrl?: string;
  nominations?: string;
  wins?: string;
  href: string;
}

export interface AwardDetails extends AwardSummary {
  description?: string;
  logoUrl?: string;
  backdropUrl?: string;
  ceremonies: AwardCeremony[];
  categories: AwardCategory[];
  mostAwardedMovies: AwardHighlight[];
  mostAwardedPeople: AwardHighlight[];
  mostNominatedMovies: AwardHighlight[];
  mostNominatedPeople: AwardHighlight[];
}

const TMDB_WEB_BASE = 'https://www.themoviedb.org';
const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

const FALLBACK_AWARDS: AwardSummary[] = [
  {
    id: '1',
    slug: '1-academy-awards',
    name: 'Academy Awards',
    date: 'March 15, 2026',
    imageUrl: 'https://media.themoviedb.org/t/p/w300_and_h300_face/zaY47UsChcPm1seRNHdNQlQ8FBV.png',
    tmdbUrl: `${TMDB_WEB_BASE}/award/1-academy-awards`,
  },
  {
    id: '4',
    slug: '4-the-golden-globe-awards',
    name: 'Golden Globes',
    date: 'January 11, 2026',
    imageUrl: 'https://media.themoviedb.org/t/p/w300_and_h300_face/wSXqcjQRnLk6utkoKgy1mmZJVmE.png',
    tmdbUrl: `${TMDB_WEB_BASE}/award/4-the-golden-globe-awards`,
  },
  {
    id: '5',
    slug: '5-bafta-film-awards',
    name: 'BAFTA Film Awards',
    date: 'February 22, 2026',
    imageUrl: 'https://media.themoviedb.org/t/p/w300_and_h300_face/sO0rDPrHfCxrYOCwhgitdhWOlln.png',
    tmdbUrl: `${TMDB_WEB_BASE}/award/5-bafta-film-awards`,
  },
  {
    id: '7',
    slug: '7-critics-choice-awards',
    name: 'Critics Choice Awards',
    date: 'January 4, 2026',
    imageUrl: 'https://media.themoviedb.org/t/p/w300_and_h300_face/qjdpuFzE0zFcx4PoMnijPnM6JvL.png',
    tmdbUrl: `${TMDB_WEB_BASE}/award/7-critics-choice-awards`,
  },
  {
    id: '39',
    slug: '39-film-independent-spirit-awards',
    name: 'Film Independent Spirit Awards',
    date: 'February 16, 2026',
    imageUrl: 'https://media.themoviedb.org/t/p/w300_and_h300_face/uAvD6JPERvUaWixq4aVCHUqN9hq.png',
    tmdbUrl: `${TMDB_WEB_BASE}/award/39-film-independent-spirit-awards`,
  },
  {
    id: '82',
    slug: '82-emmy-awards',
    name: 'Emmy Awards',
    date: 'September 14, 2025',
    imageUrl: 'https://media.themoviedb.org/t/p/w300_and_h300_face/A1hubIwnMs0fyLywIuJP6DBJevd.png',
    tmdbUrl: `${TMDB_WEB_BASE}/award/82-emmy-awards`,
  },
  {
    id: '31',
    slug: '31-afi-awards',
    name: 'AFI Awards',
    date: 'December 4, 2025',
    imageUrl: 'https://media.themoviedb.org/t/p/w300_and_h300_face/9i0aV3I5lxijWnILHuLWUP11T7D.png',
    tmdbUrl: `${TMDB_WEB_BASE}/award/31-afi-awards`,
  },
  {
    id: '37',
    slug: '37-national-board-of-review-awards',
    name: 'National Board of Review Awards',
    date: 'December 3, 2025',
    imageUrl: 'https://media.themoviedb.org/t/p/w300_and_h300_face/dzYBG5TdiHMW9U292fQ5Tz4vYuy.png',
    tmdbUrl: `${TMDB_WEB_BASE}/award/37-national-board-of-review-awards`,
  },
  {
    id: '29',
    slug: '29-satellite-awards',
    name: 'Satellite Awards',
    date: 'March 10, 2026',
    imageUrl: 'https://media.themoviedb.org/t/p/w300_and_h300_face/6fnO5MEh48OgRWNZFze7gkDH4pX.png',
    tmdbUrl: `${TMDB_WEB_BASE}/award/29-satellite-awards`,
  },
  {
    id: '79',
    slug: '79-producers-guild-awards',
    name: 'Producers Guild Awards',
    date: 'February 28, 2026',
    imageUrl: 'https://media.themoviedb.org/t/p/w300_and_h300_face/1dgxEDEdgPWnhRAv8R2TqqhaPk.png',
    tmdbUrl: `${TMDB_WEB_BASE}/award/79-producers-guild-awards`,
  },
  {
    id: '33',
    slug: '33-writers-guild-awards',
    name: 'Writers Guild Awards',
    date: 'March 8, 2026',
    imageUrl: 'https://media.themoviedb.org/t/p/w300_and_h300_face/kpkQrbnq42RrsGeWXp7IVDxALeL.png',
    tmdbUrl: `${TMDB_WEB_BASE}/award/33-writers-guild-awards`,
  },
  {
    id: '76',
    slug: '76-sxsw-film-tv-awards',
    name: 'SXSW Film & TV Awards',
    date: 'March 18, 2026',
    tmdbUrl: `${TMDB_WEB_BASE}/award/76-sxsw-film-tv-awards`,
  },
];

function decodeHtml(value = '') {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value = '') {
  return decodeHtml(value.replace(/<[^>]+>/g, ' '));
}

function absoluteTmdbUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${TMDB_WEB_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

async function fetchTmdbWeb(path: string) {
  const response = await fetch(absoluteTmdbUrl(path), {
    headers: REQUEST_HEADERS,
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`TMDB awards request failed: ${response.status}`);
  return response.text();
}

function getAwardId(slug: string) {
  return slug.split('-')[0] || slug;
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseAwardsIndex(html: string): AwardSummary[] {
  const cards = html.split('comp:award-card').slice(1);
  const awards = cards
    .map((card) => {
      const slug = card.match(/href="\/award\/([^"]+)"/)?.[1];
      if (!slug || slug.includes('/')) return null;

      const rawImageUrl = card.match(/<img[^>]+src="([^"]+)"/)?.[1];
      const imageUrl = rawImageUrl?.startsWith('https://media.themoviedb.org/') ? rawImageUrl : undefined;
      const imageAlt = card.match(/<img[^>]+alt="([^"]+)"/)?.[1];
      const heading = card.match(/<h2[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/)?.[1];
      const name = stripTags(heading || '') || decodeHtml(imageAlt || '');
      if (!name) return null;

      return {
        id: getAwardId(slug),
        slug,
        name,
        date: decodeHtml(card.match(/<span class="release_date[^"]*">([\s\S]*?)<\/span>/)?.[1] || ''),
        imageUrl,
        tmdbUrl: `${TMDB_WEB_BASE}/award/${slug}`,
      };
    })
    .filter(Boolean) as AwardSummary[];

  return uniqueBy(awards, (award) => award.slug);
}

function parseMeta(html: string, name: string) {
  const property = html.match(
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  )?.[1];
  if (property) return decodeHtml(property);
  return decodeHtml(
    html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'))?.[1] ||
      ''
  );
}

function parseAwardCategories(html: string, awardSlug: string): AwardCategory[] {
  const matches = Array.from(
    html.matchAll(new RegExp(`href="/award/${awardSlug}/category/([^"]+)"(?:[^>]*)>([\\s\\S]*?)</a>`, 'g'))
  );

  return uniqueBy(
    matches
      .map((match) => {
        const slug = match[1];
        const name = stripTags(match[2]);
        if (!slug || !name || name.length > 80) return null;
        return {
          slug,
          name,
          tmdbUrl: `${TMDB_WEB_BASE}/award/${awardSlug}/category/${slug}`,
        };
      })
      .filter(Boolean) as AwardCategory[],
    (category) => category.slug
  );
}

function parseAwardCeremonies(html: string, awardSlug: string): AwardCeremony[] {
  const matches = Array.from(
    html.matchAll(new RegExp(`href="/award/${awardSlug}/ceremony/(\\d+)"(?:[^>]*)>([\\s\\S]*?)</a>`, 'g'))
  );

  return uniqueBy(
    matches
      .map((match) => {
        const id = match[1];
        const name = stripTags(match[2]);
        if (!id || !name || name.length > 100) return null;
        return {
          id,
          name,
          year: name.match(/\((\d{4})\)/)?.[1],
          tmdbUrl: `${TMDB_WEB_BASE}/award/${awardSlug}/ceremony/${id}`,
        };
      })
      .filter(Boolean) as AwardCeremony[],
    (ceremony) => ceremony.id
  );
}

function sectionHtml(html: string, title: string) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    html.match(new RegExp(`<h4[^>]*>\\s*${escapedTitle}\\s*</h4>([\\s\\S]*?)(?=<h4[^>]*>|<footer|$)`, 'i'))?.[1] ||
    ''
  );
}

function localMediaHref(mediaType: AwardHighlight['mediaType'], id: string) {
  if (mediaType === 'person') return `/person/${id}`;
  if (mediaType === 'tv') return `/tvs/${id}`;
  return `/movie/${id}`;
}

function parseAwardHighlights(html: string, title: string): AwardHighlight[] {
  const content = sectionHtml(html, title);
  const cards = content.split('comp:nomination-summary-card').slice(1);

  return uniqueBy(
    cards
      .map((card) => {
        const href = card.match(/href="\/(movie|tv|person)\/([^"]+)"/)?.[0] || '';
        const mediaMatch = href.match(/href="\/(movie|tv|person)\/([^"-]+)(?:-[^"]*)?"/);
        const mediaType = mediaMatch?.[1] as AwardHighlight['mediaType'] | undefined;
        const id = mediaMatch?.[2];
        if (!mediaType || !id) return null;

        const name =
          decodeHtml(card.match(/<img[^>]+alt="([^"]+)"/)?.[1] || '') ||
          stripTags(card.match(/<h2[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/)?.[1] || '');
        if (!name) return null;

        const imageUrl = card.match(/<img[^>]+src="([^"]+)"/)?.[1];
        const stats = Array.from(card.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)).map((match) =>
          stripTags(match[1])
        );

        return {
          id,
          mediaType,
          name,
          imageUrl,
          nominations: stats.find((stat) => /nomination/i.test(stat)),
          wins: stats.find((stat) => /win|no wins/i.test(stat)),
          href: localMediaHref(mediaType, id),
        };
      })
      .filter(Boolean) as AwardHighlight[],
    (item) => `${item.mediaType}-${item.id}-${item.name}`
  );
}

export async function getAwards(): Promise<AwardSummary[]> {
  try {
    const pages: string[] = [];
    for (let page = 1; page <= 8; page += 1) {
      const html = await fetchTmdbWeb(page === 1 ? '/award' : `/award?page=${page}`);
      const awardsOnPage = parseAwardsIndex(html);
      if (!awardsOnPage.length) break;
      pages.push(html);
      if (!html.includes(`href="?page=${page + 1}"`)) break;
    }

    const awards = uniqueBy(
      pages.flatMap((html) => parseAwardsIndex(html)),
      (award) => award.slug
    );
    return awards.length ? awards : FALLBACK_AWARDS;
  } catch {
    return FALLBACK_AWARDS;
  }
}

export async function getAwardDetails(slug: string): Promise<AwardDetails | null> {
  if (!/^\d+(?:-[a-z0-9]+)*$/i.test(slug)) return null;

  const awards = await getAwards();
  const summary = awards.find((award) => award.slug === slug) || {
    id: getAwardId(slug),
    slug,
    name: slug
      .replace(/^\d+-?/, '')
      .split('-')
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' '),
    tmdbUrl: `${TMDB_WEB_BASE}/award/${slug}`,
  };

  try {
    const [mainHtml, ceremoniesHtml, categoriesHtml] = await Promise.all([
      fetchTmdbWeb(`/award/${slug}`),
      fetchTmdbWeb(`/award/${slug}/ceremonies`).catch(() => ''),
      fetchTmdbWeb(`/award/${slug}/categories`).catch(() => ''),
    ]);

    const ogTitle = parseMeta(mainHtml, 'og:title').replace(/\s*—\s*TMDB$/i, '');
    const title = ogTitle || summary.name;
    const description = parseMeta(mainHtml, 'og:description') || parseMeta(mainHtml, 'description');
    const ogImages = Array.from(mainHtml.matchAll(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/g)).map(
      (match) => match[1]
    );
    const logoUrl =
      mainHtml.match(new RegExp(`<img[^>]+alt="${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]+src="([^"]+)"`))?.[1] ||
      summary.imageUrl;
    const backdropUrl =
      mainHtml.match(/url\(([^)]+awards-preview[^)]+)\)/)?.[1]?.replace(/^['"]|['"]$/g, '') ||
      ogImages.find((image) => image.includes('awards-preview'));
    const imageUrl = summary.imageUrl || ogImages.find((image) => image.includes('/w500/')) || ogImages[0];
    const ceremonies = parseAwardCeremonies(`${mainHtml}\n${ceremoniesHtml}`, slug);
    const categories = parseAwardCategories(`${mainHtml}\n${categoriesHtml}`, slug);

    return {
      ...summary,
      name: title,
      description,
      imageUrl,
      logoUrl,
      backdropUrl: backdropUrl ? absoluteTmdbUrl(backdropUrl) : undefined,
      ceremonies,
      categories,
      mostAwardedMovies: parseAwardHighlights(mainHtml, 'Most Awarded Movies'),
      mostAwardedPeople: parseAwardHighlights(mainHtml, 'Most Awarded People'),
      mostNominatedMovies: parseAwardHighlights(mainHtml, 'Most Nominated Movies'),
      mostNominatedPeople: parseAwardHighlights(mainHtml, 'Most Nominated People'),
    };
  } catch {
    return {
      ...summary,
      ceremonies: [],
      categories: [],
      mostAwardedMovies: [],
      mostAwardedPeople: [],
      mostNominatedMovies: [],
      mostNominatedPeople: [],
    };
  }
}
