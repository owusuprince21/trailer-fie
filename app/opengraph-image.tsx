import { ImageResponse } from 'next/og';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo';

export const runtime = 'edge';
export const alt = `${SITE_NAME} - movies, TV shows and trailers`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          color: 'white',
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 46%, #0891b2 100%)',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: 1 }}>{SITE_NAME}</div>
          <div
            style={{
              height: 30,
              width: 96,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #22d3ee, #60a5fa)',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ fontSize: 78, lineHeight: 1, fontWeight: 900, maxWidth: 880 }}>
            Discover what to watch next
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.35, color: 'rgba(255,255,255,.78)', maxWidth: 880 }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 24, color: 'rgba(255,255,255,.72)' }}>
          <span>Trailers</span>
          <span>•</span>
          <span>Cast</span>
          <span>•</span>
          <span>Media</span>
          <span>•</span>
          <span>Where to Watch</span>
        </div>
      </div>
    ),
    size
  );
}
