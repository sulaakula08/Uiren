import "server-only";
import { db } from "@/lib/db";

/**
 * Headline-метрика продукта. Считается из AiLog, а не декларируется:
 * учитель должен видеть возвращённые часы, а инвестор — измеримый эффект.
 */
export async function hoursSaved(userId: string, days = 30): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const result = await db.aiLog.aggregate({
    where: { userId, ok: true, createdAt: { gte: since } },
    _sum: { minutesSaved: true },
  });
  return Math.round(((result._sum.minutesSaved ?? 0) / 60) * 10) / 10;
}

export async function schoolHoursSaved(
  schoolId: string,
  days = 30,
): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const result = await db.aiLog.aggregate({
    where: {
      ok: true,
      createdAt: { gte: since },
      user: { schoolId },
    },
    _sum: { minutesSaved: true },
  });
  return Math.round(((result._sum.minutesSaved ?? 0) / 60) * 10) / 10;
}

export type MasteryStat = {
  reviewed: number;
  earned: number;
  possible: number;
  /** Доля набранных баллов — прокси усвоения темы. */
  mastery: number;
};

function toMastery(rows: { points: number; maxPoints: number }[]): MasteryStat {
  const earned = rows.reduce((sum, r) => sum + r.points, 0);
  const possible = rows.reduce((sum, r) => sum + r.maxPoints, 0);
  return {
    reviewed: rows.length,
    earned,
    possible,
    mastery: possible === 0 ? 0 : Math.round((earned / possible) * 100),
  };
}

/** Усвоение по конкретному заданию (используется на странице работы). */
export async function assignmentMastery(
  assignmentId: string,
): Promise<MasteryStat> {
  const rows = await db.finding.findMany({
    where: { submission: { assignmentId } },
    select: { points: true, maxPoints: true },
  });
  return toMastery(rows);
}

/** Разбивка ошибок по природе — структура, а не средний балл. */
export async function errorMix(
  where: { assignmentId?: string; classId?: string; schoolId?: string },
): Promise<{ nature: string; count: number }[]> {
  const rows = await db.finding.groupBy({
    by: ["nature"],
    where: {
      submission: {
        assignment: {
          ...(where.assignmentId ? { id: where.assignmentId } : {}),
          ...(where.classId ? { classId: where.classId } : {}),
          ...(where.schoolId ? { class: { schoolId: where.schoolId } } : {}),
        },
      },
    },
    _count: { _all: true },
  });

  return rows
    .map((r) => ({ nature: r.nature as string, count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

/** Понятия, которые системно проседают — вход для аналитики директора. */
export async function weakConcepts(
  schoolId: string,
  limit = 8,
): Promise<{ concept: string; misses: number }[]> {
  const rows = await db.finding.findMany({
    where: {
      nature: { in: ["CONCEPT_GAP", "CALCULATION", "INCOMPLETE"] },
      concept: { not: null },
      submission: { assignment: { class: { schoolId } } },
    },
    select: { concept: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.concept!.trim().toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([concept, misses]) => ({ concept, misses }))
    .sort((a, b) => b.misses - a.misses)
    .slice(0, limit);
}

/** Усвоение по предметам школы — верхняя строка дашборда директора. */
export async function subjectMastery(schoolId: string) {
  const subjects = await db.subject.findMany({
    where: { schoolId },
    select: { id: true, name: true, nameKk: true },
  });

  return Promise.all(
    subjects.map(async (subject) => {
      const rows = await db.finding.findMany({
        where: { submission: { assignment: { subjectId: subject.id } } },
        select: { points: true, maxPoints: true },
      });
      return { subject, ...toMastery(rows) };
    }),
  );
}

/** Личные пробелы ученика — то, вокруг чего строится его тьютор. */
export async function studentGaps(studentId: string) {
  const rows = await db.finding.findMany({
    where: {
      submission: { studentId },
      nature: { in: ["CONCEPT_GAP", "CALCULATION", "INCOMPLETE", "CARELESS"] },
      concept: { not: null },
    },
    select: { concept: true, nature: true },
    orderBy: { id: "desc" },
    take: 60,
  });

  const map = new Map<string, { concept: string; count: number; nature: string }>();
  for (const row of rows) {
    const key = row.concept!.trim();
    const entry = map.get(key);
    if (entry) entry.count += 1;
    else map.set(key, { concept: key, count: 1, nature: row.nature });
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}
