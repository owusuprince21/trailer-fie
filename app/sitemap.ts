import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

const MOVIE_CATEGORIES = ['popular', 'now-playing', 'upcoming', 'top-rated'];
const TV_CATEGORIES = ['popular', 'airing-today', 'on-tv', 'top-rated'];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl().replace(/\/$/, '');
  const now = new Date();

  const staticRoutes = ['/', '/people', '/events', '/search', '/movie', '/tv'];

  const movieRoutes = MOVIE_CATEGORIES.map(
    (category) => `/movies/${category}`
  );

  const tvRoutes = TV_CATEGORIES.map(
    (category) => `/tv/${category}`
  );

  return [...staticRoutes, ...movieRoutes, ...tvRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.8,
  }));
}