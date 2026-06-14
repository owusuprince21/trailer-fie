import type { Metadata } from 'next';
import { baseMetadata, cleanDescription, fetchTmdb } from '@/lib/seo';

type MovieDetails = {
  id: number;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const movie = await fetchTmdb<MovieDetails>(`/movie/${id}`);
  const title = movie?.title || 'Movie Details';
  const year = movie?.release_date ? new Date(movie.release_date).getFullYear() : undefined;
  const displayTitle = year ? `${title} (${year})` : title;
  const image = `/movie/${id}/opengraph-image`;

  return baseMetadata({
    title: displayTitle,
    description: cleanDescription(movie?.overview, `Watch trailers, cast, media and where to watch ${title}.`),
    path: `/movie/${id}`,
    image,
  });
}

export default function MovieDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
