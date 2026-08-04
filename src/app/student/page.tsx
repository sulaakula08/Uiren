import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { studentGaps } from "@/lib/analytics";
import { Empty, PageHeader, SectionHeader, Stat } from "@/components/ui";
import { FamilyLinkForm } from "@/components/family-link-form";
import type { MessageKey } from "@/lib/i18n";
import { acceptParent, linkParent, unlinkParent } from "./actions";

export default async function StudentOverview() {
  const session = await requireRole("STUDENT");
  const { t, locale } = await getT();

  const enrollments = await db.enrollment.findMany({
    where: { studentId: session.userId },
    select: { classId: true },
  });
  const classIds = enrollments.map((e) => e.classId);

  const [assignments, submissions, gaps, parents] = await Promise.all([
    db.assignment.findMany({
      where: { classId: { in: classIds } },
      orderBy: { createdAt: "desc" },
      include: { subject: true, topic: true },
    }),
    db.submission.findMany({
      where: { studentId: session.userId },
      include: { assignment: true },
    }),
    studentGaps(session.userId),
    db.parentLink.findMany({
      where: { studentId: session.userId },
      orderBy: { parent: { fullName: "asc" } },
      include: { parent: { select: { fullName: true, email: true } } },
    }),
  ]);

  // Запросы от родителей подтверждает сам ученик: это его оценки, и решение
  // о доступе к ним не может приниматься по одному лишь знанию почты.
  const acceptedParents = parents.filter((l) => l.status === "ACCEPTED");
  const parentRequests = parents.filter(
    (l) => l.status === "PENDING" && l.requestedById !== session.userId,
  );
  const sentRequests = parents.filter(
    (l) => l.status === "PENDING" && l.requestedById === session.userId,
  );

  const byAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));
  const todo = assignments.filter((a) => {
    const submission = byAssignment.get(a.id);
    return !submission || submission.status === "DRAFT";
  });

  const graded = submissions.filter(
    (s) => s.teacherScore !== null || s.aiScore !== null,
  );
  const average =
    graded.length === 0
      ? 0
      : Math.round(
          (graded.reduce(
            (sum, s) =>
              sum +
              ((s.teacherScore ?? s.aiScore ?? 0) / s.assignment.maxScore) * 100,
            0,
          ) /
            graded.length) *
            10,
        ) / 10;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${t("st.greeting")}, ${session.fullName.split(" ")[0]}`}
        subtitle={t("st.subtitle")}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label={t("st.toSubmit")}
          value={todo.length}
          tone={todo.length > 0 ? "warn" : "default"}
        />
        <Stat label={t("st.average")} value={`${average}%`} tone="brand" />
        <Stat label={t("st.gapTopics")} value={gaps.length} />
      </div>

      <section data-tour="work">
        <SectionHeader title={t("student.myWork")} />
        {assignments.length === 0 ? (
          <Empty text={t("st.noWork")} />
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const submission = byAssignment.get(a.id);
              const score = submission?.teacherScore ?? submission?.aiScore;

              return (
                <Link
                  key={a.id}
                  href={`/student/work/${a.id}`}
                  className="card-link flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{a.title}</p>
                    <p className="muted mt-0.5 text-xs">
                      {a.subject.name}
                      {a.topic ? ` · ${a.topic.title}` : ""}
                      {a.dueAt
                        ? ` · ${t("st.due")} ${a.dueAt.toLocaleDateString(locale === "kk" ? "kk-KZ" : "ru-RU")}`
                        : ""}
                    </p>
                  </div>

                  <div className="text-right">
                    {score !== null && score !== undefined ? (
                      <p className="text-lg font-semibold text-[var(--color-brand)]">
                        {score}
                        <span className="muted text-sm font-normal">
                          {" "}
                          / {a.maxScore}
                        </span>
                      </p>
                    ) : (
                      <span className="chip bg-amber-50 text-amber-800">
                        {submission
                          ? t(`sub.status.${submission.status}` as MessageKey)
                          : t("st.notSubmitted")}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section data-tour="gaps">
        <SectionHeader
          title={t("student.gaps")}
          subtitle={t("st.gapsSubtitle")}
        />
        {gaps.length === 0 ? (
          <Empty text={t("st.noGaps")} />
        ) : (
          <div className="card">
            <ul className="space-y-2">
              {gaps.slice(0, 8).map((gap) => (
                <li
                  key={gap.concept}
                  className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <span className="font-medium">{gap.concept}</span>
                  <span className="muted text-xs">
                    {gap.count} раз ·{" "}
                    {t(`nature.${gap.nature}` as MessageKey)}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/student/tutor" className="btn-primary mt-4 w-full">
              {t("student.askTutor")}
            </Link>
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title={t("st.parents")}
          subtitle={t("st.parentsSubtitle")}
        />

        {parentRequests.length > 0 && (
          <div className="animate-pop mb-4 rounded-2xl border border-[var(--color-warn)]/25 bg-[var(--color-warn-tint)] p-4">
            <p className="text-sm font-medium text-[var(--color-warn)]">
              Кто-то просит доступ к вашей успеваемости
            </p>
            <p className="mt-0.5 mb-3 text-xs text-[var(--color-warn)]/85">
              Подтверждайте, только если это действительно ваш родитель. Пока вы
              не подтвердили, он не видит ни оценок, ни пробелов.
            </p>
            <div className="space-y-2">
              {parentRequests.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--color-surface)] px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {link.parent.fullName}
                    </p>
                    <p className="muted text-xs">{link.parent.email}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={acceptParent}>
                      <input type="hidden" name="linkId" value={link.id} />
                      <button
                        type="submit"
                        className="btn-primary px-3 py-1.5 text-xs"
                      >
                        Подтвердить
                      </button>
                    </form>
                    <form action={unlinkParent}>
                      <input type="hidden" name="linkId" value={link.id} />
                      <button
                        type="submit"
                        className="btn-danger px-3 py-1.5 text-xs"
                      >
                        Отклонить
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {acceptedParents.length > 0 && (
          <div className="card mb-4 space-y-2">
            {acceptedParents.map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {link.parent.fullName}
                  </p>
                  <p className="muted text-xs">{link.parent.email}</p>
                </div>
                <form action={unlinkParent}>
                  <input type="hidden" name="linkId" value={link.id} />
                  <button
                    type="submit"
                    className="btn-danger px-3 py-1.5 text-xs"
                  >
                    Отвязать
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {sentRequests.length > 0 && (
          <div className="card mb-4 space-y-2">
            {sentRequests.map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {link.parent.fullName}
                  </p>
                  <p className="muted text-xs">
                    {link.parent.email} · ждём подтверждения
                  </p>
                </div>
                <form action={unlinkParent}>
                  <input type="hidden" name="linkId" value={link.id} />
                  <button
                    type="submit"
                    className="btn-ghost px-3 py-1.5 text-xs"
                  >
                    Отозвать
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <FamilyLinkForm
          action={linkParent}
          name="parentEmail"
          label={t("st.parentEmail")}
          placeholder="родитель@mail.kz"
          hint={t("st.parentHint")}
          submitLabel={t("st.connect")}
        />
      </section>
    </div>
  );
}
