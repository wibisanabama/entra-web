import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/assets/white-logo.png",
      },
    ];
  },
};

export default nextConfig;
