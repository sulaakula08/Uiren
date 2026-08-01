import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Иначе Next поднимается вверх по дереву и находит чужой lock-файл.
  turbopack: { root: path.resolve(".") },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
