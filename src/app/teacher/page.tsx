import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { hoursSaved } from "@/lib/analytics";
import { PageHeader, SectionHeader, Stat } from "@/components/ui";

export default async function TeacherOverview() {
  const session = await requireRole("TEACHER");
  const { t } = await getT();

  const teaching = await db.teacherAssignment.count({
    where: { teacherId: session.userId },
  });
  // Без предметов и классов работать не с чем — ведём сразу в настройку.
  if (teaching === 0) redirect("/teacher/setup");

  const [hours, pending, classes, assignments] = await Promise.all([
    hoursSaved(session.userId),
    db.submission.count({
      where: { status: "SUBMITTED", assignment: { authorId: session.userId } },
    }),
    db.teacherAssignment.findMany({
      where: { teacherId: session.userId },
      select: { classId: true },
    }),
    db.assignment.findMany({
      where: { authorId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        class: true,
        subject: true,
        submissions: { select: { status: true } },
      },
    }),
  ]);

  const uniqueClasses = new Set(classes.map((c) => c.classId)).size;

  return (
    <div>
      <PageHeader
        title={`Здравствуйте, ${session.fullName.split(" ")[0]}`}
        subtitle="Что уже сделано и что ждёт проверки"
        action={
          <div className="flex gap-2">
            <Link href="/teacher/lessons" className="btn-ghost">
              {t("teacher.newLesson")}
            </Link>
            <Link href="/teacher/assignments" className="btn-primary">
              {t("teacher.newAssignment")}
            </Link>
          </div>
        }
      />

      <div data-tour="stats" className="grid gap-4 sm:grid-cols-3">
        <Stat
          label={t("teacher.hoursSaved")}
          value={hours}
          hint={t("teacher.hoursSavedHint")}
          tone="brand"
        />
        <Stat
          label={t("teacher.pendingReview")}
          value={pending}
          hint={pending > 0 ? "проверяются одной кнопкой" : "всё проверено"}
          tone={pending > 0 ? "warn" : "default"}
        />
        <Stat label={t("teacher.activeClasses")} value={uniqueClasses} />
      </div>

      <section className="mt-8" data-tour="assignments">
        <SectionHeader title={t("teacher.myAssignments")} />

        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white px-6 py-10 text-center">
            <p className="font-medium">Пока нет ни одного задания</p>
            <p className="muted mx-auto mt-1.5 max-w-sm">
              Создайте первое: укажите тему, и платформа предложит готовые
              задания — их останется поправить под свой класс.
            </p>
            <Link href="/teacher/assignments" className="btn-primary mt-5">
              Создать первое задание
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {assignments.map((a) => {
              const submitted = a.submissions.length;
              const waiting = a.submissions.filter(
                (s) => s.status === "SUBMITTED",
              ).length;

              return (
                <Link
                  key={a.id}
                  href={`/teacher/assignments/${a.id}`}
                  className="card-link"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {a.subject.name} · {a.class.name} ·{" "}
                        {t(`assign.kind.${a.kind}`)}
                      </p>
                    </div>
                    {a.aiGenerated && (
                      <span className="chip shrink-0 bg-[var(--color-brand-tint)] text-[var(--color-brand)]">
                        AI
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className="chip bg-[var(--color-line-2)] text-[var(--color-muted)]">
                      {submitted} сдано
                    </span>
                    {waiting > 0 && (
                      <span className="chip bg-[var(--color-warn-tint)] text-[var(--color-warn)]">
                        {waiting} ждут проверки
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
