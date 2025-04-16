import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    incomingRequests: (req) => req.url !== "/api/health",
  },
};

export default nextConfig;
