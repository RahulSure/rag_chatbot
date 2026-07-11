import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for the Docker image (web.Dockerfile).
  output: "standalone",
  experimental: {
    mdxRs: true,
  },
  images: {
    // Article cover images come from arbitrary remote hosts (admin/AI supplied).
    // Kept permissive intentionally; tighten to your CDN host(s) in production.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
