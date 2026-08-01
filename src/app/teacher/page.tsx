import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { hoursSaved } from "@/lib/analytics";
import { SectionHeader, Stat } from "@/components/ui";
import {
  IconChart,
  IconChat,
  IconPeople,
  IconPlan,
  IconSpark,
  IconTasks,
} from "@/components/icons";

const WEEKDAYS = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];

function greeting(hour: number) {
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export default async function TeacherOverview() {
  const session = await requireRole("TEACHER");
  const { t } = await getT();

  const teaching = await db.teacherAssignment.count({
    where: { teacherId: session.userId },
  });
  // Без предметов и классов работать не с чем — ведём сразу в настройку.
  if (teaching === 0) redirect("/teacher/setup");

  const [hours, pending, classes, assignments, lessonCount] = await Promise.all(
    [
      hoursSaved(session.userId),
      db.submission.count({
        where: {
          status: "SUBMITTED",
          assignment: { authorId: session.userId },
        },
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
      db.lesson.count({ where: { authorId: session.userId } }),
    ],
  );

  const uniqueClasses = new Set(classes.map((c) => c.classId)).size;
  const now = new Date();
  const firstName = session.fullName.split(" ")[0];

  const QUICK = [
    {
      href: "/teacher/assignments",
      Icon: IconTasks,
      title: "Новое задание",
      text: "Тема — и готовые задачи",
    },
    {
      href: "/teacher/lessons",
      Icon: IconPlan,
      title: "План урока",
      text: "КСП с целями и хронометражем",
    },
    {
      href: "/teacher/messages",
      Icon: IconChat,
      title: "Написать родителям",
      text: "Черновик по данным ученика",
    },
  ];

  return (
    <div>
      {/* Приветствие: тёплый блок вместо сухого заголовка */}
      <header className="animate-rise relative mb-8 overflow-hidden rounded-3xl border border-[var(--color-line)] bg-gradient-to-br from-[var(--color-brand-tint)] via-[var(--color-surface)] to-[var(--color-surface)] p-6 sm:p-8">
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[var(--color-brand)]/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-medium tracking-wide text-[var(--color-muted)]">
              {WEEKDAYS[now.getDay()]}
              {", "}
              {now.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="mt-2 text-[30px] leading-tight font-semibold tracking-tight">
              {greeting(now.getHours())}, {firstName}
            </h1>
            <p className="muted mt-2 max-w-md">
              {pending > 0
                ? `${pending} ${pending === 1 ? "работа ждёт" : "работ ждут"} проверки — это одно нажатие.`
                : "Всё проверено. Можно готовить следующее задание."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/teacher/lessons" className="btn-ghost">
              {t("teacher.newLesson")}
            </Link>
            <Link href="/teacher/assignments" className="btn-primary">
              {t("teacher.newAssignment")}
            </Link>
          </div>
        </div>
      </header>

      <div
        data-tour="stats"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Stat
          label={t("teacher.hoursSaved")}
          value={hours}
          hint={t("teacher.hoursSavedHint")}
          tone="brand"
          Icon={IconSpark}
          delay={0}
        />
        <Stat
          label={t("teacher.pendingReview")}
          value={pending}
          hint={pending > 0 ? "проверяются одной кнопкой" : "всё проверено"}
          tone={pending > 0 ? "warn" : "default"}
          Icon={IconTasks}
          delay={70}
        />
        <Stat
          label={t("teacher.activeClasses")}
          value={uniqueClasses}
          hint="закреплено за вами"
          Icon={IconPeople}
          delay={140}
        />
        <Stat
          label="Планов уроков"
          value={lessonCount}
          hint="сохранено в платформе"
          Icon={IconChart}
          delay={210}
        />
      </div>

      {/* Быстрые действия — чтобы с обзора можно было сразу начать работу */}
      <section className="mt-10">
        <SectionHeader
          title="Быстрый старт"
          subtitle="Три самых частых действия учителя"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {QUICK.map(({ href, Icon, title, text }, i) => (
            <Link
              key={href}
              href={href}
              className="animate-rise card-link group flex items-center gap-3.5"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-tint)] text-[var(--color-brand)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
                  {text}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10" data-tour="assignments">
        <SectionHeader
          title={t("teacher.myAssignments")}
          subtitle={
            assignments.length > 0
              ? "Последние шесть — с ходом проверки по каждому"
              : undefined
          }
          action={
            assignments.length > 0 ? (
              <Link
                href="/teacher/assignments"
                className="text-sm font-medium text-[var(--color-brand)] hover:underline"
              >
                Все задания →
              </Link>
            ) : undefined
          }
        />

        {assignments.length === 0 ? (
          <div className="animate-rise rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-12 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--color-brand-tint)] text-[var(--color-brand)]">
              <IconTasks className="size-6" />
            </span>
            <p className="mt-4 font-medium">Пока нет ни одного задания</p>
            <p className="muted mx-auto mt-1.5 max-w-sm">
              Создайте первое: укажите тему, и платформа предложит готовые
              задания — их останется поправить под свой класс.
            </p>
            <Link href="/teacher/assignments" className="btn-primary mt-6">
              Создать первое задание
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {assignments.map((a, i) => {
              const submitted = a.submissions.length;
              const waiting = a.submissions.filter(
                (s) => s.status === "SUBMITTED",
              ).length;
              const reviewed = a.submissions.filter(
                (s) =>
                  s.status === "AI_REVIEWED" ||
                  s.status === "TEACHER_APPROVED",
              ).length;
              const progress =
                submitted > 0 ? Math.round((reviewed / submitted) * 100) : 0;

              return (
                <Link
                  key={a.id}
                  href={`/teacher/assignments/${a.id}`}
                  className="animate-rise card-link group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium transition-colors group-hover:text-[var(--color-brand)]">
                        {a.title}
                      </p>
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

                  {submitted > 0 && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-baseline justify-between text-xs text-[var(--color-muted)]">
                        <span>Проверено</span>
                        <span className="tabular-nums">
                          {reviewed} из {submitted}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line-2)]">
                        <div
                          className="animate-grow h-full rounded-full bg-[var(--color-brand)]"
                          style={{
                            width: `${progress}%`,
                            animationDelay: `${200 + i * 60}ms`,
                          }}
                        />
                      </div>
                    </div>
                  )}

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
