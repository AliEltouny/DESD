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
    ],
  },
  webpack: (config, { isServer, dev }) => {
    // Add these optimizations only in development mode
    if (dev) {
      // Improve file watching in Docker
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding
        ignored: ['**/node_modules', '**/.git'],
      };
    }
    
    return config;
  },
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? 
          `${process.env.NEXT_PUBLIC_API_URL}/:path*` : 
          'http://backend:8000/api/:path*',
      },
      {
        source: '/media/:path*',
        destination: process.env.NEXT_PUBLIC_BACKEND_URL ? 
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/media/:path*` : 
          'http://backend:8000/media/:path*',
      },
    ]
  },
};

module.exports = nextConfig; 