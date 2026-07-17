import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Only enable standalone output in non-Windows environments (like Docker/Linux)
  // to avoid symlink permission issues (EPERM) on Windows local builds.
  output: process.platform === "win32" ? undefined : "standalone",
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: ["@scoutx/ui", "@scoutx/types", "@scoutx/matching", "@scoutx/mock-data"],
  experimental: {
    optimizePackageImports: ["@scoutx/ui", "lucide-react"],
  },
};

export default nextConfig;
