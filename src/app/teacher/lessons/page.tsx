import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { Empty, PageHeader, SectionHeader } from "@/components/ui";
import { LessonPlanner } from "./planner";

type StoredPlan = {
  objectives?: string[];
  stages?: { name: string; minutes: number }[];
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
                  {plan.objectives && plan.objectives.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {plan.objectives.slice(0, 3).map((o, i) => (
                        <li key={i} className="muted">
                          • {o}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
