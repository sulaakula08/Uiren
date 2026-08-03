import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Empty, PageHeader } from "@/components/ui";
import { toFivePoint } from "@/lib/journal";

/** Инициалы для кружка рядом с именем. */
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function TeacherStudentsPage() {
  const session = await requireRole("TEACHER");

  const teaching = await db.teacherAssignment.findMany({
    where: { teacherId: session.userId },
    select: { classId: true, class: { select: { id: true, name: true, grade: true } } },
  });

  const classIds = [...new Set(teaching.map((t) => t.classId))];

  if (classIds.length === 0) {
    return (
      <div>
        <PageHeader title="Ученики" subtitle="Списки классов, которые вы ведёте" />
        <Empty text="Сначала укажите предметы и классы — тогда здесь появятся списки учеников." />
      </div>
    );
  }

  // Один запрос на всех учеников сразу, с их проверенными работами: по ним
  // считается средняя оценка. Отдельный запрос на каждого класса дал бы
  // столько же обращений к базе, сколько классов у учителя.
  const students = await db.user.findMany({
    where: {
      role: "STUDENT",
      enrollments: { some: { classId: { in: classIds } } },
    },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      enrollments: {
        where: { classId: { in: classIds } },
        select: { classId: true },
      },
      submissions: {
        where: {
          status: { in: ["AI_REVIEWED", "TEACHER_APPROVED"] },
          assignment: { authorId: session.userId },
        },
        select: {
          teacherScore: true,
          aiScore: true,
          assignment: { select: { maxScore: true } },
        },
      },
    },
  });

  const classes = [...new Map(teaching.map((t) => [t.class.id, t.class])).values()].sort(
    (a, b) => a.name.localeCompare(b.name),
  );

  return (
    <div>
      <PageHeader
        title="Ученики"
        subtitle={`${students.length} человек в ${classes.length} ${classes.length === 1 ? "классе" : "классах"}`}
      />

      <div className="space-y-8">
        {classes.map((klass) => {
          const inClass = students.filter((s) =>
            s.enrollments.some((e) => e.classId === klass.id),
          );

          return (
            <section key={klass.id}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="h2">{klass.name}</h2>
                <span className="muted text-xs">
                  {inClass.length}{" "}
                  {inClass.length === 1 ? "ученик" : "учеников"}
                </span>
              </div>

              {inClass.length === 0 ? (
                <Empty text="В этом классе пока нет зарегистрированных учеников." />
              ) : (
                <ul className="divide-y divide-[var(--color-line)] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
                  {inClass.map((s, i) => {
                    const marks = s.submissions
                      .map((sub) => {
                        const score = sub.teacherScore ?? sub.aiScore;
                        if (score === null || score === undefined) return null;
                        return toFivePoint(score, sub.assignment.maxScore);
                      })
                      .filter((m): m is number => m !== null);

                    const average =
                      marks.length > 0
                        ? Math.round(
                            (marks.reduce((a, b) => a + b, 0) / marks.length) *
                              10,
                          ) / 10
                        : null;

                    return (
                      <li
                        key={s.id}
                        className="animate-rise flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-canvas)]"
                        style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-brand-tint)] text-xs font-semibold text-[var(--color-brand)]">
                          {initials(s.fullName)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {s.fullName}
                          </p>
                          <p className="muted truncate text-xs">{s.email}</p>
                        </div>

                        <div className="shrink-0 text-right">
                          {average === null ? (
                            <span className="muted text-xs">нет оценок</span>
                          ) : (
                            <>
                              <p className="text-sm font-semibold tabular-nums">
                                {average}
                              </p>
                              <p className="muted text-xs">
                                {marks.length}{" "}
                                {marks.length === 1 ? "оценка" : "оценок"}
                              </p>
                            </>
                          )}
                        </div>

                        <Link
                          href={`/chat?with=${s.id}`}
                          className="btn-ghost shrink-0 px-2.5 py-1 text-xs"
                        >
                          Написать
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
