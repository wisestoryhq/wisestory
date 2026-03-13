import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@wisestory/auth",
    "@wisestory/db",
    "@wisestory/contracts",
    "@wisestory/types",
    "@wisestory/ui",
  ],
  serverExternalPackages: ["@prisma/adapter-pg", "@prisma/client"],
};

export default nextConfig;
