"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { AiError } from "@/lib/ai/client";
import {
  analyzeClass,
  gradeSubmission,
  generateAssignment,
  type ClassInsight,
  type GeneratedTasks,
} from "@/lib/ai/tasks";
import { buildStudentHistory, formatHistory } from "@/lib/ai/history";
import { getLocale } from "@/lib/locale";

export type TaskDraft = { prompt: string; expected: string; points: number };

export type DraftState = {
  draft?: GeneratedTasks;
  error?: string;
};

/** Шаг 1: AI составляет черновик работы. Учитель его правит перед сохранением. */
export async function draftAssignment(
  _prev: DraftState,
  formData: FormData,
): Promise<DraftState> {
  const session = await requireRole("TEACHER");
  const locale = await getLocale();

  const subjectId = String(formData.get("subjectId") ?? "");
  const classId = String(formData.get("classId") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const kind = String(formData.get("kind") ?? "HOMEWORK");
  const count = Number(formData.get("count") ?? 4);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!subjectId || !classId || !topic) {
    return { error: "Заполните предмет, класс и тему." };
  }

  const [subject, klass] = await Promise.all([
    db.subject.findUnique({ where: { id: subjectId } }),
    db.classGroup.findUnique({ where: { id: classId } }),
  ]);
  if (!subject || !klass) return { error: "Предмет или класс не найден." };

  try {
    const draft = await generateAssignment({
      userId: session.userId,
      locale,
      subject: subject.name,
      grade: klass.grade,
      topic,
      kind,
      count: Math.min(Math.max(count, 1), 10),
      notes: notes || undefined,
    });
    return { draft };
  } catch (error) {
    return {
      error: error instanceof AiError ? error.message : "AI-запрос не удался.",
    };
  }
}

const createSchema = z.object({
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  topicId: z.string().optional(),
  kind: z.enum(["HOMEWORK", "QUIZ", "FORMATIVE", "SUMMATIVE"]),
  title: z.string().min(1),
  description: z.string(),
  aiGenerated: z.boolean(),
  tasks: z
    .array(
      z.object({
        prompt: z.string().min(1),
        expected: z.string(),
        points: z.number().int().min(1),
      }),
    )
    .min(1),
});

/** Шаг 2: сохранение. Задачам присваиваются стабильные id — по ним потом идёт разбор. */
export async function createAssignment(payload: unknown) {
  const session = await requireRole("TEACHER");
  const data = createSchema.parse(payload);

  const tasks = data.tasks.map((task, index) => ({
    id: `t${index + 1}`,
    ...task,
  }));

  const created = await db.assignment.create({
    data: {
      authorId: session.userId,
      subjectId: data.subjectId,
      classId: data.classId,
      topicId: data.topicId || null,
      kind: data.kind,
      title: data.title,
      description: data.description,
      tasksJson: JSON.stringify(tasks),
      maxScore: tasks.reduce((sum, task) => sum + task.points, 0),
      aiGenerated: data.aiGenerated,
    },
  });

  revalidatePath("/teacher/assignments");
  redirect(`/teacher/assignments/${created.id}`);
}

