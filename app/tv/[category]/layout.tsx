import type { Metadata } from 'next';
import { baseMetadata } from '@/lib/seo';

const TV_CATEGORIES: Record<string, string> = {
  popular: 'Popular TV Shows',
  'airing-today': 'TV Shows Airing Today',
  'on-tv': 'TV Shows On The Air',
  'top-rated': 'Top Rated TV Shows',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const title = TV_CATEGORIES[category] || 'TV Shows';

  return baseMetadata({
    title,
    description: `${title} on Trailer Fie. Explore series, seasons, trailers, cast, media and where to watch.`,
    path: `/tv/${category}`,
    image: `/og?title=${encodeURIComponent(title)}&label=${encodeURIComponent('TV Shows')}&subtitle=${encodeURIComponent('Browse TV series, seasons, trailers, cast and streaming availability.')}`,
  });
}

export default function TVCategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
