/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ Remove or comment this out:
  // output: 'export',

  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['image.tmdb.org', 'lh3.googleusercontent.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    appDir: true
  }
};

module.exports = nextConfig;
