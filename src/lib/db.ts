import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

/*
 * Клиент держим на globalThis и в проде.
 *
 * Раньше ссылка сохранялась только в разработке — ради hot reload. Но в
 * serverless каждый маршрут собирается в свой бандл, и без общей ссылки
 * PrismaClient создаётся заново на каждый из них. Каждый экземпляр открывает
 * свои подключения к пулу; когда пул заканчивается, запросы начинают ждать,
 * а потом отваливаться — это и есть «This page couldn't load» при обновлении
 * страницы в момент, когда предыдущий запрос ещё не завершился.
 */
globalForPrisma.prisma = db;
