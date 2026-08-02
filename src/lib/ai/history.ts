import "server-only";
import { db } from "@/lib/db";
import type { ErrorNature } from "@prisma/client";

/**
 * История ошибок ученика по предмету — то, что превращает проверку из
 * «оценить эту работу» в «понять, что происходит с этим человеком».
 *
 * Одна и та же потерянная скобка означает разное: у одного это описка, у
 * другого — четвёртый раз за месяц, то есть тема не взята. Модель не может
 * различить это по одной работе, поэтому историю мы собираем сами и кладём
 * в контекст. Общий чат-бот такого не умеет не потому, что слабее, а потому
 * что у него нет этих данных.
 */
export type ConceptHistory = {
  concept: string;
  times: number;
  natures: ErrorNature[];
  lastSeen: Date;
};

export type StudentHistory = {
  /** Понятия, которые проседали больше одного раза. */
  recurring: ConceptHistory[];
  /** Понятия, где ученик в последних работах был прав — их стоит похвалить. */
  mastered: string[];
  /** Сколько работ по предмету уже проверено: меньше двух — истории нет. */
  reviewedCount: number;
};

const IGNORED: ErrorNature[] = ["CORRECT", "NOT_ATTEMPTED"];

export async function buildStudentHistory(
  studentId: string,
  subjectId: string,
  /** Текущую работу исключаем: она ещё не история. */
  exceptSubmissionId?: string,
): Promise<StudentHistory> {
  const submissions = await db.submission.findMany({
    where: {
      studentId,
      id: exceptSubmissionId ? { not: exceptSubmissionId } : undefined,
      status: { in: ["AI_REVIEWED", "TEACHER_APPROVED"] },
      assignment: { subjectId },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { findings: true },
  });

  const byConcept = new Map<string, ConceptHistory>();
  const correct = new Set<string>();

  for (const submission of submissions) {
    for (const finding of submission.findings) {
      const concept = finding.concept?.trim();
      if (!concept) continue;

      if (finding.nature === "CORRECT") {
        correct.add(concept);
        continue;
      }
      if (IGNORED.includes(finding.nature)) continue;

      const entry = byConcept.get(concept);
      if (entry) {
        entry.times += 1;
        entry.natures.push(finding.nature);
      } else {
        byConcept.set(concept, {
          concept,
          times: 1,
          natures: [finding.nature],
          lastSeen: submission.createdAt,
        });
      }
    }
  }

  const recurring = [...byConcept.values()]
    .filter((c) => c.times > 1)
    .sort((a, b) => b.times - a.times)
    .slice(0, 6);

  // Освоенным считаем то, что было верно и ни разу не сбоило.
  const mastered = [...correct].filter((c) => !byConcept.has(c)).slice(0, 6);

  return { recurring, mastered, reviewedCount: submissions.length };
}

/** Готовый кусок промпта. Пустая строка — если истории ещё нет. */
export function formatHistory(history: StudentHistory): string {
  if (history.reviewedCount === 0) return "";

  const lines = [
    `Проверенных работ по предмету до этой: ${history.reviewedCount}.`,
  ];

  if (history.recurring.length) {
    lines.push(
      "Повторяющиеся трудности (понятие — сколько раз — характер ошибок):",
      ...history.recurring.map(
        (c) => `- ${c.concept} — ${c.times} раз — ${c.natures.join(", ")}`,
      ),
    );
  } else {
    lines.push("Повторяющихся трудностей раньше не было.");
  }

  if (history.mastered.length) {
    lines.push(`Уверенно владеет: ${history.mastered.join(", ")}.`);
  }

  return lines.join("\n");
}
