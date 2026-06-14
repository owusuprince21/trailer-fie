import { ImageResponse } from 'next/og';
import { fetchTmdb, SITE_NAME, tmdbImageUrl } from '@/lib/seo';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type MovieDetails = {
  title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await fetchTmdb<MovieDetails>(`/movie/${id}`);
  const title = movie?.title || 'Movie Details';
  const year = movie?.release_date ? new Date(movie.release_date).getFullYear() : '';
  const poster = tmdbImageUrl(movie?.poster_path, 'w500');
  const backdrop = tmdbImageUrl(movie?.backdrop_path, 'w1280');
  const score = typeof movie?.vote_average === 'number' ? Math.round(movie.vote_average * 10) : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#020617',
          color: 'white',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.42 }}
          />
        ) : null}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(2,6,23,.96), rgba(2,6,23,.76) 48%, rgba(2,6,23,.44))' }} />
        <div style={{ display: 'flex', gap: 46, alignItems: 'center', padding: 58, position: 'relative', width: '100%' }}>
          <div style={{ display: 'flex', width: 300, height: 450, borderRadius: 24, overflow: 'hidden', background: 'rgba(255,255,255,.12)', boxShadow: '0 30px 80px rgba(0,0,0,.48)' }}>
            {poster ? (
              <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: 30, color: '#67e8f9', fontWeight: 800, marginBottom: 22 }}>{SITE_NAME} · Movie</div>
            <div style={{ display: 'flex', fontSize: 76, lineHeight: 1.02, fontWeight: 900 }}>{title}</div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 22, fontSize: 28, color: 'rgba(255,255,255,.78)' }}>
              {year ? <span>{year}</span> : null}
              {score ? <span>{year ? '• ' : ''}{score}% User Score</span> : null}
            </div>
            <div style={{ display: 'flex', fontSize: 28, lineHeight: 1.32, marginTop: 34, color: 'rgba(255,255,255,.76)', maxWidth: 720 }}>
              {(movie?.overview || 'Watch trailers, cast, media, recommendations and where to watch.').slice(0, 150)}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
