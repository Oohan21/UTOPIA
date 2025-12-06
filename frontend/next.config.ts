// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      // Add your production domain when ready
      {
        protocol: 'https',
        hostname: 'your-domain.com',
        pathname: '/media/**',
      },
    ],
    // Disable image optimization for development to allow localhost images
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Allow loading from localhost in dev
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:8000', 'localhost:3000'],
    },
  },
}

module.exports = nextConfig