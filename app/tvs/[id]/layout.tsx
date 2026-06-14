import type { Metadata } from 'next';
import { baseMetadata, cleanDescription, fetchTmdb } from '@/lib/seo';

type TVDetails = {
  name?: string;
  overview?: string;
  first_air_date?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tv = await fetchTmdb<TVDetails>(`/tv/${id}`);
  const title = tv?.name || 'TV Series Details';
  const year = tv?.first_air_date ? new Date(tv.first_air_date).getFullYear() : undefined;
  const displayTitle = year ? `${title} (${year})` : title;

  return baseMetadata({
    title: displayTitle,
    description: cleanDescription(tv?.overview, `Explore seasons, cast, trailers, media and where to watch ${title}.`),
    path: `/tvs/${id}`,
    image: `/tvs/${id}/opengraph-image`,
  });
}

export default function TVDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
