import { ImageResponse } from 'next/og';
import { fetchTmdb, SITE_NAME, tmdbImageUrl } from '@/lib/seo';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type PersonDetails = {
  name?: string;
  biography?: string;
  profile_path?: string | null;
  known_for_department?: string;
  birthday?: string;
  place_of_birth?: string;
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await fetchTmdb<PersonDetails>(`/person/${id}`);
  const title = person?.name || 'Person Details';
  const profile = tmdbImageUrl(person?.profile_path, 'w500');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #020617 0%, #111827 48%, #075985 100%)',
          color: 'white',
          fontFamily: 'Inter, Arial, sans-serif',
          padding: 58,
          gap: 46,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', width: 320, height: 480, borderRadius: 28, overflow: 'hidden', background: 'rgba(255,255,255,.12)', boxShadow: '0 30px 80px rgba(0,0,0,.48)' }}>
          {profile ? (
            <img src={profile} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', fontSize: 30, color: '#67e8f9', fontWeight: 800, marginBottom: 22 }}>{SITE_NAME} · Person</div>
          <div style={{ display: 'flex', fontSize: 78, lineHeight: 1.02, fontWeight: 900 }}>{title}</div>
          <div style={{ display: 'flex', marginTop: 22, fontSize: 30, color: 'rgba(255,255,255,.78)' }}>
            {person?.known_for_department || 'Filmography'}
            {person?.birthday ? ` • Born ${person.birthday}` : ''}
          </div>
          <div style={{ display: 'flex', fontSize: 28, lineHeight: 1.32, marginTop: 34, color: 'rgba(255,255,255,.76)', maxWidth: 720 }}>
            {(person?.biography || `Explore ${title}'s biography, credits, awards and known for titles.`).slice(0, 160)}
          </div>
        </div>
      </div>
    ),
    size
  );
}
