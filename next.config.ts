import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["react-icons", "framer-motion", "clsx", "tailwind-merge"],
  },
};

module.exports = {
  allowedDevOrigins: ['192.168.0.8'],
}
export default nextConfig;
