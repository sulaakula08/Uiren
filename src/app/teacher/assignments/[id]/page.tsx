import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { assignmentMastery, errorMix } from "@/lib/analytics";
import { Bar, Empty, NatureChip } from "@/components/ui";
import { isJournal } from "@/lib/journal";
import type { MessageKey } from "@/lib/i18n";
import { ExportGrades } from "./export-grades";
import { InsightPanel } from "./insight-panel";
import {
  ApproveControl,
  ReviewAllButton,
  ReviewOneButton,
} from "./review-controls";
import { ReviewActions } from "./review-actions";
import { LateRequests } from "./late-requests";

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("TEACHER");
  const { t } = await getT();

  const assignment = await db.assignment.findUnique({
    where: { id },
    include: {
      subject: true,
      class: true,
      topic: true,
      submissions: {
        orderBy: { student: { fullName: "asc" } },
        include: { student: true, findings: true },
      },
    },
  });

  if (!assignment || assignment.authorId !== session.userId) notFound();

  const pendingRequests = await db.lateRequest.findMany({
    where: { assignmentId: assignment.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      reason: true,
      createdAt: true,
      student: { select: { fullName: true } },
    },
  });

  const lateRequests = pendingRequests.map((r) => ({
    id: r.id,
    reason: r.reason,
    studentName: r.student.fullName,
    createdAt: r.createdAt.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const tasks = JSON.parse(assignment.tasksJson) as {
    id: string;
    prompt: string;
    points: number;
  }[];

  const [mastery, mix, school] = await Promise.all([
    assignmentMastery(assignment.id),
    errorMix({ assignmentId: assignment.id }),
    session.schoolId
      ? db.school.findUnique({
          where: { id: session.schoolId },
          select: { journal: true },
        })
      : null,
  ]);

  const pending = assignment.submissions.filter(
    (s) => s.status === "SUBMITTED",
  ).length;
  const totalErrors = mix.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/teacher/assignments"
            className="muted text-xs hover:underline"
          >
            ← {t("nav.assignments")}
          </Link>
          <h1 className="h1 mt-1">{assignment.title}</h1>
          <p className="muted mt-1">
            {assignment.subject.name} · {assignment.class.name} ·{" "}
            {t(`assign.kind.${assignment.kind}`)}
            {assignment.topic ? ` · ${assignment.topic.title}` : ""}
          </p>
        </div>

        <ReviewAllButton
          assignmentId={assignment.id}
          pending={pending}
          label={t("teacher.reviewAll")}
        />
      </header>

      {/*
        Раньше здесь стояли три плитки, и «Усвоение темы» повторяло то же, что
        разбор ошибок ниже, только числом. Счётчики ушли в строку, а процент
        переехал в заголовок разбора — туда, где он что-то объясняет.
      */}
      <p className="muted text-sm">
        Сдано работ: {assignment.submissions.length}
        {pending > 0 && ` · ${pending} ждут проверки`} · максимум за работу{" "}
        {assignment.maxScore}
      </p>

      {totalErrors > 0 && (
        <section className="card">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="h2">{t("insight.errorMix")}</h2>
              <p className="muted mt-0.5 text-sm">
                Из чего складывается результат класса
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-[var(--color-brand)]">
                {mastery.mastery}%
              </p>
              {/* Считается по разбору заданий, а не по итоговой оценке учителя:
                  если учитель поставил свой балл, числа разойдутся, и без этой
                  подписи это выглядит как ошибка. */}
              <p className="muted text-xs">
                {mastery.earned} из {mastery.possible} по разбору AI
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {mix.map((m) => (
              <div key={m.nature}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{t(`nature.${m.nature}` as MessageKey)}</span>
                  <span className="muted text-xs">
                    {m.count} · {Math.round((m.count / totalErrors) * 100)}%
                  </span>
                </div>
                <Bar
                  percent={(m.count / totalErrors) * 100}
                  tone={
                    m.nature === "CORRECT"
                      ? "bg-[var(--color-brand)]"
                      : m.nature === "CONCEPT_GAP"
                        ? "bg-red-500"
                        : "bg-amber-400"
                  }
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <ExportGrades
        assignmentId={assignment.id}
        journal={isJournal(school?.journal) ? school.journal : "NONE"}
        graded={
          assignment.submissions.filter((s) => s.status !== "DRAFT").length
        }
      />

      <LateRequests requests={lateRequests} />

      <section>
        <h2 className="h2 mb-4">Работы учеников</h2>
        {assignment.submissions.length === 0 ? (
          <Empty text="Никто ещё не сдал работу." />
        ) : (
          <div className="space-y-3">
            {assignment.submissions.map((submission) => {
              const score = submission.teacherScore ?? submission.aiScore;
              return (
                <div key={submission.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {submission.student.fullName}
                      </p>
                      <p className="muted text-xs">
                        {t(`sub.status.${submission.status}` as MessageKey)}
                        {score !== null && score !== undefined
                          ? ` · ${score} из ${assignment.maxScore}`
                          : ""}
                      </p>
                    </div>

                    <ReviewActions
                      submissionId={submission.id}
                      status={submission.status}
                      aiScore={submission.aiScore}
                      maxScore={assignment.maxScore}
                      tasks={tasks}
                      answers={
                        JSON.parse(submission.answersJson) as Record<
                          string,
                          string
                        >
                      }
                      initialScores={Object.fromEntries(
                        submission.findings.map((f) => [f.taskId, f.points]),
                      )}
                      reviewLabel={t("teacher.reviewOne")}
                      approveLabel={t("teacher.approve")}
                    />
                  </div>

                  {submission.aiSummary && (
                    <p className="mt-3 rounded-lg bg-[var(--color-canvas)] px-3 py-2 text-sm">
                      {submission.aiSummary}
                    </p>
                  )}

                  {submission.findings.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {submission.findings.map((f) => {
                        const task = tasks.find((task) => task.id === f.taskId);
                        return (
                          <li key={f.id} className="border-t pt-2 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <NatureChip nature={f.nature} t={t} />
                              <span className="muted text-xs">
                                {f.points}/{f.maxPoints}
                                {f.concept ? ` · ${f.concept}` : ""}
                              </span>
                            </div>
                            {task && (
                              <p className="muted mt-1 text-xs">
                                {task.prompt}
                              </p>
                            )}
                            <p className="mt-1">{f.comment}</p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="border-t pt-8">
        <InsightPanel
          assignmentId={assignment.id}
          labels={{
            generate: t("insight.generate"),
            title: t("insight.title"),
            subtitle: t("insight.subtitle"),
          }}
        />
      </section>
    </div>
  );
}
