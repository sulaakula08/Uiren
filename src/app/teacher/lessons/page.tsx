import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { Empty, PageHeader, SectionHeader } from "@/components/ui";
import { LessonPlanner } from "./planner";

/** Ровно то, что кладёт в planJson генератор плана (см. lib/ai/tasks.ts). */
type StoredPlan = {
  objectives?: string[];
  successCriteria?: string[];
  stages?: {
    name: string;
    minutes: number;
    activity?: string;
    assessment?: string;
  }[];
  differentiation?: string;
  resources?: string[];
};

export default async function LessonsPage() {
  const session = await requireRole("TEACHER");
  const { t, locale } = await getT();

  const [taught, lessons] = await Promise.all([
    db.teacherAssignment.findMany({
      where: { teacherId: session.userId },
      include: { subject: true, class: true },
    }),
    db.lesson.findMany({
      where: { authorId: session.userId },
      orderBy: { date: "desc" },
      include: { subject: true, class: true },
    }),
  ]);

  const subjects = [
    ...new Map(
      taught.map((x) => [
        x.subject.id,
        {
          id: x.subject.id,
          label: locale === "kk" ? x.subject.nameKk : x.subject.name,
        },
      ]),
    ).values(),
  ];
  const classes = [
    ...new Map(
      taught.map((x) => [x.class.id, { id: x.class.id, label: x.class.name }]),
    ).values(),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("nav.lessons")}
        subtitle="Краткосрочные планы уроков (КСП)"
      />

      {subjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-10 text-center">
          <p className="font-medium">Сначала укажите, что вы преподаёте</p>
          <Link href="/teacher/setup" className="btn-primary mt-4">
            Указать предметы и классы
          </Link>
        </div>
      ) : (
        <LessonPlanner subjects={subjects} classes={classes} />
      )}

      <section>
        <SectionHeader title="Сохранённые планы" />
        {lessons.length === 0 ? (
          <Empty text={t("common.empty")} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {lessons.map((lesson) => {
              const plan = JSON.parse(lesson.planJson) as StoredPlan;
              const minutes =
                plan.stages?.reduce((sum, s) => sum + s.minutes, 0) ?? 0;

              return (
                <div key={lesson.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{lesson.title}</p>
                    {lesson.aiGenerated && (
                      <span className="chip bg-[var(--color-brand-tint)] text-[var(--color-brand)]">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="muted mt-1 text-xs">
                    {lesson.subject.name} · {lesson.class.name} ·{" "}
                    {lesson.date.toLocaleDateString("ru-RU")}
                    {minutes ? ` · ${minutes} мин` : ""}
                  </p>
                  {/* Раньше карточка показывала только три первых цели, а
                      остальной план оставался в базе и открыть его было негде.
                      Теперь под кнопкой лежит всё, что сохранил генератор. */}
                  {plan.objectives && plan.objectives.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {plan.objectives.slice(0, 3).map((o, i) => (
                        <li key={i} className="muted">
                          • {o}
                        </li>
                      ))}
                      {plan.objectives.length > 3 && (
                        <li className="muted text-xs">
                          и ещё {plan.objectives.length - 3}
                        </li>
                      )}
                    </ul>
                  )}

                  <details className="group mt-4">
                    <summary className="cursor-pointer list-none text-sm font-medium text-[var(--color-brand)] hover:underline">
                      Открыть план полностью
                      <span className="ml-1 inline-block transition-transform group-open:rotate-90">
                        ›
                      </span>
                    </summary>

                    <div className="mt-4 space-y-4 border-t border-[var(--color-line)] pt-4">
                      {plan.objectives && plan.objectives.length > 0 && (
                        <div>
                          <p className="label">Цели обучения</p>
                          <ul className="space-y-1 text-sm">
                            {plan.objectives.map((o, i) => (
                              <li key={i}>• {o}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {plan.successCriteria &&
                        plan.successCriteria.length > 0 && (
                          <div>
                            <p className="label">Критерии успеха</p>
                            <ul className="space-y-1 text-sm">
                              {plan.successCriteria.map((c, i) => (
                                <li key={i}>• {c}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {plan.stages && plan.stages.length > 0 && (
                        <div>
                          <p className="label">Ход урока</p>
                          <ol className="space-y-2.5">
                            {plan.stages.map((st, i) => (
                              <li
                                key={i}
                                className="rounded-lg bg-[var(--color-canvas)] p-3"
                              >
                                <div className="flex items-baseline justify-between gap-3">
                                  <span className="text-sm font-medium">
                                    {st.name}
                                  </span>
                                  <span className="muted shrink-0 text-xs">
                                    {st.minutes} мин
                                  </span>
                                </div>
                                {st.activity && (
                                  <p className="mt-1.5 text-sm">{st.activity}</p>
                                )}
                                {st.assessment && (
                                  <p className="muted mt-1 text-xs">
                                    Оценивание: {st.assessment}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {plan.differentiation && (
                        <div>
                          <p className="label">Дифференциация</p>
                          <p className="text-sm">{plan.differentiation}</p>
                        </div>
                      )}

                      {plan.resources && plan.resources.length > 0 && (
                        <div>
                          <p className="label">Ресурсы</p>
                          <ul className="space-y-1 text-sm">
                            {plan.resources.map((r, i) => (
                              <li key={i}>• {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
