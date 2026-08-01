"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { AiError } from "@/lib/ai/client";
import { forecastEnt, type EntForecast } from "@/lib/ai/tasks";
import { subjectMastery, weakConcepts } from "@/lib/analytics";

export type ForecastState = {
  forecast?: EntForecast;
  className?: string;
  error?: string;
};

/**
 * Слой 4: прогноз ЕНТ по параллели. Именно этот слой оправдывает
 * школьный контракт, а не подписку одного учителя.
 */
export async function buildForecast(
  _prev: ForecastState,
  formData: FormData,
): Promise<ForecastState> {
  const session = await requireRole("DIRECTOR");
  if (!session.schoolId) return { error: "Аккаунт не привязан к школе." };

  const classId = String(formData.get("classId") ?? "");
  const klass = await db.classGroup.findFirst({
    where: { id: classId, schoolId: session.schoolId },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!klass) return { error: "Класс не найден." };

  const [mastery, weak] = await Promise.all([
    subjectMastery(session.schoolId),
    weakConcepts(session.schoolId),
  ]);

  const withData = mastery.filter((m) => m.reviewed > 0);
  if (withData.length === 0) {
    return {
      error:
        "Пока нет проверенных работ. Прогноз появится, когда учителя начнут проверять работы через AI.",
    };
  }

  try {
    const forecast = await forecastEnt({
      userId: session.userId,
      locale: await getLocale(),
      className: klass.name,
      studentCount: klass._count.enrollments,
      subjectStats: withData.map((m) => ({
        subject: m.subject.name,
        mastery: m.mastery,
        reviewed: m.reviewed,
      })),
      weakConcepts: weak.map((w) => w.concept),
    });

    return { forecast, className: klass.name };
  } catch (error) {
    return {
      error: error instanceof AiError ? error.message : "AI-запрос не удался.",
    };
  }
}
