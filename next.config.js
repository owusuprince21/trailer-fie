/** @type {import('next').NextConfig} */
const nextConfig = {

  //  output: 'export',

  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['image.tmdb.org', 'lh3.googleusercontent.com'],
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
