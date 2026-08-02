import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { db } from "@/lib/db";
import { NatureChip } from "@/components/ui";
import { WorkForm } from "./work-form";

export default async function StudentWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("STUDENT");
  const { t } = await getT();

  const assignment = await db.assignment.findUnique({
    where: { id },
    include: { subject: true, topic: true, class: true },
  });
  if (!assignment) notFound();

  const enrolled = await db.enrollment.findFirst({
    where: { studentId: session.userId, classId: assignment.classId },
  });
  if (!enrolled) notFound();

  const submission = await db.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId: assignment.id,
        studentId: session.userId,
      },
    },
    include: { findings: true },
  });

  const tasks = JSON.parse(assignment.tasksJson) as {
    id: string;
    prompt: string;
    points: number;
  }[];
  const answers: Record<string, string> = submission
    ? JSON.parse(submission.answersJson)
    : {};

  const locked = submission ? submission.status !== "DRAFT" : false;
  const score = submission?.teacherScore ?? submission?.aiScore;

  return (
    <div className="space-y-6">
      <header>
        <Link href="/student" className="muted text-xs hover:underline">
          ← {t("common.back")}
        </Link>
        <h1 className="h1 mt-1">{assignment.title}</h1>
        <p className="muted mt-1 text-xs">
          {assignment.subject.name}
          {assignment.topic ? ` · ${assignment.topic.title}` : ""} ·{" "}
          {assignment.maxScore} б.
        </p>
        {/* Описание сворачиваем: ученику важнее сразу увидеть задания, а не
            читать вступление. Кому нужно — раскроет. */}
        {assignment.description && (
          <details className="group mt-3">
            <summary className="cursor-pointer list-none text-xs font-medium text-[var(--color-brand)] hover:underline">
              Описание работы
              <span className="ml-1 inline-block transition-transform group-open:rotate-90">
                ›
              </span>
            </summary>
            <p className="mt-2 rounded-lg bg-[var(--color-surface)] px-4 py-3 text-sm">
              {assignment.description}
            </p>
          </details>
        )}
      </header>

      {score !== null && score !== undefined && (
        <section className="card border-[var(--color-brand)]">
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-semibold text-[var(--color-brand)]">
              {score}
              <span className="muted text-lg font-normal">
                {" "}
                / {assignment.maxScore}
              </span>
            </p>
          </div>

          {submission?.aiFeedback && (
            <div className="mt-4">
              <p className="label">{t("student.feedback")}</p>
              <p className="text-sm leading-relaxed">{submission.aiFeedback}</p>
            </div>
          )}

          {submission && submission.findings.length > 0 && (
            <ul className="mt-4 space-y-3">
              {submission.findings.map((f) => {
                const task = tasks.find((task) => task.id === f.taskId);
                const index = tasks.findIndex((task) => task.id === f.taskId);
                return (
                  <li key={f.id} className="border-t pt-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        Задание {index >= 0 ? index + 1 : f.taskId}
                      </span>
                      <NatureChip nature={f.nature} t={t} />
                      <span className="muted text-xs">
                        {f.points}/{f.maxPoints}
                        {f.concept ? ` · ${f.concept}` : ""}
                      </span>
                    </div>
                    {task && <p className="muted mt-1 text-xs">{task.prompt}</p>}
                    <p className="mt-1">{f.comment}</p>
                  </li>
                );
              })}
            </ul>
          )}

          <Link href="/student/tutor" className="btn-ghost mt-4">
            Разобрать с тьютором
          </Link>
        </section>
      )}

      <section>
        <WorkForm
          assignmentId={assignment.id}
          tasks={tasks}
          initial={answers}
          locked={locked}
          labels={{
            submit: t("student.submit"),
            submitted: t("student.submitted"),
          }}
        />
      </section>
    </div>
  );
}
