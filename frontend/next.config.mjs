const API_URL = process.env.API_URL || 'http://localhost:3000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_URL}/api/:path*` },
      { source: '/health', destination: `${API_URL}/health` },
    ];
  },
};

export default nextConfig;