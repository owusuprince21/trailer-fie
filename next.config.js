/** @type {import('next').NextConfig} */
const nextConfig = {

  //  output: 'export',

  images: { 
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'media.themoviedb.org',
      },
      {
        protocol: 'https',
        hostname: 's1.ticketm.net',
      },
      {
        protocol: 'https',
        hostname: 's1.ticketm.net',
        pathname: '/dam/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        // Loosen for all pages, simplest/safest for Firebase auth popups
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          // If you previously set COEP to require-corp, relax it here:
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
        ],
      },
      // If you prefer to scope it only to auth-related pages/components, you can target those routes instead.
    ];
  },
  // experimental: {
  //   appDir: true
  // }
};

module.exports = nextConfig;
