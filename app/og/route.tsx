import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/seo';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || SITE_NAME;
  const subtitle =
    searchParams.get('subtitle') || 'Movies, TV shows, trailers, cast, media and where to watch.';
  const label = searchParams.get('label') || 'Discover';
  const image = searchParams.get('image');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #050816 0%, #111827 44%, #0f766e 100%)',
          color: 'white',
          fontFamily: 'Inter, Arial, sans-serif',
          padding: 58,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 78% 22%, rgba(56, 189, 248, 0.42), transparent 30%), radial-gradient(circle at 10% 90%, rgba(20, 184, 166, 0.34), transparent 30%)',
          }}
        />
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: '100%',
            height: '100%',
            gap: 44,
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 38,
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 1 }}>{SITE_NAME}</div>
              <div
                style={{
                  height: 26,
                  width: 84,
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #22d3ee, #60a5fa)',
                }}
              />
            </div>
            <div
              style={{
                alignSelf: 'flex-start',
                border: '1px solid rgba(255,255,255,.28)',
                background: 'rgba(255,255,255,.12)',
                padding: '10px 18px',
                borderRadius: 999,
                fontSize: 24,
                marginBottom: 26,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 72, lineHeight: 1.02, fontWeight: 900, maxWidth: 720 }}>
              {title}
            </div>
            <div
              style={{
                marginTop: 24,
                fontSize: 30,
                lineHeight: 1.35,
                color: 'rgba(255,255,255,.76)',
                maxWidth: 760,
              }}
            >
              {subtitle}
            </div>
          </div>
          <div
            style={{
              width: 310,
              height: 460,
              borderRadius: 28,
              overflow: 'hidden',
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.28)',
              boxShadow: '0 28px 80px rgba(0,0,0,.42)',
              display: 'flex',
            }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 86,
                  fontWeight: 900,
                  color: 'rgba(255,255,255,.72)',
                }}
              >
                TF
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
