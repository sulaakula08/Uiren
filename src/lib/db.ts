import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Параметры Prisma, которые драйверу `pg` в строке подключения не нужны. */
const PRISMA_ONLY = [
  "pgbouncer",
  "connection_limit",
  "pool_timeout",
  "connect_timeout",
  "schema",
];

/**
 * Разбираем `DATABASE_URL` на строку для драйвера и настройки пула.
 *
 * `connection_limit` и `pool_timeout` раньше читал движок Prisma. Драйвер их в
 * строке не понимает, но сами значения важны — поэтому переносим их в опции
 * пула, а из строки убираем.
 *
 * `pgbouncer=true` больше ни на что не влияет: он отключал именованные
 * prepared statements, которых не переваривает transaction-пул, а драйвер их и
 * так не использует — шлёт анонимные. Оставить в строке не вредно.
 */
function poolConfig() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "DATABASE_URL не задан. Скопируйте .env.example в .env и заполните его.",
    );
  }

  let connectionString = raw;
  // Страницы делают по 4–5 запросов через Promise.all. С пулом в одно
  // соединение они выстраиваются в очередь и отваливаются по таймауту,
  // поэтому меньше пяти здесь ставить нельзя.
  let max = 5;
  let connectionTimeoutMillis = 20_000;

  try {
    const url = new URL(raw);
    const limit = Number(url.searchParams.get("connection_limit"));
    const timeout = Number(url.searchParams.get("pool_timeout"));
    if (Number.isFinite(limit) && limit > 0) max = limit;
    if (Number.isFinite(timeout) && timeout > 0) {
      connectionTimeoutMillis = timeout * 1000;
    }
    for (const key of PRISMA_ONLY) url.searchParams.delete(key);
    connectionString = url.toString();
  } catch {
    // Строку не разобрать — отдаём как есть, с настройками по умолчанию.
  }

  return { connectionString, max, connectionTimeoutMillis };
}

/**
 * Клиент поверх драйвера `pg`.
 *
 * С драйвер-адаптером Prisma компилирует запросы сама и не поднимает движок на
 * Rust — 17 МБ нативного бинарника меняются на 2 МБ WASM. На serverless это
 * прямая экономия на холодном старте, а он здесь случается после каждого
 * простоя.
 */
function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg(poolConfig()),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

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
