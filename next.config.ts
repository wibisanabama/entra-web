import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/assets/white-icon.png",
      },
    ];
  },
};

export default nextConfig;
