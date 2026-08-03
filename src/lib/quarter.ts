import "server-only";
import { db } from "@/lib/db";
import { toFivePoint } from "@/lib/journal";

/**
 * Четвертная оценка по правилам критериального оценивания РК.
 *
 * Вклад в четверть: ФО 25%, СОР 25%, СОЧ 50%. Это не наша выдумка, а порядок,
 * установленный Министерством просвещения; источники — в README раздела.
 *
 * Как это ложится на наши виды работ:
 *   HOMEWORK, QUIZ  → формативное оценивание (ФО)
 *   FORMATIVE       → СОР, суммативное за раздел
 *   SUMMATIVE       → СОЧ, суммативное за четверть
 *
 * Проценты берутся внутри группы, а не по всем работам подряд: иначе десять
 * домашних перевесили бы одну СОЧ, хотя по правилам должно быть наоборот.
 */
export const WEIGHTS = { FO: 0.25, SOR: 0.25, SOCH: 0.5 } as const;

export type Bucket = "FO" | "SOR" | "SOCH";

export const BUCKET_LABEL: Record<Bucket, string> = {
  FO: "Формативное (ДЗ и проверочные)",
  SOR: "СОР — за раздел",
  SOCH: "СОЧ — за четверть",
};

export const BUCKET_SHARE: Record<Bucket, string> = {
  FO: "25%",
  SOR: "25%",
  SOCH: "50%",
};

export function bucketOf(kind: string): Bucket {
  if (kind === "SUMMATIVE") return "SOCH";
  if (kind === "FORMATIVE") return "SOR";
  return "FO";
}

export type SubjectStats = {
  subjectId: string;
  subject: string;
  /** Проценты внутри каждой группы работ. */
  buckets: Record<Bucket, { percents: number[]; average: number | null }>;
  /** Итоговый процент за четверть с учётом весов. */
  quarterPercent: number | null;
  /** Он же в пятибалльной оценке. */
  quarterMark: number | null;
  /** Каких групп ещё нет — по ним оценка неполная. */
  missing: Bucket[];
  /** Средний балл по всем оценкам предмета, как в журнале. */
  averageMark: number | null;
  total: number;
};

/**
 * Что нужно получить, чтобы выйти на желаемую оценку.
 *
 * Считаем только по СОЧ: это единственная работа, которая ещё впереди и весит
 * половину. Возвращаем минимальный процент за СОЧ, при котором четверть
 * закрывается нужной оценкой, либо null — если недостижимо или уже достигнуто.
 */
export function neededForMark(
  stats: SubjectStats,
  targetMark: number,
): { percent: number; reachable: boolean } | null {
  const target =
    targetMark === 5 ? 85 : targetMark === 4 ? 65 : targetMark === 3 ? 40 : 0;

  const fo = stats.buckets.FO.average;
  const sor = stats.buckets.SOR.average;
  if (fo === null && sor === null) return null;

  // Итог = ФО*0.25 + СОР*0.25 + СОЧ*0.5. Решаем относительно СОЧ.
  const known = (fo ?? 0) * WEIGHTS.FO + (sor ?? 0) * WEIGHTS.SOR;
  const need = (target - known) / WEIGHTS.SOCH;

  if (need <= 0) return { percent: 0, reachable: true };
  if (need > 100) return { percent: Math.ceil(need), reachable: false };
  return { percent: Math.ceil(need), reachable: true };
}

/** Статистика ученика по всем предметам, где у него есть проверенные работы. */
export async function studentSubjectStats(
  studentId: string,
): Promise<SubjectStats[]> {
  const submissions = await db.submission.findMany({
    where: {
      studentId,
      status: { in: ["AI_REVIEWED", "TEACHER_APPROVED"] },
    },
    select: {
      teacherScore: true,
      aiScore: true,
      assignment: {
        select: {
          kind: true,
          maxScore: true,
          subjectId: true,
          subject: { select: { name: true } },
        },
      },
    },
  });

  const bySubject = new Map<string, SubjectStats>();

  for (const s of submissions) {
    const score = s.teacherScore ?? s.aiScore;
    if (score === null || score === undefined) continue;
    const max = s.assignment.maxScore;
    if (max <= 0) continue;

    const percent = Math.max(0, Math.min(100, (score / max) * 100));
    const id = s.assignment.subjectId;

    let entry = bySubject.get(id);
    if (!entry) {
      entry = {
        subjectId: id,
        subject: s.assignment.subject.name,
        buckets: {
          FO: { percents: [], average: null },
          SOR: { percents: [], average: null },
          SOCH: { percents: [], average: null },
        },
        quarterPercent: null,
        quarterMark: null,
        missing: [],
        averageMark: null,
        total: 0,
      };
      bySubject.set(id, entry);
    }

    entry.buckets[bucketOf(s.assignment.kind)].percents.push(percent);
    entry.total += 1;
  }

  for (const entry of bySubject.values()) {
    const all: number[] = [];

    for (const key of ["FO", "SOR", "SOCH"] as Bucket[]) {
      const b = entry.buckets[key];
      if (b.percents.length === 0) {
        entry.missing.push(key);
        continue;
      }
      b.average =
        b.percents.reduce((a, c) => a + c, 0) / b.percents.length;
      all.push(...b.percents);
    }

    // Если какой-то группы нет, вес распределяем между имеющимися: иначе
    // отсутствие СОЧ в начале четверти показывало бы «двойку» у всех.
    const present = (["FO", "SOR", "SOCH"] as Bucket[]).filter(
      (k) => entry.buckets[k].average !== null,
    );
    if (present.length > 0) {
      const totalWeight = present.reduce((sum, k) => sum + WEIGHTS[k], 0);
      const weighted = present.reduce(
        (sum, k) => sum + (entry.buckets[k].average ?? 0) * WEIGHTS[k],
        0,
      );
      entry.quarterPercent = Math.round(weighted / totalWeight);
      entry.quarterMark = toFivePoint(entry.quarterPercent, 100);
    }

    if (all.length > 0) {
      const marks = all.map((p) => toFivePoint(p, 100));
      entry.averageMark =
        Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 100) /
        100;
    }
  }

  return [...bySubject.values()].sort((a, b) =>
    a.subject.localeCompare(b.subject),
  );
}
