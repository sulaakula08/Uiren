import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { assignmentMastery, errorMix } from "@/lib/analytics";
import { Bar, Empty, NatureChip, Stat } from "@/components/ui";
import type { MessageKey } from "@/lib/i18n";
import { InsightPanel } from "./insight-panel";
import {
  ApproveControl,
  ReviewAllButton,
  ReviewOneButton,
} from "./review-controls";

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

  const tasks = JSON.parse(assignment.tasksJson) as {
    id: string;
    prompt: string;
    points: number;
  }[];

  const [mastery, mix] = await Promise.all([
    assignmentMastery(assignment.id),
    errorMix({ assignmentId: assignment.id }),
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Сдано работ"
          value={assignment.submissions.length}
          hint={`${pending} ждут проверки`}
          tone={pending > 0 ? "warn" : "default"}
        />
        <Stat
          label={t("insight.mastery")}
          value={`${mastery.mastery}%`}
          hint={`${mastery.earned} из ${mastery.possible} баллов`}
          tone="brand"
        />
        <Stat label="Максимум за работу" value={assignment.maxScore} />
      </div>

      {totalErrors > 0 && (
        <section className="card">
          <h2 className="h2 mb-1">{t("insight.errorMix")}</h2>
          <p className="muted mb-4 text-sm">
            Из чего складывается результат класса
          </p>
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

                    <div className="flex items-center gap-2">
                      {submission.status === "SUBMITTED" && (
                        <ReviewOneButton
                          submissionId={submission.id}
                          label={t("teacher.reviewOne")}
                        />
                      )}
                      {submission.status === "AI_REVIEWED" && (
                        <ApproveControl
                          submissionId={submission.id}
                          suggested={submission.aiScore ?? 0}
                          max={assignment.maxScore}
                          label={t("teacher.approve")}
                        />
                      )}
                    </div>
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
