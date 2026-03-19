/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['geist'],
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon' }];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'flagcdn.com' },
    ],
  },
};

module.exports = nextConfig;
