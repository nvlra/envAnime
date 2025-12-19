import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'otakudesu.best',
      },
      {
        protocol: 'https',
        hostname: 'otakudesu.cloud',
      },
      {
        protocol: 'https',
        hostname: 'anoboy.si',
      },
      {
        protocol: 'https',
        hostname: 'kusonime.com',
      },
      {
        protocol: 'https',
        hostname: 'anime.oploverz.ac',
      },
      {
        protocol: 'https',
        hostname: 'oploverz.org',
      },
      {
        protocol: 'https',
        hostname: '*.sinaimg.cn',
      },
      {
        protocol: 'https',
        hostname: 'blogger.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'backapi.oploverz.ac',
      },
    ],
  },
};

export default nextConfig;
