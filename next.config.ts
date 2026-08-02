import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Иначе Next поднимается вверх по дереву и находит чужой lock-файл.
  turbopack: { root: path.resolve(".") },
  // `pg` и адаптер к нему не бандлим: у драйвера есть опциональные нативные
  // зависимости, и сборщик на них спотыкается.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "bcryptjs",
  ],
};

export default nextConfig;