/** Проверка одной работы: сюда попадает классификация природы ошибки. */
export async function reviewSubmission(submissionId: string) {
  const session = await requireRole("TEACHER");
  const locale = await getLocale();

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: { subject: true, class: true, topic: true },
      },
    },
  });

  if (!submission || submission.assignment.authorId !== session.userId) {
    throw new Error("Работа не найдена");
  }

  const tasks = JSON.parse(submission.assignment.tasksJson) as {
    id: string;
    prompt: string;
    expected: string;
    points: number;
  }[];
  const answers = JSON.parse(submission.answersJson) as Record<string, string>;

  // Проверяем не листок, а человека: что у него уже проседало по этому
  // предмету. Без этого повторяющийся пробел неотличим от описки.
  const history = await buildStudentHistory(
    submission.studentId,
    submission.assignment.subjectId,
    submission.id,
  );

  const result = await gradeSubmission({
    userId: session.userId,
    locale,
    subject: submission.assignment.subject.name,
    grade: submission.assignment.class.grade,
    topic: submission.assignment.topic?.title ?? null,
    maxScore: submission.assignment.maxScore,
    tasks,
    answers,
    history: formatHistory(history),
  });

  await db.$transaction([
    db.finding.deleteMany({ where: { submissionId } }),
    db.submission.update({
      where: { id: submissionId },
      data: {
        status: "AI_REVIEWED",
        aiScore: result.totalScore,
        aiFeedback: result.studentFeedback,
        aiSummary: result.teacherSummary,
        reviewedAt: new Date(),
        findings: {
          create: result.findings.map((f) => ({
            taskId: f.taskId,
            nature: f.nature,
            points: f.points,
            maxPoints: tasks.find((t) => t.id === f.taskId)?.points ?? 1,
            comment: f.comment,
            concept: f.concept,
          })),
        },
      },
    }),
  ]);

  revalidatePath(`/teacher/assignments/${submission.assignmentId}`);
}

/** Пакетная проверка. Ошибка на одной работе не должна останавливать остальные. */
export async function reviewAllPending(assignmentId: string) {
  const session = await requireRole("TEACHER");

  const pending = await db.submission.findMany({
    where: {
      assignmentId,
      status: "SUBMITTED",
      assignment: { authorId: session.userId },
    },
    select: { id: true },
  });

  for (const item of pending) {
    try {
      await reviewSubmission(item.id);
    } catch {
      // Пропускаем и идём дальше — частичный результат лучше нулевого.
    }
  }

  revalidatePath(`/teacher/assignments/${assignmentId}`);
}

/** Учитель утверждает балл — AI предлагает, решение остаётся за человеком. */
export async function approveSubmission(submissionId: string, score: number) {
  const session = await requireRole("TEACHER");

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { select: { authorId: true, id: true } } },
  });
  if (!submission || submission.assignment.authorId !== session.userId) {
    throw new Error("Работа не найдена");
  }

  await db.submission.update({
    where: { id: submissionId },
    data: { status: "TEACHER_APPROVED", teacherScore: score },
  });

  revalidatePath(`/teacher/assignments/${submission.assignment.id}`);
}

export type InsightState = { insight?: ClassInsight; error?: string };

/** Слой 2 + 3: диагноз по классу и готовые действия. */
export async function buildClassInsight(
  _prev: InsightState,
  formData: FormData,
): Promise<InsightState> {
  const session = await requireRole("TEACHER");
  const locale = await getLocale();
  const assignmentId = String(formData.get("assignmentId") ?? "");

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      subject: true,
      class: true,
      topic: true,
      submissions: {
        include: { student: true, findings: true },
      },
    },
  });

  if (!assignment || assignment.authorId !== session.userId) {
    return { error: "Работа не найдена." };
  }

  const tasks = JSON.parse(assignment.tasksJson) as { id: string; prompt: string }[];

  const findings = assignment.submissions.flatMap((submission) =>
    submission.findings.map((f) => ({
      student: submission.student.fullName,
      task:
        tasks.find((t) => t.id === f.taskId)?.prompt.slice(0, 60) ?? f.taskId,
      nature: f.nature as string,
      concept: f.concept,
      points: f.points,
      maxPoints: f.maxPoints,
    })),
  );

  if (findings.length === 0) {
    return {
      error:
        "Недостаточно проверенных работ. Проверьте хотя бы одну работу через AI.",
    };
  }

  try {
    const insight = await analyzeClass({
      userId: session.userId,
      locale,
      subject: assignment.subject.name,
      className: assignment.class.name,
      topic: assignment.topic?.title ?? null,
      findings,
    });
    return { insight };
  } catch (error) {
    return {
      error: error instanceof AiError ? error.message : "AI-запрос не удался.",
    };
  }
}
