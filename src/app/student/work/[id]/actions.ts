"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { submissionAccess } from "@/lib/deadline";

/**
 * Сдача работы. Система видит процесс, а не только итог —
 * это и замыкает петлю данных: чем больше сдач, тем глубже инсайт учителя.
 */
export async function submitWork(input: {
  assignmentId: string;
  answers: Record<string, string>;
}) {
  const session = await requireRole("STUDENT");

  const assignment = await db.assignment.findUnique({
    where: { id: input.assignmentId },
    select: { id: true, classId: true, dueAt: true, latePolicy: true },
  });
  if (!assignment) throw new Error("Задание не найдено");

  const enrolled = await db.enrollment.findFirst({
    where: { studentId: session.userId, classId: assignment.classId },
  });
  if (!enrolled) throw new Error("Это задание не для вашего класса");

  // Срок проверяем и здесь, а не только на странице: кнопку легко обойти,
  // отправив запрос напрямую.
  const request = await db.lateRequest.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId: assignment.id,
        studentId: session.userId,
      },
    },
    select: { status: true },
  });

  const access = submissionAccess({
    dueAt: assignment.dueAt,
    latePolicy: assignment.latePolicy,
    requestStatus: request?.status ?? null,
  });
  if (!access.canSubmit) {
    throw new Error("Срок сдачи прошёл, отправить работу нельзя");
  }

  const answersJson = JSON.stringify(input.answers);

  await db.submission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: assignment.id,
        studentId: session.userId,
      },
    },
    create: {
      assignmentId: assignment.id,
      studentId: session.userId,
      answersJson,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    update: {
      answersJson,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  revalidatePath(`/student/work/${assignment.id}`);
  revalidatePath("/student");
}

export type LateRequestState = { error?: string; ok?: string };

/**
 * Просьба открыть сдачу после срока.
 *
 * Заявка не открывает ничего сама по себе — доступ появляется только когда
 * учитель её одобрит. Повторная отправка перезаписывает причину, но не
 * сбрасывает отказ: иначе отказ можно было бы обойти, нажав кнопку ещё раз.
 */
export async function requestLateAccess(
  _prev: LateRequestState,
  formData: FormData,
): Promise<LateRequestState> {
  const session = await requireRole("STUDENT");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (reason.length < 5) {
    return { error: "Напишите пару слов, почему не успели" };
  }
  if (reason.length > 500) {
    return { error: "Слишком длинно — до 500 символов" };
  }

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, classId: true, dueAt: true, latePolicy: true },
  });
  if (!assignment) return { error: "Задание не найдено" };
  if (assignment.latePolicy !== "REQUEST") {
    return { error: "По этой работе запросы не принимаются" };
  }

  const enrolled = await db.enrollment.findFirst({
    where: { studentId: session.userId, classId: assignment.classId },
  });
  if (!enrolled) return { error: "Это задание не для вашего класса" };

  const existing = await db.lateRequest.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId: assignment.id,
        studentId: session.userId,
      },
    },
    select: { status: true },
  });
  if (existing?.status === "DECLINED") {
    return { error: "Учитель уже отказал по этой работе" };
  }
  if (existing?.status === "APPROVED") {
    return { ok: "Доступ уже открыт — обновите страницу" };
  }

  await db.lateRequest.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: assignment.id,
        studentId: session.userId,
      },
    },
    create: { assignmentId: assignment.id, studentId: session.userId, reason },
    update: { reason },
  });

  revalidatePath(`/student/work/${assignment.id}`);
  return { ok: "Запрос отправлен учителю" };
}
