/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker standalone deployment
  output: 'standalone',
  images: {
    // Allow MinIO and localhost image sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;
