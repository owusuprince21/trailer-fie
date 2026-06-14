import type { Metadata } from 'next';
import { baseMetadata } from '@/lib/seo';

const MOVIE_CATEGORIES: Record<string, string> = {
  popular: 'Popular Movies',
  'airing-today': 'Now Playing Movies',
  'on-tv': 'Upcoming Movies',
  'top-rated': 'Top Rated Movies',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const title = MOVIE_CATEGORIES[category] || 'Movies';

  return baseMetadata({
    title,
    description: `${title} on Trailer Fie. Discover posters, ratings, trailers, cast details and where to watch.`,
    path: `/movies/${category}`,
    image: `/og?title=${encodeURIComponent(title)}&label=${encodeURIComponent('Movies')}&subtitle=${encodeURIComponent('Browse movie posters, trailers, cast, ratings and recommendations.')}`,
  });
}

export default function MoviesCategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
