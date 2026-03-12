import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
