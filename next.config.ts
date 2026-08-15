import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app is its own root. Without this, Next walks up and finds the
  // lockfile in the parent directory and infers the wrong workspace root.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
