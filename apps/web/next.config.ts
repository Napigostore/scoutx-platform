import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: ["@scoutx/ui", "@scoutx/types", "@scoutx/matching", "@scoutx/mock-data"],
  experimental: {
    optimizePackageImports: ["@scoutx/ui", "lucide-react"],
  },
};

export default nextConfig;
