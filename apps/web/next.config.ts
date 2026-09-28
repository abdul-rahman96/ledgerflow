import type { NextConfig } from "next";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const pagesBasePath = process.env.GITHUB_ACTIONS === "true" && repository
  ? `/${repository}`
  : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: pagesBasePath,
  assetPrefix: pagesBasePath || undefined,
};

export default nextConfig;
