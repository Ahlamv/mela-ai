import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "recharts"],
  },
};

export default config;
