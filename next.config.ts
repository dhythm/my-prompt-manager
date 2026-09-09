import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@electric-sql/pglite", "drizzle-orm", "postgres"],
};

export default nextConfig;
