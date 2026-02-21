import type { NextConfig } from "next";

const spinServiceUrl = (process.env.SPIN_SERVICE_URL || "http://127.0.0.1:3001").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/pool/spin",
        destination: `${spinServiceUrl}/pool/spin`,
      },
    ];
  },
};

export default nextConfig;
