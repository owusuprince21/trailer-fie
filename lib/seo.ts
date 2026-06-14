import type { Metadata } from 'next';

export const SITE_NAME = 'Trailer Fie';
export const SITE_DESCRIPTION =
  'Discover movies, TV shows, people, trailers, cast details, media, recommendations and where to watch.';

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:3000';
  const withProtocol = raw.startsWith('http') ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, '');
}

export function absoluteUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export function tmdbImageUrl(path?: string | null, size = 'w780') {
  if (!path) return undefined;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function cleanDescription(value?: string | null, fallback = SITE_DESCRIPTION) {
  const text = (value || '').replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text;
}

export function titleTemplate(title: string) {
  return `${title} | ${SITE_NAME}`;
}

export function baseMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = '/',
  image = '/opengraph-image',
  type = 'website',
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile' | 'video.movie' | 'video.tv_show';
}): Metadata {
  const fullTitle = title.includes(SITE_NAME) ? title : titleTemplate(title);
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type,
      locale: 'en_US',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  };
}

export async function fetchTmdb<T>(path: string): Promise<T | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const separator = path.includes('?') ? '&' : '?';
  const url = `https://api.themoviedb.org/3${path}${separator}api_key=${apiKey}`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}
