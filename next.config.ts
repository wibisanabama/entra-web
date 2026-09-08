import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/assets/white-e.png",
      },
    ];
  },
};

export default nextConfig;
