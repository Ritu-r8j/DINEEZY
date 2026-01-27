import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'images.unsplash.com',
    //     port: '',
    //     pathname: '/**',
    //   },
    // ],
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd()
  },
  output: 'standalone',
};

export default nextConfig;
